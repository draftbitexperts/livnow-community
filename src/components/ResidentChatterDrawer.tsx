import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  X,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  List,
  Link2,
  Send,
} from 'lucide-react';

const CHAT_FRAME_BORDER = '#58828B';

interface DemoMessage {
  id: string;
  variant: 'cm' | 'peer';
  senderName: string;
  initials: string;
  avatarUrl?: string;
  time: string;
  body: string;
}

const DEMO_MESSAGES: DemoMessage[] = [
  {
    id: '1',
    variant: 'cm',
    senderName: 'Community Manager',
    initials: 'CM',
    time: '8:49 AM',
    body: 'Good morning — following up on the move-in checklist. Let me know if you need anything from our side before Thursday.',
  },
  {
    id: '2',
    variant: 'peer',
    senderName: 'Kathleen Fredendall',
    initials: 'KF',
    time: '8:52 AM',
    body: 'Thanks! I spoke with the family yesterday. They are all set for keys on Friday morning.',
  },
  {
    id: '3',
    variant: 'cm',
    senderName: 'Community Manager',
    initials: 'CM',
    time: '9:00 AM',
    body: 'Perfect. I will add a note for housekeeping to stage the welcome basket.',
  },
];

interface ResidentChatterDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Shown in composer placeholder, e.g. relocation specialist name */
  messageRecipientName: string;
}

function MessageAvatar({ msg }: { msg: DemoMessage }) {
  const isCm = msg.variant === 'cm';
  if (msg.avatarUrl) {
    return (
      <img
        src={msg.avatarUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-inter text-xs font-semibold text-white"
      style={{ backgroundColor: isCm ? '#307584' : '#83ACB5' }}
    >
      {msg.initials}
    </div>
  );
}

function ChatterPanel({
  onClose,
  messageRecipientName,
}: {
  onClose: () => void;
  messageRecipientName: string;
}) {
  const [entered, setEntered] = useState(false);
  const [draft, setDraft] = useState('');
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const scrollMessagesToBottom = () => {
    const el = messagesScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useLayoutEffect(() => {
    scrollMessagesToBottom();
  }, [entered]);

  useEffect(() => {
    if (!entered) return;
    const t = window.setTimeout(scrollMessagesToBottom, 320);
    return () => window.clearTimeout(t);
  }, [entered]);

  const placeholder =
    messageRecipientName.trim().length > 0
      ? `Message ${messageRecipientName}`
      : 'Type a message…';

  return (
    <>
      <button
        type="button"
        className="absolute inset-0 bg-black/40 transition-opacity"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          entered ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resident-chatter-title"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
            aria-label="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
          <h2 id="resident-chatter-title" className="font-source-sans-3 text-lg font-bold text-[#323234]">
            Resident Chatter
          </h2>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 sm:p-5">
          <div
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl"
            style={{ border: `1px solid ${CHAT_FRAME_BORDER}` }}
          >
            <div className="flex shrink-0 justify-center border-b border-gray-100 px-3 py-3">
              <button
                type="button"
                className="font-source-sans-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#F7FAFA] px-4 py-2 text-sm font-semibold text-[#323234] transition-colors hover:bg-gray-100"
              >
                March 20th, 2025
                <ChevronDown size={16} className="text-[#505051]" aria-hidden />
              </button>
            </div>

            <div
              ref={messagesScrollRef}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-6"
            >
              <div className="flex min-h-full flex-col justify-end">
                <ul className="flex flex-col gap-5">
                  {DEMO_MESSAGES.map((msg) => (
                    <li key={msg.id} className="flex gap-3">
                      <MessageAvatar msg={msg} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-source-sans-3 text-base font-semibold text-[#323234]">
                            {msg.senderName}
                          </span>
                          <span className="font-source-sans-3 text-sm text-[#ACACAD]">{msg.time}</span>
                        </div>
                        <p className="mt-1 font-source-sans-3 text-base font-medium leading-snug text-[#323234]">
                          {msg.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-200 bg-white px-3 pb-4 pt-3">
              <div
                className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-[#F3F4F5] px-2 py-1.5"
                role="toolbar"
                aria-label="Formatting"
              >
                {[
                  { Icon: Bold, label: 'Bold' },
                  { Icon: Italic, label: 'Italic' },
                  { Icon: Underline, label: 'Underline' },
                  { Icon: List, label: 'Bulleted list' },
                  { Icon: Link2, label: 'Link' },
                ].map(({ Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    className="rounded p-1.5 text-[#505051] transition-colors hover:bg-gray-200 hover:text-[#323234]"
                    aria-label={label}
                    title={label}
                  >
                    <Icon size={18} strokeWidth={2} />
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  placeholder={placeholder}
                  className="font-source-sans-3 min-h-[88px] flex-1 resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-base text-[#323234] placeholder:text-[#ACACAD] focus:border-[#307584] focus:outline-none focus:ring-2 focus:ring-[#307584]/25"
                />
                <button
                  type="button"
                  className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: '#307584' }}
                  aria-label="Send message"
                  disabled={!draft.trim()}
                  onClick={() => setDraft('')}
                >
                  <Send size={20} className="-ml-0.5" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function ResidentChatterDrawer({
  open,
  onClose,
  messageRecipientName,
}: ResidentChatterDrawerProps) {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] font-source-sans-3">
      <ChatterPanel onClose={onClose} messageRecipientName={messageRecipientName} />
    </div>
  );
}
