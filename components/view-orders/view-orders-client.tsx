"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Order, View, Stage, Priority } from './types';
import Header from './Header';
import OrderTable from './OrderTable';
import KanbanBoard from './KanbanBoard';
import OrderModal from './OrderModal';
import { searchOrderItems } from '@/actions/search-order-items';
import { updateOrderPriority } from '@/actions/update-order-priority';
import { Button } from '../ui/button';

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
    <div className="bg-white min-h-screen text-black font-sans antialiased">
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
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'list' && (
              <div className="p-6 pb-20">
                <OrderTable orders={orders} onOrderSelect={setSelectedOrder} onOrdersChanged={reload} />
                {orders.length === 0 && !loading && (
                  <p className="text-center text-gray-500 py-12">No orders match the current search and filters.</p>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 flex justify-center items-center space-x-2">
                  <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1 || loading}>
                    Previous
                  </Button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages || loading}>
                    Next
                  </Button>
                </div>
              </div>
            )}
            {view === 'kanban' && (
              <div className="p-6">
                {total > orders.length && (
                  <p className="mb-4 text-sm text-gray-500">
                    Showing the first {orders.length} of {total} orders. Use search or filters to narrow the board.
                  </p>
                )}
                <KanbanBoard orders={orders} onOrderSelect={setSelectedOrder} onOrdersChanged={reload} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <AnimatePresence>
        {selectedOrder && (
          <OrderModal
            order={selectedOrder}
            onClose={handleCloseModal}
            onPriorityChange={handlePriorityChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewOrdersClient;
