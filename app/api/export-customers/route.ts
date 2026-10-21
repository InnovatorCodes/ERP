import { NextRequest, NextResponse } from 'next/server';
import { authorize, ROLES } from '@/lib/auth';
import { collectRows, exportFailed, exportResponse, selectColumns, type ExportColumn } from '@/lib/export';
import { formatDisplayDate } from '@/lib/utils';

const COLUMNS: ExportColumn[] = [
  { key: 'id', label: 'Customer ID' },
  { key: 'customer_name', label: 'Name' },
  { key: 'company', label: 'Company' },
  { key: 'email', label: 'Email' },
  { key: 'mobile_number', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'customer_type', label: 'Customer Type' },
  { key: 'created_at', label: 'Added On' },
];

export async function GET(request: NextRequest) {
  const auth = await authorize(ROLES.SALES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { searchParams } = request.nextUrl;
  const columns = selectColumns(searchParams.get('columns'), COLUMNS);

  try {
    const rows = await collectRows(async (offset, limit) => {
      const { data, error } = await auth.supabase
        .from('customer_details')
        .select('id, customer_name, company, email, mobile_number, address, customer_type, created_at')
        .order('id')
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return data.map((customer) => ({ ...customer, created_at: formatDisplayDate(customer.created_at) }));
    }, 1000);

    return await exportResponse({ format: searchParams.get('format'), baseName: 'customers', sheetName: 'Customers', columns, rows });
  } catch (error) {
    return exportFailed(error);
  }
}
