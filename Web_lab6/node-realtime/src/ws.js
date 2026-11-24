import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'node:events';

const MAX_PAYLOAD = 2 ** 20;
const MAX_BUFFERED = 2 ** 20;

const wss = new WebSocketServer({
  noServer: true,
  maxPayload: MAX_PAYLOAD,
  perMessageDeflate: false,
});

export class WSConnection extends EventEmitter {
  #done = false;
  closed = false;

  constructor(ws) {
    super();
    this.ws = ws;

    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        this.close(1003);
        return;
      }

      this.emit('message', data.toString('utf8'));
    });

    ws.on('pong', () => this.emit('pong'));

    ws.on('close', (code) => this.#finish(code));

    ws.on('error', () => this.terminate());
  }

  send(text) {
    if (this.closed || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    if (this.ws.bufferedAmount > MAX_BUFFERED) {
      this.close(1013);
      return false;
    }

    this.ws.send(text);
    return true;
  }

  ping() {
    if (!this.closed && this.ws.readyState === WebSocket.OPEN) {
      this.ws.ping();
    }
  }

  close(code = 1000) {
    if (this.closed) return;

    this.closed = true;
    this.ws.close(code);
    this.#finish(code);
  }

  terminate() {
    this.closed = true;
    this.ws.terminate();
    this.#finish(1006);
  }

  #finish(code) {
    this.closed = true;

    if (this.#done) return;

    this.#done = true;
    this.emit('close', code);
  }
}

export function acceptUpgrade(req, socket, head = Buffer.alloc(0)) {
  let connection = null;

  wss.handleUpgrade(req, socket, head, (ws) => {
    connection = new WSConnection(ws);
  });

  return connection;
}

export function rejectUpgrade(socket, status, text) {
  socket.end(
    `HTTP/1.1 ${status} ${text}\r\n` +
    'Connection: close\r\n' +
    'Content-Length: 0\r\n\r\n'
  );
}
