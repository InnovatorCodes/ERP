CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB
AS $$
DECLARE
    total_orders BIGINT;
    orders_in_production BIGINT;
    completed_orders_month BIGINT;
    overdue_orders BIGINT;
    production_pipeline JSONB;
    production_chart JSONB;
    recent_orders JSONB;
BEGIN
    -- KPIs
    SELECT COUNT(*) INTO total_orders FROM public.order_items;
    SELECT COUNT(*) INTO orders_in_production FROM public.order_items WHERE delivery_date IS NULL;
    SELECT COUNT(*) INTO completed_orders_month FROM public.order_items WHERE delivery_date >= NOW() - INTERVAL '30 days';
    SELECT COUNT(*) INTO overdue_orders FROM public.order_items WHERE due_date < NOW() AND delivery_date IS NULL;

    -- Production Pipeline
    SELECT jsonb_object_agg(name, count)
    INTO production_pipeline
    FROM (
        SELECT s.name, COUNT(DISTINCT oi.id) AS count
        FROM public.order_items oi
        JOIN public.order_item_stage_status oiss ON oi.id = oiss.order_item_id
        JOIN public.stages s ON oiss.stage_id = s.stage_id
        WHERE oi.delivery_date IS NULL AND oiss.status = 'active'
        GROUP BY s.name
    ) AS pipeline_counts;

    -- Production Chart (Orders started in the last 30 days)
    SELECT jsonb_agg(chart_data)
    INTO production_chart
    FROM (
        SELECT DATE(o.order_date) AS date, COUNT(oi.id) AS count
        FROM public.order_items oi
        JOIN public.orders o ON oi.order_id = o.id
        WHERE o.order_date >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(o.order_date)
        ORDER BY DATE(o.order_date)
    ) AS chart_data;

    -- Recent Orders
    SELECT jsonb_agg(recent_data)
    INTO recent_orders
    FROM (
        SELECT
            oi.id,
            cd.customer_name,
            COALESCE(sp.model_name, bp.model_name) AS product_name,
            COALESCE(
                (
                    SELECT jsonb_agg(s.name)
                    FROM public.order_item_stage_status oiss_sub
                    JOIN public.stages s ON oiss_sub.stage_id = s.stage_id
                    WHERE oiss_sub.order_item_id = oi.id AND oiss_sub.status = 'active'
                ),
                '[]'::jsonb
            ) AS active_stages,
            oi.due_date
        FROM public.order_items oi
        JOIN public.orders o ON oi.order_id = o.id
        JOIN public.customer_details cd ON o.customer_id = cd.id
        LEFT JOIN public.sofa_products sp ON oi.sofa_product_id = sp.id
        LEFT JOIN public.bed_products bp ON oi.bed_product_id = bp.id
        ORDER BY o.order_date DESC
        LIMIT 5
    ) AS recent_data;

    RETURN jsonb_build_object(
        'total_orders', total_orders,
        'orders_in_production', orders_in_production,
        'completed_orders_month', completed_orders_month,
        'overdue_orders', overdue_orders,
        'production_pipeline', production_pipeline,
        'production_chart', production_chart,
        'recent_orders', recent_orders
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO public;
