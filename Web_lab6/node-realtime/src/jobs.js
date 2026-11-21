import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { config } from './config.js';
import { CsvParser, csvLine } from './csv.js';
import { HttpError, java, students } from './java.js';

const MAX_ERRORS = 200;

// Состояния: queued -> running -> done | failed
export class Jobs {
  jobs = new Map();

  constructor({ hub, audit }) {
    this.hub = hub;
    this.audit = audit;
    this.dir = config.dataDir;
    setInterval(() => this.#gc(), 60_000).unref();
  }

  #gc() {
    for (const [id, j] of this.jobs) {
      if (j.state !== 'running' && Date.now() - j.createdAt > config.jobTtlMs) {
        if (j.file) fs.promises.rm(j.file, { force: true }).catch(() => {});
        this.jobs.delete(id);
      }
    }
  }

  #create(type, user, token, extra = {}) {
    const job = {
      id: extra.id ?? crypto.randomUUID(), type, state: 'queued', owner: user, token,
      createdAt: Date.now(), lastEmit: 0, error: null, errors: [],
      progress: { processed: 0, created: 0, updated: 0, skipped: 0, failed: 0, percent: 0 },
      ...extra,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  snapshot(j) {
    return { id: j.id, type: j.type, state: j.state, progress: j.progress, error: j.error, errors: j.errors, downloadReady: j.type === 'export' && j.state === 'done' };
  }

  #touch(j, force = false) {
    if (!force && Date.now() - j.lastEmit < 250) return; // не заваливаем клиента событиями
    j.lastEmit = Date.now();
    this.hub.toUser(j.owner.id, 'job.update', this.snapshot(j));
  }

  get(id) { return this.jobs.get(id); }

  // ---------- Экспорт ----------
  startExport(user, token, delimiter = ',') {
    const job = this.#create('export', user, token, { delimiter });
    this.#runExport(job).catch(() => {});
    return job;
  }

  async #runExport(job) {
    job.state = 'running';
    this.#touch(job, true);
    try {
      const cols = [...config.fields, ...(config.versionField && !config.fields.includes(config.versionField) ? [config.versionField] : [])];
      const d = job.delimiter;
      async function* gen() {
        yield '\uFEFF' + csvLine(cols, d);
        for await (const { items } of students(job.token)) {
          for (const s of items) {
            yield csvLine(cols.map((c) => s[c]), d);
            job.progress.processed++;
          }
        }
      }
      const out = path.join(this.dir, 'exports', job.id + '.csv');
      await fs.promises.mkdir(path.dirname(out), { recursive: true });
      const origGen = gen();
      const counted = (async function* () { for await (const chunk of origGen) yield chunk; })();
      const timer = setInterval(() => this.#touch(job), 250);
      try { await pipeline(Readable.from(counted), fs.createWriteStream(out)); } finally { clearInterval(timer); }
      job.file = out;
      job.progress.percent = 100;
      job.state = 'done';
    } catch (e) {
      job.state = 'failed';
      job.error = e.message;
    }
    this.#touch(job, true);
  }

  // ---------- Импорт ----------
  startImport({ id, user, token, file, onConflict, delimiter }) {
    const job = this.#create('import', user, token, { id, file, onConflict, delimiter });
    this.#runImport(job).catch(() => {});
    return job;
  }

  async #runImport(job) {
    job.state = 'running';
    this.#touch(job, true);
    const p = job.progress;
    const { fields, requiredFields, numericFields, versionField } = config;
    const fail = (row, code, message) => {
      p.failed++;
      if (job.errors.length < MAX_ERRORS) job.errors.push({ row, code, message });
    };
    try {
      // Снимок текущего состояния для поиска дубликатов/конфликтов
      const byId = new Map();
      const byIsu = new Map();
      for await (const { items } of students(job.token)) {
        for (const s of items) {
          byId.set(String(s.id), s);
          if (s.isuId) byIsu.set(String(s.isuId), s);
        }
      }

      const total = (await fs.promises.stat(job.file)).size;
      const rs = fs.createReadStream(job.file);
      const seen = new Set();
      let header = null;
      let line = 0;
      let consecutiveNetErr = 0;

      const handle = async (row) => {
        line++;
        if (!header) {
          header = row.map((h) => h.trim());
          const missing = requiredFields.filter((f) => !header.includes(f));
          if (missing.length) throw new HttpError(400, `В заголовке нет колонок: ${missing.join(', ')}`);
          return;
        }
        p.processed++;
        p.percent = Math.min(99, Math.round((rs.bytesRead / total) * 100));
        if (row.length !== header.length) return fail(line, 'BAD_ROW', `Ожидалось ${header.length} колонок, получено ${row.length}`);
        const rec = Object.fromEntries(header.map((h, i) => [h, row[i].trim()]));

        const empty = requiredFields.find((f) => !rec[f]);
        if (empty) return fail(line, 'VALIDATION', `Пустое поле ${empty}`);
        if (!/^\d{6}$/.test(rec.isuId)) return fail(line, 'VALIDATION', 'ИСУ ID должен содержать 6 цифр');
        if (rec.isForeigner && !['true', 'false'].includes(rec.isForeigner)) return fail(line, 'VALIDATION', 'isForeigner: укажите true или false');
        const nan = numericFields.find((f) => rec[f] && (!Number.isInteger(+rec[f]) || +rec[f] < 1));
        if (nan) return fail(line, 'VALIDATION', `Поле ${nan} должно быть числом`);

        const key = rec.isuId;
        if (seen.has(key)) {
          if (job.onConflict === 'skip') { p.skipped++; return; }
          return fail(line, 'DUPLICATE', 'Повтор ИСУ ID в файле');
        }
        seen.add(key);

        let found = rec.id ? byId.get(rec.id) : undefined;
        const matchingIsu = byIsu.get(key);
        if (rec.id && (!found || (matchingIsu && matchingIsu.id !== found.id))) {
          return fail(line, 'CONFLICT', 'ID отсутствует или ИСУ ID принадлежит другому студенту');
        }
        found ??= matchingIsu;

        const body = {};
        for (const f of fields) {
          if (f === 'id' || f === versionField || rec[f] === undefined) continue;
          body[f] = numericFields.includes(f) && rec[f] !== '' ? Number(rec[f]) : rec[f];
        }

        body.isForeigner = rec.isForeigner === 'true';
        try {
          if (!found) {
            await java('POST', config.studentsPath, job.token, body);
            p.created++;
          } else if (job.onConflict === 'skip') {
            p.skipped++;
          } else if (job.onConflict === 'fail') {
            fail(line, 'EXISTS', `Студент уже существует (id=${found.id})`);
          } else {
            const studentPath = `${config.studentsPath}/${encodeURIComponent(found.id)}`;
            const { data: current, etag } = await java('GET', studentPath, job.token, undefined, { withEtag: true });
            if (!etag) throw new Error('Java не вернул версию записи');
            if (fields.some((field) => current[field] !== found[field])) {
              return fail(line, 'CONFLICT', 'Студент изменился во время импорта');
            }
            // update: оптимистичная проверка версии, если колонка есть в файле
            if (versionField && rec[versionField] && String(found[versionField]) !== rec[versionField]) {
              return fail(line, 'CONFLICT', `Запись изменена после экспорта (${versionField}: в файле ${rec[versionField]}, сейчас ${found[versionField]})`);
            }
            await java('PUT', studentPath, job.token, body, { ifMatch: etag });
            p.updated++;
          }
          consecutiveNetErr = 0;
        } catch (e) {
          if (e.network) {
            if (++consecutiveNetErr >= 5) throw e; // Java лежит — нет смысла продолжать
            return fail(line, 'NETWORK', e.message);
          }
          if (e.status === 401 || e.status === 403) throw e; // нет прав — прекращаем всё задание
          fail(line, [404, 409, 412].includes(e.status) ? 'CONFLICT' : 'REJECTED', e.message);
        }
        this.#touch(job);
      };

      const sink = new Writable({
        objectMode: true,
        highWaterMark: 16, // backpressure: парсер ждёт, пока обрабатываются строки
        write(row, _e, cb) { handle(row).then(() => cb(), cb); },
      });
      await pipeline(rs, new CsvParser({ delimiter: job.delimiter }), sink);
      p.percent = 100;
      job.state = 'done';

      // Итог импорта — отдельная запись аудита (идемпотентна по id задания)
      await this.audit.append({
        eventId: `import-${job.id}`, action: 'STUDENT_IMPORT', entityId: job.id, occurredAt: new Date().toISOString(),
        actor: job.owner, after: { created: p.created, updated: p.updated, skipped: p.skipped, failed: p.failed, onConflict: job.onConflict },
      }, 'node-import');
    } catch (e) {
      job.state = 'failed';
      job.error = e.message;
    } finally {
      fs.promises.rm(job.file, { force: true }).catch(() => {});
    }
    this.#touch(job, true);
  }
}
