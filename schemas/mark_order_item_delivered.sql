CREATE OR REPLACE FUNCTION public.mark_order_item_delivered(p_order_item_id INT)
RETURNS VOID AS $$
BEGIN
  -- =================================================================
  -- NEW: ADMIN ROLE AUTHORIZATION CHECK
  -- =================================================================
  IF (
    SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()
  ) <> 'admin' THEN
    RAISE EXCEPTION 'Insufficient permissions: User must be an admin to perform this action.';
  END IF;

  -- Delete all stage statuses for the order item
  DELETE FROM public.order_item_stage_status
  WHERE order_item_id = p_order_item_id;

  -- Update the delivery date for the order item
  UPDATE public.order_items
  SET delivery_date = now() -- Using now() for a precise timestamp
  WHERE id = p_order_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;