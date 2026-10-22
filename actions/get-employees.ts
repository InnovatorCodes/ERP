"use server";

import { authorize, ROLES, viewers, type UserRole } from "@/lib/auth";

type Employee = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
};

export async function getEmployees(): Promise<Employee[]> {
  const auth = await authorize(viewers(ROLES.ADMIN));
  if (!auth.ok) return [];

  // The database masks other people's emails for the demo account.
  const { data, error } = await auth.supabase.rpc("list_employees");

  if (error) {
    console.error("Error fetching employees:", error);
    return [];
  }

  return (data ?? []) as Employee[];
}
