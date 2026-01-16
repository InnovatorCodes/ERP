"use client";
import React from 'react';
import { CustomerSearchResult } from '@/types/customers';
import { Briefcase, MapPin } from 'lucide-react';
import Image from 'next/image';

interface CustomerCardProps {
    customer: CustomerSearchResult;
    onSelect: () => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onSelect }) => {
    return (
        <div 
            onClick={onSelect}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-transparent hover:border-red-500"
        >
            <div className="p-5">
                <div className="flex items-center">
                    {customer.avatar ? (
                        <Image width={64} height={64} className="h-16 w-16 rounded-full object-cover" src={customer.avatar} alt={`${customer.name}'s avatar`} />
                    ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xl font-semibold">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : 'N/A'}
                        </div>
                    )}
                    <div className="ml-4">
                        <p className="text-lg font-bold text-gray-900">{customer.name}</p>
                        {customer.company && (
                            <p className="text-sm text-gray-600 flex items-center">
                                <Briefcase size={14} className="mr-1.5 text-gray-400" />
                                {customer.company}
                            </p>
                        )}
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center text-gray-500">
                            <MapPin size={14} className="mr-1.5" />
                            {customer.address}
                        </span>
                        <span className={`px-2.5 py-1 font-semibold rounded-full text-xs flex items-center gap-1
                        `}>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerCard;
