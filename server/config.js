// Server Configuration
module.exports = {
  // Server settings
  SERVER_PORT: process.env.PORT || 3000,
  TICK_RATE: 60, // Server updates per second

  // Database settings (Use environment variables in production)
  DB_HOST: process.env.DB_HOST || 'sql300.infinityfree.com',
  DB_USER: process.env.DB_USER || 'if0_40696061',
  DB_PASSWORD: process.env.DB_PASSWORD || '7lJY57xSZtHl',
  DB_NAME: process.env.DB_NAME || 'if0_40696061_enfermagem_quiz',

  // Game settings
  MAP_SIZE: 200,
  MAX_PLAYERS_PER_MAP: 100,
  SPAWN_POINT: { x: 0, y: 0, z: 0 },

  // Combat settings
  BASE_ATTACK_COOLDOWN: 1000, // ms
  SKILL_COOLDOWN: 3000, // ms

  // Monster settings
  MONSTER_RESPAWN_TIME: 30000, // 30 seconds
  MONSTER_AGGRO_RANGE: 15,
  MONSTER_ATTACK_RANGE: 2,

  // Loot settings
  DROP_RATE: 0.3, // 30% chance

  // Level settings
  MAX_LEVEL: 100,
  XP_MULTIPLIER: 100 // XP needed = level * multiplier
};
