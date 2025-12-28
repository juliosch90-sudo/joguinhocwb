const { v4: uuidv4 } = require('uuid');

class Player {
  constructor(ws, characterData) {
    this.id = uuidv4();
    this.ws = ws;

    // Character data from database
    this.dbId = characterData.id;
    this.name = characterData.name;
    this.class = characterData.class;
    this.level = characterData.level;
    this.experience = characterData.experience;
    this.hp = characterData.hp;
    this.maxHp = characterData.max_hp;
    this.mp = characterData.mp;
    this.maxMp = characterData.max_mp;
    this.attack = characterData.attack;
    this.defense = characterData.defense;

    // Position
    this.position = {
      x: characterData.pos_x || 0,
      y: characterData.pos_y || 0,
      z: characterData.pos_z || 0
    };

    // Movement
    this.velocity = { x: 0, y: 0, z: 0 };
    this.targetPosition = null;
    this.moveSpeed = 5;
    this.isMoving = false;

    // Combat
    this.target = null;
    this.lastAttackTime = 0;
    this.attackCooldown = 1000;
    this.isDead = false;

    // Skills
    this.skills = [
      { id: 1, name: 'Power Strike', damage: 20, cooldown: 3000, lastUsed: 0 },
      { id: 2, name: 'Defense Boost', duration: 5000, cooldown: 10000, lastUsed: 0 },
      { id: 3, name: 'Health Regen', heal: 30, cooldown: 15000, lastUsed: 0 }
    ];

    // State
    this.map = characterData.map || 'lorencia';
    this.lastUpdate = Date.now();
  }

  // Movement methods
  setTargetPosition(x, y, z) {
    this.targetPosition = { x, y, z };
    this.isMoving = true;
  }

  setVelocity(x, y, z) {
    this.velocity = { x, y, z };
    this.isMoving = (x !== 0 || y !== 0 || z !== 0);
  }

  update(deltaTime) {
    if (this.isDead) return;

    // Update position based on velocity
    if (this.isMoving && this.velocity) {
      this.position.x += this.velocity.x * deltaTime * this.moveSpeed;
      this.position.y += this.velocity.y * deltaTime * this.moveSpeed;
      this.position.z += this.velocity.z * deltaTime * this.moveSpeed;
    }

    // Move towards target position (click-to-move)
    if (this.targetPosition) {
      const dx = this.targetPosition.x - this.position.x;
      const dy = this.targetPosition.y - this.position.y;
      const dz = this.targetPosition.z - this.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < 0.5) {
        this.targetPosition = null;
        this.isMoving = false;
      } else {
        this.position.x += (dx / distance) * deltaTime * this.moveSpeed;
        this.position.y += (dy / distance) * deltaTime * this.moveSpeed;
        this.position.z += (dz / distance) * deltaTime * this.moveSpeed;
      }
    }

    this.lastUpdate = Date.now();
  }

  // Combat methods
  canAttack() {
    const now = Date.now();
    return now - this.lastAttackTime >= this.attackCooldown && !this.isDead;
  }

  attack(target) {
    if (!this.canAttack() || !target) return null;

    this.lastAttackTime = Date.now();

    // Calculate damage
    const baseDamage = this.attack;
    const randomFactor = Math.floor(Math.random() * 6); // 0-5
    const damage = Math.max(1, baseDamage - target.defense + randomFactor);

    return damage;
  }

  useSkill(skillId, target) {
    const skill = this.skills.find(s => s.id === skillId);
    if (!skill) return null;

    const now = Date.now();
    if (now - skill.lastUsed < skill.cooldown) return null;

    skill.lastUsed = now;

    // Apply skill effect
    let result = { skillId, success: true };

    switch (skillId) {
      case 1: // Power Strike
        if (target) {
          const damage = skill.damage + this.attack;
          result.damage = damage;
          result.target = target.id;
        }
        break;

      case 2: // Defense Boost
        result.defenseBoost = 10;
        result.duration = skill.duration;
        break;

      case 3: // Health Regen
        this.hp = Math.min(this.maxHp, this.hp + skill.heal);
        result.heal = skill.heal;
        break;
    }

    return result;
  }

  takeDamage(damage) {
    if (this.isDead) return;

    this.hp = Math.max(0, this.hp - damage);

    if (this.hp === 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.hp = 0;
    this.target = null;
  }

  respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.position = { x: 0, y: 0, z: 0 }; // Spawn point
  }

  gainExperience(xp) {
    this.experience += xp;

    // Check for level up
    const xpNeeded = this.level * 100;
    if (this.experience >= xpNeeded) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.experience = 0;

    // Increase stats
    this.maxHp += 20;
    this.maxMp += 10;
    this.attack += 5;
    this.defense += 2;
    this.hp = this.maxHp;
    this.mp = this.maxMp;
  }

  // Serialization for network
  serialize() {
    return {
      id: this.id,
      name: this.name,
      class: this.class,
      level: this.level,
      hp: this.hp,
      maxHp: this.maxHp,
      position: this.position,
      isMoving: this.isMoving,
      isDead: this.isDead
    };
  }

  serializeFull() {
    return {
      ...this.serialize(),
      experience: this.experience,
      mp: this.mp,
      maxMp: this.maxMp,
      attack: this.attack,
      defense: this.defense,
      skills: this.skills.map(s => ({
        id: s.id,
        name: s.name,
        cooldown: s.cooldown
      }))
    };
  }
}

module.exports = Player;
