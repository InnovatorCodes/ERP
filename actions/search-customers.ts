'use server';

import { authorize, ROLES } from '@/lib/auth';
import { ilikeContains } from '@/lib/postgrest';

export async function searchCustomers(query: string) {
    if (!query.trim()) {
        return [];
    }

    const auth = await authorize(ROLES.STAFF);
    if (!auth.ok) return [];

    const pattern = ilikeContains(query.trim());
    const { data, error } = await auth.supabase
        .from('customer_details')
        .select('id, customer_name, company, email, address, mobile_number, customer_type, created_at')
        .or(['customer_name', 'mobile_number', 'email', 'company'].map((column) => `${column}.ilike.${pattern}`).join(','))
        .limit(10);

    if (error) {
        console.error('Supabase search error:', error);
        return [];
    }

    return data;
}
