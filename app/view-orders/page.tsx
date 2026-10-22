import { searchOrderItems } from "@/actions/search-order-items";
import ViewOrdersClient from "@/components/view-orders/view-orders-client";

export const revalidate = 0;
export const metadata = { title: 'Production' };

export default async function ViewOrdersPage() {
  // First page of the list view; the client takes over from here.
  const { orders, totalCount } = await searchOrderItems(
    null,
    1,
    10,
    { stage: {}, priority: {}, overdue: {} },
    { key: 'priority', direction: 'desc' }
  );
  return <ViewOrdersClient initialOrders={orders} totalCount={totalCount} />;
}
