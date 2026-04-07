import { useEffect, useState, type ReactNode } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BottomToast, type BottomToastPayload } from '@/components/BottomToast';
import { ThemeDateTimePicker } from '@/components/ThemeDateTimePicker';

interface RequestEventDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** Cancel button fill — light desaturated teal (matches webinar / soft UI) */
const CANCEL_BTN_BG = 'hsla(191, 47%, 92%, 1)';

function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-sm font-bold text-gray-900">
      {children}
      <span className="text-red-500">*</span>
    </span>
  );
}

function RequestEventPanel({
  onClose,
  onNotify,
}: {
  onClose: () => void;
  onNotify: (payload: BottomToastPayload) => void;
}) {
  const { user } = useAuth();
  const requesterDisplay = user?.name?.trim() || user?.email || '—';

  const [entered, setEntered] = useState(false);
  const [eventType, setEventType] = useState<'in-person' | 'webinar' | null>(null);
  const [community, setCommunity] = useState('');
  const [startDateTime, setStartDateTime] = useState('2026-04-16T10:00');
  const [endDateTime, setEndDateTime] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    eventType?: string;
    community?: string;
    startDateTime?: string;
  }>({});

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const validate = () => {
    const next: typeof fieldErrors = {};
    if (eventType === null) {
      next.eventType = 'Select an event type.';
    }
    if (!community.trim()) {
      next.community = 'Select a community.';
    }
    if (!startDateTime.trim()) {
      next.startDateTime = 'Select a start date and time.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <>
      <button
        type="button"
        className="absolute inset-0 bg-black/40 transition-opacity"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          entered ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-event-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
              aria-label="Close"
            >
              <X size={18} strokeWidth={2} />
            </button>
            <h2 id="request-event-title" className="text-lg font-bold text-gray-900">
              Request Event
            </h2>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--primary)] transition-opacity hover:opacity-90"
              style={{ backgroundColor: CANCEL_BTN_BG }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="request-event-form"
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>

        <form
          id="request-event-form"
          className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!validate()) {
              onNotify({
                variant: 'error',
                message: 'Please complete all required fields before saving.',
              });
              return;
            }
            // TODO: API
            onNotify({
              variant: 'success',
              message: 'Event request submitted successfully.',
            });
            onClose();
          }}
        >
          <div>
            <h3 className="mb-4 text-base font-bold text-gray-900">Event Details</h3>

            <fieldset className="border-0 p-0">
              <legend className="mb-2">
                <RequiredLabel>Event Type</RequiredLabel>
              </legend>
              <div className="flex flex-wrap gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                  <input
                    type="radio"
                    name="eventType"
                    checked={eventType === 'in-person'}
                    onChange={() => {
                      setEventType('in-person');
                      setFieldErrors((prev) => ({ ...prev, eventType: undefined }));
                    }}
                    className="h-4 w-4 shrink-0 border-gray-300"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  In Person
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                  <input
                    type="radio"
                    name="eventType"
                    checked={eventType === 'webinar'}
                    onChange={() => {
                      setEventType('webinar');
                      setFieldErrors((prev) => ({ ...prev, eventType: undefined }));
                    }}
                    className="h-4 w-4 shrink-0 border-gray-300"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  Webinar
                </label>
              </div>
              {fieldErrors.eventType ? (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {fieldErrors.eventType}
                </p>
              ) : null}
            </fieldset>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-1">
                <span className="text-sm font-bold text-gray-900">Requested By</span>
              </div>
              <div
                className="w-full cursor-default select-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-800"
                aria-live="polite"
              >
                {requesterDisplay}
              </div>
            </div>
            <div>
              <label htmlFor="community" className="mb-1 block">
                <RequiredLabel>Community</RequiredLabel>
              </label>
              <div className="relative">
                <select
                  id="community"
                  value={community}
                  onChange={(e) => {
                    setCommunity(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, community: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.community)}
                  aria-describedby={fieldErrors.community ? 'community-error' : undefined}
                  className={`w-full appearance-none rounded-lg border bg-white py-2.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 ${
                    fieldErrors.community
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-[var(--primary)]'
                  } text-gray-800`}
                >
                  <option value="">Select Community</option>
                  <option value="a">Community A</option>
                  <option value="b">Community B</option>
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  aria-hidden
                />
              </div>
              {fieldErrors.community ? (
                <p id="community-error" className="mt-1 text-sm text-red-600" role="alert">
                  {fieldErrors.community}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ThemeDateTimePicker
              id="event-start"
              label="Event Start Date & Time"
              required
              allowClear={false}
              value={startDateTime}
              onChange={(v) => {
                setStartDateTime(v);
                setFieldErrors((prev) => ({ ...prev, startDateTime: undefined }));
              }}
              error={fieldErrors.startDateTime}
            />
            <ThemeDateTimePicker
              id="event-end"
              label="Event End Date & Time"
              value={endDateTime}
              onChange={setEndDateTime}
              emptyLabel="Select a date"
            />
          </div>

          <div>
            <label htmlFor="event-purpose" className="mb-1 block text-sm font-bold text-gray-900">
              Event Purpose
            </label>
            <textarea
              id="event-purpose"
              rows={5}
              placeholder="Input the reason for the event and who it is for."
              className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            />
          </div>
        </form>
      </aside>
    </>
  );
}

export default function RequestEventDrawer({ open, onClose }: RequestEventDrawerProps) {
  const [toast, setToast] = useState<BottomToastPayload | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-[200] font-source-sans-3">
          <RequestEventPanel onClose={onClose} onNotify={setToast} />
        </div>
      ) : null}
      {toast ? (
        <BottomToast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </>
  );
}
