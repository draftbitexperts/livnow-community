import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
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

function composerPlainText(el: HTMLDivElement | null) {
  if (!el) return '';
  return el.innerText.replace(/\u200b/g, '').trim();
}

function execRichCommand(
  el: HTMLDivElement | null,
  command: 'bold' | 'italic' | 'underline' | 'insertUnorderedList',
  after?: () => void,
) {
  if (!el) return;
  el.focus();
  document.execCommand(command, false);
  queueMicrotask(() => after?.());
}

function execRichLink(el: HTMLDivElement | null, after?: () => void) {
  if (!el) return;
  const url = window.prompt('Enter URL', 'https://');
  if (url === null) return;
  const trimmed = url.trim();
  if (!trimmed) return;
  el.focus();
  document.execCommand('createLink', false, trimmed);
  queueMicrotask(() => after?.());
}

function isSelectionInComposer(composer: HTMLDivElement): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const node = sel.anchorNode;
  if (!node) return false;
  return composer.contains(node);
}

function shouldReflectComposerFormat(composer: HTMLDivElement | null): boolean {
  if (!composer) return false;
  if (document.activeElement === composer) return true;
  return isSelectionInComposer(composer);
}

type ComposerFormatState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  list: boolean;
  link: boolean;
};

const INITIAL_FORMAT: ComposerFormatState = {
  bold: false,
  italic: false,
  underline: false,
  list: false,
  link: false,
};

function readComposerFormat(composer: HTMLDivElement | null): ComposerFormatState {
  if (!shouldReflectComposerFormat(composer)) return INITIAL_FORMAT;
  return {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
    list: document.queryCommandState('insertUnorderedList'),
    link: document.queryCommandState('createLink'),
  };
}

interface DemoMessage {
  id: string;
  variant: 'cm' | 'peer';
  senderName: string;
  initials: string;
  avatarUrl?: string;
  time: string;
  /** Static demo HTML only — matches composer output (bold, lists, links, etc.) */
  bodyHtml: string;
}

const DEMO_MESSAGES: DemoMessage[] = [
  {
    id: '1',
    variant: 'cm',
    senderName: 'Community Manager',
    initials: 'CM',
    time: '8:49 AM',
    bodyHtml:
      '<p>Good morning — following up on the <strong>move-in checklist</strong>. Before <em>Thursday</em>, please:</p><ul><li>Confirm utilities are scheduled</li><li>Review your <u>parking</u> assignment</li></ul><p>Questions? See <a href="https://example.com/move-in">our move-in guide</a>.</p>',
  },
  {
    id: '2',
    variant: 'peer',
    senderName: 'Kathleen Fredendall',
    initials: 'KF',
    time: '8:52 AM',
    bodyHtml:
      '<p>Thanks! I spoke with the family yesterday. They are <strong>all set</strong> for keys on <em>Friday morning</em>.</p><ul><li>Everyone is excited</li><li>No open blockers on our side</li></ul>',
  },
  {
    id: '3',
    variant: 'cm',
    senderName: 'Community Manager',
    initials: 'CM',
    time: '9:00 AM',
    bodyHtml:
      '<p>Perfect. I will add a note for <u>housekeeping</u> to stage the <strong>welcome basket</strong> with:</p><ul><li>Snacks and water</li><li>Fresh towels</li><li>A printed <em>community map</em></li></ul>',
  },
];

interface ResidentChatterDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Shown in composer placeholder, e.g. relocation specialist name */
  messageRecipientName: string;
}

function ChatterComposerToolbar({
  editorRef,
  onAfterFormat,
}: {
  editorRef: RefObject<HTMLDivElement | null>;
  onAfterFormat: () => void;
}) {
  const [format, setFormat] = useState<ComposerFormatState>(INITIAL_FORMAT);

  const refreshFormat = useCallback(() => {
    setFormat(readComposerFormat(editorRef.current));
  }, [editorRef]);

  const runAfterFormat = useCallback(() => {
    onAfterFormat();
    queueMicrotask(refreshFormat);
  }, [onAfterFormat, refreshFormat]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const onActivity = () => refreshFormat();
    el.addEventListener('input', onActivity);
    el.addEventListener('keyup', onActivity);
    el.addEventListener('mouseup', onActivity);
    el.addEventListener('focus', onActivity);
    el.addEventListener('blur', onActivity);
    document.addEventListener('selectionchange', onActivity);
    queueMicrotask(onActivity);
    return () => {
      el.removeEventListener('input', onActivity);
      el.removeEventListener('keyup', onActivity);
      el.removeEventListener('mouseup', onActivity);
      el.removeEventListener('focus', onActivity);
      el.removeEventListener('blur', onActivity);
      document.removeEventListener('selectionchange', onActivity);
    };
  }, [editorRef, refreshFormat]);

  const btnBase =
    'rounded p-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#307584]';
  const btnIdle = 'text-[#505051] hover:bg-gray-200 hover:text-[#323234]';
  const btnOn =
    'bg-[#DCE8EA] text-[#307584] ring-1 ring-inset ring-[#307584]/35 hover:bg-[#cfdfe3]';

  const fmtBtn = (on: boolean) => `${btnBase} ${on ? btnOn : btnIdle}`;

  return (
    <div
      className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-[#F3F4F5] px-2 py-1.5"
      role="toolbar"
      aria-label="Formatting"
    >
      <button
        type="button"
        className={fmtBtn(format.bold)}
        aria-label="Bold"
        aria-pressed={format.bold}
        title="Bold"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execRichCommand(editorRef.current, 'bold', runAfterFormat)}
      >
        <Bold size={18} strokeWidth={2} />
      </button>
      <button
        type="button"
        className={fmtBtn(format.italic)}
        aria-label="Italic"
        aria-pressed={format.italic}
        title="Italic"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execRichCommand(editorRef.current, 'italic', runAfterFormat)}
      >
        <Italic size={18} strokeWidth={2} />
      </button>
      <button
        type="button"
        className={fmtBtn(format.underline)}
        aria-label="Underline"
        aria-pressed={format.underline}
        title="Underline"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execRichCommand(editorRef.current, 'underline', runAfterFormat)}
      >
        <Underline size={18} strokeWidth={2} />
      </button>
      <button
        type="button"
        className={fmtBtn(format.list)}
        aria-label="Bulleted list"
        aria-pressed={format.list}
        title="Bulleted list"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          execRichCommand(editorRef.current, 'insertUnorderedList', runAfterFormat)
        }
      >
        <List size={18} strokeWidth={2} />
      </button>
      <button
        type="button"
        className={fmtBtn(format.link)}
        aria-label="Link"
        aria-pressed={format.link}
        title="Link"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => execRichLink(editorRef.current, runAfterFormat)}
      >
        <Link2 size={18} strokeWidth={2} />
      </button>
    </div>
  );
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
  const [composerIsEmpty, setComposerIsEmpty] = useState(true);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  const syncComposerEmpty = () => {
    setComposerIsEmpty(composerPlainText(composerRef.current).length === 0);
  };

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
                        <div
                          className="mt-1 font-source-sans-3 text-base font-medium leading-snug text-[#323234] [&_a]:text-[#307584] [&_a]:underline [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
                          dangerouslySetInnerHTML={{ __html: msg.bodyHtml }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-200 bg-white px-3 pb-4 pt-3">
              <ChatterComposerToolbar editorRef={composerRef} onAfterFormat={syncComposerEmpty} />
              <div className="flex items-end gap-2">
                <div className="relative flex-1 rounded-lg border border-gray-300 focus-within:border-[#307584] focus-within:ring-2 focus-within:ring-[#307584]/25">
                  {composerIsEmpty && (
                    <span
                      className="pointer-events-none absolute left-3 top-2.5 font-source-sans-3 text-base text-[#ACACAD]"
                      aria-hidden
                    >
                      {placeholder}
                    </span>
                  )}
                  <div
                    ref={composerRef}
                    role="textbox"
                    aria-multiline="true"
                    aria-label={placeholder}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={syncComposerEmpty}
                    className="font-source-sans-3 relative z-[1] min-h-[88px] resize-y overflow-auto px-3 py-2.5 text-base text-[#323234] outline-none [&_a]:text-[#307584] [&_a]:underline [&_li]:my-0.5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
                  />
                </div>
                <button
                  type="button"
                  className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: '#307584' }}
                  aria-label="Send message"
                  disabled={composerIsEmpty}
                  onClick={() => {
                    const el = composerRef.current;
                    if (!el) return;
                    el.innerHTML = '';
                    syncComposerEmpty();
                  }}
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
