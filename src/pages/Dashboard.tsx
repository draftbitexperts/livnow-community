import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Info,
  Phone,
  Mail,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
} from 'lucide-react';
import moreSquare from '../../LivNow Icons/more-square.png';
import playCircle from '../../LivNow Icons/play-circle.png';
import pauseCircle from '../../LivNow Icons/pause-circle.png';
import clockIcon from '../../LivNow Icons/clock.png';
import clipboardClose from '../../LivNow Icons/clipboard-close.png';
import tickCircle from '../../LivNow Icons/tick-circle.png';
import calendarIcon from '../../LivNow Icons/calendar.png';
import RequestEventDrawer from '@/components/RequestEventDrawer';

function Section({
  title,
  children,
  headerRight,
  className = '',
  headerClassName = 'px-5 py-4',
  bodyClassName = 'p-5',
}: {
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      <div className={`flex items-center justify-between ${headerClassName}`}>
        <h3 className="text-lg font-semibold text-gray-900 font-source-sans-3">{title}</h3>
        {headerRight}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

type AtAGlanceDetailRow = { resident: string; community: string };

const AT_A_GLANCE_DETAIL_PLACEHOLDER: AtAGlanceDetailRow = {
  resident: '[Resident Name]',
  community: '[Community]',
};

/** Demo rows per metric; TODO: API */
function atAGlanceDemoRows(count = 8): AtAGlanceDetailRow[] {
  return Array.from({ length: count }, () => ({ ...AT_A_GLANCE_DETAIL_PLACEHOLDER }));
}

type ReferralDetailRow = { name: string; date: string };

const REFERRAL_LIST_PAGE_SIZE = 6;

function demoReferralRows(monthMM: string, total: number): ReferralDetailRow[] {
  const first = ['Patricia', 'John', 'Maria', 'James', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'Robert'];
  const last = ['Beyer', 'Battey', 'Chen', 'Nguyen', 'Patel', 'Garcia', 'Kim', 'Brown', 'Lee', 'Wilson'];
  return Array.from({ length: total }, (_, i) => {
    const fi = (i + monthMM.charCodeAt(1)) % first.length;
    const li = (i * 3) % last.length;
    const day = String((i % 27) + 1).padStart(2, '0');
    return { name: `${first[fi]} ${last[li]}`, date: `2026-${monthMM}-${day}` };
  });
}

const residentDetailPopoverRowBase =
  'w-full items-center text-left text-sm text-inherit no-underline transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)]/30';

const residentDetailPopoverLayouts = {
  /** Name | community — space-between */
  glance: 'flex justify-between gap-3',
  /** Name | fixed date column | chevron — dates align vertically */
  referral:
    'grid grid-cols-[minmax(0,1fr)_6.25rem_1.25rem] items-center gap-x-3',
} as const;

function ResidentPopoverRowLink({
  residentKey,
  className,
  layout = 'glance',
  children,
}: {
  residentKey: string;
  className?: string;
  layout?: keyof typeof residentDetailPopoverLayouts;
  children: ReactNode;
}) {
  const layoutClass = residentDetailPopoverLayouts[layout];
  const combined = [residentDetailPopoverRowBase, layoutClass, className].filter(Boolean).join(' ');
  return (
    <Link
      to={`/residents/${encodeURIComponent(residentKey)}`}
      title="Go to resident detail page"
      className={combined}
    >
      {children}
    </Link>
  );
}

/** Demo months, oldest → newest (right = current); TODO: API */
const REFERRAL_MONTHS_ALL = [
  { key: '2025-10', titleLabel: 'October 2025 Referrals', count: 31, rows: demoReferralRows('10', 12) },
  { key: '2025-11', titleLabel: 'November 2025 Referrals', count: 14, rows: demoReferralRows('11', 12) },
  { key: '2025-12', titleLabel: 'December 2025 Referrals', count: 27, rows: demoReferralRows('12', 12) },
  { key: '2026-01', titleLabel: 'January 2026 Referrals', count: 52, rows: demoReferralRows('01', 12) },
  { key: '2026-02', titleLabel: 'February 2026 Referrals', count: 126, rows: demoReferralRows('02', 14) },
];

/** Start index so the rightmost card is the latest month (slide Previous = one month older). */
const REFERRAL_CAROUSEL_MAX_START = Math.max(0, REFERRAL_MONTHS_ALL.length - 3);

function ReferralMonthCard({
  cardKey,
  titleLabel,
  count,
  rows,
  isOpen,
  onToggle,
  onClose,
}: {
  cardKey: string;
  titleLabel: string;
  count: number;
  rows: ReferralDetailRow[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [listPage, setListPage] = useState(0);

  useEffect(() => {
    if (isOpen) setListPage(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [isOpen, onClose]);

  const totalListPages = Math.max(1, Math.ceil(rows.length / REFERRAL_LIST_PAGE_SIZE));
  const pageRows = rows.slice(
    listPage * REFERRAL_LIST_PAGE_SIZE,
    (listPage + 1) * REFERRAL_LIST_PAGE_SIZE,
  );

  return (
    <div
      ref={rootRef}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-5 text-center transition-shadow ${
        isOpen ? 'z-30 shadow-md ring-1 ring-[var(--primary)]/20' : 'hover:shadow-md'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
        aria-expanded={isOpen}
        aria-controls={`referral-detail-${cardKey}`}
        id={`referral-trigger-${cardKey}`}
      >
        <span className="inline-flex items-center justify-center gap-1 font-source-sans-3 text-xs font-medium text-[var(--primary)]">
          <span>{titleLabel}</span>
          <span
            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-300 text-[10px] font-semibold leading-none text-gray-500"
            aria-hidden
          >
            i
          </span>
        </span>
        <span className="font-source-sans-3 text-3xl font-bold leading-none text-[var(--primary)]">{count}</span>
      </button>

      {isOpen && (
        <div
          id={`referral-detail-${cardKey}`}
          role="dialog"
          aria-labelledby={`referral-trigger-${cardKey}`}
          className="referral-detail-popover absolute left-1/2 top-[calc(100%-0.25rem)] z-40 mt-0 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-gray-200 bg-white text-left shadow-lg"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-900 font-source-sans-3">{titleLabel}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-[var(--primary)] transition-colors hover:bg-gray-50"
              aria-label="Close list"
            >
              <ChevronDown size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
          <ul className="at-a-glance-detail-scroll max-h-52 overflow-y-auto py-0 font-source-sans-3">
            {pageRows.map((row, idx) => (
              <li key={`${listPage}-${idx}`} className="border-b border-gray-100 last:border-b-0">
                <ResidentPopoverRowLink residentKey={row.name} layout="referral" className="px-4 py-3">
                  <span className="min-w-0 truncate font-semibold text-gray-900">{row.name}</span>
                  <span className="shrink-0 text-right text-sm font-medium tabular-nums text-[var(--primary)]">
                    {row.date}
                  </span>
                  <ChevronRight size={18} className="shrink-0 justify-self-end text-gray-500" strokeWidth={2} aria-hidden />
                </ResidentPopoverRowLink>
              </li>
            ))}
          </ul>
          {rows.length > REFERRAL_LIST_PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 font-source-sans-3 text-sm">
              <button
                type="button"
                disabled={listPage <= 0}
                onClick={() => setListPage((p) => Math.max(0, p - 1))}
                className={`inline-flex items-center gap-1 font-medium ${
                  listPage <= 0 ? 'cursor-default text-gray-400' : 'text-[var(--primary)] hover:opacity-80'
                }`}
              >
                <ChevronLeft size={16} strokeWidth={2} aria-hidden />
                Previous
              </button>
              <button
                type="button"
                disabled={listPage >= totalListPages - 1}
                onClick={() => setListPage((p) => Math.min(totalListPages - 1, p + 1))}
                className={`inline-flex items-center gap-1 font-medium ${
                  listPage >= totalListPages - 1
                    ? 'cursor-default text-gray-400'
                    : 'text-[var(--primary)] hover:opacity-80'
                }`}
              >
                Next
                <ChevronRight size={16} strokeWidth={2} aria-hidden />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusCard({
  label,
  count,
  iconSrc,
  detailRows,
  isDetailOpen,
  onToggleDetail,
  onCloseDetail,
}: {
  label: string;
  count: number;
  iconSrc: string;
  detailRows: AtAGlanceDetailRow[];
  isDetailOpen: boolean;
  onToggleDetail: () => void;
  onCloseDetail: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDetailOpen) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) {
        onCloseDetail();
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [isDetailOpen, onCloseDetail]);

  return (
    <div
      ref={rootRef}
      className={`relative flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow ${isDetailOpen ? 'z-30' : ''}`}
    >
      <img src={iconSrc} alt="" className="h-10 w-10 object-contain" />
      <div className="flex items-center justify-center gap-1 flex-wrap">
        <span className="text-sm font-medium font-source-sans-3 text-[var(--primary)]">{label}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleDetail();
          }}
          className="inline-flex shrink-0 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[var(--primary)]"
          aria-expanded={isDetailOpen}
          aria-label={`${label} details`}
        >
          <Info size={14} strokeWidth={2} aria-hidden />
        </button>
      </div>
      <span className="text-3xl font-bold font-source-sans-3 text-[var(--primary)]">{count}</span>

      {isDetailOpen && (
        <div
          className="at-a-glance-detail-popover absolute left-1/2 top-[calc(100%-0.25rem)] z-40 mt-0 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-gray-200 bg-white text-left shadow-lg"
          role="dialog"
          aria-label={label}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5">
            <span className="text-sm font-semibold text-[var(--primary)] font-source-sans-3">{label}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCloseDetail();
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
              aria-label="Close list"
            >
              <ChevronDown size={16} strokeWidth={2} />
            </button>
          </div>
          <ul className="at-a-glance-detail-scroll max-h-48 overflow-y-auto py-1 font-source-sans-3">
            {detailRows.map((row, idx) => (
              <li key={idx} className="border-b border-gray-100 last:border-b-0">
                <ResidentPopoverRowLink residentKey={row.resident} className="px-3 py-2.5">
                  <span className="min-w-0 truncate text-gray-900">{row.resident}</span>
                  <span className="shrink-0 text-gray-600">{row.community}</span>
                </ResidentPopoverRowLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function moveInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

function MoveItem({
  name,
  moveType,
  date,
  isLast,
}: {
  name: string;
  moveType: string;
  date: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3.5 font-source-sans-3 ${
        !isLast ? 'border-b border-gray-200' : ''
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase text-white"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {moveInitials(name)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-sm font-normal text-gray-500">{moveType}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm italic text-gray-700">{date}</span>
        <ChevronRight size={18} className="text-gray-500" strokeWidth={2} aria-hidden />
      </div>
    </div>
  );
}

function UpdateItem({
  name,
  date,
  description,
  community,
  isLast,
}: {
  name: string;
  date: string;
  description: string;
  community: string;
  isLast?: boolean;
}) {
  const descRef = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);
  const [descHover, setDescHover] = useState(false);

  useLayoutEffect(() => {
    const el = descRef.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight + 1);
  }, [description]);

  return (
    <div
      className={`flex items-stretch gap-3 px-4 py-3.5 font-source-sans-3 ${
        !isLast ? 'border-b border-gray-200' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-bold text-gray-900">{name}</p>
          <span className="shrink-0 text-sm italic text-gray-500">{date}</span>
        </div>
        <div
          className="relative mt-1"
          onMouseEnter={() => isClamped && setDescHover(true)}
          onMouseLeave={() => setDescHover(false)}
        >
          <p
            ref={descRef}
            className={`text-sm leading-snug text-gray-900 line-clamp-2 ${
              isClamped ? 'cursor-default' : ''
            }`}
          >
            {description}
          </p>
          {descHover && isClamped && (
            <div
              className="absolute left-0 top-full z-50 -mt-0.5 max-w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-lg"
              role="tooltip"
            >
              <p className="text-sm font-bold text-gray-900">Community updates description</p>
              <p className="mt-1 text-sm font-normal text-gray-700">{description}</p>
            </div>
          )}
        </div>
        <p className="mt-1.5 text-sm font-medium text-[var(--primary)]">{community}</p>
      </div>
      <div className="flex shrink-0 items-center self-center">
        <ChevronRight size={18} className="text-gray-500" strokeWidth={2} aria-hidden />
      </div>
    </div>
  );
}

function TeamMember({
  name,
  role,
  email,
  phone,
}: {
  name: string;
  role: string;
  email: string;
  phone: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase text-white"
        style={{ backgroundColor: 'var(--primary)' }}
        aria-hidden
      >
        {moveInitials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className="mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-source-sans-3"
          style={{
            backgroundColor: 'hsla(173, 38%, 91%, 1)',
            color: 'hsla(191, 47%, 35%, 1)',
          }}
        >
          {role}
        </span>
        <p className="text-sm font-medium text-gray-900 font-source-sans-3">[{name}]</p>
        <a href={`mailto:${email}`} className="text-xs text-teal-600 hover:underline font-source-sans-3 flex items-center gap-1">
          <Mail size={12} />
          {email}
        </a>
        <p className="text-xs text-gray-500 font-source-sans-3 flex items-center gap-1 mt-0.5">
          <Phone size={12} />
          {phone}
        </p>
      </div>
    </div>
  );
}

const CALENDAR_BANNER_BG = 'hsla(191, 47%, 35%, 0.08)';
const WEBINAR_CELL_BG = 'hsla(191, 47%, 92%, 1)';
/** Hover card for webinar (light teal) days */
const WEBINAR_TOOLTIP_BG = 'hsla(191, 42%, 94%, 1)';
const WEBINAR_TOOLTIP_TEXT = 'hsla(191, 47%, 30%, 1)';

function buildMonthGrid(year: number, month0: number): { day: number; inMonth: boolean }[] {
  const first = new Date(year, month0, 1);
  const lastDay = new Date(year, month0 + 1, 0).getDate();
  const prevLast = new Date(year, month0, 0).getDate();
  const sun0 = first.getDay();
  const mondayFirstSlots = (sun0 + 6) % 7;
  const cells: { day: number; inMonth: boolean }[] = [];
  for (let i = 0; i < mondayFirstSlots; i++) {
    cells.push({ day: prevLast - mondayFirstSlots + i + 1, inMonth: false });
  }
  for (let d = 1; d <= lastDay; d++) {
    cells.push({ day: d, inMonth: true });
  }
  let n = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: n++, inMonth: false });
  }
  return cells;
}

function getInitialCalendarView(): { year: number; month0: number } {
  const t = new Date();
  return { year: t.getFullYear(), month0: t.getMonth() };
}

function addCalendarMonths(year: number, month0: number, delta: number): { year: number; month0: number } {
  const d = new Date(year, month0 + delta, 1);
  return { year: d.getFullYear(), month0: d.getMonth() };
}

type CalendarEventRow = {
  community: string;
  title: string;
  /** Shown after "M/D at …" */
  clock: string;
  type: 'in-person' | 'webinar';
};

/** Demo events by day-of-month; TODO: replace with API keyed by full date */
const DEMO_EVENTS_BY_DAY: Record<number, CalendarEventRow[]> = {
  7: [
    {
      community: '[Community Name]',
      title: '[Event name listed here]',
      clock: '2:30pm',
      type: 'in-person',
    },
    {
      community: '[Community Name]',
      title: '[Event name listed here]',
      clock: '4:00pm',
      type: 'webinar',
    },
  ],
  8: [
    {
      community: '[Community Name]',
      title: '[Event name listed here]',
      clock: '2:30 - 3:30pm',
      type: 'webinar',
    },
  ],
  12: [
    {
      community: '[Community Name]',
      title: '[Event name listed here]',
      clock: '10:00am',
      type: 'in-person',
    },
  ],
  23: [
    {
      community: '[Community Name]',
      title: '[Event name listed here]',
      clock: '3:00pm',
      type: 'in-person',
    },
  ],
  29: [
    {
      community: '[Community Name]',
      title: '[Event name listed here]',
      clock: '1:00pm',
      type: 'webinar',
    },
  ],
};

function demoEventsForDay(day: number): CalendarEventRow[] {
  return DEMO_EVENTS_BY_DAY[day] ?? [];
}

function cellUsesInPersonStyle(events: CalendarEventRow[]): boolean {
  return events.some((e) => e.type === 'in-person');
}

function formatEventWhen(month0: number, day: number, clock: string): string {
  return `${month0 + 1}/${day} at ${clock}`;
}

function UpcomingEventsCalendar() {
  const [{ year: viewYear, month0: viewMonth0 }, setView] = useState(getInitialCalendarView);

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayDate = today.getDate();
  const isViewingCurrentMonth = viewYear === todayY && viewMonth0 === todayM;

  const monthLabel = new Date(viewYear, viewMonth0, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const cells = buildMonthGrid(viewYear, viewMonth0);
  const monthlyCallLabel = `Monthly Call: ${viewMonth0 + 1}/8 at 4:00pm`;

  const navBtnClass =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50';

  const goPrevMonth = () => {
    setView((v) => addCalendarMonths(v.year, v.month0, -1));
  };
  const goNextMonth = () => {
    setView((v) => addCalendarMonths(v.year, v.month0, 1));
  };
  const goPrevYear = () => {
    setView((v) => ({ year: v.year - 1, month0: v.month0 }));
  };
  const goNextYear = () => {
    setView((v) => ({ year: v.year + 1, month0: v.month0 }));
  };

  return (
    <div className="font-source-sans-3">
      <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex justify-start gap-1">
          <button type="button" className={navBtnClass} aria-label="Previous year" onClick={goPrevYear}>
            <ChevronsLeft size={16} strokeWidth={2} />
          </button>
          <button type="button" className={navBtnClass} aria-label="Previous month" onClick={goPrevMonth}>
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
        </div>
        <h4 className="px-2 text-center text-base font-bold text-gray-900 whitespace-nowrap">{monthLabel}</h4>
        <div className="flex justify-end gap-1">
          <button type="button" className={navBtnClass} aria-label="Next month" onClick={goNextMonth}>
            <ChevronRight size={16} strokeWidth={2} />
          </button>
          <button type="button" className={navBtnClass} aria-label="Next year" onClick={goNextYear}>
            <ChevronsRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        className="mb-3 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-[var(--primary)]"
        style={{ backgroundColor: CALENDAR_BANNER_BG }}
      >
        {monthlyCallLabel}
      </div>

      <div className="relative">
        <div className="grid grid-cols-7 gap-x-1 gap-y-0 text-center text-xs sm:text-sm">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
            <div key={d} className="pb-1 pt-0 font-medium text-gray-500">
              {d}
            </div>
          ))}
          {cells.map((cell, i) => {
            const { day, inMonth } = cell;
            const isToday = inMonth && isViewingCurrentMonth && day === todayDate;
            const events = inMonth ? demoEventsForDay(day) : [];
            const hasEvents = events.length > 0;
            const useInPersonCell = hasEvents && cellUsesInPersonStyle(events);
            const webinarOnlyCell = hasEvents && !useInPersonCell;

            const todayRing = isToday ? 'ring-2 ring-offset-1 ring-[var(--primary)] ring-offset-white' : '';

            let cellInner: ReactNode;

            if (hasEvents && useInPersonCell) {
              cellInner = (
                <div className="group relative inline-flex flex-col items-center">
                  <span
                    className={`relative z-10 flex h-8 w-8 cursor-default items-center justify-center rounded-md text-sm font-semibold text-white sm:h-9 sm:w-9 ${todayRing} bg-[var(--primary)]`}
                  >
                    {day}
                  </span>
                  {/* Hover bridge: no layout impact; pointer-events only while group hovered */}
                  <div
                    className="pointer-events-none absolute left-1/2 top-full z-[299] h-10 w-20 max-w-[min(100%,6rem)] -translate-x-1/2 group-hover:pointer-events-auto"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute left-1/2 top-[calc(100%-10px)] z-[300] w-[min(100vw-2rem,17rem)] max-w-xs -translate-x-1/2 pt-3 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 sm:w-64"
                    role="presentation"
                  >
                    <div
                      className="rounded-xl bg-[var(--primary)] px-3 py-3 text-left text-sm text-white shadow-xl"
                      role="listbox"
                      aria-label={`Events on ${viewMonth0 + 1}/${day}`}
                    >
                      {events.map((ev, idx) => (
                        <Fragment key={idx}>
                          {idx > 0 && <hr className="my-3 border-white/40" />}
                          <button
                            type="button"
                            className="w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/15 focus:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                            onClick={() => {
                              // TODO: navigate to event detail
                            }}
                          >
                            <p className="text-xs font-normal text-white/90">{ev.community}</p>
                            <p className="mt-1 text-sm font-bold">{ev.title}</p>
                            <p className="mt-2 text-sm font-normal">
                              {formatEventWhen(viewMonth0, day, ev.clock)}
                            </p>
                            <p className="mt-2 text-sm font-bold">
                              {ev.type === 'in-person' ? 'In Person' : 'Webinar'}
                            </p>
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              );
            } else if (hasEvents && webinarOnlyCell) {
              cellInner = (
                <div className="group relative inline-flex flex-col items-center">
                  <span
                    className={`relative z-10 flex h-8 w-8 cursor-default items-center justify-center rounded-md text-sm font-semibold text-[var(--primary)] sm:h-9 sm:w-9 ${todayRing}`}
                    style={{ backgroundColor: WEBINAR_CELL_BG }}
                  >
                    {day}
                  </span>
                  <div
                    className="pointer-events-none absolute left-1/2 top-full z-[299] h-10 w-20 max-w-[min(100%,6rem)] -translate-x-1/2 group-hover:pointer-events-auto"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute left-1/2 top-[calc(100%-10px)] z-[300] w-[min(100vw-2rem,17rem)] max-w-xs -translate-x-1/2 pt-3 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 sm:w-64"
                    role="presentation"
                  >
                    <div
                      className="rounded-2xl px-3 py-3 text-left text-sm shadow-md"
                      style={{
                        backgroundColor: WEBINAR_TOOLTIP_BG,
                        color: WEBINAR_TOOLTIP_TEXT,
                      }}
                      role="listbox"
                      aria-label={`Events on ${viewMonth0 + 1}/${day}`}
                    >
                      {events.map((ev, idx) => (
                        <Fragment key={idx}>
                          {idx > 0 && (
                            <hr
                              className="my-3 border-t"
                              style={{ borderColor: 'hsla(191, 47%, 35%, 0.2)' }}
                            />
                          )}
                          <button
                            type="button"
                            className="w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-[hsla(191,47%,35%,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
                            onClick={() => {
                              // TODO: navigate to event detail
                            }}
                          >
                            <p className="text-xs font-normal">{ev.community}</p>
                            <p className="mt-1 text-sm font-semibold">{ev.title}</p>
                            <p className="mt-2 text-sm font-normal">
                              {formatEventWhen(viewMonth0, day, ev.clock)}
                            </p>
                            <p className="mt-2 text-sm font-bold">
                              {ev.type === 'in-person' ? 'In Person' : 'Webinar'}
                            </p>
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              );
            } else {
              cellInner = (
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-sm sm:h-9 sm:w-9 ${todayRing} ${
                    !inMonth ? 'text-gray-300' : 'font-normal text-gray-800'
                  }`}
                >
                  {day}
                </span>
              );
            }

            return (
              <div
                key={i}
                className="relative z-[1] flex min-h-[2.25rem] items-center justify-center sm:min-h-[2.5rem] hover:z-[200]"
              >
                {cellInner}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-6 text-sm text-gray-800">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-sm bg-[var(--primary)]" aria-hidden />
          In Person
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: WEBINAR_CELL_BG }} aria-hidden />
          Webinar
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [requestEventOpen, setRequestEventOpen] = useState(false);
  const [atAGlanceOpenLabel, setAtAGlanceOpenLabel] = useState<string | null>(null);
  const [referralOpenKey, setReferralOpenKey] = useState<string | null>(null);
  const [referralCarouselIndex, setReferralCarouselIndex] = useState(REFERRAL_CAROUSEL_MAX_START);

  const closeAtAGlanceDetail = useCallback(() => setAtAGlanceOpenLabel(null), []);
  const toggleAtAGlanceDetail = useCallback((label: string) => {
    setAtAGlanceOpenLabel((prev) => (prev === label ? null : label));
  }, []);

  const closeReferralDetail = useCallback(() => setReferralOpenKey(null), []);
  const toggleReferralDetail = useCallback((key: string) => {
    setReferralOpenKey((prev) => (prev === key ? null : key));
  }, []);

  const referralWindow = useMemo(
    () => REFERRAL_MONTHS_ALL.slice(referralCarouselIndex, referralCarouselIndex + 3),
    [referralCarouselIndex],
  );
  const referralCanPrev = referralCarouselIndex > 0;
  const referralCanNext = referralCarouselIndex < REFERRAL_CAROUSEL_MAX_START;

  // TODO: Replace with actual API data
  const statusCards = [
    { label: 'Pending Files', count: 5, iconSrc: moreSquare },
    { label: 'Active Files', count: 32, iconSrc: playCircle },
    { label: 'On Hold Files', count: 2, iconSrc: pauseCircle },
    { label: 'Waitlisted Files', count: 12, iconSrc: clockIcon },
    { label: 'Canceled Files', count: 28, iconSrc: clipboardClose },
    { label: 'Completed Files', count: 5, iconSrc: tickCircle },
  ];

  const upcomingMoves = [
    { name: 'First Last', moveType: 'Move Type', date: '12/14/24' },
    { name: 'First Last', moveType: 'Move Type', date: '12/16/24' },
    { name: 'First Last', moveType: 'Move Type', date: '12/16/24' },
    { name: 'First Last', moveType: 'Move Type', date: '12/16/24' },
    { name: 'First Last', moveType: 'Move Type', date: '12/18/24' },
  ];

  const updates = [
    {
      name: 'Shirley Cook',
      date: '04/03/2026',
      description:
        'Resident is scheduled to pack on 6/9/26, move and unpack on 6/10/26. Please coordinate with the building concierge for elevator access and confirm parking for the moving truck.',
      community: 'Riddle Village Retirement Community',
    },
    {
      name: 'Maria Garcia',
      date: '04/02/2026',
      description: 'Brief update — paperwork complete.',
      community: 'Penick Village',
    },
    {
      name: 'James Wilson',
      date: '04/01/2026',
      description:
        'Follow-up required on insurance documentation before the final walkthrough. Team to call resident by end of week with checklist and preferred vendor list for minor repairs.',
      community: 'King-Bruwaert House',
    },
  ];

  const teamMembers = [
    { name: 'First Last', role: 'Relocation Specialist', email: 'first.last@livnow.com', phone: '(123)456-7890' },
    { name: 'First Last', role: 'Director of Client Success', email: 'first.last@livnow.com', phone: '(123)456-7890' },
    { name: 'First Last', role: 'VP of Customer Experience', email: 'first.last@livnow.com', phone: '(123)456-7890' },
  ];

  return (
    <div className="p-6 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">
        {/* Left Column */}
        <div className="space-y-6">
          {/* At a Glance */}
          <Section
            title="At a Glance"
            headerRight={
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90 font-source-sans-3 bg-[var(--primary)]"
              >
                <Plus size={16} />
                Add Resident
              </button>
            }
          >
            <div className="grid grid-cols-3 gap-3">
              {statusCards.map((card) => (
                <StatusCard
                  key={card.label}
                  label={card.label}
                  count={card.count}
                  iconSrc={card.iconSrc}
                  detailRows={atAGlanceDemoRows(10)}
                  isDetailOpen={atAGlanceOpenLabel === card.label}
                  onToggleDetail={() => toggleAtAGlanceDetail(card.label)}
                  onCloseDetail={closeAtAGlanceDetail}
                />
              ))}
            </div>
          </Section>

          {/* Community Referrals */}
          <Section
            title="Community Referrals"
            className="rounded-2xl"
            headerClassName="px-6 py-5"
            bodyClassName="px-6 pb-6 pt-5"
          >
            <div
              className="mb-5 flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-8 text-center"
              style={{ backgroundColor: 'hsla(191, 47%, 35%, 0.08)' }}
            >
              <div className="font-source-sans-3 text-sm font-medium text-[var(--primary)]">
                Annual Referrals to Date
              </div>
              <p className="font-source-sans-3 text-4xl font-bold leading-none text-[var(--primary)]">503</p>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-3">
              {referralWindow.map((month) => (
                <ReferralMonthCard
                  key={month.key}
                  cardKey={month.key}
                  titleLabel={month.titleLabel}
                  count={month.count}
                  rows={month.rows}
                  isOpen={referralOpenKey === month.key}
                  onToggle={() => toggleReferralDetail(month.key)}
                  onClose={closeReferralDetail}
                />
              ))}
            </div>

            <div className="flex items-center justify-between font-source-sans-3 text-sm">
              <button
                type="button"
                disabled={!referralCanPrev}
                onClick={() => {
                  if (referralCanPrev) {
                    setReferralCarouselIndex((i) => Math.max(0, i - 1));
                    closeReferralDetail();
                  }
                }}
                className={
                  referralCanPrev
                    ? 'font-bold text-[var(--primary)] transition-opacity hover:opacity-80'
                    : 'cursor-default font-medium text-gray-400'
                }
                aria-disabled={!referralCanPrev}
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={!referralCanNext}
                onClick={() => {
                  if (referralCanNext) {
                    setReferralCarouselIndex((i) =>
                      Math.min(REFERRAL_CAROUSEL_MAX_START, i + 1),
                    );
                    closeReferralDetail();
                  }
                }}
                className={
                  referralCanNext
                    ? 'font-bold text-[var(--primary)] transition-opacity hover:opacity-80'
                    : 'cursor-default font-medium text-gray-400'
                }
                aria-disabled={!referralCanNext}
              >
                Next →
              </button>
            </div>
          </Section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Moves */}
          <Section title="Upcoming Moves">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {upcomingMoves.map((move, i) => (
                <MoveItem key={i} {...move} isLast={i === upcomingMoves.length - 1} />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between font-source-sans-3 text-sm">
              <button
                type="button"
                disabled
                className="cursor-default font-medium text-gray-400"
                aria-disabled="true"
              >
                ← Previous
              </button>
              <button
                type="button"
                className="font-bold text-[var(--primary)] transition-opacity hover:opacity-80"
              >
                Next →
              </button>
            </div>
          </Section>

          {/* Community Updates */}
          <Section title="Community Updates">
            <div className="mb-4 grid grid-cols-3 items-center gap-2 font-source-sans-3 text-sm">
              <button
                type="button"
                disabled
                className="cursor-default justify-self-start font-medium text-gray-400"
                aria-disabled="true"
              >
                ← Previous
              </button>
              <span className="text-center font-bold text-gray-900">April 2026</span>
              <button
                type="button"
                className="justify-self-end font-bold text-[var(--primary)] transition-opacity hover:opacity-80"
              >
                Next →
              </button>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white">
              {updates.map((update, i) => (
                <UpdateItem key={i} {...update} isLast={i === updates.length - 1} />
              ))}
            </div>
          </Section>

          {/* Upcoming Events */}
          <Section
            title="Upcoming Events"
            className="rounded-2xl shadow-sm"
            headerClassName="px-5 py-4"
            bodyClassName="px-5 pb-6 pt-2"
            headerRight={
              <button
                type="button"
                onClick={() => setRequestEventOpen(true)}
                className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)] transition-opacity hover:opacity-80 font-source-sans-3"
              >
                Request Event
                <img
                  src={calendarIcon}
                  alt=""
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px] shrink-0 object-contain"
                  aria-hidden
                />
              </button>
            }
          >
            <UpcomingEventsCalendar />
          </Section>

          {/* LivNow Team */}
          <Section title="LivNow Team" bodyClassName="px-5 pb-5 pt-0">
            <div className="flex flex-col gap-4">
              {teamMembers.map((member, i) => (
                <TeamMember key={i} {...member} />
              ))}
            </div>
          </Section>
        </div>
      </div>

      <RequestEventDrawer open={requestEventOpen} onClose={() => setRequestEventOpen(false)} />
    </div>
  );
}

export { Section };
