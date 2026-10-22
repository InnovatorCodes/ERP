import React from 'react';
import { ShoppingCart, Factory, CheckCircle2, AlertTriangle, CloudOff } from 'lucide-react';
import KpiCard from '@/components/dashboard/kpi-card';
import ProductionPipeline from '@/components/dashboard/production-pipeline';
import ProductionChart from '@/components/dashboard/production-chart';
import RecentOrders from '@/components/dashboard/recent-orders';
import { getDashboardData } from '@/actions/get-dashboard-data';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata = { title: 'Dashboard' };

const DashboardPage: React.FC = async () => {
  const data = await getDashboardData();

  if (!data) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" />
        <EmptyState icon={CloudOff} title="Unable to load dashboard data" description="Please try refreshing the page." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="Overview of orders and production." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total order items" value={String(data.total_orders)} Icon={ShoppingCart} />
        <KpiCard title="In production" value={String(data.orders_in_production)} Icon={Factory} />
        <KpiCard title="Delivered (30 days)" value={String(data.completed_orders_month)} Icon={CheckCircle2} />
        <KpiCard
          title="Overdue"
          value={String(data.overdue_orders)}
          Icon={AlertTriangle}
          tone={data.overdue_orders > 0 ? 'alert' : 'default'}
          hint={data.overdue_orders > 0 ? 'Past their due date and not delivered' : 'Nothing overdue'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductionChart data={data.production_chart || []} />
        </div>
        <div className="lg:col-span-1">
          <ProductionPipeline data={data.production_pipeline || {}} />
        </div>
        <div className="lg:col-span-3">
          <RecentOrders data={data.recent_orders || []} />
        </div>
      </div>
    </PageContainer>
  );
};

export default DashboardPage;
