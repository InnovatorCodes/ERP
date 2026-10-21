"use server";

import { z } from 'zod';
import { authorize, ROLES, USER_ROLES, userFacingDbError } from '@/lib/auth';

const inputSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(USER_ROLES as [string, ...string[]]),
});

export async function updateEmployeeRole(userId: string, role: string) {
  const auth = await authorize(ROLES.ADMIN);
  if (!auth.ok) return { success: false, message: auth.message };

  const parsed = inputSchema.safeParse({ userId, role });
  if (!parsed.success) {
    return { success: false, message: 'Invalid employee or role.' };
  }

  // Runs as the signed-in admin: RLS and the last-admin trigger still apply.
  const { error } = await auth.supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId);

  if (error) {
    console.error("Error updating employee role:", error);
    return { success: false, message: userFacingDbError(error, 'Failed to update the role.') };
  }

  return { success: true, message: "Employee role updated successfully." };
}
