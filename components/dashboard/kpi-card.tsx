import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  title: string;
  value: string;
  Icon: LucideIcon;
  /** "alert" highlights a number that needs attention (e.g. overdue orders above zero). */
  tone?: 'default' | 'alert';
  hint?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, Icon, tone = 'default', hint }) => (
  <div className="rounded-xl border bg-card p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className={cn(
        "flex size-9 items-center justify-center rounded-lg",
        tone === 'alert' ? "bg-destructive-soft text-destructive" : "bg-accent text-accent-foreground"
      )}>
        <Icon className="size-[18px]" />
      </div>
    </div>
    <p className={cn("mt-2 text-3xl font-semibold tracking-tight", tone === 'alert' ? "text-destructive" : "text-foreground")}>
      {value}
    </p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export default KpiCard;
