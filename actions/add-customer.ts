'use server';

import { revalidatePath } from 'next/cache';
import { authorize, ROLES } from '@/lib/auth';

const CUSTOMER_TYPES = ['b2b', 'b2c', 'architecture', 'interior design'] as const;

// This is the server action function that will be called from the form.
export async function addCustomerAction(prevState: unknown, formData: FormData) {
    const auth = await authorize(ROLES.SALES);
    if (!auth.ok) return { message: auth.message };

    const customerType = formData.get('customerType') as string;
    if (!CUSTOMER_TYPES.includes(customerType as (typeof CUSTOMER_TYPES)[number])) {
        return { message: 'Please select a valid customer type.' };
    }

    // Map FormData to the structure of your 'customer_details' table.
    const newCustomer = {
        customer_name: formData.get('name') as string,
        company: formData.get('company') as string || null,
        email: formData.get('email') as string,
        mobile_number: formData.get('phone') as string || null,
        address: formData.get('address') as string,
        customer_type: customerType,
    };

    // Insert the new customer data into the table.
    const { error } = await auth.supabase.from('customer_details').insert([newCustomer]);

    if (error) {
        console.error('Supabase Error:', error);
        return { message: 'Failed to add customer. Please check the details and try again.' };
    }

    // If the insert is successful, revalidate the path where customers are displayed.
    revalidatePath('/customers');

    return { message: 'success' };
}
