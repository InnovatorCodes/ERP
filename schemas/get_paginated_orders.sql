-- This command creates or replaces the function 'get_paginated_orders'.
-- It's designed to be run directly in the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.get_paginated_orders(
    p_search_term TEXT,
    p_filters JSONB,
    p_sort JSONB,
    p_limit INT,
    p_offset INT
)
RETURNS TABLE(
    id INT,
    due_date DATE,
    production_stage TEXT,
    priority INT,
    customer_name TEXT,
    product_model_name TEXT,
    product_id INT,
    product_type TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    sort_key TEXT;
    sort_direction TEXT;
    priority_keys TEXT[];
    stage_keys TEXT[];
    is_overdue BOOLEAN;
BEGIN
    -- Extract sort parameters
    sort_key := p_sort->>'key';
    sort_direction := p_sort->>'direction';

    -- Extract filter parameters
    stage_keys := ARRAY(SELECT key FROM jsonb_each_text(p_filters->'stage') WHERE value::boolean);
    priority_keys := ARRAY(SELECT key FROM jsonb_each_text(p_filters->'priority') WHERE value::boolean);
    is_overdue := (p_filters->'overdue'->>'true')::boolean;

    RETURN QUERY
    WITH filtered_orders AS (
      SELECT
        oi.id,
        oi.due_date,
        oi.priority,
        oi.product_type,
        cd.customer_name,
        COALESCE(sp.model_name, bp.model_name) AS product_model_name,
        COALESCE(oi.sofa_product_id, oi.bed_product_id) AS product_id,
        oi.delivery_date
      FROM
        public.order_items AS oi
      LEFT JOIN
        public.orders AS o ON oi.order_id = o.id
      LEFT JOIN
        public.customer_details AS cd ON o.customer_id = cd.id
      LEFT JOIN
        public.sofa_products AS sp ON oi.sofa_product_id = sp.id
      LEFT JOIN
        public.bed_products AS bp ON oi.bed_product_id = bp.id
      WHERE
        (p_search_term IS NULL OR p_search_term = '' OR
          (
            oi.id::text ILIKE ('%' || p_search_term || '%') OR
            cd.customer_name ILIKE ('%' || p_search_term || '%') OR
            sp.model_name ILIKE ('%' || p_search_term || '%') OR
            bp.model_name ILIKE ('%' || p_search_term || '%')
          )
        )
        AND (
          array_length(stage_keys, 1) IS NULL OR
          EXISTS (
              SELECT 1
              FROM public.order_item_stage_status oiss
              JOIN public.stages s ON oiss.stage_id = s.stage_id
              WHERE oiss.order_item_id = oi.id
                AND oiss.status = 'active'
                AND s.name = ANY(stage_keys)
          )
        )
        AND (array_length(priority_keys, 1) IS NULL OR oi.priority::TEXT = ANY(priority_keys))
        AND (is_overdue IS NOT TRUE OR oi.due_date < CURRENT_DATE)
    ),
    paginated_orders AS (
        SELECT *
        FROM filtered_orders
        ORDER BY
          CASE
            WHEN sort_key = 'priority' AND sort_direction = 'asc' THEN filtered_orders.priority END ASC,
          CASE
            WHEN sort_key = 'priority' AND sort_direction = 'desc' THEN filtered_orders.priority END DESC,
          CASE
            WHEN sort_key = 'dueDate' AND sort_direction = 'asc' THEN filtered_orders.due_date END ASC,
          CASE
            WHEN sort_key = 'dueDate' AND sort_direction = 'desc' THEN filtered_orders.due_date END DESC,
          CASE
            WHEN sort_key = 'id' AND sort_direction = 'asc' THEN filtered_orders.id END ASC,
          CASE
            WHEN sort_key = 'id' AND sort_direction = 'desc' THEN filtered_orders.id END DESC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT
      po.id,
      po.due_date,
      CASE
        -- If delivery date is present and no stages are recorded, it's delivered.
        WHEN po.delivery_date IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM public.order_item_stage_status WHERE order_item_id = po.id
        ) THEN 'delivered'
        
        -- If no delivery date, no active stages, and all are completed, it's out for delivery.
        WHEN po.delivery_date IS NULL 
             AND NOT EXISTS (SELECT 1 FROM public.order_item_stage_status WHERE order_item_id = po.id AND status = 'active')
             AND (SELECT COUNT(*) FROM public.order_item_stage_status WHERE order_item_id = po.id) > 0
             AND (SELECT COUNT(*) FROM public.order_item_stage_status WHERE order_item_id = po.id AND status = 'completed') = (SELECT COUNT(*) FROM public.order_item_stage_status WHERE order_item_id = po.id)
        THEN 'out_for_delivery'
        
        -- Default behavior: show active stages or 'delivered'
        ELSE COALESCE(
          (SELECT string_agg(s.name, ', ')
           FROM public.order_item_stage_status oiss
           JOIN public.stages s ON oiss.stage_id = s.stage_id
           WHERE oiss.order_item_id = po.id AND oiss.status = 'active'
          ),
          'delivered'
        )
      END AS production_stage,
      po.priority,
      po.customer_name,
      po.product_model_name,
      po.product_id,
      po.product_type,
      (SELECT COUNT(*) FROM filtered_orders) AS total_count
    FROM
      paginated_orders po;
END;
$$;
