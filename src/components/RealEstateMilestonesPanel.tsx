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

export type RealEstateMilestoneScenario =
  | 'standard'
  | 'declined_referred'
  | 'cancelled_referred'
  | 'all_complete'
  | 'all_pending';

export type RealEstateMilestoneRowModel = SupplyMilestoneRowModel;

function timelineLineColor(scenario: RealEstateMilestoneScenario): string {
  if (scenario === 'declined_referred' || scenario === 'cancelled_referred') return '#ACACAD';
  return SUPPLY_MILESTONE_TEAL;
}

function buildRows(scenario: RealEstateMilestoneScenario): SupplyMilestoneRowModel[] {
  const companies = (
    <div className="mt-1 space-y-0.5 font-source-sans-3" style={{ fontWeight: 500, fontSize: 16, color: '#323234' }}>
      <p>Realty Company 1</p>
      <p>Realty Company 2</p>
      <p>Realty Company 3</p>
    </div>
  );

  const listedContact = (
    <div className="mt-1 space-y-0.5 font-source-sans-3" style={{ fontSize: 16, color: '#323234' }}>
      <p className="font-semibold">[Company Name]</p>
      <p style={{ fontWeight: 500 }}>[Primary Contact Name]</p>
      <p style={{ fontWeight: 500 }}>(123)456-7890</p>
      <p style={{ fontWeight: 500 }}>email@email.com</p>
    </div>
  );

  switch (scenario) {
    case 'cancelled_referred':
      return [
        {
          id: 'm1',
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
          id: 'm2',
          icon: 'hollow_grey',
          title: 'Listed',
          titleMuted: true,
          details: null,
          owner: 'dash',
          completed: null,
          completedMuted: true,
        },
        {
          id: 'm3',
          icon: 'hollow_grey',
          title: 'Under Contract',
          titleMuted: true,
          details: null,
          owner: 'dash',
          completed: null,
          completedMuted: true,
        },
        {
          id: 'm4',
          icon: 'hollow_grey',
          title: 'Closed',
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
          id: 'm1',
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
          id: 'm2',
          icon: 'hollow_grey',
          title: 'Listed',
          titleMuted: true,
          details: null,
          owner: 'dash',
          completed: null,
          completedMuted: true,
        },
        {
          id: 'm3',
          icon: 'hollow_grey',
          title: 'Under Contract',
          titleMuted: true,
          details: null,
          owner: 'dash',
          completed: null,
          completedMuted: true,
        },
        {
          id: 'm4',
          icon: 'hollow_grey',
          title: 'Closed',
          titleMuted: true,
          details: null,
          owner: 'dash',
          completed: null,
          completedMuted: true,
        },
      ];

    case 'all_complete':
      return [
        {
          id: 'm1',
          icon: 'check_teal',
          title: 'Referred',
          titleMuted: false,
          details: companies,
          owner: 'pair',
          completed: '3/17',
        },
        {
          id: 'm2',
          icon: 'check_teal',
          title: 'Listed',
          titleMuted: false,
          details: listedContact,
          owner: 'pair',
          completed: '3/18',
        },
        {
          id: 'm3',
          icon: 'check_teal',
          title: 'Under Contract',
          titleMuted: false,
          details: (
            <p className="mt-1 font-source-sans-3" style={{ fontWeight: 500, fontSize: 16, color: '#323234' }}>
              3/23/25
            </p>
          ),
          owner: 'pair',
          completed: null,
        },
        {
          id: 'm4',
          icon: 'check_teal',
          title: 'Closed',
          titleMuted: false,
          details: (
            <p className="mt-1 font-source-sans-3" style={{ fontWeight: 500, fontSize: 16, color: '#323234' }}>
              3/31/25
            </p>
          ),
          owner: 'pair',
          completed: '3/31',
        },
      ];

    case 'all_pending':
      return [
        {
          id: 'm1',
          icon: 'hollow_teal',
          title: 'Referred',
          titleMuted: false,
          details: null,
          owner: 'pair',
          completed: null,
        },
        {
          id: 'm2',
          icon: 'hollow_teal',
          title: 'Listed',
          titleMuted: false,
          details: null,
          owner: 'pair',
          completed: null,
        },
        {
          id: 'm3',
          icon: 'hollow_teal',
          title: 'Under Contract',
          titleMuted: false,
          details: null,
          owner: 'pair',
          completed: null,
        },
        {
          id: 'm4',
          icon: 'hollow_teal',
          title: 'Closed',
          titleMuted: false,
          details: null,
          owner: 'pair',
          completed: null,
        },
      ];

    case 'standard':
    default:
      return [
        {
          id: 'm1',
          icon: 'check_teal',
          title: 'Referred',
          titleMuted: false,
          details: companies,
          owner: 'pair',
          completed: '3/17',
        },
        {
          id: 'm2',
          icon: 'check_teal',
          title: 'Listed',
          titleMuted: false,
          details: listedContact,
          owner: 'pair',
          completed: '3/18',
        },
        {
          id: 'm3',
          icon: 'hollow_teal',
          title: 'Under Contract',
          titleMuted: false,
          details: (
            <p className="mt-1 font-source-sans-3" style={{ fontWeight: 500, fontSize: 16, color: '#323234' }}>
              3/23/25
            </p>
          ),
          owner: 'pair',
          completed: null,
        },
        {
          id: 'm4',
          icon: 'hollow_teal',
          title: 'Closed',
          titleMuted: false,
          details: (
            <p className="mt-1 font-source-sans-3" style={{ fontWeight: 500, fontSize: 16, color: '#323234' }}>
              3/31/25
            </p>
          ),
          owner: 'pair',
          completed: null,
        },
      ];
  }
}

export default function RealEstateMilestonesPanel({
  scenario,
  serviceId,
  milestoneStatusOverrides,
  todayShort,
  onMilestonePopoverOpen,
}: {
  scenario: RealEstateMilestoneScenario;
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
  const lineColor = timelineLineColor(scenario);
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
