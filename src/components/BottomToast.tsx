import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check } from 'lucide-react';

export type BottomToastVariant = 'success' | 'error';

/** Design spec: muted green success pill */
const SUCCESS_BG = '#6B9E7C';
const ERROR_BG = '#C75450';

export type BottomToastPayload = {
  message: string;
  variant: BottomToastVariant;
};

export function BottomToast({
  message,
  variant,
  onDismiss,
}: BottomToastPayload & { onDismiss: () => void }) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const id = window.setTimeout(() => onDismissRef.current(), 5000);
    return () => window.clearTimeout(id);
  }, [message, variant]);

  const bg = variant === 'success' ? SUCCESS_BG : ERROR_BG;
  const iconTint = variant === 'success' ? SUCCESS_BG : ERROR_BG;

  return createPortal(
    <div
      className="pointer-events-none fixed left-1/2 z-[320] flex w-[min(100vw-2rem,28rem)] -translate-x-1/2 justify-center px-4"
      style={{ bottom: 'calc(50px + env(safe-area-inset-bottom, 0px))' }}
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-white shadow-lg"
        style={{ backgroundColor: bg }}
      >
        {variant === 'success' ? (
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white"
            aria-hidden
          >
            <Check className="h-4 w-4" strokeWidth={2.5} style={{ color: iconTint }} />
          </span>
        ) : (
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white"
            aria-hidden
          >
            <AlertCircle className="h-4 w-4" strokeWidth={2.5} style={{ color: iconTint }} />
          </span>
        )}
        <span className="min-w-0 flex-1 leading-snug">{message}</span>
      </div>
    </div>,
    document.body,
  );
}
