import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Pencil,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from 'lucide-react';
import { formSelectOverrides } from '@/lib/formStyles';
import { toInputDate, formatDateToAmerican } from '@/lib/dateUtils';
import { toSentenceCase } from '@/lib/textUtils';
import StateSearchSelect from '@/components/StateSearchSelect';
import Pagination from '@/components/Pagination';
import { BottomToast, type BottomToastPayload } from '@/components/BottomToast';
import ResidentContactsTab from '@/components/ResidentContactsTab';
import { ThemeDateTimePicker } from '@/components/ThemeDateTimePicker';
import { SearchableFormSelect, type SearchableFormSelectOption } from '@/components/SearchableFormSelect';
import { type DemoResidentRecord, toResidentSlug } from '@/lib/demoResidents';
import { useDemoResidents } from '@/contexts/DemoResidentsContext';

/** Filter icon: three horizontal lines of decreasing length (reducing hamburger style) */
function FilterLinesIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  const stroke = 2;
  const cx = size / 2;
  const y1 = size * 0.28;
  const y2 = size / 2;
  const y3 = size * 0.72;
  const w1 = size * 0.85; // top - longest
  const w2 = size * 0.55; // middle
  const w3 = size * 0.3;  // bottom - shortest
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="square">
      <line x1={cx - w1 / 2} y1={y1} x2={cx + w1 / 2} y2={y1} />
      <line x1={cx - w2 / 2} y1={y2} x2={cx + w2 / 2} y2={y2} />
      <line x1={cx - w3 / 2} y1={y3} x2={cx + w3 / 2} y2={y3} />
    </svg>
  );
}

type SortField = 'name' | 'community' | null;
type SortDirection = 'asc' | 'desc' | null;

function formatMoveInShort(value: string | null | undefined): string {
  if (value == null || !String(value).trim()) return '—';
  const american = formatDateToAmerican(value);
  if (american === '—' || !american) return '—';
  const parts = american.split('/');
  if (parts.length !== 3) return '—';
  const [m, d, y] = parts;
  const yy = y.length >= 2 ? y.slice(-2) : y;
  return `${Number(m)}/${Number(d)}/${yy}`;
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

/** Resident row for the table (derived from demo / future API). */
interface Resident {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  residentInitials: string;
  community: string;
  reloSpecialist: string;
  zipCode: string;
  moveInDisplay: string;
  status: string;
}

type CommunityOption = { id: string; name: string };
type SpecialistOption = { id: string; email: string; display_name: string };

const DUMMY_COMMUNITIES: CommunityOption[] = [
  { id: 'demo-comm-1', name: 'Whitestone' },
  { id: 'demo-comm-2', name: 'Harbor View' },
  { id: 'demo-comm-3', name: 'Maple Ridge' },
];

const DUMMY_SPECIALISTS: SpecialistOption[] = [
  { id: 'demo-spec-1', email: 'jane.doe@example.com', display_name: 'Jane Doe' },
  { id: 'demo-spec-2', email: 'alex.morgan@example.com', display_name: 'Alex Morgan' },
  { id: 'demo-spec-3', email: 'sam.rivera@example.com', display_name: 'Sam Rivera' },
];

/** Map status filter keys ↔ resident `status` field (lowercase / underscores) */
const MOVE_STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'waitlisted', label: 'Waitlisted' },
  { key: 'pending', label: 'Pending' },
  { key: 'canceled', label: 'Canceled' },
];

const FILTER_ACCENT = 'hsla(187, 47%, 35%, 1)';
/** Aktif filtre chip’leri — mint zemin, koyu teal metin */
const FILTER_CHIP_BG = 'hsla(168, 38%, 91%, 1)';
const FILTER_CHIP_TEXT = 'hsla(191, 47%, 32%, 1)';

function normalizeResidentStatusKey(status: string | null | undefined): string {
  const s = (status ?? '').toLowerCase().trim().replace(/\s+/g, '_');
  if (s === 'cancelled') return 'canceled';
  if (s === 'waitlist') return 'waitlisted';
  return s;
}

function recordMatchesAppliedFilters(
  rec: DemoResidentRecord,
  appliedSpecialistIds: Set<string>,
  appliedStatusKeys: Set<string>,
): boolean {
  if (appliedSpecialistIds.size > 0) {
    const sid = rec.assigned_relocation_specialist_id;
    if (!sid || !appliedSpecialistIds.has(sid)) return false;
  }
  if (appliedStatusKeys.size > 0) {
    const sk = normalizeResidentStatusKey(rec.status);
    if (!appliedStatusKeys.has(sk)) return false;
  }
  return true;
}

function recordToTableRow(r: DemoResidentRecord): Resident {
  const f = (r.first_name ?? '').trim();
  const l = (r.last_name ?? '').trim();
  let residentInitials = '—';
  if (f && l) residentInitials = (f[0] + l[0]).toUpperCase();
  else if (f) residentInitials = f.slice(0, 2).toUpperCase();
  else if (l) residentInitials = l.slice(0, 2).toUpperCase();

  const zip = (r.zip_code ?? '').trim();
  const zipCode =
    !zip ? '—' : /^zip\s*:?\s*not\s+provided$/i.test(zip) ? '—' : zip;

  return {
    id: r.id,
    name: [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || '—',
    first_name: r.first_name,
    last_name: r.last_name,
    residentInitials,
    community: r.community_name || '—',
    reloSpecialist: r.relocation_specialist_display || '—',
    zipCode,
    moveInDisplay: formatMoveInShort(r.move_in_date),
    status: r.status ?? 'Active',
  };
}

const ADD_RESIDENT_RELATIONSHIP_OPTIONS: SearchableFormSelectOption[] = [
  { value: 'Son', label: 'Son' },
  { value: 'Daughter', label: 'Daughter' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Other', label: 'Other' },
];

export default function AllResidentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const { records: demoRecords, setRecords: setDemoRecords } = useDemoResidents();
  const [isAddResidentModalOpen, setIsAddResidentModalOpen] = useState(false);
  const [addResidentPanelEntered, setAddResidentPanelEntered] = useState(false);
  const [editingResidentId, setEditingResidentId] = useState<string | null>(null);
  const [returnToResidentSlug, setReturnToResidentSlug] = useState<string | null>(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mainTab, setMainTab] = useState<'residents' | 'contacts'>('residents');
  const [residentSaveToast, setResidentSaveToast] = useState<BottomToastPayload | null>(null);

  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [filterReloSectionOpen, setFilterReloSectionOpen] = useState(true);
  const [filterStatusSectionOpen, setFilterStatusSectionOpen] = useState(true);
  const [draftFilterSpecialistIds, setDraftFilterSpecialistIds] = useState<Set<string>>(() => new Set());
  const [draftFilterStatusKeys, setDraftFilterStatusKeys] = useState<Set<string>>(() => new Set());
  const [appliedFilterSpecialistIds, setAppliedFilterSpecialistIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [appliedFilterStatusKeys, setAppliedFilterStatusKeys] = useState<Set<string>>(() => new Set());
  const filterPopoverRef = useRef<HTMLDivElement>(null);
  const contactsToolbarMountRef = useRef<HTMLDivElement>(null);

  const [residentForm, setResidentForm] = useState({
    relocationSpecialist: '',
    firstName: '',
    lastName: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    email: '',
    phone: '',
    primaryContactFirstName: '',
    primaryContactLastName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    primaryContactRelationship: '',
    primaryContactNotes: '',
    community: '',
    moveInDate: '',
    importantNotes: '',
  });

  const communitiesList = DUMMY_COMMUNITIES;
  const specialistsList = DUMMY_SPECIALISTS;

  const communitySearchOptions = useMemo(
    () => communitiesList.map((c) => ({ value: c.id, label: c.name })),
    [communitiesList],
  );

  const relocationSpecialistSearchOptions = useMemo(
    () => specialistsList.map((s) => ({ value: s.id, label: s.display_name })),
    [specialistsList],
  );

  // Slide-in animation for Add Resident panel
  useEffect(() => {
    if (isAddResidentModalOpen) {
      const frame = requestAnimationFrame(() => setAddResidentPanelEntered(true));
      return () => cancelAnimationFrame(frame);
    } else {
      setAddResidentPanelEntered(false);
    }
  }, [isAddResidentModalOpen]);

  // Open Add Resident panel when navigating from Dashboard with ?add=1
  useEffect(() => {
    const add = searchParams.get('add');
    if (add === '1' || add === 'true') {
      setIsAddResidentModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Open Edit Resident panel when navigating from Resident Details (state from edit icons)
  useEffect(() => {
    const state = location.state as { editResidentId?: string; returnToResidentSlug?: string } | null;
    if (state?.editResidentId && !isAddResidentModalOpen) {
      setEditingResidentId(state.editResidentId);
      setReturnToResidentSlug(state.returnToResidentSlug ?? null);
      setIsAddResidentModalOpen(true);
      navigate('/residents/all', { replace: true, state: {} });
    }
  }, [location.state, isAddResidentModalOpen, navigate]);

  useEffect(() => {
    if (!filterPopoverOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (filterPopoverRef.current?.contains(e.target as Node)) return;
      setFilterPopoverOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [filterPopoverOpen]);

  const toggleDraftSpecialist = (id: string) => {
    setDraftFilterSpecialistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDraftStatus = (key: string) => {
    setDraftFilterStatusKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openFilterPopover = () => {
    setDraftFilterSpecialistIds(new Set(appliedFilterSpecialistIds));
    setDraftFilterStatusKeys(new Set(appliedFilterStatusKeys));
    setFilterPopoverOpen(true);
  };

  const applyFilters = () => {
    setAppliedFilterSpecialistIds(new Set(draftFilterSpecialistIds));
    setAppliedFilterStatusKeys(new Set(draftFilterStatusKeys));
    setFilterPopoverOpen(false);
  };

  const clearAllFiltersInPopover = () => {
    setDraftFilterSpecialistIds(new Set());
    setDraftFilterStatusKeys(new Set());
  };

  const removeAppliedSpecialistId = (id: string) => {
    setAppliedFilterSpecialistIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const removeAppliedStatusKey = (key: string) => {
    setAppliedFilterStatusKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const closeAddResidentPanel = () => {
    const slug = returnToResidentSlug;
    setAddResidentPanelEntered(false);
    setEditingResidentId(null);
    setReturnToResidentSlug(null);
    if (slug) navigate(`/residents/${slug}`);
    setTimeout(() => {
      setIsAddResidentModalOpen(false);
      setResidentForm({
        relocationSpecialist: '',
        firstName: '',
        lastName: '',
        address: '',
        address2: '',
        city: '',
        state: '',
        zipCode: '',
        email: '',
        phone: '',
        primaryContactFirstName: '',
        primaryContactLastName: '',
        primaryContactEmail: '',
        primaryContactPhone: '',
        primaryContactRelationship: '',
        primaryContactNotes: '',
        community: '',
        moveInDate: '',
        importantNotes: '',
      });
    }, 300);
  };

  // Prefill form from demo record when editing
  useEffect(() => {
    if (!isAddResidentModalOpen || !editingResidentId) return;
    const data = demoRecords.find((row) => row.id === editingResidentId);
    if (!data) return;
    const r = data;
    const pc = r.primary_contact;
    setResidentForm({
      relocationSpecialist: r.assigned_relocation_specialist_id ?? '',
      firstName: r.first_name ?? '',
      lastName: r.last_name ?? '',
      address: r.address ?? '',
      address2: r.address_2 ?? '',
      city: r.city ?? '',
      state: r.state ?? '',
      zipCode: r.zip_code ?? '',
      email: r.email ?? '',
      phone: r.phone ?? '',
      primaryContactFirstName: pc?.first_name ?? '',
      primaryContactLastName: pc?.last_name ?? '',
      primaryContactEmail: pc?.email ?? '',
      primaryContactPhone: pc?.phone ?? '',
      primaryContactRelationship: pc?.relationship ?? '',
      primaryContactNotes: pc?.notes ?? '',
      community: r.community_id ?? '',
      moveInDate: r.move_in_date ? toInputDate(r.move_in_date) : '',
      importantNotes: r.important_notes ?? '',
    });
  }, [isAddResidentModalOpen, editingResidentId, demoRecords]);

  function handleSaveResident() {
    const communityId = residentForm.community.trim();
    const firstName = residentForm.firstName.trim();
    const lastName = residentForm.lastName.trim();
    if (!communityId) {
      setSubmitError('Please select a community.');
      return;
    }
    if (!firstName || !lastName) {
      setSubmitError('First name and last name are required.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const specId = residentForm.relocationSpecialist.trim() || null;
    const specName = specId
      ? (DUMMY_SPECIALISTS.find((s) => s.id === specId)?.display_name ?? '—')
      : '—';
    const commName = DUMMY_COMMUNITIES.find((c) => c.id === communityId)?.name ?? '—';

    const primaryPayload = {
      first_name: residentForm.primaryContactFirstName.trim() || null,
      last_name: residentForm.primaryContactLastName.trim() || null,
      email: residentForm.primaryContactEmail.trim() || null,
      phone: residentForm.primaryContactPhone.trim() || null,
      relationship: residentForm.primaryContactRelationship.trim() || null,
      notes: residentForm.primaryContactNotes.trim() || null,
    };

    const hasPrimary =
      (primaryPayload.first_name ?? '') !== '' ||
      (primaryPayload.last_name ?? '') !== '' ||
      (primaryPayload.email ?? '') !== '' ||
      (primaryPayload.phone ?? '') !== '';

    try {
      if (editingResidentId) {
        setDemoRecords((prev) =>
          prev.map((row) => {
            if (row.id !== editingResidentId) return row;
            const nextPc = hasPrimary
              ? {
                  id: row.primary_contact?.id ?? `demo-pc-${editingResidentId}`,
                  ...primaryPayload,
                }
              : row.primary_contact;
            return {
              ...row,
              first_name: firstName,
              last_name: lastName,
              community_id: communityId,
              community_name: commName,
              assigned_relocation_specialist_id: specId,
              relocation_specialist_display: specName,
              zip_code: residentForm.zipCode.trim() || null,
              move_in_date: residentForm.moveInDate.trim() || null,
              important_notes: residentForm.importantNotes.trim() || null,
              email: residentForm.email.trim() || null,
              phone: residentForm.phone.trim() || null,
              address: residentForm.address.trim() || null,
              address_2: residentForm.address2.trim() || null,
              city: residentForm.city.trim() || null,
              state: residentForm.state.trim() || null,
              primary_contact: nextPc,
            };
          }),
        );
      } else {
        const newId = `demo-r-${Date.now()}`;
        setDemoRecords((prev) => [
          ...prev,
          {
            id: newId,
            first_name: firstName,
            last_name: lastName,
            community_id: communityId,
            community_name: commName,
            assigned_relocation_specialist_id: specId,
            relocation_specialist_display: specName,
            zip_code: residentForm.zipCode.trim() || null,
            move_in_date: residentForm.moveInDate.trim() || null,
            status: 'pending',
            email: residentForm.email.trim() || null,
            phone: residentForm.phone.trim() || null,
            address: residentForm.address.trim() || null,
            address_2: residentForm.address2.trim() || null,
            city: residentForm.city.trim() || null,
            state: residentForm.state.trim() || null,
            important_notes: residentForm.importantNotes.trim() || null,
            primary_contact: hasPrimary
              ? { id: `demo-pc-${newId}`, ...primaryPayload }
              : null,
          },
        ]);
      }
      closeAddResidentPanel();
      setResidentSaveToast({
        message: editingResidentId
          ? 'Resident successfully updated'
          : 'New resident successfully added',
        variant: 'success',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusBgColor = (status: string): string => {
    const key = (status ?? '').toLowerCase().replace(/\s+/g, '_');
    const colors: Record<string, string> = {
      active: '#307584',
      completed: '#659B7A',
      canceled: '#E35E5E',
      cancelled: '#E35E5E',
      closed: '#757576',
      on_hold: '#E9BC62',
      'on hold': '#E9BC62',
      waitlist: '#E9BC62',
      waitlisted: '#E9BC62',
      pending: '#757576',
    };
    return colors[key] ?? '#757576';
  };

  const statusChipStyle = (status: string) => ({
    minWidth: 69,
    height: 24,
    opacity: 1,
    borderRadius: 4,
    gap: 4,
    paddingTop: 4,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    backgroundColor: getStatusBgColor(status),
    fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
    fontWeight: 600,
    fontSize: 14,
    lineHeight: '20px',
    letterSpacing: '0%',
    color: '#FFFFFF',
  });

  // Add Resident form styles
  const formSectionHeaderStyle: React.CSSProperties = {
    fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
    fontWeight: 600,
    fontSize: 20,
    lineHeight: '24px',
    letterSpacing: '0%',
    verticalAlign: 'middle',
    color: '#000000',
  };
  const formLabelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
    fontWeight: 600,
    fontSize: 18,
    lineHeight: '20px',
    letterSpacing: '0%',
    verticalAlign: 'middle',
    color: '#323234',
  };
  const formInputStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 335,
    height: 48,
    borderRadius: 8,
    border: '1px solid #d1d5db',
    padding: 16,
    gap: 8,
    fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
    fontWeight: 500,
    fontSize: 18,
    lineHeight: '20px',
    letterSpacing: '0%',
    color: '#323234',
  };
  const formSelectStyle: React.CSSProperties = {
    ...formInputStyle,
    ...formSelectOverrides,
  };

  const handleSort = (field: 'name' | 'community') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredResidents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const afterSearch = demoRecords.filter((rec) => {
      const row = recordToTableRow(rec);
      return (
        row.name.toLowerCase().includes(q) || row.community.toLowerCase().includes(q)
      );
    });
    const afterFilters = afterSearch.filter((rec) =>
      recordMatchesAppliedFilters(rec, appliedFilterSpecialistIds, appliedFilterStatusKeys),
    );
    const rows = afterFilters.map(recordToTableRow);
    return [...rows].sort((a, b) => {
      if (!sortField) return 0;
      const aValue = sortField === 'name' ? a.name : a.community;
      const bValue = sortField === 'name' ? b.name : b.community;
      if (sortDirection === 'asc') return aValue.localeCompare(bValue);
      return bValue.localeCompare(aValue);
    });
  }, [
    demoRecords,
    searchQuery,
    sortField,
    sortDirection,
    appliedFilterSpecialistIds,
    appliedFilterStatusKeys,
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
          {/* Mobile/Tablet Header */}
          <div className="shrink-0 lg:hidden">
            <div className="bg-gray-800 text-white text-xs px-4 py-1 text-center">
              <span className="hidden md:inline">Tablet</span>
              <span className="md:hidden">Mobile</span> Residents / All Residents
            </div>
          </div>

          {/* Main Content Card — flex-1 so short lists still fill viewport */}
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
              {/* Tabs + actions — toolbar full-width below tabs on smaller screens so filter chips can wrap */}
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-3">
                <div className="flex min-w-0 flex-shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => setMainTab('residents')}
                    className="font-source-sans-3 border-b-2 border-transparent bg-transparent pb-2 pt-1 transition-colors"
                    style={{
                      fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                      fontWeight: mainTab === 'residents' ? 600 : 500,
                      fontSize: 18,
                      lineHeight: '22px',
                      color:
                        mainTab === 'residents'
                          ? 'hsla(240, 2%, 20%, 1)'
                          : 'hsla(240, 1%, 68%, 1)',
                      borderBottomColor:
                        mainTab === 'residents' ? 'hsla(240, 2%, 20%, 1)' : 'transparent',
                    }}
                  >
                    All Residents
                  </button>
                  <span
                    className="mx-4 h-7 w-px shrink-0 bg-[#323234]"
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => setMainTab('contacts')}
                    className="font-source-sans-3 border-b-2 border-transparent bg-transparent pb-2 pt-1 transition-colors"
                    style={{
                      fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                      fontWeight: mainTab === 'contacts' ? 600 : 500,
                      fontSize: 18,
                      lineHeight: '22px',
                      color:
                        mainTab === 'contacts'
                          ? 'hsla(240, 2%, 20%, 1)'
                          : 'hsla(240, 1%, 68%, 1)',
                      borderBottomColor:
                        mainTab === 'contacts' ? 'hsla(240, 2%, 20%, 1)' : 'transparent',
                    }}
                  >
                    All Resident Contacts
                  </button>
                </div>
                {mainTab === 'residents' && (
                  <div
                    ref={filterPopoverRef}
                    className="relative flex w-full min-w-0 basis-full flex-col items-end gap-2 lg:basis-auto lg:w-auto lg:max-w-none lg:flex-1 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end"
                    style={{ columnGap: 18, rowGap: 8 }}
                  >
                    {(appliedFilterSpecialistIds.size > 0 || appliedFilterStatusKeys.size > 0) && (
                      <div className="flex min-w-0 w-full flex-wrap items-center justify-end gap-2 lg:min-w-0 lg:flex-1">
                        {[...appliedFilterSpecialistIds].map((id) => {
                          const spec = DUMMY_SPECIALISTS.find((s) => s.id === id);
                          if (!spec) return null;
                          return (
                            <span
                              key={`spec-${id}`}
                              className="inline-flex max-w-full items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 font-source-sans-3"
                              style={{
                                backgroundColor: FILTER_CHIP_BG,
                                color: FILTER_CHIP_TEXT,
                              }}
                            >
                              <span
                                className="max-w-[200px] truncate text-sm font-medium"
                                style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                              >
                                {spec.display_name}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeAppliedSpecialistId(id)}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                                style={{ color: FILTER_CHIP_TEXT }}
                                aria-label={`Remove ${spec.display_name} filter`}
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
                        {[...appliedFilterStatusKeys].map((key) => {
                          const meta = MOVE_STATUS_FILTERS.find((m) => m.key === key);
                          const label = meta?.label ?? key;
                          return (
                            <span
                              key={`status-${key}`}
                              className="inline-flex max-w-full items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 font-source-sans-3"
                              style={{
                                backgroundColor: FILTER_CHIP_BG,
                                color: FILTER_CHIP_TEXT,
                              }}
                            >
                              <span
                                className="max-w-[160px] truncate text-sm font-medium"
                                style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                              >
                                {label}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeAppliedStatusKey(key)}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                                style={{ color: FILTER_CHIP_TEXT }}
                                aria-label={`Remove ${label} filter`}
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
                      </div>
                    )}
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-[18px]">
                    <button
                      type="button"
                      onClick={() => (filterPopoverOpen ? setFilterPopoverOpen(false) : openFilterPopover())}
                      className={`rounded-lg p-2 transition-colors hover:bg-gray-100 ${
                        filterPopoverOpen || appliedFilterSpecialistIds.size > 0 || appliedFilterStatusKeys.size > 0
                          ? 'bg-gray-100'
                          : ''
                      }`}
                      style={{
                        color:
                          appliedFilterSpecialistIds.size > 0 || appliedFilterStatusKeys.size > 0
                            ? FILTER_CHIP_TEXT
                            : undefined,
                      }}
                      aria-label="Filter residents"
                      aria-expanded={filterPopoverOpen}
                    >
                      <FilterLinesIcon
                        size={20}
                        className={
                          appliedFilterSpecialistIds.size === 0 && appliedFilterStatusKeys.size === 0
                            ? 'text-gray-600'
                            : ''
                        }
                      />
                    </button>
                    {filterPopoverOpen && (
                      <div
                        className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),320px)] rounded-2xl border border-gray-200 bg-white shadow-xl"
                        style={{ padding: 20 }}
                        role="dialog"
                        aria-label="Filter residents"
                      >
                        <h3
                          className="mb-4 font-source-sans-3"
                          style={{
                            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                            fontWeight: 500,
                            fontSize: 14,
                            lineHeight: '20px',
                            color: '#505051',
                            margin: 0,
                            padding: 0,
                          }}
                        >
                          Filter Residents
                        </h3>
                        <div className="max-h-72 space-y-1 overflow-y-auto">
                          {/* Relocation Specialist */}
                          <div className="border-b border-gray-100 pb-1">
                            <button
                              type="button"
                              onClick={() => setFilterReloSectionOpen((o) => !o)}
                              className="flex w-full items-center gap-2 py-2 text-left font-source-sans-3 transition-opacity hover:opacity-80"
                              style={{
                                fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                                fontWeight: 600,
                                fontSize: 16,
                                lineHeight: '22px',
                                color: '#323234',
                              }}
                            >
                              {filterReloSectionOpen ? (
                                <ChevronUp size={18} className="shrink-0 text-gray-600" aria-hidden />
                              ) : (
                                <ChevronDown size={18} className="shrink-0 text-gray-600" aria-hidden />
                              )}
                              Relocation Specialist
                            </button>
                            {filterReloSectionOpen && (
                              <div className="mt-1 space-y-0.5 pl-1">
                                {DUMMY_SPECIALISTS.map((s) => {
                                  const checked = draftFilterSpecialistIds.has(s.id);
                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => toggleDraftSpecialist(s.id)}
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
                                        className="font-source-sans-3 text-[16px] font-medium leading-5 text-[#323234]"
                                        style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                                      >
                                        {s.display_name}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {/* Move Status */}
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setFilterStatusSectionOpen((o) => !o)}
                              className="flex w-full items-center gap-2 py-2 text-left font-source-sans-3 transition-opacity hover:opacity-80"
                              style={{
                                fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                                fontWeight: 600,
                                fontSize: 16,
                                lineHeight: '22px',
                                color: '#323234',
                              }}
                            >
                              {filterStatusSectionOpen ? (
                                <ChevronUp size={18} className="shrink-0 text-gray-600" aria-hidden />
                              ) : (
                                <ChevronDown size={18} className="shrink-0 text-gray-600" aria-hidden />
                              )}
                              Move Status
                            </button>
                            {filterStatusSectionOpen && (
                              <div className="mt-1 space-y-0.5 pl-1">
                                {MOVE_STATUS_FILTERS.map(({ key, label }) => {
                                  const checked = draftFilterStatusKeys.has(key);
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => toggleDraftStatus(key)}
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
                                        className="font-source-sans-3 text-[16px] font-medium leading-5 text-[#323234]"
                                        style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                                      >
                                        {label}
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
                            onClick={clearAllFiltersInPopover}
                            className="font-source-sans-3 transition-opacity hover:opacity-90"
                            style={{
                              minWidth: 100,
                              height: 40,
                              paddingLeft: 20,
                              paddingRight: 20,
                              borderRadius: 9999,
                              border: '1px solid #83ACB5',
                              backgroundColor: '#EAF1F3',
                              fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                              fontWeight: 500,
                              fontSize: 15,
                              lineHeight: '22px',
                              color: '#307584',
                            }}
                          >
                            Clear All
                          </button>
                          <button
                            type="button"
                            onClick={applyFilters}
                            className="font-source-sans-3 text-white transition-opacity hover:opacity-90"
                            style={{
                              minWidth: 88,
                              height: 40,
                              paddingLeft: 24,
                              paddingRight: 24,
                              borderRadius: 9999,
                              backgroundColor: FILTER_ACCENT,
                              fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                              fontWeight: 500,
                              fontSize: 15,
                              lineHeight: '22px',
                            }}
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                    {!searchExpanded ? (
                      <button
                        type="button"
                        onClick={() => setSearchExpanded(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Open search"
                      >
                        <Search size={20} strokeWidth={1.5} className="text-gray-600" />
                      </button>
                    ) : (
                      <div className="flex items-center relative w-[240px]">
                        <Search size={18} className="absolute left-3 text-gray-500 pointer-events-none flex-shrink-0" />
                        <input
                          type="text"
                          placeholder="Search residents..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                          className="w-full h-9 pl-9 pr-9 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm font-source-sans-3"
                        />
                        <button
                          type="button"
                          onClick={() => setSearchExpanded(false)}
                          className="absolute right-2 p-1 hover:bg-gray-100 rounded"
                          aria-label="Close search"
                        >
                          <X size={16} className="text-gray-500" />
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingResidentId(null);
                        setIsAddResidentModalOpen(true);
                      }}
                      className="flex items-center justify-center transition-opacity hover:opacity-90 font-source-sans-3"
                      style={{
                        width: 200,
                        height: 48,
                        minWidth: 48,
                        opacity: 1,
                        borderRadius: 9999,
                        gap: 8,
                        paddingTop: 10,
                        paddingRight: 24,
                        paddingBottom: 10,
                        paddingLeft: 20,
                        backgroundColor: '#307584',
                        fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                        fontWeight: 500,
                        fontSize: 16,
                        lineHeight: '22px',
                        letterSpacing: '0%',
                        color: '#FFFFFF',
                      }}
                    >
                      <span
                        className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white"
                        aria-hidden
                      >
                        <Plus size={11} strokeWidth={3} style={{ color: '#307584' }} />
                      </span>
                      <span className="whitespace-nowrap">Add Resident</span>
                    </button>
                    </div>
                  </div>
                )}
                {mainTab === 'contacts' && (
                  <div
                    ref={contactsToolbarMountRef}
                    className="relative flex w-full min-w-0 basis-full flex-wrap items-center justify-end lg:w-auto lg:basis-auto"
                    style={{ gap: 18 }}
                  />
                )}
              </div>

              {mainTab === 'contacts' ? (
                <ResidentContactsTab
                  toolbarMountRef={contactsToolbarMountRef}
                  residentRows={demoRecords.map((r) => ({
                    id: r.id,
                    first_name: r.first_name,
                    last_name: r.last_name,
                    community_name: r.community_name,
                  }))}
                  navigate={navigate}
                />
              ) : (
              <div className="flex min-h-0 flex-1 flex-col">
              <>
              {/* Desktop Table View – headers and body use same fixed column widths for alignment */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '17%' }} />
                    <col style={{ width: '17%' }} />
                    <col style={{ width: '17%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '16%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left align-middle xl:px-6">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-1 hover:opacity-80 transition-opacity font-source-sans-3"
                          style={{
                            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                            fontWeight: 500,
                            fontSize: 14,
                            lineHeight: '20px',
                            letterSpacing: '0%',
                            color: '#323234',
                          }}
                        >
                          Name
                          {sortField === 'name' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
                            ) : (
                              <ArrowDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
                            )
                          ) : (
                            <ArrowUpDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left align-middle xl:px-6">
                        <button
                          onClick={() => handleSort('community')}
                          className="flex items-center gap-1 hover:opacity-80 transition-opacity font-source-sans-3"
                          style={{
                            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                            fontWeight: 500,
                            fontSize: 14,
                            lineHeight: '20px',
                            letterSpacing: '0%',
                            color: '#323234',
                          }}
                        >
                          Community
                          {sortField === 'community' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
                            ) : (
                              <ArrowDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
                            )
                          ) : (
                            <ArrowUpDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th
                        className="min-w-0 px-2 py-3 text-left align-middle font-source-sans-3 whitespace-nowrap xl:px-6"
                        style={{
                          fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                          fontWeight: 500,
                          fontSize: 14,
                          lineHeight: '20px',
                          letterSpacing: '0%',
                          color: '#323234',
                        }}
                      >
                        <span className="xl:hidden">Relo</span>
                        <span className="hidden xl:inline">Relo Specialist</span>
                      </th>
                      <th
                        className="px-6 py-3 text-left align-middle font-source-sans-3"
                        style={{
                          fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                          fontWeight: 500,
                          fontSize: 14,
                          lineHeight: '20px',
                          letterSpacing: '0%',
                          color: '#323234',
                        }}
                      >
                        Zip Code
                      </th>
                      <th
                        className="px-6 py-3 text-left align-middle font-source-sans-3"
                        style={{
                          fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                          fontWeight: 500,
                          fontSize: 14,
                          lineHeight: '20px',
                          letterSpacing: '0%',
                          color: '#323234',
                        }}
                      >
                        Move-In
                      </th>
                      <th
                        className="px-6 py-3 text-right align-middle font-source-sans-3"
                        style={{
                          fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                          fontWeight: 500,
                          fontSize: 14,
                          lineHeight: '20px',
                          letterSpacing: '0%',
                          color: '#323234',
                        }}
                      >
                        Status
                      </th>
                      <th
                        className="px-6 py-3 text-right align-middle font-source-sans-3"
                        style={{
                          fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                          fontWeight: 500,
                          fontSize: 14,
                          lineHeight: '20px',
                          letterSpacing: '0%',
                          color: '#323234',
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                </table>
                <div className="overflow-x-auto overflow-hidden rounded-xl" style={{ border: '1px solid #ACACAD', borderRadius: 12 }}>
                  <table className="w-full" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '17%' }} />
                      <col style={{ width: '17%' }} />
                      <col style={{ width: '17%' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '11%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '16%' }} />
                    </colgroup>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {filteredResidents.map((resident) => (
                      <tr 
                        key={resident.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/residents/${toResidentSlug(resident.first_name, resident.last_name) || resident.id}`)}
                      >
                        <td className="min-w-0 max-w-0 px-4 py-4 align-middle xl:px-6">
                          <div className="flex min-w-0 items-center gap-2 xl:gap-3">
                            <div
                              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-inter font-semibold text-white"
                              style={{
                                backgroundColor: '#307584',
                                borderRadius: 100,
                                border: '1.5px solid var(--color-Backgrounds-colorBgContainer, #FFFFFF)',
                              }}
                            >
                              <span className="text-[10px] leading-none">{resident.residentInitials}</span>
                            </div>
                            <button
                              type="button"
                              title={resident.name}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/residents/${toResidentSlug(resident.first_name, resident.last_name) || resident.id}`);
                              }}
                              className="min-w-0 truncate text-left font-source-sans-3 transition-opacity hover:opacity-80"
                              style={{
                                fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                                fontWeight: 500,
                                fontSize: 18,
                                lineHeight: '20px',
                                letterSpacing: '0%',
                                color: '#323234',
                              }}
                            >
                              {resident.name}
                            </button>
                          </div>
                        </td>
                        <td
                          className="min-w-0 max-w-0 px-4 py-4 align-middle font-source-sans-3 xl:px-6"
                          title={resident.community}
                          style={{
                            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                            fontWeight: 500,
                            fontSize: 18,
                            lineHeight: '20px',
                            letterSpacing: '0%',
                            color: '#323234',
                          }}
                        >
                          <span className="block truncate">{resident.community}</span>
                        </td>
                        <td className="min-w-0 px-2 py-4 align-middle xl:px-6" style={{ minWidth: 0 }}>
                          <div
                            className="flex min-w-0 items-center justify-center gap-1.5 lg:justify-start lg:gap-2"
                            title={resident.reloSpecialist !== '—' ? resident.reloSpecialist : undefined}
                          >
                            {resident.reloSpecialist !== '—' && (
                              <div
                                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-inter font-semibold text-white"
                                style={{
                                  backgroundColor: '#307584',
                                  borderRadius: 100,
                                  border: '1.5px solid var(--color-Backgrounds-colorBgContainer, #FFFFFF)',
                                }}
                              >
                                <span className="text-[10px] leading-none">
                                  {specialistInitials(resident.reloSpecialist)}
                                </span>
                              </div>
                            )}
                            <span
                              className="hidden min-w-0 truncate font-source-sans-3 lg:inline-block lg:max-w-full"
                              style={{
                                fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                                fontWeight: 500,
                                fontSize: 18,
                                lineHeight: '20px',
                                letterSpacing: '0%',
                                color: '#323234',
                              }}
                            >
                              {resident.reloSpecialist}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap align-middle font-source-sans-3"
                          style={{
                            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                            fontWeight: 500,
                            fontSize: 18,
                            lineHeight: '20px',
                            letterSpacing: '0%',
                            color: '#323234',
                          }}
                        >
                          {resident.zipCode}
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap align-middle font-source-sans-3"
                          style={{
                            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                            fontWeight: 500,
                            fontSize: 18,
                            lineHeight: '20px',
                            letterSpacing: '0%',
                            color: '#323234',
                          }}
                        >
                          {resident.moveInDisplay}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right align-middle">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              className="flex items-center justify-center gap-1 font-source-sans-3"
                              style={statusChipStyle(resident.status)}
                            >
                              <span>{toSentenceCase(resident.status)}</span>
                              <ArrowDown size={14} strokeWidth={2} className="flex-shrink-0 text-white" style={{ color: '#FFFFFF' }} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-middle">
                          <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingResidentId(resident.id);
                                setIsAddResidentModalOpen(true);
                              }}
                              aria-label="Edit resident"
                            >
                              <Pencil size={18} strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-600"
                              aria-label="View resident details"
                              onClick={() =>
                                navigate(
                                  `/residents/${toResidentSlug(resident.first_name, resident.last_name) || resident.id}`,
                                )
                              }
                            >
                              <ChevronRight size={18} strokeWidth={2} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tablet List View */}
              <div className="hidden md:block lg:hidden">
                <div className="divide-y divide-gray-200">
                  {filteredResidents.map((resident) => (
                    <div
                      key={resident.id}
                      onClick={() => {
                        setSelectedRow(resident.id);
                        navigate(`/residents/${toResidentSlug(resident.first_name, resident.last_name) || resident.id}`);
                      }}
                      className={`px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                        selectedRow === resident.id ? 'border-l-4 border-purple-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 font-inter"
                          style={{
                            width: 24,
                            height: 24,
                            backgroundColor: '#307584',
                            borderRadius: 100,
                            border: '1.5px solid var(--color-Backgrounds-colorBgContainer, #FFFFFF)',
                          }}
                        >
                          <span className="text-[10px] leading-none">{resident.residentInitials}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/residents/${toResidentSlug(resident.first_name, resident.last_name) || resident.id}`);
                          }}
                          className="font-source-sans-3 text-left hover:opacity-80 transition-opacity"
                          style={{
                            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                            fontWeight: 500,
                            fontSize: 18,
                            lineHeight: '20px',
                            letterSpacing: '0%',
                            color: '#323234',
                          }}
                        >
                          {resident.name}
                        </button>
                      </div>
                      <ArrowRight size={20} strokeWidth={1.5} className="text-gray-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Scrollable Table View – headers outside border, border only around body */}
              <div className="md:hidden">
                <div className="-mx-4 overflow-x-auto px-4">
                  <table className="w-full min-w-[560px]">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center gap-1 hover:opacity-80 transition-opacity font-source-sans-3"
                            style={{
                              fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                              fontWeight: 500,
                              fontSize: 14,
                              lineHeight: '20px',
                              letterSpacing: '0%',
                              color: '#323234',
                            }}
                          >
                            Name
                            {sortField === 'name' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
                              ) : (
                                <ArrowDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
                              )
                            ) : (
                              <ArrowUpDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-400" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort('community')}
                            className="flex items-center gap-1 hover:opacity-80 transition-opacity font-source-sans-3"
                            style={{
                              fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                              fontWeight: 500,
                              fontSize: 14,
                              lineHeight: '20px',
                              letterSpacing: '0%',
                              color: '#323234',
                            }}
                          >
                            Community
                            {sortField === 'community' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
                              ) : (
                                <ArrowDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
                              )
                            ) : (
                              <ArrowUpDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-400" />
                            )}
                          </button>
                        </th>
                        <th
                          className="px-3 py-3 text-left font-source-sans-3"
                          style={{
                            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                            fontWeight: 500,
                            fontSize: 14,
                            lineHeight: '20px',
                            letterSpacing: '0%',
                            color: '#323234',
                          }}
                        >
                          Relo
                        </th>
                        <th
                          className="px-4 py-3 text-left font-source-sans-3"
                          style={{
                            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                            fontWeight: 500,
                            fontSize: 14,
                            lineHeight: '20px',
                            letterSpacing: '0%',
                            color: '#323234',
                          }}
                        >
                          Zip Code
                        </th>
                        <th
                          className="px-4 py-3 text-left font-source-sans-3"
                          style={{
                            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                            fontWeight: 500,
                            fontSize: 14,
                            lineHeight: '20px',
                            letterSpacing: '0%',
                            color: '#323234',
                          }}
                        >
                          Move-In
                        </th>
                        <th
                          className="px-4 py-3 text-right font-source-sans-3"
                          style={{
                            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                            fontWeight: 500,
                            fontSize: 14,
                            lineHeight: '20px',
                            letterSpacing: '0%',
                            color: '#323234',
                          }}
                        >
                          Status
                        </th>
                        <th
                          className="px-4 py-3 text-right font-source-sans-3"
                          style={{
                            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                            fontWeight: 500,
                            fontSize: 14,
                            lineHeight: '20px',
                            letterSpacing: '0%',
                            color: '#323234',
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                  </table>
                  <div
                    className="-mx-4 overflow-x-auto overflow-hidden rounded-xl px-4"
                    style={{ border: '1px solid #ACACAD', borderRadius: 12 }}
                  >
                    <table className="w-full min-w-[560px]">
                      <tbody className="bg-white divide-y divide-gray-200">
                      {filteredResidents.map((resident) => (
                        <tr key={resident.id} className="hover:bg-gray-50">
                          <td className="max-w-0 min-w-0 px-3 py-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <div
                                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-inter font-semibold text-white"
                                style={{
                                  backgroundColor: '#307584',
                                  borderRadius: 100,
                                  border: '1.5px solid var(--color-Backgrounds-colorBgContainer, #FFFFFF)',
                                }}
                              >
                                <span className="text-[10px] leading-none">{resident.residentInitials}</span>
                              </div>
                              <button
                                type="button"
                                title={resident.name}
                                onClick={() =>
                                  navigate(`/residents/${toResidentSlug(resident.first_name, resident.last_name) || resident.id}`)
                                }
                                className="min-w-0 truncate text-left font-source-sans-3 transition-opacity hover:opacity-80"
                                style={{
                                  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                                  fontWeight: 500,
                                  fontSize: 18,
                                  lineHeight: '20px',
                                  letterSpacing: '0%',
                                  color: '#323234',
                                }}
                              >
                                {resident.name}
                              </button>
                            </div>
                          </td>
                          <td
                            className="max-w-0 min-w-0 px-3 py-3 font-source-sans-3"
                            title={resident.community}
                            style={{
                              fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                              fontWeight: 500,
                              fontSize: 18,
                              lineHeight: '20px',
                              letterSpacing: '0%',
                              color: '#323234',
                            }}
                          >
                            <span className="block truncate">{resident.community}</span>
                          </td>
                          <td className="min-w-0 px-2 py-3 align-middle" style={{ minWidth: 0 }}>
                            <div
                              className="flex min-w-0 items-center justify-center"
                              title={resident.reloSpecialist !== '—' ? resident.reloSpecialist : undefined}
                            >
                              {resident.reloSpecialist !== '—' ? (
                                <div
                                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-inter font-semibold text-white"
                                  style={{
                                    backgroundColor: '#307584',
                                    borderRadius: 100,
                                    border: '1.5px solid var(--color-Backgrounds-colorBgContainer, #FFFFFF)',
                                  }}
                                >
                                  <span className="text-[10px] leading-none">
                                    {specialistInitials(resident.reloSpecialist)}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-source-sans-3 text-gray-400">—</span>
                              )}
                            </div>
                          </td>
                          <td
                            className="px-4 py-3 whitespace-nowrap font-source-sans-3"
                            style={{
                              fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                              fontWeight: 500,
                              fontSize: 18,
                              lineHeight: '20px',
                              letterSpacing: '0%',
                              color: '#323234',
                            }}
                          >
                            {resident.zipCode}
                          </td>
                          <td
                            className="px-4 py-3 whitespace-nowrap font-source-sans-3"
                            style={{
                              fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                              fontWeight: 500,
                              fontSize: 18,
                              lineHeight: '20px',
                              letterSpacing: '0%',
                              color: '#323234',
                            }}
                          >
                            {resident.moveInDisplay}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                className="flex items-center justify-center gap-1 font-source-sans-3"
                                style={statusChipStyle(resident.status)}
                              >
                                <span>{toSentenceCase(resident.status)}</span>
                                <ArrowDown size={14} strokeWidth={2} className="flex-shrink-0" style={{ color: '#FFFFFF' }} />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingResidentId(resident.id);
                                  setIsAddResidentModalOpen(true);
                                }}
                                aria-label="Edit resident"
                              >
                                <Pencil size={16} strokeWidth={1.5} />
                              </button>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="View resident details"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/residents/${toResidentSlug(resident.first_name, resident.last_name) || resident.id}`,
                                  );
                                }}
                              >
                                <ChevronRight size={16} strokeWidth={2} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              </>
              <div className="mt-auto shrink-0 px-4 md:px-6 py-4">
                <Pagination hasPrevious={false} hasNext={true} />
              </div>
              </div>
              )}
            </div>
          </div>

      {/* Add Resident – sliding panel with dimmed backdrop */}
      {isAddResidentModalOpen && (
        <>
          {/* Dimmed backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            style={{ opacity: addResidentPanelEntered ? 1 : 0 }}
            onClick={closeAddResidentPanel}
            aria-hidden="true"
          />
          {/* Sliding panel from the right */}
          <div
            className={`fixed right-0 top-0 bottom-0 h-full w-full max-w-2xl lg:max-w-3xl bg-white shadow-2xl z-50 overflow-y-auto transition-transform duration-300 ease-out ${
              addResidentPanelEntered ? 'translate-x-0' : 'translate-x-full'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-resident-title"
          >
            {/* Panel Header (no divider under header) */}
            <div className="flex items-center justify-between p-4 md:p-6 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3 md:gap-4">
                <button
                  type="button"
                  onClick={closeAddResidentPanel}
                  className="p-1 hover:bg-gray-100 rounded"
                  aria-label="Close"
                >
                  <X size={20} className="text-gray-600" />
                </button>
                <h2
                  id="add-resident-title"
                  className="font-source-sans-3"
                  style={{
                    fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                    fontWeight: 600,
                    fontSize: 24,
                    lineHeight: '28px',
                    letterSpacing: '0%',
                    color: '#323234',
                  }}
                >
                  {editingResidentId ? 'Edit Resident' : 'Add Resident'}
                </h2>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeAddResidentPanel}
                  className="flex items-center justify-center font-source-sans-3 transition-opacity hover:opacity-90"
                  style={{
                    width: 94,
                    height: 48,
                    minWidth: 48,
                    opacity: 1,
                    borderRadius: 9999,
                    border: '1px solid #83ACB5',
                    gap: 8,
                    paddingTop: 10,
                    paddingRight: 24,
                    paddingBottom: 10,
                    paddingLeft: 24,
                    backgroundColor: '#EAF1F3',
                    fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                    fontWeight: 500,
                    fontSize: 16,
                    lineHeight: '22px',
                    letterSpacing: '0%',
                    color: '#307584',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveResident}
                  disabled={submitting}
                  className="flex items-center justify-center font-source-sans-3 transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{
                    width: 81,
                    height: 48,
                    minWidth: 48,
                    opacity: 1,
                    borderRadius: 9999,
                    gap: 8,
                    paddingTop: 10,
                    paddingRight: 24,
                    paddingBottom: 10,
                    paddingLeft: 24,
                    backgroundColor: '#307584',
                    fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                    fontWeight: 500,
                    fontSize: 16,
                    lineHeight: '22px',
                    letterSpacing: '0%',
                    color: '#FFFFFF',
                  }}
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {submitError && (
                <div className="text-red-600 font-source-sans-3 text-sm" role="alert">
                  {submitError}
                </div>
              )}
              {/* Assigned Relocation Specialist */}
              <div>
                <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                  Relocation Specialist
                </label>
                <SearchableFormSelect
                  value={residentForm.relocationSpecialist}
                  onChange={(v) => setResidentForm({ ...residentForm, relocationSpecialist: v })}
                  options={relocationSpecialistSearchOptions}
                  placeholder="Select Relocation Specialist"
                  disabled={submitting}
                  emptyMessage="No specialists match."
                  style={{ ...formInputStyle, ...formSelectOverrides }}
                  inputClassName="placeholder:text-lg"
                />
              </div>

              {/* Resident Information */}
              <div>
                <h3 className="mb-3 md:mb-4 font-source-sans-3" style={formSectionHeaderStyle}>Resident Information</h3>
                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Input First Name"
                      value={residentForm.firstName}
                      onChange={(e) => setResidentForm({ ...residentForm, firstName: e.target.value })}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:font-medium placeholder:text-lg placeholder:leading-5"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Input Last Name"
                      value={residentForm.lastName}
                      onChange={(e) => setResidentForm({ ...residentForm, lastName: e.target.value })}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:font-medium placeholder:text-lg placeholder:leading-5"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="Input Street Address"
                      value={residentForm.address}
                      onChange={(e) => setResidentForm({ ...residentForm, address: e.target.value })}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:font-medium placeholder:text-lg placeholder:leading-5"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      Address 2 (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Input Address Line 2"
                      value={residentForm.address2}
                      onChange={(e) => setResidentForm({ ...residentForm, address2: e.target.value })}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:font-medium placeholder:text-lg placeholder:leading-5"
                      style={formInputStyle}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="Input City"
                      value={residentForm.city}
                      onChange={(e) => setResidentForm({ ...residentForm, city: e.target.value })}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:font-medium placeholder:text-lg placeholder:leading-5"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      State
                    </label>
                    <StateSearchSelect
                      value={residentForm.state}
                      onChange={(next) => setResidentForm({ ...residentForm, state: next })}
                      placeholder="Select State"
                      className="w-full pr-10 font-source-sans-3 placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      style={{ ...formSelectStyle, color: residentForm.state ? '#323234' : '#ACACAD' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      Zip Code
                    </label>
                    <input
                      type="text"
                      placeholder="Input Zip Code"
                      value={residentForm.zipCode}
                      onChange={(e) => setResidentForm({ ...residentForm, zipCode: e.target.value })}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:font-medium placeholder:text-lg placeholder:leading-5"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="Input Email"
                      value={residentForm.email}
                      onChange={(e) => setResidentForm({ ...residentForm, email: e.target.value })}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:font-medium placeholder:text-lg placeholder:leading-5"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="Input Phone"
                      value={residentForm.phone}
                      onChange={(e) => setResidentForm({ ...residentForm, phone: e.target.value })}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:font-medium placeholder:text-lg placeholder:leading-5"
                      style={formInputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Primary Resident Contact Information */}
              <div>
                <h3 className="mb-3 md:mb-4 font-source-sans-3" style={formSectionHeaderStyle}>Primary Resident Contact Information</h3>
                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Input First Name"
                      value={residentForm.primaryContactFirstName}
                      onChange={(e) => setResidentForm({ ...residentForm, primaryContactFirstName: e.target.value })}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:font-medium placeholder:text-lg placeholder:leading-5"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Input Last Name"
                      value={residentForm.primaryContactLastName}
                      onChange={(e) => setResidentForm({ ...residentForm, primaryContactLastName: e.target.value })}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:font-medium placeholder:text-lg placeholder:leading-5"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="Input Email"
                      value={residentForm.primaryContactEmail}
                      onChange={(e) => setResidentForm({ ...residentForm, primaryContactEmail: e.target.value })}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:font-medium placeholder:text-lg placeholder:leading-5"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="Input Phone"
                      value={residentForm.primaryContactPhone}
                      onChange={(e) => setResidentForm({ ...residentForm, primaryContactPhone: e.target.value })}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:font-medium placeholder:text-lg placeholder:leading-5"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      Relationship
                    </label>
                    <SearchableFormSelect
                      value={residentForm.primaryContactRelationship}
                      onChange={(v) =>
                        setResidentForm({ ...residentForm, primaryContactRelationship: v })
                      }
                      options={ADD_RESIDENT_RELATIONSHIP_OPTIONS}
                      placeholder="Select Relationship"
                      disabled={submitting}
                      emptyMessage="No relationships match."
                      style={{ ...formInputStyle, ...formSelectOverrides }}
                      inputClassName="placeholder:text-lg"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      Notes
                    </label>
                    <textarea
                      placeholder="Kenra handles most of the things..."
                      value={residentForm.primaryContactNotes}
                      onChange={(e) => setResidentForm({ ...residentForm, primaryContactNotes: e.target.value })}
                      rows={3}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:font-medium placeholder:text-lg placeholder:leading-5 resize-y"
                      style={{ ...formInputStyle, height: 'auto', minHeight: 48 }}
                    />
                  </div>
                </div>
              </div>

              {/* Community Information */}
              <div>
                <h3 className="mb-3 md:mb-4 font-source-sans-3" style={formSectionHeaderStyle}>Community Information</h3>
                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                  <div>
                    <label className="block mb-2 font-source-sans-3" style={formLabelStyle}>
                      Community
                    </label>
                    <SearchableFormSelect
                      value={residentForm.community}
                      onChange={(v) => setResidentForm({ ...residentForm, community: v })}
                      options={communitySearchOptions}
                      placeholder="Select Community"
                      disabled={submitting}
                      emptyMessage="No communities match."
                      style={{ ...formInputStyle, ...formSelectOverrides }}
                      inputClassName="placeholder:text-lg"
                    />
                  </div>
                  <div>
                    <ThemeDateTimePicker
                      id="resident-move-in-date"
                      label="Move in Date (mm/dd/yyyy)"
                      dateOnly
                      value={
                        (() => {
                          const d = toInputDate(residentForm.moveInDate);
                          return d ? `${d}T00:00` : '';
                        })()
                      }
                      onChange={(v) =>
                        setResidentForm({
                          ...residentForm,
                          moveInDate: v.trim() ? v.split('T')[0] : '',
                        })
                      }
                      emptyLabel="mm/dd/yyyy"
                      allowClear
                    />
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div>
                <h3 className="mb-3 md:mb-4 font-source-sans-3" style={formSectionHeaderStyle}>Important Notes</h3>
                <textarea
                  placeholder="Input important resident notes here"
                  value={residentForm.importantNotes}
                  onChange={(e) => setResidentForm({ ...residentForm, importantNotes: e.target.value })}
                  rows={5}
                  className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:font-medium placeholder:text-base placeholder:leading-5 resize-y"
                  style={{ ...formInputStyle, height: 'auto', minHeight: 120 }}
                />
              </div>

              {/* Mobile Footer Buttons */}
              <div className="md:hidden flex items-center justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-4">
                <button
                  type="button"
                  onClick={closeAddResidentPanel}
                  className="flex items-center justify-center font-source-sans-3 transition-opacity hover:opacity-90"
                  style={{
                    width: 94,
                    height: 48,
                    minWidth: 48,
                    opacity: 1,
                    borderRadius: 9999,
                    border: '1px solid #83ACB5',
                    gap: 8,
                    paddingTop: 10,
                    paddingRight: 24,
                    paddingBottom: 10,
                    paddingLeft: 24,
                    backgroundColor: '#EAF1F3',
                    fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                    fontWeight: 500,
                    fontSize: 16,
                    lineHeight: '22px',
                    letterSpacing: '0%',
                    color: '#307584',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveResident}
                  disabled={submitting}
                  className="flex items-center justify-center font-source-sans-3 transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{
                    width: 81,
                    height: 48,
                    minWidth: 48,
                    opacity: 1,
                    borderRadius: 9999,
                    gap: 8,
                    paddingTop: 10,
                    paddingRight: 24,
                    paddingBottom: 10,
                    paddingLeft: 24,
                    backgroundColor: '#307584',
                    fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                    fontWeight: 500,
                    fontSize: 16,
                    lineHeight: '22px',
                    letterSpacing: '0%',
                    color: '#FFFFFF',
                  }}
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {residentSaveToast && (
        <BottomToast
          message={residentSaveToast.message}
          variant={residentSaveToast.variant}
          onDismiss={() => setResidentSaveToast(null)}
        />
      )}
    </div>
  );
}
