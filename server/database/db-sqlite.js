// Simple in-memory database for local testing
const characters = new Map();
const monsterTemplates = [
  { id: 1, name: 'Slime', level: 1, hp: 50, attack: 5, defense: 2, xp_reward: 10, move_speed: 0.8, attack_speed: 1.5 },
  { id: 2, name: 'Wolf', level: 5, hp: 120, attack: 15, defense: 5, xp_reward: 50, move_speed: 1.2, attack_speed: 1.0 },
  { id: 3, name: 'Orc', level: 10, hp: 250, attack: 30, defense: 10, xp_reward: 100, move_speed: 1.0, attack_speed: 0.8 }
];

async function initDatabase() {
  console.log('✓ Using in-memory database for local testing');
  return true;
}

async function getCharacterByName(name) {
  return characters.get(name);
}

async function createCharacter(accountId, name) {
  const char = {
    id: characters.size + 1,
    account_id: accountId,
    name: name,
    class: 'Warrior',
    level: 1,
    experience: 0,
    hp: 100,
    max_hp: 100,
    mp: 50,
    max_mp: 50,
    attack: 10,
    defense: 5,
    pos_x: 0,
    pos_y: 0,
    pos_z: 0,
    map: 'lorencia'
  };
  characters.set(name, char);
  return char.id;
}

async function updateCharacterPosition(characterId, x, y, z) {
  for (const char of characters.values()) {
    if (char.id === characterId) {
      char.pos_x = x;
      char.pos_y = y;
      char.pos_z = z;
      break;
    }
  }
}

async function updateCharacterStats(characterId, stats) {
  for (const char of characters.values()) {
    if (char.id === characterId) {
      Object.assign(char, stats);
      break;
    }
  }
}

async function getMonsterTemplates() {
  return monsterTemplates;
}

async function getItemById(itemId) {
  return { id: itemId, name: 'Test Item', type: 'weapon' };
}

async function addItemToInventory(characterId, itemId, quantity = 1) {
  console.log(`Item ${itemId} added to character ${characterId}`);
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
