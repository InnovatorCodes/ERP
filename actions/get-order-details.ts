"use server";

import { createClient } from "@/utils/supabase/server";
import { OrderDetails } from "@/components/order-history/types";

function buildTimeline(orderDate: string, deliveryDate: string | null, status: string) {
    const steps = [{ key: "placed", label: "Order Placed", date: new Date(orderDate).toLocaleDateString() }];

    if (deliveryDate) {
        steps.push({ key: "delivered", label: "Delivered", date: new Date(deliveryDate).toLocaleDateString() });
    }
    return steps;
}

export async function getOrderDetails(orderId: number): Promise<OrderDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("order_items")
    .select(
      `
      id,
      due_date,
      delivery_date,
      production_stage,
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

  if (error) {
    console.error("Error fetching order details:", error);
    return null;
  }

  const item = data;

  // This is a mock, as price is not available in the schema
  const price = 1000;
  const lineTotal = price * item.quantity;

  const details: OrderDetails = {
    id: item.id,
    customerName: (item.orders as any).customer_details.customer_name,
    orderDate: new Date((item.orders as any).order_date).toLocaleDateString(),
    dueDate: new Date(item.due_date).toLocaleDateString(),
    deliveryDate: item.delivery_date ? new Date(item.delivery_date).toLocaleDateString() : null,
    status: item.delivery_date ? "Delivered" : item.production_stage,
    productName:
      item.product_type === "sofa"
        ? (item.sofa_products as any).model_name
        : (item.bed_products as any).model_name,
    productType: item.product_type === "sofa" ? "Sofa" : "Bed",
    shippingAddress: (item.orders as any).customer_details.address,
    billingAddress: (item.orders as any).customer_details.address,
    items: [
      {
        name:
          item.product_type === "sofa"
            ? (item.sofa_products as any).model_name
            : (item.bed_products as any).model_name,
        sku: `SKU-${item.product_type === "sofa" ? item.sofa_product_id : item.bed_product_id}`,
        quantity: item.quantity,
        price: price,
        lineTotal: lineTotal,
      },
    ],
    timeline: buildTimeline((item.orders as any).order_date, item.delivery_date, item.production_stage),
  };

  return details;
}
