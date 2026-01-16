'use server';

import { createClient } from '@/utils/supabase/server';

export async function searchCustomers(query: string) {
    if (!query.trim()) {
        return [];
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from('customer_details')
        .select('id, customer_name, company, email, address, mobile_number, customer_type, created_at')
        .or(`customer_name.ilike.%${query}%,mobile_number.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
        .limit(10);

    if (error) {
        console.error('Supabase search error:', error);
        return [];
    }

    return data;
}
