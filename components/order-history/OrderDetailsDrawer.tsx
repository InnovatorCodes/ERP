"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OrderDetails } from "./types";
import Timeline from "./Timeline";
import { Receipt } from "lucide-react";

const Drawer = ({
  open,
  onClose,
  children,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50">
        <motion.div
          className="absolute inset-0 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.aside
          className="absolute right-0 top-0 h-full bg-white shadow-2xl max-w-full"
          style={{ width }}
          initial={{ x: width }}
          animate={{ x: 0 }}
          exit={{ x: width }}
          transition={{ type: "tween", duration: 0.25 }}
        >
          {children}
        </motion.aside>
      </div>
    )}
  </AnimatePresence>
);

// Prices are not stored yet, so this shows what was ordered and when, without amounts.
export default function OrderDetailsDrawer({
  order,
  onClose,
}: {
  order: OrderDetails | null;
  onClose: () => void;
}) {
  if (!order) return null;

  return (
    <Drawer open={!!order} onClose={onClose} width={640}>
      <div className="h-full flex flex-col">
        <div className="border-b p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Order item</div>
            <div className="text-xl font-semibold">
              {order.id} • {order.customerName}
            </div>
          </div>
          <button onClick={onClose} className="text-sm px-3 py-1 rounded border">
            Close
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500">Order Date</div>
              <div className="font-medium">{order.orderDate}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500">Due Date</div>
              <div className="font-medium">{order.dueDate}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500">Delivery Date</div>
              <div className="font-medium">{order.deliveryDate ?? 'Not Delivered'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500">Order Status</div>
              <div
                className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                  order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {order.status}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="border rounded-lg p-4">
            <div className="text-sm font-medium mb-1">Delivery Address</div>
            <div className="text-sm text-gray-600">{order.shippingAddress || 'Not recorded'}</div>
          </div>

          {/* Items */}
          <div className="border rounded-lg">
            <div className="p-3 border-b font-medium">Items</div>
            <div className="divide-y">
              {order.items.map((it, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-xs text-gray-500">{it.sku}</div>
                  </div>
                  <div className="text-gray-600">Qty {it.quantity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4" />
              <div className="font-medium">Order Timeline</div>
            </div>
            <Timeline steps={order.timeline} />
          </div>
        </div>
      </div>
    </Drawer>
  );
}
