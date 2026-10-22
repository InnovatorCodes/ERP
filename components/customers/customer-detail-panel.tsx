"use client";
import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, ShoppingCart, Calendar, Clock, Loader2 } from 'lucide-react';
import { Customer } from '@/types/customers';
import { getCustomerDetails } from '@/actions/get-customer-details';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDisplayDate } from '@/lib/utils';

interface CustomerDetailPanelProps {
    customerId: string;
    onClose: () => void;
}

const DetailItem = ({ Icon, label, value }: { Icon: React.ElementType; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3 text-sm">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
            <p className="text-muted-foreground">{label}</p>
            <p className="break-words font-medium text-foreground">{value || '—'}</p>
        </div>
    </div>
);

const CustomerDetailPanel: React.FC<CustomerDetailPanelProps> = ({ customerId, onClose }) => {
    const [customer, setCustomer] = useState<(Customer & { status?: string }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        getCustomerDetails(customerId).then((details) => {
            if (cancelled) return;
            setCustomer(details);
            setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [customerId]);

    return (
        <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b p-5">
                {isLoading || !customer ? (
                    <p className="font-semibold text-foreground">Customer details</p>
                ) : (
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-lg font-semibold text-foreground">{customer.name}</p>
                            {customer.company && <p className="truncate text-sm text-muted-foreground">{customer.company}</p>}
                            {customer.status && <Badge variant="secondary" className="mt-1 uppercase tracking-wide">{customer.status}</Badge>}
                        </div>
                    </div>
                )}
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close customer details">
                    <X />
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Loading...
                </div>
            ) : !customer ? (
                <p className="p-10 text-center text-sm text-muted-foreground">Customer not found.</p>
            ) : (
                <div className="space-y-6 p-5">
                    <section className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</h3>
                        <DetailItem Icon={Mail} label="Email" value={customer.email} />
                        <DetailItem Icon={Phone} label="Phone" value={customer.phone} />
                        <DetailItem Icon={MapPin} label="Address" value={customer.address} />
                    </section>
                    <section className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Orders</h3>
                        <DetailItem Icon={ShoppingCart} label="Total orders" value={String(customer.totalOrders ?? 0)} />
                        <DetailItem Icon={Clock} label="Last order" value={formatDisplayDate(customer.lastOrder)} />
                        <DetailItem Icon={Calendar} label="Customer since" value={formatDisplayDate(customer.dateAdded)} />
                    </section>
                </div>
            )}
        </div>
    );
};

export default CustomerDetailPanel;
