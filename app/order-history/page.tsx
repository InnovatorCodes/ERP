import { getOrderHistory } from "@/actions/get-order-history";
import OrderHistoryClient from "@/components/order-history/OrderHistoryClient";

export const metadata = { title: 'Order History' };

export default async function OrderHistoryPage() {
  const { orders, totalCount } = await getOrderHistory(
    { q: "", status: "", date_from: undefined, date_to: undefined },
    { by: "dueDate", dir: "desc" },
    1,
    12
  );

  return <OrderHistoryClient initialOrders={orders} initialTotalCount={totalCount} />;
}
