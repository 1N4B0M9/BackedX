/**
 * Merge class names (Tailwind-friendly). Accepts strings and undefined.
 */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ').trim() || undefined;
}
