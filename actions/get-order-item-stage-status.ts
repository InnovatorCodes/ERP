'use server'

import { authorize, ROLES } from '@/lib/auth'

export async function getOrderItemStageStatus(orderItemId: number) {
  const auth = await authorize(ROLES.STAFF);
  if (!auth.ok) return [];

  const { data, error } = await auth.supabase.rpc(
    'get_order_item_stage_status_with_delivery_check',
    {
      p_order_item_id: orderItemId,
    }
  );

  if (error) {
    console.error('Error fetching order item stage status:', error);
    return [];
  }

  return data;
}
