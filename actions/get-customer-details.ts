'use server';

import { authorize, ROLES } from '@/lib/auth';
import { Customer } from '@/types/customers';

export async function getCustomerDetails(customerId: string): Promise<Customer | null> {
    const auth = await authorize(ROLES.STAFF);
    if (!auth.ok) return null;
    const supabase = auth.supabase;

    const { data, error } = await supabase
        .rpc('get_customer_details', { p_customer_id: parseInt(customerId) });
    if (error) {
        console.error('Error fetching customer details:', error);
        return null;
    }

    if (data && data.length > 0) {
        return data[0] as Customer;
    }

    return null;
}
