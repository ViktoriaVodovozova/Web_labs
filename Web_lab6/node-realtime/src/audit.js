import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { HttpError } from './java.js';

export const ACTIONS = new Set(['STUDENT_CREATED', 'STUDENT_UPDATED', 'STUDENT_DELETED', 'STUDENT_IMPORT']);

// Журнал аудита: append-only JSON Lines. Переживает перезапуск; eventId делает приём идемпотентным.
export class AuditLog {
  entries = [];
  byId = new Map();
  #fh;
  #queue = Promise.resolve();

  constructor(file) { this.file = file; }

  async load() {
    await fs.promises.mkdir(path.dirname(this.file), { recursive: true });
    if (fs.existsSync(this.file)) {
      const rl = readline.createInterface({ input: fs.createReadStream(this.file), crlfDelay: Infinity });
      for await (const line of rl) {
        if (!line.trim()) continue;
        try {
          const e = JSON.parse(line);
          this.entries.push(e);
          this.byId.set(e.eventId, e);
        } catch { console.warn('audit: повреждённая строка пропущена'); }
      }
    }
    this.#fh = await fs.promises.open(this.file, 'a');
  }

  #enqueue(fn) {
    const run = this.#queue.then(fn);
    this.#queue = run.catch(() => {});
    return run;
  }

  static validate(ev) {
    const bad = (m) => { throw new HttpError(400, m); };
    if (!ev || typeof ev !== 'object') bad('Пустое событие');
    if (typeof ev.eventId !== 'string' || !ev.eventId || ev.eventId.length > 100) bad('eventId обязателен');
    if (!ACTIONS.has(ev.action)) bad('Неизвестный action');
    if (ev.entityId == null || ev.entityId === '') bad('entityId обязателен');
    if (!ev.actor || ev.actor.id == null || !ev.actor.username) bad('actor обязателен');
    if (Number.isNaN(Date.parse(ev.occurredAt))) bad('occurredAt некорректен');
  }

  append(ev, source = 'java-backend') {
    AuditLog.validate(ev);
    return this.#enqueue(async () => {
      const dup = this.byId.get(ev.eventId);
      if (dup) return { duplicate: true, entry: dup };
      const entry = {
        seq: this.entries.length + 1,
        eventId: ev.eventId,
        receivedAt: new Date().toISOString(),
        occurredAt: new Date(ev.occurredAt).toISOString(),
        action: ev.action,
        entityType: 'student',
        entityId: String(ev.entityId),
        actor: { id: ev.actor.id, username: ev.actor.username, role: ev.actor.role ?? null },
        before: ev.before ?? null,
        after: ev.after ?? null,
        source,
        meta: ev.meta ?? null,
      };
      await this.#fh.appendFile(JSON.stringify(entry) + '\n');
      await this.#fh.datasync(); // запись на диск до подтверждения Java
      this.entries.push(entry);
      this.byId.set(entry.eventId, entry);
      return { duplicate: false, entry };
    });
  }

  query({ limit = 50, offset = 0, action, actorId, entityId, afterSeq } = {}) {
    limit = Math.min(Math.max(+limit || 50, 1), 500);
    offset = Math.max(+offset || 0, 0);
    let r = this.entries;
    if (action) r = r.filter((e) => e.action === action);
    if (actorId != null && actorId !== '') r = r.filter((e) => String(e.actor.id) === String(actorId));
    if (entityId) r = r.filter((e) => e.entityId === String(entityId));
    if (afterSeq != null && afterSeq !== '') {
      const items = r.filter((e) => e.seq > +afterSeq).slice(0, limit); // по возрастанию — для синхронизации
      return { total: items.length, items };
    }
    const total = r.length;
    return { total, items: r.slice().reverse().slice(offset, offset + limit) };
  }
}
