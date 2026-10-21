import { NextRequest, NextResponse } from 'next/server';
import { authorize, ROLES } from '@/lib/auth';
import { collectRows, exportFailed, exportResponse, selectColumns, type ExportColumn } from '@/lib/export';

const SHARED_COLUMNS: ExportColumn[] = [
  { key: 'id', label: 'Product ID' },
  { key: 'model_name', label: 'Model Name' },
  { key: 'description', label: 'Description' },
];

const COLUMNS: Record<'sofa' | 'bed', ExportColumn[]> = {
  sofa: [
    ...SHARED_COLUMNS,
    { key: 'model_family_configuration', label: 'Configuration' },
    { key: 'upholstery', label: 'Upholstery' },
    { key: 'upholstery_color', label: 'Upholstery Color' },
    { key: 'total_width', label: 'Width' },
    { key: 'total_depth', label: 'Depth' },
    { key: 'total_height', label: 'Height' },
    { key: 'customization', label: 'Customised' },
    { key: 'purchase_count', label: 'Times Ordered' },
  ],
  bed: [
    ...SHARED_COLUMNS,
    { key: 'bed_size', label: 'Bed Size' },
    { key: 'headboard_type', label: 'Headboard' },
    { key: 'storage_option', label: 'Storage' },
    { key: 'upholstery', label: 'Upholstery' },
    { key: 'upholstery_color', label: 'Upholstery Color' },
    { key: 'total_width', label: 'Width' },
    { key: 'total_depth', label: 'Depth' },
    { key: 'total_height', label: 'Height' },
    { key: 'customization', label: 'Customised' },
    { key: 'purchase_count', label: 'Times Ordered' },
  ],
};

export async function GET(request: NextRequest) {
  const auth = await authorize(ROLES.SALES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { searchParams } = request.nextUrl;
  const productType = searchParams.get('productType') === 'bed' ? 'bed' : 'sofa';
  const columns = selectColumns(searchParams.get('columns'), COLUMNS[productType]);
  const tableName = productType === 'sofa' ? 'sofa_products' : 'bed_products';

  try {
    const rows = await collectRows(async (offset, limit) => {
      const { data, error } = await auth.supabase
        .from(tableName)
        .select('*')
        .order('id')
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return data.map((product) => ({ ...product, customization: product.customization ? 'Yes' : 'No' }));
    }, 1000);

    return await exportResponse({
      format: searchParams.get('format'),
      baseName: `${productType}_products`,
      sheetName: productType === 'sofa' ? 'Sofas' : 'Beds',
      columns,
      rows,
    });
  } catch (error) {
    return exportFailed(error);
  }
}
