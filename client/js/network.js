class NetworkClient {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.callbacks = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(url = 'ws://localhost:3000') {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('✓ Connected to server');
          this.connected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from server');
          this.connected = false;
          this.handleDisconnect();
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  handleMessage(message) {
    const { type, data } = message;

    if (this.callbacks[type]) {
      this.callbacks[type](data);
    }
  }

  handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, 3000);
    } else {
      console.error('Failed to reconnect to server');
      alert('Lost connection to server. Please refresh the page.');
    }
  }

  on(type, callback) {
    this.callbacks[type] = callback;
  }

  send(type, data) {
    if (this.connected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  join(characterName) {
    this.send('join', { characterName });
  }

  move(type, x, y, z) {
    this.send('move', { type, x, y, z });
  }

  attack(targetId, targetType) {
    this.send('attack', { targetId, targetType });
  }

  useSkill(skillId, targetId = null) {
    this.send('skill', { skillId, targetId });
  }

  chat(message) {
    this.send('chat', { message });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
