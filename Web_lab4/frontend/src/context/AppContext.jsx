import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { session$, setSession } from '../services/session';
import { studentsApi } from '../services/studentsApi';

const AppContext = createContext(null);
function undoKey(username) { return `students.undo.v1:${username}`; }
function readUndo(username) {
  try { const value = JSON.parse(sessionStorage.getItem(undoKey(username))); return Array.isArray(value) ? value.filter(item => item.expiresAt > Date.now()) : []; }
  catch { return []; }
}
export function AppProvider({ children }) {
  const [session, updateSession] = useState(session$.value);
  const [revision, setRevision] = useState(0);
  const [undo, setUndo] = useState(() => readUndo(session?.username));
  const mutationLock = useRef(false);
  const [mutationBusy, setMutationBusy] = useState(false);
  const [undoBusy, setUndoBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const sub = session$.subscribe(updateSession); return () => sub.unsubscribe(); }, []);
  useEffect(() => { setUndo(readUndo(session?.username)); setNotice(null); }, [session?.username]);
  useEffect(() => {
    if (!undo.length) return;
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (!mutationLock.current && undo.some(item => item.expiresAt <= time)) {
        storeUndo(undo.filter(item => item.expiresAt > time));
      }
    }, 250);
    return () => clearInterval(timer);
  }, [undo, session?.username]);
  function storeUndo(value) {
    value = value.filter(item => item.expiresAt > Date.now());
    setNow(Date.now());
    setUndo(value);
    try { sessionStorage.setItem(undoKey(session?.username), JSON.stringify(value)); } catch { /* usable in memory */ }
  }
  function changed() { setRevision(value => value + 1); }
  async function deleteStudent(student) {
    if (mutationLock.current) return false;
    mutationLock.current = true; setMutationBusy(true);
    try {
      await studentsApi.delete(student.id);
      if (session$.value?.username !== session?.username) return false;
      storeUndo([...undo, { id: student.id, fullName: student.fullName, expiresAt: Date.now() + 10000 }]);
      changed(); return true;
    } finally { mutationLock.current = false; setMutationBusy(false); }
  }
  async function undoDelete() {
    if (mutationLock.current || !undo.length) return;
    if (undo.at(-1).expiresAt <= Date.now()) {
      storeUndo(undo.filter(item => item.expiresAt > Date.now()));
      return;
    }
    mutationLock.current = true; setMutationBusy(true);
    setUndoBusy(true); setNotice(null);
    try {
      await studentsApi.restore(undo.at(-1).id);
      if (session$.value?.username !== session?.username) return;
      storeUndo(undo.slice(0, -1)); changed();
    } catch (error) { setNotice({ error: true, text: error.message }); }
    finally { mutationLock.current = false; setMutationBusy(false); setUndoBusy(false); }
  }
  return <AppContext.Provider value={{ session, isAdmin: session?.role === 'ADMIN', revision, changed,
    mutationBusy, logout: () => { setSession(null); setUndo([]); }, undo, undoSeconds: undo.length ? Math.max(0, Math.ceil((undo.at(-1).expiresAt - now) / 1000)) : 0, undoBusy, undoDelete, deleteStudent, notice, setNotice }}>
    {children}
  </AppContext.Provider>;
}
export function useApp() { return useContext(AppContext); }
