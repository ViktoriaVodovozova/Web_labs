import { useEffect, useRef, useState } from 'react';
import { BehaviorSubject } from 'rxjs';
import { createListStream } from '../services/streams';
import { studentsApi } from '../services/studentsApi';

export function useStudents(query, revision) {
  const stream = useRef(null);
  if (!stream.current) stream.current = new BehaviorSubject({ ...query, revision });
  const [state, setState] = useState({ data: [], total: 0, pages: 0, loading: true, error: null });
  useEffect(() => {
    const subscription = createListStream(stream.current, studentsApi.list).subscribe(value => {
      setState(old => ({ ...old, ...value }));
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    // revision makes a successful mutation or Retry refresh the same query.
    stream.current.next({ ...query, revision });
  }, [query, revision]);
  return state;
}
