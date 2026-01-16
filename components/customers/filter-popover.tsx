"use client";
import React, { useState } from 'react';

interface FilterPopoverProps {
    initialFilters: {
        address: string;
        minSpend: string;
        maxSpend: string;
    };
    onApply: (filters: FilterPopoverProps['initialFilters']) => void;
    onClose: () => void;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({ initialFilters, onApply, onClose }) => {
    const [filters, setFilters] = useState(initialFilters);

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        setFilters({ address: '', minSpend: '', maxSpend: '' });
        onApply({ address: '', minSpend: '', maxSpend: '' });
        onClose();
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border z-10">
            <div className="p-4">
                <h4 className="font-semibold text-gray-800 mb-4">Filter Customers</h4>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="address"
                        value={filters.address}
                        onChange={e => setFilters(f => ({ ...f, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                        type="number"
                        placeholder="Min. Total Spend"
                        value={filters.minSpend}
                        onChange={e => setFilters(f => ({ ...f, minSpend: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                        type="number"
                        placeholder="Max. Total Spend"
                        value={filters.maxSpend}
                        onChange={e => setFilters(f => ({ ...f, maxSpend: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 flex justify-between rounded-b-xl">
                <button onClick={handleReset} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md">Reset</button>
                <button onClick={handleApply} className="px-4 py-2 text-sm bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Apply</button>
            </div>
        </div>
    );
};

export default FilterPopover;
