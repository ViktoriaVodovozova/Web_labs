// Интеграционный тест: мок Java + реальный сервис + WebSocket-клиент (глобальный WebSocket Node 22)
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const J = 4101, N = 4102;
const students = [{ id: 1, fullName: 'Ann A', group: 'G1', isuId: '000001', dormitory: 1, room: 10, moveInDate: '2024-01-01', isForeigner: false, notes: '' }];
let nextId = 2;
const mock = http.createServer(async (req, res) => {
  const tok = (req.headers.authorization || '').slice(7);
  const send = (s, b) => { res.writeHead(s, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(b)); };
  if (!['admin', 'user'].includes(tok)) return send(401, {});
  if (req.url === '/api/auth/me') return send(200, { id: tok === 'admin' ? 1 : 2, username: tok, role: tok.toUpperCase() });
  if (req.url.startsWith('/api/requests?') && req.method === 'GET') return send(200, students);
  let body = ''; for await (const c of req) body += c;
  const id = Number(req.url.split('/').at(-1));
  if (req.method === 'GET' && id) {
    const student = students.find((item) => item.id === id);
    if (!student) return send(404, {});
    res.setHeader('ETag', '"old"');
    return send(200, student);
  }
  if (req.method === 'PUT') {
    assert.equal(req.headers['if-match'], '"old"');
    return send(412, { message: 'Студент изменился после чтения' });
  }
  if (req.method === 'POST') { const s = { id: nextId++, ...JSON.parse(body) }; students.push(s); return send(201, s); }
  send(404, {});
});

test('end-to-end', async (t) => {
  await new Promise((r) => mock.listen(J, r));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-'));
  const env = { ...process.env, PORT: N, JAVA_URL: `http://127.0.0.1:${J}`, DATA_DIR: dir, SERVICE_KEY: 'k', ALLOWED_ORIGINS: 'http://localhost' };
  const start = async () => {
    const p = spawn('node', ['src/server.js'], { env, stdio: 'pipe' });
    for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://127.0.0.1:${N}/health`)).ok) return p; } catch {} await new Promise((r) => setTimeout(r, 100)); }
    throw new Error('не стартовал');
  };
  let proc = await start();
  t.after(() => { proc.kill(); mock.close(); });
  const B = `http://127.0.0.1:${N}`;
  const H = (tok) => ({ Authorization: `Bearer ${tok}` });

  // Билет браузера по HttpOnly-cookie и допустимому Origin.
  const cookies = { Cookie: 'accessToken=admin' };
  assert.equal((await fetch(B + '/ticket', { method: 'POST', headers: cookies })).status, 401);
  const { ticket } = await (await fetch(B + '/ticket', {
    method: 'POST', headers: { ...cookies, Origin: 'http://localhost' },
  })).json();
  const events = [];
  const ws = new WebSocket(`ws://127.0.0.1:${N}/ws?ticket=${ticket}`, { headers: { Origin: 'http://localhost' } });
  await new Promise((r) => ws.addEventListener('open', r));
  ws.addEventListener('message', (e) => events.push(JSON.parse(e.data)));

  // тикет одноразовый, чужой Origin отклоняется
  const bad = new WebSocket(`ws://127.0.0.1:${N}/ws?ticket=${ticket}`, { headers: { Origin: 'http://localhost' } });
  await new Promise((r) => { bad.addEventListener('error', r); bad.addEventListener('close', r); });

  // внутренний канал: без ключа 401, с ключом — запись и рассылка, повтор — дубликат
  const ev = { eventId: 'e1', action: 'STUDENT_CREATED', entityId: 5, occurredAt: new Date().toISOString(), actor: { id: 1, username: 'admin', role: 'ADMIN' }, after: { id: 5 } };
  const post = (key) => fetch(B + '/internal/events', { method: 'POST', headers: { 'x-service-key': key, 'content-type': 'application/json' }, body: JSON.stringify(ev) });
  assert.equal((await post('wrong')).status, 401);
  assert.equal((await (await post('k')).json()).duplicate, false);
  assert.equal((await (await post('k')).json()).duplicate, true);
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(events.filter((e) => e.type === 'student.event').length, 1);

  // права на журнал
  assert.equal((await fetch(B + '/audit', { headers: H('user') })).status, 403);
  assert.equal((await (await fetch(B + '/audit', { headers: H('admin') })).json()).total, 1);

  // журнал переживает перезапуск
  proc.kill(); await new Promise((r) => setTimeout(r, 200)); proc = await start();
  assert.equal((await (await fetch(B + '/audit', { headers: H('admin') })).json()).total, 1);
  assert.equal((await (await post('k')).json()).duplicate, true);

  // Импорт с полями Java: дубликаты ИСУ, невалидный ИСУ, многострочная заметка.
  const csv = '\uFEFFfullName,group,isuId,dormitory,room,moveInDate,isForeigner,notes\r\nBob B,G2,000002,1,20,2024-01-01,true,\r\nCy C,G2,000003,2,30,2024-01-01,false,"Multi\nline"\r\nBob B,G2,000002,1,20,2024-01-01,true,\r\nAnn A,G1,000001,1,10,2024-01-01,false,\r\nBad B,G2,invalid,1,20,2024-01-01,false,\r\n';
  const { jobId } = await (await fetch(B + '/import?onConflict=skip', { method: 'POST', headers: { ...H('admin'), 'content-type': 'text/csv' }, body: csv })).json();
  let job;
  for (let i = 0; i < 50; i++) { job = await (await fetch(`${B}/jobs/${jobId}`, { headers: H('admin') })).json(); if (job.state !== 'running' && job.state !== 'queued') break; await new Promise((r) => setTimeout(r, 100)); }
  assert.equal(job.state, 'done');
  assert.deepEqual([job.progress.created, job.progress.skipped, job.progress.failed], [2, 2, 1]);
  assert.equal((await fetch(B + '/import', { method: 'POST', headers: H('user'), body: 'x' })).status, 403);

  const updateCsv = 'id,fullName,group,isuId,dormitory,room,moveInDate,isForeigner,notes\n1,Ann A,G1,000001,1,11,2024-01-01,false,';
  const update = await (await fetch(B + '/import?onConflict=update', {
    method: 'POST', headers: H('admin'), body: updateCsv,
  })).json();
  for (let i = 0; i < 50; i++) {
    job = await (await fetch(`${B}/jobs/${update.jobId}`, { headers: H('admin') })).json();
    if (job.state === 'done' || job.state === 'failed') break;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal(job.state, 'done');
  assert.equal(job.progress.updated, 0);
  assert.equal(job.errors[0]?.code, 'CONFLICT');

  // экспорт
  const ex = await (await fetch(B + '/export', { method: 'POST', headers: H('admin') })).json();
  for (let i = 0; i < 50; i++) { job = await (await fetch(`${B}/jobs/${ex.jobId}`, { headers: H('admin') })).json(); if (job.state === 'done') break; await new Promise((r) => setTimeout(r, 100)); }
  const raw = Buffer.from(await (await fetch(`${B}/jobs/${ex.jobId}/file`, { headers: H('admin') })).arrayBuffer());
  assert.deepEqual([...raw.subarray(0, 3)], [0xef, 0xbb, 0xbf]); // BOM для Excel
  const file = raw.toString('utf8');
  assert.match(file, /id,fullName,group,isuId,dormitory,room,moveInDate,isForeigner,notes\r\n/);
  assert.ok(file.includes('"Multi\nline"'));
  ws.close();
});
