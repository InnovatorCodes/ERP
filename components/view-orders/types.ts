// --- TYPE DEFINITIONS ---
export type Stage = 'carpentry' | 'webbing' | 'marking_cutting' | 'stitching' | 'cladding' | 'final_qc';
export type Priority = 0 | 1 | 2 | 3;
export type SortKey = 'dueDate' | 'priority' | 'id';
export type View = 'list' | 'kanban';

export type QCItems = { [item: string]: boolean };
export type QCChecklist = { [key in Stage]?: QCItems };

export interface Order {
  id: string;
  customer: string;
  product: string;
  dueDate: string;
  stage: string;
  priority: Priority;
  productId: number;
  productType: 'sofa' | 'bed';
}

// --- CHECKLIST TYPES ---
export type CheckStatus = 'passed' | 'failed' | 'pending' | 'skipped';

export type CheckItem = {
  check_id: number;
  name: string;
  status: CheckStatus;
  failure_report?: string;
  inspected_by?: string;
  updated_at?: string;
};
