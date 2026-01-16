"use client";
"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Order } from './types';
import { PRIORITY_CONFIG, STAGE_CONFIG } from './data';
import { Button } from '../ui/button';
import { markAsDelivered } from '@/actions/mark-as-delivered';

interface OrderTableProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
}

const formatStageText = (stage: string) => {
  if (stage === 'out_for_delivery') {
    return 'Out for Delivery';
  }
  return stage;
};

const OrderTable: React.FC<OrderTableProps> = ({ orders, onOrderSelect }) => {
  const handleMarkAsDelivered = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsDelivered(orderId);
      // Optionally, refresh data or update UI state here
    } catch (error) {
      console.error("Failed to mark as delivered:", error);
      // Handle error state in UI
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
            const isOverdue = new Date(order.dueDate) < new Date();
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
                <td className={`px-6 py-5 whitespace-nowrap text-sm ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-600'}`} suppressHydrationWarning>
                  {new Date(order.dueDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {order.stage.split(',').map(stage => {
                      const stageKey = stage.trim();
                      const isValidStage = (key: string): key is keyof typeof STAGE_CONFIG => key in STAGE_CONFIG;

                      if (isValidStage(stageKey)) {
                        const config = STAGE_CONFIG[stageKey];
                        return (
                          <span
                            key={stageKey}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full text-white"
                            style={{ backgroundColor: config.color }}
                          >
                            {config.label}
                          </span>
                        );
                      }
                      return (
                        <span key={stageKey} className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full text-white bg-gray-400">
                          {formatStageText(stageKey)}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  {order.stage === 'out_for_delivery' && (
                    <Button onClick={(e) => handleMarkAsDelivered(order.id, e)} size="sm">
                      Mark as Delivered
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
