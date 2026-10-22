"use server";

import { authorize, ROLES, viewers } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/utils";
import { OrderHistory } from "@/components/order-history/types";

type HistoryRow = {
  id: number;
  due_date: string;
  delivery_date: string | null;
  production_stage: string;
  product_type: string;
  model_name: string | null;
  order_date: string;
  customer_name: string | null;
  total_count: number;
};

export async function getOrderHistory(
  filters: { q: string; status: string; date_from?: string; date_to?: string },
  sort: { by: string; dir: string },
  page: number,
  pageSize: number
): Promise<{ orders: OrderHistory[]; totalCount: number }> {
  const auth = await authorize(viewers(ROLES.MANAGEMENT));
  if (!auth.ok) return { orders: [], totalCount: 0 };
  const offset = (page - 1) * pageSize;

  const { data, error } = await auth.supabase.rpc("search_and_paginate_order_history_v2", {
    p_search_term: filters.q,
    p_limit: pageSize,
    p_offset: offset,
    p_filters: { status: filters.status, date_from: filters.date_from, date_to: filters.date_to },
    p_sort: sort,
  });

  if (error) {
    console.error("Error fetching order history:", error);
    return { orders: [], totalCount: 0 };
  }

  const rows = (data ?? []) as HistoryRow[];
  if (rows.length === 0) {
    return { orders: [], totalCount: 0 };
  }

  // Due and delivery dates are calendar dates sent as midnight UTC timestamps.
  const orders: OrderHistory[] = rows.map((item) => ({
    id: item.id,
    customerName: item.customer_name ?? "",
    orderDate: formatDisplayDate(item.order_date),
    dueDate: formatDisplayDate(item.due_date.slice(0, 10)),
    deliveryDate: item.delivery_date ? formatDisplayDate(item.delivery_date.slice(0, 10)) : null,
    status: item.delivery_date ? "Delivered" : item.production_stage,
    productName: item.model_name ?? "",
    productType: item.product_type === "sofa" ? "Sofa" : "Bed",
  }));

  return { orders, totalCount: Number(rows[0].total_count) };
}
