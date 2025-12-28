const { Pool } = require('pg');

// PostgreSQL connection pool
let pool = null;

async function initDatabase() {
  try {
    // Use DATABASE_URL from environment (Render provides this automatically)
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    const client = await pool.connect();
    console.log('✓ PostgreSQL database connected successfully');

    // Create tables if they don't exist
    await createTables(client);

    client.release();
    return pool;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    throw error;
  }
}

async function createTables(client) {
  // Create characters table
  await client.query(`
    CREATE TABLE IF NOT EXISTS characters (
      id SERIAL PRIMARY KEY,
      account_id INT NOT NULL DEFAULT 1,
      name VARCHAR(30) UNIQUE NOT NULL,
      class VARCHAR(20) NOT NULL DEFAULT 'Warrior',
      level INT NOT NULL DEFAULT 1,
      experience INT NOT NULL DEFAULT 0,
      hp INT NOT NULL DEFAULT 100,
      max_hp INT NOT NULL DEFAULT 100,
      mp INT NOT NULL DEFAULT 50,
      max_mp INT NOT NULL DEFAULT 50,
      attack INT NOT NULL DEFAULT 10,
      defense INT NOT NULL DEFAULT 5,
      pos_x FLOAT NOT NULL DEFAULT 0,
      pos_y FLOAT NOT NULL DEFAULT 0,
      pos_z FLOAT NOT NULL DEFAULT 0,
      map VARCHAR(50) NOT NULL DEFAULT 'lorencia',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create monster_templates table
  await client.query(`
    CREATE TABLE IF NOT EXISTS monster_templates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      level INT NOT NULL,
      hp INT NOT NULL,
      attack INT NOT NULL,
      defense INT NOT NULL,
      xp_reward INT NOT NULL,
      move_speed FLOAT NOT NULL DEFAULT 1.0,
      attack_speed FLOAT NOT NULL DEFAULT 1.0
    )
  `);

  // Insert default monsters if table is empty
  const { rows } = await client.query('SELECT COUNT(*) FROM monster_templates');
  if (parseInt(rows[0].count) === 0) {
    await client.query(`
      INSERT INTO monster_templates (name, level, hp, attack, defense, xp_reward, move_speed, attack_speed) VALUES
      ('Slime', 1, 50, 5, 2, 10, 0.8, 1.5),
      ('Wolf', 5, 120, 15, 5, 50, 1.2, 1.0),
      ('Orc', 10, 250, 30, 10, 100, 1.0, 0.8)
    `);
    console.log('✓ Inserted default monster templates');
  }

  console.log('✓ Database tables ready');
}

// Character queries
async function getCharacterByName(name) {
  const { rows } = await pool.query(
    'SELECT * FROM characters WHERE name = $1',
    [name]
  );
  return rows[0];
}

async function createCharacter(accountId, name) {
  const { rows } = await pool.query(
    `INSERT INTO characters (account_id, name, class, level, experience, hp, max_hp, mp, max_mp, attack, defense)
     VALUES ($1, $2, 'Warrior', 1, 0, 100, 100, 50, 50, 10, 5)
     RETURNING id`,
    [accountId, name]
  );
  return rows[0].id;
}

async function updateCharacterPosition(characterId, x, y, z) {
  await pool.query(
    'UPDATE characters SET pos_x = $1, pos_y = $2, pos_z = $3 WHERE id = $4',
    [x, y, z, characterId]
  );
}

async function updateCharacterStats(characterId, stats) {
  const { level, experience, hp, max_hp, attack, defense } = stats;
  await pool.query(
    `UPDATE characters SET level = $1, experience = $2, hp = $3, max_hp = $4, attack = $5, defense = $6
     WHERE id = $7`,
    [level, experience, hp, max_hp, attack, defense, characterId]
  );
}

async function getMonsterTemplates() {
  const { rows } = await pool.query('SELECT * FROM monster_templates');
  return rows;
}

async function getItemById(itemId) {
  // For now, return mock data (items table not implemented yet)
  return { id: itemId, name: 'Test Item', type: 'weapon' };
}

async function addItemToInventory(characterId, itemId, quantity = 1) {
  console.log(`Item ${itemId} added to character ${characterId}`);
  // Items table not implemented yet
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
