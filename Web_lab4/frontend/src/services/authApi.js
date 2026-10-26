import { api, request } from './httpClient';
import { getSessionGeneration, setSession } from './session';

async function authenticate(kind, values) {
  const generation = getSessionGeneration();
  const { data } = await request(`/auth/${kind}`, {
    method: 'POST',
    body: JSON.stringify(values),
  });
  if (generation === getSessionGeneration()) setSession(data);
  return data;
}

export const authApi = {
  login: values => authenticate('login', values),
  register: values => authenticate('register', values),
  getProfile: signal => api('/auth/me', { signal }).then(result => result.data),
};
