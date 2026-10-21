"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Order } from './types';
import { PRIORITY_CONFIG, STAGE_CONFIG } from './data';
import { Button } from '../ui/button';
import { markAsDelivered } from '@/actions/mark-as-delivered';
import { formatDisplayDate, isOverdue } from '@/lib/utils';

interface OrderTableProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
  onOrdersChanged: () => void;
}

const isKnownStage = (key: string): key is keyof typeof STAGE_CONFIG => key in STAGE_CONFIG;

const OrderTable: React.FC<OrderTableProps> = ({ orders, onOrderSelect, onOrdersChanged }) => {
  const [deliveringId, setDeliveringId] = useState<string | null>(null);

  const handleMarkAsDelivered = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeliveringId(orderId);
    const result = await markAsDelivered(orderId);
    setDeliveringId(null);

    if (result.success) {
      toast.success(`Order item ${orderId} marked as delivered.`);
      onOrdersChanged();
    } else {
      toast.error(result.error ?? 'Failed to mark as delivered.');
    }
  };

  return (
    <motion.div className="overflow-x-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200/50">
            {['Priority', 'Order ID', 'Product', 'Product Type', 'Customer', 'Due Date', 'Stage', 'Actions'].map(h => (
              <th key={h} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map(order => {
            const overdue = order.stage !== 'delivered' && isOverdue(order.dueDate);
            return (
              <tr
                key={order.id}
                onClick={() => onOrderSelect(order)}
                className="hover:bg-gray-50/50 cursor-pointer transition-colors duration-200"
              >
                <td className="px-6 py-5 whitespace-nowrap">
                  <span
                    className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full text-white"
                    style={{ backgroundColor: PRIORITY_CONFIG[order.priority].color }}
                  >
                    {PRIORITY_CONFIG[order.priority].label}
                  </span>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-black">{order.id}</td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-800">{order.product}</td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-800">{order.productType}</td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">{order.customer}</td>
                <td className={`px-6 py-5 whitespace-nowrap text-sm ${overdue ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
                  {formatDisplayDate(order.dueDate)}
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {order.stage.split(',').map(stage => {
                      const stageKey = stage.trim();
                      return isKnownStage(stageKey) ? (
                        <span
                          key={stageKey}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: STAGE_CONFIG[stageKey].color }}
                        >
                          {STAGE_CONFIG[stageKey].label}
                        </span>
                      ) : (
                        <span key={stageKey} className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full text-white bg-gray-400">
                          {stageKey}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  {order.stage === 'out_for_delivery' && (
                    <Button
                      onClick={(e) => handleMarkAsDelivered(order.id, e)}
                      disabled={deliveringId === order.id}
                      size="sm"
                    >
                      {deliveringId === order.id ? 'Saving...' : 'Mark as Delivered'}
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  );
};

export default OrderTable;
