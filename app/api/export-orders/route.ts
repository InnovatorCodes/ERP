import { NextRequest, NextResponse } from 'next/server';
import { authorize, ROLES } from '@/lib/auth';
import { collectRows, exportFailed, exportResponse, selectColumns, type ExportColumn } from '@/lib/export';
import { formatDisplayDate } from '@/lib/utils';
import { PRIORITY_CONFIG, STAGE_CONFIG } from '@/components/view-orders/data';
import type { Priority } from '@/components/view-orders/types';

const COLUMNS: ExportColumn[] = [
  { key: 'order_id', label: 'Order ID' },
  { key: 'priority', label: 'Priority' },
  { key: 'product_name', label: 'Product' },
  { key: 'product_type', label: 'Product Type' },
  { key: 'customer_name', label: 'Customer' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'stage_name', label: 'Stage' },
];

type OrderRow = {
  id: number;
  due_date: string;
  production_stage: string;
  priority: number;
  customer_name: string | null;
  product_model_name: string | null;
  product_type: string;
};

const stageLabel = (codes: string) =>
  codes
    .split(',')
    .map((code) => code.trim())
    .map((code) => STAGE_CONFIG[code as keyof typeof STAGE_CONFIG]?.label ?? code)
    .join(', ');

/** Only the filter shapes get_paginated_orders understands. */
function parseFilters(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      stage: typeof parsed.stage === 'object' && parsed.stage ? parsed.stage : {},
      priority: typeof parsed.priority === 'object' && parsed.priority ? parsed.priority : {},
      overdue: typeof parsed.overdue === 'object' && parsed.overdue ? parsed.overdue : {},
    };
  } catch {
    return { stage: {}, priority: {}, overdue: {} };
  }
}

// Exports exactly what the View Orders screen shows: same search, filters and sort.
export async function GET(request: NextRequest) {
  const auth = await authorize(ROLES.PRODUCTION);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { searchParams } = request.nextUrl;
  const columns = selectColumns(searchParams.get('columns'), COLUMNS);
  const filters = parseFilters(searchParams.get('filters'));
  const sort = {
    key: searchParams.get('sortKey') ?? 'priority',
    direction: searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc',
  };

  try {
    const rows = await collectRows(async (offset, limit) => {
      const { data, error } = await auth.supabase.rpc('get_paginated_orders', {
        p_search_term: searchParams.get('q') || null,
        p_filters: filters,
        p_sort: sort,
        p_limit: limit,
        p_offset: offset,
      });
      if (error) throw error;
      return (data as OrderRow[]).map((order) => ({
        order_id: order.id,
        priority: PRIORITY_CONFIG[order.priority as Priority]?.label ?? order.priority,
        product_name: order.product_model_name,
        product_type: order.product_type === 'sofa' ? 'Sofa' : 'Bed',
        customer_name: order.customer_name,
        due_date: formatDisplayDate(order.due_date),
        stage_name: stageLabel(order.production_stage),
      }));
    }, 100);

    return await exportResponse({ format: searchParams.get('format'), baseName: 'orders', sheetName: 'Orders', columns, rows });
  } catch (error) {
    return exportFailed(error);
  }
}
