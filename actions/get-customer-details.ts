'use server';

import { createClient } from '@/utils/supabase/server';
import { Customer } from '@/types/customers';

export async function getCustomerDetails(customerId: string): Promise<Customer | null> {
    const supabase = await createClient();

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
