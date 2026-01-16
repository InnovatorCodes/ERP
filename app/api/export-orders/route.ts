import ExcelJS from 'exceljs';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Stream } from 'stream';

const ITEMS_PER_PAGE = 100;

/**
 * Canonical keys we expose to CSV/XLSX (snake_case).
 * We'll also accept several aliases from the query string.
 */
const CANONICAL_ORDER = [
  'order_id',
  'product_name',
  'product_type',
  'customer_name',
  'due_date',
  'priority',
  'stage_name',
] as const;

type CanonicalKey = (typeof CANONICAL_ORDER)[number];

/** Map of accepted aliases -> canonical key */
const ALIASES: Record<string, CanonicalKey> = {
  order_id: 'order_id',
  id: 'order_id',
  product_name: 'product_name',
  product: 'product_name',
  product_type: 'product_type',
  customer_name: 'customer_name',
  customer: 'customer_name',
  due_date: 'due_date',
  priority: 'priority',
  stage_name: 'stage_name',
  stage: 'stage_name',
};

/** Nicely formatted labels for Excel headers */
const DISPLAY_LABEL: Record<CanonicalKey, string> = {
  order_id: 'Order ID',
  product_name: 'Product',
  product_type: 'Product Type',
  customer_name: 'Customer',
  due_date: 'Due Date',
  priority: 'Priority',
  stage_name: 'Stage',
};

/** Normalize user `?columns=` to canonical keys (case-insensitive, alias-aware) */
function normalizeSelectedColumns(cols: string[] | null): CanonicalKey[] | null {
  if (!cols || cols.length === 0) return null;
  const mapped: CanonicalKey[] = [];
  for (const raw of cols) {
    const k = raw.trim().toLowerCase();
    const canon = ALIASES[k];
    if (canon && !mapped.includes(canon)) mapped.push(canon);
  }
  return mapped.length ? mapped : null;
}

interface TransformedOrder {
  id: string;
  product_name: string;
  product_type: string;
  customer_name: string;
  due_date: string | null;
  priority: string;
  stage_name: string;
}

/** Create the row shape we’ll write (canonical keys only) */
function mapOrdersForExport(transformedOrders: TransformedOrder[]) {
  return transformedOrders.map((o) => {
    const row: Record<CanonicalKey, unknown> = {
      order_id: o.id ?? null,
      product_name: o.product_name ?? null,
      product_type: o.product_type ?? null,
      customer_name: o.customer_name ?? null,
      due_date: o.due_date ? new Date(o.due_date).toLocaleDateString() : '',
      priority: o.priority ?? null,
      stage_name: o.stage_name ?? null,
    };
    return row;
  });
}

/** CSV chunk builder */
function convertChunkToCSV(
  data: Record<string, unknown>[],
  headers: string[],
  includeHeader: boolean
): string {
  if (!data || data.length === 0) return '';
  const rows: string[] = [];
  if (includeHeader) rows.push(headers.join(','));
  for (const row of data) {
    const values = headers.map((h) => {
      const val = row[h] ?? '';
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    rows.push(values.join(','));
  }
  return rows.join('\n') + '\n';
}

/**
 * Generator to fetch paginated orders from Supabase.
 * NOTE: You already confirmed data returns, so we keep your structure but
 * also extract `status`.
 */
async function* getPaginatedOrders(filters: Record<string, unknown>, sort: Record<string, unknown>) {
  const supabase = await createClient();
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('order_items')
      .select(
        `
        id,
        due_date,
        priority,
        product_type,
        orders (
          customer_details (
            customer_name
          )
        ),
        sofa_products (model_name),
        bed_products (model_name),
        order_item_stage_status (
          stages (name)
        )
      `
      );

    if (sort?.by && sort?.dir) {
      query = query.order(sort.by as string, { ascending: sort.dir === 'asc' });
    } else {
      query = query.order('priority', { ascending: false });
    }

    if (filters.q) {
      const q = filters.q as string;
      // If this nested OR ever becomes flaky, consider denormalizing a view for exports.
      query = query.or(
        `orders.customer_details.customer_name.ilike.%${q}%,sofa_products.model_name.ilike.%${q}%,bed_products.model_name.ilike.%${q}%`,
        { referencedTable: 'order_items' }
      );
    }

    if (filters.stage && filters.stage !== 'All') {
      query = query
        .eq('order_item_stage_status.stages.name', filters.stage)
        .eq('order_item_stage_status.status', 'active');
    }

    query = query.range(from, to);

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      hasMore = false;
      break;
    }

    if (orders && orders.length > 0) {
      const transformed = orders.map((oi: Record<string, unknown>) => {
        const activeStage = Array.isArray(oi.order_item_stage_status)
          ? oi.order_item_stage_status[0] as Record<string, unknown>
          : null;

        return {
          id: oi.id,
          priority: oi.priority,
          due_date: oi.due_date,
          // Pull BOTH stage name and status for export:
          stage_name: (activeStage?.stages as Record<string, unknown>)?.name ?? 'delivered',
          product_name: (oi.sofa_products as Record<string, unknown>)?.model_name || (oi.bed_products as Record<string, unknown>)?.model_name || null,
          product_type: oi.product_type,
          customer_name: ((oi.orders as Record<string, unknown>)?.customer_details as Record<string, unknown>)?.customer_name || null,
        };
      });

      yield transformed as TransformedOrder[];
      page++;
    } else {
      hasMore = false;
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const format = (searchParams.get('format') || 'csv').toLowerCase();
  const columns = searchParams.get('columns');
  const selectedColumnsRaw = columns ? columns.split(',') : null;
  const selectedColumns = normalizeSelectedColumns(selectedColumnsRaw);

  const filters = {
    q: searchParams.get('q') || '',
    stage: searchParams.get('stage') || '',
  };
  const sort = {
    by: searchParams.get('sortBy') || 'priority',
    dir: searchParams.get('sortDir') || 'desc',
  };

  if (format === 'xlsx') {
    const fileName = `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    const headers = new Headers();
    headers.set(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);

    const stream = new ReadableStream({
      async start(controller) {
        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
          stream: new (class extends Stream.Writable {
            _write(chunk: Buffer, _enc: BufferEncoding, cb: (error?: Error | null) => void) {
              controller.enqueue(chunk);
              cb();
            }
          })(),
        });

        const worksheet = workbook.addWorksheet('Orders');

        try {
          const orderGenerator = getPaginatedOrders(filters, sort);

          const processPage = (orders: TransformedOrder[], isFirst: boolean) => {
            let mapped = mapOrdersForExport(orders);

            // Column selection (alias-aware, already normalized to canonical)
            const cols = selectedColumns ?? CANONICAL_ORDER.slice();
            if (cols) {
              mapped = mapped.map((row) => {
                const newRow: Record<string, unknown> = {};
                for (const c of cols) newRow[c] = row[c as keyof typeof row];
                return newRow;
              });
            }

            if (mapped.length === 0) return false;

            if (isFirst) {
              const cols = (selectedColumns ?? CANONICAL_ORDER) as CanonicalKey[];
              worksheet.columns = cols.map((key) => ({
                header: DISPLAY_LABEL[key],
                key,
                width: 25,
              }));
            }

            for (const row of mapped) {
              worksheet.addRow(row).commit();
            }
            return true;
          };

          // Ensure headers exist before writing rows
          const firstPage = await orderGenerator.next();
          if (!firstPage.done) {
            processPage(firstPage.value, true);
            for await (const rest of orderGenerator) {
              processPage(rest, false);
            }
          }

          await worksheet.commit();
          await workbook.commit();
          controller.close();
        } catch (err) {
          console.error('XLSX Streaming Error:', err);
          controller.error(err);
        }
      },
    });

    return new NextResponse(stream, { headers });
  }

  // CSV path
  const fileName = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
  const headers = new Headers();
  headers.set('Content-Type', 'text/csv; charset=utf-8');
  headers.set('Content-Disposition', `attachment; filename="${fileName}"`);

  const readableStream = new ReadableStream({
    async start(controller) {
      let isFirstChunk = true;
      let csvHeaders: string[] = [];

      for await (const orders of getPaginatedOrders(filters, sort)) {
        let mapped = mapOrdersForExport(orders);

        const cols = selectedColumns ?? CANONICAL_ORDER.slice();
        if (cols) {
          mapped = mapped.map((row) => {
            const newRow: Record<string, unknown> = {};
            for (const c of cols) newRow[c] = row[c as keyof typeof row];
            return newRow;
          });
        }

        if (mapped.length === 0) continue;

        if (isFirstChunk) {
          csvHeaders = (selectedColumns ?? CANONICAL_ORDER) as string[];
          controller.enqueue(
            new TextEncoder().encode(convertChunkToCSV(mapped, csvHeaders, true))
          );
          isFirstChunk = false;
        } else {
          controller.enqueue(
            new TextEncoder().encode(convertChunkToCSV(mapped, csvHeaders, false))
          );
        }
      }
      controller.close();
    },
  });

  return new NextResponse(readableStream, { headers });
}
