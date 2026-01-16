"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OrderDetails } from "./types";
import Timeline from "./Timeline";
import { Receipt, Info } from "lucide-react";

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
          className="absolute right-0 top-0 h-full bg-white shadow-2xl"
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

const formatCurrency = (amt: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amt);

export default function OrderDetailsDrawer({
  order,
  onClose,
  isLoading,
}: {
  order: OrderDetails | null;
  onClose: () => void;
  isLoading: boolean; // Add isLoading prop
}) {
  if (!order) return null;

  const subtotal = order.items.reduce((s, r) => s + r.lineTotal, 0);
  const tax = Math.round(subtotal * 0.18);
  const grand = subtotal + tax;

  return (
    <Drawer open={!!order} onClose={onClose} width={640}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}
      <div className="h-full flex flex-col">
        <div className="border-b p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Order</div>
            <div className="text-xl font-semibold">
              {order.id} • {order.customerName}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sm px-3 py-1 rounded border"
            disabled={isLoading} // Disable button when loading
          >
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

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium mb-1">Billing Address</div>
              <div className="text-sm text-gray-600">
                {order.billingAddress}
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium mb-1">Shipping Address</div>
              <div className="text-sm text-gray-600">
                {order.shippingAddress}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="border rounded-lg">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="font-medium">Items</div>
              <div className="text-xs text-gray-500">
                {order.items.length} lines
              </div>
            </div>
            <div className="divide-y">
              {order.items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 grid grid-cols-7 items-center text-sm"
                >
                  <div className="col-span-3">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-xs text-gray-500">{it.sku}</div>
                  </div>
                  <div className="text-right">{it.quantity}</div>
                  <div className="text-right">{formatCurrency(it.price)}</div>
                  <div className="col-span-2 text-right font-medium">
                    {formatCurrency(it.lineTotal)}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-right text-gray-500">Subtotal</div>
                <div className="text-right font-medium">
                  {formatCurrency(subtotal)}
                </div>
                <div className="text-right text-gray-500">GST (18%)</div>
                <div className="text-right font-medium">
                  {formatCurrency(tax)}
                </div>
                <div className="text-right text-gray-600">Grand Total</div>
                <div className="text-right font-semibold">
                  {formatCurrency(grand)}
                </div>
              </div>
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

          {/* Notes / Actions */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              Internal notes are visible only to staff.
            </div>
            <textarea
              className="w-full border rounded-lg p-3 text-sm"
              rows={3}
              placeholder="Add internal note (not visible to customer)"
            ></textarea>
            <div className="flex items-center gap-2 justify-end">
              <button className="px-3 py-2 text-sm rounded bg-blue-600 text-white">
                Save Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
