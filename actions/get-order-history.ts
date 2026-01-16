"use server";

import { createClient } from "@/utils/supabase/server";
import { OrderHistory } from "@/components/order-history/types";

export async function getOrderHistory(
  filters: { q: string; status: string; date_from?: string; date_to?: string },
  sort: { by: string; dir: string },
  page: number,
  pageSize: number
): Promise<{ orders: OrderHistory[]; totalCount: number }> {
  const supabase = await createClient();
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc("search_and_paginate_order_history_v2", {
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
  
  if (!data || data.length === 0) {
    return { orders: [], totalCount: 0 };
  }

  const totalCount = data[0]?.total_count || 0;

  const orders: OrderHistory[] = data.map((item: any) => ({
    id: item.id,
    customerName: item.customer_name,
    orderDate: new Date(item.order_date).toLocaleDateString(),
    dueDate: new Date(item.due_date).toLocaleDateString(),
    deliveryDate: item.delivery_date ? new Date(item.delivery_date).toLocaleDateString() : null,
    status: item.delivery_date ? "Delivered" : item.production_stage,
    productName: item.model_name,
    productType: item.product_type === "sofa" ? "Sofa" : "Bed",
  }));

  return { orders, totalCount };
}
