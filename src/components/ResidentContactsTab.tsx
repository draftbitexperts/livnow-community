import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback,
  type CSSProperties,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import type { NavigateFunction } from 'react-router-dom';
import {
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from 'lucide-react';
import { formSelectOverrides } from '@/lib/formStyles';
import Pagination from '@/components/Pagination';
import { BottomToast } from '@/components/BottomToast';
import { SearchableFormSelect, type SearchableFormSelectOption } from '@/components/SearchableFormSelect';
import { toResidentSlug } from '@/lib/demoResidents';

/** Filter icon — same as All Residents */
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

function contactInitials(first: string, last: string): string {
  const f = first.trim();
  const l = last.trim();
  if (f && l) return (f[0] + l[0]).toUpperCase();
  if (f) return f.slice(0, 2).toUpperCase();
  if (l) return l.slice(0, 2).toUpperCase();
  return '—';
}

export type ContactResidentPickerRow = {
  id: string;
  first_name: string;
  last_name: string;
  community_name: string;
};

type ContactLevel = 'primary' | 'secondary' | 'other';

export type DemoContactRecord = {
  id: string;
  resident_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  relationship: string;
  role_key: string;
  role_label: string;
  contact_level: ContactLevel;
  notes: string | null;
};

const FILTER_ACCENT = 'hsla(187, 47%, 35%, 1)';
const FILTER_CHIP_BG = 'hsla(168, 38%, 91%, 1)';
const FILTER_CHIP_TEXT = 'hsla(191, 47%, 32%, 1)';

/** Contact role — only Family & Trustee (form + table + filters). */
const CONTACT_ROLE_OPTIONS = [
  { key: 'family', label: 'Family' },
  { key: 'trustee', label: 'Trustee' },
] as const;

const CONTACT_ROLE_FILTERS = CONTACT_ROLE_OPTIONS;
const TABLE_ROLE_OPTIONS = CONTACT_ROLE_OPTIONS;

const CONTACT_RELATIONSHIP_OPTIONS: SearchableFormSelectOption[] = [
  { value: 'Son', label: 'Son' },
  { value: 'Daughter', label: 'Daughter' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Other', label: 'Other' },
];

type SortField = 'contactName' | 'resident' | 'community' | null;
type SortDir = 'asc' | 'desc' | null;

type ContactFormFieldKey =
  | 'residentId'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'relationship'
  | 'roleKey';

function isValidEmailSimple(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function RequiredMark() {
  return (
    <span className="text-red-500" aria-hidden>
      {' '}
      *
    </span>
  );
}

function buildInitialContacts(): DemoContactRecord[] {
  return [
    {
      id: 'dc-1',
      resident_id: 'demo-r-1',
      first_name: 'Susie',
      last_name: 'Smiles',
      email: 'susie@example.com',
      phone: '555-1001',
      relationship: 'Daughter',
      role_key: 'family',
      role_label: 'Family',
      contact_level: 'primary',
      notes: null,
    },
    {
      id: 'dc-2',
      resident_id: 'demo-r-2',
      first_name: 'Linda',
      last_name: 'Chen',
      email: 'linda@example.com',
      phone: '555-0202',
      relationship: 'Spouse',
      role_key: 'family',
      role_label: 'Family',
      contact_level: 'primary',
      notes: null,
    },
    {
      id: 'dc-3',
      resident_id: 'demo-r-4',
      first_name: 'Emma',
      last_name: 'Wilson',
      email: null,
      phone: '555-0404',
      relationship: 'Daughter',
      role_key: 'family',
      role_label: 'Family',
      contact_level: 'primary',
      notes: 'Primary point of contact.',
    },
    {
      id: 'dc-4',
      resident_id: 'demo-r-3',
      first_name: 'Marcus',
      last_name: 'Nguyen',
      email: 'marcus@example.com',
      phone: null,
      relationship: 'Son',
      role_key: 'trustee',
      role_label: 'Trustee',
      contact_level: 'secondary',
      notes: null,
    },
  ];
}

function recordMatchesContactFilters(
  c: DemoContactRecord,
  residentIds: Set<string>,
  roleKeys: Set<string>,
): boolean {
  if (residentIds.size > 0 && !residentIds.has(c.resident_id)) return false;
  if (roleKeys.size > 0 && !roleKeys.has(c.role_key)) return false;
  return true;
}

const formSectionHeaderStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: 20,
  lineHeight: '24px',
  color: '#000000',
};

const formLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: 18,
  lineHeight: '20px',
  color: '#323234',
};

const formInputStyle: CSSProperties = {
  width: '100%',
  maxWidth: 335,
  height: 48,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  padding: 16,
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: 18,
  lineHeight: '20px',
  color: '#323234',
};

const formSelectStyle: CSSProperties = {
  ...formInputStyle,
  ...formSelectOverrides,
};

const pillBtnBase: CSSProperties = {
  minWidth: 88,
  height: 24,
  borderRadius: 4,
  gap: 4,
  paddingTop: 4,
  paddingRight: 8,
  paddingBottom: 4,
  paddingLeft: 8,
  backgroundColor: '#307584',
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: 14,
  lineHeight: '20px',
  color: '#FFFFFF',
};

type Props = {
  residentRows: ContactResidentPickerRow[];
  navigate: NavigateFunction;
  /** Renders filter / search / Add Contact in the parent row next to tabs (same as All Residents). */
  toolbarMountRef?: RefObject<HTMLDivElement | null>;
};

export default function ResidentContactsTab({ residentRows, navigate, toolbarMountRef }: Props) {
  const [contacts, setContacts] = useState<DemoContactRecord[]>(() => buildInitialContacts());
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [sectionResidentOpen, setSectionResidentOpen] = useState(true);
  const [sectionRoleOpen, setSectionRoleOpen] = useState(true);
  const [draftResidentIds, setDraftResidentIds] = useState<Set<string>>(() => new Set());
  const [draftRoleKeys, setDraftRoleKeys] = useState<Set<string>>(() => new Set());
  const [appliedResidentIds, setAppliedResidentIds] = useState<Set<string>>(() => new Set());
  const [appliedRoleKeys, setAppliedRoleKeys] = useState<Set<string>>(() => new Set());
  const filterRef = useRef<HTMLDivElement>(null);

  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDir>(null);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ContactFormFieldKey, string>>>({});

  const clearFieldError = (key: ContactFormFieldKey) => {
    setFieldErrors((prev) => {
      if (prev[key] == null) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const [form, setForm] = useState({
    residentId: '',
    contactLevel: 'primary' as ContactLevel,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relationship: '',
    roleKey: 'family',
    notes: '',
  });

  const residentById = useMemo(() => new Map(residentRows.map((r) => [r.id, r])), [residentRows]);

  const residentDisplayName = useCallback(
    (id: string) => {
      const r = residentById.get(id);
      if (!r) return '—';
      return [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || '—';
    },
    [residentById],
  );

  const residentPickerOptions = useMemo(
    () =>
      residentRows.map((r) => ({
        value: r.id,
        label: [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || r.id,
      })),
    [residentRows],
  );

  useEffect(() => {
    if (panelOpen) {
      const f = requestAnimationFrame(() => setPanelEntered(true));
      return () => cancelAnimationFrame(f);
    }
    setPanelEntered(false);
  }, [panelOpen]);

  const [toolbarPortalTarget, setToolbarPortalTarget] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!toolbarMountRef) {
      setToolbarPortalTarget(null);
      return;
    }
    setToolbarPortalTarget(toolbarMountRef.current);
    return () => setToolbarPortalTarget(null);
  }, [toolbarMountRef]);

  useEffect(() => {
    if (!filterPopoverOpen) return;
    const onDown = (e: PointerEvent) => {
      if (filterRef.current?.contains(e.target as Node)) return;
      setFilterPopoverOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [filterPopoverOpen]);

  const openFilter = () => {
    setDraftResidentIds(new Set(appliedResidentIds));
    setDraftRoleKeys(new Set(appliedRoleKeys));
    setFilterPopoverOpen(true);
  };

  const applyFilters = () => {
    setAppliedResidentIds(new Set(draftResidentIds));
    setAppliedRoleKeys(new Set(draftRoleKeys));
    setFilterPopoverOpen(false);
  };

  const clearFilterDraft = () => {
    setDraftResidentIds(new Set());
    setDraftRoleKeys(new Set());
  };

  const toggleDraftResident = (id: string) => {
    setDraftResidentIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleDraftRole = (key: string) => {
    setDraftRoleKeys((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };

  const removeAppliedResident = (id: string) => {
    setAppliedResidentIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const removeAppliedRole = (key: string) => {
    setAppliedRoleKeys((prev) => {
      const n = new Set(prev);
      n.delete(key);
      return n;
    });
  };

  const handleSort = (field: Exclude<SortField, null>) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let rows = contacts.filter((c) => recordMatchesContactFilters(c, appliedResidentIds, appliedRoleKeys));
    if (q) {
      rows = rows.filter((c) => {
        const contactName = `${c.first_name} ${c.last_name}`.toLowerCase();
        const resName = residentDisplayName(c.resident_id).toLowerCase();
        const comm = residentById.get(c.resident_id)?.community_name?.toLowerCase() ?? '';
        return contactName.includes(q) || resName.includes(q) || comm.includes(q) || c.relationship.toLowerCase().includes(q);
      });
    }
    return [...rows].sort((a, b) => {
      if (!sortField) return 0;
      let aVal = '';
      let bVal = '';
      if (sortField === 'contactName') {
        aVal = `${a.first_name} ${a.last_name}`;
        bVal = `${b.first_name} ${b.last_name}`;
      } else if (sortField === 'resident') {
        aVal = residentDisplayName(a.resident_id);
        bVal = residentDisplayName(b.resident_id);
      } else {
        aVal = residentById.get(a.resident_id)?.community_name ?? '';
        bVal = residentById.get(b.resident_id)?.community_name ?? '';
      }
      if (sortDirection === 'asc') return aVal.localeCompare(bVal);
      return bVal.localeCompare(aVal);
    });
  }, [
    contacts,
    searchQuery,
    sortField,
    sortDirection,
    appliedResidentIds,
    appliedRoleKeys,
    residentById,
    residentDisplayName,
  ]);

  const openAddPanel = () => {
    setEditingId(null);
    setFieldErrors({});
    setForm({
      residentId: '',
      contactLevel: 'primary',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      relationship: '',
      roleKey: 'family',
      notes: '',
    });
    setPanelOpen(true);
  };

  const openEditPanel = (c: DemoContactRecord) => {
    setEditingId(c.id);
    setFieldErrors({});
    setForm({
      residentId: c.resident_id,
      contactLevel: c.contact_level,
      firstName: c.first_name,
      lastName: c.last_name,
      email: c.email ?? '',
      phone: c.phone ?? '',
      relationship: c.relationship,
      roleKey: c.role_key,
      notes: c.notes ?? '',
    });
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelEntered(false);
    setTimeout(() => {
      setPanelOpen(false);
      setEditingId(null);
    }, 300);
  };

  const saveContact = () => {
    const nextErrors: Partial<Record<ContactFormFieldKey, string>> = {};
    const rid = form.residentId.trim();
    const fn = form.firstName.trim();
    const ln = form.lastName.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const rel = form.relationship.trim();

    if (!rid) nextErrors.residentId = 'Please select a resident.';
    if (!fn) nextErrors.firstName = 'First name is required.';
    if (!ln) nextErrors.lastName = 'Last name is required.';
    if (!email) nextErrors.email = 'Email is required.';
    else if (!isValidEmailSimple(email)) nextErrors.email = 'Enter a valid email address.';
    if (!phone) nextErrors.phone = 'Phone is required.';
    if (!rel) nextErrors.relationship = 'Please select a relationship.';
    if (!form.roleKey.trim() || !TABLE_ROLE_OPTIONS.some((r) => r.key === form.roleKey)) {
      nextErrors.roleKey = 'Please select a role.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    const roleMeta = TABLE_ROLE_OPTIONS.find((r) => r.key === form.roleKey) ?? TABLE_ROLE_OPTIONS[0];
    setSubmitting(true);
    try {
      if (editingId) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  resident_id: rid,
                  first_name: fn,
                  last_name: ln,
                  email: email || null,
                  phone: phone || null,
                  relationship: rel,
                  role_key: roleMeta.key,
                  role_label: roleMeta.label,
                  contact_level: form.contactLevel,
                  notes: form.notes.trim() || null,
                }
              : c,
          ),
        );
        setToast({ message: 'Resident contact successfully updated' });
      } else {
        const newId = `dc-${Date.now()}`;
        setContacts((prev) => [
          ...prev,
          {
            id: newId,
            resident_id: rid,
            first_name: fn,
            last_name: ln,
            email: email || null,
            phone: phone || null,
            relationship: rel,
            role_key: roleMeta.key,
            role_label: roleMeta.label,
            contact_level: form.contactLevel,
            notes: form.notes.trim() || null,
          },
        ]);
        setToast({ message: 'New resident contact successfully added' });
      }
      closePanel();
    } finally {
      setSubmitting(false);
    }
  };

  const updateRowRole = (contactId: string, roleKey: string) => {
    const meta = TABLE_ROLE_OPTIONS.find((r) => r.key === roleKey);
    if (!meta) return;
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, role_key: meta.key, role_label: meta.label } : c)),
    );
  };

  const sortIcon = (field: Exclude<SortField, null>) =>
    sortField === field ? (
      sortDirection === 'asc' ? (
        <ArrowUp size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
      ) : (
        <ArrowDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-500" />
      )
    ) : (
      <ArrowUpDown size={16} strokeWidth={2} className="flex-shrink-0 text-gray-400" />
    );

  const toolbarRow = (
    <div
      ref={filterRef}
      className="relative flex w-full min-w-0 flex-col items-end gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end"
      style={{ columnGap: 18, rowGap: 8 }}
    >
      {(appliedResidentIds.size > 0 || appliedRoleKeys.size > 0) && (
        <div className="flex min-w-0 w-full flex-wrap items-center justify-end gap-2 lg:flex-1">
          {[...appliedResidentIds].map((id) => (
            <span
              key={`f-r-${id}`}
              className="inline-flex max-w-full items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 font-source-sans-3"
              style={{ backgroundColor: FILTER_CHIP_BG, color: FILTER_CHIP_TEXT }}
            >
              <span className="max-w-[200px] truncate text-sm font-medium">{residentDisplayName(id)}</span>
              <button
                type="button"
                onClick={() => removeAppliedResident(id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                style={{ color: FILTER_CHIP_TEXT }}
                aria-label="Remove resident filter"
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full border"
                  style={{ borderColor: `${FILTER_CHIP_TEXT}55` }}
                >
                  <X size={12} strokeWidth={2.5} />
                </span>
              </button>
            </span>
          ))}
          {[...appliedRoleKeys].map((key) => {
            const label = CONTACT_ROLE_FILTERS.find((r) => r.key === key)?.label ?? key;
            return (
              <span
                key={`f-role-${key}`}
                className="inline-flex max-w-full items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 font-source-sans-3"
                style={{ backgroundColor: FILTER_CHIP_BG, color: FILTER_CHIP_TEXT }}
              >
                <span className="max-w-[140px] truncate text-sm font-medium">{label}</span>
                <button
                  type="button"
                  onClick={() => removeAppliedRole(key)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                  style={{ color: FILTER_CHIP_TEXT }}
                  aria-label="Remove role filter"
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full border"
                    style={{ borderColor: `${FILTER_CHIP_TEXT}55` }}
                  >
                    <X size={12} strokeWidth={2.5} />
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
        onClick={() => (filterPopoverOpen ? setFilterPopoverOpen(false) : openFilter())}
        className={`rounded-lg p-2 transition-colors hover:bg-gray-100 ${
          filterPopoverOpen || appliedResidentIds.size > 0 || appliedRoleKeys.size > 0 ? 'bg-gray-100' : ''
        }`}
        style={{
          color: appliedResidentIds.size > 0 || appliedRoleKeys.size > 0 ? FILTER_CHIP_TEXT : undefined,
        }}
        aria-label="Filter contacts"
        aria-expanded={filterPopoverOpen}
      >
        <FilterLinesIcon
          size={20}
          className={appliedResidentIds.size === 0 && appliedRoleKeys.size === 0 ? 'text-gray-600' : ''}
        />
      </button>
      {filterPopoverOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),320px)] rounded-2xl border border-gray-200 bg-white shadow-xl"
          style={{ padding: 20 }}
          role="dialog"
          aria-label="Filter contacts"
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
            }}
          >
            Filter contacts
          </h3>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            <div className="border-b border-gray-100 pb-1">
              <button
                type="button"
                onClick={() => setSectionResidentOpen((o) => !o)}
                className="flex w-full items-center gap-2 py-2 text-left font-source-sans-3"
                style={{
                  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                  fontWeight: 600,
                  fontSize: 16,
                  color: '#323234',
                }}
              >
                {sectionResidentOpen ? (
                  <ChevronUp size={18} className="shrink-0 text-gray-600" />
                ) : (
                  <ChevronDown size={18} className="shrink-0 text-gray-600" />
                )}
                Resident
              </button>
              {sectionResidentOpen && (
                <div className="mt-1 space-y-0.5 pl-1">
                  {residentRows.map((r) => {
                    const checked = draftResidentIds.has(r.id);
                    const label = [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || '—';
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleDraftResident(r.id)}
                        className="flex w-full items-center gap-3 rounded-lg py-2.5 pl-2 pr-2 text-left hover:bg-gray-50"
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border"
                          style={{
                            borderColor: checked ? 'transparent' : '#d1d5db',
                            backgroundColor: checked ? FILTER_ACCENT : '#FFFFFF',
                          }}
                        >
                          {checked && <Check size={14} strokeWidth={3} className="text-white" />}
                        </span>
                        <span className="text-[16px] font-medium text-[#323234]">{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setSectionRoleOpen((o) => !o)}
                className="flex w-full items-center gap-2 py-2 text-left font-source-sans-3"
                style={{
                  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                  fontWeight: 600,
                  fontSize: 16,
                  color: '#323234',
                }}
              >
                {sectionRoleOpen ? (
                  <ChevronUp size={18} className="shrink-0 text-gray-600" />
                ) : (
                  <ChevronDown size={18} className="shrink-0 text-gray-600" />
                )}
                Role
              </button>
              {sectionRoleOpen && (
                <div className="mt-1 space-y-0.5 pl-1">
                  {CONTACT_ROLE_FILTERS.map(({ key, label }) => {
                    const checked = draftRoleKeys.has(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleDraftRole(key)}
                        className="flex w-full items-center gap-3 rounded-lg py-2.5 pl-2 pr-2 text-left hover:bg-gray-50"
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border"
                          style={{
                            borderColor: checked ? 'transparent' : '#d1d5db',
                            backgroundColor: checked ? FILTER_ACCENT : '#FFFFFF',
                          }}
                        >
                          {checked && <Check size={14} strokeWidth={3} className="text-white" />}
                        </span>
                        <span className="text-[16px] font-medium text-[#323234]">{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
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
              onClick={applyFilters}
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
      {!searchExpanded ? (
        <button
          type="button"
          onClick={() => setSearchExpanded(true)}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
          aria-label="Open search"
        >
          <Search size={20} strokeWidth={1.5} />
        </button>
      ) : (
        <div className="relative flex w-[240px] items-center">
          <Search size={18} className="pointer-events-none absolute left-3 flex-shrink-0 text-gray-500" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="h-9 w-full rounded-lg border border-gray-300 py-2 pl-9 pr-9 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500 font-source-sans-3"
          />
          <button
            type="button"
            onClick={() => setSearchExpanded(false)}
            className="absolute right-2 rounded p-1 hover:bg-gray-100"
            aria-label="Close search"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={openAddPanel}
        className="flex items-center justify-center font-source-sans-3 transition-opacity hover:opacity-90"
        style={{
          width: 200,
          height: 48,
          minWidth: 48,
          borderRadius: 9999,
          gap: 8,
          padding: '10px 24px 10px 20px',
          backgroundColor: '#307584',
          fontWeight: 500,
          fontSize: 16,
          lineHeight: '22px',
          color: '#FFFFFF',
        }}
      >
        <span
          className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white"
          aria-hidden
        >
          <Plus size={11} strokeWidth={3} style={{ color: '#307584' }} />
        </span>
        <span className="whitespace-nowrap">Add Contact</span>
      </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {toolbarMountRef
        ? toolbarPortalTarget && createPortal(toolbarRow, toolbarPortalTarget)
        : toolbarRow}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="px-6 py-3 text-left align-middle">
                  <button
                    type="button"
                    onClick={() => handleSort('contactName')}
                    className="flex items-center gap-1 font-source-sans-3 hover:opacity-80"
                    style={{
                      fontWeight: 500,
                      fontSize: 14,
                      color: '#323234',
                    }}
                  >
                    Name
                    {sortIcon('contactName')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left align-middle">
                  <button
                    type="button"
                    onClick={() => handleSort('resident')}
                    className="flex items-center gap-1 font-source-sans-3 hover:opacity-80"
                    style={{ fontWeight: 500, fontSize: 14, color: '#323234' }}
                  >
                    Resident
                    {sortIcon('resident')}
                  </button>
                </th>
                <th
                  className="px-6 py-3 text-left align-middle font-source-sans-3"
                  style={{ fontWeight: 500, fontSize: 14, color: '#323234' }}
                >
                  Relationship
                </th>
                <th className="px-6 py-3 text-left align-middle">
                  <button
                    type="button"
                    onClick={() => handleSort('community')}
                    className="flex items-center gap-1 font-source-sans-3 hover:opacity-80"
                    style={{ fontWeight: 500, fontSize: 14, color: '#323234' }}
                  >
                    Community
                    {sortIcon('community')}
                  </button>
                </th>
                <th
                  className="px-6 py-3 text-left align-middle font-source-sans-3"
                  style={{ fontWeight: 500, fontSize: 14, color: '#323234' }}
                >
                  Role
                </th>
                <th
                  className="px-6 py-3 text-right align-middle font-source-sans-3"
                  style={{ fontWeight: 500, fontSize: 14, color: '#323234' }}
                >
                  Actions
                </th>
              </tr>
            </thead>
          </table>
          <div className="overflow-hidden rounded-xl border border-[#ACACAD]">
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '20%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRows.map((c) => {
                  const res = residentById.get(c.resident_id);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-inter text-[10px] font-semibold text-white"
                            style={{
                              backgroundColor: '#307584',
                              border: '1.5px solid #FFFFFF',
                            }}
                          >
                            {contactInitials(c.first_name, c.last_name)}
                          </div>
                          <span
                            className="font-source-sans-3 font-medium text-[#323234]"
                            style={{ fontSize: 18, lineHeight: '20px' }}
                          >
                            {[c.first_name, c.last_name].filter(Boolean).join(' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-source-sans-3 font-medium whitespace-nowrap text-[#323234]" style={{ fontSize: 18 }}>
                        {residentDisplayName(c.resident_id)}
                      </td>
                      <td className="px-6 py-4 font-source-sans-3 font-medium whitespace-nowrap text-[#323234]" style={{ fontSize: 18 }}>
                        {c.relationship}
                      </td>
                      <td className="px-6 py-4 font-source-sans-3 font-medium whitespace-nowrap text-[#323234]" style={{ fontSize: 18 }}>
                        {res?.community_name ?? '—'}
                      </td>
                      <td className="px-6 py-4 align-middle whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={c.role_key}
                            onChange={(e) => updateRowRole(c.id, e.target.value)}
                            className="cursor-pointer appearance-none border-0 bg-transparent pr-7 font-source-sans-3 font-semibold text-white outline-none"
                            style={{ ...pillBtnBase, paddingRight: 28 }}
                            aria-label="Role"
                          >
                            {TABLE_ROLE_OPTIONS.map((o) => (
                              <option key={o.key} value={o.key} className="text-gray-900">
                                {o.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white"
                            strokeWidth={2}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Edit contact"
                            onClick={() => openEditPanel(c)}
                          >
                            <Pencil size={18} strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="View resident"
                            onClick={() => {
                              if (!res) return;
                              navigate(`/residents/${toResidentSlug(res.first_name, res.last_name) || res.id}`);
                            }}
                          >
                            <ChevronRight size={18} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="hidden md:block lg:hidden">
          <div className="divide-y divide-gray-200">
            {filteredRows.map((c) => {
              const res = residentById.get(c.resident_id);
              return (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedRow(c.id);
                    if (res) navigate(`/residents/${toResidentSlug(res.first_name, res.last_name) || res.id}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (res) navigate(`/residents/${toResidentSlug(res.first_name, res.last_name) || res.id}`);
                    }
                  }}
                  className={`flex cursor-pointer items-center justify-between px-4 py-4 hover:bg-gray-50 ${
                    selectedRow === c.id ? 'border-l-4 border-purple-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: '#307584' }}
                    >
                      {contactInitials(c.first_name, c.last_name)}
                    </div>
                    <span className="font-source-sans-3 font-medium text-[#323234]" style={{ fontSize: 18 }}>
                      {[c.first_name, c.last_name].filter(Boolean).join(' ')}
                    </span>
                  </div>
                  <ChevronRight size={20} strokeWidth={1.5} className="shrink-0 text-gray-500" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="md:hidden overflow-x-auto">
          <table className="min-w-[640px] w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#323234]">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#323234]">Resident</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[#323234]">Actions</th>
              </tr>
            </thead>
          </table>
          <div className="overflow-hidden rounded-xl border border-[#ACACAD]">
            <table className="min-w-[640px] w-full">
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRows.map((c) => {
                  const res = residentById.get(c.resident_id);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                            style={{ backgroundColor: '#307584' }}
                          >
                            {contactInitials(c.first_name, c.last_name)}
                          </div>
                          <span className="font-source-sans-3 text-[#323234]" style={{ fontSize: 16 }}>
                            {[c.first_name, c.last_name].filter(Boolean).join(' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-source-sans-3 text-[#323234]" style={{ fontSize: 16 }}>
                        {residentDisplayName(c.resident_id)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="mr-2 text-gray-400"
                          onClick={() => openEditPanel(c)}
                          aria-label="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="text-gray-400"
                          onClick={() =>
                            res && navigate(`/residents/${toResidentSlug(res.first_name, res.last_name) || res.id}`)
                          }
                          aria-label="View"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-auto shrink-0 px-4 py-4 md:px-6">
          <Pagination hasPrevious={false} hasNext={true} />
        </div>
      </div>

      {panelOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
            style={{ opacity: panelEntered ? 1 : 0 }}
            onClick={closePanel}
            aria-hidden
          />
          <div
            className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out lg:max-w-3xl ${
              panelEntered ? 'translate-x-0' : 'translate-x-full'
            }`}
            role="dialog"
            aria-modal
            aria-labelledby="contact-panel-title"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <button type="button" onClick={closePanel} className="rounded p-1 hover:bg-gray-100" aria-label="Close">
                  <X size={20} className="text-gray-600" />
                </button>
                <h2 id="contact-panel-title" className="font-source-sans-3 text-2xl font-semibold text-[#323234]">
                  {editingId ? 'Edit Resident Contact' : 'Add Resident Contact'}
                </h2>
              </div>
              <div className="hidden items-center gap-3 md:flex">
                <button
                  type="button"
                  onClick={closePanel}
                  className="font-source-sans-3 transition-opacity hover:opacity-90"
                  style={{
                    height: 48,
                    padding: '10px 24px',
                    borderRadius: 9999,
                    border: '1px solid #83ACB5',
                    backgroundColor: '#EAF1F3',
                    fontWeight: 500,
                    fontSize: 16,
                    color: '#307584',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveContact}
                  disabled={submitting}
                  className="font-source-sans-3 text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{
                    height: 48,
                    padding: '10px 24px',
                    borderRadius: 9999,
                    backgroundColor: '#307584',
                    fontWeight: 500,
                    fontSize: 16,
                  }}
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div className="space-y-6 p-4 md:p-6">
              <div>
                <h3 className="mb-3 font-source-sans-3" style={formSectionHeaderStyle}>
                  Associated Resident
                </h3>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle} htmlFor="contact-form-resident">
                  Resident
                  <RequiredMark />
                </label>
                <SearchableFormSelect
                  id="contact-form-resident"
                  value={form.residentId}
                  onChange={(v) => {
                    clearFieldError('residentId');
                    setForm((f) => ({ ...f, residentId: v }));
                  }}
                  options={residentPickerOptions}
                  placeholder="Select Resident"
                  disabled={submitting}
                  emptyMessage="No residents match."
                  style={formSelectStyle}
                  error={fieldErrors.residentId}
                />
              </div>

              <div>
                <h3 className="mb-3 font-source-sans-3" style={formSectionHeaderStyle}>
                  Primary Resident Contact Information
                </h3>
                <div className="mb-4 flex flex-wrap gap-6">
                  {(['primary', 'secondary', 'other'] as const).map((lvl) => (
                    <label key={lvl} className="flex cursor-pointer items-center gap-2 font-source-sans-3">
                      <input
                        type="radio"
                        name="contactLevel"
                        checked={form.contactLevel === lvl}
                        onChange={() => setForm((f) => ({ ...f, contactLevel: lvl }))}
                        className="h-4 w-4 accent-[#307584]"
                      />
                      <span className="text-lg font-medium capitalize text-[#323234]">{lvl}</span>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle} htmlFor="contact-form-first-name">
                      First Name
                      <RequiredMark />
                    </label>
                    <input
                      id="contact-form-first-name"
                      type="text"
                      placeholder="Input First Name"
                      value={form.firstName}
                      onChange={(e) => {
                        clearFieldError('firstName');
                        setForm((f) => ({ ...f, firstName: e.target.value }));
                      }}
                      required
                      aria-invalid={Boolean(fieldErrors.firstName)}
                      aria-describedby={fieldErrors.firstName ? 'contact-form-first-name-error' : undefined}
                      className={`w-full font-source-sans-3 placeholder:text-[#ACACAD] focus:outline-none focus:ring-2 ${
                        fieldErrors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'focus:ring-teal-500'
                      }`}
                      style={{
                        ...formInputStyle,
                        ...(fieldErrors.firstName ? { borderColor: '#ef4444' } : {}),
                      }}
                    />
                    {fieldErrors.firstName ? (
                      <p id="contact-form-first-name-error" className="mt-1 font-source-sans-3 text-sm text-red-600" role="alert">
                        {fieldErrors.firstName}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle} htmlFor="contact-form-last-name">
                      Last Name
                      <RequiredMark />
                    </label>
                    <input
                      id="contact-form-last-name"
                      type="text"
                      placeholder="Input Last Name"
                      value={form.lastName}
                      onChange={(e) => {
                        clearFieldError('lastName');
                        setForm((f) => ({ ...f, lastName: e.target.value }));
                      }}
                      required
                      aria-invalid={Boolean(fieldErrors.lastName)}
                      aria-describedby={fieldErrors.lastName ? 'contact-form-last-name-error' : undefined}
                      className={`w-full font-source-sans-3 placeholder:text-[#ACACAD] focus:outline-none focus:ring-2 ${
                        fieldErrors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'focus:ring-teal-500'
                      }`}
                      style={{
                        ...formInputStyle,
                        ...(fieldErrors.lastName ? { borderColor: '#ef4444' } : {}),
                      }}
                    />
                    {fieldErrors.lastName ? (
                      <p id="contact-form-last-name-error" className="mt-1 font-source-sans-3 text-sm text-red-600" role="alert">
                        {fieldErrors.lastName}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle} htmlFor="contact-form-email">
                      Email
                      <RequiredMark />
                    </label>
                    <input
                      id="contact-form-email"
                      type="email"
                      placeholder="Input Email"
                      value={form.email}
                      onChange={(e) => {
                        clearFieldError('email');
                        setForm((f) => ({ ...f, email: e.target.value }));
                      }}
                      required
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'contact-form-email-error' : undefined}
                      className={`w-full font-source-sans-3 placeholder:text-[#ACACAD] focus:outline-none focus:ring-2 ${
                        fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'focus:ring-teal-500'
                      }`}
                      style={{
                        ...formInputStyle,
                        ...(fieldErrors.email ? { borderColor: '#ef4444' } : {}),
                      }}
                    />
                    {fieldErrors.email ? (
                      <p id="contact-form-email-error" className="mt-1 font-source-sans-3 text-sm text-red-600" role="alert">
                        {fieldErrors.email}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle} htmlFor="contact-form-phone">
                      Phone
                      <RequiredMark />
                    </label>
                    <input
                      id="contact-form-phone"
                      type="tel"
                      placeholder="Input Phone"
                      value={form.phone}
                      onChange={(e) => {
                        clearFieldError('phone');
                        setForm((f) => ({ ...f, phone: e.target.value }));
                      }}
                      required
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={fieldErrors.phone ? 'contact-form-phone-error' : undefined}
                      className={`w-full font-source-sans-3 placeholder:text-[#ACACAD] focus:outline-none focus:ring-2 ${
                        fieldErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'focus:ring-teal-500'
                      }`}
                      style={{
                        ...formInputStyle,
                        ...(fieldErrors.phone ? { borderColor: '#ef4444' } : {}),
                      }}
                    />
                    {fieldErrors.phone ? (
                      <p id="contact-form-phone-error" className="mt-1 font-source-sans-3 text-sm text-red-600" role="alert">
                        {fieldErrors.phone}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle} htmlFor="contact-form-relationship">
                      Relationship
                      <RequiredMark />
                    </label>
                    <SearchableFormSelect
                      id="contact-form-relationship"
                      value={form.relationship}
                      onChange={(v) => {
                        clearFieldError('relationship');
                        setForm((f) => ({ ...f, relationship: v }));
                      }}
                      options={CONTACT_RELATIONSHIP_OPTIONS}
                      placeholder="Select Relationship"
                      disabled={submitting}
                      emptyMessage="No relationships match."
                      style={formSelectStyle}
                      error={fieldErrors.relationship}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle} htmlFor="contact-form-role">
                      Role
                      <RequiredMark />
                    </label>
                    <SearchableFormSelect
                      id="contact-form-role"
                      value={form.roleKey}
                      onChange={(key) => {
                        clearFieldError('roleKey');
                        setForm((f) => ({ ...f, roleKey: key }));
                      }}
                      options={TABLE_ROLE_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
                      placeholder="Select Role"
                      disabled={submitting}
                      emptyMessage="No roles match."
                      style={formSelectStyle}
                      error={fieldErrors.roleKey}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-source-sans-3" style={formSectionHeaderStyle}>
                  Notes{' '}
                  <span className="text-base font-normal text-gray-500">(optional)</span>
                </h3>
                <textarea
                  id="contact-form-notes"
                  aria-label="Notes (optional)"
                  placeholder="Notes about contact here"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={5}
                  className="w-full max-w-full resize-y font-source-sans-3 placeholder:text-[#ACACAD] focus:outline-none focus:ring-2 focus:ring-teal-500 md:max-w-[680px]"
                  style={{ ...formInputStyle, height: 'auto', minHeight: 120, maxWidth: '100%' }}
                />
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-white p-4 md:hidden">
              <button
                type="button"
                onClick={closePanel}
                className="font-source-sans-3"
                style={{
                  height: 48,
                  padding: '10px 24px',
                  borderRadius: 9999,
                  border: '1px solid #83ACB5',
                  backgroundColor: '#EAF1F3',
                  fontWeight: 500,
                  color: '#307584',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveContact}
                disabled={submitting}
                className="font-source-sans-3 text-white disabled:opacity-60"
                style={{
                  height: 48,
                  padding: '10px 24px',
                  borderRadius: 9999,
                  backgroundColor: '#307584',
                  fontWeight: 500,
                }}
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <BottomToast message={toast.message} variant="success" onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
