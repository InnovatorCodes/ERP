"use client";
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Truck } from 'lucide-react';
import { Order } from './types';
import { PriorityBadge, StageBadges } from './badges';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { markAsDelivered } from '@/actions/mark-as-delivered';
import { cn, formatDisplayDate, isOverdue } from '@/lib/utils';

interface OrderTableProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
  onOrdersChanged: () => void;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, onOrderSelect, onOrdersChanged }) => {
  const [deliveringId, setDeliveringId] = useState<string | null>(null);

  const handleMarkAsDelivered = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeliveringId(orderId);
    const result = await markAsDelivered(orderId);
    setDeliveringId(null);

    if (result.success) {
      toast.success(`Order item ${orderId} marked as delivered.`);
      onOrdersChanged();
    } else {
      toast.error(result.error ?? 'Failed to mark as delivered.');
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Order</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="pr-5 text-right"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => {
            const overdue = order.stage !== 'delivered' && isOverdue(order.dueDate);
            return (
              <TableRow
                key={order.id}
                onClick={() => onOrderSelect(order)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOrderSelect(order);
                  }
                }}
                tabIndex={0}
                className="cursor-pointer focus-visible:bg-muted focus-visible:outline-none"
              >
                <TableCell className="pl-5 font-medium">#{order.id}</TableCell>
                <TableCell><PriorityBadge priority={order.priority} /></TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">{order.product}</p>
                  <p className="text-xs capitalize text-muted-foreground">{order.productType}</p>
                </TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell className={cn("whitespace-nowrap", overdue && "font-medium text-destructive")}>
                  {formatDisplayDate(order.dueDate)}
                  {overdue && <span className="block text-xs font-normal">Overdue</span>}
                </TableCell>
                <TableCell><StageBadges stages={order.stage} /></TableCell>
                <TableCell className="pr-5 text-right">
                  {order.stage === 'out_for_delivery' && (
                    <Button
                      onClick={(e) => handleMarkAsDelivered(order.id, e)}
                      disabled={deliveringId === order.id}
                      size="sm"
                    >
                      <Truck /> {deliveringId === order.id ? 'Saving...' : 'Mark delivered'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderTable;
