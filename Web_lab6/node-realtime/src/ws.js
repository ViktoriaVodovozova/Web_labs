// Минимальная серверная реализация WebSocket (RFC 6455) на чистом Node.
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_PAYLOAD = 1 << 20; // 1 MiB на сообщение
const MAX_BUFFERED = 1 << 20; // медленному клиенту не копим данные бесконечно

export class WSConnection extends EventEmitter {
  #buf = Buffer.alloc(0);
  #frag = [];
  #fragOp = 0;
  #fragSize = 0;
  #done = false;
  closed = false;

  constructor(socket) {
    super();
    this.socket = socket;
    socket.setNoDelay(true);
    socket.on('data', (d) => this.#onData(d));
    socket.on('close', () => this.#finish(1006));
    socket.on('error', () => socket.destroy());
  }

  #onData(d) {
    this.#buf = Buffer.concat([this.#buf, d]);
    while (!this.closed && this.#parseFrame());
  }

  #parseFrame() {
    const b = this.#buf;
    if (b.length < 2) return false;
    const fin = !!(b[0] & 0x80);
    const op = b[0] & 0x0f;
    if (!(b[1] & 0x80)) return this.close(1002), false; // клиент обязан маскировать
    let len = b[1] & 0x7f;
    let off = 2;
    if (len === 126) {
      if (b.length < 4) return false;
      len = b.readUInt16BE(2);
      off = 4;
    } else if (len === 127) {
      if (b.length < 10) return false;
      const big = b.readBigUInt64BE(2);
      if (big > BigInt(MAX_PAYLOAD)) return this.close(1009), false;
      len = Number(big);
      off = 10;
    }
    if (len > MAX_PAYLOAD) return this.close(1009), false;
    if (b.length < off + 4 + len) return false;

    const mask = b.subarray(off, off + 4);
    const payload = Buffer.from(b.subarray(off + 4, off + 4 + len));
    for (let i = 0; i < len; i++) payload[i] ^= mask[i & 3];
    this.#buf = b.subarray(off + 4 + len);

    if (op >= 0x8) {
      // управляющие кадры
      if (!fin || len > 125) return this.close(1002), false;
      if (op === 0x8) return this.close(1000), false;
      if (op === 0x9) this.#write(0xa, payload);
      else if (op === 0xa) this.emit('pong');
      return true;
    }
    if (op !== 0) {
      this.#fragOp = op;
      this.#frag = [];
      this.#fragSize = 0;
    } else if (!this.#fragOp) {
      return this.close(1002), false;
    }
    this.#frag.push(payload);
    this.#fragSize += len;
    if (this.#fragSize > MAX_PAYLOAD) return this.close(1009), false;
    if (fin) {
      const full = Buffer.concat(this.#frag);
      const o = this.#fragOp;
      this.#fragOp = 0;
      this.#frag = [];
      if (o === 1) this.emit('message', full.toString('utf8'));
      else this.close(1003); // бинарные кадры протоколом не поддерживаются
    }
    return true;
  }

  #write(op, payload) {
    const l = payload.length;
    let h;
    if (l < 126) h = Buffer.from([0x80 | op, l]);
    else if (l < 65536) {
      h = Buffer.alloc(4);
      h[0] = 0x80 | op;
      h[1] = 126;
      h.writeUInt16BE(l, 2);
    } else {
      h = Buffer.alloc(10);
      h[0] = 0x80 | op;
      h[1] = 127;
      h.writeBigUInt64BE(BigInt(l), 2);
    }
    this.socket.write(Buffer.concat([h, payload]));
  }

  send(text) {
    if (this.closed) return false;
    if (this.socket.writableLength > MAX_BUFFERED) return this.close(1013), false; // backpressure
    this.#write(0x1, Buffer.from(text));
    return true;
  }

  ping() {
    if (!this.closed) this.#write(0x9, Buffer.alloc(0));
  }

  close(code = 1000) {
    if (this.closed) return;
    const p = Buffer.alloc(2);
    p.writeUInt16BE(code);
    try { this.#write(0x8, p); } catch {}
    this.closed = true;
    this.socket.end();
    this.#finish(code);
  }

  terminate() {
    this.closed = true;
    this.socket.destroy();
    this.#finish(1006);
  }

  #finish(code) {
    this.closed = true;
    if (this.#done) return;
    this.#done = true;
    this.emit('close', code);
  }
}

export function acceptUpgrade(req, socket) {
  const key = req.headers['sec-websocket-key'];
  if (req.headers.upgrade?.toLowerCase() !== 'websocket' || !key || req.headers['sec-websocket-version'] !== '13') {
    socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
    socket.destroy();
    return null;
  }
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
  );
  return new WSConnection(socket);
}

export function rejectUpgrade(socket, status, text) {
  socket.write(`HTTP/1.1 ${status} ${text}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  socket.destroy();
}
