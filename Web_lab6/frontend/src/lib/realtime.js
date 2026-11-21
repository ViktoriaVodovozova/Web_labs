export class RealtimeClient {
  stopped = false;
  attempt = 0;
  listeners = new Map();

  on(type, listener) {
    this.listeners.set(type, listener);
  }

  async connect() {
    if (this.stopped) return;
    try {
      const response = await fetch('/rt/ticket', { method: 'POST' });
      if (this.stopped || [401, 403].includes(response.status)) return;
      if (!response.ok) throw new Error('Не удалось получить билет');
      const { ticket } = await response.json();
      if (this.stopped) return;

      const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
      const socket = new WebSocket(`${protocol}://${location.host}/rt/ws?ticket=${encodeURIComponent(ticket)}`);
      this.socket = socket;
      socket.onmessage = ({ data }) => {
        const message = JSON.parse(data);
        if (message.type === 'hello') this.attempt = 0;
        if (!this.stopped) this.listeners.get(message.type)?.(message.payload);
      };
      socket.onclose = () => this.reconnect();
    } catch {
      this.reconnect();
    }
  }

  reconnect() {
    if (this.stopped) return;
    const delay = Math.min(30_000, 1000 * 2 ** this.attempt++);
    this.retry = setTimeout(() => this.connect(), delay);
  }

  close() {
    this.stopped = true;
    clearTimeout(this.retry);
    this.socket?.close();
  }
}
