"use server";

import { authorize, ROLES } from "@/lib/auth";

export async function getDashboardData() {
  const auth = await authorize(ROLES.MANAGEMENT);
  if (!auth.ok) return null;

  const { data, error } = await auth.supabase.rpc("get_dashboard_stats");

  if (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }

  return data;
}
