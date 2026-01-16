"use server";

import { createClient } from "@/utils/supabase/server";

export async function getDashboardData() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_dashboard_stats");

  if (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }

  return data;
}
