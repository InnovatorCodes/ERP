import { getOrderHistory } from "@/actions/get-order-history";
import OrderHistoryClient from "@/components/order-history/OrderHistoryClient";

export default async function OrderHistoryPage() {
  const { orders, totalCount } = await getOrderHistory(
    { q: "", status: "", date_from: undefined, date_to: undefined },
    { by: "dueDate", dir: "desc" },
    1,
    12
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Order History</h1>
        <OrderHistoryClient initialOrders={orders} initialTotalCount={totalCount} />
      </div>
    </div>
  );
}
