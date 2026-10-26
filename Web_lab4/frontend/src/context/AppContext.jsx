import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { session$, setSession } from '../services/session';
import { studentsApi } from '../services/studentsApi';

const AppContext = createContext(null);
function undoKey(username) { return `students.undo.v1:${username}`; }
function readUndo(username) {
  try { const value = JSON.parse(sessionStorage.getItem(undoKey(username))); return Array.isArray(value) ? value : []; }
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
  useEffect(() => { const sub = session$.subscribe(updateSession); return () => sub.unsubscribe(); }, []);
  useEffect(() => { setUndo(readUndo(session?.username)); setNotice(null); }, [session?.username]);
  function storeUndo(value) {
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
      storeUndo([...undo, { id: student.id, fullName: student.fullName }]);
      changed(); return true;
    } finally { mutationLock.current = false; setMutationBusy(false); }
  }
  async function undoDelete() {
    if (mutationLock.current || !undo.length) return;
    mutationLock.current = true; setMutationBusy(true);
    setUndoBusy(true); setNotice(null);
    try {
      await studentsApi.restore(undo.at(-1).id);
      if (session$.value?.username !== session?.username) return;
      storeUndo(undo.slice(0, -1)); changed();
      setNotice({ text: 'Студент восстановлен. Активные фильтры могут скрывать его в списке.' });
    } catch (error) { setNotice({ error: true, text: error.message }); }
    finally { mutationLock.current = false; setMutationBusy(false); setUndoBusy(false); }
  }
  return <AppContext.Provider value={{ session, isAdmin: session?.role === 'ADMIN', revision, changed,
    mutationBusy, logout: () => { setSession(null); setUndo([]); }, undo, undoBusy, undoDelete, deleteStudent, notice, setNotice }}>
    {children}
  </AppContext.Provider>;
}
export function useApp() { return useContext(AppContext); }
