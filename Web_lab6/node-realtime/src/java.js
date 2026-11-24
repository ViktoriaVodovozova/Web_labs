import { config } from './config.js';

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}


export async function java(method, path, token, body, { ifMatch, withEtag = false } = {}) {
  let r;
  try {
    r = await fetch(config.javaUrl + path, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}), ...(ifMatch ? { 'If-Match': ifMatch } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    const err = new Error('Java-backend недоступен: ' + e.message);
    err.network = true;
    throw err;
  }
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!r.ok) throw new HttpError(r.status, data?.message || `Java вернул ${r.status}`);
  return withEtag ? { data, etag: r.headers.get('etag') } : data;
}

export async function fetchProfile(token) {
  try {
    const p = await java('QUERY', config.profilePath, token);
    return {
      id: p.id,
      username: p.username ?? p.login ?? p.email,
      role: p.role,
    };
  } catch (e) {
    if (e.status === 401 || e.status === 403) return null;
    throw e;
  }
}


export async function* students(token) {
  for (let page = 0; ; page++) {
    const items = await java(
      'QUERY',
      `${config.studentsPath}?page=${page}&size=${config.pageSize}&sortBy=id`,
      token
    );
    yield { items, page };
    if (items.length < config.pageSize) return;
  }
}
