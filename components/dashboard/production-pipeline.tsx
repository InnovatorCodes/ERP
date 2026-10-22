import React from 'react';
import { Factory } from 'lucide-react';
import { STAGE_CONFIG } from '@/components/view-orders/data';
import { EmptyState } from '@/components/ui/empty-state';

interface ProductionPipelineProps {
  /** Active order items per stage, keyed by stage name (e.g. "Carpentry"). */
  data: Partial<Record<string, number>>;
}

// Stage order and colours come from STAGE_CONFIG (labels match the database stage names).
const STAGES = Object.values(STAGE_CONFIG).filter((stage) => !['Out for Delivery', 'Delivered'].includes(stage.label));

const ProductionPipeline: React.FC<ProductionPipelineProps> = ({ data }) => {
  const rows = STAGES.map((stage) => ({ ...stage, count: data[stage.label] ?? 0 }));
  const largest = Math.max(1, ...rows.map((row) => row.count));
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="h-full rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold text-foreground">Production pipeline</h2>
      <p className="mb-4 text-sm text-muted-foreground">Order items currently active in each stage</p>
      {total === 0 ? (
        <EmptyState icon={Factory} title="Nothing in production" className="border-0 py-12" />
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} />
                  {row.label}
                </span>
                <span className="font-medium tabular-nums text-foreground">{row.count}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${(row.count / largest) * 100}%`, backgroundColor: row.color }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProductionPipeline;
