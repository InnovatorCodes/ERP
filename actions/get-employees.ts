"use server";

import { createClient } from "@/utils/supabase/server";

export async function getEmployees() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("profiles").select("*");

  if (error) {
    console.error("Error fetching employees:", error);
    return [];
  }

  return data;
}
