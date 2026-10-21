"use server";

import { revalidatePath } from "next/cache";
import { authorize, ROLES, userFacingDbError } from "@/lib/auth";

export async function markAsDelivered(
  orderItemId: string
): Promise<{ success: boolean; error: string | null }> {
  const auth = await authorize(ROLES.PRODUCTION);
  if (!auth.ok) return { success: false, error: auth.message };

  const orderIdAsNumber = parseInt(orderItemId, 10);

  if (isNaN(orderIdAsNumber)) {
    return { success: false, error: "Invalid Order ID." };
  }

  const { error } = await auth.supabase.rpc('mark_order_item_delivered', { p_order_item_id: orderIdAsNumber });

  if (error) {
    console.error("Error marking as delivered:", error);
    return { success: false, error: userFacingDbError(error, "Failed to mark as delivered.") };
  }

  revalidatePath("/view-orders");

  return { success: true, error: null };
}
