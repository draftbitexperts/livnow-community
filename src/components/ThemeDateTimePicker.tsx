import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import calendarIcon from '../../LivNow Icons/calendar.png';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** `YYYY-MM-DDTHH:mm` in local time, or null */
export function parseLocalDateTime(value: string): Date | null {
  if (!value?.trim()) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const h = Number(m[4]);
  const min = Number(m[5]);
  const dt = new Date(y, mo, d, h, min, 0, 0);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo ||
    dt.getDate() !== d ||
    dt.getHours() !== h ||
    dt.getMinutes() !== min
  ) {
    return null;
  }
  return dt;
}

export function toLocalDateTimeValue(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatDisplay(d: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function formatTimeOnly(d: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Date used when picking time before a full value exists — today if viewing current month, else 1st of viewed month. */
function anchorDate(selected: Date | null, viewYear: number, viewMonth: number): Date {
  if (selected) return selected;
  const n = new Date();
  if (n.getFullYear() === viewYear && n.getMonth() === viewMonth) {
    return new Date(viewYear, viewMonth, n.getDate(), 0, 0, 0, 0);
  }
  return new Date(viewYear, viewMonth, 1, 0, 0, 0, 0);
}

function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-sm font-bold text-gray-900">
      {children}
      <span className="text-red-500">*</span>
    </span>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

type PanelTab = 'date' | 'time';

export type ThemeDateTimePickerProps = {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  emptyLabel?: string;
  error?: string;
  /** When false, "Clear" is hidden (e.g. required start field). */
  allowClear?: boolean;
};

export function ThemeDateTimePicker({
  id,
  label,
  required,
  value,
  onChange,
  emptyLabel,
  error,
  allowClear = true,
}: ThemeDateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hourBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const minuteBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  const [panelTab, setPanelTab] = useState<PanelTab>('date');

  const selected = parseLocalDateTime(value);
  const showPlaceholder = Boolean(emptyLabel && !value);

  const baseDate = selected ?? new Date();
  const selY = selected?.getFullYear() ?? baseDate.getFullYear();
  const selMo = selected?.getMonth() ?? baseDate.getMonth();
  const selD = selected?.getDate() ?? baseDate.getDate();
  const selH = selected?.getHours() ?? baseDate.getHours();
  const selMin = selected?.getMinutes() ?? baseDate.getMinutes();

  useLayoutEffect(() => {
    if (!open) return;

    const margin = 12;
    const gap = 4;

    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const minPopoverW = 280;
      const popoverW = Math.min(400, Math.max(r.width, minPopoverW), vw - margin * 2);
      let left = r.left;
      if (left + popoverW > vw - margin) {
        left = vw - margin - popoverW;
      }
      if (left < margin) {
        left = margin;
      }

      // Keep the popover anchored directly under the field; never shift `top` up (that was
      // covering the trigger). Fit by shrinking max-height and scrolling inside the popover.
      const top = r.bottom + gap;
      const spaceBelow = vh - margin - top;
      const maxH = Math.min(560, Math.max(0, spaceBelow));

      setPopoverStyle({
        position: 'fixed',
        left,
        top,
        width: popoverW,
        maxHeight: maxH,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        zIndex: 260,
      });
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || panelTab !== 'time') return;
    hourBtnRefs.current[selH]?.scrollIntoView({ block: 'nearest' });
    minuteBtnRefs.current[selMin]?.scrollIntoView({ block: 'nearest' });
  }, [open, panelTab, selH, selMin]);

  useEffect(() => {
    if (open) setPanelTab('date');
  }, [open]);

  // Sync calendar month only when opening or when the committed value changes — not on every
  // render (parseLocalDateTime returns a new Date reference each time, which was resetting the view).
  useEffect(() => {
    if (!open) return;
    const parsed = parseLocalDateTime(value);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    } else {
      const n = new Date();
      setViewYear(n.getFullYear());
      setViewMonth(n.getMonth());
    }
  }, [open, value]);

  const commit = (d: Date) => {
    onChange(toLocalDateTimeValue(d));
  };

  const firstOfView = new Date(viewYear, viewMonth, 1);
  const startPad = (firstOfView.getDay() + 6) % 7;
  const dim = daysInMonth(viewYear, viewMonth);
  const cells: { day: number; inMonth: boolean; key: string }[] = [];
  const prevDim = daysInMonth(viewYear, viewMonth - 1);
  for (let i = 0; i < startPad; i++) {
    const day = prevDim - startPad + i + 1;
    cells.push({ day, inMonth: false, key: `p-${viewYear}-${viewMonth}-${i}` });
  }
  for (let d = 1; d <= dim; d++) {
    cells.push({ day: d, inMonth: true, key: `c-${viewYear}-${viewMonth}-${d}` });
  }
  const rest = 42 - cells.length;
  for (let i = 0; i < rest; i++) {
    cells.push({ day: i + 1, inMonth: false, key: `n-${viewYear}-${viewMonth}-${i}` });
  }

  const today = new Date();
  const isToday = (y: number, m: number, d: number) =>
    y === today.getFullYear() && m === today.getMonth() && d === today.getDate();

  const monthTitle = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(viewYear, viewMonth, 1),
  );

  const popover = open ? (
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${label} picker`}
      className="rounded-xl border border-gray-200 bg-white py-2 shadow-xl sm:py-3"
      style={popoverStyle}
    >
      <div className="flex flex-col px-2 sm:px-3">
        <div className="mb-2 flex gap-1 rounded-lg bg-gray-100 p-1" role="tablist" aria-label="Date or time">
          <button
            type="button"
            role="tab"
            aria-selected={panelTab === 'date'}
            id={`${id}-tab-date`}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold transition-colors ${
              panelTab === 'date'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setPanelTab('date')}
          >
            <Calendar size={16} strokeWidth={2} className="shrink-0 opacity-80" aria-hidden />
            Date
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={panelTab === 'time'}
            id={`${id}-tab-time`}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold transition-colors ${
              panelTab === 'time'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setPanelTab('time')}
          >
            <Clock size={16} strokeWidth={2} className="shrink-0 opacity-80" aria-hidden />
            Time
          </button>
        </div>

        {panelTab === 'date' ? (
          <div className="min-w-0" role="tabpanel" aria-labelledby={`${id}-tab-date`}>
            <div className="mb-1.5 flex items-center justify-between gap-2 sm:mb-2">
              <button
                type="button"
                className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
                aria-label="Previous month"
                onClick={() => {
                  if (viewMonth === 0) {
                    setViewMonth(11);
                    setViewYear((y) => y - 1);
                  } else {
                    setViewMonth((m) => m - 1);
                  }
                }}
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </button>
              <span className="text-center text-sm font-semibold text-gray-900">{monthTitle}</span>
              <button
                type="button"
                className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
                aria-label="Next month"
                onClick={() => {
                  if (viewMonth === 11) {
                    setViewMonth(0);
                    setViewYear((y) => y + 1);
                  } else {
                    setViewMonth((m) => m + 1);
                  }
                }}
              >
                <ChevronRight size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-px text-center text-[10px] font-semibold text-gray-500 sm:gap-0.5 sm:text-[11px]">
              {WEEKDAY_LABELS.map((w) => (
                <div key={w} className="py-0.5 sm:py-1">
                  {w}
                </div>
              ))}
            </div>
            <div className="mt-0.5 grid grid-cols-7 gap-px sm:mt-1 sm:gap-0.5">
              {cells.map((cell) => {
                if (!cell.inMonth) {
                  return (
                    <div
                      key={cell.key}
                      className="flex aspect-square max-h-9 min-h-0 items-center justify-center text-[10px] text-gray-300 sm:max-h-none sm:text-xs"
                    >
                      {cell.day}
                    </div>
                  );
                }
                const y = viewYear;
                const m = viewMonth;
                const d = cell.day;
                const isSel = selected && selY === y && selMo === m && selD === d;
                const todayCell = isToday(y, m, d);
                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={`flex aspect-square max-h-9 min-h-0 items-center justify-center rounded-md text-[10px] font-medium transition-colors sm:max-h-none sm:text-xs ${
                      isSel
                        ? 'bg-[var(--primary)] text-white'
                        : todayCell
                          ? 'ring-2 ring-[var(--primary)]/40 ring-inset text-[var(--primary)] hover:bg-gray-50'
                          : 'text-gray-800 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      const next = new Date(y, m, d, selH, selMin, 0, 0);
                      commit(next);
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between gap-2 border-t border-gray-100 pt-1.5 sm:mt-3 sm:pt-2">
              {allowClear ? (
                <button
                  type="button"
                  className="text-sm font-semibold text-[var(--primary)] hover:underline"
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  Clear
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                className="text-sm font-semibold text-[var(--primary)] hover:underline"
                onClick={() => {
                  const n = new Date();
                  commit(n);
                }}
              >
                Today
              </button>
            </div>
          </div>
        ) : (
          <div className="min-w-0" role="tabpanel" aria-labelledby={`${id}-tab-time`}>
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
              <span className="text-lg font-bold tabular-nums text-gray-900">
                {selected ? formatTimeOnly(selected) : '— : —'}
              </span>
              <button
                type="button"
                className="shrink-0 rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide text-[var(--primary)] hover:bg-[var(--primary)]/10"
                onClick={() => {
                  const n = new Date();
                  const base = anchorDate(selected, viewYear, viewMonth);
                  const next = new Date(
                    base.getFullYear(),
                    base.getMonth(),
                    base.getDate(),
                    n.getHours(),
                    n.getMinutes(),
                    0,
                    0,
                  );
                  commit(next);
                }}
              >
                Now
              </button>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 gap-y-1">
              <span className="text-center text-[10px] font-semibold text-gray-500">Hour</span>
              <span className="min-w-2" aria-hidden />
              <span className="text-center text-[10px] font-semibold text-gray-500">Min</span>
              <div className="max-h-[min(11rem,38dvh)] min-h-0 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/80 py-1">
                {HOURS.map((h) => {
                  const isSel = selected && selH === h;
                  return (
                    <button
                      key={h}
                      ref={(el) => {
                        hourBtnRefs.current[h] = el;
                      }}
                      type="button"
                      className={`flex w-full items-center justify-center py-1.5 text-sm font-medium transition-colors ${
                        isSel ? 'bg-[var(--primary)] text-white' : 'text-gray-800 hover:bg-white'
                      }`}
                      onClick={() => {
                        const base = anchorDate(selected, viewYear, viewMonth);
                        const next = new Date(
                          base.getFullYear(),
                          base.getMonth(),
                          base.getDate(),
                          h,
                          selMin,
                          0,
                          0,
                        );
                        commit(next);
                      }}
                    >
                      {pad2(h)}
                    </button>
                  );
                })}
              </div>
              <div className="flex min-h-0 items-center justify-center text-lg font-bold leading-none text-gray-400">
                :
              </div>
              <div className="max-h-[min(11rem,38dvh)] min-h-0 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/80 py-1">
                {MINUTES.map((min) => {
                  const isSel = selected && selMin === min;
                  return (
                    <button
                      key={min}
                      ref={(el) => {
                        minuteBtnRefs.current[min] = el;
                      }}
                      type="button"
                      className={`flex w-full items-center justify-center py-1 text-sm font-medium transition-colors ${
                        isSel ? 'bg-[var(--primary)] text-white' : 'text-gray-800 hover:bg-white'
                      }`}
                      onClick={() => {
                        const base = anchorDate(selected, viewYear, viewMonth);
                        const next = new Date(
                          base.getFullYear(),
                          base.getMonth(),
                          base.getDate(),
                          selH,
                          min,
                          0,
                          0,
                        );
                        commit(next);
                      }}
                    >
                      {pad2(min)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block">
        {required ? <RequiredLabel>{label}</RequiredLabel> : <span className="text-sm font-bold text-gray-900">{label}</span>}
      </label>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full min-h-[3.25rem] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-[box-shadow,transform] active:scale-[0.99] ${
          error
            ? 'border-red-500 bg-red-50/30'
            : 'border-gray-200 bg-gray-50/90 hover:border-[var(--primary)]/35 hover:bg-gray-50'
        } ${open && !error ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/25' : ''}`}
      >
        <span className={showPlaceholder ? 'text-gray-400' : 'font-medium text-gray-900'}>
          {selected ? formatDisplay(selected) : emptyLabel ?? 'Select date and time'}
        </span>
        {open && panelTab === 'time' ? (
          <Clock className="h-[22px] w-[22px] shrink-0 text-[var(--primary)]" strokeWidth={2} aria-hidden />
        ) : (
          <img src={calendarIcon} alt="" width={22} height={22} className="h-[22px] w-[22px] shrink-0 object-contain" />
        )}
      </button>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {open && popover ? createPortal(popover, document.body) : null}
    </div>
  );
}
