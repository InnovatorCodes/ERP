CREATE OR REPLACE FUNCTION get_order_item_stage_status_with_delivery_check(p_order_item_id INT)
RETURNS TABLE (
    stage TEXT,
    status TEXT
)
AS $$
DECLARE
    v_delivery_date DATE;
BEGIN
    -- Check for delivery date
    SELECT delivery_date INTO v_delivery_date
    FROM public.order_items
    WHERE id = p_order_item_id;

    -- If delivery date is not null, return all stages as completed
    IF v_delivery_date IS NOT NULL THEN
        RETURN QUERY
        SELECT s.name::TEXT, 'completed'::TEXT
        FROM public.stages s;
    ELSE
        -- Otherwise, return the actual stage statuses
        RETURN QUERY
        SELECT s.name::TEXT, oiss.status::TEXT
        FROM public.order_item_stage_status oiss
        JOIN public.stages s ON oiss.stage_id = s.stage_id
        WHERE oiss.order_item_id = p_order_item_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_order_item_stage_status_with_delivery_check(INT) TO public;
