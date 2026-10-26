import { BehaviorSubject } from 'rxjs';

const KEY = 'students.session.v1';
function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY));
    return value?.accessToken && value?.refreshToken && value?.username ? value : null;
  } catch { return null; }
}
export const session$ = new BehaviorSubject(readSession());
let generation = 0;
export function setSession(value) {
  generation++;
  try {
    if (value) sessionStorage.setItem(KEY, JSON.stringify(value));
    else sessionStorage.removeItem(KEY);
  } catch { /* The current tab can still work with an in-memory session. */ }
  session$.next(value);
}

export function getSessionGeneration() { return generation; }

// A refresh changes tokens, while the user session itself stays the same.
export function updateTokens(value) {
  try { sessionStorage.setItem(KEY, JSON.stringify(value)); } catch { /* memory fallback */ }
  session$.next(value);
}
