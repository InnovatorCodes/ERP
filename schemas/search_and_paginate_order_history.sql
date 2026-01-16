CREATE OR REPLACE FUNCTION search_and_paginate_order_history_v2(
    p_search_term TEXT,
    p_limit INT,
    p_offset INT,
    p_filters JSONB,
    p_sort JSONB
)
RETURNS TABLE (
    id int,
    due_date TIMESTAMPTZ,
    delivery_date TIMESTAMPTZ,
    production_stage TEXT,
    product_type TEXT,
    model_name TEXT,
    order_date TIMESTAMPTZ,
    customer_name TEXT,
    address TEXT,
    total_count BIGINT
)
AS $$
DECLARE
    sort_key TEXT;
    sort_direction TEXT;
    status_filter TEXT;
    date_from DATE;
    date_to DATE;
BEGIN
    -- Extract sort parameters
    sort_key := p_sort->>'by';
    sort_direction := p_sort->>'dir';

    -- Extract filter parameters
    status_filter := p_filters->>'status';
    date_from := (p_filters->>'date_from')::DATE;
    date_to := (p_filters->>'date_to')::DATE;

    RETURN QUERY
    WITH filtered_orders AS (
      SELECT
        oi.id,
        oi.due_date::TIMESTAMPTZ,
        oi.delivery_date::TIMESTAMPTZ,
        -- MODIFIED: Production stage is always 'Delivered' now.
        'Delivered' as production_stage,
        oi.product_type,
        COALESCE(sp.model_name, bp.model_name) AS model_name,
        o.order_date::TIMESTAMPTZ,
        cd.customer_name,
        cd.address
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
        -- ADDED: This is the main condition to only include delivered orders.
        oi.delivery_date IS NOT NULL
        AND
        (p_search_term IS NULL OR p_search_term = '' OR
          (
            oi.id::text ILIKE ('%' || p_search_term || '%') OR
            cd.customer_name ILIKE ('%' || p_search_term || '%') OR
            sp.model_name ILIKE ('%' || p_search_term || '%') OR
            bp.model_name ILIKE ('%' || p_search_term || '%')
          )
        )
        AND (
            -- MODIFIED: Simplified the status filter as only 'Delivered' is relevant.
            status_filter IS NULL OR status_filter = '' OR status_filter = 'Delivered'
        )
        AND (date_from IS NULL OR oi.delivery_date >= date_from)
        AND (date_to IS NULL OR oi.delivery_date <= date_to)
    )
    SELECT
      *,
      (SELECT COUNT(*) FROM filtered_orders) AS total_count
    FROM
      filtered_orders
    ORDER BY
      CASE
        WHEN sort_key = 'dueDate' AND sort_direction = 'asc' THEN filtered_orders.due_date END ASC,
      CASE
        WHEN sort_key = 'dueDate' AND sort_direction = 'desc' THEN filtered_orders.due_date END DESC,
      CASE
        WHEN sort_key = 'orderDate' AND sort_direction = 'asc' THEN filtered_orders.order_date END ASC,
      CASE
        WHEN sort_key = 'orderDate' AND sort_direction = 'desc' THEN filtered_orders.order_date END DESC,
      CASE
        WHEN sort_key = 'deliveryDate' AND sort_direction = 'asc' THEN filtered_orders.delivery_date END ASC,
      CASE
        WHEN sort_key = 'deliveryDate' AND sort_direction = 'desc' THEN filtered_orders.delivery_date END DESC
    LIMIT
      p_limit
    OFFSET
      p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_and_paginate_order_history_v2(TEXT, INT, INT, JSONB, JSONB) TO public;