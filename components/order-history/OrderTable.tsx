"use client";

import React from "react";
import { OrderHistory } from "./types";

type OrderTableProps = {
  orders: OrderHistory[];
  sort: { by: string; dir: string };
  setSort: React.Dispatch<React.SetStateAction<{ by: string; dir: string }>>;
  onViewOrder: (order: OrderHistory) => void;
  isLoading: boolean; // Add isLoading prop
};

const Th = ({ label }: { label: string }) => (
  <th className="p-3 text-left text-gray-600 text-xs font-semibold uppercase tracking-wide">
    {label}
  </th>
);

const ThSort = ({
  label,
  active,
  dir,
  onClick,
}: {
  label:string;
  active: boolean;
  dir: string;
  onClick: () => void;
}) => (
  <th className="p-3 text-left text-gray-600 text-xs font-semibold uppercase tracking-wide">
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 ${
        active ? "text-blue-700" : ""
      }`}
    >
      {label}
      <span className="text-gray-400">
        {active ? (dir === "desc" ? "↓" : "↑") : ""}
      </span>
    </button>
  </th>
);

export default function OrderTable({ orders, sort, setSort, onViewOrder, isLoading }: OrderTableProps) {
  const handleSort = (by: string) => {
    if (sort.by === by) {
      setSort({ by, dir: sort.dir === "asc" ? "desc" : "asc" });
    } else {
      setSort({ by, dir: "desc" });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <Th label="Order ID" />
              <Th label="Product Name" />
              <Th label="Customer" />
              <ThSort
                label="Order Date"
                active={sort.by === "orderDate"}
                dir={sort.dir}
                onClick={() => handleSort("orderDate")}
              />
              <ThSort
                label="Due Date"
                active={sort.by === "dueDate"}
                dir={sort.dir}
                onClick={() => handleSort("dueDate")}
              />
              <ThSort
                label="Delivery Date"
                active={sort.by === "deliveryDate"}
                dir={sort.dir}
                onClick={() => handleSort("deliveryDate")}
              />
              <Th label="Status" />
              <Th label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-3 font-medium">{r.id}</td>
                <td className="p-3">{r.productName}</td>
                <td className="p-3">{r.customerName}</td>
                <td className="p-3">{r.orderDate}</td>
                <td className="p-3">{r.dueDate}</td>
                <td className="p-3">{r.deliveryDate ?? 'Not Delivered'}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    {r.status.split(',').map(stage => (
                      <span
                        key={stage}
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          stage.trim() === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {stage.trim()}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => onViewOrder(r)}
                    className="text-blue-600 hover:underline text-sm"
                    disabled={isLoading} // Disable button when loading
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
