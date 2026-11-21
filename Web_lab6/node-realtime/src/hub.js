import crypto from 'node:crypto';

// Формат сообщений: {v, type, id, replyTo?, ts, payload}
export const msg = (type, payload = {}, replyTo) =>
  JSON.stringify({ v: 1, type, id: crypto.randomUUID(), ...(replyTo ? { replyTo } : {}), ts: new Date().toISOString(), payload });

export class Hub {
  clients = new Set();
  add(c) { this.clients.add(c); }
  remove(c) { this.clients.delete(c); }
  broadcastAdmins(type, payload) {
    const m = msg(type, payload);
    for (const c of this.clients) if (c.user.role === 'ADMIN') c.ws.send(m);
  }
  toUser(id, type, payload) {
    const m = msg(type, payload);
    for (const c of this.clients) if (String(c.user.id) === String(id)) c.ws.send(m);
  }
}
