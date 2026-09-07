/**
 * Single source of truth for match scoring.
 *
 * The score regex, the banding thresholds, and the colours each band maps to were
 * previously duplicated across the dashboard, the report page, and the PDF export
 * — and had drifted apart. Everything reads from here now.
 */

export const STRONG_MATCH_MIN = 80;
export const GOOD_MATCH_MIN = 60;

const SCORE_PATTERN = /match\s*score\D{0,20}(\d{1,3})\s*(?:\/\s*100|%)/i;

function clamp(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

/** Pull "Match Score: 78/100" (or "78%") out of an AI analysis blob. */
export function scoreFromText(text = "") {
  return clamp(String(text).match(SCORE_PATTERN)?.[1]);
}

/** Prefer an explicit numeric score on the record, else parse the analysis text. */
export function scoreFromMatch(match = {}) {
  if (Number.isFinite(Number(match.score)) && match.score !== null && match.score !== "") {
    return clamp(match.score);
  }
  return scoreFromText(match.match_analysis);
}

/**
 * Band a score into its label and colours. Colours are CSS custom properties
 * defined in index.css, so the palette stays defined in exactly one place.
 */
export function scoreTone(score) {
  if (score >= STRONG_MATCH_MIN) {
    return { label: "Strong Match", color: "var(--color-ok-600)", badge: "bg-ok-50 text-ok-700" };
  }
  if (score >= GOOD_MATCH_MIN) {
    return { label: "Good Match", color: "var(--color-brand-600)", badge: "bg-brand-50 text-brand-700" };
  }
  return { label: "Needs Improvement", color: "var(--color-bad-600)", badge: "bg-bad-50 text-bad-600" };
}

/** Neutral track behind a score ring / meter. */
export const SCORE_TRACK_COLOR = "var(--color-line)";
