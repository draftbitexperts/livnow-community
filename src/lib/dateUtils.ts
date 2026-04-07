/**
 * American date format: mm/dd/yyyy
 * - Use formatDateToAmerican() for displaying dates in the UI.
 * - Use toInputDate() for <input type="date"> values (HTML requires yyyy-mm-dd).
 */

const DATE_INPUT_FORMAT = /^\d{4}-\d{2}-\d{2}/;

/**
 * Format a date string for display in the American format mm/dd/yyyy.
 * Accepts ISO strings (yyyy-mm-dd or with time), or already local date strings.
 * Returns '—' for null/undefined/invalid; empty string for empty string.
 */
export function formatDateToAmerican(
  value: string | null | undefined
): string {
  if (value == null || value === '') return value === '' ? '' : '—';
  const trimmed = value.trim();
  if (!trimmed) return '—';

  // Already yyyy-mm-dd (or ISO with time)
  const isoMatch = trimmed.match(DATE_INPUT_FORMAT);
  if (isoMatch) {
    const [y, m, d] = trimmed.split(/[-T]/).map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return '—';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(m)}/${pad(d)}/${y}`;
  }

  // Try parsing as local date (e.g. "May 16, 2022" or other formats)
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '—';
  const month = parsed.getMonth() + 1;
  const day = parsed.getDate();
  const year = parsed.getFullYear();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(month)}/${pad(day)}/${year}`;
}

/**
 * Normalize a date string to yyyy-mm-dd for use as <input type="date"> value.
 * HTML5 date inputs require value in yyyy-mm-dd. Returns '' for null/undefined/invalid.
 */
export function toInputDate(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  const isoMatch = trimmed.match(DATE_INPUT_FORMAT);
  if (isoMatch) return isoMatch[0]; // already yyyy-mm-dd

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '';
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
