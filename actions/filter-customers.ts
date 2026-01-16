'use server';

import { createClient } from '@/utils/supabase/server';
import { CustomerSearchResult } from '@/types/customers';

interface SearchFilters {
    searchTerm?: string;
    status?: string;
    address?: string;
}

export async function searchCustomers(filters: SearchFilters): Promise<CustomerSearchResult[]> {
    const supabase = await createClient();

    // Prepare parameters for the RPC call.
    // Use null for empty strings so the RPC function can handle them.
    const params = {
        p_search_term: filters.searchTerm || null,
        p_status: filters.status === 'All' ? null : filters.status || null,
        p_address: filters.address || null,
    };

    const { data, error } = await supabase
        .rpc('search_customers', params);
    if (error) {
        console.error('Error fetching customers:', error);
        return [];
    }

    // The RPC function is expected to return data in the shape of the CustomerSearchResult type.
    return data as CustomerSearchResult[];
}
