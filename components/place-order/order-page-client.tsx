'use client';
import React, { useState, useActionState, useEffect, useRef, useCallback } from 'react';
import { Plus, CheckCircle, Search } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Product, ProductWithFiles } from '@/types/products';
import { Customer } from '@/types/customers';
import { searchCustomers } from '@/actions/search-customers';
import getProductDetails from '@/actions/get-product-details';
import { submitOrder } from '@/actions/submit-order';
import { Input } from '@/components/ui/input';
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

    useEffect(() => {
        if (state.success) {
            setOrderItems([{ ...initialProductState, uniqueId: Date.now() }]);
        }
    }, [state.success]);

    const handleItemChange = useCallback(<K extends keyof OrderItem>(index: number, field: K, value: OrderItem[K]) => {
        setOrderItems(currentItems => {
            const newItems = [...currentItems];
            const updatedItem = { ...newItems[index], [field]: value };

            if (field === 'type') {
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
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-full font-sans">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Place New Order</h1>
                <form action={formAction} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {selectedCustomer && <input type="hidden" name="selectedCustomerId" value={selectedCustomer.id} />}
                    <input type="hidden" name="totalProducts" value={orderItems.length} />
                    <div className="lg:col-span-2 space-y-6">
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
                        <button type="button" onClick={addNewItem} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 text-gray-500 font-semibold rounded-lg hover:bg-gray-200 hover:border-gray-400 transition">
                            <Plus size={20} /> Add Another Product
                        </button>
                    </div>
                    <div className="lg:col-span-1 space-y-6 sticky top-6">
                        <CustomerSelector customer={selectedCustomer} onSelect={setSelectedCustomer} />
                        <OrderSummary itemCount={orderItems.reduce((sum, item) => sum + item.quantity, 0)} disabled={hasNameError || !selectedCustomer} />
                        {state?.message && (
                             <div className={`flex items-start gap-3 p-4 rounded-lg ${state.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                 <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                 <p className="text-sm font-medium">{state.message}</p>
                             </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

const CustomerSelector = ({ customer, onSelect }: { customer: Customer | null, onSelect: (customer: Customer | null) => void }) => {
    const [isSearching, setIsSearching] = useState(!customer);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (searchQuery.length < 2) { setSearchResults([]); return; }
        setIsLoading(true);
        const timer = setTimeout(async () => {
            const results = await searchCustomers(searchQuery);
            const formattedResults: Customer[] = results.map(c => ({
                id: c.id, name: c.customer_name, email: c.email, company: c.company || 'N/A', address: c.address, phone: c.mobile_number, customerType: c.customer_type,
                dateAdded: new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                avatar: '', totalOrders: 0, totalSpend: 0, lastOrder: 'N/A', status: 'Active'
            }));
            setSearchResults(formattedResults);
            setIsLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectCustomer = (selected: Customer) => {
        onSelect(selected);
        setIsSearching(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md" ref={searchRef}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl text-gray-800">Customer</h3>
                {customer && !isSearching && (<button type='button' onClick={() => { onSelect(null); setIsSearching(true); }} className="text-red-600 font-semibold text-sm">Change</button>)}
            </div>

            {isSearching ? (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input type="text" placeholder="Search by name, phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-full" autoFocus />
                    {isLoading && <p className="text-sm text-gray-500 mt-2">Searching...</p>}
                    {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {searchResults.map((result) => (
                                <div key={result.id} onClick={() => handleSelectCustomer(result)} className="flex items-center p-3 hover:bg-gray-100 cursor-pointer">
                                    <div className="w-10 h-10 rounded-full mr-3 bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                                        {result.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{result.name}</p>
                                        <p className="text-sm text-gray-500">{result.phone}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : customer ? (
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full mr-4 bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-xl">
                        {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.company}</p>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

const SubmitButton = ({ disabled }: { disabled: boolean }) => {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending || disabled} className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed">
            {pending ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Placing Order...</>) : (<><CheckCircle size={20} />Confirm & Place Order</>)}
        </button>
    );
}

const OrderSummary = ({  itemCount, disabled }: {  itemCount: number, disabled: boolean }) => (
    <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-bold text-xl mb-4 text-gray-800">Order Summary</h3>
        <div className="space-y-2 text-gray-600">
            <div className="flex justify-between"><p>Total Items</p><p className="font-medium">{itemCount}</p></div>
        </div>
        <SubmitButton disabled={disabled} />
    </div>
);

export default PlaceOrderPage;
