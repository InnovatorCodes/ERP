'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteProduct(productId: string, productType: 'sofa' | 'bed') {
  const supabase = await createClient();
  const tableName = productType === 'sofa' ? 'sofa_products' : 'bed_products';

  console.log(`Deleting product with ID: ${productId} from table: ${tableName}`);
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', productId);

  if (error) {
    console.error('Error deleting product:', error);
    return { success: false, message: 'Failed to delete product.' };
  }

  revalidatePath('/products');
  return { success: true, message: 'Product deleted successfully.' };
}
