"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function updateEmployeeRole(userId: string, role: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    console.error("Error updating employee role:", error);
    return { success: false, message: error.message };
  }

  return { success: true, message: "Employee role updated successfully." };
}
