"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatDisplayDate } from '@/lib/utils';
import { THEME_COLORS } from '@/lib/theme-colors';
import { EmptyState } from '@/components/ui/empty-state';

export interface ProductionChartData {
  date: string;
  count: number;
}

interface ProductionChartProps {
  data: ProductionChartData[];
}

const ProductionChart: React.FC<ProductionChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    day: formatDisplayDate(item.date).replace(/ \d{4}$/, ''),
    orders: item.count,
  }));

  return (
    <div className="h-full rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold text-foreground">Orders placed</h2>
      <p className="mb-4 text-sm text-muted-foreground">Order items placed per day, last 30 days</p>
      {chartData.length === 0 ? (
        <EmptyState icon={BarChart3} title="No orders in the last 30 days" className="border-0 py-16" />
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME_COLORS.border} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: THEME_COLORS.mutedForeground, fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: THEME_COLORS.mutedForeground, fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: THEME_COLORS.primarySoft }}
                contentStyle={{ backgroundColor: '#fff', border: `1px solid ${THEME_COLORS.border}`, borderRadius: '0.5rem', fontSize: 12 }}
              />
              <Bar dataKey="orders" fill={THEME_COLORS.chart1} name="Order items" maxBarSize={28} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ProductionChart;
