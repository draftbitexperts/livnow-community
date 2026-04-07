/**
 * Format a string in sentence case (first character uppercase, rest lowercase).
 * Underscores are replaced with spaces and each word is capitalized (e.g. "on_hold" → "On Hold").
 * Use for status labels and similar UI text.
 */
export function toSentenceCase(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  const s = value.trim();
  if (!s) return '';
  return s
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
