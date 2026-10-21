import { Stage, Priority } from './types';

// Keys match public.stages.code and labels match public.stages.name, plus the
// two states get_paginated_orders reports after production ends.
export const STAGE_CONFIG: Record<Stage | 'out_for_delivery' | 'delivered', { label: string; color: string; }> = {
  carpentry: { label: 'Carpentry', color: '#b91c1c' },                 // Red-700
  marking_cutting: { label: 'Marking and Cutting', color: '#dc2626' }, // Red-600
  stitching: { label: 'Stitching', color: '#ef4444' },                 // Red-500
  cladding: { label: 'Cladding', color: '#f87171' },                   // Red-400
  final_qc: { label: 'Final QC', color: '#fca5a5' },                   // Red-300
  packing_loading: { label: 'Packing and Loading', color: '#fecaca' }, // Red-200
  out_for_delivery: { label: 'Out for Delivery', color: '#16a34a' },  // Green-600
  delivered: { label: 'Delivered', color: '#22c55e' },                 // Green-500
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; value: number }> = {
  3: { label: 'Urgent', color: '#b91c1c', value: 4 },
  2: { label: 'High', color: '#ef4444', value: 3 },
  1: { label: 'Medium', color: '#9ca3af', value: 2 },
  0: { label: 'Low', color: '#6b7280', value: 1 },
};
