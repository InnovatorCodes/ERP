import React from 'react';
import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { StageBadge } from '@/components/view-orders/badges';
import { formatDisplayDate } from '@/lib/utils';

export interface RecentOrderData {
  id: number;
  customer_name: string;
  product_name: string;
  active_stages: string[]; // stage codes, e.g. ["carpentry", "stitching"]
  due_date: string;
}

interface RecentOrdersProps {
  data: RecentOrderData[];
}

const RecentOrders: React.FC<RecentOrdersProps> = ({ data }) => (
  <div className="rounded-xl border bg-card shadow-sm">
    <div className="flex items-center justify-between p-5 pb-3">
      <div>
        <h2 className="font-semibold text-foreground">Recent orders</h2>
        <p className="text-sm text-muted-foreground">The five most recently placed order items</p>
      </div>
      <Link href="/view-orders" className="text-sm font-medium text-primary hover:underline">
        View all
      </Link>
    </div>
    {!data || data.length === 0 ? (
      <div className="p-5 pt-0">
        <EmptyState icon={Inbox} title="No orders yet" description="Orders appear here once they are placed." />
      </div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="pr-5">Stage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="pl-5 font-medium">#{order.id}</TableCell>
              <TableCell>{order.customer_name}</TableCell>
              <TableCell className="text-muted-foreground">{order.product_name}</TableCell>
              <TableCell>{formatDisplayDate(order.due_date)}</TableCell>
              <TableCell className="pr-5">
                <div className="flex flex-wrap gap-1.5">
                  {(order.active_stages ?? []).length > 0
                    ? order.active_stages.map((stage) => <StageBadge key={stage} stage={stage} />)
                    : <span className="text-muted-foreground">—</span>}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </div>
);

export default RecentOrders;
