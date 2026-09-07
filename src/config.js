/**
 * Environment configuration.
 *
 * Values live in frontend/.env (see .env.example) — nothing here falls back to a
 * baked-in URL, so a missing variable fails loudly instead of silently pointing
 * the app at the wrong host or port.
 */

function required(name, value) {
  if (!value) {
    throw new Error(`Missing ${name} — add it to frontend/.env (see frontend/.env.example)`);
  }
  return value;
}

export const API_BASE_URL = required("VITE_API_BASE_URL", import.meta.env.VITE_API_BASE_URL);

export const APP_NAME = import.meta.env.VITE_APP_NAME || "TrueFit AI";

/** How many matches to pull for history + dashboard statistics. */
export const HISTORY_LIMIT = Number(import.meta.env.VITE_HISTORY_LIMIT) || 100;

/** How many of those to render in the dashboard's Recent Matches list. */
export const RECENT_MATCHES_SHOWN = Number(import.meta.env.VITE_RECENT_MATCHES_SHOWN) || 5;
