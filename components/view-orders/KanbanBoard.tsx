"use client";
import React, { useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, Truck } from 'lucide-react';
import { Order } from './types';
import { STAGE_CONFIG } from './data';
import { PriorityBadge } from './badges';
import { Button } from '../ui/button';
import { markAsDelivered } from '@/actions/mark-as-delivered';
import { cn, formatDisplayDate, isOverdue } from '@/lib/utils';

interface KanbanBoardProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
  onOrdersChanged: () => void;
}

type ColumnKey = keyof typeof STAGE_CONFIG;

const KanbanBoard: React.FC<KanbanBoardProps> = ({ orders, onOrderSelect, onOrdersChanged }) => {
  const [deliveringId, setDeliveringId] = useState<string | null>(null);

  // Delivered items only appear when filtered for, so hide that column when it's empty.
  const columns = (Object.keys(STAGE_CONFIG) as ColumnKey[]).filter(
    (key) => key !== 'delivered' || orders.some((o) => o.stage === 'delivered')
  );

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
    // Columns sit side by side in stage order and scroll horizontally, like a workshop board.
    <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-4">
      {columns.map(columnKey => {
        // An order can be in several active stages at once, e.g. "carpentry, stitching".
        const columnOrders = orders.filter(o => o.stage.split(',').map(s => s.trim()).includes(columnKey));
        return (
          <section key={columnKey} className="flex w-72 shrink-0 flex-col rounded-xl border bg-muted/60">
            <header className="flex items-center gap-2 border-b px-4 py-3">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: STAGE_CONFIG[columnKey].color }} />
              <h3 className="text-sm font-semibold text-foreground">{STAGE_CONFIG[columnKey].label}</h3>
              <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                {columnOrders.length}
              </span>
            </header>
            <div className="flex min-h-[160px] flex-1 flex-col gap-3 p-3">
              {columnOrders.length > 0 ? (
                columnOrders.map(order => {
                  const overdue = order.stage !== 'delivered' && isOverdue(order.dueDate);
                  return (
                    <div
                      key={order.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onOrderSelect(order)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOrderSelect(order);
                        }
                      }}
                      className="cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">#{order.id}</p>
                        <PriorityBadge priority={order.priority} />
                      </div>
                      <p className="mt-1 truncate text-sm text-foreground">{order.product}</p>
                      <p className="truncate text-xs text-muted-foreground">{order.customer}</p>
                      <p className={cn("mt-2 flex items-center gap-1 text-xs", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
                        <CalendarClock className="size-3.5" />
                        {overdue ? 'Overdue · ' : 'Due '}{formatDisplayDate(order.dueDate)}
                      </p>
                      {order.stage === 'out_for_delivery' && (
                        <Button
                          onClick={(e) => handleMarkAsDelivered(order.id, e)}
                          disabled={deliveringId === order.id}
                          size="sm"
                          className="mt-3 w-full"
                        >
                          <Truck /> {deliveringId === order.id ? 'Saving...' : 'Mark delivered'}
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="py-6 text-center text-xs text-muted-foreground">No orders</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
