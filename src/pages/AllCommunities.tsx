import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Pencil,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from 'lucide-react';
import Pagination from '@/components/Pagination';
import PillSearchWithResults, { type PillSearchResultItem } from '@/components/PillSearchWithResults';
import SearchNormalIcon from '@/components/SearchNormalIcon';
import {
  DEMO_COMMUNITIES,
  DEMO_PARENT_COMPANIES,
  type DemoCommunityRecord,
  type DemoParentCompanyRecord,
} from '@/lib/demoCommunities';
import CommunityFormSlidePanel from '@/components/CommunityFormSlidePanel';
import CommunityViewDrawer from '@/components/CommunityViewDrawer';
import type { ParentCompanyDetailLocationState } from '@/pages/ParentCompanyDetail';
import ParentCompanyFormSlidePanel from '@/components/ParentCompanyFormSlidePanel';
import ParentCompanyViewDrawer from '@/components/ParentCompanyViewDrawer';
import { BottomToast, type BottomToastPayload } from '@/components/BottomToast';

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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="square">
      <line x1={cx - w1 / 2} y1={y1} x2={cx + w1 / 2} y2={y1} />
      <line x1={cx - w2 / 2} y1={y2} x2={cx + w2 / 2} y2={y2} />
      <line x1={cx - w3 / 2} y1={y3} x2={cx + w3 / 2} y2={y3} />
    </svg>
  );
}

type CommunitySortField = 'name' | 'state' | 'specialist' | 'parent' | null;
type ParentSortField = 'name' | 'count' | 'type' | 'contact' | null;
type SortDirection = 'asc' | 'desc' | null;

const PAGE_SIZE = 10;
const TEAL = '#307584';
const PARENT_PENCIL = '#6BA8B8';
const FILTER_ACCENT = 'hsla(187, 47%, 35%, 1)';
const FILTER_CHIP_BG = 'hsla(168, 38%, 91%, 1)';
const FILTER_CHIP_TEXT = 'hsla(191, 47%, 32%, 1)';

const thBtn = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: 14,
  lineHeight: '20px',
  letterSpacing: '0%',
  color: '#323234',
} as const;

const cellText = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: 18,
  lineHeight: '20px',
  letterSpacing: '0%',
  color: '#323234',
} as const;

const parentThStyle = {
  ...thBtn,
  color: '#6B6B6D',
  fontWeight: 500,
  fontSize: 13,
} as const;

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

function communitySortValue(row: DemoCommunityRecord, field: NonNullable<CommunitySortField>): string {
  switch (field) {
    case 'name':
      return row.name.toLowerCase();
    case 'state':
      return row.state.toLowerCase();
    case 'specialist':
      return row.relocation_specialist_display.toLowerCase();
    case 'parent':
      return row.parent_company_name.toLowerCase();
    default:
      return '';
  }
}

function buildCommunityPillResults(rows: DemoCommunityRecord[], q: string): PillSearchResultItem[] {
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

function buildParentPillResults(rows: DemoParentCompanyRecord[], q: string): PillSearchResultItem[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const out: PillSearchResultItem[] = [];
  for (const row of rows) {
    const nameL = row.name.toLowerCase();
    const typeL = row.company_type.toLowerCase();
    const contactL = row.primary_contact_name.toLowerCase();
    const countStr = String(row.community_count);
    if (nameL.includes(t)) {
      out.push({ id: row.id, category: '[Parent Company]', title: row.name });
    } else if (typeL.includes(t)) {
      out.push({ id: row.id, category: '[Company Type]', title: `${row.name} — ${row.company_type}` });
    } else if (contactL.includes(t)) {
      out.push({
        id: row.id,
        category: '[Primary Contact]',
        title: `${row.primary_contact_name} (${row.name})`,
      });
    } else if (countStr.includes(t)) {
      out.push({
        id: row.id,
        category: '[# of Communities]',
        title: `${row.name} (${row.community_count})`,
      });
    }
    if (out.length >= 8) break;
  }
  return out;
}

function recordMatchesCommunityFilters(
  rec: DemoCommunityRecord,
  types: Set<string>,
  parentIds: Set<string>,
  states: Set<string>,
  specialists: Set<string>,
): boolean {
  if (types.size > 0 && !types.has(rec.community_type)) return false;
  if (parentIds.size > 0 && !parentIds.has(rec.parent_company_id)) return false;
  if (states.size > 0 && !states.has(rec.state)) return false;
  if (specialists.size > 0 && !specialists.has(rec.relocation_specialist_display)) return false;
  return true;
}

function recordMatchesParentCompanyFilters(
  rec: DemoParentCompanyRecord,
  types: Set<string>,
  contacts: Set<string>,
): boolean {
  if (types.size > 0 && !types.has(rec.company_type)) return false;
  if (contacts.size > 0 && !contacts.has(rec.primary_contact_name)) return false;
  return true;
}

function parentSortCompare(
  a: DemoParentCompanyRecord,
  b: DemoParentCompanyRecord,
  field: NonNullable<ParentSortField>,
  dir: 'asc' | 'desc',
): number {
  let c = 0;
  switch (field) {
    case 'name':
      c = a.name.localeCompare(b.name);
      break;
    case 'count':
      c = a.community_count - b.community_count;
      break;
    case 'type':
      c = a.company_type.localeCompare(b.company_type);
      break;
    case 'contact':
      c = a.primary_contact_name.localeCompare(b.primary_contact_name);
      break;
    default:
      c = 0;
  }
  return dir === 'asc' ? c : -c;
}

export default function AllCommunitiesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mainTab, setMainTab] = useState<'communities' | 'parentCompanies'>('communities');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'parentCompanies') setMainTab('parentCompanies');
    else if (tab === 'communities') setMainTab('communities');
  }, [searchParams]);

  const [communities, setCommunities] = useState<DemoCommunityRecord[]>(() => [...DEMO_COMMUNITIES]);
  const [parentCompanies, setParentCompanies] = useState<DemoParentCompanyRecord[]>(() => [
    ...DEMO_PARENT_COMPANIES,
  ]);
  const [addCommunityOpen, setAddCommunityOpen] = useState(false);

  useEffect(() => {
    const add = searchParams.get('add');
    if (add !== '1' && add !== 'true') return;
    setMainTab('communities');
    setAddCommunityOpen(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('add');
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  const [editCommunityId, setEditCommunityId] = useState<string | null>(null);
  const [parentDetailId, setParentDetailId] = useState<string | null>(null);
  const [editParentId, setEditParentId] = useState<string | null>(null);
  const [addParentOpen, setAddParentOpen] = useState(false);
  const [communitySaveToast, setCommunitySaveToast] = useState<BottomToastPayload | null>(null);

  const [communitySearch, setCommunitySearch] = useState('');
  const [communitySortField, setCommunitySortField] = useState<CommunitySortField>(null);
  const [communitySortDirection, setCommunitySortDirection] = useState<SortDirection>(null);

  const [parentSearch, setParentSearch] = useState('');
  const [parentSortField, setParentSortField] = useState<ParentSortField>(null);
  const [parentSortDirection, setParentSortDirection] = useState<SortDirection>(null);

  const [page, setPage] = useState(0);
  const [selectedCommunityRow, setSelectedCommunityRow] = useState<string | null>(null);
  const [communityDetailId, setCommunityDetailId] = useState<string | null>(null);
  const [selectedParentRow, setSelectedParentRow] = useState<string | null>(null);
  const [communitySearchExpanded, setCommunitySearchExpanded] = useState(false);
  const [parentSearchExpanded, setParentSearchExpanded] = useState(false);

  const communityFilterRef = useRef<HTMLDivElement>(null);
  const parentFilterRef = useRef<HTMLDivElement>(null);
  const [communityFilterOpen, setCommunityFilterOpen] = useState(false);
  const [communityFilterTypeOpen, setCommunityFilterTypeOpen] = useState(true);
  const [communityFilterParentOpen, setCommunityFilterParentOpen] = useState(true);
  const [communityFilterStateOpen, setCommunityFilterStateOpen] = useState(true);
  const [communityFilterSpecOpen, setCommunityFilterSpecOpen] = useState(true);
  const [draftCommunityTypes, setDraftCommunityTypes] = useState<Set<string>>(() => new Set());
  const [draftCommunityParentIds, setDraftCommunityParentIds] = useState<Set<string>>(() => new Set());
  const [draftCommunityStates, setDraftCommunityStates] = useState<Set<string>>(() => new Set());
  const [draftCommunitySpecialists, setDraftCommunitySpecialists] = useState<Set<string>>(() => new Set());
  const [appliedCommunityTypes, setAppliedCommunityTypes] = useState<Set<string>>(() => new Set());
  const [appliedCommunityParentIds, setAppliedCommunityParentIds] = useState<Set<string>>(() => new Set());
  const [appliedCommunityStates, setAppliedCommunityStates] = useState<Set<string>>(() => new Set());
  const [appliedCommunitySpecialists, setAppliedCommunitySpecialists] = useState<Set<string>>(() => new Set());

  const [parentFilterOpen, setParentFilterOpen] = useState(false);
  const [parentFilterTypeOpen, setParentFilterTypeOpen] = useState(true);
  const [parentFilterContactOpen, setParentFilterContactOpen] = useState(true);
  const [draftParentTypes, setDraftParentTypes] = useState<Set<string>>(() => new Set());
  const [draftParentContacts, setDraftParentContacts] = useState<Set<string>>(() => new Set());
  const [appliedParentTypes, setAppliedParentTypes] = useState<Set<string>>(() => new Set());
  const [appliedParentContacts, setAppliedParentContacts] = useState<Set<string>>(() => new Set());

  const handleCommunitySort = (field: NonNullable<CommunitySortField>) => {
    if (communitySortField === field) {
      setCommunitySortDirection(communitySortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setCommunitySortField(field);
      setCommunitySortDirection('asc');
    }
  };

  const handleParentSort = (field: NonNullable<ParentSortField>) => {
    if (parentSortField === field) {
      setParentSortDirection(parentSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setParentSortField(field);
      setParentSortDirection('asc');
    }
  };

  const filteredSortedCommunities = useMemo(() => {
    const q = communitySearch.toLowerCase().trim();
    const afterSearch = communities.filter((row) => {
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.state.toLowerCase().includes(q) ||
        row.relocation_specialist_display.toLowerCase().includes(q) ||
        row.parent_company_name.toLowerCase().includes(q)
      );
    });
    const base = afterSearch.filter((row) =>
      recordMatchesCommunityFilters(
        row,
        appliedCommunityTypes,
        appliedCommunityParentIds,
        appliedCommunityStates,
        appliedCommunitySpecialists,
      ),
    );
    if (!communitySortField || !communitySortDirection) return base;
    return [...base].sort((a, b) => {
      const av = communitySortValue(a, communitySortField);
      const bv = communitySortValue(b, communitySortField);
      const c = av.localeCompare(bv);
      return communitySortDirection === 'asc' ? c : -c;
    });
  }, [
    communitySearch,
    communitySortField,
    communitySortDirection,
    appliedCommunityTypes,
    appliedCommunityParentIds,
    appliedCommunityStates,
    appliedCommunitySpecialists,
    communities,
  ]);

  const filteredSortedParents = useMemo(() => {
    const q = parentSearch.toLowerCase().trim();
    const afterSearch = parentCompanies.filter((row) => {
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        String(row.community_count).includes(q) ||
        row.company_type.toLowerCase().includes(q) ||
        row.primary_contact_name.toLowerCase().includes(q)
      );
    });
    const base = afterSearch.filter((row) =>
      recordMatchesParentCompanyFilters(row, appliedParentTypes, appliedParentContacts),
    );
    if (!parentSortField || !parentSortDirection) return base;
    return [...base].sort((a, b) =>
      parentSortCompare(a, b, parentSortField, parentSortDirection),
    );
  }, [
    parentSearch,
    parentSortField,
    parentSortDirection,
    appliedParentTypes,
    appliedParentContacts,
    parentCompanies,
  ]);

  const activeList = mainTab === 'communities' ? filteredSortedCommunities : filteredSortedParents;
  const maxPageIdx = Math.max(0, Math.ceil(activeList.length / PAGE_SIZE) - 1);
  const safePage = Math.min(page, maxPageIdx);

  useEffect(() => {
    setPage((p) => (p > maxPageIdx ? maxPageIdx : p));
  }, [maxPageIdx]);

  const pageCommunityRows = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filteredSortedCommunities.slice(start, start + PAGE_SIZE);
  }, [filteredSortedCommunities, safePage]);

  const pageParentRows = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filteredSortedParents.slice(start, start + PAGE_SIZE);
  }, [filteredSortedParents, safePage]);

  const detailCommunity = useMemo(
    () =>
      communityDetailId ? (communities.find((c) => c.id === communityDetailId) ?? null) : null,
    [communities, communityDetailId],
  );

  const detailParent = useMemo(
    () => (parentDetailId ? (parentCompanies.find((p) => p.id === parentDetailId) ?? null) : null),
    [parentCompanies, parentDetailId],
  );

  const openCommunityDetail = (id: string) => {
    setSelectedCommunityRow(id);
    setCommunityDetailId(id);
  };

  const openCommunityEdit = (id: string) => {
    setSelectedCommunityRow(id);
    setCommunityDetailId(null);
    setAddCommunityOpen(false);
    setEditCommunityId(id);
  };

  const openParentViewDrawer = (id: string) => {
    setSelectedParentRow(id);
    setParentDetailId(id);
  };

  const goParentCompanyPage = (row: DemoParentCompanyRecord) => {
    setSelectedParentRow(row.id);
    setParentDetailId(null);
    navigate(`/communities/parent-companies/${encodeURIComponent(row.id)}`, {
      state: {
        parentCompanyRecord: row,
        linkedCommunities: communities,
      } satisfies ParentCompanyDetailLocationState,
    });
  };

  const goParentCompanyFromCommunityRow = (row: DemoCommunityRecord, e?: MouseEvent) => {
    e?.stopPropagation();
    const parentRec = parentCompanies.find((p) => p.id === row.parent_company_id);
    if (parentRec) {
      goParentCompanyPage(parentRec);
      return;
    }
    navigate(`/communities/parent-companies/${encodeURIComponent(row.parent_company_id)}`, {
      state: { linkedCommunities: communities } satisfies ParentCompanyDetailLocationState,
    });
  };

  const hasPrevious = safePage > 0;
  const hasNext = (safePage + 1) * PAGE_SIZE < activeList.length;

  const communityPillResults = useMemo(
    () => buildCommunityPillResults(communities, communitySearch),
    [communities, communitySearch],
  );
  const parentPillResults = useMemo(
    () => buildParentPillResults(parentCompanies, parentSearch),
    [parentCompanies, parentSearch],
  );

  const communityTypeFilterOptions = useMemo(
    () => [...new Set(communities.map((c) => c.community_type))].sort((a, b) => a.localeCompare(b)),
    [communities],
  );
  const communityParentFilterOptions = useMemo(() => {
    const m = new Map<string, string>();
    communities.forEach((c) => m.set(c.parent_company_id, c.parent_company_name));
    parentCompanies.forEach((p) => m.set(p.id, p.name));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [communities, parentCompanies]);
  const communityStateFilterOptions = useMemo(
    () => [...new Set(communities.map((c) => c.state))].sort(),
    [communities],
  );
  const communitySpecialistFilterOptions = useMemo(
    () =>
      [...new Set(communities.map((c) => c.relocation_specialist_display))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [communities],
  );

  const parentCompanyTypeFilterOptions = useMemo(
    () => [...new Set(parentCompanies.map((p) => p.company_type))].sort(),
    [parentCompanies],
  );
  const parentContactFilterOptions = useMemo(
    () => [...new Set(parentCompanies.map((p) => p.primary_contact_name))].sort(),
    [parentCompanies],
  );

  useEffect(() => {
    if (!communityFilterOpen) return;
    const down = (e: PointerEvent) => {
      if (communityFilterRef.current?.contains(e.target as Node)) return;
      setCommunityFilterOpen(false);
    };
    document.addEventListener('pointerdown', down);
    return () => document.removeEventListener('pointerdown', down);
  }, [communityFilterOpen]);

  useEffect(() => {
    if (!parentFilterOpen) return;
    const down = (e: PointerEvent) => {
      if (parentFilterRef.current?.contains(e.target as Node)) return;
      setParentFilterOpen(false);
    };
    document.addEventListener('pointerdown', down);
    return () => document.removeEventListener('pointerdown', down);
  }, [parentFilterOpen]);

  const toggleCommunityFilterPopover = () => {
    if (communityFilterOpen) {
      setCommunityFilterOpen(false);
      return;
    }
    setDraftCommunityTypes(new Set(appliedCommunityTypes));
    setDraftCommunityParentIds(new Set(appliedCommunityParentIds));
    setDraftCommunityStates(new Set(appliedCommunityStates));
    setDraftCommunitySpecialists(new Set(appliedCommunitySpecialists));
    setCommunityFilterOpen(true);
  };

  const applyCommunityFilterPopover = () => {
    setAppliedCommunityTypes(new Set(draftCommunityTypes));
    setAppliedCommunityParentIds(new Set(draftCommunityParentIds));
    setAppliedCommunityStates(new Set(draftCommunityStates));
    setAppliedCommunitySpecialists(new Set(draftCommunitySpecialists));
    setCommunityFilterOpen(false);
    setPage(0);
  };

  const clearCommunityFilterDraft = () => {
    setDraftCommunityTypes(new Set());
    setDraftCommunityParentIds(new Set());
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
  const toggleDraftCommunityParent = (id: string) => {
    setDraftCommunityParentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  const toggleParentFilterPopover = () => {
    if (parentFilterOpen) {
      setParentFilterOpen(false);
      return;
    }
    setDraftParentTypes(new Set(appliedParentTypes));
    setDraftParentContacts(new Set(appliedParentContacts));
    setParentFilterOpen(true);
  };

  const applyParentFilterPopover = () => {
    setAppliedParentTypes(new Set(draftParentTypes));
    setAppliedParentContacts(new Set(draftParentContacts));
    setParentFilterOpen(false);
    setPage(0);
  };

  const clearParentFilterDraft = () => {
    setDraftParentTypes(new Set());
    setDraftParentContacts(new Set());
  };

  const toggleDraftParentType = (t: string) => {
    setDraftParentTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };
  const toggleDraftParentContact = (c: string) => {
    setDraftParentContacts((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const parentIdToName = useMemo(() => new Map(communityParentFilterOptions), [communityParentFilterOptions]);

  const communityFiltersActive =
    appliedCommunityTypes.size > 0 ||
    appliedCommunityParentIds.size > 0 ||
    appliedCommunityStates.size > 0 ||
    appliedCommunitySpecialists.size > 0;
  const parentFiltersActive = appliedParentTypes.size > 0 || appliedParentContacts.size > 0;

  const CommunitySortArrows = ({ field }: { field: NonNullable<CommunitySortField> }) =>
    communitySortField === field ? (
      communitySortDirection === 'asc' ? (
        <ArrowUp size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
      ) : (
        <ArrowDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
      )
    ) : (
      <ArrowUpDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-400" />
    );

  const ParentSortArrows = ({ field }: { field: NonNullable<ParentSortField> }) =>
    parentSortField === field ? (
      parentSortDirection === 'asc' ? (
        <ArrowUp size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
      ) : (
        <ArrowDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
      )
    ) : (
      <ArrowUpDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-400" />
    );

  const addButtonStyle = {
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
  } as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 lg:hidden">
        <div className="bg-gray-800 px-4 py-1 text-center text-xs text-white">
          <span className="hidden md:inline">Tablet</span>
          <span className="md:hidden">Mobile</span> Communities /{' '}
          {mainTab === 'communities' ? 'All Communities' : 'All Parent Companies'}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4 md:p-6">
        <div
          className="flex min-h-0 flex-1 flex-col"
          style={{
            backgroundColor: '#FFFFFF',
            opacity: 1,
            borderRadius: 16,
            padding: 24,
            gap: 24,
          }}
        >
          <div className="flex min-w-0 shrink-0 flex-nowrap items-center justify-between gap-3">
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => {
                  setMainTab('communities');
                  setPage(0);
                  setParentSearchExpanded(false);
                }}
                className="font-source-sans-3 border-b-2 border-transparent bg-transparent pb-2 pt-1 transition-colors"
                style={{
                  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                  fontWeight: mainTab === 'communities' ? 600 : 500,
                  fontSize: 18,
                  lineHeight: '22px',
                  color: mainTab === 'communities' ? 'hsla(240, 2%, 20%, 1)' : 'hsla(240, 1%, 68%, 1)',
                  borderBottomColor: mainTab === 'communities' ? 'hsla(240, 2%, 20%, 1)' : 'transparent',
                }}
              >
                All Communities
              </button>
              <span className="mx-4 h-7 w-px shrink-0 bg-[#323234]" aria-hidden />
              <button
                type="button"
                onClick={() => {
                  setMainTab('parentCompanies');
                  setPage(0);
                  setCommunitySearchExpanded(false);
                }}
                className="font-source-sans-3 border-b-2 border-transparent bg-transparent pb-2 pt-1 transition-colors"
                style={{
                  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                  fontWeight: mainTab === 'parentCompanies' ? 600 : 500,
                  fontSize: 18,
                  lineHeight: '22px',
                  color: mainTab === 'parentCompanies' ? 'hsla(240, 2%, 20%, 1)' : 'hsla(240, 1%, 68%, 1)',
                  borderBottomColor: mainTab === 'parentCompanies' ? 'hsla(240, 2%, 20%, 1)' : 'transparent',
                }}
              >
                All Parent Companies
              </button>
            </div>

            {mainTab === 'communities' && (
              <div
                ref={communityFilterRef}
                className="relative flex min-w-0 w-full flex-col items-end gap-2 overflow-visible lg:w-auto lg:flex-1 lg:flex-row lg:flex-nowrap lg:items-center lg:justify-end"
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
                    {[...appliedCommunityParentIds].map((id) => {
                      const lbl = parentIdToName.get(id) ?? id;
                      return (
                        <span
                          key={`cp-${id}`}
                          className="inline-flex max-w-full items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 font-source-sans-3"
                          style={{ backgroundColor: FILTER_CHIP_BG, color: FILTER_CHIP_TEXT }}
                        >
                          <span
                            className="max-w-[200px] truncate text-sm font-medium"
                            style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                          >
                            {lbl}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setAppliedCommunityParentIds((prev) => {
                                const n = new Set(prev);
                                n.delete(id);
                                return n;
                              })
                            }
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                            style={{ color: FILTER_CHIP_TEXT }}
                            aria-label={`Remove ${lbl}`}
                          >
                            <span
                              className="flex h-5 w-5 items-center justify-center rounded-full border"
                              style={{ borderColor: `${FILTER_CHIP_TEXT}55` }}
                            >
                              <X size={12} strokeWidth={2.5} aria-hidden />
                            </span>
                          </button>
                        </span>
                      );
                    })}
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
                            onClick={() => setCommunityFilterParentOpen((o) => !o)}
                            className="flex w-full items-center justify-between py-2 text-left font-source-sans-3 transition-opacity hover:opacity-80"
                            style={{
                              fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                              fontWeight: 600,
                              fontSize: 16,
                              color: '#323234',
                            }}
                          >
                            Parent Company
                            {communityFilterParentOpen ? (
                              <ChevronUp size={18} style={{ color: TEAL }} aria-hidden />
                            ) : (
                              <ChevronDown size={18} style={{ color: TEAL }} aria-hidden />
                            )}
                          </button>
                          {communityFilterParentOpen && (
                            <div className="mt-1 space-y-0.5 pl-1">
                              {communityParentFilterOptions.map(([pid, pname]) => {
                                const checked = draftCommunityParentIds.has(pid);
                                return (
                                  <button
                                    key={pid}
                                    type="button"
                                    onClick={() => toggleDraftCommunityParent(pid)}
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
                                      {pname}
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
                    results={communityPillResults}
                    accentColor={TEAL}
                    isExpanded={communitySearchExpanded}
                    onDismiss={() => setCommunitySearchExpanded(false)}
                    onResultSelect={(item) => {
                      const row = communities.find((r) => r.id === item.id);
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
                  onClick={() => {
                    setEditCommunityId(null);
                    setAddCommunityOpen(true);
                  }}
                  className="flex shrink-0 items-center justify-center font-source-sans-3 transition-opacity hover:opacity-90"
                  style={addButtonStyle}
                >
                  <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white" aria-hidden>
                    <Plus size={11} strokeWidth={3} style={{ color: TEAL }} />
                  </span>
                  <span className="whitespace-nowrap">Add Community</span>
                </button>
                </div>
              </div>
            )}

            {mainTab === 'parentCompanies' && (
              <div
                ref={parentFilterRef}
                className="relative flex min-w-0 w-full flex-col items-end gap-2 overflow-visible lg:w-auto lg:flex-1 lg:flex-row lg:flex-nowrap lg:items-center lg:justify-end"
                style={{ columnGap: 18, rowGap: 8 }}
              >
                {parentFiltersActive && (
                  <div className="flex min-w-0 w-full flex-wrap items-center justify-end gap-2 lg:min-w-0 lg:flex-1">
                    {[...appliedParentTypes].map((t) => (
                      <span
                        key={`ppt-${t}`}
                        className="inline-flex max-w-full items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 font-source-sans-3"
                        style={{ backgroundColor: FILTER_CHIP_BG, color: FILTER_CHIP_TEXT }}
                      >
                        <span
                          className="max-w-[160px] truncate text-sm font-medium"
                          style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                        >
                          {t}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAppliedParentTypes((prev) => {
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
                    {[...appliedParentContacts].map((c) => (
                      <span
                        key={`ppc-${c}`}
                        className="inline-flex max-w-full items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 font-source-sans-3"
                        style={{ backgroundColor: FILTER_CHIP_BG, color: FILTER_CHIP_TEXT }}
                      >
                        <span
                          className="max-w-[180px] truncate text-sm font-medium"
                          style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                        >
                          {c}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAppliedParentContacts((prev) => {
                              const n = new Set(prev);
                              n.delete(c);
                              return n;
                            })
                          }
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                          style={{ color: FILTER_CHIP_TEXT }}
                          aria-label={`Remove ${c}`}
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
                  onClick={toggleParentFilterPopover}
                  className={`shrink-0 rounded-lg p-2 text-[#307584] transition-colors hover:bg-gray-100 ${
                    parentFilterOpen || parentFiltersActive ? 'bg-gray-100' : ''
                  }`}
                  aria-label="Filter parent companies"
                  aria-expanded={parentFilterOpen}
                >
                  <FilterLinesIcon size={20} />
                </button>
                {parentFilterOpen && (
                  <div
                    className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),320px)] rounded-2xl border border-gray-200 bg-white shadow-xl"
                    style={{ padding: 20 }}
                    role="dialog"
                    aria-label="Filter parent companies"
                  >
                    <h3 className="mb-4 font-source-sans-3 text-sm font-medium text-[#505051]">Filter Parent Companies</h3>
                    <div className="max-h-72 space-y-1 overflow-y-auto">
                      <div className="border-b border-gray-100 pb-1">
                        <button
                          type="button"
                          onClick={() => setParentFilterTypeOpen((o) => !o)}
                          className="flex w-full items-center justify-between py-2 text-left font-source-sans-3 transition-opacity hover:opacity-80"
                          style={{
                            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                            fontWeight: 600,
                            fontSize: 16,
                            color: '#323234',
                          }}
                        >
                          Company Type
                          {parentFilterTypeOpen ? (
                            <ChevronUp size={18} style={{ color: TEAL }} aria-hidden />
                          ) : (
                            <ChevronDown size={18} style={{ color: TEAL }} aria-hidden />
                          )}
                        </button>
                        {parentFilterTypeOpen && (
                          <div className="mt-1 space-y-0.5 pl-1">
                            {parentCompanyTypeFilterOptions.map((opt) => {
                              const checked = draftParentTypes.has(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => toggleDraftParentType(opt)}
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
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setParentFilterContactOpen((o) => !o)}
                          className="flex w-full items-center justify-between py-2 text-left font-source-sans-3 transition-opacity hover:opacity-80"
                          style={{
                            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                            fontWeight: 600,
                            fontSize: 16,
                            color: '#323234',
                          }}
                        >
                          Primary Contact
                          {parentFilterContactOpen ? (
                            <ChevronUp size={18} style={{ color: TEAL }} aria-hidden />
                          ) : (
                            <ChevronDown size={18} style={{ color: TEAL }} aria-hidden />
                          )}
                        </button>
                        {parentFilterContactOpen && (
                          <div className="mt-1 space-y-0.5 pl-1">
                            {parentContactFilterOptions.map((opt) => {
                              const checked = draftParentContacts.has(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => toggleDraftParentContact(opt)}
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
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={clearParentFilterDraft}
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
                        onClick={applyParentFilterPopover}
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
                {!parentSearchExpanded ? (
                  <button
                    type="button"
                    onClick={() => setParentSearchExpanded(true)}
                    className="shrink-0 rounded-lg p-2 transition-colors hover:bg-gray-100"
                    aria-label="Open search"
                  >
                    <SearchNormalIcon size={22} />
                  </button>
                ) : (
                  <PillSearchWithResults
                    placeholder="Search for Parent Company"
                    value={parentSearch}
                    onChange={(v) => {
                      setParentSearch(v);
                      setPage(0);
                    }}
                    results={parentPillResults}
                    accentColor={TEAL}
                    isExpanded={parentSearchExpanded}
                    onDismiss={() => setParentSearchExpanded(false)}
                    onResultSelect={(item) => {
                      const row = parentCompanies.find((r) => r.id === item.id);
                      if (!row) return;
                      if (item.category === '[Parent Company]') setParentSearch(row.name);
                      else if (item.category === '[Company Type]') setParentSearch(row.company_type);
                      else if (item.category === '[Primary Contact]') setParentSearch(row.primary_contact_name);
                      else if (item.category === '[# of Communities]') setParentSearch(String(row.community_count));
                      setPage(0);
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditParentId(null);
                    setAddParentOpen(true);
                  }}
                  className="flex shrink-0 items-center justify-center font-source-sans-3 transition-opacity hover:opacity-90"
                  style={addButtonStyle}
                >
                  <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white" aria-hidden>
                    <Plus size={11} strokeWidth={3} style={{ color: TEAL }} />
                  </span>
                  <span className="whitespace-nowrap">Add Parent Company</span>
                </button>
                </div>
              </div>
            )}
          </div>

          {mainTab === 'communities' ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="hidden lg:block">
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left align-middle xl:px-6">
                        <button
                          type="button"
                          onClick={() => handleCommunitySort('name')}
                          className="flex items-center gap-1 font-source-sans-3 transition-opacity hover:opacity-80"
                          style={thBtn}
                        >
                          Name
                          <CommunitySortArrows field="name" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left align-middle xl:px-6">
                        <button
                          type="button"
                          onClick={() => handleCommunitySort('state')}
                          className="flex items-center gap-1 font-source-sans-3 transition-opacity hover:opacity-80"
                          style={thBtn}
                        >
                          State
                          <CommunitySortArrows field="state" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left align-middle xl:px-6">
                        <button
                          type="button"
                          onClick={() => handleCommunitySort('specialist')}
                          className="flex items-center gap-1 font-source-sans-3 transition-opacity hover:opacity-80"
                          style={thBtn}
                        >
                          Relocation Specialist
                          <CommunitySortArrows field="specialist" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left align-middle xl:px-6">
                        <button
                          type="button"
                          onClick={() => handleCommunitySort('parent')}
                          className="flex items-center gap-1 font-source-sans-3 transition-opacity hover:opacity-80"
                          style={thBtn}
                        >
                          Parent Company
                          <CommunitySortArrows field="parent" />
                        </button>
                      </th>
                      <th className="px-6 py-3 text-right align-middle font-source-sans-3" style={thBtn}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                </table>
                <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #ACACAD', borderRadius: 12 }}>
                  <table className="w-full" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '28%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '28%' }} />
                      <col style={{ width: '10%' }} />
                    </colgroup>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {pageCommunityRows.map((row) => (
                        <tr
                          key={row.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => openCommunityDetail(row.id)}
                        >
                          <td className="min-w-0 max-w-0 px-4 py-4 align-middle xl:px-6">
                            <span className="block truncate font-source-sans-3" style={cellText} title={row.name}>
                              {row.name}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-middle font-source-sans-3 xl:px-6" style={cellText}>
                            {row.state}
                          </td>
                          <td className="min-w-0 px-4 py-4 align-middle xl:px-6">
                            <div
                              className="flex min-w-0 items-center gap-2"
                              title={row.relocation_specialist_display}
                            >
                              <div
                                className="font-inter flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-semibold text-white"
                                style={{
                                  backgroundColor: TEAL,
                                  borderRadius: 100,
                                  border: '1.5px solid var(--color-Backgrounds-colorBgContainer, #FFFFFF)',
                                }}
                              >
                                <span className="text-[10px] leading-none">
                                  {specialistInitials(row.relocation_specialist_display)}
                                </span>
                              </div>
                              <span className="hidden min-w-0 truncate font-source-sans-3 xl:inline" style={cellText}>
                                {row.relocation_specialist_display}
                              </span>
                            </div>
                          </td>
                          <td className="min-w-0 max-w-0 px-4 py-4 align-middle xl:px-6">
                            <button
                              type="button"
                              onClick={(e) => goParentCompanyFromCommunityRow(row, e)}
                              className="max-w-full truncate text-left font-source-sans-3 underline transition-opacity hover:opacity-80"
                              style={{ ...cellText, color: TEAL }}
                              title={row.parent_company_name}
                            >
                              {row.parent_company_name}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right align-middle">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCommunityEdit(row.id);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                              aria-label={`Edit ${row.name}`}
                            >
                              <Pencil size={18} strokeWidth={1.5} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="hidden md:block lg:hidden">
                <div className="divide-y divide-gray-200 rounded-xl border border-[#ACACAD]">
                  {pageCommunityRows.map((row) => (
                    <div
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openCommunityDetail(row.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') openCommunityDetail(row.id);
                      }}
                      className={`flex cursor-pointer items-center justify-between px-4 py-4 hover:bg-gray-50 ${
                        selectedCommunityRow === row.id ? 'border-l-4 border-purple-500' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-source-sans-3" style={cellText}>
                          {row.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {row.state} · {row.parent_company_name}
                        </p>
                      </div>
                      <ArrowRight size={20} strokeWidth={1.5} className="ml-2 flex-shrink-0 text-gray-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:hidden">
                <div className="-mx-4 space-y-2 px-4">
                  {pageCommunityRows.map((row) => (
                    <div
                      key={row.id}
                      className="rounded-xl border border-[#ACACAD] bg-white p-4"
                      onClick={() => openCommunityDetail(row.id)}
                      role="presentation"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-source-sans-3" style={cellText}>
                            {row.name}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">{row.state}</p>
                          <button
                            type="button"
                            onClick={(e) => goParentCompanyFromCommunityRow(row, e)}
                            className="mt-2 max-w-full truncate text-left text-sm underline"
                            style={{ color: TEAL }}
                          >
                            {row.parent_company_name}
                          </button>
                        </div>
                        <div
                          className="font-inter flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: TEAL }}
                          title={row.relocation_specialist_display}
                        >
                          {specialistInitials(row.relocation_specialist_display)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto shrink-0 px-4 py-4 md:px-6">
                <Pagination
                  hasPrevious={hasPrevious}
                  hasNext={hasNext}
                  onPrevious={() => setPage((p) => Math.max(0, p - 1))}
                  onNext={() => setPage((p) => p + 1)}
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="hidden lg:block">
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '26%' }} />
                    <col style={{ width: '8%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left align-middle xl:px-6">
                        <button
                          type="button"
                          onClick={() => handleParentSort('name')}
                          className="flex items-center gap-1 font-source-sans-3 transition-opacity hover:opacity-80"
                          style={parentThStyle}
                        >
                          Name
                          <ParentSortArrows field="name" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left align-middle xl:px-6">
                        <button
                          type="button"
                          onClick={() => handleParentSort('count')}
                          className="flex items-center gap-1 font-source-sans-3 transition-opacity hover:opacity-80"
                          style={parentThStyle}
                        >
                          # of Communities
                          <ParentSortArrows field="count" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left align-middle xl:px-6">
                        <button
                          type="button"
                          onClick={() => handleParentSort('type')}
                          className="flex items-center gap-1 font-source-sans-3 transition-opacity hover:opacity-80"
                          style={parentThStyle}
                        >
                          Company Type
                          <ParentSortArrows field="type" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left align-middle xl:px-6">
                        <button
                          type="button"
                          onClick={() => handleParentSort('contact')}
                          className="flex items-center gap-1 font-source-sans-3 transition-opacity hover:opacity-80"
                          style={parentThStyle}
                        >
                          Primary Contact
                          <ParentSortArrows field="contact" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right align-middle">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                </table>
                <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #ACACAD', borderRadius: 12 }}>
                  <table className="w-full" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '30%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '8%' }} />
                    </colgroup>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {pageParentRows.map((row) => (
                        <tr
                          key={row.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => goParentCompanyPage(row)}
                        >
                          <td className="min-w-0 max-w-0 px-4 py-4 align-middle xl:px-6">
                            <span className="block truncate font-source-sans-3" style={cellText} title={row.name}>
                              {row.name}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-middle font-source-sans-3 xl:px-6" style={cellText}>
                            {row.community_count}
                          </td>
                          <td className="min-w-0 px-4 py-4 align-middle font-source-sans-3 xl:px-6" style={cellText}>
                            <span className="block truncate" title={row.company_type}>
                              {row.company_type}
                            </span>
                          </td>
                          <td className="min-w-0 max-w-0 px-4 py-4 align-middle font-source-sans-3 xl:px-6" style={cellText}>
                            <span className="block truncate" title={row.primary_contact_name}>
                              {row.primary_contact_name}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right align-middle">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openParentViewDrawer(row.id);
                              }}
                              className="transition-opacity hover:opacity-80"
                              style={{ color: PARENT_PENCIL }}
                              aria-label={`View or edit ${row.name} in drawer`}
                            >
                              <Pencil size={18} strokeWidth={1.5} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="hidden md:block lg:hidden">
                <div className="divide-y divide-gray-200 rounded-xl border border-[#ACACAD]">
                  {pageParentRows.map((row) => (
                    <div
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => goParentCompanyPage(row)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') goParentCompanyPage(row);
                      }}
                      className={`flex cursor-pointer items-center justify-between gap-2 px-4 py-4 hover:bg-gray-50 ${
                        selectedParentRow === row.id ? 'border-l-4 border-purple-500' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-source-sans-3" style={cellText}>
                          {row.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {row.community_count} communities · {row.company_type}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openParentViewDrawer(row.id);
                          }}
                          className="rounded-lg p-2 transition-opacity hover:opacity-80"
                          style={{ color: PARENT_PENCIL }}
                          aria-label={`View or edit ${row.name} in drawer`}
                        >
                          <Pencil size={18} strokeWidth={1.5} />
                        </button>
                        <ArrowRight size={20} strokeWidth={1.5} className="text-gray-500" aria-hidden />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:hidden">
                <div className="-mx-4 space-y-2 px-4">
                  {pageParentRows.map((row) => (
                    <div
                      key={row.id}
                      className="rounded-xl border border-[#ACACAD] bg-white p-4"
                      onClick={() => goParentCompanyPage(row)}
                      role="presentation"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-source-sans-3" style={cellText}>
                            {row.name}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {row.community_count} communities · {row.primary_contact_name}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">{row.company_type}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openParentViewDrawer(row.id);
                          }}
                          className="shrink-0 p-1"
                          style={{ color: PARENT_PENCIL }}
                          aria-label={`View or edit ${row.name} in drawer`}
                        >
                          <Pencil size={18} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto shrink-0 px-4 py-4 md:px-6">
                <Pagination
                  hasPrevious={hasPrevious}
                  hasNext={hasNext}
                  onPrevious={() => setPage((p) => Math.max(0, p - 1))}
                  onNext={() => setPage((p) => p + 1)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

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
        communitiesList={communities}
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
          setCommunities((prev) => [...prev, row]);
          setPage(0);
        }}
        onUpdate={(row) => {
          setCommunities((prev) => prev.map((c) => (c.id === row.id ? row : c)));
        }}
      />

      <ParentCompanyViewDrawer
        open={parentDetailId !== null && detailParent !== null}
        parent={detailParent}
        linkedCommunities={
          detailParent
            ? communities.filter((c) => c.parent_company_id === detailParent.id)
            : []
        }
        onClose={() => setParentDetailId(null)}
        onEdit={() => {
          if (detailParent) {
            setEditParentId(detailParent.id);
            setParentDetailId(null);
          }
        }}
      />

      <ParentCompanyFormSlidePanel
        open={addParentOpen || editParentId !== null}
        editingParentId={editParentId}
        parentCompaniesList={parentCompanies}
        onClose={() => {
          setAddParentOpen(false);
          setEditParentId(null);
        }}
        onExitEdit={(id) => {
          setEditParentId(null);
          setParentDetailId(id);
        }}
        onSaveSuccess={setCommunitySaveToast}
        onAdd={(row) => {
          setParentCompanies((prev) => [...prev, row]);
          setPage(0);
        }}
        onUpdate={(row) => {
          setParentCompanies((prev) => prev.map((p) => (p.id === row.id ? row : p)));
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
