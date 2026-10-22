"use client";
import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface FilterPopoverProps {
    address: string;
    onApply: (address: string) => void;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({ address, onApply }) => {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(address);

    const apply = (value: string) => {
        onApply(value);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) setDraft(address); }}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="bg-card">
                    <SlidersHorizontal /> Filters
                    {address && <Badge variant="default" className="px-1.5">1</Badge>}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
                <form onSubmit={(e) => { e.preventDefault(); apply(draft); }} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="customer-address-filter">Address or location</Label>
                        <Input
                            id="customer-address-filter"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="e.g. Chennai"
                        />
                    </div>
                    <div className="flex justify-between">
                        <Button type="button" variant="ghost" size="sm" onClick={() => apply('')}>Reset</Button>
                        <Button type="submit" size="sm">Apply</Button>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    );
};

export default FilterPopover;
