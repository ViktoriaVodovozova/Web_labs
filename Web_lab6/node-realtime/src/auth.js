import crypto from 'node:crypto';
import { config } from './config.js';
import { HttpError, fetchProfile } from './java.js';

export const bearer = (req) => {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  if (req.method !== 'GET' && !config.allowedOrigins.includes(req.headers.origin)) return null;
  const cookie = req.headers.cookie?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith('accessToken='));
  return cookie?.slice('accessToken='.length) || null;
};

export async function authenticate(req) {
  const token = bearer(req);
  if (!token) throw new HttpError(401, 'Нужен токен');
  let user;
  try { user = await fetchProfile(token); } catch { throw new HttpError(502, 'Сервис авторизации недоступен'); }
  if (!user) throw new HttpError(401, 'Недействительный токен');
  return { user, token };
}

export const requireRole = (user, roles) => {
  if (!roles.includes(user.role)) throw new HttpError(403, 'Недостаточно прав');
};

// Одноразовые тикеты: браузерный WebSocket не умеет Authorization-заголовок,
// а JWT в URL светился бы в логах. Тикет живёт 30 с и используется один раз.
const tickets = new Map();
export function issueTicket(user, token) {
  // Профиль и подпись JWT уже проверены Java. exp ограничивает срок сокета.
  let expiresAt = Date.now() + 15 * 60 * 1000;
  try {
    const { exp } = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
    if (Number.isFinite(exp)) expiresAt = Math.min(expiresAt, exp * 1000);
  } catch {}

  const t = crypto.randomBytes(24).toString('hex');
  tickets.set(t, { user, expiresAt, exp: Math.min(expiresAt, Date.now() + config.ticketTtlMs) });
  return t;
}
export function consumeTicket(t) {
  const e = tickets.get(t);
  tickets.delete(t);
  return e && e.exp > Date.now() ? e : null;
}
setInterval(() => {
  for (const [k, v] of tickets) if (v.exp < Date.now()) tickets.delete(k);
}, 60_000).unref();

export function checkServiceKey(req) {
  const a = Buffer.from(String(req.headers['x-service-key'] || ''));
  const b = Buffer.from(config.serviceKey);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new HttpError(401, 'Неверный служебный ключ');
}
