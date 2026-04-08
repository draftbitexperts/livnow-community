import type { SupplyMilestoneIconKind, SupplyMilestoneRowModel } from '@/components/supplyPartnerMilestoneShared';

export type MilestoneWorkflowStatus = 'todo' | 'in_progress' | 'complete' | 'not_applicable';

export function inferWorkflowFromIcon(kind: SupplyMilestoneIconKind): MilestoneWorkflowStatus {
  switch (kind) {
    case 'check_teal':
      return 'complete';
    case 'in_progress_teal':
      return 'in_progress';
    case 'not_applicable_striped':
      return 'not_applicable';
    case 'solid_grey':
      return 'not_applicable';
    case 'hollow_grey':
    case 'hollow_teal':
    default:
      return 'todo';
  }
}

export function workflowToIconKind(w: MilestoneWorkflowStatus): SupplyMilestoneIconKind {
  switch (w) {
    case 'complete':
      return 'check_teal';
    case 'in_progress':
      return 'in_progress_teal';
    case 'not_applicable':
      return 'not_applicable_striped';
    case 'todo':
      return 'hollow_teal';
  }
}

/** Short m/d for milestone "Completed" when user marks complete without a prior date. */
export function formatShortMonthDay(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function mergeMilestoneRowWithWorkflow(
  row: SupplyMilestoneRowModel,
  workflow: MilestoneWorkflowStatus,
  todayShort: string,
  forced = false
): SupplyMilestoneRowModel {
  const icon = workflowToIconKind(workflow);
  if (workflow === 'complete') {
    const keepDate = row.completed && !row.completedMuted;
    return {
      ...row,
      icon,
      completed: keepDate ? row.completed : todayShort,
      completedMuted: false,
    };
  }
  if (workflow === 'in_progress') {
    return {
      ...row,
      icon,
      completed: forced ? null : row.completed,
      completedMuted: forced ? true : row.completedMuted ?? true,
    };
  }
  if (workflow === 'not_applicable') {
    if (forced) {
      return {
        ...row,
        icon,
        completed: null,
        completedMuted: true,
      };
    }
    return {
      ...row,
      icon,
      completed: row.completed,
      completedMuted: row.completedMuted ?? true,
    };
  }
  /* todo */
  return {
    ...row,
    icon,
    completed: forced ? null : row.completed,
    completedMuted: forced ? true : (row.completedMuted ?? true),
  };
}

export function mergeRowsWithOverrides(
  rows: SupplyMilestoneRowModel[],
  overrides: Record<string, MilestoneWorkflowStatus>,
  todayShort: string
): SupplyMilestoneRowModel[] {
  return rows.map((row) => {
    const override = overrides[row.id];
    const forced = override !== undefined;
    const workflow = override ?? inferWorkflowFromIcon(row.icon);
    return mergeMilestoneRowWithWorkflow(row, workflow, todayShort, forced);
  });
}
