const mysql = require('mysql2/promise');
const config = require('../config');

// Database connection pool
let pool = null;

async function initDatabase() {
  try {
    pool = mysql.createPool({
      host: config.DB_HOST,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log('✓ Database connected successfully');
    connection.release();

    return pool;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    throw error;
  }
}

// Character queries
async function getCharacterByName(name) {
  const [rows] = await pool.execute(
    'SELECT * FROM characters WHERE name = ?',
    [name]
  );
  return rows[0];
}

async function createCharacter(accountId, name) {
  const [result] = await pool.execute(
    `INSERT INTO characters (account_id, name, class, level, experience, hp, max_hp, mp, max_mp, attack, defense)
     VALUES (?, ?, 'Warrior', 1, 0, 100, 100, 50, 50, 10, 5)`,
    [accountId, name]
  );
  return result.insertId;
}

async function updateCharacterPosition(characterId, x, y, z) {
  await pool.execute(
    'UPDATE characters SET pos_x = ?, pos_y = ?, pos_z = ? WHERE id = ?',
    [x, y, z, characterId]
  );
}

async function updateCharacterStats(characterId, stats) {
  const { level, experience, hp, max_hp, attack, defense } = stats;
  await pool.execute(
    `UPDATE characters SET level = ?, experience = ?, hp = ?, max_hp = ?, attack = ?, defense = ?
     WHERE id = ?`,
    [level, experience, hp, max_hp, attack, defense, characterId]
  );
}

async function getMonsterTemplates() {
  const [rows] = await pool.execute('SELECT * FROM monster_templates');
  return rows;
}

async function getItemById(itemId) {
  const [rows] = await pool.execute('SELECT * FROM items WHERE id = ?', [itemId]);
  return rows[0];
}

async function addItemToInventory(characterId, itemId, quantity = 1) {
  // Find available slot
  const [slots] = await pool.execute(
    'SELECT slot FROM inventory WHERE character_id = ? ORDER BY slot DESC LIMIT 1',
    [characterId]
  );

  const nextSlot = slots.length > 0 ? slots[0].slot + 1 : 0;

  await pool.execute(
    'INSERT INTO inventory (character_id, item_id, slot, quantity) VALUES (?, ?, ?, ?)',
    [characterId, itemId, nextSlot, quantity]
  );
}

module.exports = {
  initDatabase,
  getCharacterByName,
  createCharacter,
  updateCharacterPosition,
  updateCharacterStats,
  getMonsterTemplates,
  getItemById,
  addItemToInventory
};
