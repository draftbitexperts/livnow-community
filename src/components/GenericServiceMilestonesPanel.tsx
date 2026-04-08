import { useCallback, useMemo } from 'react';
import SupplyPartnerMilestonesCard, {
  SUPPLY_MILESTONE_TEAL,
  type SupplyMilestoneRowModel,
} from '@/components/supplyPartnerMilestoneShared';
import {
  inferWorkflowFromIcon,
  mergeRowsWithOverrides,
  type MilestoneWorkflowStatus,
} from '@/lib/milestoneWorkflow';

export type GenericMilestoneScenario =
  | 'declined_referred'
  | 'cancelled_referred'
  | 'referred_complete_others_pending'
  | 'all_steps_detailed'
  | 'all_not_started'
  | 'two_complete_one_pending';

function lineColorForScenario(scenario: GenericMilestoneScenario): string {
  if (scenario === 'two_complete_one_pending') return SUPPLY_MILESTONE_TEAL;
  return '#ACACAD';
}

const detailClass = 'mt-1 space-y-0.5 font-source-sans-3';
const detailTextStyle = { fontWeight: 500 as const, fontSize: 16, color: '#505051' };

function companyList() {
  return (
    <div className={detailClass} style={detailTextStyle}>
      <p>Company 1</p>
      <p>Company 2</p>
      <p>Company 3</p>
    </div>
  );
}

function contactBlock() {
  return (
    <div className={detailClass} style={{ fontSize: 16, color: '#505051' }}>
      <p className="font-semibold text-[#323234]">[Company Name]</p>
      <p style={{ fontWeight: 500 }}>[Primary Contact Name]</p>
      <p style={{ fontWeight: 500 }}>(123)456-7890</p>
      <p style={{ fontWeight: 500 }}>email@email.com</p>
    </div>
  );
}

function buildRows(scenario: GenericMilestoneScenario): SupplyMilestoneRowModel[] {
  switch (scenario) {
    case 'cancelled_referred':
      return [
        {
          id: 'g1',
          icon: 'solid_grey',
          title: 'Referred',
          titleMuted: false,
          details: null,
          badge: 'Cancelled',
          owner: 'pair',
          completed: '3/17',
          completedMuted: false,
        },
        {
          id: 'g2',
          icon: 'hollow_grey',
          title: 'Active',
          titleMuted: true,
          details: null,
          owner: 'dash',
          completed: null,
          completedMuted: true,
        },
        {
          id: 'g3',
          icon: 'hollow_grey',
          title: 'Complete',
          titleMuted: true,
          details: null,
          owner: 'dash',
          completed: null,
          completedMuted: true,
        },
      ];

    case 'declined_referred':
      return [
        {
          id: 'g1',
          icon: 'solid_grey',
          title: 'Referred',
          titleMuted: false,
          details: null,
          badge: 'Declined',
          owner: 'pair',
          completed: '3/17',
          completedMuted: false,
        },
        {
          id: 'g2',
          icon: 'hollow_grey',
          title: 'Active',
          titleMuted: true,
          details: null,
          owner: 'dash',
          completed: null,
          completedMuted: true,
        },
        {
          id: 'g3',
          icon: 'hollow_grey',
          title: 'Complete',
          titleMuted: true,
          details: null,
          owner: 'dash',
          completed: null,
          completedMuted: true,
        },
      ];

    case 'referred_complete_others_pending':
      return [
        {
          id: 'g1',
          icon: 'check_teal',
          title: 'Referred',
          titleMuted: false,
          details: companyList(),
          owner: 'pair',
          completed: '3/17',
          completedMuted: false,
        },
        {
          id: 'g2',
          icon: 'hollow_teal',
          title: 'Active',
          titleMuted: false,
          details: null,
          owner: 'pair',
          completed: null,
          completedMuted: true,
        },
        {
          id: 'g3',
          icon: 'hollow_teal',
          title: 'Complete',
          titleMuted: false,
          details: null,
          owner: 'pair',
          completed: null,
          completedMuted: true,
        },
      ];

    case 'all_steps_detailed':
      return [
        {
          id: 'g1',
          icon: 'check_teal',
          title: 'Referred',
          titleMuted: false,
          details: companyList(),
          owner: 'pair',
          completed: '3/17',
          completedMuted: false,
        },
        {
          id: 'g2',
          icon: 'check_teal',
          title: 'Active',
          titleMuted: false,
          details: contactBlock(),
          owner: 'pair',
          completed: '3/18',
          completedMuted: false,
        },
        {
          id: 'g3',
          icon: 'hollow_teal',
          title: 'Complete',
          titleMuted: false,
          details: (
            <p className="mt-1 font-source-sans-3" style={{ ...detailTextStyle }}>
              3/23/25
            </p>
          ),
          owner: 'pair',
          completed: null,
          completedMuted: true,
        },
      ];

    case 'all_not_started':
      return [
        {
          id: 'g1',
          icon: 'hollow_teal',
          title: 'Referred',
          titleMuted: false,
          details: null,
          owner: 'pair',
          completed: null,
          completedMuted: true,
        },
        {
          id: 'g2',
          icon: 'hollow_teal',
          title: 'Active',
          titleMuted: false,
          details: null,
          owner: 'pair',
          completed: null,
          completedMuted: true,
        },
        {
          id: 'g3',
          icon: 'hollow_teal',
          title: 'Complete',
          titleMuted: false,
          details: null,
          owner: 'pair',
          completed: null,
          completedMuted: true,
        },
      ];

    case 'two_complete_one_pending':
      return [
        {
          id: 'g1',
          icon: 'check_teal',
          title: 'Referred',
          titleMuted: false,
          details: companyList(),
          owner: 'pair',
          completed: '3/17',
          completedMuted: false,
        },
        {
          id: 'g2',
          icon: 'check_teal',
          title: 'Active',
          titleMuted: false,
          details: contactBlock(),
          owner: 'pair',
          completed: '3/18',
          completedMuted: false,
        },
        {
          id: 'g3',
          icon: 'hollow_teal',
          title: 'Complete',
          titleMuted: false,
          details: (
            <p className="mt-1 font-source-sans-3" style={{ fontWeight: 500, fontSize: 16, color: '#323234' }}>
              3/23/25
            </p>
          ),
          owner: 'pair',
          completed: null,
          completedMuted: true,
        },
      ];
  }
}

export default function GenericServiceMilestonesPanel({
  scenario,
  serviceId,
  milestoneStatusOverrides,
  todayShort,
  onMilestonePopoverOpen,
}: {
  scenario: GenericMilestoneScenario;
  serviceId: string;
  milestoneStatusOverrides: Record<string, MilestoneWorkflowStatus>;
  todayShort: string;
  onMilestonePopoverOpen: (p: {
    serviceId: string;
    rowId: string;
    title: string;
    anchorRect: DOMRect;
    currentWorkflow: MilestoneWorkflowStatus;
  }) => void;
}) {
  const baseRows = useMemo(() => buildRows(scenario), [scenario]);
  const rowOverrides = useMemo(() => {
    const p: Record<string, MilestoneWorkflowStatus> = {};
    const pref = `${serviceId}:`;
    for (const [k, v] of Object.entries(milestoneStatusOverrides)) {
      if (k.startsWith(pref)) p[k.slice(pref.length)] = v;
    }
    return p;
  }, [milestoneStatusOverrides, serviceId]);
  const rows = useMemo(
    () => mergeRowsWithOverrides(baseRows, rowOverrides, todayShort),
    [baseRows, rowOverrides, todayShort]
  );
  const lineColor = lineColorForScenario(scenario);
  const handleMilestoneClick = useCallback(
    (rowId: string, title: string, button: HTMLButtonElement) => {
      const base = baseRows.find((r) => r.id === rowId);
      const workflow = rowOverrides[rowId] ?? (base ? inferWorkflowFromIcon(base.icon) : 'todo');
      onMilestonePopoverOpen({
        serviceId,
        rowId,
        title,
        anchorRect: button.getBoundingClientRect(),
        currentWorkflow: workflow,
      });
    },
    [baseRows, rowOverrides, serviceId, onMilestonePopoverOpen]
  );
  return (
    <SupplyPartnerMilestonesCard
      rows={rows}
      lineColor={lineColor}
      thinTimeline
      checkboxIndicators
      onMilestoneStatusClick={handleMilestoneClick}
    />
  );
}
