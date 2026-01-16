"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { OrderHistory, OrderDetails } from "./types";
import FiltersBar from "./FiltersBar";
import OrderTable from "./OrderTable";
import Pagination from "./Pagination";
import OrderDetailsDrawer from "./OrderDetailsDrawer";
import KPI from "./KPI";
import { getOrderDetails } from "@/actions/get-order-details";
import { getOrderHistory } from "@/actions/get-order-history";

const debounce = <F extends (...args: Parameters<F>) => ReturnType<F>>(func: F, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

type OrderHistoryClientProps = {
  initialOrders: OrderHistory[];
  initialTotalCount: number;
};

export default function OrderHistoryClient({ initialOrders, initialTotalCount }: OrderHistoryClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [filters, setFilters] = useState<{ q: string; status: string; date_from?: string; date_to?: string }>({ q: "", status: "" });
  const [sort, setSort] = useState({ by: "dueDate", dir: "desc" });
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 12;

  const fetchOrders = useCallback(async (currentFilters: typeof filters, currentSort: typeof sort, currentPage: number) => {
    setIsLoading(true);
    const { orders: newOrders, totalCount: newTotalCount } = await getOrderHistory(
      currentFilters,
      currentSort,
      currentPage,
      pageSize
    );
    setOrders(newOrders);
    setTotalCount(newTotalCount);
    setIsLoading(false);
  }, [pageSize]);

  const debouncedFetch = useMemo(() => debounce(fetchOrders, 300), [fetchOrders]);

  useEffect(() => {
    if (filters.q) {
      debouncedFetch(filters, sort, page);
    } else {
      fetchOrders(filters, sort, page);
    }
  }, [filters, sort, page, debouncedFetch, fetchOrders]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleViewOrder = async (order: OrderHistory) => {
    const details = await getOrderDetails(order.id);
    setSelectedOrder(details);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPI title="Total Orders" value={totalCount} />
        <KPI
          title="Completed Orders"
          value={orders.filter((r) => r.status === "Delivered").length}
        />
        <KPI
          title="Pending Orders"
          value={orders.filter((r) => r.status !== "Delivered").length}
        />
      </div>

      <FiltersBar
        onApplyFilters={setFilters}
        count={totalCount}
      />

      <OrderTable
        orders={orders}
        sort={sort}
        setSort={setSort}
        onViewOrder={handleViewOrder}
        isLoading={isLoading} // Pass isLoading to OrderTable
      />

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />

      <OrderDetailsDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        isLoading={isLoading} // Pass isLoading to OrderDetailsDrawer
      />
    </div>
  );
}
