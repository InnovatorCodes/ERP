'use client';
import React, { useState, useActionState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Product, ProductWithFiles } from '@/types/products';
import { Customer } from '@/types/customers';
import { searchCustomers } from '@/actions/search-customers';
import getProductDetails from '@/actions/get-product-details';
import { submitOrder } from '@/actions/submit-order';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import { ProductEntryForm } from './product-entry-form';

// Main type 
export type OrderItem = {
    id: string | null;
    uniqueId: number;
    type: 'Sofa' | 'Bed';
    details: ProductWithFiles;
    isCustom: boolean;
    quantity: number;
    due_date: Date | null;
    nameError?: string;
};
// Initial state for a new product entry
const initialProductState: OrderItem = {
    id: null,
    uniqueId: Date.now(),
    type: 'Sofa',
    details: {} as ProductWithFiles,
    isCustom: false,
    quantity: 1,
    due_date: null,
    nameError: '',
};

const PlaceOrderPage = () => {
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([
        { ...initialProductState, uniqueId: Date.now() }
    ]);

    const [state, formAction] = useActionState(submitOrder, { success: false, message: '' });
    const hasNameError = orderItems.some(item => item.nameError);
    // Required choices the browser can't check (they live in hidden inputs).
    const itemProblems = orderItems.flatMap((item, index) => {
        const label = `Item ${index + 1}`;
        if (!item.id && !item.isCustom) return [`${label}: select an existing model, or turn on Customize to describe a new one.`];
        const problems: string[] = [];
        if (!item.due_date) problems.push(`${label}: choose a due date.`);
        if (item.isCustom && item.type === 'Sofa' && !item.details.model_family_configuration) {
            problems.push(`${label}: choose a model family configuration.`);
        }
        return problems;
    });

    useEffect(() => {
        if (state.success) {
            setOrderItems([{ ...initialProductState, uniqueId: Date.now() }]);
        }
    }, [state.success]);

    const handleItemChange = useCallback(<K extends keyof OrderItem>(index: number, field: K, value: OrderItem[K]) => {
        setOrderItems(currentItems => {
            const newItems = [...currentItems];
            const updatedItem = { ...newItems[index], [field]: value };

            // Switching type or clearing the selected model starts the item over,
            // so details of the previous model are never submitted by mistake.
            if (field === 'type' || (field === 'id' && value === null)) {
                updatedItem.id = null;
                updatedItem.details = {} as ProductWithFiles;
                updatedItem.isCustom = false;
                updatedItem.nameError = '';
            }
            newItems[index] = updatedItem;
            return newItems;
        });
    }, []);

    const handleDetailsChange = useCallback(<K extends keyof ProductWithFiles>(index: number, detailField: K, value: ProductWithFiles[K] | null) => {
        setOrderItems(currentItems => {
            const newItems = [...currentItems];
            const itemToUpdate = newItems[index];
            const newDetails = { ...itemToUpdate.details, [detailField]: value };
            newItems[index] = { ...itemToUpdate, details: newDetails };
            return newItems;
        });
    }, []);

    const handleProductSelect = useCallback(async (index: number, product: Product) => {
        try {
            const productType = 'bed_size' in product ? 'bed' : 'sofa';
            const productTypeCapitalized = productType === 'bed' ? 'Bed' : 'Sofa';

            const productDetails = await getProductDetails(product.id, productType);
            if (productDetails.errors) throw new Error(JSON.stringify(productDetails.errors));
            
            setOrderItems(currentItems => {
                const newItems = [...currentItems];
                newItems[index] = {
                    ...newItems[index], 
                    id: product.id.toString(), 
                    type: productTypeCapitalized,
                    details: productDetails.data || {}, 
                    isCustom: false, 
                    nameError: '',
                };
                return newItems;
            });
        } catch (error) {
            console.error('Failed to fetch product details:', error);
        }
    }, []);

    const addNewItem = () => setOrderItems([...orderItems, { ...initialProductState, uniqueId: Date.now() }]);
    const removeItem = (index: number) => setOrderItems(orderItems.filter((_, i) => i !== index));

    return (
        <PageContainer>
            <PageHeader title="Place order" description="Choose a customer, then add each product with its due date." />
            <form action={formAction} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                {selectedCustomer && <input type="hidden" name="selectedCustomerId" value={selectedCustomer.id} />}
                <input type="hidden" name="totalProducts" value={orderItems.length} />
                <div className="space-y-4 lg:col-span-2">
                    {orderItems.map((item, index) => (
                        <ProductEntryForm
                            key={`${item.uniqueId}-${item.id || ''}`}
                            item={item} index={index}
                            onItemChange={handleItemChange}
                            onDetailsChange={handleDetailsChange}
                            onProductSelect={handleProductSelect}
                            onRemove={removeItem}
                            isOnlyItem={orderItems.length === 1}
                        />
                    ))}
                    <button
                        type="button"
                        onClick={addNewItem}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <Plus className="size-4" /> Add another product
                    </button>
                </div>
                <div className="space-y-4 lg:sticky lg:top-6">
                    <CustomerSelector customer={selectedCustomer} onSelect={setSelectedCustomer} />
                    <OrderSummary
                        itemCount={orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                        lineCount={orderItems.length}
                        problems={selectedCustomer ? itemProblems : ['Select a customer.', ...itemProblems]}
                        disabled={hasNameError || !selectedCustomer || itemProblems.length > 0}
                    />
                    {state?.message && (
                        <div
                            role={state.success ? 'status' : 'alert'}
                            className={cn(
                                "flex items-start gap-3 rounded-xl border p-4 text-sm",
                                state.success ? "border-success/20 bg-success-soft text-success" : "border-destructive/20 bg-destructive-soft text-destructive"
                            )}
                        >
                            {state.success ? <CheckCircle2 className="size-5 shrink-0" /> : <AlertCircle className="size-5 shrink-0" />}
                            <p className="font-medium">{state.message}</p>
                        </div>
                    )}
                </div>
            </form>
        </PageContainer>
    );
};

const CustomerSelector = ({ customer, onSelect }: { customer: Customer | null, onSelect: (customer: Customer | null) => void }) => {
    const [isSearching, setIsSearching] = useState(!customer);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            setIsLoading(false);
            return;
        }
        let cancelled = false;
        setIsLoading(true);
        const timer = setTimeout(async () => {
            const results = await searchCustomers(searchQuery);
            if (cancelled) return;
            const formattedResults: Customer[] = results.map(c => ({
                id: c.id, name: c.customer_name, email: c.email, company: c.company || '', address: c.address, phone: c.mobile_number, customerType: c.customer_type,
                dateAdded: c.created_at,
                avatar: '', totalOrders: 0, totalSpend: 0, lastOrder: '', status: 'Active'
            }));
            setSearchResults(formattedResults);
            setIsLoading(false);
        }, 400);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [searchQuery]);

    const handleSelectCustomer = (selected: Customer) => {
        onSelect(selected);
        setIsSearching(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const showNoResults = !isLoading && searchQuery.trim().length >= 2 && searchResults.length === 0;

    return (
        <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Customer</h2>
                {customer && !isSearching && (
                    <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => { onSelect(null); setIsSearching(true); }}>
                        Change
                    </Button>
                )}
            </div>

            {isSearching ? (
                <div className="relative">
                    <SearchInput
                        placeholder="Search by name, phone or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    {isLoading && <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-3.5 animate-spin" /> Searching...</p>}
                    {showNoResults && <p className="mt-2 text-sm text-muted-foreground">No customers found. Add them on the Customers page first.</p>}
                    {searchResults.length > 0 && (
                        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
                            {searchResults.map((result) => (
                                <li key={result.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectCustomer(result)}
                                        className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                                    >
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground">
                                            {result.name.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate font-medium text-foreground">{result.name}</span>
                                            <span className="block truncate text-xs text-muted-foreground">{[result.company, result.phone].filter(Boolean).join(' · ')}</span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : customer ? (
                <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">
                        {customer.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{customer.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{customer.company || customer.email}</p>
                    </div>
                </div>
            ) : null}
        </section>
    );
};

const SubmitButton = ({ disabled }: { disabled: boolean }) => {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="lg" disabled={pending || disabled} className="mt-5 w-full">
            {pending ? <><Loader2 className="animate-spin" /> Placing order...</> : <><CheckCircle2 /> Place order</>}
        </Button>
    );
}

const OrderSummary = ({ itemCount, lineCount, problems, disabled }: { itemCount: number, lineCount: number, problems: string[], disabled: boolean }) => (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-foreground">Summary</h2>
        <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Products</dt><dd className="font-medium tabular-nums">{lineCount}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Total quantity</dt><dd className="font-medium tabular-nums">{itemCount}</dd></div>
        </dl>
        {problems.length > 0 && (
            <div className="mt-4 rounded-lg bg-warning-soft p-3">
                <p className="mb-1 text-sm font-medium text-warning">Before placing the order:</p>
                <ul className="list-disc space-y-0.5 pl-5 text-sm text-foreground">
                    {problems.map(problem => <li key={problem}>{problem}</li>)}
                </ul>
            </div>
        )}
        <SubmitButton disabled={disabled} />
    </section>
);

export default PlaceOrderPage;
