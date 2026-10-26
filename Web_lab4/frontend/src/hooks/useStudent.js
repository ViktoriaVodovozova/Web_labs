import { useEffect, useState } from 'react';
import { studentsApi } from '../services/studentsApi';
export function useStudent(id) {
  const [state, setState] = useState({ data: null, loading: !!id, error: null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!id) { setState({ data: null, loading: false, error: null }); return; }
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    studentsApi.get(id, controller.signal).then(data => setState({ data, loading: false, error: null })).catch(error => {
      if (error.name !== 'AbortError') setState({ data: null, loading: false, error });
    });
    return () => controller.abort();
  }, [id, retry]);
  return { ...state, retry: () => setRetry(x => x + 1) };
}
