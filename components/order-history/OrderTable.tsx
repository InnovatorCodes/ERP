"use client";

import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, History } from "lucide-react";
import { OrderHistory } from "./types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type OrderTableProps = {
  orders: OrderHistory[];
  sort: { by: string; dir: string };
  setSort: React.Dispatch<React.SetStateAction<{ by: string; dir: string }>>;
  onViewOrder: (order: OrderHistory) => void;
  isLoading: boolean;
};

const SortableHead = ({ label, column, sort, onSort }: { label: string; column: string; sort: { by: string; dir: string }; onSort: (column: string) => void }) => {
  const active = sort.by === column;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}
      >
        {label}
        <Icon className={cn("size-3.5", !active && "opacity-40")} />
      </button>
    </TableHead>
  );
};

export default function OrderTable({ orders, sort, setSort, onViewOrder, isLoading }: OrderTableProps) {
  const handleSort = (by: string) => {
    setSort(sort.by === by ? { by, dir: sort.dir === "asc" ? "desc" : "asc" } : { by, dir: "desc" });
  };

  if (orders.length === 0 && !isLoading) {
    return <EmptyState icon={History} title="No delivered orders found" description="Try a different search or date range." />;
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card shadow-sm transition-opacity", isLoading && "opacity-60")}>
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Order</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Customer</TableHead>
            <SortableHead label="Ordered" column="orderDate" sort={sort} onSort={handleSort} />
            <SortableHead label="Due" column="dueDate" sort={sort} onSort={handleSort} />
            <SortableHead label="Delivered" column="deliveryDate" sort={sort} onSort={handleSort} />
            <TableHead>Status</TableHead>
            <TableHead className="pr-5"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="pl-5 font-medium">#{r.id}</TableCell>
              <TableCell>
                <p className="font-medium text-foreground">{r.productName}</p>
                <p className="text-xs text-muted-foreground">{r.productType}</p>
              </TableCell>
              <TableCell>{r.customerName}</TableCell>
              <TableCell className="whitespace-nowrap">{r.orderDate}</TableCell>
              <TableCell className="whitespace-nowrap">{r.dueDate}</TableCell>
              <TableCell className="whitespace-nowrap">{r.deliveryDate ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={r.status === 'Delivered' ? 'success' : 'secondary'}>{r.status}</Badge>
              </TableCell>
              <TableCell className="pr-5 text-right">
                <Button variant="ghost" size="sm" onClick={() => onViewOrder(r)} disabled={isLoading}>
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
