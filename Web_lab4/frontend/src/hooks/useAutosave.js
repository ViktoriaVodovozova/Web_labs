import { useEffect, useRef, useState } from 'react';
import { Subject, merge, debounceTime, concatMap, defer, of, catchError, map, filter } from 'rxjs';

// switchMap is right for reads; writes use concatMap so they cannot overtake each other.
export function useAutosave(save, onSaved) {
  const callbacks = useRef({ save, onSaved });
  callbacks.current = { save, onSaved };
  const [state, setState] = useState({ status: 'idle', error: null, pending: 0 });
  const instance = useRef(null);
  useEffect(() => {
    const changes = new Subject();
    const immediate = new Subject();
    let latest = null;
    let lastSaved = null;
    let pending = 0;
    let mounted = true;
    const update = value => { if (mounted) setState(old => ({ ...old, ...value, pending })); };
    const subscription = merge(changes.pipe(debounceTime(900)), immediate).pipe(
      filter(value => value !== null),
      concatMap(value => defer(async () => {
        const key = JSON.stringify(value);
        if (key === lastSaved) return { value, skipped: true };
        pending++; update({ status: 'saving', error: null });
        try {
          const result = await callbacks.current.save(value);
          lastSaved = key;
          return { value, result };
        } finally { pending--; }
      }).pipe(catchError(error => of({ error })))),
      map(result => {
        if (result.error) update({ status: 'error', error: result.error });
        else {
          if (!result.skipped) callbacks.current.onSaved(result.value, result.result);
          update({ status: latest === null ? 'invalid' : JSON.stringify(latest) === JSON.stringify(result.value) ? 'saved' : 'waiting', error: null });
        }
      }),
    ).subscribe();
    instance.current = {
      change(value) { latest = value; update({ status: value ? 'waiting' : 'invalid', error: null }); changes.next(value); },
      flush(value) { latest = value; immediate.next(value); },
    };
    // Invalid values cancel the pending debounce too, but never reach the API.
    return () => { mounted = false; subscription.unsubscribe(); changes.complete(); immediate.complete(); };
  }, []);
  return { ...state, change: value => instance.current?.change(value), flush: value => instance.current?.flush(value) };
}
