-- =============================================================================
-- Sample customers and orders for the demo
--
-- Adds 12 fictional customers and 26 orders (32 items) spread over the last
-- three months: some delivered, some waiting for delivery, some overdue, and
-- the rest at every production stage with partly completed QC checklists.
-- Dates are relative to the day you run it.
--
-- Needs at least one sofa and one bed in the catalogue; QC checks are optional.
-- Run once in the Supabase SQL Editor. Running it again is refused while the
-- sample customers (emails ending @example.com) exist; the removal script is
-- at the bottom.
-- =============================================================================

do $$
declare
  v_sofas     integer[];
  v_beds      integer[];
  v_customers integer[];
  v_admin     uuid;
  v_today     date := public.business_today();
  v_spec      record;
  v_order_id  integer;
  v_last_no   integer := 0;
  v_item_id   integer;
  v_ordered   timestamptz;
  v_due       date;
  v_delivered date;
  v_end       timestamptz;
  v_done      smallint[];
  -- Stages finish in this order (1 and 2 run in parallel; see stage_dependencies).
  c_finish    constant smallint[] := array[2, 3, 1, 4, 5, 6];
begin
  if exists (select 1 from public.customer_details where email like '%@example.com') then
    raise exception 'Sample data is already loaded (customers with @example.com emails exist).';
  end if;

  select array_agg(id order by id) into v_sofas from public.sofa_products;
  select array_agg(id order by id) into v_beds  from public.bed_products;
  if v_sofas is null or v_beds is null then
    raise exception 'Add at least one sofa and one bed to the catalogue first.';
  end if;

  select id into v_admin from public.profiles where role = 'admin' order by created_at limit 1;

  with ins as (
    insert into public.customer_details (
      customer_name, company, email, mobile_number, address, customer_type, pi_number, floor_number,
      main_door_width, main_door_height, elevator_width, elevator_depth,
      living_room_door_width, living_room_door_depth, furniture_required_width, furniture_required_depth
    ) values
      ('Ananya Krishnan',  null,                     'ananya.k@example.com',      '+91 98400 10001', '14, 2nd Cross Street, Besant Nagar, Chennai 600090',        'b2c',             'PI-1001', '3',  36, 84, 42, 54, 34, 6, 84, 36),
      ('Rahul Mehta',      null,                     'rahul.mehta@example.com',   '+91 98400 10002', 'Flat 902, Prestige Lakeside, Whitefield, Bengaluru 560066', 'b2c',             'PI-1002', '9',  38, 84, 44, 60, 36, 6, 96, 38),
      ('Priya Raman',      'Raman Interiors',        'studio@ramaninteriors.example.com', '+91 98400 10003', '22, Khader Nawaz Khan Road, Nungambakkam, Chennai 600006', 'interior design', 'PI-1003', '1',  40, 90, null, null, 38, 6, 110, 64),
      ('Vikram Shah',      'Shah & Associates',      'vikram@shaharchitects.example.com', '+91 98400 10004', '5th Floor, Brigade Towers, MG Road, Bengaluru 560001', 'architecture',    'PI-1004', '5',  42, 90, 48, 66, 40, 6, 118, 118),
      ('Meera Iyer',       null,                     'meera.iyer@example.com',    '+91 98400 10005', '7, Lake View Road, Kodaikanal 624101',                       'b2c',             'PI-1005', 'G',  36, 84, null, null, 34, 6, 88, 38),
      ('Arjun Reddy',      null,                     'arjun.reddy@example.com',   '+91 98400 10006', 'Villa 18, Jubilee Hills, Hyderabad 500033',                  'b2c',             'PI-1006', 'G',  44, 96, null, null, 42, 6, 124, 124),
      ('The Grand Orchid', 'Orchid Hospitality Pvt Ltd', 'procurement@grandorchid.example.com', '+91 98400 10007', '88, ECR Road, Mahabalipuram 603104',   'b2b',             'PI-1007', '2',  48, 96, 54, 72, 46, 7, 124, 124),
      ('Sneha Kapoor',     null,                     'sneha.kapoor@example.com',  '+91 98400 10008', 'A-1204, DLF Park Place, Gurugram 122002',                    'b2c',             'PI-1008', '12', 36, 84, 42, 54, 34, 6, 90, 40),
      ('Karthik Subramanian', 'Habitat Design Studio', 'karthik@habitatstudio.example.com', '+91 98400 10009', '31, Kasturba Road, Bengaluru 560001',   'interior design', 'PI-1009', '4',  40, 90, 46, 60, 38, 6, 112, 70),
      ('Fatima Sheikh',    null,                     'fatima.sheikh@example.com', '+91 98400 10010', '3, Carter Road, Bandra West, Mumbai 400050',                'b2c',             'PI-1010', '7',  36, 84, 40, 52, 34, 6, 86, 38),
      ('Cozy Living Co.',  'Cozy Living Retail LLP', 'orders@cozyliving.example.com', '+91 98400 10011', 'Unit 4, Ambattur Industrial Estate, Chennai 600058',   'b2b',             'PI-1011', 'G',  60, 108, null, null, 60, 8, 124, 124),
      ('Rohan Desai',      'Desai Architects',       'rohan@desaiarchitects.example.com', '+91 98400 10012', '12, Koregaon Park Lane 6, Pune 411001',       'architecture',    'PI-1012', '2',  42, 90, 48, 66, 40, 6, 110, 90)
    returning id
  )
  select array_agg(id order by id) into v_customers from ins;

  for v_spec in
    select s.*, count(*) over (partition by s.order_no) as items
    from (values
      -- order, customer, days ago, type, product, due in (days), progress, priority, quantity
      --   progress: 0 = just started … 5 = packing, 6 = ready for delivery, 7 = delivered
      ( 1,  1, 85, 'sofa',  1, -40, 7, 1, 1),
      ( 2,  2, 78, 'bed',   1, -35, 7, 1, 1),
      ( 3,  3, 70, 'sofa',  4, -28, 7, 2, 1),
      ( 3,  3, 70, 'sofa',  5, -28, 7, 2, 1),
      ( 4,  4, 62, 'bed',   5, -20, 7, 1, 2),
      ( 5,  5, 55, 'sofa',  7, -14, 7, 0, 1),
      ( 6,  6, 48, 'sofa', 14,  -9, 7, 3, 1),
      ( 7,  7, 44, 'bed',   9,  -6, 7, 1, 4),
      ( 8,  8, 40, 'sofa', 17,  -4, 6, 2, 1),
      ( 9,  9, 36, 'sofa', 20,  -2, 5, 3, 1),
      (10, 10, 33, 'bed',  10,  -1, 4, 2, 1),
      (11,  1, 30, 'sofa',  2,   3, 6, 1, 1),
      (12, 11, 28, 'sofa', 12,   5, 5, 1, 3),
      (12, 11, 28, 'bed',   3,   5, 4, 1, 3),
      (13, 12, 26, 'sofa', 13,  -3, 3, 3, 1),
      (14, 12, 25, 'sofa', 19,   8, 4, 2, 1),
      (15,  2, 22, 'bed',  13,  10, 3, 1, 1),
      (16,  3, 20, 'sofa',  9,  12, 3, 0, 1),
      (17,  5, 18, 'sofa', 22,  14, 2, 1, 1),
      (17,  5, 18, 'sofa',  3,  14, 2, 1, 2),
      (18,  6, 15, 'bed',  16,  17, 2, 2, 1),
      (19,  8, 13, 'sofa', 10,  19, 1, 1, 1),
      (20,  4, 11, 'sofa', 15,  21, 1, 3, 1),
      (21,  9,  9, 'bed',   6,  24, 1, 1, 1),
      (22,  7,  7, 'sofa',  6,  26, 0, 1, 2),
      (22,  7,  7, 'bed',   7,  26, 0, 1, 2),
      (23, 10,  5, 'sofa', 11,  28, 0, 2, 1),
      (24, 12,  3, 'sofa', 18,  30, 0, 1, 1),
      (25, 11,  2, 'bed',  12,  32, 0, 0, 1),
      (26,  1,  1, 'sofa', 21,  35, 0, 1, 1),
      (26,  1,  1, 'bed',  14,  35, 0, 1, 1),
      (26,  1,  1, 'bed',   2,  35, 0, 1, 1)
    ) as s(order_no, customer, days_ago, product_type, product, due_in, progress, priority, quantity)
    order by order_no
  loop
    v_ordered := now() - make_interval(days => v_spec.days_ago, hours => (v_spec.order_no * 7) % 9);
    v_due     := v_today + v_spec.due_in;

    if v_spec.order_no <> v_last_no then
      insert into public.orders (customer_id, total_products, order_date, created_by)
      values (
        v_customers[v_spec.customer],
        v_spec.items,
        v_ordered,
        v_admin
      )
      returning id into v_order_id;
      v_last_no := v_spec.order_no;
    end if;

    -- Delivered items arrive within a couple of days of their due date, never in the future.
    v_delivered := case when v_spec.progress = 7
                        then least(v_due + ((v_spec.order_no % 5) - 2), v_today) end;
    v_end  := coalesce(v_delivered::timestamptz, now());
    v_done := c_finish[1:least(v_spec.progress, 6)];

    insert into public.order_items (
      order_id, product_type, sofa_product_id, bed_product_id, quantity, due_date, delivery_date, priority, created_at
    ) values (
      v_order_id,
      v_spec.product_type,
      case when v_spec.product_type = 'sofa' then v_sofas[1 + (v_spec.product - 1) % cardinality(v_sofas)] end,
      case when v_spec.product_type = 'bed'  then v_beds [1 + (v_spec.product - 1) % cardinality(v_beds)]  end,
      v_spec.quantity, v_due, v_delivered, v_spec.priority, v_ordered
    )
    returning id into v_item_id;

    -- Stage rows: finished stages are completed, stages whose prerequisites are all finished are active.
    insert into public.order_item_stage_status (order_item_id, stage_id, status, completed_at, completed_by, created_at, updated_at)
    select v_item_id,
           s.stage_id,
           st.status,
           st.completed_at,
           case when st.status = 'completed' then v_admin end,
           v_ordered,
           coalesce(st.completed_at, v_ordered)
    from public.stages s
    cross join lateral (
      select
        case
          when s.stage_id = any (v_done) then 'completed'::public.stage_status
          when not exists (
            select 1 from public.stage_dependencies d
            where d.stage_id = s.stage_id and not (d.depends_on_stage_id = any (v_done))
          ) then 'active'::public.stage_status
          else 'pending'::public.stage_status
        end as status,
        case when s.stage_id = any (v_done)
             then v_ordered + (v_end - v_ordered) * array_position(c_finish, s.stage_id) / 7.0
        end as completed_at
    ) st;

    -- Checklists: everything passed for finished stages; active stages are part-way through,
    -- and every fourth item has a failed check waiting for rework.
    insert into public.product_checklist_progress (order_item_id, check_id, status, failure_report, inspected_by, updated_at)
    select v_item_id,
           c.check_id,
           x.status,
           case when x.status = 'failed' then 'Defect found during inspection; sent back for rework.' end,
           case when x.status <> 'pending' then v_admin end,
           case when x.status <> 'pending' then coalesce(oiss.completed_at, now() - interval '1 day') end
    from public.checks c
    join public.order_item_stage_status oiss
      on oiss.order_item_id = v_item_id and oiss.stage_id = c.stage_id and oiss.status in ('active', 'completed')
    cross join lateral (
      select count(*) as total,
             count(*) filter (where c2.sequence < c.sequence or (c2.sequence = c.sequence and c2.check_id <= c.check_id)) as position
      from public.checks c2
      where c2.stage_id = c.stage_id and c2.is_active
    ) n
    cross join lateral (
      select case
        when oiss.status = 'completed' then 'passed'::public.check_status
        when v_spec.progress = 0 then 'pending'::public.check_status
        when n.position <= n.total / 2 then 'passed'::public.check_status
        when n.position = n.total / 2 + 1 and v_item_id % 4 = 0 then 'failed'::public.check_status
        else 'pending'::public.check_status
      end as status
    ) x
    where c.is_active;
  end loop;

  -- Keep the "times ordered" counters in step with the new orders.
  update public.sofa_products p
     set purchase_count = p.purchase_count + t.n
    from (select sofa_product_id as id, count(*) as n from public.order_items oi
          join public.orders o on o.id = oi.order_id
          where o.customer_id = any (v_customers) and sofa_product_id is not null group by 1) t
   where p.id = t.id;
  update public.bed_products p
     set purchase_count = p.purchase_count + t.n
    from (select bed_product_id as id, count(*) as n from public.order_items oi
          join public.orders o on o.id = oi.order_id
          where o.customer_id = any (v_customers) and bed_product_id is not null group by 1) t
   where p.id = t.id;
end;
$$;


-- =============================================================================
-- To remove the sample data again (orders cascade to their items, stages and
-- checklists; the products' "times ordered" counters are not wound back):
--
--   delete from public.orders
--    where customer_id in (select id from public.customer_details where email like '%@example.com');
--   delete from public.customer_details where email like '%@example.com';
-- =============================================================================
