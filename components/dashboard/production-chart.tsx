"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

// --- Type Definitions ---

export interface ProductionChartData {
  date: string;
  count: number;
}

interface ProductionChartProps {
  data: ProductionChartData[];
}

// Production Chart Component
const ProductionChart: React.FC<ProductionChartProps> = ({ data }) => {
  const formattedData = data.map(item => ({
    day: format(new Date(item.date), 'MMM dd'),
    produced: item.count,
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Orders Started (Last 30 Days)</h3>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip
                        cursor={{ fill: 'rgba(239, 68, 68, 0.1)' }}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '0.5rem' }}
                    />
                    <Legend iconType="circle" iconSize={10} />
                    <Bar dataKey="produced" fill="#EF4444" name="Orders Started" barSize={30} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export default ProductionChart;
