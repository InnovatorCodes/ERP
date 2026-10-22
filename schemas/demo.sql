-- =============================================================================
-- Read-only demo account for an existing database
--
-- Adds the "demo" role: it can read every screen but every write is refused,
-- because no policy, storage rule or write function lists it. The demo
-- account's email and password are locked so visitors can't take it over.
--
-- New databases built from database.sql already include all of this; run
-- this file only on a database created before the demo role existed.
--
-- Run in the Supabase SQL Editor in two steps: PART 1 on its own first
-- (Postgres can't use a new enum value in the same transaction that adds it),
-- then PART 2.
-- =============================================================================


-- ---------------------------------------------------------------- PART 1 ----
alter type public.user_role add value if not exists 'demo';


-- ---------------------------------------------------------------- PART 2 ----
begin;

-- Profiles stay private to admins (this also undoes an earlier version of this
-- file that let the demo account read them directly).
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.has_role('admin')));

-- The Employees list for admins and the demo account, with emails masked for the demo.
create or replace function public.list_employees()
returns table (id uuid, email text, full_name text, role public.user_role)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.assert_role('admin', 'demo');

  return query
  select p.id,
         case
           when p.email is null or public.has_role('admin') or p.id = auth.uid() then p.email
           else left(p.email, 1) || '•••@' || left(split_part(p.email, '@', 2), 1) || '•••'
         end,
         p.full_name,
         p.role
  from public.profiles p
  order by p.full_name nulls last, p.email;
end;
$$;

grant execute on function public.list_employees() to authenticated;

-- Visitors share one login: stop anyone changing its email, phone or password.
create or replace function public.protect_demo_account()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.profiles where id = old.id and role = 'demo')
     and (new.email is distinct from old.email
          or new.phone is distinct from old.phone
          or new.encrypted_password is distinct from old.encrypted_password) then
    raise exception 'The demo account cannot be changed.';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_protect_demo on auth.users;
create trigger on_auth_user_protect_demo
  before update on auth.users
  for each row execute function public.protect_demo_account();

-- Read-only functions that check roles themselves: let the demo role call them.
create or replace function public.search_and_paginate_order_history_v2(
  p_search_term text,
  p_limit       integer,
  p_offset      integer,
  p_filters     jsonb,
  p_sort        jsonb
)
returns table (
  id                integer,
  due_date          timestamptz,
  delivery_date     timestamptz,
  production_stage  text,
  product_type      text,
  model_name        text,
  order_date        timestamptz,
  customer_name     text,
  address           text,
  total_count       bigint
)
language plpgsql stable set search_path = ''
as $$
declare
  v_sort_key      text := coalesce(p_sort ->> 'by', 'deliveryDate');
  v_sort_dir      text := coalesce(p_sort ->> 'dir', 'desc');
  v_status_filter text := nullif(p_filters ->> 'status', '');
  v_date_from     date := nullif(p_filters ->> 'date_from', '')::date;
  v_date_to       date := nullif(p_filters ->> 'date_to', '')::date;
begin
  perform public.assert_role('admin', 'manager', 'demo');

  return query
  select
    oi.id,
    oi.due_date::timestamptz,
    oi.delivery_date::timestamptz,
    'Delivered'::text,
    oi.product_type,
    coalesce(sp.model_name, bp.model_name),
    o.order_date,
    cd.customer_name,
    cd.address,
    count(*) over ()
  from public.order_items oi
  join public.orders o            on o.id = oi.order_id
  join public.customer_details cd on cd.id = o.customer_id
  left join public.sofa_products sp on sp.id = oi.sofa_product_id
  left join public.bed_products  bp on bp.id = oi.bed_product_id
  where oi.delivery_date is not null
    and (v_status_filter is null or v_status_filter = 'Delivered')
    and (coalesce(p_search_term, '') = ''
      or oi.id::text      ilike '%' || p_search_term || '%'
      or cd.customer_name ilike '%' || p_search_term || '%'
      or sp.model_name    ilike '%' || p_search_term || '%'
      or bp.model_name    ilike '%' || p_search_term || '%')
    and (v_date_from is null or oi.delivery_date >= v_date_from)
    and (v_date_to   is null or oi.delivery_date <= v_date_to)
  order by
    case when v_sort_key = 'dueDate'      and v_sort_dir = 'asc'  then oi.due_date end asc,
    case when v_sort_key = 'dueDate'      and v_sort_dir = 'desc' then oi.due_date end desc,
    case when v_sort_key = 'orderDate'    and v_sort_dir = 'asc'  then o.order_date end asc,
    case when v_sort_key = 'orderDate'    and v_sort_dir = 'desc' then o.order_date end desc,
    case when v_sort_key = 'deliveryDate' and v_sort_dir = 'asc'  then oi.delivery_date end asc,
    case when v_sort_key = 'deliveryDate' and v_sort_dir = 'desc' then oi.delivery_date end desc,
    oi.id desc
  limit least(greatest(coalesce(p_limit, 12), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

create or replace function public.get_dashboard_stats()
returns jsonb
language plpgsql stable set search_path = ''
as $$
declare
  v_today date := public.business_today();
  v_result jsonb;
begin
  perform public.assert_role('admin', 'manager', 'demo');

  select jsonb_build_object(
    'total_orders',           (select count(*) from public.order_items),
    'orders_in_production',   (select count(*) from public.order_items where delivery_date is null),
    'completed_orders_month', (select count(*) from public.order_items where delivery_date >= v_today - 30),
    'overdue_orders',         (select count(*) from public.order_items where delivery_date is null and due_date < v_today),
    'production_pipeline',    (
      select jsonb_object_agg(t.name, t.cnt)
      from (
        select s.name, count(distinct oi.id) as cnt
        from public.order_items oi
        join public.order_item_stage_status oiss on oiss.order_item_id = oi.id and oiss.status = 'active'
        join public.stages s on s.stage_id = oiss.stage_id
        where oi.delivery_date is null
        group by s.name
      ) t
    ),
    'production_chart', (
      select jsonb_agg(t order by t.date)
      from (
        select (o.order_date at time zone 'Asia/Kolkata')::date as date, count(oi.id) as count
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        where o.order_date >= now() - interval '30 days'
        group by 1
      ) t
    ),
    'recent_orders', (
      select jsonb_agg(t)
      from (
        select
          oi.id,
          cd.customer_name,
          coalesce(sp.model_name, bp.model_name) as product_name,
          coalesce((
            select jsonb_agg(s.code order by s.sort_order)
            from public.order_item_stage_status oiss
            join public.stages s on s.stage_id = oiss.stage_id
            where oiss.order_item_id = oi.id and oiss.status = 'active'
          ), '[]'::jsonb) as active_stages,
          oi.due_date
        from public.order_items oi
        join public.orders o            on o.id = oi.order_id
        join public.customer_details cd on cd.id = o.customer_id
        left join public.sofa_products sp on sp.id = oi.sofa_product_id
        left join public.bed_products  bp on bp.id = oi.bed_product_id
        order by o.order_date desc, oi.id desc
        limit 5
      ) t
    )
  ) into v_result;

  return v_result;
end;
$$;

commit;


-- =============================================================================
-- AFTER RUNNING: create the demo user
--   1. Dashboard → Authentication → Users → "Add user" → "Create new user",
--      e.g. demo@example.com with a password, and tick "Auto Confirm User".
--   2. Run (replace the email if you used another):
--
--      update auth.users
--         set raw_app_meta_data = raw_app_meta_data || '{"role":"demo"}'
--       where email = 'demo@example.com';
--
--      insert into public.profiles (id, email, full_name, role)
--      select id, email, 'Demo Visitor', 'demo' from auth.users where email = 'demo@example.com'
--      on conflict (id) do update set role = 'demo';
--
--   3. Set NEXT_PUBLIC_DEMO_EMAIL and NEXT_PUBLIC_DEMO_PASSWORD in Vercel (and
--      .env.local) to show the "Try the demo" button on the login page.
--
-- To change the demo password later, drop the lock, change it, and recreate it:
--      drop trigger on_auth_user_protect_demo on auth.users;
--      -- change the password in Authentication → Users
--      create trigger on_auth_user_protect_demo before update on auth.users
--        for each row execute function public.protect_demo_account();
-- =============================================================================
