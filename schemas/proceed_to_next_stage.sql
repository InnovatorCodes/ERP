CREATE OR REPLACE FUNCTION public.proceed_to_next_stage(p_order_item_id int4, p_current_stage_id int4)
RETURNS BOOLEAN AS $$
DECLARE
  potential_next_stage RECORD;
  all_deps_completed BOOLEAN;
BEGIN
  -- Step 1: VERIFY that all checks for the current stage are complete.
  IF EXISTS (
    SELECT 1
    FROM public.product_checklist_progress pcp
    JOIN public.checks c ON pcp.check_id = c.check_id
    WHERE pcp.order_item_id = p_order_item_id
      AND c.stage_id = p_current_stage_id
      AND pcp.status = 'pending'
  ) THEN
    -- If any checks are pending, the operation fails.
    RETURN false;
  END IF;

  -- Step 2: Mark the current stage as 'completed'.
  UPDATE public.order_item_stage_status
  SET status = 'completed', updated_at = now()
  WHERE order_item_id = p_order_item_id AND stage_id = p_current_stage_id;

  -- Step 3 (Optional): Clean up checks for the completed stage.
  DELETE FROM public.product_checklist_progress
  WHERE order_item_id = p_order_item_id
    AND check_id IN (SELECT check_id FROM public.checks WHERE stage_id = p_current_stage_id);

  -- Step 4: Find and process all stages that depend on the one just completed.
  FOR potential_next_stage IN
    SELECT stage_id FROM public.stage_dependencies WHERE depends_on_stage_id = p_current_stage_id
  LOOP
    -- For each potential next stage, check if ALL of its dependencies are now met.
    SELECT COUNT(*) = (
        SELECT COUNT(*)
        FROM public.order_item_stage_status
        WHERE order_item_id = p_order_item_id
          AND status = 'completed'
          AND stage_id IN (
            SELECT depends_on_stage_id
            FROM public.stage_dependencies
            WHERE stage_id = potential_next_stage.stage_id
          )
    ) INTO all_deps_completed
    FROM public.stage_dependencies
    WHERE stage_id = potential_next_stage.stage_id;

    -- If all dependencies are met, activate the next stage.
    IF all_deps_completed THEN
      -- Update the stage from 'pending' to 'active'.
      UPDATE public.order_item_stage_status
      SET status = 'active', updated_at = now()
      WHERE order_item_id = p_order_item_id AND stage_id = potential_next_stage.stage_id;

      -- Populate its checklist.
      INSERT INTO public.product_checklist_progress (order_item_id, check_id, status)
      SELECT p_order_item_id, c.check_id, 'pending'
      FROM public.checks c
      WHERE c.stage_id = potential_next_stage.stage_id
      ON CONFLICT (order_item_id, check_id) DO NOTHING;
    END IF;
  END LOOP;

  -- If the function completes without errors, it was successful.
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
