// The active report intentionally lives only in browser memory.
// It remains available while the user navigates in the app, but is cleared by a refresh.
let activeMatch = null;

export function getActiveMatch() {
  return activeMatch;
}

export function setActiveMatch(match) {
  activeMatch = match;
}
