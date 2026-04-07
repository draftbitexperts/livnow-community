import { useMemo, useState, type CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';
import { US_STATES } from '@/lib/constants/usStates';

interface StateSearchSelectProps {
  value: string;
  onChange: (nextCode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Match SearchableFormSelect / Add Resident pickers (icon aligns to field, not grid column). */
  wrapperClassName?: string;
}

export default function StateSearchSelect({
  value,
  onChange,
  placeholder = 'Select',
  disabled = false,
  className,
  style,
  wrapperClassName = 'relative w-full max-w-[335px]',
}: StateSearchSelectProps) {
  const selectedState = useMemo(() => {
    const normalized = (value ?? '').trim().toLowerCase();
    return US_STATES.find(
      (s) => s.code.toLowerCase() === normalized || s.name.toLowerCase() === normalized
    );
  }, [value]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filterText = open ? query.trim().toLowerCase() : '';
  const filteredStates = filterText
    ? US_STATES.filter(
        (s) =>
          s.name.toLowerCase().includes(filterText) || s.code.toLowerCase().includes(filterText)
      )
    : US_STATES;

  const displayValue = open ? query : (selectedState?.name ?? (value.trim() ? value : ''));

  return (
    <div className={wrapperClassName}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onChange={(e) => {
          setOpen(true);
          setQuery(e.target.value);
        }}
        onBlur={() => {
          setTimeout(() => {
            setOpen(false);
            setQuery('');
          }, 100);
        }}
        className={`${className ?? ''} placeholder:text-[#ACACAD] placeholder:opacity-100 placeholder:font-medium`.trim()}
        style={style}
      />
      <ChevronDown
        size={20}
        strokeWidth={2}
        className="pointer-events-none absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-[#ACACAD]"
        aria-hidden
      />
      {open && !disabled && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-0.5 shadow-lg [scrollbar-width:thin]"
          role="listbox"
        >
          {filteredStates.length > 0 ? (
            filteredStates.map((state) => (
              <button
                key={state.code}
                type="button"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(state.code);
                  setOpen(false);
                  setQuery('');
                }}
                className="block w-full px-4 py-2.5 text-left font-source-sans-3 text-[18px] font-medium text-[#323234] hover:bg-gray-100"
              >
                {state.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-2.5 font-source-sans-3 text-sm text-gray-500">No states found</div>
          )}
        </div>
      )}
    </div>
  );
}
