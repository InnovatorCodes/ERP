"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Order, Stage } from './types';
import { STAGE_CONFIG, PRIORITY_CONFIG } from './data';
import { Button } from '../ui/button';
import { markAsDelivered } from '@/actions/mark-as-delivered';

interface KanbanBoardProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ orders, onOrderSelect }) => {
  const allStages = Object.keys(STAGE_CONFIG) as Stage[];

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
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {allStages.map(stageKey => {
        const stageOrders = orders.filter(o => o.stage.includes(stageKey));
        return (
          <div key={stageKey} className="bg-gray-50 rounded-xl flex flex-col border border-gray-200/50">
            <div className="p-4 border-b border-gray-200/50">
              <h3 className="font-semibold text-black flex items-center">
                <span
                  className="w-2.5 h-2.5 rounded-full mr-3"
                  style={{ backgroundColor: STAGE_CONFIG[stageKey].color }}
                ></span>
                {STAGE_CONFIG[stageKey].label}
                <span className="ml-auto text-sm font-normal bg-gray-200 text-gray-800 w-6 h-6 flex items-center justify-center rounded-full">
                  {stageOrders.length}
                </span>
              </h3>
            </div>
            <div className="p-4 space-y-4 flex-grow min-h-[150px]">
              {stageOrders.length > 0 ? (
                stageOrders.map(order => (
                  <motion.div
                    key={order.id}
                    layout
                    onClick={() => onOrderSelect(order)}
                    className="bg-white p-4 rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200 border-l-4"
                    style={{ borderColor: PRIORITY_CONFIG[order.priority].color }}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-black">{order.id}</p>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: PRIORITY_CONFIG[order.priority].color }}
                      >
                        {PRIORITY_CONFIG[order.priority].label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 truncate mt-1">{order.product}</p>
                    <p className="text-xs text-gray-500 mt-2">{order.customer}</p>
                    {order.stage === 'out_for_delivery' && (
                      <Button onClick={(e) => handleMarkAsDelivered(order.id, e)} size="sm" className="mt-2">
                        Mark as Delivered
                      </Button>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="text-center text-gray-400 text-sm italic pt-8">No orders here.</div>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};

export default KanbanBoard;
