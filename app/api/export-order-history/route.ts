import ExcelJS from 'exceljs';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Stream } from 'stream';

const ITEMS_PER_PAGE = 100;

/**
 * Canonical keys we expose to CSV/XLSX (snake_case).
 * We'll also accept several aliases from the query string.
 */
const CANONICAL_ORDER_HISTORY = [
  'order_id',
  'product_name',
  'customer_name',
  'order_date',
  'due_date',
  'delivery_date',
  'status',
] as const;

type CanonicalKeyOrderHistory = (typeof CANONICAL_ORDER_HISTORY)[number];

/** Nicely formatted labels for Excel headers */
const DISPLAY_LABEL_ORDER_HISTORY: Record<CanonicalKeyOrderHistory, string> = {
  order_id: 'Order ID',
  product_name: 'Product Name',
  customer_name: 'Customer',
  order_date: 'Order Date',
  due_date: 'Due Date',
  delivery_date: 'Delivery Date',
  status: 'Status',
};

interface TransformedOrder {
  id: string;
  product_name: string;
  customer_name: string;
  order_date: string | null;
  due_date: string | null;
  delivery_date: string | null;
  status: string;
}

/** Create the row shape we’ll write (canonical keys only) */
const mapOrderHistoryForExport = (transformedOrders: TransformedOrder[]) => {
  return transformedOrders.map((o) => {
    const row: Record<CanonicalKeyOrderHistory, unknown> = {
      order_id: o.id ?? null,
      product_name: o.product_name ?? null,
      customer_name: o.customer_name ?? null,
      order_date: o.order_date ? new Date(o.order_date).toLocaleDateString() : '',
      due_date: o.due_date ? new Date(o.due_date).toLocaleDateString() : '',
      delivery_date: o.delivery_date ? new Date(o.delivery_date).toLocaleDateString() : 'Not Delivered',
      status: o.status ?? null,
    };
    return row;
  });
};

const convertChunkToCSV = (data: Record<string, unknown>[], headers: CanonicalKeyOrderHistory[], includeHeader: boolean): string => {
  if (!data || data.length === 0) {
    return "";
  }
  const csvRows = [];
  if (includeHeader) {
    csvRows.push(headers.map(h => DISPLAY_LABEL_ORDER_HISTORY[h]).join(','));
  }
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
      const escaped = val.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n') + '\n';
};

async function* getPaginatedOrderHistory(filters: Record<string, unknown>, sort: Record<string, unknown>) {
  const supabase = await createClient();
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('order_items')
      .select(`
        id,
        due_date,
        delivery_date,
        product_type,
        orders (
          order_date,
          customer_details (
            customer_name,
            address
          )
        ),
        sofa_products (model_name),
        bed_products (model_name),
        order_item_stage_status (
          status,
          stages (name)
        )
      `);

    if (sort && sort.by && sort.dir) {
      query = query.order(sort.by as string, { ascending: sort.dir === 'asc' });
    } else {
      query = query.order('due_date', { ascending: false });
    }

    if (filters.q) {
      const q = filters.q as string;
      query = query.or(`customer_details.customer_name.ilike.%${q}%,sofa_products.model_name.ilike.%${q}%,bed_products.model_name.ilike.%${q}%`);
    }
    
    if (filters.status) {
      if (filters.status === 'Delivered') {
        query = query.not('delivery_date', 'is', null);
      } else if (filters.status !== 'All') {
        query = query.eq('order_item_stage_status.stages.name', filters.status)
                     .eq('order_item_stage_status.status', 'active');
      }
    }

    if (filters.date_from) {
      query = query.gte('order_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('order_date', filters.date_to);
    }

    query = query.range(from, to);

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching order history:', error);
      hasMore = false;
      break;
    }

    if (orders && orders.length > 0) {
      const transformedOrders = orders.map((oi: Record<string, unknown>) => {
        const activeStages = (oi.order_item_stage_status as Record<string, unknown>[])
          .filter((s) => s.status === 'active')
          .map((s) => (s.stages as Record<string, unknown>).name)
          .join(', ');

        return {
          id: oi.id,
          due_date: oi.due_date,
          delivery_date: oi.delivery_date,
          status: oi.delivery_date ? 'Delivered' : (activeStages || 'Pending'),
          product_name: (oi.sofa_products as Record<string, unknown>)?.model_name || (oi.bed_products as Record<string, unknown>)?.model_name,
          order_date: (oi.orders as Record<string, unknown>)?.order_date,
          customer_name: ((oi.orders as Record<string, unknown>)?.customer_details as Record<string, unknown>)?.customer_name,
          address: ((oi.orders as Record<string, unknown>)?.customer_details as Record<string, unknown>)?.address,
        };
      });
      yield transformedOrders as TransformedOrder[];
      page++;
    } else {
      hasMore = false;
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv';
  const columns = searchParams.get('columns');
  const selectedColumns = columns ? columns.split(',') : null;

  const filters = {
    q: searchParams.get('q') || '',
    status: searchParams.get('status') || '',
    date_from: searchParams.get('date_from') || undefined,
    date_to: searchParams.get('date_to') || undefined,
  };
  const sort = {
    by: searchParams.get('sortBy') || 'due_date',
    dir: searchParams.get('sortDir') || 'desc',
  };

  if (format === 'xlsx') {
    const fileName = `order_history_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    
    const stream = new ReadableStream({
      async start(controller) {
        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
          stream: new class extends Stream.Writable {
            _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
              controller.enqueue(chunk);
              callback();
            }
          }(),
        });

        const worksheet = workbook.addWorksheet('Order History');
        let isFirstPage = true;

        try {
          for await (const orders of getPaginatedOrderHistory(filters, sort)) {
            let mappedData = mapOrderHistoryForExport(orders);
            if (selectedColumns) {
              mappedData = mappedData.map(row => {
                const newRow: { [key: string]: unknown } = {};
                selectedColumns.forEach(col => {
                  newRow[col] = row[col as keyof typeof row];
                });
                return newRow as Record<CanonicalKeyOrderHistory, unknown>;
              });
            }
            if (isFirstPage && mappedData.length > 0) {
              const headers = (selectedColumns || CANONICAL_ORDER_HISTORY) as CanonicalKeyOrderHistory[];
              const columnWidths: { [key: string]: number } = {};

              headers.forEach(header => {
                columnWidths[header] = DISPLAY_LABEL_ORDER_HISTORY[header].length;
              });

              mappedData.forEach(row => {
                headers.forEach(header => {
                  const cellLength = row[header] ? String(row[header]).length : 0;
                  if (cellLength > columnWidths[header]) {
                    columnWidths[header] = cellLength;
                  }
                });
              });

              worksheet.columns = headers.map(key => ({
                header: DISPLAY_LABEL_ORDER_HISTORY[key],
                key: key,
                width: Math.min(columnWidths[key] + 2, 50)
              }));
              isFirstPage = false;
            }
            mappedData.forEach(row => {
              worksheet.addRow(row).commit();
            });
          }
          await worksheet.commit();
          await workbook.commit();
          controller.close();
        } catch(err) {
          console.error("XLSX Streaming Error:", err);
          controller.error(err);
        }
      }
    });
    return new NextResponse(stream, { headers });

  } else { // CSV
    const fileName = `order_history_export_${new Date().toISOString().split('T')[0]}.csv`;
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);

    const readableStream = new ReadableStream({
      async start(controller) {
        let isFirstChunk = true;
        let csvHeaders: CanonicalKeyOrderHistory[] = [];

        for await (const orders of getPaginatedOrderHistory(filters, sort)) {
          let mappedData = mapOrderHistoryForExport(orders);
          if (selectedColumns) {
            mappedData = mappedData.map(row => {
              const newRow: { [key: string]: unknown } = {};
              selectedColumns.forEach(col => {
                newRow[col] = row[col as keyof typeof row];
              });
              return newRow as Record<CanonicalKeyOrderHistory, unknown>;
            });
          }
          if (isFirstChunk) {
            csvHeaders = (selectedColumns || CANONICAL_ORDER_HISTORY) as CanonicalKeyOrderHistory[];
            controller.enqueue(new TextEncoder().encode(convertChunkToCSV(mappedData, csvHeaders, true)));
            isFirstChunk = false;
          } else {
            controller.enqueue(new TextEncoder().encode(convertChunkToCSV(mappedData, csvHeaders, false)));
          }
        }
        controller.close();
      }
    });
    return new NextResponse(readableStream, { headers });
  }
}
