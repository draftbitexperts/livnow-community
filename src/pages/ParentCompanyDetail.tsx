import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Pencil,
  Plus,
  X,
} from 'lucide-react';
import Pagination from '@/components/Pagination';
import PillSearchWithResults, { type PillSearchResultItem } from '@/components/PillSearchWithResults';
import SearchNormalIcon from '@/components/SearchNormalIcon';
import CommunityFormSlidePanel from '@/components/CommunityFormSlidePanel';
import CommunityViewDrawer from '@/components/CommunityViewDrawer';
import ParentCompanyFormSlidePanel from '@/components/ParentCompanyFormSlidePanel';
import ParentCompanyViewDrawer from '@/components/ParentCompanyViewDrawer';
import { BottomToast, type BottomToastPayload } from '@/components/BottomToast';
import {
  DEMO_COMMUNITIES,
  DEMO_PARENT_COMPANIES,
  type DemoCommunityRecord,
  type DemoParentCompanyRecord,
} from '@/lib/demoCommunities';
import { buildParentCompanyDrawerDetail } from '@/lib/parentCompanyDrawerDetail';

const TEAL = '#307584';
const PAGE_SIZE = 10;
const taskListBorderColor = '#E3E3E4';

const residentDetailTextStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: 16,
  lineHeight: '20px',
  letterSpacing: '0%',
  color: '#323234',
};

const residentDetailEmailColor = '#359689';

const sectionHeaderPillStyle: CSSProperties = {
  minWidth: 170,
  height: 24,
  borderRadius: 4,
  gap: 4,
  paddingTop: 4,
  paddingRight: 8,
  paddingBottom: 4,
  paddingLeft: 8,
  backgroundColor: '#E0F1EF',
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: 16,
  lineHeight: '20px',
  letterSpacing: '0%',
  color: '#323234',
};

const relocationSectionHeaderStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: 24,
  lineHeight: '28px',
  letterSpacing: '0%',
  color: '#323234',
};

const contentSectionHeaderStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 600,
  fontSize: '24px',
  lineHeight: '28px',
  letterSpacing: '0%',
  textAlign: 'center',
  color: '#323234',
};

const mainPanelContentStyle: CSSProperties = {
  paddingTop: 24,
  paddingRight: 24,
  paddingBottom: 42,
  paddingLeft: 24,
};

const residentTasksColumnHeaderStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 500,
  fontSize: '14px',
  lineHeight: '20px',
  letterSpacing: '0%',
  textAlign: 'left',
  color: '#505051',
};

const residentTasksRowTextStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 500,
  fontSize: '18px',
  lineHeight: '20px',
  letterSpacing: '0%',
  color: '#323234',
};

const addButtonStyle: CSSProperties = {
  height: 48,
  minWidth: 48,
  borderRadius: 9999,
  gap: 8,
  paddingTop: 10,
  paddingRight: 24,
  paddingBottom: 10,
  paddingLeft: 20,
  backgroundColor: TEAL,
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: 16,
  lineHeight: '22px',
  color: '#FFFFFF',
};

const TABLE_BORDER = '#ACACAD';
/** Fixed logo plate; centered on card regardless of sidebar width (~264px). */
const PARENT_COMPANY_LOGO_BOX = { width: 180, height: 80 } as const;
const FILTER_ACCENT = 'hsla(187, 47%, 35%, 1)';
const FILTER_CHIP_BG = 'hsla(168, 38%, 91%, 1)';
const FILTER_CHIP_TEXT = 'hsla(191, 47%, 32%, 1)';

function buildChildPillResults(rows: DemoCommunityRecord[], q: string): PillSearchResultItem[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const out: PillSearchResultItem[] = [];
  for (const row of rows) {
    const nameL = row.name.toLowerCase();
    const stateL = row.state.toLowerCase();
    const specL = row.relocation_specialist_display.toLowerCase();
    const parentL = row.parent_company_name.toLowerCase();
    if (nameL.includes(t)) {
      out.push({ id: row.id, category: '[Community Name]', title: row.name });
    } else if (parentL.includes(t)) {
      out.push({ id: row.id, category: '[Parent Company]', title: row.parent_company_name });
    } else if (stateL.includes(t)) {
      out.push({ id: row.id, category: '[State]', title: `${row.name} (${row.state})` });
    } else if (specL.includes(t)) {
      out.push({
        id: row.id,
        category: '[Relocation Specialist]',
        title: `${row.name} — ${row.relocation_specialist_display}`,
      });
    }
    if (out.length >= 8) break;
  }
  return out;
}

function recordMatchesChildCommunityFilters(
  rec: DemoCommunityRecord,
  types: Set<string>,
  states: Set<string>,
  specialists: Set<string>,
): boolean {
  if (types.size > 0 && !types.has(rec.community_type)) return false;
  if (states.size > 0 && !states.has(rec.state)) return false;
  if (specialists.size > 0 && !specialists.has(rec.relocation_specialist_display)) return false;
  return true;
}

function getResidentStatusBgColor(status: string): string {
  const key = (status ?? '').toLowerCase().replace(/\s+/g, '_');
  const colors: Record<string, string> = {
    active: '#307584',
    completed: '#659B7A',
    canceled: '#E35E5E',
    cancelled: '#E35E5E',
    closed: '#757576',
    on_hold: '#E9BC62',
    waitlist: '#E9BC62',
    waitlisted: '#E9BC62',
    pending: '#757576',
  };
  return colors[key] ?? '#757576';
}

function statusChipInlineStyle(status: string): CSSProperties {
  return {
    minWidth: 69,
    height: 24,
    opacity: 1,
    borderRadius: 4,
    gap: 4,
    paddingTop: 4,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    backgroundColor: getResidentStatusBgColor(status),
    fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
    fontWeight: 600,
    fontSize: 14,
    lineHeight: '20px',
    letterSpacing: '0%',
    color: '#FFFFFF',
  };
}

function FilterLinesIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  const stroke = 2;
  const cx = size / 2;
  const y1 = size * 0.28;
  const y2 = size / 2;
  const y3 = size * 0.72;
  const w1 = size * 0.85;
  const w2 = size * 0.55;
  const w3 = size * 0.3;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="square"
    >
      <line x1={cx - w1 / 2} y1={y1} x2={cx + w1 / 2} y2={y1} />
      <line x1={cx - w2 / 2} y1={y2} x2={cx + w2 / 2} y2={y2} />
      <line x1={cx - w3 / 2} y1={y3} x2={cx + w3 / 2} y2={y3} />
    </svg>
  );
}

function specialistInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (parts.length === 1) return (parts[0][0] + parts[0][0]).toUpperCase();
  return '—';
}

function websiteHref(raw: string): string {
  const t = raw.trim();
  if (!t) return '#';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, '')}`;
}

function companyLogoWordmark(name: string): { line1: string; line2: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { line1: '—', line2: '' };
  if (parts.length === 1) {
    const w = parts[0];
    const half = Math.ceil(w.length / 2);
    return {
      line1: w.slice(0, half).toUpperCase(),
      line2: w.slice(half).toUpperCase() || '',
    };
  }
  return {
    line1: parts[0].toUpperCase(),
    line2: parts.slice(1).join(' ').toUpperCase(),
  };
}

export type ParentCompanyDetailLocationState = {
  parentCompanyRecord?: DemoParentCompanyRecord;
  linkedCommunities?: DemoCommunityRecord[];
};

type ChildSortField = 'name' | 'state' | 'specialist' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function ParentCompanyDetail() {
  const { parentId } = useParams<{ parentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ParentCompanyDetailLocationState | null;

  const [sortField, setSortField] = useState<ChildSortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(0);

  const baseCommunities = useMemo(() => {
    if (state?.linkedCommunities !== undefined) return [...state.linkedCommunities];
    return [...DEMO_COMMUNITIES];
  }, [state?.linkedCommunities]);

  const [communitiesList, setCommunitiesList] = useState<DemoCommunityRecord[]>(() => [...DEMO_COMMUNITIES]);

  useEffect(() => {
    setCommunitiesList(baseCommunities);
  }, [baseCommunities]);

  const baseParentCompanies = useMemo(() => {
    const list = [...DEMO_PARENT_COMPANIES];
    if (state?.parentCompanyRecord) {
      const i = list.findIndex((p) => p.id === state.parentCompanyRecord!.id);
      if (i >= 0) list[i] = state.parentCompanyRecord;
      else list.push(state.parentCompanyRecord);
    }
    return list;
  }, [state?.parentCompanyRecord]);

  const [parentCompaniesList, setParentCompaniesList] = useState<DemoParentCompanyRecord[]>(() => [
    ...DEMO_PARENT_COMPANIES,
  ]);

  useEffect(() => {
    setParentCompaniesList(baseParentCompanies);
  }, [baseParentCompanies]);

  const [communitySearch, setCommunitySearch] = useState('');
  const [communitySearchExpanded, setCommunitySearchExpanded] = useState(false);
  const [communityFilterOpen, setCommunityFilterOpen] = useState(false);
  const [communityFilterTypeOpen, setCommunityFilterTypeOpen] = useState(true);
  const [communityFilterStateOpen, setCommunityFilterStateOpen] = useState(true);
  const [communityFilterSpecOpen, setCommunityFilterSpecOpen] = useState(true);
  const [draftCommunityTypes, setDraftCommunityTypes] = useState<Set<string>>(() => new Set());
  const [draftCommunityStates, setDraftCommunityStates] = useState<Set<string>>(() => new Set());
  const [draftCommunitySpecialists, setDraftCommunitySpecialists] = useState<Set<string>>(() => new Set());
  const [appliedCommunityTypes, setAppliedCommunityTypes] = useState<Set<string>>(() => new Set());
  const [appliedCommunityStates, setAppliedCommunityStates] = useState<Set<string>>(() => new Set());
  const [appliedCommunitySpecialists, setAppliedCommunitySpecialists] = useState<Set<string>>(() => new Set());

  const [communityDetailId, setCommunityDetailId] = useState<string | null>(null);
  const [editCommunityId, setEditCommunityId] = useState<string | null>(null);
  const [addCommunityOpen, setAddCommunityOpen] = useState(false);
  const [communitySaveToast, setCommunitySaveToast] = useState<BottomToastPayload | null>(null);
  const [parentCompanyViewOpen, setParentCompanyViewOpen] = useState(false);
  const [editParentId, setEditParentId] = useState<string | null>(null);

  const communityFilterRef = useRef<HTMLDivElement>(null);

  const parent = useMemo(() => {
    if (!parentId) return null;
    return parentCompaniesList.find((p) => p.id === parentId) ?? null;
  }, [parentId, parentCompaniesList]);

  const childCommunities = useMemo(() => {
    if (!parentId) return [];
    return communitiesList.filter((c) => c.parent_company_id === parentId);
  }, [communitiesList, parentId]);

  const filteredBySearch = useMemo(() => {
    const q = communitySearch.trim().toLowerCase();
    if (!q) return childCommunities;
    return childCommunities.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.state.toLowerCase().includes(q) ||
        row.relocation_specialist_display.toLowerCase().includes(q) ||
        row.parent_company_name.toLowerCase().includes(q),
    );
  }, [childCommunities, communitySearch]);

  const filteredChildren = useMemo(
    () =>
      filteredBySearch.filter((row) =>
        recordMatchesChildCommunityFilters(
          row,
          appliedCommunityTypes,
          appliedCommunityStates,
          appliedCommunitySpecialists,
        ),
      ),
    [filteredBySearch, appliedCommunityTypes, appliedCommunityStates, appliedCommunitySpecialists],
  );

  const communityTypeFilterOptions = useMemo(
    () => [...new Set(childCommunities.map((c) => c.community_type))].sort((a, b) => a.localeCompare(b)),
    [childCommunities],
  );
  const communityStateFilterOptions = useMemo(
    () => [...new Set(childCommunities.map((c) => c.state))].sort((a, b) => a.localeCompare(b)),
    [childCommunities],
  );
  const communitySpecialistFilterOptions = useMemo(
    () =>
      [...new Set(childCommunities.map((c) => c.relocation_specialist_display))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [childCommunities],
  );

  const communityFiltersActive =
    appliedCommunityTypes.size > 0 ||
    appliedCommunityStates.size > 0 ||
    appliedCommunitySpecialists.size > 0;

  const childPillResults = useMemo(
    () => buildChildPillResults(childCommunities, communitySearch),
    [childCommunities, communitySearch],
  );

  const sortedChildren = useMemo(() => {
    if (!sortField || !sortDirection) return filteredChildren;
    return [...filteredChildren].sort((a, b) => {
      let av: string;
      let bv: string;
      switch (sortField) {
        case 'name':
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
          break;
        case 'state':
          av = a.state.toLowerCase();
          bv = b.state.toLowerCase();
          break;
        case 'specialist':
          av = a.relocation_specialist_display.toLowerCase();
          bv = b.relocation_specialist_display.toLowerCase();
          break;
        default:
          return 0;
      }
      const c = av.localeCompare(bv);
      return sortDirection === 'asc' ? c : -c;
    });
  }, [filteredChildren, sortField, sortDirection]);

  const maxPageIdx = Math.max(0, Math.ceil(sortedChildren.length / PAGE_SIZE) - 1);
  const safePage = Math.min(page, maxPageIdx);
  const pageRows = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return sortedChildren.slice(start, start + PAGE_SIZE);
  }, [sortedChildren, safePage]);

  useEffect(() => {
    setPage((p) => (p > maxPageIdx ? maxPageIdx : p));
  }, [maxPageIdx]);

  useEffect(() => {
    if (!communityFilterOpen) return;
    const onDown = (e: MouseEvent) => {
      if (communityFilterRef.current?.contains(e.target as Node)) return;
      setCommunityFilterOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [communityFilterOpen]);

  const detail = useMemo(() => (parent ? buildParentCompanyDrawerDetail(parent) : null), [parent]);

  const detailCommunity = useMemo(
    () => (communityDetailId ? (communitiesList.find((c) => c.id === communityDetailId) ?? null) : null),
    [communitiesList, communityDetailId],
  );

  const handleSort = (field: NonNullable<ChildSortField>) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortArrows = ({ field }: { field: NonNullable<ChildSortField> }) =>
    sortField === field ? (
      sortDirection === 'asc' ? (
        <ArrowUp size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
      ) : (
        <ArrowDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
      )
    ) : (
      <ArrowUpDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-400" />
    );

  const goEditList = () => navigate('/communities?tab=parentCompanies');

  const openCommunityDetail = (id: string) => {
    setCommunityDetailId(id);
  };

  const openCommunityEdit = (id: string) => {
    setCommunityDetailId(null);
    setAddCommunityOpen(false);
    setEditCommunityId(id);
  };

  const toggleCommunityFilterPopover = () => {
    if (communityFilterOpen) {
      setCommunityFilterOpen(false);
      return;
    }
    setDraftCommunityTypes(new Set(appliedCommunityTypes));
    setDraftCommunityStates(new Set(appliedCommunityStates));
    setDraftCommunitySpecialists(new Set(appliedCommunitySpecialists));
    setCommunityFilterOpen(true);
  };

  const applyCommunityFilterPopover = () => {
    setAppliedCommunityTypes(new Set(draftCommunityTypes));
    setAppliedCommunityStates(new Set(draftCommunityStates));
    setAppliedCommunitySpecialists(new Set(draftCommunitySpecialists));
    setCommunityFilterOpen(false);
    setPage(0);
  };

  const clearCommunityFilterDraft = () => {
    setDraftCommunityTypes(new Set());
    setDraftCommunityStates(new Set());
    setDraftCommunitySpecialists(new Set());
  };

  const toggleDraftCommunityType = (t: string) => {
    setDraftCommunityTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };
  const toggleDraftCommunityState = (s: string) => {
    setDraftCommunityStates((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };
  const toggleDraftCommunitySpecialist = (name: string) => {
    setDraftCommunitySpecialists((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (!parentId || !parent || !detail) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h2 className="font-poppins text-xl font-semibold text-[#323234]">Parent company not found</h2>
        <p className="mt-2 font-source-sans-3 text-gray-600">This link may be invalid.</p>
        <button
          type="button"
          onClick={() => navigate('/communities?tab=parentCompanies')}
          className="mt-6 rounded-full px-6 py-2.5 font-source-sans-3 font-semibold text-white"
          style={{ backgroundColor: '#307584' }}
        >
          Back to All Parent Companies
        </button>
      </div>
    );
  }

  const displayName = parent.name;
  const hasPrevious = safePage > 0;
  const hasNext = (safePage + 1) * PAGE_SIZE < sortedChildren.length;

  const logoMark = companyLogoWordmark(displayName);

  const leftStack = (
    <div className="flex w-full min-w-0 flex-col gap-5 xl:w-[264px] xl:flex-shrink-0">
      <div className="relative w-full min-w-0 pt-7 xl:w-[264px]">
        <div
          className="absolute left-1/2 top-5 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-4 border-white bg-white shadow-md sm:top-6"
          style={{ width: PARENT_COMPANY_LOGO_BOX.width, height: PARENT_COMPANY_LOGO_BOX.height }}
          aria-hidden
        >
          <div className="max-h-full max-w-full overflow-hidden px-2 py-1 text-center font-poppins font-bold leading-tight tracking-tight text-[#307584]">
            <span className="block text-[10px] leading-tight sm:text-[11px]">{logoMark.line1}</span>
            {logoMark.line2 ? (
              <span className="mt-0.5 block text-[8px] font-semibold leading-snug sm:text-[9px]">{logoMark.line2}</span>
            ) : null}
          </div>
        </div>
        <div
          className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white"
          style={{ boxShadow: 'var(--resident-card-shadow)' }}
        >
          <div
            className="relative flex w-full min-w-0 flex-shrink-0 flex-col justify-end pb-4 pl-4 pr-4 pt-12 sm:pl-5 sm:pr-5 sm:pt-14"
            style={{
              backgroundColor: '#307584',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <h2 className="w-full text-left font-poppins text-xl font-bold leading-tight text-white">{displayName}</h2>
          </div>
          <div className="flex flex-shrink-0 justify-start border-b border-gray-100 px-4 pb-3 pt-3">
            <button
              type="button"
              className="font-source-sans-3 flex items-center justify-center gap-1"
              style={statusChipInlineStyle('active')}
              aria-label="Status Active"
            >
              <span>Active</span>
              <ArrowDown size={14} strokeWidth={2} className="flex-shrink-0" style={{ color: '#FFFFFF' }} />
            </button>
          </div>
          <div className="relative space-y-6 px-4 py-5">
            <div className="relative">
              <h3 className="mb-3 font-source-sans-3" style={residentDetailTextStyle}>
                Company Details
              </h3>
              <div className="flex gap-3">
                <div className="min-w-0 flex-1 space-y-1 font-source-sans-3" style={residentDetailTextStyle}>
                  <p className="font-medium">{parent.company_type}</p>
                  <p className="whitespace-pre-wrap pr-1">{detail.addressLine}</p>
                  <a
                    href={websiteHref(detail.website)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block hover:underline"
                    style={{ color: residentDetailEmailColor }}
                  >
                    {detail.website.replace(/^https?:\/\//i, '')}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setParentCompanyViewOpen(true)}
                  className="mt-6 shrink-0 self-start transition-opacity hover:opacity-80 sm:mt-8"
                  style={{ color: TEAL }}
                  aria-label="View and edit parent company"
                >
                  <Pencil size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center font-source-sans-3" style={sectionHeaderPillStyle}>
                Primary Contact
              </div>
              <div className="mt-2 space-y-1 font-source-sans-3" style={residentDetailTextStyle}>
                <p className="font-medium">{detail.primaryContact.displayName}</p>
                {(() => {
                  const digits = detail.primaryContact.officePhone.replace(/\D/g, '');
                  const text = detail.primaryContact.officePhone;
                  return digits.length >= 10 ? (
                    <a href={`tel:${digits}`} className="block" style={{ color: 'inherit' }}>
                      {text}
                    </a>
                  ) : (
                    <p>{text}</p>
                  );
                })()}
                {detail.primaryContact.email.trim() ? (
                  <a
                    href={`mailto:${detail.primaryContact.email}`}
                    className="block hover:underline"
                    style={{ color: residentDetailEmailColor }}
                  >
                    {detail.primaryContact.email}
                  </a>
                ) : (
                  <p>—</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex w-full min-w-0 flex-shrink-0 flex-col rounded-2xl bg-white"
        style={{
          padding: 16,
          gap: 10,
          boxShadow: 'var(--resident-card-shadow)',
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-source-sans-3" style={relocationSectionHeaderStyle}>
            Notes
          </h3>
          <button
            type="button"
            onClick={goEditList}
            className="transition-opacity hover:opacity-80"
            style={{ color: TEAL }}
            aria-label="Edit notes"
          >
            <Pencil size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="whitespace-pre-wrap font-source-sans-3" style={residentDetailTextStyle}>
          {(detail.importantNotes ?? '').trim() || '—'}
        </div>
      </div>
    </div>
  );

  const renderCommunitiesTable = () => (
    <>
      <div className="mb-8 flex min-w-0 flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <h3 className="min-w-0 font-source-sans-3" style={{ ...contentSectionHeaderStyle, textAlign: 'left' }}>
          Communities
        </h3>
        <div
          ref={communityFilterRef}
          className="relative flex min-w-0 w-full flex-col items-end gap-2 overflow-visible lg:w-auto lg:max-w-none lg:flex-1 lg:flex-row lg:flex-nowrap lg:items-center lg:justify-end"
          style={{ columnGap: 18, rowGap: 8 }}
        >
          {communityFiltersActive && (
            <div className="flex min-w-0 w-full flex-wrap items-center justify-end gap-2 lg:min-w-0 lg:flex-1">
              {[...appliedCommunityTypes].map((t) => (
                <span
                  key={`ct-${t}`}
                  className="inline-flex max-w-full items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 font-source-sans-3"
                  style={{ backgroundColor: FILTER_CHIP_BG, color: FILTER_CHIP_TEXT }}
                >
                  <span
                    className="max-w-[180px] truncate text-sm font-medium"
                    style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                  >
                    {t}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAppliedCommunityTypes((prev) => {
                        const n = new Set(prev);
                        n.delete(t);
                        return n;
                      })
                    }
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                    style={{ color: FILTER_CHIP_TEXT }}
                    aria-label={`Remove ${t}`}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full border"
                      style={{ borderColor: `${FILTER_CHIP_TEXT}55` }}
                    >
                      <X size={12} strokeWidth={2.5} aria-hidden />
                    </span>
                  </button>
                </span>
              ))}
              {[...appliedCommunityStates].map((s) => (
                <span
                  key={`cs-${s}`}
                  className="inline-flex max-w-full items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 font-source-sans-3"
                  style={{ backgroundColor: FILTER_CHIP_BG, color: FILTER_CHIP_TEXT }}
                >
                  <span
                    className="max-w-[80px] truncate text-sm font-medium"
                    style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                  >
                    {s}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAppliedCommunityStates((prev) => {
                        const n = new Set(prev);
                        n.delete(s);
                        return n;
                      })
                    }
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                    style={{ color: FILTER_CHIP_TEXT }}
                    aria-label={`Remove ${s}`}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full border"
                      style={{ borderColor: `${FILTER_CHIP_TEXT}55` }}
                    >
                      <X size={12} strokeWidth={2.5} aria-hidden />
                    </span>
                  </button>
                </span>
              ))}
              {[...appliedCommunitySpecialists].map((name) => (
                <span
                  key={`csp-${name}`}
                  className="inline-flex max-w-full items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 font-source-sans-3"
                  style={{ backgroundColor: FILTER_CHIP_BG, color: FILTER_CHIP_TEXT }}
                >
                  <span
                    className="max-w-[200px] truncate text-sm font-medium"
                    style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                  >
                    {name}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAppliedCommunitySpecialists((prev) => {
                        const n = new Set(prev);
                        n.delete(name);
                        return n;
                      })
                    }
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                    style={{ color: FILTER_CHIP_TEXT }}
                    aria-label={`Remove ${name}`}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full border"
                      style={{ borderColor: `${FILTER_CHIP_TEXT}55` }}
                    >
                      <X size={12} strokeWidth={2.5} aria-hidden />
                    </span>
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex min-w-0 shrink-0 flex-nowrap items-center justify-end gap-[18px] overflow-visible">
            <button
              type="button"
              onClick={toggleCommunityFilterPopover}
              className={`shrink-0 rounded-lg p-2 text-[#307584] transition-colors hover:bg-gray-100 ${
                communityFilterOpen || communityFiltersActive ? 'bg-gray-100' : ''
              }`}
              aria-label="Filter communities"
              aria-expanded={communityFilterOpen}
            >
              <FilterLinesIcon size={20} />
            </button>
            {communityFilterOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),320px)] rounded-2xl border border-gray-200 bg-white shadow-xl"
                style={{ padding: 20 }}
                role="dialog"
                aria-label="Filter communities"
              >
                <h3 className="mb-4 font-source-sans-3 text-sm font-medium text-[#505051]">Filter Communities</h3>
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  <div className="border-b border-gray-100 pb-1">
                    <button
                      type="button"
                      onClick={() => setCommunityFilterTypeOpen((o) => !o)}
                      className="flex w-full items-center justify-between py-2 text-left font-source-sans-3 transition-opacity hover:opacity-80"
                      style={{
                        fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                        fontWeight: 600,
                        fontSize: 16,
                        color: '#323234',
                      }}
                    >
                      Community Type
                      {communityFilterTypeOpen ? (
                        <ChevronUp size={18} style={{ color: TEAL }} aria-hidden />
                      ) : (
                        <ChevronDown size={18} style={{ color: TEAL }} aria-hidden />
                      )}
                    </button>
                    {communityFilterTypeOpen && (
                      <div className="mt-1 space-y-0.5 pl-1">
                        {communityTypeFilterOptions.map((opt) => {
                          const checked = draftCommunityTypes.has(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => toggleDraftCommunityType(opt)}
                              className="flex w-full items-center gap-3 rounded-lg py-2.5 pl-2 pr-2 text-left transition-colors hover:bg-gray-50"
                            >
                              <span
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded border"
                                style={{
                                  borderColor: checked ? 'transparent' : '#d1d5db',
                                  backgroundColor: checked ? FILTER_ACCENT : '#FFFFFF',
                                }}
                                aria-hidden
                              >
                                {checked && <Check size={14} strokeWidth={3} className="text-white" />}
                              </span>
                              <span
                                className="text-[16px] font-medium leading-5 text-[#323234]"
                                style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                              >
                                {opt}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="border-b border-gray-100 pb-1">
                    <button
                      type="button"
                      onClick={() => setCommunityFilterStateOpen((o) => !o)}
                      className="flex w-full items-center justify-between py-2 text-left font-source-sans-3 transition-opacity hover:opacity-80"
                      style={{
                        fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                        fontWeight: 600,
                        fontSize: 16,
                        color: '#323234',
                      }}
                    >
                      State
                      {communityFilterStateOpen ? (
                        <ChevronUp size={18} style={{ color: TEAL }} aria-hidden />
                      ) : (
                        <ChevronDown size={18} style={{ color: TEAL }} aria-hidden />
                      )}
                    </button>
                    {communityFilterStateOpen && (
                      <div className="mt-1 space-y-0.5 pl-1">
                        {communityStateFilterOptions.map((st) => {
                          const checked = draftCommunityStates.has(st);
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => toggleDraftCommunityState(st)}
                              className="flex w-full items-center gap-3 rounded-lg py-2.5 pl-2 pr-2 text-left transition-colors hover:bg-gray-50"
                            >
                              <span
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded border"
                                style={{
                                  borderColor: checked ? 'transparent' : '#d1d5db',
                                  backgroundColor: checked ? FILTER_ACCENT : '#FFFFFF',
                                }}
                                aria-hidden
                              >
                                {checked && <Check size={14} strokeWidth={3} className="text-white" />}
                              </span>
                              <span
                                className="text-[16px] font-medium leading-5 text-[#323234]"
                                style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                              >
                                {st}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setCommunityFilterSpecOpen((o) => !o)}
                      className="flex w-full items-center justify-between py-2 text-left font-source-sans-3 transition-opacity hover:opacity-80"
                      style={{
                        fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                        fontWeight: 600,
                        fontSize: 16,
                        color: '#323234',
                      }}
                    >
                      Relocation Specialist
                      {communityFilterSpecOpen ? (
                        <ChevronUp size={18} style={{ color: TEAL }} aria-hidden />
                      ) : (
                        <ChevronDown size={18} style={{ color: TEAL }} aria-hidden />
                      )}
                    </button>
                    {communityFilterSpecOpen && (
                      <div className="mt-1 space-y-0.5 pl-1">
                        {communitySpecialistFilterOptions.map((nm) => {
                          const checked = draftCommunitySpecialists.has(nm);
                          return (
                            <button
                              key={nm}
                              type="button"
                              onClick={() => toggleDraftCommunitySpecialist(nm)}
                              className="flex w-full items-center gap-3 rounded-lg py-2.5 pl-2 pr-2 text-left transition-colors hover:bg-gray-50"
                            >
                              <span
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded border"
                                style={{
                                  borderColor: checked ? 'transparent' : '#d1d5db',
                                  backgroundColor: checked ? FILTER_ACCENT : '#FFFFFF',
                                }}
                                aria-hidden
                              >
                                {checked && <Check size={14} strokeWidth={3} className="text-white" />}
                              </span>
                              <span
                                className="text-[16px] font-medium leading-5 text-[#323234]"
                                style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                              >
                                {nm}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={clearCommunityFilterDraft}
                    className="font-source-sans-3 transition-opacity hover:opacity-90"
                    style={{
                      minWidth: 100,
                      height: 40,
                      paddingLeft: 20,
                      paddingRight: 20,
                      borderRadius: 9999,
                      border: '1px solid #83ACB5',
                      backgroundColor: '#EAF1F3',
                      fontWeight: 500,
                      fontSize: 15,
                      color: '#307584',
                    }}
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={applyCommunityFilterPopover}
                    className="font-source-sans-3 text-white transition-opacity hover:opacity-90"
                    style={{
                      minWidth: 88,
                      height: 40,
                      paddingLeft: 24,
                      paddingRight: 24,
                      borderRadius: 9999,
                      backgroundColor: FILTER_ACCENT,
                      fontWeight: 500,
                      fontSize: 15,
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
            {!communitySearchExpanded ? (
              <button
                type="button"
                onClick={() => setCommunitySearchExpanded(true)}
                className="shrink-0 rounded-lg p-2 transition-colors hover:bg-gray-100"
                aria-label="Open search"
              >
                <SearchNormalIcon size={22} />
              </button>
            ) : (
              <PillSearchWithResults
                placeholder="Search for Community"
                value={communitySearch}
                onChange={(v) => {
                  setCommunitySearch(v);
                  setPage(0);
                }}
                results={childPillResults}
                accentColor={TEAL}
                isExpanded={communitySearchExpanded}
                onDismiss={() => setCommunitySearchExpanded(false)}
                onResultSelect={(item) => {
                  const row = childCommunities.find((r) => r.id === item.id);
                  if (!row) return;
                  if (item.category === '[Community Name]') setCommunitySearch(row.name);
                  else if (item.category === '[Parent Company]') setCommunitySearch(row.parent_company_name);
                  else if (item.category === '[State]') setCommunitySearch(row.state);
                  else if (item.category === '[Relocation Specialist]')
                    setCommunitySearch(row.relocation_specialist_display);
                  setPage(0);
                }}
              />
            )}
            <button
              type="button"
              onClick={() => setAddCommunityOpen(true)}
              className="flex shrink-0 items-center justify-center font-source-sans-3 transition-opacity hover:opacity-90"
              style={addButtonStyle}
            >
              <span
                className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white"
                aria-hidden
              >
                <Plus size={11} strokeWidth={3} style={{ color: TEAL }} />
              </span>
              <span className="whitespace-nowrap">Add Community</span>
            </button>
          </div>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-xl bg-white"
        style={{
          border: `1px solid ${TABLE_BORDER}`,
          borderRadius: 12,
          paddingTop: 24,
          paddingRight: 24,
          paddingBottom: 24,
          paddingLeft: 24,
        }}
      >
      <div className="hidden w-full min-w-0 flex-col md:flex">
        <div
          className="mb-2 grid gap-x-4 border-b pb-4 font-source-sans-3"
          style={{
            gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,0.35fr) minmax(0,1fr) 2.25rem',
            borderColor: taskListBorderColor,
          }}
        >
          <div className="flex min-w-0 items-end">
            <button
              type="button"
              onClick={() => handleSort('name')}
              className="flex min-w-0 items-center gap-1 text-left transition-opacity hover:opacity-80"
              style={residentTasksColumnHeaderStyle}
            >
              <span className="truncate">Name</span>
              <SortArrows field="name" />
            </button>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => handleSort('state')}
              className="flex items-center gap-1 transition-opacity hover:opacity-80"
              style={residentTasksColumnHeaderStyle}
            >
              State
              <SortArrows field="state" />
            </button>
          </div>
          <div className="flex min-w-0 items-end">
            <button
              type="button"
              onClick={() => handleSort('specialist')}
              className="flex min-w-0 items-center gap-1 text-left transition-opacity hover:opacity-80"
              style={residentTasksColumnHeaderStyle}
            >
              <span className="truncate">Relocation Specialist</span>
              <SortArrows field="specialist" />
            </button>
          </div>
          <div className="flex items-end justify-end pb-1" style={residentTasksColumnHeaderStyle}>
            <span className="sr-only">Actions</span>
          </div>
        </div>

        {sortedChildren.length === 0 ? (
          <p className="py-8 text-center font-source-sans-3 text-[#505051]">
            Added communities associated with this Parent Company will populate here.
          </p>
        ) : (
          <div>
            {pageRows.map((row, rowIndex) => (
              <div
                key={row.id}
                tabIndex={0}
                onClick={() => openCommunityDetail(row.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openCommunityDetail(row.id);
                  }
                }}
                className="grid cursor-pointer items-center gap-x-4 py-4 font-source-sans-3 transition-colors hover:bg-gray-50"
                aria-label={`View details for ${row.name}`}
                style={{
                  gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,0.35fr) minmax(0,1fr) 2.25rem',
                  borderBottom:
                    rowIndex < pageRows.length - 1 ? `1px solid ${taskListBorderColor}` : undefined,
                }}
              >
                <div className="min-w-0 self-center pr-1">
                  <span className="block truncate" style={residentTasksRowTextStyle} title={row.name}>
                    {row.name}
                  </span>
                </div>
                <div className="min-w-0 self-center">
                  <span style={residentTasksRowTextStyle}>{row.state}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2 self-center">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-source-sans-3 text-xs font-semibold text-white"
                    style={{ backgroundColor: TEAL }}
                  >
                    {specialistInitials(row.relocation_specialist_display)}
                  </div>
                  <span className="min-w-0 truncate" style={residentTasksRowTextStyle}>
                    {row.relocation_specialist_display}
                  </span>
                </div>
                <div className="flex justify-end self-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCommunityEdit(row.id);
                    }}
                    className="text-gray-400 transition-opacity hover:opacity-80 hover:text-gray-600"
                    aria-label={`Edit ${row.name}`}
                  >
                    <Pencil size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-2 md:hidden">
        {sortedChildren.length === 0 ? (
          <p className="py-6 text-center font-source-sans-3 text-sm text-[#505051]">
            Added communities associated with this Parent Company will populate here.
          </p>
        ) : (
          pageRows.map((row) => (
            <div
              key={row.id}
              role="presentation"
              onClick={() => openCommunityDetail(row.id)}
              className="cursor-pointer rounded-xl border bg-white px-4 py-3 transition-colors hover:bg-gray-50"
              style={{ borderColor: TABLE_BORDER }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-source-sans-3 font-semibold text-[#323234]">{row.name}</p>
                  <p className="mt-1 font-source-sans-3 text-sm text-[#505051]">
                    {row.state} · {row.relocation_specialist_display}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCommunityEdit(row.id);
                  }}
                  className="shrink-0 text-gray-400 transition-opacity hover:opacity-80 hover:text-gray-600"
                  aria-label={`Edit ${row.name}`}
                >
                  <Pencil size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 shrink-0">
        <Pagination
          hasPrevious={hasPrevious && sortedChildren.length > 0}
          hasNext={hasNext}
          onPrevious={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>
      </div>
    </>
  );

  const rightColumn = (
    <div className="flex min-w-0 flex-1 flex-col">
      <div
        className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        style={{ width: '100%', borderRadius: 16 }}
      >
        <div className="flex flex-col" style={mainPanelContentStyle}>
          {renderCommunitiesTable()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex w-full min-w-0 flex-col pb-28 pt-4 md:pt-6 lg:pt-8 max-lg:pb-32">
      <div className="lg:hidden">
        <div className="mb-4 border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/communities?tab=parentCompanies')} className="p-1" aria-label="Back">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <span className="text-xs text-gray-600 font-source-sans-3">
              Communities / {displayName}
            </span>
          </div>
        </div>
      </div>

      <div className="hidden w-full min-w-0 flex-col gap-6 md:flex xl:flex-row xl:items-start">
        {leftStack}
        {rightColumn}
      </div>

      <div className="flex w-full min-w-0 flex-col gap-6 md:hidden">
        {leftStack}
        {rightColumn}
      </div>

      <div className="h-12 shrink-0 max-lg:h-16" aria-hidden />

      <CommunityViewDrawer
        open={communityDetailId !== null && detailCommunity !== null}
        community={detailCommunity}
        onClose={() => setCommunityDetailId(null)}
        onEdit={() => {
          if (detailCommunity) {
            setEditCommunityId(detailCommunity.id);
            setCommunityDetailId(null);
          }
        }}
      />

      <CommunityFormSlidePanel
        open={addCommunityOpen || editCommunityId !== null}
        editingCommunityId={editCommunityId}
        communitiesList={communitiesList}
        defaultParentCompanyId={parentId}
        onClose={() => {
          setAddCommunityOpen(false);
          setEditCommunityId(null);
        }}
        onExitEdit={(id) => {
          setEditCommunityId(null);
          setCommunityDetailId(id);
        }}
        onSaveSuccess={setCommunitySaveToast}
        onAdd={(row) => {
          setCommunitiesList((prev) => [...prev, row]);
          setPage(0);
        }}
        onUpdate={(row) => {
          setCommunitiesList((prev) => prev.map((c) => (c.id === row.id ? row : c)));
        }}
      />

      <ParentCompanyViewDrawer
        open={parentCompanyViewOpen && parent !== null}
        parent={parent}
        linkedCommunities={childCommunities}
        onClose={() => setParentCompanyViewOpen(false)}
        onEdit={() => {
          if (parent) {
            setEditParentId(parent.id);
            setParentCompanyViewOpen(false);
          }
        }}
      />

      <ParentCompanyFormSlidePanel
        open={editParentId !== null}
        editingParentId={editParentId}
        parentCompaniesList={parentCompaniesList}
        onClose={() => setEditParentId(null)}
        onExitEdit={() => {
          setEditParentId(null);
          setParentCompanyViewOpen(true);
        }}
        onSaveSuccess={setCommunitySaveToast}
        onAdd={(row) => {
          setParentCompaniesList((prev) => [...prev, row]);
        }}
        onUpdate={(row) => {
          setParentCompaniesList((prev) => prev.map((p) => (p.id === row.id ? row : p)));
        }}
      />

      {communitySaveToast && (
        <BottomToast
          message={communitySaveToast.message}
          variant={communitySaveToast.variant}
          onDismiss={() => setCommunitySaveToast(null)}
        />
      )}
    </div>
  );
}
