'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, Users } from 'lucide-react';
import { CustomerSearchResult } from '@/types/customers';
import CustomerCard from '@/components/customers/customer-card';
import CustomerDetailPanel from '@/components/customers/customer-detail-panel';
import AddCustomerModal from '@/components/customers/add-customer-modal';
import FilterPopover from '@/components/customers/filter-popover';
import { ExportButton } from '@/components/export-button';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CustomerClientPageProps {
    initialCustomers: CustomerSearchResult[];
    initialFilters: {
        searchTerm: string;
        address: string;
    };
}

// The search and address filters live in the URL (?search=…&address=…). The
// server page reads them and renders the matching customers, so changing a
// filter is just a navigation.
const CustomerClientPage: React.FC<CustomerClientPageProps> = ({ initialCustomers, initialFilters }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [searchInput, setSearchInput] = useState(initialFilters.searchTerm);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    const updateUrl = useCallback((changes: { search?: string; address?: string }) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(changes)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        const query = params.toString();
        startTransition(() => {
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        });
    }, [router, pathname, searchParams]);

    // Debounce typing so the server isn't queried on every keystroke.
    useEffect(() => {
        if (searchInput === initialFilters.searchTerm) return;
        const timer = setTimeout(() => updateUrl({ search: searchInput.trim() }), 300);
        return () => clearTimeout(timer);
    }, [searchInput, initialFilters.searchTerm, updateUrl]);

    const handleModalClose = useCallback((added: boolean) => {
        setIsModalOpen(false);
        if (added) router.refresh();
    }, [router]);

    const hasFilters = Boolean(initialFilters.searchTerm || initialFilters.address);

    return (
        <PageContainer fullWidth>
            <PageHeader title="Customers" description="Find customers and see their order history.">
                <ExportButton
                    source="customers"
                    columns={[
                        { key: 'id', label: 'Customer ID' },
                        { key: 'customer_name', label: 'Name' },
                        { key: 'company', label: 'Company' },
                        { key: 'email', label: 'Email' },
                        { key: 'mobile_number', label: 'Phone' },
                        { key: 'address', label: 'Address' },
                        { key: 'customer_type', label: 'Customer Type' },
                    ]}
                />
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus /> Add customer
                </Button>
            </PageHeader>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                <SearchInput
                    placeholder="Search by name or email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="flex-1"
                />
                <FilterPopover
                    address={initialFilters.address}
                    onApply={(address) => updateUrl({ address: address.trim() })}
                />
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
                <div className={cn("min-w-0 flex-1 transition-opacity", isPending && "opacity-60")}>
                    {initialCustomers.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title={hasFilters ? "No customers match your search" : "No customers yet"}
                            description={hasFilters ? "Try a different name, email or address." : "Add your first customer to start taking orders."}
                            action={!hasFilters && <Button onClick={() => setIsModalOpen(true)}><Plus /> Add customer</Button>}
                        />
                    ) : (
                        <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2", selectedCustomerId ? "2xl:grid-cols-3" : "xl:grid-cols-3")}>
                            {initialCustomers.map(customer => (
                                <CustomerCard
                                    key={customer.id}
                                    customer={customer}
                                    selected={customer.id === selectedCustomerId}
                                    onSelect={() => setSelectedCustomerId(customer.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
                {selectedCustomerId && (
                    <div className="w-full shrink-0 lg:w-96">
                        <div className="lg:sticky lg:top-6">
                            <CustomerDetailPanel customerId={selectedCustomerId} onClose={() => setSelectedCustomerId(null)} />
                        </div>
                    </div>
                )}
            </div>

            {/* Mounted only while open, so every opening starts with a fresh form. */}
            {isModalOpen && <AddCustomerModal onClose={handleModalClose} />}
        </PageContainer>
    );
};

export default CustomerClientPage;
