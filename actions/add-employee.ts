"use server";
import { z } from 'zod';
import { authorize, ROLES, USER_ROLES } from '@/lib/auth';
import { createAdminClient } from '@/utils/supabase/admin';

const employeeSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  fullName: z.string().trim().min(1),
  role: z.enum(USER_ROLES as [string, ...string[]]),
});

export async function addEmployeeAction(formData: z.infer<typeof employeeSchema>) {
  const auth = await authorize(ROLES.ADMIN);
  if (!auth.ok) return { success: false, message: auth.message };

  const parsed = employeeSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, message: 'Please enter a valid name, email, role and a password of at least 8 characters.' };
  }
  const { email, password, fullName, role } = parsed.data;

  const supabaseAdmin = createAdminClient();

  // The role goes in app_metadata, which only the secret key can write. The
  // on_auth_user_created trigger creates the matching profile row.
  const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { role },
  });

  if (authError || !user) {
    console.error('[addEmployeeAction] Error creating user:', authError);
    return { success: false, message: authError?.message ?? 'Could not create the user.' };
  }

  const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('id', user.id).single();
  if (!profile) {
    // Don't leave a login without a profile behind.
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    return { success: false, message: 'The employee profile could not be created. Please try again.' };
  }

  return { success: true, message: `Employee '${fullName}' added successfully.` };
}
