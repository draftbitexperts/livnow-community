import type { CSSProperties } from 'react';

/**
 * Shared overrides for form select (dropdown) components.
 * Use with form input style: style={{ ...formInputStyle, ...formSelectOverrides, color: ... }}
 * Prevents placeholder/value text from being cut off (smaller font + adjusted padding).
 */
export const formSelectOverrides: CSSProperties = {
  fontSize: 16,
  lineHeight: '20px',
  padding: '14px 16px',
};
