import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  /** Larger tap targets for mobile / modals (min 44px). */
  variant?: 'default' | 'touch';
}

const paginationColor = '#ACACAD';

const paginationTextStyle = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '22px',
  letterSpacing: '0%',
  color: paginationColor,
};

export default function Pagination({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  variant = 'default',
}: PaginationProps) {
  const touch = variant === 'touch';
  const btnPad = touch
    ? 'min-h-[44px] min-w-[44px] px-2 sm:min-h-0 sm:min-w-0 sm:px-0 touch-manipulation active:opacity-80'
    : '';
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-0 pt-2 sm:pt-4">
      <button
        type="button"
        onClick={onPrevious}
        disabled={!hasPrevious}
        className={`flex items-center gap-1.5 font-source-sans-3 rounded-lg ${btnPad} ${!hasPrevious ? 'cursor-not-allowed opacity-60' : 'hover:opacity-90'}`}
        style={paginationTextStyle}
      >
        <ChevronLeft size={18} style={{ color: paginationColor, flexShrink: 0 }} />
        Previous
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        className={`flex items-center gap-1.5 font-source-sans-3 rounded-lg ${btnPad} ${!hasNext ? 'cursor-not-allowed opacity-60' : 'hover:opacity-90'}`}
        style={paginationTextStyle}
      >
        Next
        <ChevronRight size={18} style={{ color: paginationColor, flexShrink: 0 }} />
      </button>
    </div>
  );
}
