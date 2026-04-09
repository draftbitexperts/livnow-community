import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronRight, X } from 'lucide-react';
import Pagination from '@/components/Pagination';
import PillSearchWithResults, { type PillSearchResultItem } from '@/components/PillSearchWithResults';
import SearchNormalIcon from '@/components/SearchNormalIcon';
import MemberProfileDrawer from '@/components/MemberProfileDrawer';
import {
  DEMO_TEAM_MEMBERS,
  type DemoTeamMemberRecord,
} from '@/lib/demoTeamMembers';

const TEAL = '#307584';
const PAGE_SIZE = 10;
const taskListBorderColor = '#E3E3E4';
const FILTER_ACCENT = 'hsla(187, 47%, 35%, 1)';

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

const residentTasksColumnHeaderStyle = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 500,
  fontSize: '14px',
  lineHeight: '20px',
  letterSpacing: '0%',
  textAlign: 'left' as const,
  color: '#505051',
};

const residentTasksRowTextStyle = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 500,
  fontSize: '18px',
  lineHeight: '20px',
  letterSpacing: '0%',
  color: '#323234',
};

type SortField = 'name' | 'title' | 'location' | null;
type SortDirection = 'asc' | 'desc' | null;

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

function sortValue(row: DemoTeamMemberRecord, field: NonNullable<SortField>): string {
  switch (field) {
    case 'name':
      return row.name.toLowerCase();
    case 'title':
      return row.title.toLowerCase();
    case 'location':
      return (row.location ?? '').toLowerCase();
    default:
      return '';
  }
}

function buildTeamPillResults(rows: DemoTeamMemberRecord[], q: string): PillSearchResultItem[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const out: PillSearchResultItem[] = [];
  for (const row of rows) {
    if (row.name.toLowerCase().includes(t)) {
      out.push({ id: row.id, category: '[Name]', title: row.name });
    } else if (row.title.toLowerCase().includes(t)) {
      out.push({ id: row.id, category: '[Title]', title: `${row.name} — ${row.title}` });
    } else if ((row.location ?? '').toLowerCase().includes(t)) {
      out.push({ id: row.id, category: '[Location]', title: `${row.name} — ${row.location ?? ''}` });
    }
    if (out.length >= 8) break;
  }
  return out;
}

function teamMemberMatchesSearchQuery(m: DemoTeamMemberRecord, qRaw: string): boolean {
  const q = qRaw.trim().toLowerCase();
  if (!q) return true;
  const name = m.name.toLowerCase();
  const title = m.title.toLowerCase();
  const loc = (m.location ?? '').toLowerCase();
  return name.includes(q) || title.includes(q) || loc.includes(q);
}

export default function TeamPage() {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(0);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftTitleKeys, setDraftTitleKeys] = useState<Set<string>>(() => new Set());
  const [appliedTitleKeys, setAppliedTitleKeys] = useState<Set<string>>(() => new Set());
  const filterRef = useRef<HTMLDivElement>(null);
  const [drawerMember, setDrawerMember] = useState<DemoTeamMemberRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const uniqueTitles = useMemo(() => {
    const s = new Set<string>();
    for (const m of DEMO_TEAM_MEMBERS) s.add(m.title);
    return [...s].sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredBySearchAndTitle = useMemo(() => {
    return DEMO_TEAM_MEMBERS.filter((m) => {
      if (appliedTitleKeys.size > 0 && !appliedTitleKeys.has(m.title)) return false;
      return teamMemberMatchesSearchQuery(m, searchQuery);
    });
  }, [searchQuery, appliedTitleKeys]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredBySearchAndTitle];
    if (!sortField || !sortDirection) return rows;
    rows.sort((a, b) => {
      const va = sortValue(a, sortField);
      const vb = sortValue(b, sortField);
      const cmp = va.localeCompare(vb);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [filteredBySearchAndTitle, sortField, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sortedRows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const hasPrevious = safePage > 0;
  const hasNext = safePage < pageCount - 1;

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  useEffect(() => {
    if (!filterOpen) return;
    const onDown = (e: MouseEvent) => {
      if (filterRef.current?.contains(e.target as Node)) return;
      setFilterOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [filterOpen]);

  const openFilter = () => {
    setDraftTitleKeys(new Set(appliedTitleKeys));
    setFilterOpen((o) => !o);
  };

  const toggleDraftTitle = (title: string) => {
    setDraftTitleKeys((prev) => {
      const n = new Set(prev);
      if (n.has(title)) n.delete(title);
      else n.add(title);
      return n;
    });
  };

  const applyFilter = () => {
    setAppliedTitleKeys(new Set(draftTitleKeys));
    setFilterOpen(false);
    setPage(0);
  };

  const clearFilterDraft = () => setDraftTitleKeys(new Set());

  const filtersActive = appliedTitleKeys.size > 0;

  const handleSort = (field: NonNullable<SortField>) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortField(null);
      setSortDirection(null);
    }
    setPage(0);
  };

  const SortArrows = ({ field }: { field: NonNullable<SortField> }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="shrink-0 text-gray-400" aria-hidden />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp size={14} className="shrink-0 text-[#307584]" aria-hidden />;
    }
    return <ArrowDown size={14} className="shrink-0 text-[#307584]" aria-hidden />;
  };

  const openDrawer = (m: DemoTeamMemberRecord) => {
    setDrawerMember(m);
    setDrawerOpen(true);
  };

  const pillResults = useMemo(
    () => buildTeamPillResults(DEMO_TEAM_MEMBERS, searchQuery),
    [searchQuery],
  );

  const cardHeaderStyle = {
    fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
    fontWeight: 600,
    fontSize: 24,
    lineHeight: '28px',
    color: '#323234',
  } as const;

  return (
    <div className="flex w-full min-w-0 flex-col pb-28 max-lg:pb-32">
      <div
        className="flex min-w-0 flex-1 flex-col rounded-2xl bg-white shadow-sm"
        style={{ borderRadius: 16 }}
      >
        <div className="flex flex-col gap-4 p-6 md:p-8">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <h2 className="min-w-0 shrink-0 font-source-sans-3" style={cardHeaderStyle}>
              All Team Members
            </h2>
            <div className="flex w-full min-w-0 flex-col items-stretch gap-3 overflow-visible lg:max-w-none lg:flex-1">
              <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-[18px] overflow-visible lg:flex-nowrap">
                {filtersActive && (
                  <div className="flex min-w-0 w-full flex-wrap items-center justify-end gap-2 lg:w-auto lg:flex-1">
                    {[...appliedTitleKeys].map((t) => (
                      <span
                        key={t}
                        className="inline-flex max-w-full items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 font-source-sans-3"
                        style={{
                          backgroundColor: 'hsla(168, 38%, 91%, 1)',
                          color: 'hsla(191, 47%, 32%, 1)',
                        }}
                      >
                        <span className="max-w-[200px] truncate text-sm font-medium">{t}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedTitleKeys((prev) => {
                              const n = new Set(prev);
                              n.delete(t);
                              return n;
                            });
                            setPage(0);
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                          style={{ color: 'hsla(191, 47%, 32%, 1)' }}
                          aria-label={`Remove ${t} filter`}
                        >
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-full border"
                            style={{ borderColor: 'hsla(191, 47%, 32%, 0.35)' }}
                          >
                            <X size={12} strokeWidth={2.5} aria-hidden />
                          </span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div ref={filterRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={openFilter}
                    className={`rounded-lg p-2 transition-colors hover:bg-gray-100 ${
                      filterOpen || filtersActive ? 'bg-gray-100 text-[#307584]' : 'text-gray-600'
                    }`}
                    aria-label="Filter team members"
                    aria-expanded={filterOpen}
                  >
                    <FilterLinesIcon size={20} />
                  </button>
                  {filterOpen && (
                    <div
                      className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),320px)] rounded-2xl border border-gray-200 bg-white p-5 shadow-xl"
                      role="dialog"
                      aria-label="Filter by title"
                    >
                      <h3 className="mb-3 font-source-sans-3 text-sm font-medium text-[#505051]">
                        Job title
                      </h3>
                      <div className="max-h-60 space-y-0.5 overflow-y-auto">
                        {uniqueTitles.map((t) => {
                          const checked = draftTitleKeys.has(t);
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => toggleDraftTitle(t)}
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
                              <span className="font-source-sans-3 text-base font-medium text-[#323234]">
                                {t}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex flex-wrap justify-end gap-3">
                        <button
                          type="button"
                          onClick={clearFilterDraft}
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
                          onClick={applyFilter}
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
                </div>
                {!searchExpanded ? (
                  <button
                    type="button"
                    onClick={() => setSearchExpanded(true)}
                    className="shrink-0 rounded-lg p-2 transition-colors hover:bg-gray-100"
                    aria-label="Open search"
                  >
                    <SearchNormalIcon size={22} />
                  </button>
                ) : (
                  <PillSearchWithResults
                    className="min-w-[min(100%,240px)] w-full max-w-[400px] flex-1"
                    placeholder="Search team members"
                    value={searchQuery}
                    onChange={(v) => {
                      setSearchQuery(v);
                      setPage(0);
                    }}
                    results={pillResults}
                    accentColor={TEAL}
                    isExpanded={searchExpanded}
                    onDismiss={() => setSearchExpanded(false)}
                    onResultSelect={(item) => {
                      const row = DEMO_TEAM_MEMBERS.find((r) => r.id === item.id);
                      if (!row) return;
                      if (item.category === '[Name]') setSearchQuery(row.name);
                      else if (item.category === '[Title]') setSearchQuery(row.title);
                      else if (item.category === '[Location]') setSearchQuery(row.location ?? '');
                      setPage(0);
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          <div
            className="overflow-hidden rounded-2xl"
            style={{
              border: `1px solid ${taskListBorderColor}`,
              paddingTop: 24,
              paddingRight: 24,
              paddingBottom: 24,
              paddingLeft: 24,
            }}
          >
            <div className="hidden w-full min-w-0 flex-col md:flex">
              <div
                className="mb-0 grid gap-x-4 border-b pb-3 font-source-sans-3"
                style={{
                  gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) 2.25rem',
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
                <div className="flex min-w-0 items-end">
                  <button
                    type="button"
                    onClick={() => handleSort('title')}
                    className="flex min-w-0 items-center gap-1 text-left transition-opacity hover:opacity-80"
                    style={residentTasksColumnHeaderStyle}
                  >
                    <span className="truncate">Title</span>
                    <SortArrows field="title" />
                  </button>
                </div>
                <div className="flex min-w-0 items-end">
                  <button
                    type="button"
                    onClick={() => handleSort('location')}
                    className="flex min-w-0 items-center gap-1 text-left transition-opacity hover:opacity-80"
                    style={residentTasksColumnHeaderStyle}
                  >
                    <span className="truncate">Location</span>
                    <SortArrows field="location" />
                  </button>
                </div>
                <div className="flex items-end justify-end" style={residentTasksColumnHeaderStyle}>
                  <span className="sr-only">Actions</span>
                </div>
              </div>

              {sortedRows.length === 0 ? (
                <p className="py-8 text-center font-source-sans-3 text-[#505051]">
                  No team members match your filters.
                </p>
              ) : (
                <div>
                  {pageRows.map((row, rowIndex) => (
                    <div
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openDrawer(row)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openDrawer(row);
                        }
                      }}
                      className="grid cursor-pointer items-center gap-x-4 py-4 font-source-sans-3 outline-none transition-colors hover:bg-gray-50/80 focus-visible:ring-2 focus-visible:ring-[#307584] focus-visible:ring-offset-2"
                      style={{
                        gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) 2.25rem',
                        borderBottom:
                          rowIndex < pageRows.length - 1
                            ? `1px solid ${taskListBorderColor}`
                            : undefined,
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-3 self-center pr-1">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-source-sans-3 text-xs font-semibold text-white"
                          style={{ backgroundColor: TEAL }}
                          aria-hidden
                        >
                          {specialistInitials(row.name)}
                        </div>
                        <span className="min-w-0 truncate" style={residentTasksRowTextStyle} title={row.name}>
                          {row.name}
                        </span>
                      </div>
                      <div className="min-w-0 self-center">
                        <span className="block truncate" style={residentTasksRowTextStyle} title={row.title}>
                          {row.title}
                        </span>
                      </div>
                      <div className="min-w-0 self-center">
                        <span style={residentTasksRowTextStyle}>
                          {row.location?.trim() ? row.location : '—'}
                        </span>
                      </div>
                      <div className="flex justify-end self-center text-gray-400" aria-hidden>
                        <ChevronRight size={20} strokeWidth={1.75} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex w-full flex-col gap-2 md:hidden">
              {sortedRows.length === 0 ? (
                <p className="py-6 text-center font-source-sans-3 text-sm text-[#505051]">
                  No team members match your filters.
                </p>
              ) : (
                pageRows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => openDrawer(row)}
                    className="flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50"
                    style={{ borderColor: taskListBorderColor }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: TEAL }}
                      aria-hidden
                    >
                      {specialistInitials(row.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-source-sans-3 font-semibold text-[#323234]">{row.name}</p>
                      <p className="mt-0.5 font-source-sans-3 text-sm text-[#505051]">
                        {row.title}
                        {row.location?.trim() ? ` · ${row.location}` : ''}
                      </p>
                    </div>
                    <ChevronRight size={20} className="shrink-0 text-gray-400" aria-hidden />
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 shrink-0">
              <Pagination
                hasPrevious={hasPrevious && sortedRows.length > 0}
                hasNext={hasNext}
                onPrevious={() => setPage((p) => Math.max(0, p - 1))}
                onNext={() => setPage((p) => p + 1)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-12 shrink-0 max-lg:h-16" aria-hidden />

      <MemberProfileDrawer
        open={drawerOpen}
        member={drawerMember}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerMember(null);
        }}
      />
    </div>
  );
}
