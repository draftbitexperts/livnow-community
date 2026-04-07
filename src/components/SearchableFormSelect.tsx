import { useMemo, useState, type CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';

export type SearchableFormSelectOption = {
  value: string;
  label: string;
};

const defaultInputStyle: CSSProperties = {
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

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: readonly SearchableFormSelectOption[];
  placeholder: string;
  disabled?: boolean;
  emptyMessage?: string;
  /** Merged into default input styles (e.g. `formSelectOverrides`). */
  style?: CSSProperties;
  wrapperClassName?: string;
  /** Appended to the input `className` (e.g. `placeholder:text-lg`). */
  inputClassName?: string;
  /** Shows red border and message below (Add / Edit contact style). */
  error?: string;
  /** Input `id` for `aria-describedby` when `error` is set. */
  id?: string;
};

export function SearchableFormSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  emptyMessage = 'No matches.',
  style,
  wrapperClassName = 'relative max-w-[335px]',
  inputClassName = '',
  error,
  id,
}: Props) {
  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filterText = open ? query.trim().toLowerCase() : '';
  const filtered = useMemo(() => {
    if (!filterText) return [...options];
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(filterText) || o.value.toLowerCase().includes(filterText),
    );
  }, [options, filterText]);

  const displayValue = open ? query : (selected?.label ?? (value.trim() ? value : ''));

  const inputStyle: CSSProperties = { ...defaultInputStyle, ...style };

  const errorId = id && error ? `${id}-error` : undefined;

  return (
    <div className={wrapperClassName}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        disabled={disabled}
        value={displayValue}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onChange={(e) => {
          setOpen(true);
          setQuery(e.target.value);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
            setQuery('');
          }, 100);
        }}
        className={`w-full pr-10 font-source-sans-3 placeholder:text-[#ACACAD] placeholder:opacity-100 placeholder:font-medium focus:outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'focus:border-teal-500 focus:ring-teal-500'
        } ${inputClassName}`.trim()}
        style={{
          ...inputStyle,
          color: displayValue ? '#323234' : '#ACACAD',
          ...(error ? { borderColor: '#ef4444' } : {}),
        }}
      />
      <ChevronDown
        size={20}
        strokeWidth={2}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#ACACAD]"
      />
      {open && !disabled && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-0.5 shadow-lg [scrollbar-width:thin]"
          role="listbox"
        >
          {filtered.length > 0 ? (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQuery('');
                }}
                className="block w-full px-4 py-2.5 text-left font-source-sans-3 text-[18px] font-medium text-[#323234] hover:bg-gray-100"
              >
                {o.label}
              </button>
            ))
          ) : (
            <div className="px-4 py-2.5 font-source-sans-3 text-sm text-gray-500">{emptyMessage}</div>
          )}
        </div>
      )}
      {error ? (
        <p id={errorId} className="mt-1 font-source-sans-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
