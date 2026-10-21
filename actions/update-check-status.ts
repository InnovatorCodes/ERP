"use server";

import { revalidatePath } from "next/cache";
import { authorize, ROLES, userFacingDbError } from "@/lib/auth";
import { CheckItem } from "@/components/view-orders/types";

export async function updateCheckStatus(
  orderItemId: number,
  checkId: number,
  newStatus: CheckItem["status"],
  failure_report?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const auth = await authorize(ROLES.PRODUCTION);
    if (!auth.ok) return { success: false, error: auth.message };

    // set_check_status only accepts checks of a stage that is currently active.
    const { error } = await auth.supabase.rpc("set_check_status", {
      p_order_item_id: orderItemId,
      p_check_id: checkId,
      p_status: newStatus,
      p_failure_report: failure_report ?? null,
    });

    if (error) {
      console.error("Error updating check status:", error);
      return { success: false, error: userFacingDbError(error, "Failed to update check status.") };
    }

    revalidatePath("/view-orders");

    return { success: true, error: null };
  } catch (e) {
    console.error("Unexpected error in updateCheckStatus:", e);
    return { success: false, error: "An unexpected error occurred." };
  }
}
