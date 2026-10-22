import React from 'react';
import { Badge } from '@/components/ui/badge';
import { STAGE_CONFIG, PRIORITY_CONFIG } from './data';
import type { Priority } from './types';

/** A production stage (by code, e.g. "carpentry") as a dot + label pill. */
export function StageBadge({ stage }: { stage: string }) {
  const config = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG];
  return (
    <Badge variant="outline" className="bg-card font-normal">
      <span className="size-2 rounded-full" style={{ backgroundColor: config?.color ?? 'var(--muted-foreground)' }} />
      {config?.label ?? stage}
    </Badge>
  );
}

/** All stages from a comma-separated list such as "carpentry, stitching". */
export function StageBadges({ stages }: { stages: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {stages.split(',').map((stage) => stage.trim()).filter(Boolean).map((stage) => (
        <StageBadge key={stage} stage={stage} />
      ))}
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG[1];
  return <Badge variant={config.tone}>{config.label}</Badge>;
}
