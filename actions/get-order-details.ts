"use server";

import { authorize, ROLES, viewers } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/utils";
import { OrderDetails } from "@/components/order-history/types";

type OrderItemRow = {
  id: number;
  due_date: string;
  delivery_date: string | null;
  product_type: "sofa" | "bed";
  quantity: number;
  sofa_product_id: number | null;
  bed_product_id: number | null;
  sofa_products: { model_name: string } | null;
  bed_products: { model_name: string } | null;
  orders: {
    order_date: string;
    customer_details: { customer_name: string; address: string } | null;
  } | null;
};

export async function getOrderDetails(orderId: number): Promise<OrderDetails | null> {
  const auth = await authorize(viewers(ROLES.MANAGEMENT));
  if (!auth.ok) return null;

  const { data, error } = await auth.supabase
    .from("order_items")
    .select(
      `
      id,
      due_date,
      delivery_date,
      product_type,
      quantity,
      sofa_product_id,
      bed_product_id,
      sofa_products (model_name),
      bed_products (model_name),
      orders (
        order_date,
        customer_details (
          customer_name,
          address
        )
      )
    `
    )
    .eq("id", orderId)
    .single();

  if (error || !data) {
    console.error("Error fetching order details:", error);
    return null;
  }

  const item = data as unknown as OrderItemRow;
  const isSofa = item.product_type === "sofa";
  const productName = (isSofa ? item.sofa_products?.model_name : item.bed_products?.model_name) ?? "Unknown product";
  const customer = item.orders?.customer_details;

  const timeline = [{ key: "placed", label: "Order Placed", date: formatDisplayDate(item.orders?.order_date) }];
  if (item.delivery_date) {
    timeline.push({ key: "delivered", label: "Delivered", date: formatDisplayDate(item.delivery_date) });
  }

  return {
    id: item.id,
    customerName: customer?.customer_name ?? "Unknown customer",
    orderDate: formatDisplayDate(item.orders?.order_date),
    dueDate: formatDisplayDate(item.due_date),
    deliveryDate: item.delivery_date ? formatDisplayDate(item.delivery_date) : null,
    status: item.delivery_date ? "Delivered" : "In production",
    productName,
    productType: isSofa ? "Sofa" : "Bed",
    shippingAddress: customer?.address ?? "",
    items: [
      {
        name: productName,
        sku: `SKU-${isSofa ? item.sofa_product_id : item.bed_product_id}`,
        quantity: item.quantity,
      },
    ],
    timeline,
  };
}
