"use server";

import { revalidatePath } from "next/cache";
import { authorize, ROLES } from "@/lib/auth";

const PRIORITIES = [0, 1, 2, 3];

export async function updateOrderPriority(
  orderItemId: number,
  priority: number
): Promise<{ success: boolean; error: string | null }> {
  const auth = await authorize(ROLES.PRODUCTION);
  if (!auth.ok) return { success: false, error: auth.message };

  if (!Number.isInteger(orderItemId) || !PRIORITIES.includes(priority)) {
    return { success: false, error: "Invalid order item or priority." };
  }

  // Only the priority column is writable for these roles (see database.sql).
  const { data, error } = await auth.supabase
    .from("order_items")
    .update({ priority })
    .eq("id", orderItemId)
    .select("id");

  if (error) {
    console.error("Error updating priority:", error);
    return { success: false, error: "Failed to update priority." };
  }
  if (!data || data.length === 0) {
    return { success: false, error: "Order item not found." };
  }

  revalidatePath("/view-orders");
  return { success: true, error: null };
}
