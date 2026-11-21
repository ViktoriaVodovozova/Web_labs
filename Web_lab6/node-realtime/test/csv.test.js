import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { CsvParser, csvLine } from '../src/csv.js';

async function parse(chunks, opts) {
  const out = [];
  for await (const r of Readable.from(chunks.map((c) => Buffer.from(c))).pipe(new CsvParser(opts))) out.push(r);
  return out;
}

test('кавычки, переносы, разделители, BOM, CRLF', async () => {
  const src = '\uFEFFa,b,c\r\n"x, y","он сказал ""да""","line1\nline2"\r\n1,2,3';
  assert.deepEqual(await parse([src]), [['a', 'b', 'c'], ['x, y', 'он сказал "да"', 'line1\nline2'], ['1', '2', '3']]);
});

test('чанки режут многобайтовый символ и кавычки', async () => {
  const buf = Buffer.from('имя;"Ё""ж"\n');
  const chunks = [buf.subarray(0, 3), buf.subarray(3, 9), buf.subarray(9)];
  assert.deepEqual(await parse(chunks, { delimiter: ';' }), [['имя', 'Ё"ж']]);
});

test('незакрытая кавычка — ошибка', async () => {
  await assert.rejects(parse(['a,"b']));
});

test('экранирование и защита от формул', () => {
  assert.equal(csvLine(['a,b', 'q"q', '=SUM(A1)', 5]), '"a,b","q""q",\'=SUM(A1),5\r\n');
});
