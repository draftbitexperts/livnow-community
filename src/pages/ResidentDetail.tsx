import { useMemo, useState, useRef, useEffect, type CSSProperties, type RefObject } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User,
  Settings,
  Users,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  Check,
  Plus,
  StickyNote,
  Paperclip,
  ArrowLeft,
  Building2,
  MessageCircle,
} from 'lucide-react';
import {
  findDemoResidentInList,
  residentDisplayName,
  toResidentSlug,
  type DemoResidentRecord,
} from '@/lib/demoResidents';
import { useDemoResidents } from '@/contexts/DemoResidentsContext';
import { formatDateToAmerican } from '@/lib/dateUtils';
import { toSentenceCase } from '@/lib/textUtils';
import ResidentChatterDrawer from '@/components/ResidentChatterDrawer';

type TabType = 'resident' | 'supply-partners' | 'resident-contacts';

type TaskStatus = 'completed' | 'in-progress' | 'pending' | 'disabled';

interface DummyTask {
  id: string;
  description: string;
  status: TaskStatus;
  ownerInitials: string;
  dueDisplay: string;
  hasNote?: boolean;
  hasAttachment?: boolean;
}

interface DummyService {
  id: string;
  name: string;
  status: 'complete' | 'in-progress' | 'closed' | 'opted-out';
  progress?: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const RESIDENT_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'waitlisted', label: 'Waitlisted' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' },
];

function formatPhoneUS(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone?.trim() || '—';
}

function getTelHref(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length >= 10 ? `tel:${digits.length === 11 ? digits : '1' + digits}` : '';
}

function getInitialsFromDisplayName(displayName: string): string {
  const parts = (displayName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

const residentContactsSectionHeaderStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: '24px',
  lineHeight: '28px',
  letterSpacing: '0%',
  textAlign: 'left',
  color: '#323234',
};

const primaryContactTextStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: '20px',
  letterSpacing: '0%',
  color: '#323234',
};

const primaryContactNotesStyle: CSSProperties = {
  ...primaryContactTextStyle,
  color: '#505051',
};

const communityUpdatesContentStyle: CSSProperties = {
  paddingTop: 60,
  paddingRight: 24,
  paddingBottom: 42,
  paddingLeft: 24,
};

const residentTasksContainerStyle: CSSProperties = {
  opacity: 1,
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  gap: 21,
  paddingTop: 60,
  paddingRight: 24,
  paddingBottom: 42,
  paddingLeft: 24,
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  minWidth: 0,
};

const residentChatterCardStyle: CSSProperties = {
  opacity: 1,
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  paddingTop: 24,
  paddingRight: 24,
  paddingBottom: 24,
  paddingLeft: 24,
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  minWidth: 0,
  boxShadow: 'var(--resident-card-shadow)',
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

const communityUpdatesMonthLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 600,
  fontSize: '20px',
  lineHeight: '24px',
  letterSpacing: '0%',
  textAlign: 'center',
  color: '#505051',
};

const communityUpdatesListItemTextStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 500,
  fontSize: '18px',
  lineHeight: '20px',
  letterSpacing: '0%',
  color: '#323234',
};

const communityUpdatesSentTextStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 600,
  fontSize: '12px',
  lineHeight: '20px',
  letterSpacing: '0%',
  textAlign: 'center',
  color: '#307584',
};

const paginationNavStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '22px',
  letterSpacing: '0%',
  color: '#ACACAD',
};

const supplyPartnersSectionLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: '24px',
  lineHeight: '28px',
  letterSpacing: '0%',
  textAlign: 'left',
  color: '#323234',
};

const supplyPartnersServiceLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '20px',
  letterSpacing: '0%',
  textAlign: 'center',
  color: '#323234',
};

const supplyPartnerBackLinkStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '22px',
  letterSpacing: '0%',
  color: '#359689',
};

const supplyPartnerCloseButtonStyle: CSSProperties = {
  opacity: 1,
  gap: 4,
  borderRadius: 9999,
  border: '1px solid #83ACB5',
  paddingTop: 8,
  paddingRight: 16,
  paddingBottom: 8,
  paddingLeft: 16,
  backgroundColor: '#EAF1F3',
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: '22px',
  letterSpacing: '0%',
  color: '#307584',
};

const taskListBorderColor = '#E3E3E4';

function getTaskStatusIcon(status: TaskStatus) {
  switch (status) {
    case 'completed':
      return (
        <div
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: '#307584' }}
        >
          <Check size={12} className="text-white" />
        </div>
      );
    case 'in-progress':
      return (
        <div
          className="h-5 w-5 flex-shrink-0 rounded-full"
          style={{
            border: '1px solid #307584',
            background: 'linear-gradient(to right, #FFFFFF 50%, #307584 50%)',
          }}
        />
      );
    case 'disabled':
      return <div className="h-5 w-5 flex-shrink-0 rounded-full border border-gray-400 bg-gray-300" />;
    default:
      return <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-gray-300" />;
  }
}

function getServiceStatusBadge(service: DummyService) {
  if (service.status === 'closed') {
    return (
      <span
        className="font-source-sans-3 inline-block"
        style={{
          borderRadius: 4,
          padding: '4px 8px',
          backgroundColor: '#FEF2F2',
          fontWeight: 600,
          fontSize: 14,
          color: '#E35E5E',
        }}
      >
        Closed
      </span>
    );
  }
  if (service.status === 'in-progress' && service.progress != null) {
    return (
      <span
        className="font-source-sans-3 inline-block"
        style={{
          borderRadius: 4,
          padding: '4px 8px',
          backgroundColor: '#307584',
          fontWeight: 600,
          fontSize: 14,
          color: '#FFFFFF',
        }}
      >
        {service.progress}% Complete
      </span>
    );
  }
  return null;
}

const DUMMY_TASKS: DummyTask[] = [
  {
    id: 't1',
    description: 'Welcome packet sent',
    status: 'completed',
    ownerInitials: 'JD',
    dueDisplay: '12/02/2025',
    hasNote: false,
    hasAttachment: true,
  },
  {
    id: 't2',
    description: 'Tour follow-up call',
    status: 'in-progress',
    ownerInitials: 'JD',
    dueDisplay: '12/10/2025',
    hasNote: true,
    hasAttachment: false,
  },
  {
    id: 't3',
    description: 'Insurance paperwork',
    status: 'pending',
    ownerInitials: 'AM',
    dueDisplay: '12/18/2025',
  },
];

const DUMMY_SERVICES_AVAILABLE: DummyService[] = [
  { id: 's1', name: 'Real Estate', status: 'in-progress', progress: 40 },
  { id: 's2', name: 'Mover', status: 'complete' },
  { id: 's3', name: 'Professional Organizer', status: 'in-progress', progress: 10 },
  { id: 's4', name: 'Market Ready', status: 'closed' },
];

const DUMMY_SERVICES_OPTOUT: DummyService[] = [
  { id: 'o1', name: 'Bridge Loan', status: 'opted-out' },
];

interface ProfileCardProps {
  resident: DemoResidentRecord;
  displayStatus: string;
  statusDropdownOpen: boolean;
  setStatusDropdownOpen: (v: boolean) => void;
  statusDropdownRef: RefObject<HTMLDivElement | null>;
  onChangeStatus: (value: string) => void;
  onEditResident: () => void;
  name: string;
}

function ProfileCard({
  resident,
  displayStatus,
  statusDropdownOpen,
  setStatusDropdownOpen,
  statusDropdownRef,
  onChangeStatus,
  onEditResident,
  name,
}: ProfileCardProps) {
  const addressLine = [resident.address, resident.address_2].filter((x) => (x ?? '').trim()).join(', ') || '—';
  const cityLine = [resident.city, resident.state].filter(Boolean).join(', ');
  const zip = (resident.zip_code ?? '').trim();
  const cityDisplay = [cityLine, zip].filter(Boolean).join(cityLine && zip ? ' ' : '') || '—';

  const pc = resident.primary_contact;
  const primaryName = pc
    ? [pc.first_name, pc.last_name].filter(Boolean).join(' ').trim() || '—'
    : '—';

  return (
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
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=232&background=307584&color=fff&bold=true`}
          alt={name}
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
          <h2 className="w-full text-left font-poppins text-xl font-bold leading-tight text-white">{name}</h2>
        </div>
        <div className="relative flex flex-shrink-0 justify-start pb-2 pl-4 pt-2" ref={statusDropdownRef}>
          <button
            type="button"
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className="font-source-sans-3 flex items-center justify-center gap-1"
            style={statusChipInlineStyle(displayStatus)}
          >
            <span>{toSentenceCase(displayStatus.replace(/_/g, ' '))}</span>
            <ArrowDown size={14} strokeWidth={2} className="flex-shrink-0" style={{ color: '#FFFFFF' }} />
          </button>
          {statusDropdownOpen && (
            <div className="absolute left-4 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-gray-200 bg-white font-source-sans-3 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold" style={{ color: '#505051' }}>
                Select new status
              </div>
              <div className="py-1">
                {RESIDENT_STATUS_OPTIONS.filter(
                  (o) => normalizeStatusKey(o.value) !== normalizeStatusKey(displayStatus),
                ).map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => onChangeStatus(o.value)}
                    className="block w-full px-4 py-3 text-left text-base font-semibold transition-colors hover:bg-gray-100"
                    style={{ color: '#323234' }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-6 p-6 pl-4">
          <div className="relative">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-source-sans-3" style={residentDetailTextStyle}>
                Personal Details
              </h3>
              <button
                type="button"
                onClick={onEditResident}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Edit resident"
              >
                <Pencil size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="space-y-1 font-source-sans-3" style={residentDetailTextStyle}>
              {resident.gender?.trim() && resident.gender !== '—' && <p>{resident.gender}</p>}
              <p>{addressLine}</p>
              <p>{cityDisplay}</p>
              {resident.email?.trim() ? (
                <a href={`mailto:${resident.email}`} className="hover:underline" style={{ color: residentDetailEmailColor }}>
                  {resident.email}
                </a>
              ) : (
                <p>—</p>
              )}
              <p>{formatPhoneUS(resident.phone ?? '')}</p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center font-source-sans-3" style={sectionHeaderPillStyle}>
              Primary Resident Contact
            </div>
            <div className="mt-2 space-y-1 font-source-sans-3" style={residentDetailTextStyle}>
              <p className="font-medium">{primaryName}</p>
              {pc && getTelHref(pc.phone ?? '') ? (
                <a href={getTelHref(pc.phone ?? '')} className="block" style={{ color: 'inherit' }}>
                  {formatPhoneUS(pc.phone ?? '')}
                </a>
              ) : (
                <p>{pc ? formatPhoneUS(pc.phone ?? '') : '—'}</p>
              )}
              {pc?.email?.trim() ? (
                <a href={`mailto:${pc.email}`} className="block hover:underline" style={{ color: residentDetailEmailColor }}>
                  {pc.email}
                </a>
              ) : (
                <p>—</p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center font-source-sans-3" style={sectionHeaderPillStyle}>
              Community
            </div>
            <div className="mt-2 space-y-1 font-source-sans-3" style={residentDetailTextStyle}>
              <p className="font-medium">{resident.community_name || '—'}</p>
              <p>Move In: {formatDateToAmerican(resident.move_in_date)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeStatusKey(s: string): string {
  return (s ?? '').toLowerCase().replace(/\s+/g, '_');
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof User;
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
              backgroundColor: '#FFFFFF',
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

export default function ResidentDetail() {
  const { residentId = '' } = useParams<{ residentId: string }>();
  const navigate = useNavigate();
  const { records, setRecords } = useDemoResidents();
  const [activeTab, setActiveTab] = useState<TabType>('resident');
  const [selectedMonth, setSelectedMonth] = useState(11);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedSupplyService, setSelectedSupplyService] = useState<DummyService | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  /** Demo: red dot on Open Chat until user taps (real app: unread from provider). */
  const [residentChatterUnread, setResidentChatterUnread] = useState(true);
  const [chatterDrawerOpen, setChatterDrawerOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  const resident = useMemo(
    () => (residentId ? findDemoResidentInList(records, residentId) : null),
    [records, residentId],
  );

  const slugForEdit = resident
    ? toResidentSlug(resident.first_name, resident.last_name) || resident.id
    : '';

  const openEditResident = () => {
    if (!resident) return;
    navigate('/residents/all', {
      state: { editResidentId: resident.id, returnToResidentSlug: slugForEdit },
    });
  };

  useEffect(() => {
    if (!statusDropdownOpen) return;
    const onDown = (e: MouseEvent) => {
      if (statusRef.current?.contains(e.target as Node)) return;
      setStatusDropdownOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [statusDropdownOpen]);

  const handleChangeStatus = (value: string) => {
    if (!resident) return;
    setRecords((prev) =>
      prev.map((r) => (r.id === resident.id ? { ...r, status: value } : r)),
    );
    setStatusDropdownOpen(false);
  };

  const goPrevMonth = () => {
    if (selectedMonth <= 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    const n = new Date();
    const cy = n.getFullYear();
    const cm = n.getMonth() + 1;
    if (selectedYear > cy || (selectedYear === cy && selectedMonth >= cm)) return;
    if (selectedMonth >= 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const nowCal = new Date();
  const calYear = nowCal.getFullYear();
  const calMonth = nowCal.getMonth() + 1;
  const isCurrentOrFutureMonth = selectedYear > calYear || (selectedYear === calYear && selectedMonth >= calMonth);

  if (!residentId) {
    return (
      <div className="flex min-h-[200px] flex-1 items-center justify-center font-source-sans-3">
        <p className="text-gray-600">Missing resident.</p>
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h2 className="font-poppins text-xl font-semibold text-[#323234]">Resident not found</h2>
        <p className="mt-2 font-source-sans-3 text-gray-600">This link may be invalid.</p>
        <button
          type="button"
          onClick={() => navigate('/residents/all')}
          className="mt-6 rounded-full px-6 py-2.5 font-source-sans-3 font-semibold text-white"
          style={{ backgroundColor: '#307584' }}
        >
          Back to All Residents
        </button>
      </div>
    );
  }

  const name = residentDisplayName(resident);
  const isActive = normalizeStatusKey(resident.status) === 'active';

  const communityUpdateRow = {
    week: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-16`,
    title: resident.community_name || 'Community',
    sentDisplay: '12/16/2025',
  };

  const serviceTasksForDetail: DummyTask[] = [
    { id: 'st1', description: 'Initial consultation', status: 'completed', ownerInitials: 'JD', dueDisplay: '11/01/2025' },
    { id: 'st2', description: 'Follow-up checklist', status: 'in-progress', ownerInitials: 'JD', dueDisplay: '12/05/2025', hasNote: true },
  ];

  const renderRelocationCard = () => (
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
          Relocation Specialist
        </h3>
        <button
          type="button"
          onClick={openEditResident}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Edit resident"
        >
          <Pencil size={18} strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-inter font-semibold text-white"
            style={{
              backgroundColor: '#307584',
              borderRadius: 100,
              border: '1.5px solid #FFFFFF',
            }}
          >
            <span className="text-[10px] leading-none">
              {resident.relocation_specialist_display !== '—'
                ? getInitialsFromDisplayName(resident.relocation_specialist_display)
                : '—'}
            </span>
          </div>
          <span className="min-w-0 break-words font-source-sans-3" style={residentDetailTextStyle}>
            {resident.relocation_specialist_display}
          </span>
        </div>
      </div>
    </div>
  );

  const renderImportantNotesCard = () => (
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
          onClick={openEditResident}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Edit notes"
        >
          <Pencil size={18} strokeWidth={1.5} />
        </button>
      </div>
      <div className="font-source-sans-3" style={residentDetailTextStyle}>
        {(resident.important_notes ?? '').trim() || '—'}
      </div>
    </div>
  );

  const renderTabStrip = () => (
    <div
      className="absolute left-0 right-0 z-10 flex flex-wrap justify-center gap-2 rounded-t-2xl"
      style={{ top: 2, padding: 24 }}
    >
      <TabButton active={activeTab === 'resident'} onClick={() => setActiveTab('resident')} icon={User} label="Resident" />
      <TabButton
        active={activeTab === 'supply-partners'}
        onClick={() => {
          setActiveTab('supply-partners');
          setSelectedSupplyService(null);
        }}
        icon={Settings}
        label="Supply Partners"
      />
      <TabButton
        active={activeTab === 'resident-contacts'}
        onClick={() => setActiveTab('resident-contacts')}
        icon={Users}
        label="Resident Contacts"
      />
    </div>
  );

  const renderTabPanelInner = () => {
    if (activeTab === 'resident') {
      return (
        <div>
          <h3 className="mb-4 font-source-sans-3" style={contentSectionHeaderStyle}>
            Community Updates
          </h3>
          <div className="mb-4 flex items-center justify-between gap-4">
            <button type="button" onClick={goPrevMonth} className="font-source-sans-3 flex items-center gap-1.5 hover:opacity-90" style={paginationNavStyle}>
              <ChevronLeft size={18} style={{ color: '#ACACAD', flexShrink: 0 }} />
              Previous
            </button>
            <span className="flex-1 text-center font-source-sans-3" style={communityUpdatesMonthLabelStyle}>
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
            <button
              type="button"
              onClick={goNextMonth}
              disabled={isCurrentOrFutureMonth}
              className="font-source-sans-3 flex items-center gap-1.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={paginationNavStyle}
            >
              Next
              <ChevronRight size={18} style={{ color: '#ACACAD', flexShrink: 0 }} />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-gray-100 p-4">
              <span className="min-w-0 flex-1 font-source-sans-3" style={communityUpdatesListItemTextStyle}>
                Week of {formatDateToAmerican(communityUpdateRow.week) || communityUpdateRow.week}
                {communityUpdateRow.title ? ` – ${communityUpdateRow.title}` : ''}
              </span>
              <span className="flex-shrink-0 font-source-sans-3" style={communityUpdatesSentTextStyle}>
                Sent {communityUpdateRow.sentDisplay}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'supply-partners') {
      if (selectedSupplyService) {
        return (
          <div>
            <button
              type="button"
              onClick={() => setSelectedSupplyService(null)}
              className="mb-4 flex items-center gap-1 font-source-sans-3 hover:opacity-90"
              style={supplyPartnerBackLinkStyle}
            >
              <ArrowLeft size={16} style={{ color: '#359689' }} />
              Back to All Services
            </button>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-source-sans-3" style={contentSectionHeaderStyle}>
                {selectedSupplyService.name}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedSupplyService(null)}
                className="font-source-sans-3 flex items-center justify-center hover:opacity-90"
                style={supplyPartnerCloseButtonStyle}
              >
                Close Service
              </button>
            </div>
            <div className="grid gap-4 pb-2 mb-2" style={{ gridTemplateColumns: 'minmax(0,1fr) 56px 10% 10%' }}>
              <div className="font-source-sans-3 text-left" style={residentTasksColumnHeaderStyle}>
                Status
              </div>
              <div className="font-source-sans-3 text-left" style={residentTasksColumnHeaderStyle} aria-hidden />
              <div className="font-source-sans-3 text-left" style={residentTasksColumnHeaderStyle}>
                Owner
              </div>
              <div className="font-source-sans-3 text-left" style={residentTasksColumnHeaderStyle}>
                Due On
              </div>
            </div>
            <div className="space-y-0">
              {serviceTasksForDetail.map((task, index) => {
                const list = serviceTasksForDetail;
                const isFirst = index === 0;
                const isLast = index === list.length - 1;
                return (
                  <div
                    key={task.id}
                    className={`grid items-center gap-4 p-4 ${isFirst ? 'rounded-t-xl' : ''} ${isLast ? 'rounded-b-xl' : ''}`}
                    style={{
                      gridTemplateColumns: 'minmax(0,1fr) 56px 10% 10%',
                      border: `1px solid ${taskListBorderColor}`,
                      ...(isFirst ? {} : { borderTop: 'none' }),
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {getTaskStatusIcon(task.status)}
                      <span className="truncate font-source-sans-3" style={residentTasksRowTextStyle}>
                        {task.description}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-center gap-1.5">
                      {task.hasNote && <StickyNote size={16} className="flex-shrink-0" style={{ color: '#307584' }} />}
                      {task.hasAttachment && <Paperclip size={16} className="flex-shrink-0" style={{ color: '#C8C8C8' }} />}
                    </div>
                    <div className="flex min-w-0 items-center gap-1">
                      <div
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-inter font-semibold text-white"
                        style={{
                          width: 24,
                          height: 24,
                          backgroundColor: '#307584',
                          borderRadius: 100,
                          border: '1.5px solid #FFFFFF',
                          fontSize: 10,
                        }}
                      >
                        {task.ownerInitials}
                      </div>
                      <button
                        type="button"
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-dashed hover:opacity-80"
                        style={{ borderColor: '#E5E5E5' }}
                        aria-label="Add owner (demo)"
                      >
                        <Plus size={14} style={{ color: '#A3A3A3' }} strokeWidth={2} />
                      </button>
                    </div>
                    <span className="font-source-sans-3 text-[#505051]">{task.dueDisplay}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-6" style={{ paddingBottom: 48 }}>
          <div>
            <h3 className="mb-4 text-left font-source-sans-3" style={supplyPartnersSectionLabelStyle}>
              Available Services
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" style={{ gap: 28 }}>
              {DUMMY_SERVICES_AVAILABLE.map((service) => {
                const isClosed = service.status === 'closed';
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedSupplyService(service)}
                    className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-shadow hover:shadow-md"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: isClosed ? '#E3E3E4' : '#307584',
                    }}
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-white sm:mb-4 sm:h-16 sm:w-16">
                      <Building2 size={28} className="text-[#307584]" strokeWidth={1.5} />
                    </div>
                    <h4 className="mb-3 w-full text-center font-source-sans-3 sm:mb-4" style={supplyPartnersServiceLabelStyle}>
                      {service.name}
                    </h4>
                    {getServiceStatusBadge(service)}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-left font-source-sans-3" style={supplyPartnersSectionLabelStyle}>
              Opted Out Services
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" style={{ gap: 28 }}>
              {DUMMY_SERVICES_OPTOUT.map((service) => (
                <div
                  key={service.id}
                  className="relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 p-4 text-center"
                  style={{ backgroundColor: '#F1F1F1', borderColor: '#F1F1F1' }}
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg sm:h-16 sm:w-16">
                    <Building2 size={28} className="text-[#307584]" strokeWidth={1.5} />
                  </div>
                  <h4 className="w-full text-center font-source-sans-3" style={supplyPartnersServiceLabelStyle}>
                    {service.name}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const pc = resident.primary_contact;
    const primaryName = pc
      ? [pc.first_name, pc.last_name].filter(Boolean).join(' ').trim() || '—'
      : '—';

    return (
      <div className="space-y-6">
        <div className="rounded-xl p-6 font-source-sans-3" style={{ backgroundColor: '#EAF1F3' }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-left font-source-sans-3" style={residentContactsSectionHeaderStyle}>
              Primary Contact
            </h3>
            <button
              type="button"
              onClick={openEditResident}
              className="rounded p-1 text-gray-400 hover:text-gray-600"
              aria-label="Edit primary contact"
            >
              <Pencil size={18} strokeWidth={1.5} />
            </button>
          </div>
          {pc ? (
            <div className="space-y-2">
              <p className="font-source-sans-3" style={primaryContactTextStyle}>
                {primaryName}
              </p>
              {getTelHref(pc.phone ?? '') ? (
                <a
                  href={getTelHref(pc.phone ?? '')}
                  className="font-source-sans-3 block"
                  style={{ ...primaryContactTextStyle, color: '#307584', textDecoration: 'underline' }}
                >
                  {formatPhoneUS(pc.phone ?? '')}
                </a>
              ) : (
                <p className="font-source-sans-3" style={primaryContactTextStyle}>
                  {formatPhoneUS(pc.phone ?? '')}
                </p>
              )}
              <a
                href={pc.email ? `mailto:${pc.email}` : '#'}
                className="font-source-sans-3 block"
                style={{ ...primaryContactTextStyle, color: pc.email ? '#359689' : undefined }}
                onClick={(e) => !pc.email && e.preventDefault()}
              >
                {pc.email || '—'}
              </a>
              <p className="font-source-sans-3" style={primaryContactTextStyle}>
                {pc.relationship || '—'}
              </p>
              <p className="mt-3 font-source-sans-3" style={primaryContactNotesStyle}>
                {(pc.notes ?? '').trim() || '—'}
              </p>
            </div>
          ) : (
            <p className="font-source-sans-3 text-gray-600">No primary contact on file.</p>
          )}
        </div>
        <div className="rounded-xl p-6 font-source-sans-3" style={{ backgroundColor: '#EAF1F3' }}>
          <h3 className="mb-2 text-left font-source-sans-3" style={residentContactsSectionHeaderStyle}>
            Secondary Contact
          </h3>
          <p className="font-source-sans-3 text-gray-600">No secondary contact (demo).</p>
        </div>
      </div>
    );
  };

  const renderResidentChatterCard = () => (
    <div className="rounded-2xl" style={residentChatterCardStyle}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-left font-source-sans-3" style={{ ...contentSectionHeaderStyle, textAlign: 'left' }}>
          Resident Chatter
        </h3>
        <button
          type="button"
          onClick={() => {
            setResidentChatterUnread(false);
            setChatterDrawerOpen(true);
          }}
          className="relative inline-flex shrink-0 items-center justify-center gap-2 font-source-sans-3 transition-opacity hover:opacity-90"
          style={{
            height: 48,
            paddingLeft: 24,
            paddingRight: 24,
            borderRadius: 9999,
            border: '1px solid #83ACB5',
            backgroundColor: '#FFFFFF',
            color: '#307584',
            fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
            fontWeight: 500,
            fontSize: 16,
            lineHeight: '22px',
          }}
          aria-label={residentChatterUnread ? 'Open chat, new messages' : 'Open chat'}
        >
          <MessageCircle size={18} className="flex-shrink-0" style={{ color: '#307584' }} aria-hidden />
          Open Chat
          {residentChatterUnread && (
            <span
              className="pointer-events-none absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"
              aria-hidden
            />
          )}
        </button>
      </div>
    </div>
  );

  const renderRightColumn = () => (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="relative flex-shrink-0 bg-[hsla(193,27%,94%,1)]" style={{ width: '100%', minHeight: 48, marginTop: -24 }}>
        {renderTabStrip()}
        <div
          className="flex flex-col overflow-hidden rounded-2xl"
          style={{ marginTop: 48, backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: 'var(--resident-card-shadow)' }}
        >
          <div className="flex flex-col" style={communityUpdatesContentStyle}>
            {renderTabPanelInner()}
          </div>
        </div>
      </div>
      {activeTab === 'resident' && renderResidentChatterCard()}
      {activeTab === 'resident' && (
        <div className="rounded-2xl" style={residentTasksContainerStyle}>
          <h3 className="text-left font-source-sans-3" style={{ ...contentSectionHeaderStyle, textAlign: 'left' }}>
            Resident Tasks
          </h3>
          {!isActive ? (
            <p className="py-4 font-source-sans-3 text-gray-500">
              Resident tasks are added when the resident status is set to Active.
            </p>
          ) : (
            <>
              <div className="mb-2 grid gap-4 pb-2" style={{ gridTemplateColumns: 'minmax(0,1fr) 56px 10% 10%' }}>
                <div className="text-left font-source-sans-3" style={residentTasksColumnHeaderStyle}>
                  Status
                </div>
                <div className="text-left font-source-sans-3" style={residentTasksColumnHeaderStyle} aria-hidden />
                <div className="text-left font-source-sans-3" style={residentTasksColumnHeaderStyle}>
                  Owner
                </div>
                <div className="text-left font-source-sans-3" style={residentTasksColumnHeaderStyle}>
                  Due On
                </div>
              </div>
              <div className="space-y-0">
                {DUMMY_TASKS.map((task, taskIndex) => {
                  const isFirst = taskIndex === 0;
                  const isLast = taskIndex === DUMMY_TASKS.length - 1;
                  return (
                    <div
                      key={task.id}
                      className={`grid cursor-default items-center gap-4 p-4 ${isFirst ? 'rounded-t-xl' : ''} ${isLast ? 'rounded-b-xl' : ''}`}
                      style={{
                        gridTemplateColumns: 'minmax(0,1fr) 56px 10% 10%',
                        border: `1px solid ${taskListBorderColor}`,
                        ...(isFirst ? {} : { borderTop: 'none' }),
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {getTaskStatusIcon(task.status)}
                        <span className="truncate font-source-sans-3" style={residentTasksRowTextStyle}>
                          {task.description}
                        </span>
                      </div>
                      <div className="flex min-w-0 items-center gap-1.5">
                        {task.hasNote && <StickyNote size={16} className="flex-shrink-0" style={{ color: '#307584' }} />}
                        {task.hasAttachment && <Paperclip size={16} className="flex-shrink-0" style={{ color: '#C8C8C8' }} />}
                      </div>
                      <div className="flex min-w-0 items-center gap-1">
                        <div
                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-inter font-semibold text-white"
                          style={{
                            width: 24,
                            height: 24,
                            backgroundColor: '#307584',
                            borderRadius: 100,
                            border: '1.5px solid #FFFFFF',
                            fontSize: 10,
                          }}
                        >
                          {task.ownerInitials}
                        </div>
                        <span
                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-dashed"
                          style={{ borderColor: '#E5E5E5' }}
                          aria-hidden
                        >
                          <Plus size={14} style={{ color: '#A3A3A3' }} strokeWidth={2} />
                        </span>
                      </div>
                      <span className="font-source-sans-3 text-[#505051]">{task.dueDisplay}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  const leftStack = (
    <div className="flex w-full min-w-0 flex-col gap-6 xl:w-[264px] xl:flex-shrink-0">
      <ProfileCard
        resident={resident}
        displayStatus={resident.status}
        statusDropdownOpen={statusDropdownOpen}
        setStatusDropdownOpen={setStatusDropdownOpen}
        statusDropdownRef={statusRef}
        onChangeStatus={handleChangeStatus}
        onEditResident={openEditResident}
        name={name}
      />
      {renderRelocationCard()}
      {renderImportantNotesCard()}
    </div>
  );

  const chatterRecipientName = (() => {
    const s = (resident.relocation_specialist_display ?? '').trim();
    if (s && s !== '—') return s;
    return 'Kathleen Fredendall';
  })();

  return (
    <>
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col pb-24 max-lg:pb-28">
      <div className="lg:hidden">
        <div className="mb-4 border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/residents/all')} className="p-1" aria-label="Back">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <span className="text-xs text-gray-600 font-source-sans-3">
              Residents / {name}
            </span>
          </div>
        </div>
      </div>

      <div className="hidden w-full min-w-0 flex-col gap-6 md:flex xl:flex-row xl:items-start">
        {leftStack}
        {renderRightColumn()}
      </div>

      <div className="flex w-full min-w-0 flex-col gap-6 md:hidden">
        {leftStack}
        {renderRightColumn()}
      </div>
    </div>
    <ResidentChatterDrawer
      open={chatterDrawerOpen}
      onClose={() => setChatterDrawerOpen(false)}
      messageRecipientName={chatterRecipientName}
    />
    </>
  );
}
