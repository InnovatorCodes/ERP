'use server';

import { revalidatePath } from 'next/cache';
import { authorize, ROLES } from '@/lib/auth';

export async function deleteProduct(productId: string, productType: 'sofa' | 'bed') {
  const auth = await authorize(ROLES.MANAGEMENT);
  if (!auth.ok) return { success: false, message: auth.message };

  const tableName = productType === 'sofa' ? 'sofa_products' : 'bed_products';

  const { error } = await auth.supabase
    .from(tableName)
    .delete()
    .eq('id', productId);

  if (error) {
    console.error('Error deleting product:', error);
    // 23503 = foreign key violation: the product is used by an order.
    const message = error.code === '23503'
      ? 'This product is used in existing orders and cannot be deleted.'
      : 'Failed to delete product.';
    return { success: false, message };
  }

  revalidatePath('/products');
  return { success: true, message: 'Product deleted successfully.' };
}
