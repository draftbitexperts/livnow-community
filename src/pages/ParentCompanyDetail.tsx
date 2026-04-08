import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  Pencil,
  Plus,
} from 'lucide-react';
import Pagination from '@/components/Pagination';
import SearchNormalIcon from '@/components/SearchNormalIcon';
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

const communityUpdatesContentStyle: CSSProperties = {
  paddingTop: 60,
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

function DetailTabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-source-sans-3 flex items-center justify-center gap-2 whitespace-nowrap transition-opacity hover:opacity-90"
      style={
        active
          ? {
              height: 48,
              paddingLeft: 24,
              paddingRight: 24,
              borderRadius: 9999,
              backgroundColor: '#307584',
              fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
              fontWeight: 500,
              fontSize: 16,
              lineHeight: '22px',
              color: '#FFFFFF',
            }
          : {
              height: 48,
              paddingLeft: 24,
              paddingRight: 24,
              borderRadius: 9999,
              backgroundColor: 'hsla(193, 27%, 94%, 1)',
              border: '1px solid #83ACB5',
              fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
              fontWeight: 500,
              fontSize: 16,
              lineHeight: '22px',
              color: '#307584',
            }
      }
    >
      <Icon size={18} style={{ color: active ? '#FFFFFF' : '#307584', flexShrink: 0 }} />
      {label}
    </button>
  );
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

  const parent = useMemo(() => {
    if (!parentId) return null;
    if (state?.parentCompanyRecord?.id === parentId) return state.parentCompanyRecord;
    return DEMO_PARENT_COMPANIES.find((p) => p.id === parentId) ?? null;
  }, [parentId, state?.parentCompanyRecord]);

  const childCommunities = useMemo(() => {
    if (!parentId) return [];
    if (state?.linkedCommunities !== undefined) {
      return state.linkedCommunities.filter((c) => c.parent_company_id === parentId);
    }
    return DEMO_COMMUNITIES.filter((c) => c.parent_company_id === parentId);
  }, [parentId, state?.linkedCommunities]);

  const sortedChildren = useMemo(() => {
    if (!sortField || !sortDirection) return childCommunities;
    return [...childCommunities].sort((a, b) => {
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
  }, [childCommunities, sortField, sortDirection]);

  const maxPageIdx = Math.max(0, Math.ceil(sortedChildren.length / PAGE_SIZE) - 1);
  const safePage = Math.min(page, maxPageIdx);
  const pageRows = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return sortedChildren.slice(start, start + PAGE_SIZE);
  }, [sortedChildren, safePage]);

  useEffect(() => {
    setPage((p) => (p > maxPageIdx ? maxPageIdx : p));
  }, [maxPageIdx]);

  const detail = useMemo(() => (parent ? buildParentCompanyDrawerDetail(parent) : null), [parent]);

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

  const leftStack = (
    <div className="flex w-full min-w-0 flex-col gap-6 xl:w-[264px] xl:flex-shrink-0">
      <div className="relative w-full min-w-0 xl:w-[264px]">
        <div
          className="absolute z-10 flex items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-200"
          style={{
            width: 116,
            height: 116,
            left: '50%',
            top: 2,
            transform: 'translateX(-50%)',
          }}
        >
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=232&background=307584&color=fff&bold=true`}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        </div>
        <div
          className="flex w-full min-w-0 flex-col"
          style={{
            marginTop: 60,
            borderRadius: 16,
            opacity: 1,
            backgroundColor: '#FFFFFF',
            boxShadow: 'var(--resident-card-shadow)',
          }}
        >
          <div
            className="flex w-full min-w-0 flex-shrink-0 flex-col items-start justify-end"
            style={{
              height: 110,
              backgroundColor: '#307584',
              opacity: 0.9,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingBottom: 12,
              paddingLeft: 16,
              paddingRight: 16,
            }}
          >
            <h2 className="w-full text-left font-poppins text-xl font-bold leading-tight text-white">{displayName}</h2>
          </div>
          <div className="relative flex flex-shrink-0 justify-start pb-2 pl-4 pt-2">
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
          <div className="space-y-6 p-6 pl-4">
            <div className="relative">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-source-sans-3" style={residentDetailTextStyle}>
                  Company Details
                </h3>
                <button
                  type="button"
                  onClick={goEditList}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Edit parent company"
                >
                  <Pencil size={18} strokeWidth={1.5} />
                </button>
              </div>
              <div className="space-y-1 font-source-sans-3" style={residentDetailTextStyle}>
                <p className="font-medium">{parent.company_type}</p>
                <p className="whitespace-pre-wrap">{detail.addressLine}</p>
                <a
                  href={websiteHref(detail.website)}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                  style={{ color: residentDetailEmailColor }}
                >
                  {detail.website.replace(/^https?:\/\//i, '')}
                </a>
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
        className="flex w-full min-w-0 flex-shrink-0 flex-col"
        style={{
          borderRadius: 16,
          padding: 16,
          gap: 10,
          opacity: 1,
          backgroundColor: '#FFFFFF',
          boxShadow: 'var(--resident-card-shadow)',
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-source-sans-3" style={relocationSectionHeaderStyle}>
            # of Communities
          </h3>
          <button
            type="button"
            onClick={goEditList}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Edit"
          >
            <Pencil size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="font-source-sans-3" style={residentDetailTextStyle}>
          <p className="font-medium">{childCommunities.length} communities on record</p>
        </div>
      </div>

      <div
        className="flex w-full min-w-0 flex-shrink-0 flex-col"
        style={{
          borderRadius: 16,
          padding: 16,
          gap: 10,
          opacity: 1,
          backgroundColor: '#FFFFFF',
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
            className="text-gray-400 hover:text-gray-600"
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
      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h3 className="min-w-0 font-source-sans-3" style={{ ...contentSectionHeaderStyle, textAlign: 'left' }}>
          Communities
        </h3>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-lg p-2 text-[#307584] transition-colors hover:bg-gray-100"
            aria-label="Filter"
          >
            <FilterLinesIcon size={20} />
          </button>
          <button type="button" className="rounded-lg p-2 transition-colors hover:bg-gray-100" aria-label="Search">
            <SearchNormalIcon size={22} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/communities?tab=communities')}
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
          <div className="flex items-end justify-end" style={residentTasksColumnHeaderStyle}>
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
                className="grid items-center gap-x-4 py-4 font-source-sans-3"
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
                    className="text-gray-400 transition-opacity hover:opacity-80"
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
              className="rounded-xl border bg-white px-4 py-3"
              style={{ borderColor: taskListBorderColor }}
            >
              <p className="font-source-sans-3 font-semibold text-[#323234]">{row.name}</p>
              <p className="mt-1 font-source-sans-3 text-sm text-[#505051]">
                {row.state} · {row.relocation_specialist_display}
              </p>
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
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div
        className="relative mt-0 flex-shrink-0 bg-[hsla(193,27%,94%,1)] xl:-mt-6"
        style={{ width: '100%', minHeight: 48 }}
      >
        <div
          className="absolute left-0 right-0 z-10 flex flex-wrap justify-center gap-2 rounded-t-2xl"
          style={{ top: 2, padding: 24 }}
        >
          <DetailTabButton active icon={Building2} label="Communities" onClick={() => {}} />
        </div>
        <div
          className="flex flex-col overflow-hidden rounded-2xl"
          style={{ marginTop: 48, backgroundColor: '#FFFFFF', borderRadius: 16 }}
        >
          <div className="flex flex-col" style={communityUpdatesContentStyle}>
            {renderCommunitiesTable()}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex w-full min-w-0 flex-col pb-28 max-lg:pb-32">
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
    </div>
  );
}
