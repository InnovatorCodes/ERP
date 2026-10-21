import { NextRequest, NextResponse } from 'next/server';
import { authorize, ROLES } from '@/lib/auth';
import { collectRows, exportFailed, exportResponse, selectColumns, type ExportColumn } from '@/lib/export';
import { formatDisplayDate } from '@/lib/utils';

const COLUMNS: ExportColumn[] = [
  { key: 'order_id', label: 'Order ID' },
  { key: 'product_name', label: 'Product Name' },
  { key: 'product_type', label: 'Product Type' },
  { key: 'customer_name', label: 'Customer' },
  { key: 'address', label: 'Address' },
  { key: 'order_date', label: 'Order Date' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'delivery_date', label: 'Delivery Date' },
  { key: 'status', label: 'Status' },
];

type HistoryRow = {
  id: number;
  due_date: string;
  delivery_date: string;
  production_stage: string;
  product_type: string;
  model_name: string | null;
  order_date: string;
  customer_name: string | null;
  address: string | null;
};

const isDate = (value: string | null) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined);

// Exports exactly what the Order History screen shows: same search, dates and sort.
export async function GET(request: NextRequest) {
  const auth = await authorize(ROLES.MANAGEMENT);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { searchParams } = request.nextUrl;
  const columns = selectColumns(searchParams.get('columns'), COLUMNS);
  const filters = {
    date_from: isDate(searchParams.get('date_from')),
    date_to: isDate(searchParams.get('date_to')),
  };
  const sort = {
    by: searchParams.get('sortBy') ?? 'deliveryDate',
    dir: searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc',
  };

  try {
    const rows = await collectRows(async (offset, limit) => {
      const { data, error } = await auth.supabase.rpc('search_and_paginate_order_history_v2', {
        p_search_term: searchParams.get('q') || null,
        p_limit: limit,
        p_offset: offset,
        p_filters: filters,
        p_sort: sort,
      });
      if (error) throw error;
      return (data as HistoryRow[]).map((order) => ({
        order_id: order.id,
        product_name: order.model_name,
        product_type: order.product_type === 'sofa' ? 'Sofa' : 'Bed',
        customer_name: order.customer_name,
        address: order.address,
        // due/delivery dates are calendar dates sent as midnight UTC timestamps.
        order_date: formatDisplayDate(order.order_date),
        due_date: formatDisplayDate(order.due_date.slice(0, 10)),
        delivery_date: formatDisplayDate(order.delivery_date.slice(0, 10)),
        status: order.production_stage,
      }));
    }, 100);

    return await exportResponse({ format: searchParams.get('format'), baseName: 'order_history', sheetName: 'Order History', columns, rows });
  } catch (error) {
    return exportFailed(error);
  }
}
