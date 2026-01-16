'use server'

import { createClient } from '@/utils/supabase/server'

export async function getOrderItemStageStatus(orderItemId: number) {
  const supabase = await createClient();

  // Call the optimized RPC function
  const { data, error } = await supabase.rpc(
    'get_order_item_stage_status_with_delivery_check',
    {
      p_order_item_id: orderItemId,
    }
  );

  if (error) {
    console.error('Error fetching order item stage status:', error);
    return [];
  }

  // The RPC function returns the data in the desired format
  return data;
}
