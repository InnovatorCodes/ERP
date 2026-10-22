"use client";
import React from 'react';
import { Briefcase, MapPin } from 'lucide-react';
import { CustomerSearchResult } from '@/types/customers';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CustomerCardProps {
    customer: CustomerSearchResult & { status?: string };
    selected?: boolean;
    onSelect: () => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, selected = false, onSelect }) => (
    <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
            "w-full rounded-xl border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected && "border-primary ring-1 ring-primary"
        )}
    >
        <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-foreground">
                {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{customer.name}</p>
                {customer.company && (
                    <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                        <Briefcase className="size-3.5 shrink-0" />
                        {customer.company}
                    </p>
                )}
            </div>
            {customer.status && (
                <Badge variant="secondary" className="uppercase tracking-wide">{customer.status}</Badge>
            )}
        </div>
        <p className="mt-4 flex items-start gap-1.5 border-t pt-3 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-clamp-2">{customer.address}</span>
        </p>
    </button>
);

export default CustomerCard;
