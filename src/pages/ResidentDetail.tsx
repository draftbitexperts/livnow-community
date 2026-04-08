import {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  type CSSProperties,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Pencil,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  Check,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react';
import supplyPartnerIconRealEstate from '../../LivNow Icons/Button Tab/Image.png';
import supplyPartnerIconOrganizer from '../../LivNow Icons/Button Tab/Image-1.png';
import supplyPartnerIconMover from '../../LivNow Icons/Button Tab/Image-2.png';
import supplyPartnerIconBridgeLoan from '../../LivNow Icons/Button Tab/Image-3.png';
import supplyPartnerIconMarketReady from '../../LivNow Icons/Button Tab/Image-5.png';
import tabIconProfile from '../../LivNow Icons/Resident Detail Tab/profile.png';
import tabIconProfileWhite from '../../LivNow Icons/Resident Detail Tab/profile white.png';
import tabIconLikeShapes from '../../LivNow Icons/Resident Detail Tab/like-shapes.png';
import tabIconLikeShapesWhite from '../../LivNow Icons/Resident Detail Tab/like-shapes white.png';
import tabIconProfile2User from '../../LivNow Icons/Resident Detail Tab/profile-2user.png';
import tabIconProfile2UserWhite from '../../LivNow Icons/Resident Detail Tab/profile-2user white.png';
import {
  findDemoResidentInList,
  residentDisplayName,
  isDemoContactEmpty,
  type DemoResidentRecord,
  type DemoResidentContact,
} from '@/lib/demoResidents';
import { useDemoResidents } from '@/contexts/DemoResidentsContext';
import { formatDateToAmerican } from '@/lib/dateUtils';
import { toSentenceCase } from '@/lib/textUtils';
import ResidentChatterDrawer from '@/components/ResidentChatterDrawer';
import ResidentFormSlidePanel from '@/components/ResidentFormSlidePanel';
import { BottomToast, type BottomToastPayload } from '@/components/BottomToast';
import RealEstateMilestonesPanel, {
  type RealEstateMilestoneScenario,
} from '@/components/RealEstateMilestonesPanel';
import GenericServiceMilestonesPanel, {
  type GenericMilestoneScenario,
} from '@/components/GenericServiceMilestonesPanel';
import MilestoneStatusPopover from '@/components/MilestoneStatusPopover';
import { formatShortMonthDay, type MilestoneWorkflowStatus } from '@/lib/milestoneWorkflow';
import { formSelectOverrides } from '@/lib/formStyles';
import { SearchableFormSelect, type SearchableFormSelectOption } from '@/components/SearchableFormSelect';

type TabType = 'resident' | 'supply-partners' | 'resident-contacts';

type TaskStatus = 'completed' | 'in-progress' | 'pending' | 'disabled';

interface DummyTask {
  id: string;
  description: string;
  status: TaskStatus;
  /** Supply-partner task rows */
  ownerInitials?: string;
  /** Resident task rows: two avatars; `null` = inactive (show "--") */
  ownerPair?: [string, string] | null;
  dueDisplay?: string | null;
  hasNote?: boolean;
  hasAttachment?: boolean;
}

interface DummyService {
  id: string;
  name: string;
  status: 'complete' | 'in-progress' | 'closed' | 'opted-out';
  progress?: number;
  iconSrc: string;
  /** Demo only: Real Estate (s1) milestone mock */
  realEstateMilestoneScenario?: RealEstateMilestoneScenario;
  /** Demo only: non–Real Estate services — 3-step Referred / Active / Complete */
  genericMilestoneScenario?: GenericMilestoneScenario;
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

const RESIDENT_CONTACTS_SECTION_BG = 'hsla(193, 27%, 94%, 1)';
const RESIDENT_CONTACTS_ADDITIONAL_BG = 'hsla(0, 0%, 95%, 1)';

const PRIMARY_CONTACT_RELATIONSHIP_OPTIONS: SearchableFormSelectOption[] = [
  { value: 'Son', label: 'Son' },
  { value: 'Daughter', label: 'Daughter' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Son in law', label: 'Son in law' },
  { value: 'Other', label: 'Other' },
];

const primaryContactFormLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: 18,
  lineHeight: '20px',
  color: '#323234',
};

const primaryContactFormInputStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  height: 48,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  padding: 16,
  backgroundColor: '#FFFFFF',
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: 18,
  lineHeight: '20px',
  color: '#323234',
};

const primaryContactFormSelectStyle: CSSProperties = {
  ...primaryContactFormInputStyle,
  ...formSelectOverrides,
  backgroundColor: '#FFFFFF',
};

function isValidEmailSimple(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

type ResidentInlineContactDraft = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  relationship: string;
  notes: string;
};

function emptyResidentContactDraft(): ResidentInlineContactDraft {
  return { firstName: '', lastName: '', phone: '', email: '', relationship: '', notes: '' };
}

/** Notes optional; all other contact fields required with valid email. */
function isResidentContactDraftComplete(d: ResidentInlineContactDraft): boolean {
  const fn = d.firstName.trim();
  const ln = d.lastName.trim();
  const ph = d.phone.trim();
  const em = d.email.trim();
  const rel = d.relationship.trim();
  if (!fn || !ln || !ph || !rel) return false;
  if (!isValidEmailSimple(em)) return false;
  return true;
}

function ContactFieldRequiredMark() {
  return (
    <span className="text-red-500" aria-hidden>
      {' '}
      *
    </span>
  );
}

function draftFromDemoContact(c: DemoResidentContact | null | undefined): ResidentInlineContactDraft {
  const p = c ?? null;
  return {
    firstName: (p?.first_name ?? '').trim(),
    lastName: (p?.last_name ?? '').trim(),
    phone: (p?.phone ?? '').trim(),
    email: (p?.email ?? '').trim(),
    relationship: (p?.relationship ?? '').trim(),
    notes: (p?.notes ?? '').trim(),
  };
}

function ResidentContactInlineFormFields({
  idPrefix,
  draft,
  setDraft,
  disabled,
}: {
  idPrefix: string;
  draft: ResidentInlineContactDraft;
  setDraft: Dispatch<SetStateAction<ResidentInlineContactDraft>>;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="mb-2 block font-source-sans-3" style={primaryContactFormLabelStyle} htmlFor={`${idPrefix}-first`}>
          First Name
          <ContactFieldRequiredMark />
        </label>
        <input
          id={`${idPrefix}-first`}
          type="text"
          placeholder="Input Name"
          value={draft.firstName}
          onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))}
          className="w-full font-source-sans-3 placeholder:text-[#ACACAD] focus:outline-none focus:ring-2 focus:ring-teal-500"
          style={primaryContactFormInputStyle}
          disabled={disabled}
          required
          aria-required
        />
      </div>
      <div>
        <label className="mb-2 block font-source-sans-3" style={primaryContactFormLabelStyle} htmlFor={`${idPrefix}-last`}>
          Last Name
          <ContactFieldRequiredMark />
        </label>
        <input
          id={`${idPrefix}-last`}
          type="text"
          placeholder="Input Name"
          value={draft.lastName}
          onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
          className="w-full font-source-sans-3 placeholder:text-[#ACACAD] focus:outline-none focus:ring-2 focus:ring-teal-500"
          style={primaryContactFormInputStyle}
          disabled={disabled}
          required
          aria-required
        />
      </div>
      <div>
        <label className="mb-2 block font-source-sans-3" style={primaryContactFormLabelStyle} htmlFor={`${idPrefix}-phone`}>
          Phone Number
          <ContactFieldRequiredMark />
        </label>
        <input
          id={`${idPrefix}-phone`}
          type="tel"
          placeholder="Input Number"
          value={draft.phone}
          onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
          className="w-full font-source-sans-3 placeholder:text-[#ACACAD] focus:outline-none focus:ring-2 focus:ring-teal-500"
          style={primaryContactFormInputStyle}
          disabled={disabled}
          required
          aria-required
        />
      </div>
      <div>
        <label className="mb-2 block font-source-sans-3" style={primaryContactFormLabelStyle} htmlFor={`${idPrefix}-email`}>
          Email
          <ContactFieldRequiredMark />
        </label>
        <input
          id={`${idPrefix}-email`}
          type="email"
          placeholder="Input Email"
          value={draft.email}
          onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
          className="w-full font-source-sans-3 placeholder:text-[#ACACAD] focus:outline-none focus:ring-2 focus:ring-teal-500"
          style={primaryContactFormInputStyle}
          disabled={disabled}
          required
          aria-required
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block font-source-sans-3" style={primaryContactFormLabelStyle} htmlFor={`${idPrefix}-rel`}>
          Relationship
          <ContactFieldRequiredMark />
        </label>
        <SearchableFormSelect
          id={`${idPrefix}-rel`}
          value={draft.relationship}
          onChange={(v) => setDraft((d) => ({ ...d, relationship: v }))}
          options={PRIMARY_CONTACT_RELATIONSHIP_OPTIONS}
          placeholder="Select Relationship"
          disabled={disabled}
          emptyMessage="No relationships match."
          style={primaryContactFormSelectStyle}
          wrapperClassName="relative w-full max-w-full"
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block font-source-sans-3" style={primaryContactFormLabelStyle} htmlFor={`${idPrefix}-notes`}>
          Notes{' '}
          <span className="text-base font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          id={`${idPrefix}-notes`}
          placeholder="Notes about this contact"
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          rows={4}
          className="w-full resize-y font-source-sans-3 placeholder:text-[#ACACAD] focus:outline-none focus:ring-2 focus:ring-teal-500"
          style={{ ...primaryContactFormInputStyle, height: 'auto', minHeight: 120 }}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

const communityUpdatesContentStyle: CSSProperties = {
  paddingTop: 60,
  paddingRight: 24,
  paddingBottom: 42,
  paddingLeft: 24,
};

const TASK_PRIMARY_TEAL = 'hsla(191, 47%, 35%, 1)';
const taskListBorderColor = '#E3E3E4';

/** Status | task (flex) | fixed Owner | fixed Due — long names truncate in column 2 only */
const RESIDENT_TASKS_GRID_COLUMNS = '2.25rem minmax(0, 1fr) 6.5rem 4.75rem';

const residentTasksContainerStyle: CSSProperties = {
  opacity: 1,
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  border: `1px solid ${taskListBorderColor}`,
  boxShadow: 'none',
  gap: 0,
  paddingTop: 24,
  paddingRight: 24,
  paddingBottom: 24,
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

const residentTasksColumnHeaderRightStyle: CSSProperties = {
  ...residentTasksColumnHeaderStyle,
  textAlign: 'right',
};

const residentTasksDueInactiveStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: '20px',
  color: '#A3A3A3',
};

const residentTasksDueActiveStyle: CSSProperties = {
  ...residentTasksDueInactiveStyle,
  color: TASK_PRIMARY_TEAL,
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

const communityUpdatesNavEnabledColor = 'hsla(191, 47%, 35%, 1)';
const communityUpdatesNavDisabledColor = 'hsla(240, 1%, 68%, 1)';

const communityUpdatesNavButtonBaseStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '22px',
  letterSpacing: '0%',
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

function getTaskStatusIcon(status: TaskStatus) {
  switch (status) {
    case 'completed':
      return (
        <div
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: TASK_PRIMARY_TEAL }}
        >
          <Check size={12} className="text-white" strokeWidth={2.5} />
        </div>
      );
    case 'in-progress':
      return (
        <div
          className="box-border h-5 w-5 flex-shrink-0 rounded-full"
          style={{
            border: `1px solid ${TASK_PRIMARY_TEAL}`,
            background: `linear-gradient(to right, #FFFFFF 50%, ${TASK_PRIMARY_TEAL} 50%)`,
          }}
        />
      );
    case 'disabled':
      return <div className="h-5 w-5 flex-shrink-0 rounded-full border border-gray-400 bg-gray-300" />;
    default:
      return (
        <div
          className="box-border h-5 w-5 flex-shrink-0 rounded-full bg-white"
          style={{ border: `1.5px solid ${TASK_PRIMARY_TEAL}` }}
        />
      );
  }
}

function ResidentTaskOwnerPair({ pair }: { pair: [string, string] | null }) {
  if (!pair) {
    return (
      <div className="flex w-full items-center justify-end">
        <span className="font-source-sans-3 tabular-nums" style={residentTasksDueInactiveStyle}>
          --
        </span>
      </div>
    );
  }
  const avatar: CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: 100,
    backgroundColor: TASK_PRIMARY_TEAL,
    border: '1.5px solid #FFFFFF',
    boxSizing: 'border-box',
    fontSize: 10,
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontWeight: 600,
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  return (
    <div className="flex w-full items-center justify-end">
      <div className="flex shrink-0 items-center">
        <div className="relative z-[2]" style={avatar}>
          {pair[0]}
        </div>
        <div className="relative z-[1] -ml-2.5" style={avatar}>
          {pair[1]}
        </div>
      </div>
    </div>
  );
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
    description: 'Needs assessment completed',
    status: 'completed',
    ownerPair: ['KF', 'MS'],
    dueDisplay: '12/4',
  },
  {
    id: 't2',
    description: 'Real estate agent email sent to customer',
    status: 'completed',
    ownerPair: ['KF', 'MS'],
    dueDisplay: '12/5',
  },
  {
    id: 't3',
    description: 'Mover email sent to customer',
    status: 'in-progress',
    ownerPair: ['KF', 'MS'],
    dueDisplay: '12/6',
  },
  {
    id: 't4',
    description: 'Professional organizer email sent to customer',
    status: 'in-progress',
    ownerPair: ['KF', 'MS'],
    dueDisplay: '12/8',
  },
  {
    id: 't5',
    description: 'Timeline sent',
    status: 'pending',
    ownerPair: ['KF', 'MS'],
    dueDisplay: '12/10',
  },
  {
    id: 't6',
    description: 'Confirm move in date with community',
    status: 'pending',
    ownerPair: ['KF', 'MS'],
    dueDisplay: '12/12',
  },
  {
    id: 't7',
    description: 'Move in week email sent to customer',
    status: 'pending',
    ownerPair: null,
    dueDisplay: null,
  },
  {
    id: 't8',
    description: 'Customer survey sent',
    status: 'pending',
    ownerPair: null,
    dueDisplay: null,
  },
  {
    id: 't9',
    description: 'File audit for documents and services completed',
    status: 'pending',
    ownerPair: null,
    dueDisplay: null,
  },
  {
    id: 't10',
    description: 'Complete File',
    status: 'pending',
    ownerPair: null,
    dueDisplay: null,
  },
];

const DUMMY_SERVICES_AVAILABLE: DummyService[] = [
  {
    id: 's1',
    name: 'Real Estate',
    status: 'in-progress',
    progress: 40,
    iconSrc: supplyPartnerIconRealEstate,
    realEstateMilestoneScenario: 'standard',
  },
  {
    id: 's2',
    name: 'Mover',
    status: 'complete',
    iconSrc: supplyPartnerIconMover,
    genericMilestoneScenario: 'two_complete_one_pending',
  },
  {
    id: 's3',
    name: 'Professional Organizer',
    status: 'in-progress',
    progress: 10,
    iconSrc: supplyPartnerIconOrganizer,
    genericMilestoneScenario: 'referred_complete_others_pending',
  },
  {
    id: 's4',
    name: 'Market Ready',
    status: 'closed',
    iconSrc: supplyPartnerIconMarketReady,
    genericMilestoneScenario: 'declined_referred',
  },
];

const DUMMY_SERVICES_OPTOUT: DummyService[] = [
  { id: 'o1', name: 'Bridge Loan', status: 'opted-out', iconSrc: supplyPartnerIconBridgeLoan },
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
  iconSrc,
  iconSrcActive,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  iconSrc?: string;
  iconSrcActive?: string;
  label: string;
}) {
  const useImage = Boolean(iconSrc);
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
      {useImage ? (
        <img
          src={active && iconSrcActive ? iconSrcActive : (iconSrc as string)}
          alt=""
          width={18}
          height={18}
          className="shrink-0 object-contain"
          draggable={false}
        />
      ) : Icon ? (
        <Icon size={18} style={{ color: active ? '#FFFFFF' : '#307584', flexShrink: 0 }} />
      ) : null}
      {label}
    </button>
  );
}

export default function ResidentDetail() {
  const { residentId = '' } = useParams<{ residentId: string }>();
  const navigate = useNavigate();
  const { records, setRecords } = useDemoResidents();
  const [activeTab, setActiveTab] = useState<TabType>('resident');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedSupplyService, setSelectedSupplyService] = useState<DummyService | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  /** Demo: red dot on Open Chat until user taps (real app: unread from provider). */
  const [residentChatterUnread, setResidentChatterUnread] = useState(true);
  const [chatterDrawerOpen, setChatterDrawerOpen] = useState(false);
  const [residentEditPanelOpen, setResidentEditPanelOpen] = useState(false);
  const [residentEditToast, setResidentEditToast] = useState<BottomToastPayload | null>(null);
  const [milestoneStatusByKey, setMilestoneStatusByKey] = useState<Record<string, MilestoneWorkflowStatus>>({});
  const [milestonePopover, setMilestonePopover] = useState<{
    serviceId: string;
    rowId: string;
    title: string;
    anchorRect: DOMRect;
    currentWorkflow: MilestoneWorkflowStatus;
  } | null>(null);
  const [primaryContactInlineEditing, setPrimaryContactInlineEditing] = useState(false);
  const [primaryContactSaving, setPrimaryContactSaving] = useState(false);
  const [primaryContactDraft, setPrimaryContactDraft] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    relationship: '',
    notes: '',
  });
  const [primaryContactFormError, setPrimaryContactFormError] = useState<string | null>(null);
  const [secondaryInlineEditing, setSecondaryInlineEditing] = useState(false);
  const [secondaryDraft, setSecondaryDraft] = useState<ResidentInlineContactDraft>(() => emptyResidentContactDraft());
  const [secondarySaving, setSecondarySaving] = useState(false);
  const [secondaryFormError, setSecondaryFormError] = useState<string | null>(null);
  const [additionalEditingId, setAdditionalEditingId] = useState<string | null>(null);
  const [additionalDraft, setAdditionalDraft] = useState<ResidentInlineContactDraft>(() => emptyResidentContactDraft());
  const [additionalSaving, setAdditionalSaving] = useState(false);
  const [additionalFormError, setAdditionalFormError] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const milestoneTodayShort = useMemo(() => formatShortMonthDay(new Date()), []);

  const handleMilestonePopoverOpen = useCallback(
    (p: {
      serviceId: string;
      rowId: string;
      title: string;
      anchorRect: DOMRect;
      currentWorkflow: MilestoneWorkflowStatus;
    }) => {
      setMilestonePopover(p);
    },
    [],
  );

  const resident = useMemo(
    () => (residentId ? findDemoResidentInList(records, residentId) : null),
    [records, residentId],
  );

  const openEditResident = () => {
    if (!resident) return;
    setResidentEditPanelOpen(true);
  };

  const openPrimaryContactInlineEdit = useCallback(() => {
    if (!resident) return;
    const pc = resident.primary_contact;
    setPrimaryContactDraft({
      firstName: (pc?.first_name ?? '').trim(),
      lastName: (pc?.last_name ?? '').trim(),
      phone: (pc?.phone ?? '').trim(),
      email: (pc?.email ?? '').trim(),
      relationship: (pc?.relationship ?? '').trim(),
      notes: (pc?.notes ?? '').trim(),
    });
    setPrimaryContactFormError(null);
    setPrimaryContactInlineEditing(true);
  }, [resident]);

  useEffect(() => {
    if (activeTab !== 'resident-contacts') {
      setPrimaryContactInlineEditing(false);
      setPrimaryContactFormError(null);
      setSecondaryInlineEditing(false);
      setSecondaryFormError(null);
      setAdditionalEditingId(null);
      setAdditionalFormError(null);
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    if (activeTab !== 'resident-contacts' || !resident) return;
    if (isDemoContactEmpty(resident.primary_contact)) {
      openPrimaryContactInlineEdit();
    } else {
      setPrimaryContactInlineEditing(false);
    }
  }, [activeTab, resident, openPrimaryContactInlineEdit]);

  const primaryContactSaveEnabled = useMemo(
    () => isResidentContactDraftComplete(primaryContactDraft),
    [primaryContactDraft],
  );

  const savePrimaryContactInline = useCallback(() => {
    if (!resident) return;
    if (!isResidentContactDraftComplete(primaryContactDraft)) {
      setPrimaryContactFormError('All fields except Notes are required. Enter a valid email.');
      return;
    }
    const { firstName, lastName, phone, email, relationship, notes } = primaryContactDraft;
    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    const ph = phone.trim();
    setPrimaryContactFormError(null);
    setPrimaryContactSaving(true);
    try {
      const payload = {
        first_name: fn || null,
        last_name: ln || null,
        email: em || null,
        phone: ph || null,
        relationship: relationship.trim() || null,
        notes: notes.trim() || null,
      };
      setRecords((prev) =>
        prev.map((row) => {
          if (row.id !== resident.id) return row;
          return {
            ...row,
            primary_contact: {
              id: row.primary_contact?.id ?? `demo-pc-${resident.id}`,
              ...payload,
            },
          };
        }),
      );
      setPrimaryContactInlineEditing(false);
      setResidentEditToast({
        message: 'Primary contact saved',
        variant: 'success',
      });
    } finally {
      setPrimaryContactSaving(false);
    }
  }, [resident, primaryContactDraft, setRecords]);

  const openSecondaryContactInlineEdit = useCallback(() => {
    if (!resident) return;
    setSecondaryDraft(draftFromDemoContact(resident.secondary_contact));
    setSecondaryFormError(null);
    setSecondaryInlineEditing(true);
  }, [resident]);

  const secondaryContactSaveEnabled = useMemo(() => isResidentContactDraftComplete(secondaryDraft), [secondaryDraft]);

  const saveSecondaryContactInline = useCallback(() => {
    if (!resident || !isResidentContactDraftComplete(secondaryDraft)) {
      setSecondaryFormError('All fields except Notes are required. Enter a valid email.');
      return;
    }
    setSecondaryFormError(null);
    setSecondarySaving(true);
    try {
      const payload = {
        first_name: secondaryDraft.firstName.trim() || null,
        last_name: secondaryDraft.lastName.trim() || null,
        email: secondaryDraft.email.trim() || null,
        phone: secondaryDraft.phone.trim() || null,
        relationship: secondaryDraft.relationship.trim() || null,
        notes: secondaryDraft.notes.trim() || null,
      };
      setRecords((prev) =>
        prev.map((row) => {
          if (row.id !== resident.id) return row;
          return {
            ...row,
            secondary_contact: {
              id: row.secondary_contact?.id ?? `demo-sc-${resident.id}`,
              ...payload,
            },
          };
        }),
      );
      setSecondaryInlineEditing(false);
      setResidentEditToast({ message: 'Secondary contact saved', variant: 'success' });
    } finally {
      setSecondarySaving(false);
    }
  }, [resident, secondaryDraft, setRecords]);

  const additionalContactSaveEnabled = useMemo(
    () => isResidentContactDraftComplete(additionalDraft),
    [additionalDraft],
  );

  const saveAdditionalContactInline = useCallback(() => {
    if (!resident || !additionalEditingId || !isResidentContactDraftComplete(additionalDraft)) {
      setAdditionalFormError('All fields except Notes are required. Enter a valid email.');
      return;
    }
    setAdditionalFormError(null);
    setAdditionalSaving(true);
    const editId = additionalEditingId;
    try {
      const payload = {
        first_name: additionalDraft.firstName.trim() || null,
        last_name: additionalDraft.lastName.trim() || null,
        email: additionalDraft.email.trim() || null,
        phone: additionalDraft.phone.trim() || null,
        relationship: additionalDraft.relationship.trim() || null,
        notes: additionalDraft.notes.trim() || null,
      };
      setRecords((prev) =>
        prev.map((row) => {
          if (row.id !== resident.id) return row;
          return {
            ...row,
            additional_contacts: row.additional_contacts.map((c) =>
              c.id === editId ? { ...c, ...payload } : c,
            ),
          };
        }),
      );
      setAdditionalEditingId(null);
      setResidentEditToast({ message: 'Additional contact saved', variant: 'success' });
    } finally {
      setAdditionalSaving(false);
    }
  }, [resident, additionalEditingId, additionalDraft, setRecords]);

  const appendAdditionalContactRow = useCallback(() => {
    if (!resident) return;
    const newId = `demo-ac-${Date.now()}`;
    setRecords((prev) =>
      prev.map((row) =>
        row.id === resident.id
          ? {
              ...row,
              additional_contacts: [
                ...row.additional_contacts,
                {
                  id: newId,
                  first_name: null,
                  last_name: null,
                  email: null,
                  phone: null,
                  relationship: null,
                  notes: null,
                },
              ],
            }
          : row,
      ),
    );
    setAdditionalDraft(emptyResidentContactDraft());
    setAdditionalFormError(null);
    setAdditionalEditingId(newId);
  }, [resident, setRecords]);

  const cancelAdditionalContactEdit = useCallback(() => {
    if (!additionalEditingId) {
      setAdditionalEditingId(null);
      return;
    }
    const rid = resident?.id;
    const c = resident?.additional_contacts.find((x) => x.id === additionalEditingId);
    if (rid && c && isDemoContactEmpty(c)) {
      setRecords((prev) =>
        prev.map((row) =>
          row.id === rid
            ? {
                ...row,
                additional_contacts: row.additional_contacts.filter((x) => x.id !== additionalEditingId),
              }
            : row,
        ),
      );
    }
    setAdditionalEditingId(null);
    setAdditionalFormError(null);
  }, [resident, additionalEditingId, setRecords]);

  const openAdditionalContactInlineEdit = useCallback(
    (c: DemoResidentContact) => {
      setAdditionalDraft(draftFromDemoContact(c));
      setAdditionalFormError(null);
      setAdditionalEditingId(c.id);
    },
    [],
  );

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

  const calNow = new Date();
  const calYearNow = calNow.getFullYear();
  const calMonthNow = calNow.getMonth() + 1;
  const canGoCommunityUpdatesNext =
    selectedYear < calYearNow || (selectedYear === calYearNow && selectedMonth < calMonthNow);

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
      <TabButton
        active={activeTab === 'resident'}
        onClick={() => setActiveTab('resident')}
        iconSrc={tabIconProfile}
        iconSrcActive={tabIconProfileWhite}
        label="Resident"
      />
      <TabButton
        active={activeTab === 'supply-partners'}
        onClick={() => {
          setActiveTab('supply-partners');
          setSelectedSupplyService(null);
        }}
        iconSrc={tabIconLikeShapes}
        iconSrcActive={tabIconLikeShapesWhite}
        label="Supply Partners"
      />
      <TabButton
        active={activeTab === 'resident-contacts'}
        onClick={() => setActiveTab('resident-contacts')}
        iconSrc={tabIconProfile2User}
        iconSrcActive={tabIconProfile2UserWhite}
        label="Resident Contacts"
      />
    </div>
  );

  const renderTabPanelInner = () => {
    if (activeTab === 'resident') {
      return (
        <div>
          <h3 className="mb-4 text-left font-source-sans-3" style={{ ...contentSectionHeaderStyle, textAlign: 'left' }}>
            Community Updates
          </h3>
          <div className="mb-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={goPrevMonth}
              className="font-source-sans-3 flex items-center gap-1.5 transition-opacity hover:opacity-90"
              style={{ ...communityUpdatesNavButtonBaseStyle, color: communityUpdatesNavEnabledColor }}
            >
              <ChevronLeft size={18} style={{ color: communityUpdatesNavEnabledColor, flexShrink: 0 }} />
              Previous
            </button>
            <span className="flex-1 text-center font-source-sans-3" style={communityUpdatesMonthLabelStyle}>
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
            <button
              type="button"
              onClick={goNextMonth}
              disabled={!canGoCommunityUpdatesNext}
              aria-disabled={!canGoCommunityUpdatesNext}
              className={`font-source-sans-3 flex items-center gap-1.5 ${
                canGoCommunityUpdatesNext ? 'transition-opacity hover:opacity-90' : 'cursor-not-allowed'
              }`}
              style={{
                ...communityUpdatesNavButtonBaseStyle,
                color: canGoCommunityUpdatesNext ? communityUpdatesNavEnabledColor : communityUpdatesNavDisabledColor,
              }}
            >
              Next
              <ChevronRight
                size={18}
                style={{
                  color: canGoCommunityUpdatesNext ? communityUpdatesNavEnabledColor : communityUpdatesNavDisabledColor,
                  flexShrink: 0,
                }}
              />
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
        const isRealEstate = selectedSupplyService.id === 's1';
        if (isRealEstate) {
          const milestoneScenario = selectedSupplyService.realEstateMilestoneScenario ?? 'standard';
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
                  Real Estate Milestones
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
              <RealEstateMilestonesPanel
                scenario={milestoneScenario}
                serviceId={selectedSupplyService.id}
                milestoneStatusOverrides={milestoneStatusByKey}
                todayShort={milestoneTodayShort}
                onMilestonePopoverOpen={handleMilestonePopoverOpen}
              />
            </div>
          );
        }

        const genericScenario = selectedSupplyService.genericMilestoneScenario ?? 'two_complete_one_pending';
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
                {selectedSupplyService.name} Milestones
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
            <GenericServiceMilestonesPanel
              scenario={genericScenario}
              serviceId={selectedSupplyService.id}
              milestoneStatusOverrides={milestoneStatusByKey}
              todayShort={milestoneTodayShort}
              onMilestonePopoverOpen={handleMilestonePopoverOpen}
            />
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
                      <img
                        src={service.iconSrc}
                        alt=""
                        className="h-7 w-7 object-contain sm:h-8 sm:w-8"
                        draggable={false}
                      />
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
                    <img
                      src={service.iconSrc}
                      alt=""
                      className="h-7 w-7 object-contain opacity-90 sm:h-8 sm:w-8"
                      draggable={false}
                    />
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
    const sc = resident.secondary_contact;
    const additionals = resident.additional_contacts ?? [];

    const tealContactCardStyle: CSSProperties = {
      backgroundColor: RESIDENT_CONTACTS_SECTION_BG,
      borderRadius: 16,
      padding: 24,
    };
    const additionalContactCardStyle: CSSProperties = {
      backgroundColor: RESIDENT_CONTACTS_ADDITIONAL_BG,
      borderRadius: 16,
      padding: 24,
    };
    const addContactButtonStyle: CSSProperties = {
      height: 40,
      paddingLeft: 20,
      paddingRight: 20,
      borderRadius: 9999,
      backgroundColor: '#307584',
      fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
      fontWeight: 600,
      fontSize: 14,
      lineHeight: '20px',
      color: '#FFFFFF',
    };

    const contactFormActionCancelStyle: CSSProperties = {
      height: 48,
      padding: '10px 24px',
      borderRadius: 9999,
      border: '1px solid #83ACB5',
      backgroundColor: '#EAF1F3',
      fontWeight: 500,
      fontSize: 16,
      color: '#307584',
    };
    const contactFormActionSaveStyle: CSSProperties = {
      height: 48,
      padding: '10px 24px',
      borderRadius: 9999,
      backgroundColor: '#307584',
      fontWeight: 500,
      fontSize: 16,
      color: '#FFFFFF',
    };
    const contactFormActionSaveDisabledStyle: CSSProperties = {
      ...contactFormActionSaveStyle,
      backgroundColor: 'hsla(0, 0%, 96%, 1)',
      color: 'hsla(0, 0%, 64%, 1)',
    };

    const showPrimaryContactCancel = pc !== null && !isDemoContactEmpty(pc);

    const renderContactReadBody = (c: DemoResidentContact) => {
      const displayName = [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || '—';
      return (
        <div className="space-y-2">
          <p className="font-source-sans-3" style={primaryContactTextStyle}>
            {displayName}
          </p>
          {getTelHref(c.phone ?? '') ? (
            <a
              href={getTelHref(c.phone ?? '')}
              className="font-source-sans-3 block"
              style={{ ...primaryContactTextStyle, color: '#307584', textDecoration: 'underline' }}
            >
              {formatPhoneUS(c.phone ?? '')}
            </a>
          ) : (
            <p className="font-source-sans-3" style={primaryContactTextStyle}>
              {formatPhoneUS(c.phone ?? '')}
            </p>
          )}
          <a
            href={c.email ? `mailto:${c.email}` : '#'}
            className="font-source-sans-3 block"
            style={{ ...primaryContactTextStyle, color: c.email ? '#359689' : undefined }}
            onClick={(e) => !c.email && e.preventDefault()}
          >
            {c.email || '—'}
          </a>
          <p className="font-source-sans-3" style={primaryContactTextStyle}>
            {c.relationship || '—'}
          </p>
          <p className="mt-3 font-source-sans-3" style={primaryContactNotesStyle}>
            {(c.notes ?? '').trim() || '—'}
          </p>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="rounded-xl font-source-sans-3" style={tealContactCardStyle}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-left font-source-sans-3" style={residentContactsSectionHeaderStyle}>
              Primary Contact
            </h3>
            {!primaryContactInlineEditing ? (
              <button
                type="button"
                onClick={openPrimaryContactInlineEdit}
                className="rounded p-1 text-[#307584] transition-opacity hover:opacity-80"
                aria-label="Edit primary contact"
              >
                <Pencil size={18} strokeWidth={1.5} />
              </button>
            ) : null}
          </div>

          {primaryContactInlineEditing ? (
            <div>
              <ResidentContactInlineFormFields
                idPrefix="rd-pc"
                draft={primaryContactDraft}
                setDraft={setPrimaryContactDraft}
                disabled={primaryContactSaving}
              />
              {primaryContactFormError ? (
                <p className="mt-3 font-source-sans-3 text-sm text-red-600" role="alert">
                  {primaryContactFormError}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                {showPrimaryContactCancel ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPrimaryContactInlineEditing(false);
                      setPrimaryContactFormError(null);
                    }}
                    disabled={primaryContactSaving}
                    className="font-source-sans-3 transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={contactFormActionCancelStyle}
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={savePrimaryContactInline}
                  disabled={primaryContactSaving || !primaryContactSaveEnabled}
                  className={`font-source-sans-3 transition-opacity hover:opacity-90 ${
                    primaryContactSaving || !primaryContactSaveEnabled ? 'cursor-not-allowed' : ''
                  }`}
                  style={
                    primaryContactSaving || !primaryContactSaveEnabled
                      ? contactFormActionSaveDisabledStyle
                      : contactFormActionSaveStyle
                  }
                >
                  {primaryContactSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : pc ? (
            renderContactReadBody(pc)
          ) : (
            <p className="font-source-sans-3 text-gray-600">No primary contact on file. Use the edit button to add one.</p>
          )}
        </div>

        <div className="rounded-xl font-source-sans-3" style={tealContactCardStyle}>
          <div
            className={`flex flex-wrap items-center justify-between gap-4${secondaryInlineEditing || sc ? ' mb-4' : ''}`}
          >
            <h3 className="text-left font-source-sans-3" style={residentContactsSectionHeaderStyle}>
              Secondary Contact
            </h3>
            {!secondaryInlineEditing && sc ? (
              <button
                type="button"
                onClick={openSecondaryContactInlineEdit}
                className="rounded p-1 text-[#307584] transition-opacity hover:opacity-80"
                aria-label="Edit secondary contact"
              >
                <Pencil size={18} strokeWidth={1.5} />
              </button>
            ) : null}
            {!secondaryInlineEditing && !sc ? (
              <button
                type="button"
                onClick={openSecondaryContactInlineEdit}
                className="shrink-0 transition-opacity hover:opacity-90"
                style={addContactButtonStyle}
              >
                Add
              </button>
            ) : null}
          </div>
          {secondaryInlineEditing ? (
            <div>
              <ResidentContactInlineFormFields
                idPrefix="rd-sc"
                draft={secondaryDraft}
                setDraft={setSecondaryDraft}
                disabled={secondarySaving}
              />
              {secondaryFormError ? (
                <p className="mt-3 font-source-sans-3 text-sm text-red-600" role="alert">
                  {secondaryFormError}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSecondaryInlineEditing(false);
                    setSecondaryFormError(null);
                  }}
                  disabled={secondarySaving}
                  className="font-source-sans-3 transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={contactFormActionCancelStyle}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveSecondaryContactInline}
                  disabled={secondarySaving || !secondaryContactSaveEnabled}
                  className={`font-source-sans-3 transition-opacity hover:opacity-90 ${
                    secondarySaving || !secondaryContactSaveEnabled ? 'cursor-not-allowed' : ''
                  }`}
                  style={
                    secondarySaving || !secondaryContactSaveEnabled
                      ? contactFormActionSaveDisabledStyle
                      : contactFormActionSaveStyle
                  }
                >
                  {secondarySaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : sc ? (
            renderContactReadBody(sc)
          ) : null}
        </div>

        {additionals.map((ac) => {
          const showAdditionalForm = additionalEditingId === ac.id;
          return (
            <div key={ac.id} className="rounded-xl font-source-sans-3" style={additionalContactCardStyle}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-left font-source-sans-3" style={residentContactsSectionHeaderStyle}>
                  Additional Contact
                </h3>
                {!showAdditionalForm && !isDemoContactEmpty(ac) ? (
                  <button
                    type="button"
                    onClick={() => openAdditionalContactInlineEdit(ac)}
                    className="rounded p-1 text-[#307584] transition-opacity hover:opacity-80"
                    aria-label="Edit additional contact"
                  >
                    <Pencil size={18} strokeWidth={1.5} />
                  </button>
                ) : null}
              </div>
              {showAdditionalForm ? (
                <div>
                  <ResidentContactInlineFormFields
                    idPrefix={`rd-ac-${ac.id}`}
                    draft={additionalDraft}
                    setDraft={setAdditionalDraft}
                    disabled={additionalSaving}
                  />
                  {additionalFormError ? (
                    <p className="mt-3 font-source-sans-3 text-sm text-red-600" role="alert">
                      {additionalFormError}
                    </p>
                  ) : null}
                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={cancelAdditionalContactEdit}
                      disabled={additionalSaving}
                      className="font-source-sans-3 transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={contactFormActionCancelStyle}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveAdditionalContactInline}
                      disabled={additionalSaving || !additionalContactSaveEnabled}
                      className={`font-source-sans-3 transition-opacity hover:opacity-90 ${
                        additionalSaving || !additionalContactSaveEnabled ? 'cursor-not-allowed' : ''
                      }`}
                      style={
                        additionalSaving || !additionalContactSaveEnabled
                          ? contactFormActionSaveDisabledStyle
                          : contactFormActionSaveStyle
                      }
                    >
                      {additionalSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                renderContactReadBody(ac)
              )}
            </div>
          );
        })}

        <div
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl font-source-sans-3"
          style={additionalContactCardStyle}
        >
          <h3 className="text-left font-source-sans-3" style={residentContactsSectionHeaderStyle}>
            Additional Contact
          </h3>
          <button
            type="button"
            onClick={appendAdditionalContactRow}
            className="shrink-0 transition-opacity hover:opacity-90"
            style={addContactButtonStyle}
          >
            Add
          </button>
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
      {/* Negative margin only when tabs sit beside the left column (xl); otherwise it overlaps Notes' shadow */}
      <div
        className="relative mt-0 flex-shrink-0 bg-[hsla(193,27%,94%,1)] xl:-mt-6"
        style={{ width: '100%', minHeight: 48 }}
      >
        {renderTabStrip()}
        <div
          className="flex flex-col overflow-hidden rounded-2xl"
          style={{ marginTop: 48, backgroundColor: '#FFFFFF', borderRadius: 16 }}
        >
          <div className="flex flex-col" style={communityUpdatesContentStyle}>
            {renderTabPanelInner()}
          </div>
        </div>
      </div>
      {activeTab === 'resident' && renderResidentChatterCard()}
      {activeTab === 'resident' && (
        <div className="overflow-hidden rounded-2xl" style={residentTasksContainerStyle}>
          <h3 className="mb-6 text-left font-source-sans-3" style={{ ...contentSectionHeaderStyle, textAlign: 'left' }}>
            Resident Tasks
          </h3>
          {!isActive ? (
            <p className="py-4 font-source-sans-3 text-gray-500">
              Resident tasks are added when the resident status is set to Active.
            </p>
          ) : (
            <>
              <div
                className="mb-0 grid gap-x-6 gap-y-0 border-b pb-3 font-source-sans-3"
                style={{
                  gridTemplateColumns: RESIDENT_TASKS_GRID_COLUMNS,
                  borderColor: taskListBorderColor,
                }}
              >
                <div className="flex items-end" style={residentTasksColumnHeaderStyle}>
                  Status
                </div>
                <div aria-hidden />
                <div className="flex items-end justify-end" style={residentTasksColumnHeaderRightStyle}>
                  Owner
                </div>
                <div className="flex items-end justify-end" style={residentTasksColumnHeaderRightStyle}>
                  Due On
                </div>
              </div>
              <div>
                {DUMMY_TASKS.map((task, taskIndex) => (
                  <div
                    key={task.id}
                    className="grid cursor-default items-center gap-x-6 gap-y-0 py-4 font-source-sans-3"
                    style={{
                      gridTemplateColumns: RESIDENT_TASKS_GRID_COLUMNS,
                      borderBottom:
                        taskIndex < DUMMY_TASKS.length - 1 ? `1px solid ${taskListBorderColor}` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-start self-center pt-0.5">
                      {getTaskStatusIcon(task.status)}
                    </div>
                    <div className="min-w-0 self-center pr-1">
                      <span
                        className="block truncate font-source-sans-3"
                        style={residentTasksRowTextStyle}
                        title={task.description}
                      >
                        {task.description}
                      </span>
                    </div>
                    <div className="min-w-0 self-center">
                      <ResidentTaskOwnerPair pair={task.ownerPair === undefined ? null : task.ownerPair} />
                    </div>
                    <div className="flex min-w-0 items-center justify-end self-center">
                      <span
                        className="shrink-0 text-right tabular-nums"
                        style={task.dueDisplay ? residentTasksDueActiveStyle : residentTasksDueInactiveStyle}
                      >
                        {task.dueDisplay ?? '--'}
                      </span>
                    </div>
                  </div>
                ))}
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
    <div className="flex w-full min-w-0 flex-col pb-28 max-lg:pb-32">
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
      {/* Ensures scroll past last card: content-sized page, not flex-stretched to viewport */}
      <div className="h-12 shrink-0 max-lg:h-16" aria-hidden />
    </div>
    <ResidentChatterDrawer
      open={chatterDrawerOpen}
      onClose={() => setChatterDrawerOpen(false)}
      messageRecipientName={chatterRecipientName}
    />
    {resident && (
      <ResidentFormSlidePanel
        open={residentEditPanelOpen}
        onClose={() => setResidentEditPanelOpen(false)}
        editingResidentId={residentEditPanelOpen ? resident.id : null}
        onSaveSuccess={setResidentEditToast}
      />
    )}
    {residentEditToast && (
      <BottomToast
        message={residentEditToast.message}
        variant={residentEditToast.variant}
        onDismiss={() => setResidentEditToast(null)}
      />
    )}
    <MilestoneStatusPopover
      open={Boolean(milestonePopover)}
      anchorRect={milestonePopover?.anchorRect ?? null}
      current={milestonePopover?.currentWorkflow ?? 'todo'}
      onClose={() => setMilestonePopover(null)}
      onSelect={(status) => {
        if (!milestonePopover) return;
        const key = `${milestonePopover.serviceId}:${milestonePopover.rowId}`;
        setMilestoneStatusByKey((prev) => ({ ...prev, [key]: status }));
        setMilestonePopover(null);
      }}
    />
    </>
  );
}
