import React from 'react';
import { format } from 'date-fns';

// --- Type Definitions ---

export interface RecentOrderData {
  id: number;
  customer_name: string;
  product_name: string;
  active_stages: string[]; // Changed from production_stage to active_stages (array of strings)
  due_date: string;
}

interface RecentOrdersProps {
  data: RecentOrderData[];
}

// Recent Orders Component
const RecentOrders: React.FC<RecentOrdersProps> = ({ data }) => {
  // Handle cases where data might be null or undefined
  if (!data) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md col-span-1 lg:col-span-3">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h3>
        <p className="text-gray-500">No recent orders to display.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    carpentry: 'bg-yellow-100 text-yellow-800',
    webbing: 'bg-blue-100 text-blue-800',
    marking_cutting: 'bg-indigo-100 text-indigo-800',
    stitching: 'bg-purple-100 text-purple-800',
    cladding: 'bg-pink-100 text-pink-800',
    final_qc: 'bg-green-100 text-green-800',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md col-span-1 lg:col-span-3">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-gray-500">
              <th className="py-3 pr-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 pl-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((order) => (
              <tr key={order.id} className="border-b border-gray-100 last:border-none hover:bg-gray-50">
                <td className="py-3 pr-4 font-semibold text-red-600">{order.id}</td>
                <td className="py-3 px-4 text-gray-800">{order.customer_name}</td>
                <td className="py-3 px-4 text-gray-600">{order.product_name}</td>
                <td className="py-3 px-4 text-gray-800 font-medium">{format(new Date(order.due_date), 'MMM dd, yyyy')}</td>
                <td className="py-3 pl-4">
                  <div className="flex flex-wrap gap-1">
                    {(order.active_stages || []).map((stage) => (
                      <span key={stage} className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusColors[stage] ?? 'bg-gray-100 text-gray-800'}`}>
                        {stage}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;
