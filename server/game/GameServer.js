const WebSocket = require('ws');
const Player = require('./Player');
const GameMap = require('./Map');

// Database selection: PostgreSQL (Render) > In-memory (local)
const db = process.env.DATABASE_URL
  ? require('../database/db-postgres')
  : require('../database/db-sqlite');

const config = require('../config');

class GameServer {
  constructor() {
    this.wss = null;
    this.maps = new Map();
    this.clients = new Map(); // ws -> player mapping
    this.tickRate = config.TICK_RATE;
    this.lastTick = Date.now();
    this.gameLoop = null;
    this.monsterTemplates = [];
  }

  async initialize() {
    console.log('🎮 Initializing Game Server...');

    // Load monster templates from database
    this.monsterTemplates = await db.getMonsterTemplates();
    console.log(`✓ Loaded ${this.monsterTemplates.length} monster templates`);

    // Create default map
    this.createMap('lorencia', config.MAP_SIZE);

    console.log('✓ Game Server initialized');
  }

  createMap(name, size) {
    const map = new GameMap(name, size);

    // Add monster spawns
    // Slimes (Level 1)
    const slimeTemplate = this.monsterTemplates.find(t => t.name === 'Slime');
    if (slimeTemplate) {
      map.addMonsterSpawn(slimeTemplate, { x: 20, y: 0, z: 20 }, 5);
      map.addMonsterSpawn(slimeTemplate, { x: -20, y: 0, z: 20 }, 5);
    }

    // Wolves (Level 5)
    const wolfTemplate = this.monsterTemplates.find(t => t.name === 'Wolf');
    if (wolfTemplate) {
      map.addMonsterSpawn(wolfTemplate, { x: 40, y: 0, z: 40 }, 3);
      map.addMonsterSpawn(wolfTemplate, { x: -40, y: 0, z: -40 }, 3);
    }

    // Orcs (Level 10)
    const orcTemplate = this.monsterTemplates.find(t => t.name === 'Orc');
    if (orcTemplate) {
      map.addMonsterSpawn(orcTemplate, { x: 60, y: 0, z: 60 }, 2);
      map.addMonsterSpawn(orcTemplate, { x: -60, y: 0, z: 60 }, 2);
    }

    this.maps.set(name, map);
    console.log(`✓ Created map: ${name} (${size}x${size}) with ${map.monsters.length} monsters`);
  }

  start(httpServer) {
    // Attach WebSocket to existing HTTP server
    this.wss = new WebSocket.Server({ server: httpServer });

    this.wss.on('connection', (ws) => {
      this.handleConnection(ws);
    });

    // Start game loop
    this.gameLoop = setInterval(() => {
      this.update();
    }, 1000 / this.tickRate);

    console.log(`✓ WebSocket server attached to HTTP server`);
    console.log(`✓ Game loop running at ${this.tickRate} ticks/second`);
  }

  handleConnection(ws) {
    console.log('New client connected');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  async handleMessage(ws, message) {
    const { type, data } = message;

    switch (type) {
      case 'join':
        await this.handleJoin(ws, data);
        break;

      case 'move':
        this.handleMove(ws, data);
        break;

      case 'attack':
        this.handleAttack(ws, data);
        break;

      case 'skill':
        this.handleSkill(ws, data);
        break;

      case 'chat':
        this.handleChat(ws, data);
        break;

      default:
        console.log('Unknown message type:', type);
    }
  }

  async handleJoin(ws, data) {
    const { characterName } = data;

    // For MVP, create character if doesn't exist
    let character = await db.getCharacterByName(characterName);

    if (!character) {
      // Create new character (account_id = 1 for MVP)
      const characterId = await db.createCharacter(1, characterName);
      character = await db.getCharacterByName(characterName);
    }

    // Create player instance
    const player = new Player(ws, character);

    // Add to map
    const map = this.maps.get(player.map);
    if (map) {
      map.addPlayer(player);
      this.clients.set(ws, player);

      // Send join success with full game state
      this.send(ws, {
        type: 'join_success',
        data: {
          player: player.serializeFull(),
          map: map.serialize()
        }
      });

      // Broadcast new player to others
      this.broadcast({
        type: 'player_joined',
        data: player.serialize()
      }, ws);

      console.log(`Player ${player.name} joined the game`);
    }
  }

  handleMove(ws, data) {
    const player = this.clients.get(ws);
    if (!player) return;

    const { type: moveType, x, y, z } = data;

    if (moveType === 'velocity') {
      player.setVelocity(x, y, z);
    } else if (moveType === 'target') {
      player.setTargetPosition(x, y, z);
    }
  }

  async handleAttack(ws, data) {
    const player = this.clients.get(ws);
    if (!player || !player.canAttack()) return;

    const { targetId, targetType } = data;

    let target = null;
    let damage = 0;

    if (targetType === 'player') {
      const map = this.maps.get(player.map);
      target = map.getPlayer(targetId);
    } else if (targetType === 'monster') {
      const map = this.maps.get(player.map);
      target = map.findMonsterById(targetId);
    }

    if (target) {
      damage = player.attack(target);
      target.takeDamage(damage, player);

      // Broadcast attack
      this.broadcast({
        type: 'attack',
        data: {
          attackerId: player.id,
          targetId: target.id,
          targetType,
          damage
        }
      });

      // Check if monster died
      if (targetType === 'monster' && target.isDead) {
        const deathResult = target.die(player);

        // Give XP to player
        player.gainExperience(deathResult.xp);

        // Broadcast monster death
        this.broadcast({
          type: 'monster_death',
          data: {
            monsterId: target.id,
            killerId: player.id,
            xp: deathResult.xp,
            drops: deathResult.drops
          }
        });

        // Update player stats in database
        await db.updateCharacterStats(player.dbId, {
          level: player.level,
          experience: player.experience,
          hp: player.hp,
          max_hp: player.maxHp,
          attack: player.attack,
          defense: player.defense
        });
      }

      // Check if player died
      if (targetType === 'player' && target.isDead) {
        this.broadcast({
          type: 'player_death',
          data: {
            playerId: target.id,
            killerId: player.id
          }
        });
      }
    }
  }

  handleSkill(ws, data) {
    const player = this.clients.get(ws);
    if (!player) return;

    const { skillId, targetId } = data;

    const map = this.maps.get(player.map);
    let target = map.getPlayer(targetId) || map.findMonsterById(targetId);

    const result = player.useSkill(skillId, target);

    if (result) {
      this.broadcast({
        type: 'skill_used',
        data: {
          playerId: player.id,
          ...result
        }
      });

      // Apply skill damage if applicable
      if (result.damage && target) {
        target.takeDamage(result.damage, player);
      }
    }
  }

  handleChat(ws, data) {
    const player = this.clients.get(ws);
    if (!player) return;

    this.broadcast({
      type: 'chat',
      data: {
        playerName: player.name,
        message: data.message
      }
    });
  }

  handleDisconnect(ws) {
    const player = this.clients.get(ws);

    if (player) {
      const map = this.maps.get(player.map);
      if (map) {
        map.removePlayer(player.id);

        // Save player position
        db.updateCharacterPosition(player.dbId, player.position.x, player.position.y, player.position.z);

        // Broadcast player left
        this.broadcast({
          type: 'player_left',
          data: { playerId: player.id }
        });

        console.log(`Player ${player.name} left the game`);
      }

      this.clients.delete(ws);
    }
  }

  update() {
    const now = Date.now();
    const deltaTime = (now - this.lastTick) / 1000;
    this.lastTick = now;

    // Update all maps
    for (const map of this.maps.values()) {
      map.update(deltaTime);
    }

    // Broadcast game state to all clients
    this.broadcastGameState();
  }

  broadcastGameState() {
    for (const map of this.maps.values()) {
      const state = {
        type: 'game_state',
        data: {
          players: map.getAllPlayers().map(p => p.serialize()),
          monsters: map.monsters
            .filter(m => !m.isDead)
            .map(m => m.serialize())
        }
      };

      // Send to all players in this map
      for (const player of map.getAllPlayers()) {
        if (player.ws.readyState === WebSocket.OPEN) {
          this.send(player.ws, state);
        }
      }
    }
  }

  send(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(message, exclude = null) {
    for (const ws of this.clients.keys()) {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        this.send(ws, message);
      }
    }
  }

  stop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }

    if (this.wss) {
      this.wss.close();
    }

    console.log('✓ Game server stopped');
  }
}

module.exports = GameServer;
