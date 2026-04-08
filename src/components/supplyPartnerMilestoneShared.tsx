import { Check } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

export const SUPPLY_MILESTONE_TEAL = 'hsla(191, 47%, 35%, 1)';
export const SUPPLY_MILESTONE_BORDER = '#E3E3E4';

/** Solid light grey fill, thin darker grey ring — Not Applicable (no pattern) */
export const NOT_APPLICABLE_INNER_FILL = '#E8E9EA';
export const NOT_APPLICABLE_BORDER = '#A8AAAC';

/** Vertical split: left white, right teal (In Progress) */
export function MilestoneInProgressCircle({
  size,
  borderWidth,
  teal = SUPPLY_MILESTONE_TEAL,
}: {
  size: number;
  borderWidth: number;
  teal?: string;
}) {
  const r = size / 2;
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-white"
      style={{
        width: size,
        height: size,
        boxSizing: 'border-box',
        borderWidth,
        borderStyle: 'solid',
        borderColor: teal,
      }}
    >
      <div
        className="absolute bottom-0 right-0 top-0"
        style={{
          width: '50%',
          backgroundColor: teal,
          borderBottomRightRadius: r,
          borderTopRightRadius: r,
        }}
      />
    </div>
  );
}

export function MilestoneNotApplicableCircle({ size, borderWidth }: { size: number; borderWidth: number }) {
  return (
    <div
      className="shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        boxSizing: 'border-box',
        borderWidth,
        borderStyle: 'solid',
        borderColor: NOT_APPLICABLE_BORDER,
        backgroundColor: NOT_APPLICABLE_INNER_FILL,
      }}
    />
  );
}

export const SUPPLY_MILESTONE_HEADER_STYLE: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 500,
  fontSize: '14px',
  lineHeight: '20px',
  color: '#505051',
};

export const SUPPLY_MILESTONE_GRID_COLS = '3rem minmax(0, 1fr) 6.5rem 4.75rem';

export type SupplyMilestoneIconKind =
  | 'check_teal'
  | 'hollow_teal'
  | 'hollow_grey'
  | 'solid_grey'
  | 'in_progress_teal'
  | 'not_applicable_striped';

export interface SupplyMilestoneRowModel {
  id: string;
  icon: SupplyMilestoneIconKind;
  title: string;
  titleMuted: boolean;
  details: ReactNode;
  badge?: string;
  owner: 'pair' | 'dash';
  completed: string | null;
  completedMuted?: boolean;
}

const avatarStyle: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 100,
  backgroundColor: SUPPLY_MILESTONE_TEAL,
  border: '1.5px solid #FFFFFF',
  boxSizing: 'border-box',
  fontSize: 10,
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  fontWeight: 600,
  color: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

function checkIconSize(px: number) {
  return Math.round(px * 0.52);
}

/** Milestone shapes for timeline — outer size includes 1px border (box-sizing: border-box). */
export function SupplyMilestoneStatusDisplay({
  kind,
  sizePx,
}: {
  kind: SupplyMilestoneIconKind;
  sizePx: number;
}) {
  const bw = 1;

  if (kind === 'check_teal') {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{ width: sizePx, height: sizePx, backgroundColor: SUPPLY_MILESTONE_TEAL }}
      >
        <Check size={checkIconSize(sizePx)} className="text-white" strokeWidth={2.5} aria-hidden />
      </div>
    );
  }

  if (kind === 'in_progress_teal') {
    return <MilestoneInProgressCircle size={sizePx} borderWidth={bw} />;
  }

  if (kind === 'not_applicable_striped') {
    return <MilestoneNotApplicableCircle size={sizePx} borderWidth={bw} />;
  }

  if (kind === 'solid_grey') {
    return <div className="shrink-0 rounded-full" style={{ width: sizePx, height: sizePx, backgroundColor: '#C8C8C8' }} />;
  }

  const ring = kind === 'hollow_grey' ? '#ACACAD' : SUPPLY_MILESTONE_TEAL;
  return (
    <div
      className="shrink-0 rounded-full bg-white"
      style={{
        width: sizePx,
        height: sizePx,
        boxSizing: 'border-box',
        borderWidth: bw,
        borderStyle: 'solid',
        borderColor: ring,
      }}
    />
  );
}

export function SupplyMilestoneStatusIcon({ kind }: { kind: SupplyMilestoneIconKind }) {
  return <SupplyMilestoneStatusDisplay kind={kind} sizePx={24} />;
}

export function SupplyMilestoneOwnerCell({ mode }: { mode: 'pair' | 'dash' }) {
  if (mode === 'dash') {
    return (
      <div className="flex w-full items-center justify-center">
        <span className="font-source-sans-3 tabular-nums text-[#A3A3A3]" style={{ fontSize: 16, fontWeight: 500 }}>
          --
        </span>
      </div>
    );
  }
  return (
    <div className="flex w-full items-center justify-center">
      <div className="flex shrink-0 items-center">
        <div className="relative z-[2]" style={avatarStyle}>
          KF
        </div>
        <div className="relative z-[1] -ml-2.5" style={avatarStyle}>
          MS
        </div>
      </div>
    </div>
  );
}

export type SupplyPartnerMilestonesCardProps = {
  rows: SupplyMilestoneRowModel[];
  lineColor: string;
  thinTimeline?: boolean;
  /** Kept for API compatibility; timeline controls are 24×24. */
  checkboxIndicators?: boolean;
  /** When set, each milestone control is a button that opens the status popover. */
  onMilestoneStatusClick?: (rowId: string, title: string, button: HTMLButtonElement) => void;
};

export default function SupplyPartnerMilestonesCard({
  rows,
  lineColor,
  thinTimeline = false,
  checkboxIndicators: _checkboxIndicators = false,
  onMilestoneStatusClick,
}: SupplyPartnerMilestonesCardProps) {
  const shapeSize = 24;

  const renderStatusControl = (row: SupplyMilestoneRowModel) => {
    const shape = <SupplyMilestoneStatusDisplay kind={row.icon} sizePx={shapeSize} />;
    if (!onMilestoneStatusClick) {
      return shape;
    }
    return (
      <button
        type="button"
        className="rounded-full p-0 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#307584] focus-visible:ring-offset-2"
        aria-label={`${row.title}, set status`}
        onClick={(e) => onMilestoneStatusClick(row.id, row.title, e.currentTarget)}
      >
        {shape}
      </button>
    );
  };

  return (
    <>
      <div
        className="mb-2 grid gap-x-6 gap-y-0 font-source-sans-3"
        style={{ gridTemplateColumns: SUPPLY_MILESTONE_GRID_COLS }}
      >
        <div aria-hidden />
        <div style={SUPPLY_MILESTONE_HEADER_STYLE}>Status</div>
        <div className="flex justify-center" style={{ ...SUPPLY_MILESTONE_HEADER_STYLE, textAlign: 'center' }}>
          Owner
        </div>
        <div className="flex justify-end" style={{ ...SUPPLY_MILESTONE_HEADER_STYLE, textAlign: 'right' }}>
          Completed
        </div>
      </div>

      <div className="rounded-xl bg-white" style={{ border: `1px solid ${SUPPLY_MILESTONE_BORDER}` }}>
        <div className="px-4 sm:px-5">
          {rows.map((row, index) => {
            const isLast = index === rows.length - 1;
            const titleColor = row.titleMuted ? '#ACACAD' : '#323234';
            const completedDisplay = row.completed ?? '--';
            const completedStyle: CSSProperties = {
              fontFamily: 'var(--font-source-sans-3), sans-serif',
              fontWeight: 500,
              fontSize: 16,
              lineHeight: '20px',
              color: row.completedMuted ? '#A3A3A3' : SUPPLY_MILESTONE_TEAL,
            };

            return (
              <div
                key={row.id}
                className="grid items-stretch gap-x-6 border-b border-[#E3E3E4] py-5 last:border-b-0"
                style={{ gridTemplateColumns: SUPPLY_MILESTONE_GRID_COLS }}
              >
                {/* Circle first (aligned with title row), gap, then dashed segment only below — not a full-card spine */}
                <div className="flex h-full min-h-0 flex-col items-center self-stretch">
                  <div className="relative z-[2] shrink-0 rounded-full bg-white">
                    {renderStatusControl(row)}
                  </div>
                  <div className="h-[10px] w-full shrink-0" aria-hidden />
                  <div className="flex min-h-0 w-full flex-1 flex-col items-center">
                    <div
                      className={`mx-auto w-0 flex-1 border-dashed ${thinTimeline ? 'border-l' : 'border-l-2'}`}
                      style={{ borderLeftColor: lineColor, minHeight: isLast ? 12 : 16 }}
                    />
                  </div>
                  <div className={`w-full shrink-0 ${isLast ? 'h-2' : 'h-3'}`} aria-hidden />
                </div>

                <div className="min-w-0 self-start">
                  <h4
                    className="font-source-sans-3"
                    style={{
                      fontWeight: 600,
                      fontSize: 18,
                      lineHeight: '22px',
                      color: titleColor,
                    }}
                  >
                    {row.title}
                  </h4>
                  {row.badge ? (
                    <span
                      className="mt-2 inline-block rounded-full px-2.5 py-0.5 font-source-sans-3 text-xs font-semibold text-white"
                      style={{ backgroundColor: '#505051' }}
                    >
                      {row.badge}
                    </span>
                  ) : null}
                  {row.details}
                </div>

              <div className="flex min-w-0 items-center justify-center self-center">
                <SupplyMilestoneOwnerCell mode={row.owner} />
              </div>

              <div className="flex min-w-0 items-center justify-end self-center">
                <span className="shrink-0 tabular-nums" style={completedStyle}>
                  {completedDisplay}
                </span>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
