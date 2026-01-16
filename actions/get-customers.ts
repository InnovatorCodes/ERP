'use server';

import { createClient } from '@/utils/supabase/server';
import { Customer } from '@/types/customers'; // Assuming this type is updated or compatible

export async function getCustomers(filters: {
    searchTerm: string;
    status: string;
    address: string;
}) {
    try {
        const supabase = await createClient();

        let query = supabase
            .from('customer_details')
            .select(`
                id,
                customer_name,
                email,
                company,
                address,
                mobile_number,
                customer_type,
                created_at
            `);

        if (filters.searchTerm) {
            query = query.or(
                `customer_name.ilike.%${filters.searchTerm}%,` +
                `company.ilike.%${filters.searchTerm}%,` +
                `email.ilike.%${filters.searchTerm}%`
            );
        }

        if (filters.address) {
            query = query.ilike('address', `%${filters.address}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase fetch error:', error);
            return { data: null, error: 'Could not fetch customer data.' };
        }

        const customers: Customer[] = data.map(c => ({
            id: c.id,
            name: c.customer_name,
            email: c.email,
            company: c.company || 'N/A',
            address: c.address,
            phone: c.mobile_number || 'N/A', // Ensure phone is always a string
            avatar: `https://i.pravatar.cc/150?u=${c.id}`,
            customerType: c.customer_type || 'b2c', // Map customer_type and provide a default
            dateAdded: new Date(c.created_at).toLocaleDateString('en-US', { // Correct casing
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            totalOrders: 0, // Correct casing
            totalSpend: 0, // Correct casing
            lastOrder: 'N/A', // Correct casing
        }));

        return { data: customers, error: null };
    } catch (e) {
        console.error('Unexpected error in getCustomers:', e);
        return { data: null, error: 'An unexpected error occurred.' };
    }
}
