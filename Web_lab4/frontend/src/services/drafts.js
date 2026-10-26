export const draftKey = (user, id) => `students.draft.v1:${user}:${id || 'new'}`;
export function readDraft(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
export function writeDraft(key, value) {
  try { localStorage.setItem(key, JSON.stringify({ value, savedAt: new Date().toISOString() })); return true; }
  catch { return false; }
}
export function clearDraft(key) { try { localStorage.removeItem(key); } catch { /* optional storage */ } }
