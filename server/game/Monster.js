const { v4: uuidv4 } = require('uuid');

class Monster {
  constructor(template, spawnPosition) {
    this.id = uuidv4();
    this.templateId = template.id;
    this.name = template.name;
    this.level = template.level;
    this.maxHp = template.hp;
    this.hp = template.hp;
    this.attack = template.attack;
    this.defense = template.defense;
    this.xpReward = template.xp_reward;
    this.moveSpeed = template.move_speed;
    this.attackSpeed = template.attack_speed;

    // Position
    this.spawnPosition = { ...spawnPosition };
    this.position = { ...spawnPosition };

    // AI state
    this.state = 'idle'; // idle, chase, attack, return
    this.target = null;
    this.aggroRange = 15;
    this.attackRange = 2;
    this.leashRange = 30; // Max distance from spawn before returning

    // Combat
    this.lastAttackTime = 0;
    this.attackCooldown = 1000 / this.attackSpeed;
    this.isDead = false;

    // Respawn
    this.respawnTime = 30000; // 30 seconds
    this.deathTime = null;

    // Loot
    this.lootTable = this.generateLootTable();
  }

  generateLootTable() {
    // Simple loot based on monster level
    const loot = [];

    if (this.level <= 3) {
      loot.push({ itemId: 4, chance: 0.3, name: 'Health Potion' });
      loot.push({ itemId: 1, chance: 0.1, name: 'Rusty Sword' });
    } else if (this.level <= 7) {
      loot.push({ itemId: 4, chance: 0.4, name: 'Health Potion' });
      loot.push({ itemId: 5, chance: 0.3, name: 'Mana Potion' });
      loot.push({ itemId: 2, chance: 0.15, name: 'Iron Sword' });
    } else {
      loot.push({ itemId: 4, chance: 0.5, name: 'Health Potion' });
      loot.push({ itemId: 5, chance: 0.4, name: 'Mana Potion' });
      loot.push({ itemId: 3, chance: 0.2, name: 'Leather Armor' });
    }

    return loot;
  }

  update(deltaTime, players) {
    if (this.isDead) {
      // Check if should respawn
      if (Date.now() - this.deathTime >= this.respawnTime) {
        this.respawn();
      }
      return;
    }

    // AI behavior
    switch (this.state) {
      case 'idle':
        this.updateIdle(players);
        break;

      case 'chase':
        this.updateChase(deltaTime);
        break;

      case 'attack':
        this.updateAttack();
        break;

      case 'return':
        this.updateReturn(deltaTime);
        break;
    }
  }

  updateIdle(players) {
    // Look for players in aggro range
    for (const player of players) {
      if (player.isDead) continue;

      const distance = this.getDistance(player.position);
      if (distance <= this.aggroRange) {
        this.target = player;
        this.state = 'chase';
        break;
      }
    }
  }

  updateChase(deltaTime) {
    if (!this.target || this.target.isDead) {
      this.target = null;
      this.state = 'return';
      return;
    }

    const distanceToTarget = this.getDistance(this.target.position);
    const distanceToSpawn = this.getDistance(this.spawnPosition);

    // Check leash distance
    if (distanceToSpawn > this.leashRange) {
      this.target = null;
      this.state = 'return';
      this.hp = this.maxHp; // Reset HP when returning
      return;
    }

    // Move towards target
    if (distanceToTarget <= this.attackRange) {
      this.state = 'attack';
    } else {
      this.moveTowards(this.target.position, deltaTime);
    }
  }

  updateAttack() {
    if (!this.target || this.target.isDead) {
      this.target = null;
      this.state = 'return';
      return;
    }

    const distance = this.getDistance(this.target.position);

    if (distance > this.attackRange) {
      this.state = 'chase';
      return;
    }

    // Attack if cooldown is ready
    if (this.canAttack()) {
      this.performAttack();
    }
  }

  updateReturn(deltaTime) {
    const distanceToSpawn = this.getDistance(this.spawnPosition);

    if (distanceToSpawn < 1) {
      this.position = { ...this.spawnPosition };
      this.state = 'idle';
      this.hp = this.maxHp;
    } else {
      this.moveTowards(this.spawnPosition, deltaTime);
    }
  }

  moveTowards(targetPos, deltaTime) {
    const dx = targetPos.x - this.position.x;
    const dy = targetPos.y - this.position.y;
    const dz = targetPos.z - this.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance > 0) {
      this.position.x += (dx / distance) * deltaTime * this.moveSpeed * 5;
      this.position.y += (dy / distance) * deltaTime * this.moveSpeed * 5;
      this.position.z += (dz / distance) * deltaTime * this.moveSpeed * 5;
    }
  }

  getDistance(pos) {
    const dx = pos.x - this.position.x;
    const dy = pos.y - this.position.y;
    const dz = pos.z - this.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  canAttack() {
    const now = Date.now();
    return now - this.lastAttackTime >= this.attackCooldown;
  }

  performAttack() {
    if (!this.target) return null;

    this.lastAttackTime = Date.now();

    // Calculate damage
    const baseDamage = this.attack;
    const randomFactor = Math.floor(Math.random() * 6);
    const damage = Math.max(1, baseDamage - this.target.defense + randomFactor);

    return { target: this.target, damage };
  }

  takeDamage(damage, attacker) {
    if (this.isDead) return;

    this.hp = Math.max(0, this.hp - damage);

    // Set attacker as target if not already targeting someone
    if (!this.target && this.state === 'idle') {
      this.target = attacker;
      this.state = 'chase';
    }

    if (this.hp === 0) {
      this.die(attacker);
    }
  }

  die(killer) {
    this.isDead = true;
    this.deathTime = Date.now();
    this.state = 'idle';
    this.target = null;

    // Generate loot drops
    const drops = [];
    for (const loot of this.lootTable) {
      if (Math.random() <= loot.chance) {
        drops.push({
          itemId: loot.itemId,
          name: loot.name,
          position: { ...this.position }
        });
      }
    }

    return {
      xp: this.xpReward,
      drops,
      killer
    };
  }

  respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.position = { ...this.spawnPosition };
    this.state = 'idle';
    this.target = null;
    this.deathTime = null;
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      level: this.level,
      hp: this.hp,
      maxHp: this.maxHp,
      position: this.position,
      state: this.state,
      isDead: this.isDead
    };
  }
}

module.exports = Monster;
