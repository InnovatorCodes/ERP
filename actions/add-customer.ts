'use server';

import { createClient } from '@/utils/supabase/server'; // Assumes you have a Supabase client utility
import { revalidatePath } from 'next/cache';

// This is the server action function that will be called from the form.
export async function addCustomerAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();

    // Map FormData to the structure of your 'customer_details' table.
    const newCustomer = {
        customer_name: formData.get('name') as string,
        company: formData.get('company') as string || null,
        email: formData.get('email') as string,
        mobile_number: formData.get('phone') as string,
        address: formData.get('address') as string,
        customer_type: formData.get('customerType') as 'b2b' | 'b2c' | 'architecture' | 'interior design',
    };

    // Insert the new customer data into the table.
    const { error } = await supabase.from('customer_details').insert([newCustomer]);

    if (error) {
        console.error('Supabase Error:', error);
        return { message: `Failed to add customer: ${error.message}` };
    }

    // If the insert is successful, revalidate the path where customers are displayed.
    // This will trigger a data refresh, showing the new customer in the list.
    // Replace '/customers' with the actual path to your customer list page.
    revalidatePath('/customers');

    return { message: 'success' };
}
