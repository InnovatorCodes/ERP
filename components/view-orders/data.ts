import { Stage, Priority } from './types';

// Keys match public.stages.code and labels match public.stages.name, plus the
// two states get_paginated_orders reports after production ends.
// `color` is the stage's accent (dots, bars, column markers); badges draw it
// on a neutral background so text stays readable.
export const STAGE_CONFIG: Record<Stage | 'out_for_delivery' | 'delivered', { label: string; color: string; }> = {
  carpentry: { label: 'Carpentry', color: '#8b5a2b' },                 // walnut
  marking_cutting: { label: 'Marking and Cutting', color: '#b7791f' }, // ochre
  stitching: { label: 'Stitching', color: '#4f7a6b' },                 // sage
  cladding: { label: 'Cladding', color: '#5b6c8f' },                   // slate blue
  final_qc: { label: 'Final QC', color: '#7a5c8e' },                   // plum
  packing_loading: { label: 'Packing and Loading', color: '#2f7d86' }, // teal
  out_for_delivery: { label: 'Out for Delivery', color: '#2f7a4b' },  // green
  delivered: { label: 'Delivered', color: '#776b63' },                 // warm grey
};

export type PriorityTone = 'destructive' | 'warning' | 'accent' | 'secondary';

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; tone: PriorityTone; value: number }> = {
  3: { label: 'Urgent', color: '#c0392b', tone: 'destructive', value: 4 },
  2: { label: 'High', color: '#b7791f', tone: 'warning', value: 3 },
  1: { label: 'Medium', color: '#9a5a2c', tone: 'accent', value: 2 },
  0: { label: 'Low', color: '#a39a93', tone: 'secondary', value: 1 },
};
