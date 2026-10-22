"use client";

import React, { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { addCustomerAction } from '@/actions/add-customer';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddCustomerModalProps {
    /** Called once when the modal should close; `added` is true after a successful save. */
    onClose: (added: boolean) => void;
}

const CUSTOMER_TYPES = [
    { value: 'b2b', label: 'B2B' },
    { value: 'b2c', label: 'B2C' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'interior design', label: 'Interior Design' },
];

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save customer'}
        </Button>
    );
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ onClose }) => {
    const [state, formAction] = useActionState(addCustomerAction, { message: '' });

    // The parent unmounts this modal on close, so this runs at most once per save.
    useEffect(() => {
        if (state.message === 'success') {
            onClose(true);
        }
    }, [state, onClose]);

    return (
        <Dialog open onOpenChange={(open) => !open && onClose(false)}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add customer</DialogTitle>
                    <DialogDescription>Customers can be selected when placing an order.</DialogDescription>
                </DialogHeader>

                <form action={formAction} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="customer-name">Full name</Label>
                            <Input id="customer-name" name="name" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer-company">Company <span className="font-normal text-muted-foreground">(optional)</span></Label>
                            <Input id="customer-company" name="company" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer-email">Email</Label>
                            <Input id="customer-email" name="email" type="email" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer-phone">Phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
                            <Input id="customer-phone" name="phone" type="tel" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="customer-type">Customer type</Label>
                            <Select name="customerType" required>
                                <SelectTrigger id="customer-type" className="w-full">
                                    <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CUSTOMER_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="customer-address">Address</Label>
                            <Textarea id="customer-address" name="address" rows={3} required />
                        </div>
                    </div>

                    {state?.message && state.message !== 'success' && (
                        <p role="alert" className="rounded-lg bg-destructive-soft p-3 text-sm text-destructive">{state.message}</p>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onClose(false)}>Cancel</Button>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddCustomerModal;
