import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';

export type ExportColumn = { key: string; label: string };
export type ExportRow = Record<string, unknown>;

const MAX_ROWS = 50_000;

/**
 * Columns requested with ?columns=a,b, restricted to the known columns and
 * kept in the requested order. Falls back to all columns.
 */
export function selectColumns(param: string | null, available: readonly ExportColumn[]): ExportColumn[] {
  if (!param) return [...available];
  const byKey = new Map(available.map((column) => [column.key, column]));
  const picked = [...new Set(param.split(',').map((key) => key.trim()))]
    .map((key) => byKey.get(key))
    .filter((column): column is ExportColumn => !!column);
  return picked.length > 0 ? picked : [...available];
}

/**
 * Reads every page before anything is sent. Any error rejects the whole
 * export, so users never receive a silently truncated file.
 */
export async function collectRows(
  fetchPage: (offset: number, limit: number) => Promise<ExportRow[]>,
  pageSize: number
): Promise<ExportRow[]> {
  const rows: ExportRow[] = [];
  for (let offset = 0; offset < MAX_ROWS; offset += pageSize) {
    const page = await fetchPage(offset, pageSize);
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

// Spreadsheet apps execute CSV cells that start with these characters as formulas.
function neutraliseFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function toCsv(rows: ExportRow[], columns: ExportColumn[]): string {
  const cell = (value: unknown) => {
    const text = value === null || value === undefined ? '' : neutraliseFormula(String(value));
    return `"${text.replace(/"/g, '""')}"`;
  };
  const lines = [
    columns.map((column) => cell(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => cell(row[column.key])).join(',')),
  ];
  // The byte-order mark makes Excel open the file as UTF-8 (names, ₹, etc.).
  return '﻿' + lines.join('\r\n') + '\r\n';
}

async function toXlsx(rows: ExportRow[], columns: ExportColumn[], sheetName: string): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  const sample = rows.slice(0, 200);
  sheet.columns = columns.map((column) => ({
    header: column.label,
    key: column.key,
    width: Math.min(
      Math.max(column.label.length, ...sample.map((row) => String(row[column.key] ?? '').length)) + 2,
      50
    ),
  }));
  sheet.getRow(1).font = { bold: true };
  // ExcelJS writes plain values as text/numbers, never as formulas.
  for (const row of rows) {
    sheet.addRow(Object.fromEntries(columns.map((column) => [column.key, row[column.key] ?? ''])));
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

export async function exportResponse({
  format,
  baseName,
  sheetName,
  columns,
  rows,
}: {
  format: string | null;
  baseName: string;
  sheetName: string;
  columns: ExportColumn[];
  rows: ExportRow[];
}): Promise<NextResponse> {
  const date = new Date().toISOString().slice(0, 10);

  if (format === 'xlsx') {
    const body = await toXlsx(rows, columns, sheetName);
    return new NextResponse(body as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${baseName}_${date}.xlsx"`,
      },
    });
  }

  return new NextResponse(toCsv(rows, columns), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${baseName}_${date}.csv"`,
    },
  });
}

export function exportFailed(error: unknown): NextResponse {
  console.error('Export failed:', error);
  return NextResponse.json({ error: 'The export failed. Please try again.' }, { status: 500 });
}
