CREATE OR REPLACE FUNCTION advance_order_stage(p_order_item_id INT, p_current_stage_id INT)
RETURNS BOOLEAN AS $$
DECLARE
  potential_next_stage RECORD;
  all_deps_completed BOOLEAN;
BEGIN
  -- =================================================================
  -- ADMIN ROLE AUTHORIZATION CHECK
  -- =================================================================
  IF (
    SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()
  ) <> 'admin' THEN
    RAISE EXCEPTION 'Insufficient permissions: User must be an admin to perform this action.';
  END IF;

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

  -- --- LOGIC FOR FINAL STAGE ---
  -- Check if the completed stage is the final one (stage 6).
  IF p_current_stage_id = 6 THEN
    -- Clean up all remaining checks for this order item.
    DELETE FROM public.product_checklist_progress
    WHERE order_item_id = p_order_item_id;

    -- MODIFIED: Instead of deleting, mark all stages as 'completed' to preserve history.
    UPDATE public.order_item_stage_status
    SET status = 'completed', updated_at = now()
    WHERE order_item_id = p_order_item_id;

    -- The process is complete, return success.
    RETURN true;

  -- --- EXISTING LOGIC FOR ALL OTHER STAGES ---
  ELSE
    -- Step 2: Mark the current stage as 'completed'.
    UPDATE public.order_item_stage_status
    SET status = 'completed', updated_at = now()
    WHERE order_item_id = p_order_item_id AND stage_id = p_current_stage_id;

    -- Step 3: Clean up checks for the just-completed stage.
    DELETE FROM public.product_checklist_progress
    WHERE order_item_id = p_order_item_id
      AND check_id IN (SELECT check_id FROM public.checks WHERE stage_id = p_current_stage_id);

    -- Step 4: Find and process all stages that depend on the one just completed.
    FOR potential_next_stage IN
      SELECT stage_id FROM public.stage_dependencies WHERE depends_on_stage_id = p_current_stage_id
    LOOP
    -- For each potential next stage, check if ALL of its dependencies are now met.
    SELECT (
        -- Total number of dependencies for the next stage
        SELECT COUNT(*)
        FROM public.stage_dependencies
        WHERE stage_id = potential_next_stage.stage_id
    ) = (
        -- Number of completed dependencies for the next stage for this order item
        SELECT COUNT(*)
        FROM public.order_item_stage_status
        WHERE order_item_id = p_order_item_id
          AND status = 'completed'
          AND stage_id IN (
            SELECT depends_on_stage_id
            FROM public.stage_dependencies
            WHERE stage_id = potential_next_stage.stage_id
          )
    )
    INTO all_deps_completed;

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
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;