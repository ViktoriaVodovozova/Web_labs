import { Transform } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';

// Потоковый CSV-парсер (RFC 4180): кавычки, "" внутри поля, разделители и переводы строк в кавычках,
// BOM, CRLF/LF, многобайтовые символы на границе чанков. Выдаёт массивы полей.
export class CsvParser extends Transform {
  #dec = new StringDecoder('utf8');
  #field = '';
  #row = [];
  #inQ = false;
  #pendingQuote = false;
  #lastCR = false;
  #first = true;

  constructor({ delimiter = ',' } = {}) {
    super({ readableObjectMode: true });
    this.d = delimiter;
  }

  _transform(chunk, _e, cb) {
    try { this.#feed(this.#dec.write(chunk)); cb(); } catch (e) { cb(e); }
  }

  _flush(cb) {
    try {
      this.#feed(this.#dec.end());
      if (this.#pendingQuote) { this.#pendingQuote = false; this.#inQ = false; }
      if (this.#inQ) throw new Error('Незакрытая кавычка в конце файла');
      if (this.#field !== '' || this.#row.length) this.#endRow();
      cb();
    } catch (e) { cb(e); }
  }

  #endRow() {
    if (this.#row.length === 0 && this.#field === '') return; // пустая строка
    this.#row.push(this.#field);
    this.push(this.#row);
    this.#row = [];
    this.#field = '';
  }

  #feed(s) {
    if (this.#first && s.length) {
      if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
      this.#first = false;
    }
    for (const c of s) {
      if (this.#pendingQuote) {
        this.#pendingQuote = false;
        if (c === '"') { this.#field += '"'; continue; }
        this.#inQ = false; // это была закрывающая кавычка
      }
      if (this.#inQ) {
        if (c === '"') this.#pendingQuote = true;
        else this.#field += c;
        continue;
      }
      if (c === '\n' && this.#lastCR) { this.#lastCR = false; continue; }
      this.#lastCR = c === '\r';
      if (c === '"') {
        if (this.#field !== '') throw new Error('Кавычка внутри незакавыченного поля');
        this.#inQ = true;
      } else if (c === this.d) {
        this.#row.push(this.#field);
        this.#field = '';
      } else if (c === '\n' || c === '\r') {
        this.#endRow();
      } else this.#field += c;
    }
  }
}

export function csvEscape(v, d = ',') {
  if (v == null) return '';
  let s = String(v);
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s; // защита от CSV-инъекций в Excel
  return /["\r\n]/.test(s) || s.includes(d) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const csvLine = (arr, d = ',') => arr.map((v) => csvEscape(v, d)).join(d) + '\r\n';
