"use server";

import { revalidatePath } from "next/cache";
import { authorize, ROLES, userFacingDbError } from "@/lib/auth";

export async function proceedToNextStage(
  orderItemId: number,
  currentStageId: number
): Promise<{ success: boolean; error: string | null }> {
  const auth = await authorize(ROLES.PRODUCTION);
  if (!auth.ok) return { success: false, error: auth.message };

  const { data, error } = await auth.supabase.rpc('advance_order_stage', {
    p_current_stage_id: currentStageId,
    p_order_item_id: orderItemId,
  });

  if (error) {
    console.error('Error proceeding to next stage:', error);
    return { success: false, error: userFacingDbError(error, 'Failed to proceed to the next stage.') };
  }

  if (data === false) {
    return { success: false, error: 'Could not proceed because one or more checks are pending or failed.' };
  }

  revalidatePath('/view-orders');

  return { success: true, error: null };
}
