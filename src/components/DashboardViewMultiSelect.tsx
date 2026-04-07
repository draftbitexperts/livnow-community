import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { ChevronDown, X } from 'lucide-react';

export type DashboardViewOption = { id: string; label: string };

type Props = {
  id?: string;
  options: DashboardViewOption[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function DashboardViewMultiSelect({
  id = 'dashboard-view-multiselect',
  options,
  selectedIds,
  onSelectionChange,
  placeholder = 'Search communities…',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOptions = selectedIds
    .map((sid) => options.find((o) => o.id === sid))
    .filter(Boolean) as DashboardViewOption[];

  const q = query.trim().toLowerCase();
  const available = options.filter((o) => !selectedIds.includes(o.id));
  const filtered = q
    ? available.filter((o) => o.label.toLowerCase().includes(q))
    : available;

  useLayoutEffect(() => {
    if (!open) return;
    setHighlight((h) => Math.min(h, Math.max(0, filtered.length - 1)));
  }, [filtered.length, open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(`[data-idx="${highlight}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open, filtered]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const add = useCallback(
    (optionId: string) => {
      if (selectedIds.includes(optionId)) return;
      onSelectionChange([...selectedIds, optionId]);
      setQuery('');
      setHighlight(0);
      inputRef.current?.focus();
    },
    [onSelectionChange, selectedIds],
  );

  const remove = useCallback(
    (optionId: string) => {
      onSelectionChange(selectedIds.filter((x) => x !== optionId));
      inputRef.current?.focus();
    },
    [onSelectionChange, selectedIds],
  );

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(0, filtered.length - 1)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.max(h - 1, 0));
      return;
    }
    if (e.key === 'Enter' && open && filtered.length > 0) {
      e.preventDefault();
      add(filtered[highlight]?.id);
      return;
    }
    if (e.key === 'Backspace' && query === '' && selectedIds.length > 0) {
      remove(selectedIds[selectedIds.length - 1]);
    }
  };

  return (
    <div ref={rootRef} className={`relative min-w-0 w-full font-source-sans-3 ${className}`}>
      <div
        className={`flex min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded-lg border bg-white py-1.5 pl-1.5 pr-9 transition-colors ${
          open ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : 'border-gray-300'
        }`}
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          inputRef.current?.focus();
          setOpen(true);
        }}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        id={id}
      >
        {selectedOptions.map((opt) => (
          <span
            key={opt.id}
            className="inline-flex max-w-full items-center gap-1 rounded-md bg-[var(--primary)] py-1.5 pl-2 pr-1 text-xs font-medium text-white"
          >
            <span className="truncate">{opt.label}</span>
            <button
              type="button"
              className="shrink-0 rounded p-0.5 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              aria-label={`Remove ${opt.label}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                remove(opt.id);
              }}
            >
              <X size={12} strokeWidth={2.5} aria-hidden />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="min-w-[6ch] flex-1 border-0 bg-transparent py-0.5 pl-0.5 text-xs text-gray-900 outline-none placeholder:text-gray-400"
          placeholder={selectedOptions.length === 0 ? placeholder : ''}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKeyDown}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          aria-activedescendant={open && filtered[highlight] ? `${id}-opt-${filtered[highlight].id}` : undefined}
        />
        <button
          type="button"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label={open ? 'Close list' : 'Open list'}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
        >
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>

      {open && (
        <ul
          ref={listRef}
          id={`${id}-listbox`}
          role="listbox"
          aria-multiselectable
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white py-0.5 shadow-lg [scrollbar-width:thin]"
        >
          {filtered.length === 0 ? (
            <li className="px-2.5 py-2 text-xs text-gray-500">No communities match your search.</li>
          ) : (
            filtered.map((opt, idx) => (
              <li
                key={opt.id}
                id={`${id}-opt-${opt.id}`}
                role="option"
                data-idx={idx}
                aria-selected={idx === highlight}
                className={`cursor-pointer px-2.5 py-2 text-xs text-gray-800 ${
                  idx === highlight ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(opt.id);
                }}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
