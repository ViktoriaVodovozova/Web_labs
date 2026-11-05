import { BehaviorSubject } from 'rxjs';

const KEY = 'students.session.v1';
function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY));
    return value?.accessToken && value?.refreshToken && value?.username
      ? value
      : null;
  } catch {
    return null;
  }
}
export const session$ = new BehaviorSubject(readSession());
let generation = 0;
export function setSession(value) {
  generation++;
  try {
    if (value) sessionStorage.setItem(KEY, JSON.stringify(value));
    else sessionStorage.removeItem(KEY);
  } catch {
  }
  session$.next(value);
}

export function getSessionGeneration() {
  return generation;
}

export function updateTokens(value) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
  }
  session$.next(value);
}
