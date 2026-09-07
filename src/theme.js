/**
 * Read a design token back out of the stylesheet.
 *
 * The palette is defined once in index.css (Tailwind's `@theme` block). Anything
 * that needs a literal colour value at runtime — third-party components that
 * can't take a CSS class, canvas/SVG drawing — resolves it from here rather than
 * keeping a second copy of the hex.
 */
export function cssVar(name, fallback = "") {
  if (typeof window === "undefined" || !document?.documentElement) return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
