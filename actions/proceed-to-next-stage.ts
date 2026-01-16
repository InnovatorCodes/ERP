"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function proceedToNextStage(
  orderItemId: number,
  currentStageId: number
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await  createClient();

  console.log(orderItemId,currentStageId)
  const { data, error } = await supabase.rpc('advance_order_stage ', {
    p_current_stage_id: currentStageId,
    p_order_item_id: orderItemId,
  });

  if (error) {
    console.error('Error proceeding to next stage:', error);
    return { success: false, error: 'Failed to proceed to the next stage.' };
  }

  if (data === false) {
    return { success: false, error: 'Could not proceed because one or more checks are still pending.' };
  }

  revalidatePath('/view-orders');

  return { success: true, error: null };
}
