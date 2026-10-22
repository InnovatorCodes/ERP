"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { OrderHistory, OrderDetails } from "./types";
import FiltersBar, { type Filters } from "./FiltersBar";
import OrderTable from "./OrderTable";
import OrderDetailsDrawer from "./OrderDetailsDrawer";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getOrderDetails } from "@/actions/get-order-details";
import { getOrderHistory } from "@/actions/get-order-history";

type Sort = { by: string; dir: string };

type OrderHistoryClientProps = {
  initialOrders: OrderHistory[];
  initialTotalCount: number;
};

const PAGE_SIZE = 12;

export default function OrderHistoryClient({ initialOrders, initialTotalCount }: OrderHistoryClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [filters, setFilters] = useState<Filters>({ q: "", status: "" });
  const [sort, setSort] = useState<Sort>({ by: "dueDate", dir: "desc" });
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const isInitialRender = useRef(true);

  // New filters or sort always start again from the first page.
  const applyFilters = useCallback((next: Filters) => {
    setFilters(next);
    setPage(1);
  }, []);
  const changeSort: React.Dispatch<React.SetStateAction<Sort>> = useCallback((next) => {
    setSort(next);
    setPage(1);
  }, []);

  useEffect(() => {
    // The server already rendered the first page.
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    let cancelled = false;
    // Debounce typing in the search box; other changes load immediately.
    const timer = setTimeout(async () => {
      setIsLoading(true);
      const result = await getOrderHistory(filters, sort, page, PAGE_SIZE);
      if (cancelled) return;
      setOrders(result.orders);
      setTotalCount(result.totalCount);
      setIsLoading(false);
    }, filters.q ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters, sort, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleViewOrder = async (order: OrderHistory) => {
    setIsLoadingDetails(true);
    const details = await getOrderDetails(order.id);
    setIsLoadingDetails(false);
    if (details) {
      setSelectedOrder(details);
    } else {
      toast.error("Could not load the order details.");
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Order History" description="Every order item that has been delivered." />

      <div className="space-y-4">
      <FiltersBar
        onApplyFilters={applyFilters}
        exportParams={{
          q: filters.q,
          date_from: filters.date_from,
          date_to: filters.date_to,
          sortBy: sort.by,
          sortDir: sort.dir,
        }}
      />

      <OrderTable
        orders={orders}
        sort={sort}
        setSort={changeSort}
        onViewOrder={handleViewOrder}
        isLoading={isLoading || isLoadingDetails}
      />

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        disabled={isLoading}
        summary={`${totalCount} delivered order item${totalCount === 1 ? '' : 's'}`}
      />
      </div>

      <OrderDetailsDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </PageContainer>
  );
}
