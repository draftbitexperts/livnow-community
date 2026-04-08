import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import SearchNormalIcon from '@/components/SearchNormalIcon';

export type PillSearchResultItem = {
  id: string;
  category: string;
  title: string;
};

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return <span>{text}</span>;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-semibold text-[#323234]">{text.slice(idx, idx + q.length)}</strong>
      {text.slice(idx + q.length)}
    </>
  );
}

const fontSans = 'font-source-sans-3';

type PillSearchWithResultsProps = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  results: PillSearchResultItem[];
  onResultSelect?: (item: PillSearchResultItem) => void;
  onSearchButton?: () => void;
  accentColor?: string;
  className?: string;
  'aria-label'?: string;
  /** When set, shows a trailing control to collapse the toolbar without clearing `value` (list pages). */
  onDismiss?: () => void;
  /** When true, focuses the input (e.g. right after expanding from the icon button). */
  isExpanded?: boolean;
};

export default function PillSearchWithResults({
  placeholder,
  value,
  onChange,
  results,
  onResultSelect,
  onSearchButton,
  accentColor = '#307584',
  className = '',
  'aria-label': ariaLabel,
  onDismiss,
  isExpanded,
}: PillSearchWithResultsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const hasText = value.trim().length > 0;
  const showPanel = panelOpen && hasText;

  useEffect(() => {
    if (!showPanel) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setPanelOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [showPanel]);

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  const handleClear = () => {
    onChange('');
    setPanelOpen(false);
  };

  const handleDismiss = () => {
    setPanelOpen(false);
    onDismiss?.();
  };

  const handleSearchButton = () => {
    onSearchButton?.();
    setPanelOpen(false);
  };

  const handlePick = (item: PillSearchResultItem) => {
    onResultSelect?.(item);
    setPanelOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative min-w-0 max-w-[400px] flex-1 ${className}`}>
      <div
        className={`flex h-12 items-center gap-2 rounded-full bg-white pl-4 pr-1 transition-shadow ${fontSans} ${
          hasText
            ? 'border border-gray-200 shadow-sm'
            : 'border border-transparent shadow-[0_2px_12px_rgba(15,23,42,0.08)]'
        }`}
      >
        <SearchNormalIcon size={20} className="shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setPanelOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          aria-label={ariaLabel ?? placeholder}
          className={`min-h-0 min-w-0 flex-1 bg-transparent py-0 text-[15px] font-medium leading-tight text-[#323234] outline-none [appearance:textfield] placeholder:font-medium placeholder:text-[#307584] [&::-webkit-search-cancel-button]:appearance-none ${fontSans}`}
        />
        {!onDismiss && hasText && (
          <button
            type="button"
            onClick={handleClear}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Clear search"
          >
            <X size={17} strokeWidth={2} />
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Close search"
          >
            <X size={17} strokeWidth={2} />
          </button>
        )}
      </div>

      {showPanel && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.12)]"
          role="listbox"
          aria-label="Search suggestions"
        >
          <p
            className={`mb-3 text-xs font-medium text-gray-400 ${fontSans}`}
            style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
          >
            Results
          </p>
          {results.length === 0 ? (
            <p className={`text-sm text-gray-500 ${fontSans}`}>No matching results.</p>
          ) : (
            <ul className="max-h-60 space-y-3 overflow-y-auto pr-1">
              {results.map((item) => (
                <li key={`${item.id}-${item.category}`}>
                  <button
                    type="button"
                    onClick={() => handlePick(item)}
                    className="w-full rounded-lg py-1.5 text-left transition-colors hover:bg-gray-50"
                    role="option"
                  >
                    <span
                      className={`block text-xs text-gray-500 ${fontSans}`}
                      style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                    >
                      {item.category}
                    </span>
                    <span
                      className={`mt-0.5 block text-[15px] leading-snug text-[#323234] ${fontSans}`}
                      style={{ fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif' }}
                    >
                      <HighlightMatch text={item.title} query={value} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={handleSearchButton}
              className={`rounded-full px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 ${fontSans}`}
              style={{
                backgroundColor: accentColor,
                fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
              }}
            >
              Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
