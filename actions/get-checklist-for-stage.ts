'use server';

import { createClient } from '@/utils/supabase/server';

export async function getChecklistForStage(orderItemId: number, stageId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('checks')
    .select(`
      check_id,
      name,
      sequence,
      product_checklist_progress!left (
        status,
        failure_report,
        inspected_by,
        updated_at
      )
    `)
    .eq('stage_id', stageId)
    .eq('product_checklist_progress.order_item_id', orderItemId)
    .order('sequence');

  if (error) {
    console.error('Error fetching checklist for stage:', error);
    return [];
  }

  return data.map(item => {
    const progress = item.product_checklist_progress[0];
    return {
      ...item,
      status: progress?.status || 'pending',
      failure_report: progress?.failure_report,
      updated_at: progress?.updated_at,
    };
  });
}
