import type { MilestoneWorkflowStatus } from '@/lib/milestoneWorkflow';
import { Check } from 'lucide-react';
import type { CSSProperties } from 'react';
import {
  MilestoneInProgressCircle,
  MilestoneNotApplicableCircle,
  SUPPLY_MILESTONE_TEAL,
} from '@/components/supplyPartnerMilestoneShared';

const TEAL = SUPPLY_MILESTONE_TEAL;
const MENU_W = 220;

const rowStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 500,
  fontSize: 15,
  lineHeight: '20px',
  color: '#323234',
};

function ShapeTodo({ size }: { size: number }) {
  return (
    <div
      className="shrink-0 rounded-full bg-white"
      style={{
        width: size,
        height: size,
        boxSizing: 'border-box',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: TEAL,
      }}
    />
  );
}

function ShapeInProgress({ size }: { size: number }) {
  return <MilestoneInProgressCircle size={size} borderWidth={1} teal={TEAL} />;
}

function ShapeComplete({ size }: { size: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: TEAL }}
    >
      <Check size={Math.round(size * 0.55)} className="text-white" strokeWidth={2.5} />
    </div>
  );
}

function ShapeNotApplicable({ size }: { size: number }) {
  return <MilestoneNotApplicableCircle size={size} borderWidth={1} />;
}

const OPTIONS: { value: MilestoneWorkflowStatus; label: string; Shape: typeof ShapeTodo }[] = [
  { value: 'todo', label: 'To Do', Shape: ShapeTodo },
  { value: 'in_progress', label: 'In Progress', Shape: ShapeInProgress },
  { value: 'complete', label: 'Complete', Shape: ShapeComplete },
  { value: 'not_applicable', label: 'Not Applicable', Shape: ShapeNotApplicable },
];

const SHAPE_MENU = 24;

export type MilestoneStatusPopoverProps = {
  open: boolean;
  anchorRect: DOMRect | null;
  current: MilestoneWorkflowStatus;
  onClose: () => void;
  onSelect: (status: MilestoneWorkflowStatus) => void;
};

export default function MilestoneStatusPopover({
  open,
  anchorRect,
  current,
  onClose,
  onSelect,
}: MilestoneStatusPopoverProps) {
  if (!open || !anchorRect) return null;

  const left = anchorRect.left + anchorRect.width / 2;
  const top = anchorRect.bottom + 8;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] cursor-default bg-black/15"
        aria-label="Close status menu"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Status"
        className="fixed z-[70] rounded-lg border border-[#E3E3E4] bg-white py-1 shadow-lg"
        style={{
          width: MENU_W,
          left: Math.max(12, Math.min(left - MENU_W / 2, typeof window !== 'undefined' ? window.innerWidth - MENU_W - 12 : left)),
          top,
        }}
      >
        <div className="border-b border-[#EEF0F1] px-3 py-2 font-source-sans-3 text-sm font-semibold text-[#323234]">
          Status
        </div>
        <div className="py-1">
          {OPTIONS.map(({ value, label, Shape }) => {
            const selected = value === current;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onSelect(value)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#F4FAFA]"
                style={{
                  ...rowStyle,
                  backgroundColor: selected ? 'rgba(48, 117, 132, 0.12)' : undefined,
                }}
              >
                <Shape size={SHAPE_MENU} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
