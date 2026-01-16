import { Stage, Priority } from './types';

export const STAGE_CONFIG: Record<Stage | 'delivered', { label: string; color: string; }> = {
  carpentry: { label: 'Carpentry', color: '#b91c1c' },       // Red-700
  webbing: { label: 'Webbing', color: '#dc2626' },         // Red-600
  marking_cutting: { label: 'Marking', color: '#ef4444' }, // Red-500
  stitching: { label: 'Stitching', color: '#f87171' },     // Red-400
  cladding: { label: 'Cladding', color: '#fca5a5' },       // Red-300
  final_qc: { label: 'Final QC', color: '#fecaca' },         // Red-200
  delivered: { label: 'Delivered', color: '#22c55e' },     // Green-500
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; value: number }> = {
  3: { label: 'Urgent', color: '#b91c1c', value: 4 },
  2: { label: 'High', color: '#ef4444', value: 3 },
  1: { label: 'Medium', color: '#9ca3af', value: 2 },
  0: { label: 'Low', color: '#6b7280', value: 1 },
};
