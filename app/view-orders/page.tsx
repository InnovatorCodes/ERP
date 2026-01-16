import { searchOrderItems } from "@/actions/search-order-items";
import ViewOrdersClient from "@/components/view-orders/view-orders-client";

export const revalidate = 0;

export default async function ViewOrdersPage() {
  // Use searchOrderItems for initial load, passing null for query and default values for other parameters
  const { orders, totalCount } = await searchOrderItems(
    null,
    1,
    10,
    { stage: {}, priority: {}, overdue: {} },
    { key: 'priority', direction: 'desc' }
  );
  return (
    <div className="relative bg-white min-h-screen" suppressHydrationWarning>
      <ViewOrdersClient initialOrders={orders} totalCount={totalCount} />
    </div>
  );
}
