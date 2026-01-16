import { createClient } from '@/utils/supabase/server';
import ExcelJS from 'exceljs';
import { NextRequest, NextResponse } from 'next/server';
import { Stream } from 'stream';

interface Product {
  [key: string]: string | number | boolean | null;
}

// This function converts a chunk of data (array of objects) into a CSV string.
// It can optionally include a header row.
const convertChunkToCSV = (data: Product[], headers: string[], includeHeader: boolean): string => {
  if (!data || data.length === 0) {
    return "";
  }

  const csvRows = [];

  if (includeHeader) {
    csvRows.push(headers.join(','));
  }

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? '' : row[header];
      const escaped = ('' + val).replace(/"/g, '""'); // Escape double quotes
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n') + '\n'; // Add newline at the end of chunk
};

// This function defines the query and data mapping for a specific data source.
// This helps keep the streaming logic clean.
const getDataSourceConfig = (source: string | null, productType: string | null) => {
    switch (source) {
        case 'products':
            const tableName = productType === 'sofa' ? 'sofa_products' : 'bed_products';
            return {
                query: '*',
                mapper: (product: Product) => product, // No mapping needed
                tableName: tableName
            };
        default:
            return null;
    }
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = 'products';
  const productType = searchParams.get('productType');
  const format = searchParams.get('format') || 'csv'; // Default to CSV
  const columns = searchParams.get('columns');
  const selectedColumns = columns ? columns.split(',') : null;

  const config = getDataSourceConfig(source, productType);
  if (!config) {
    return new NextResponse(JSON.stringify({ error: 'Invalid data source specified' }), { status: 400 });
  }

  const supabase = await createClient();

  if (format === 'xlsx') {
    const fileName = `${source}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: new class extends Stream.Writable {
        _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
          writer.write(chunk);
          callback();
        }
        _final(callback: (error?: Error | null) => void) {
          writer.close();
          callback();
        }
      }(),
    });

    const worksheet = workbook.addWorksheet(source || 'Sheet 1');

    (async () => {
      const pageSize = 1000;
      let page = 0;

      try {
        // Fetch the first chunk to determine column widths
        const { data: firstChunk, error: firstChunkError } = await supabase
          .from(config.tableName)
          .select(config.query)
          .range(0, pageSize - 1);

        if (firstChunkError) {
          throw firstChunkError;
        }

        if (firstChunk && firstChunk.length > 0) {
          let mappedFirstChunk = (firstChunk as unknown as Product[]).map(config.mapper);
          if (selectedColumns) {
            mappedFirstChunk = mappedFirstChunk.map(row => {
              const newRow: Product = {};
              selectedColumns.forEach(col => {
                newRow[col] = row[col];
              });
              return newRow;
            });
          }
          const keys = selectedColumns || Object.keys(mappedFirstChunk[0]);

          // Calculate column widths from headers and the first chunk of data
          const columnWidths = keys.reduce((widths, key) => {
            const headerText = key.replace(/_/g, ' ').toUpperCase();
            let maxLength = headerText.length;
            
            for (const row of mappedFirstChunk) {
              const cellValue = row[key] ? row[key].toString() : '';
              if (cellValue.length > maxLength) {
                maxLength = cellValue.length;
              }
            }
            
            widths[key] = maxLength + 2; // +2 for padding
            return widths;
          }, {} as Record<string, number>);

          worksheet.columns = keys.map(key => ({
            header: key.replace(/_/g, ' ').toUpperCase(),
            key: key,
            width: columnWidths[key]
          }));

          // Add the first chunk of rows
          mappedFirstChunk.forEach(row => {
            worksheet.addRow(row).commit();
          });

          page = 1; // Start fetching from the second page
        }

        // Fetch and stream remaining chunks
        while (true) {
          const from = page * pageSize;
          const to = from + pageSize - 1;

          const { data: chunk, error } = await supabase.from(config.tableName).select(config.query).range(from, to);
          if (error) { throw error; }
          if (!chunk || chunk.length === 0) { break; }

          let mappedChunk = (chunk as unknown as Product[]).map(config.mapper);
          if (selectedColumns) {
            mappedChunk = mappedChunk.map(row => {
              const newRow: Product = {};
              selectedColumns.forEach(col => {
                newRow[col] = row[col];
              });
              return newRow;
            });
          }
          mappedChunk.forEach(row => {
            worksheet.addRow(row).commit();
          });

          page++;
        }

        await worksheet.commit();
        await workbook.commit();
        writer.close();
      } catch(err) {
        console.error("XLSX Streaming Error:", err);
        writer.abort(err);
      }
    })();

    return new NextResponse(readable, { headers });

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

                    let mappedChunk = (chunk as unknown as Product[]).map(config.mapper);
                    if (selectedColumns) {
                        mappedChunk = mappedChunk.map(row => {
                            const newRow: Product = {};
                            selectedColumns.forEach(col => {
                                newRow[col] = row[col];
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
