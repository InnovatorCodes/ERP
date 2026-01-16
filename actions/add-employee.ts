"use server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const employeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(['admin', 'manager', 'production manager', 'sales coordinator']),
});

export async function addEmployeeAction(formData: z.infer<typeof employeeSchema>) {
  const cookieStore = await cookies();
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!, // Using the provided secret key
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (e) {
            // Fallback for Server Components
          }
        },
      },
    }
  );

  const { email, password, fullName, role } = employeeSchema.parse(formData);

  try {
    // Step 1: Create the user using the Supabase Admin client.
    // This correctly handles the user ID generation.
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) {
      console.error('[addEmployeeAction] Error creating user:', authError);
      throw new Error(authError.message);
    }

    if (!user) {
        throw new Error("User creation failed, but no error was returned.");
    }

    // Step 2: Call the RPC to create the user's profile using the admin client.
    // We pass the newly created user's ID to the RPC.
    const { error: rpcError } = await supabaseAdmin.rpc('create_user_profile', {
      user_id: user.id,
      full_name: fullName,
      role
    });

    if (rpcError) {
      console.error('[addEmployeeAction] Error calling RPC:', rpcError);
      throw new Error(rpcError.message);
    }

    return { success: true, message: `Employee '${fullName}' added successfully.` };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
