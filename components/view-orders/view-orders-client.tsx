"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { Order, View, Stage, Priority } from './types';
import Header from './Header';
import OrderTable from './OrderTable';
import KanbanBoard from './KanbanBoard';
import OrderModal from './OrderModal';
import { searchOrderItems } from '@/actions/search-order-items';
import { updateOrderPriority } from '@/actions/update-order-priority';
import { PageContainer } from '@/components/ui/page-container';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface ViewOrdersClientProps {
  initialOrders: Order[];
  totalCount: number;
}

type Filters = {
  stage: Partial<Record<Stage, boolean>>;
  priority: Partial<Record<string, boolean>>;
  overdue: { true?: boolean };
};

// The board shows every open order at once (up to the server's maximum page size).
const PAGE_SIZE: Record<View, number> = { list: 10, kanban: 100 };

const ViewOrdersClient: React.FC<ViewOrdersClientProps> = ({ initialOrders, totalCount }) => {
  const [view, setView] = useState<View>('list');
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Filters>({ stage: {}, priority: {}, overdue: {} });
  const [sortConfig, setSortConfig] = useState({ key: 'priority', direction: 'desc' });
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [total, setTotal] = useState(totalCount);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const isInitialRender = useRef(true);

  const pageSize = PAGE_SIZE[view];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Changing what is shown always starts again from the first page.
  const changeSearch = useCallback((value: string) => { setSearch(value); setCurrentPage(1); }, []);
  const changeView = useCallback((value: View) => { setView(value); setCurrentPage(1); }, []);
  const changeSort = useCallback((value: { key: string; direction: string }) => { setSortConfig(value); setCurrentPage(1); }, []);
  const changeFilters: React.Dispatch<React.SetStateAction<Filters>> = useCallback((value) => {
    setActiveFilters(value);
    setCurrentPage(1);
  }, []);
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    // The server already rendered the first page.
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const result = await searchOrderItems(search || null, currentPage, pageSize, activeFilters, sortConfig);
      // Ignore responses that arrive after a newer request was started.
      if (cancelled) return;
      setOrders(result.orders);
      setTotal(result.totalCount);
      setLoading(false);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, currentPage, pageSize, activeFilters, sortConfig, reloadKey]);

  const applyPriority = (orderId: string, priority: Priority) => {
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, priority } : o)));
    setSelectedOrder(prev => (prev && prev.id === orderId ? { ...prev, priority } : prev));
  };

  const handlePriorityChange = async (orderId: string, priority: Priority) => {
    const previous = orders.find(o => o.id === orderId)?.priority;
    applyPriority(orderId, priority);

    const result = await updateOrderPriority(Number(orderId), priority);
    if (!result.success) {
      if (previous !== undefined) applyPriority(orderId, previous);
      toast.error(result.error ?? 'Failed to update priority.');
    }
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    // Stages may have moved on while the modal was open.
    reload();
  };

  return (
    <PageContainer fullWidth>
      <Header
        view={view}
        setView={changeView}
        search={search}
        setSearch={changeSearch}
        activeFilters={activeFilters}
        setActiveFilters={changeFilters}
        sortConfig={sortConfig}
        setSortConfig={changeSort}
      />

      {orders.length === 0 && !loading ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders match"
          description="Nothing matches the current search and filters. Delivered items are hidden unless you filter for them."
        />
      ) : view === 'list' ? (
        <div className={cn("space-y-4 transition-opacity", loading && "opacity-60")}>
          <OrderTable orders={orders} onOrderSelect={setSelectedOrder} onOrdersChanged={reload} />
          <PaginationBar
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            disabled={loading}
            summary={`${total} order item${total === 1 ? '' : 's'}`}
          />
        </div>
      ) : (
        <div className={cn("transition-opacity", loading && "opacity-60")}>
          {total > orders.length && (
            <p className="mb-4 text-sm text-muted-foreground">
              Showing the first {orders.length} of {total} order items. Use search or filters to narrow the board.
            </p>
          )}
          <KanbanBoard orders={orders} onOrderSelect={setSelectedOrder} onOrdersChanged={reload} />
        </div>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <OrderModal
            order={selectedOrder}
            onClose={handleCloseModal}
            onPriorityChange={handlePriorityChange}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default ViewOrdersClient;
