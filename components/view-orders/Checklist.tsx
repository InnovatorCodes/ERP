'use client';

import { useState, useTransition } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  SkipForward,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { updateCheckStatus } from '@/actions/update-check-status';
import { proceedToNextStage } from '@/actions/proceed-to-next-stage';
import { CheckItem, CheckStatus } from './types';

// Props for the main component
type ChecklistProps = {
  checklist: CheckItem[];
  orderItemId: number; // Required to identify which order item to update
  stageName: string;
  stageId: number;
  onProceed: () => void;
};

// Configuration for each status (icon, color, label)
const statusConfig: Record<
  CheckStatus,
  { icon: React.ReactNode; color: string; label: string }
> = {
  passed: {
    icon: <CheckCircle2 size={18} />,
    color: 'text-green-600 bg-green-100 border-green-200',
    label: 'Pass',
  },
  failed: {
    icon: <XCircle size={18} />,
    color: 'text-red-600 bg-red-100 border-red-200',
    label: 'Fail',
  },
  pending: {
    icon: <AlertCircle size={18} />,
    color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
    label: 'Pending',
  },
  skipped: {
    icon: <SkipForward size={18} />,
    color: 'text-gray-600 bg-gray-100 border-gray-200',
    label: 'Skip',
  },
};

export function Checklist({ checklist, orderItemId, stageId, onProceed }: ChecklistProps) {
  const [isPending, startTransition] = useTransition();
  const [checklistItems, setChecklistItems] = useState<CheckItem[]>(checklist);
  const [updatingCheckId, setUpdatingCheckId] = useState<number | null>(null);
  const [isFailPromptOpen, setFailPromptOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<CheckItem | null>(null);
  const [failureReport, setFailureReport] = useState('');

  const handleStatusUpdate = (checkId: number, newStatus: CheckStatus) => {
    if (newStatus === 'failed') {
      const check = checklistItems.find(item => item.check_id === checkId);
      if (check) {
        setSelectedCheck(check);
        setFailureReport(check.failure_report || '');
        setFailPromptOpen(true);
      }
    } else {
      setUpdatingCheckId(checkId);
      startTransition(async () => {
        await updateCheckStatus(orderItemId, checkId, newStatus);
        setChecklistItems(currentItems =>
          currentItems.map(item =>
            item.check_id === checkId
              ? { ...item, status: newStatus, updated_at: new Date().toISOString() }
              : item,
          ),
        );
        setUpdatingCheckId(null);
      });
    }
  };

  const handleFailureSubmit = () => {
    if (!selectedCheck) return;

    setUpdatingCheckId(selectedCheck.check_id);
    setFailPromptOpen(false);

    startTransition(async () => {
      await updateCheckStatus(
        orderItemId,
        selectedCheck.check_id,
        'failed',
        failureReport,
      );
      setChecklistItems(currentItems =>
        currentItems.map(item =>
          item.check_id === selectedCheck.check_id
            ? {
                ...item,
                status: 'failed',
                failure_report: failureReport,
                updated_at: new Date().toISOString(),
              }
            : item,
        ),
      );
      setUpdatingCheckId(null);
      setSelectedCheck(null);
      setFailureReport('');
    });
  };

  return (
    <div className="space-y-3">
      {checklistItems.map(item => {
        const isUpdating = isPending && updatingCheckId === item.check_id;
        return (
          <div
            key={item.check_id}
            className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              {/* Left Side: Check Details */}
              <div className="mb-3 sm:mb-0">
                <p className="font-semibold text-gray-800">{item.name}</p>
                {item.failure_report && (
                  <p className="text-sm text-red-500 mt-1">
                    <strong>Failure Report:</strong> {item.failure_report}
                  </p>
                )}
              </div>

              {/* Right Side: Status Actions */}
              <div className="flex items-center gap-2">
                {isUpdating ? (
                  <Loader2 className="animate-spin text-gray-400" />
                ) : (
                  (Object.keys(statusConfig) as CheckStatus[]).map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(item.check_id, status)}
                      disabled={isUpdating}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                        item.status === status
                          ? statusConfig[status].color
                          : 'text-gray-500 bg-white hover:bg-gray-50'
                      }`}
                      aria-label={`Set status to ${statusConfig[status].label}`}
                    >
                      {statusConfig[status].icon}
                      <span>{statusConfig[status].label}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
            {item.updated_at && (
              <p className="text-xs text-right text-gray-400 mt-2">
                Last updated: {new Date(item.updated_at).toLocaleString()}
              </p>
            )}
          </div>
        );
      })}

      {/* Failure Report Dialog */}
      <Dialog open={isFailPromptOpen} onOpenChange={setFailPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Report Failure for: {selectedCheck?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Describe the reason for failure..."
              value={failureReport}
              onChange={e => setFailureReport(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleFailureSubmit}
              disabled={isPending || !failureReport.trim()}
            >
              {isPending ? (
                <Loader2 className="animate-spin mr-2" />
              ) : null}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-6 text-center">
        <Button
          onClick={() => {
            startTransition(async () => {
              const result = await proceedToNextStage(orderItemId, stageId);
              if (result.success) {
                // The onProceed prop is likely causing a re-render.
                // For now, I will just switch the view back to the flow.
                // A better solution would be to lift the state up.
                onProceed(); // Assuming onProceed handles the view change
              } else {
                alert(result.error);
              }
            });
          }}
          disabled={
            isPending ||
            !checklistItems.every(
              item => item.status === 'passed' || item.status === 'skipped',
            )
          }
          className="px-8 py-3 text-lg font-semibold"
        >
          Proceed to Next Stage
        </Button>
      </div>
    </div>
  );
}
