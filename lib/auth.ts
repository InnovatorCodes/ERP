import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { ROLES, USER_ROLES, type UserRole } from '@/lib/roles';

// Who may call which server actions is defined in lib/roles.ts. The database
// enforces the same rules, so these checks are a first line of defence.
export { ROLES, USER_ROLES, type UserRole };

type AuthResult =
  | { ok: true; supabase: SupabaseClient; user: User; role: UserRole }
  | { ok: false; status: 401 | 403; message: string };

/**
 * Verifies the signed-in user (against Supabase Auth, not just the cookie)
 * and checks their role. Returns the request-scoped client on success.
 */
export async function authorize(allowed: readonly UserRole[]): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, status: 401, message: 'You must be signed in.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role as UserRole | undefined;
  if (!role || !allowed.includes(role)) {
    return { ok: false, status: 403, message: 'You do not have permission to perform this action.' };
  }

  return { ok: true, supabase, user, role };
}

/**
 * Database errors raised deliberately by our SQL functions (RAISE EXCEPTION)
 * are written for users; anything else is replaced by the fallback so table
 * and constraint details are not leaked to the browser.
 */
export function userFacingDbError(error: { code?: string; message: string }, fallback: string): string {
  return error.code === 'P0001' || error.code === '42501' ? error.message : fallback;
}
