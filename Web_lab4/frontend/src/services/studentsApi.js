import { api } from './httpClient';

export const studentsApi = {
  list: (query, signal) => {
    const params = new URLSearchParams(Object.entries(query).filter(([key]) => key !== 'revision').filter(([, value]) => value !== '' && value != null));
    return api(`/requests?${params}`, { signal });
  },
  get: (id, signal) => api(`/requests/${encodeURIComponent(id)}`, { signal }).then(r => r.data),
  create: data => api('/requests', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
  update: (id, data) => api(`/requests/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }).then(r => r.data),
  delete: id => api(`/requests/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  restore: id => api(`/requests/${encodeURIComponent(id)}/restore`, { method: 'POST' }).then(r => r.data),
};
