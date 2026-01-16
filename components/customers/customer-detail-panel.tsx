"use client";
import React, { useState, useEffect } from 'react';
import { Customer } from '@/types/customers';
import { getCustomerDetails } from '@/actions/get-customer-details';
import { X, Mail, Phone, MapPin, DollarSign, ShoppingCart, Calendar, Clock } from 'lucide-react';
import Image from 'next/image';

interface CustomerDetailPanelProps {
    customerId: string;
    onClose: () => void;
}

interface DetailItemProps {
    Icon: React.ElementType;
    label: string;
    value: string | number;
}

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        }).format(date);
    } catch (error) {
        console.error("Error formatting date:", dateString, error);
        return 'Invalid Date';
    }
};

const DetailItem: React.FC<DetailItemProps> = ({ Icon, label, value }) => (
    <div className="flex items-start text-sm">
        <Icon className="h-4 w-4 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex flex-col">
            <span className="text-gray-500">{label}</span>
            <span className="text-gray-900 font-medium">{value}</span>
        </div>
    </div>
);

const CustomerDetailPanel: React.FC<CustomerDetailPanelProps> = ({ customerId, onClose }) => {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            const details = await getCustomerDetails(customerId);
            setCustomer(details);
            setIsLoading(false);
        };

        if (customerId) {
            fetchDetails();
        }
    }, [customerId]);

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col items-center justify-center">
                <p className="text-gray-500 font-semibold">Loading customer details...</p>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col items-center justify-center">
                <p className="text-red-500 font-semibold">Customer not found.</p>
                <button onClick={onClose} className="mt-4 text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="h-6 w-6" />
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    {customer.avatar ? (
                        <Image width={64} height={64} className="h-16 w-16 rounded-full object-cover" src={customer.avatar} alt={`${customer.name}'s avatar`} />
                    ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xl font-semibold">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : 'N/A'}
                        </div>
                    )}
                    <div className="ml-4">
                        <h3 className="text-2xl font-bold text-gray-900">{customer.name}</h3>
                        <p className="text-gray-500">{customer.company}</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="h-6 w-6" />
                </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                {/* Contact Info */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Information</h4>
                    <div className="space-y-4">
                        <DetailItem Icon={Mail} label="Email" value={customer.email} />
                        <DetailItem Icon={Phone} label="Phone" value={customer.phone} />
                        <DetailItem Icon={MapPin} label="Location" value={customer.address} />
                    </div>
                </div>

                {/* Financials */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Financials</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem Icon={DollarSign} label="Total Spend" value={`$${(customer.totalSpend ?? 0).toLocaleString()}`} />
                        <DetailItem Icon={ShoppingCart} label="Total Orders" value={customer.totalOrders} />
                    </div>
                </div>

                {/* History */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">History</h4>
                    <div className="space-y-4"> 
                        <DetailItem Icon={Calendar} label="Customer Since" value={formatDate(customer.dateAdded)} />
                        <DetailItem Icon={Clock} label="Last Order" value={formatDate(customer.lastOrder)} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailPanel;
