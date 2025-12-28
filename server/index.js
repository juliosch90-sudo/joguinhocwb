const express = require('express');
const path = require('path');
const GameServer = require('./game/GameServer');
const db = require('./database/db');
const config = require('./config');

const app = express();

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Server stats endpoint
app.get('/api/stats', (req, res) => {
  res.json({
    players: gameServer.clients.size,
    maps: gameServer.maps.size
  });
});

// Initialize and start server
async function start() {
  try {
    console.log('🚀 Starting MMORPG Server...\n');

    // Initialize database
    await db.initDatabase();

    // Initialize game server
    const gameServer = new GameServer();
    await gameServer.initialize();

    // Start WebSocket server
    gameServer.start(config.SERVER_PORT);

    // Start HTTP server for static files
    const HTTP_PORT = 8080;
    app.listen(HTTP_PORT, () => {
      console.log(`\n✓ HTTP server listening on port ${HTTP_PORT}`);
      console.log(`✓ Access game at: http://localhost:${HTTP_PORT}`);
      console.log(`\n🎮 Server ready! Waiting for players...\n`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n⚠ Shutting down server...');
      gameServer.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
