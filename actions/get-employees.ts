"use server";

import { authorize, ROLES } from "@/lib/auth";

export async function getEmployees() {
  const auth = await authorize(ROLES.ADMIN);
  if (!auth.ok) return [];

  const { data, error } = await auth.supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .order("full_name");

  if (error) {
    console.error("Error fetching employees:", error);
    return [];
  }

  return data;
}
