const Monster = require('./Monster');

class GameMap {
  constructor(name, size) {
    this.name = name;
    this.size = size;
    this.monsters = [];
    this.players = new Map();
    this.spawnPoints = [];
  }

  addPlayer(player) {
    this.players.set(player.id, player);
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  addMonsterSpawn(template, position, count = 1) {
    for (let i = 0; i < count; i++) {
      // Add some randomness to spawn position
      const spawnPos = {
        x: position.x + (Math.random() - 0.5) * 10,
        y: position.y,
        z: position.z + (Math.random() - 0.5) * 10
      };

      const monster = new Monster(template, spawnPos);
      this.monsters.push(monster);

      this.spawnPoints.push({
        template,
        position: spawnPos
      });
    }
  }

  update(deltaTime) {
    const players = this.getAllPlayers();

    // Update all monsters
    for (const monster of this.monsters) {
      monster.update(deltaTime, players);

      // If monster attacked, apply damage to player
      if (!monster.isDead && monster.state === 'attack') {
        const attackResult = monster.performAttack();
        if (attackResult && attackResult.target) {
          attackResult.target.takeDamage(attackResult.damage);
        }
      }
    }

    // Update all players
    for (const player of players) {
      player.update(deltaTime);
    }
  }

  findMonsterById(monsterId) {
    return this.monsters.find(m => m.id === monsterId);
  }

  getPlayersInRange(position, range) {
    const playersInRange = [];

    for (const player of this.players.values()) {
      const distance = this.getDistance(position, player.position);
      if (distance <= range) {
        playersInRange.push(player);
      }
    }

    return playersInRange;
  }

  getMonstersInRange(position, range) {
    return this.monsters.filter(monster => {
      if (monster.isDead) return false;
      const distance = this.getDistance(position, monster.position);
      return distance <= range;
    });
  }

  getDistance(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  serialize() {
    return {
      name: this.name,
      size: this.size,
      players: Array.from(this.players.values()).map(p => p.serialize()),
      monsters: this.monsters.map(m => m.serialize())
    };
  }
}

module.exports = GameMap;
