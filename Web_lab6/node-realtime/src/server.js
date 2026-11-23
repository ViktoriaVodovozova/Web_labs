import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { config } from './config.js';
import { AuditLog } from './audit.js';
import { authenticate, checkServiceKey, consumeTicket, issueTicket, requireRole } from './auth.js';
import { HttpError } from './java.js';
import { Hub, msg } from './hub.js';
import { Jobs } from './jobs.js';
import { acceptUpgrade, rejectUpgrade } from './ws.js';

const audit = new AuditLog(path.join(config.dataDir, 'audit.jsonl'));
await audit.load();
const hub = new Hub();
const jobs = new Jobs({ hub, audit });

const json = (res, status, body) => {
  const s = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(s) });
  res.end(s);
};

async function readJson(req, limit = 1 << 20) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new HttpError(413, 'Слишком большое тело запроса');
    chunks.push(c);
  }
  try { return chunks.length ? JSON.parse(Buffer.concat(chunks)) : {}; } catch { throw new HttpError(400, 'Некорректный JSON'); }
}

const delim = (v) => (v === ';' || v === '\t' ? v : ',');

async function route(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  const q = Object.fromEntries(url.searchParams);
  const m = req.method;

  if (m === 'QUERY' && p === '/health') return json(res, 200, { ok: true, auditEntries: audit.entries.length });


  if (m === 'POST' && p === '/internal/events') {
    checkServiceKey(req);
    const ev = await readJson(req);
    const r = await audit.append(ev);
    if (!r.duplicate) hub.broadcastAdmins('student.event', r.entry);
    return json(res, 200, { ok: true, duplicate: r.duplicate, seq: r.entry.seq });
  }


  if (m === 'POST' && p === '/ticket') {
    const { user, token } = await authenticate(req);
    return json(res, 200, { ticket: issueTicket(user, token), expiresInSec: config.ticketTtlMs / 1000, user });
  }


  if (m === 'QUERY' && p === '/audit') {
    const { user } = await authenticate(req);
    requireRole(user, config.auditRoles);
    return json(res, 200, audit.query(q));
  }


  if (m === 'POST' && p === '/export') {
    const { user, token } = await authenticate(req);
    requireRole(user, config.importExportRoles);
    const job = jobs.startExport(user, token, delim(q.delimiter));
    return json(res, 202, { jobId: job.id });
  }


  if (m === 'POST' && p === '/import') {
    const { user, token } = await authenticate(req);
    requireRole(user, config.importExportRoles);
    const onConflict = ['skip', 'update', 'fail'].includes(q.onConflict) ? q.onConflict : 'skip';
    if (+req.headers['content-length'] > config.maxImportBytes) throw new HttpError(413, 'Файл слишком большой');
    const id = crypto.randomUUID();
    const tmp = path.join(config.dataDir, 'uploads', id + '.csv');
    await fs.promises.mkdir(path.dirname(tmp), { recursive: true });
    let size = 0;
    const limiter = new Transform({
      transform(c, _e, cb) {
        size += c.length;
        size > config.maxImportBytes ? cb(new HttpError(413, 'Файл слишком большой')) : cb(null, c);
      },
    });
    try {
      await pipeline(req, limiter, fs.createWriteStream(tmp));
    } catch (e) {
      await fs.promises.rm(tmp, { force: true });
      throw e instanceof HttpError ? e : new HttpError(400, 'Загрузка прервана');
    }
    jobs.startImport({ id, user, token, file: tmp, onConflict, delimiter: delim(q.delimiter) });
    return json(res, 202, { jobId: id });
  }


  const mj = p.match(/^\/jobs\/([\w-]+)(\/file)?$/);
  if (m === 'QUERY' && mj) {
    const { user } = await authenticate(req);
    const job = jobs.get(mj[1]);
    if (!job || (String(job.owner.id) !== String(user.id) && user.role !== 'ADMIN')) throw new HttpError(404, 'Задание не найдено');
    if (!mj[2]) return json(res, 200, jobs.snapshot(job));
    if (job.type !== 'export' || job.state !== 'done') throw new HttpError(409, 'Файл ещё не готов');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="students-${job.id.slice(0, 8)}.csv"`,
    });
    await pipeline(fs.createReadStream(job.file), res);
    return;
  }

  throw new HttpError(404, 'Не найдено');
}

const server = http.createServer((req, res) => {
  route(req, res).catch((e) => {
    if (res.headersSent) return res.destroy();
    if (e instanceof HttpError) return json(res, e.status, { error: e.message });
    console.error(e);
    json(res, 500, { error: 'Внутренняя ошибка' });
  });
});


server.on('upgrade', (req, socket) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname !== '/ws') return rejectUpgrade(socket, 404, 'Not Found');
  if (!config.allowedOrigins.includes(req.headers.origin)) return rejectUpgrade(socket, 403, 'Forbidden');
  const ticket = consumeTicket(url.searchParams.get('ticket'));
  if (!ticket) return rejectUpgrade(socket, 401, 'Unauthorized');
  const ws = acceptUpgrade(req, socket);
  if (!ws) return;

  const { user, expiresAt } = ticket;
  const client = { ws, user, alive: true };
  const expiry = setTimeout(() => ws.close(1008), Math.max(0, expiresAt - Date.now()));
  hub.add(client);
  ws.on('pong', () => { client.alive = true; });
  ws.on('close', () => {
    clearTimeout(expiry);
    hub.remove(client);
  });
  ws.send(msg('hello', { user, lastSeq: audit.entries.length, heartbeatMs: config.heartbeatMs }));

  ws.on('message', (raw) => {
    client.alive = true;
    let m;
    try { m = JSON.parse(raw); } catch { return ws.send(msg('error', { code: 'BAD_JSON', message: 'Некорректный JSON' })); }
    if (!m || m.v !== 1 || typeof m.type !== 'string' || typeof m.id !== 'string') {
      return ws.send(msg('error', { code: 'BAD_MESSAGE', message: 'Некорректное сообщение' }));
    }
    const reply = (type, payload) => ws.send(msg(type, payload, m.id));
    const err = (code, message) => reply('error', { code, message });
    switch (m.type) {
      case 'ping': return reply('pong');
      case 'audit.list':
        if (!config.auditRoles.includes(user.role)) return err('FORBIDDEN', 'Недостаточно прав');
        return reply('audit.list.result', audit.query(m.payload || {}));
      case 'job.get': {
        const j = jobs.get(m.payload?.id);
        if (!j || String(j.owner.id) !== String(user.id)) return err('NOT_FOUND', 'Задание не найдено');
        return reply('job.update', jobs.snapshot(j));
      }
      default: return err('UNKNOWN_TYPE', `Неизвестный тип: ${m.type}`);
    }
  });
});


setInterval(() => {
  for (const c of hub.clients) {
    if (!c.alive) { c.ws.terminate(); continue; }
    c.alive = false;
    c.ws.ping();
  }
}, config.heartbeatMs).unref();

server.listen(config.port, () => console.log(`node-realtime слушает :${config.port}`));

process.on('SIGTERM', () => {
  for (const c of hub.clients) c.ws.close(1001);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
});
