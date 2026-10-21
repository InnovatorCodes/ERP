'use client';

import React, { useState, useRef, useEffect, useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Filter } from 'lucide-react';
import { CustomerSearchResult } from '@/types/customers';
import CustomerCard from '@/components/customers/customer-card';
import CustomerDetailPanel from '@/components/customers/customer-detail-panel';
import AddCustomerModal from '@/components/customers/add-customer-modal';
import FilterPopover from '@/components/customers/filter-popover';
import { ExportButton } from '@/components/export-button';

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
    const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
    const filterPopoverRef = useRef<HTMLDivElement>(null);

    const currentAddressFilter = initialFilters.address;

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

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
                setIsFilterPopoverOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleModalClose = useCallback((added: boolean) => {
        setIsModalOpen(false);
        if (added) router.refresh();
    }, [router]);

    const activeFilterCount = [initialFilters.searchTerm, currentAddressFilter].filter(Boolean).length;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-full mx-auto">
                {/* --- Header --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
                        <p className="mt-1 text-sm text-gray-600">Manage customer relationships and order history.</p>
                    </div>
                    <div className="flex items-center gap-2">
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
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Add Customer</span>
                        </button>
                    </div>
                </div>

                {/* --- Search and Filter Bar --- */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="relative" ref={filterPopoverRef}>
                        <button
                            onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
                            className={`flex items-center gap-2 w-full sm:w-auto px-4 py-3 border rounded-lg transition ${activeFilterCount > 0 ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 bg-white'}`}
                        >
                            <Filter className="h-5 w-5" />
                            <span>More Filters</span>
                            {activeFilterCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>
                            )}
                        </button>
                        {isFilterPopoverOpen && (
                            <FilterPopover
                                initialFilters={{ address: currentAddressFilter }}
                                onApply={(filters) => updateUrl({ address: filters.address.trim() })}
                                onClose={() => setIsFilterPopoverOpen(false)}
                            />
                        )}
                    </div>
                </div>

                {/* --- Main Content Area --- */}
                <div className="flex gap-6">
                    <div className={`transition-all duration-500 ease-in-out ${selectedCustomerId ? 'w-full lg:w-2/3' : 'w-full'}`}>
                        {isPending ? (
                            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                                <p className="text-gray-500 font-semibold">Loading customers...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {initialCustomers.map(customer => (
                                    <CustomerCard key={customer.id} customer={customer} onSelect={() => setSelectedCustomerId(customer.id)} />
                                ))}
                            </div>
                        )}
                        {initialCustomers.length === 0 && !isPending && (
                            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                                <p className="text-gray-500 font-semibold">No customers found.</p>
                                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </div>
                    {selectedCustomerId && (
                        <div className="w-full lg:w-1/3 transition-all duration-500 ease-in-out">
                            <CustomerDetailPanel customerId={selectedCustomerId} onClose={() => setSelectedCustomerId(null)} />
                        </div>
                    )}
                </div>
            </div>
            {/* Mounted only while open, so every opening starts with a fresh form. */}
            {isModalOpen && <AddCustomerModal onClose={handleModalClose} />}
        </div>
    );
};

export default CustomerClientPage;
