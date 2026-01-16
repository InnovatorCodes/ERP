import { createClient } from '@/utils/supabase/server';
import ExcelJS from 'exceljs';
import { NextRequest, NextResponse } from 'next/server';
import { Stream } from 'stream';


// This function converts a chunk of data (array of objects) into a CSV string.
// It can optionally include a header row.
const convertChunkToCSV = (data: Record<string, unknown>[], headers: string[], includeHeader: boolean): string => {
  if (!data || data.length === 0) {
    return "";
  }

  const csvRows = [];

  if (includeHeader) {
    csvRows.push(headers.join(','));
  }

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
      const escaped = val.replace(/"/g, '""'); // Escape double quotes
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n') + '\n'; // Add newline at the end of chunk
};

// This function defines the query and data mapping for a specific data source.
// This helps keep the streaming logic clean.
const getDataSourceConfig = (source: string | null) => {
    switch (source) {
        case 'orders':
            return {
                query: `
                    id,
                    created_at,
                    total,
                    customers ( name, email ),
                    order_items ( quantity, products ( name, price ) )
                `,
                mapper: (order: Record<string, unknown>) => ({
                    order_id: order.id,
                    order_date: order.created_at,
                    customer_name: (order.customers as Record<string, unknown>).name,
                    customer_email: (order.customers as Record<string, unknown>).email,
                    products: (order.order_items as Record<string, unknown>[]).map((item) => `${item.quantity}x ${(item.products as Record<string, unknown>).name}`).join('; '),
                    order_total: order.total,
                }),
                tableName: 'orders'
            };
        case 'products':
            return {
                query: 'id, name, price, stock_quantity',
                mapper: (product: Record<string, unknown>) => product, // No mapping needed
                tableName: 'products'
            };
        case 'customers':
            return {
                query: `
                    id, customer_name, address, mobile_number, email, company, customer_type
                `,
                mapper: (customer: Record<string, unknown>) => ({
                    id: customer.id,
                    customer_name: customer.customer_name,
                    address: customer.address,
                    mobile_number: customer.mobile_number,
                    email: customer.email,
                    company: customer.company,
                    customer_type: customer.customer_type,
                }),
                tableName: 'customer_details'
            };
        default:
            return null;
    }
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = 'customers';
  const format = searchParams.get('format') || 'csv'; // Default to CSV
  const columns = searchParams.get('columns');
  const selectedColumns = columns ? columns.split(',') : null;


  const config = getDataSourceConfig(source);
  if (!config) {
    return new NextResponse(JSON.stringify({ error: 'Invalid data source specified' }), { status: 400 });
  }

  const supabase = await createClient();

  if (format === 'xlsx') {
    const fileName = `${source}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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

        const worksheet = workbook.addWorksheet(source || 'Sheet 1');

        const pageSize = 1000;
        let page = 0;
        let isFirstChunk = true;

            try {
                while (true) {
                    const from = page * pageSize;
                    const to = from + pageSize - 1;

                    const { data: chunk, error } = await supabase.from(config.tableName).select(config.query).range(from, to);
                    if (error) { throw error; }
                    if (!chunk || chunk.length === 0) { break; }

                    let mappedChunk = (chunk as unknown as Record<string, unknown>[]).map(config.mapper);

                    if (selectedColumns) {
                        mappedChunk = mappedChunk.map(row => {
                            const newRow: Record<string, unknown> = {};
                            selectedColumns.forEach(col => {
                                newRow[col] = row[col as keyof typeof row];
                            });
                            return newRow;
                        });
                    }

                    if (isFirstChunk && mappedChunk.length > 0) {
                        const headers = selectedColumns || Object.keys(mappedChunk[0]);
                        const columnWidths: { [key: string]: number } = {};

                        // Initialize widths with header lengths
                        headers.forEach(header => {
                            columnWidths[header] = header.length;
                        });

                        // Find the max length for each column in the first chunk
                        mappedChunk.forEach(row => {
                            headers.forEach(header => {
                                const cellLength = row[header] ? String(row[header]).length : 0;
                                if (cellLength > columnWidths[header]) {
                                    columnWidths[header] = cellLength;
                                }
                            });
                        });
                        
                        // Set the columns with calculated widths plus padding, capped at 50
                        worksheet.columns = headers.map(key => ({
                            header: key.replace(/_/g, ' ').toUpperCase(),
                            key: key,
                            width: Math.min(columnWidths[key] + 2, 50) 
                        }));
                        
                        isFirstChunk = false;
                    }
                    
                    mappedChunk.forEach(row => {
                        worksheet.addRow(row).commit();
                    });

                    page++;
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

  } else { // Default to CSV
    const fileName = `${source}_export_${new Date().toISOString().split('T')[0]}.csv`;
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);

    const stream = new ReadableStream({
        async start(controller) {
            const pageSize = 1000;
            let page = 0;
            let isFirstChunk = true;
            try {
                while (true) {
                    const from = page * pageSize;
                    const to = from + pageSize - 1;
                    const { data: chunk, error } = await supabase.from(config.tableName).select(config.query).range(from, to);
                    if (error) { throw error; }
                    if (!chunk || chunk.length === 0) { controller.close(); return; }

                    let mappedChunk = (chunk as unknown as Record<string, unknown>[]).map(config.mapper);
                    if (selectedColumns) {
                        mappedChunk = mappedChunk.map(row => {
                            const newRow: Record<string, unknown> = {};
                            selectedColumns.forEach(col => {
                                newRow[col] = row[col as keyof typeof row];
                            });
                            return newRow;
                        });
                    }

                    if (mappedChunk.length > 0) {
                        const columnHeaders = selectedColumns || Object.keys(mappedChunk[0]);
                        const csvChunk = convertChunkToCSV(mappedChunk, columnHeaders, isFirstChunk);
                        controller.enqueue(new TextEncoder().encode(csvChunk));
                        if (isFirstChunk) isFirstChunk = false;
                    }
                    page++;
                }
            } catch (err) {
                console.error('CSV Streaming error:', err);
                controller.error(err);
            }
        }
    });
    return new NextResponse(stream, { headers });
  }
}
