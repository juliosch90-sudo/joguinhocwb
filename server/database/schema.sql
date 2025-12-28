-- MMORPG Database Schema

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  is_banned BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  account_id INT NOT NULL,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_account (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL, -- weapon, armor, consumable
  level_req INT NOT NULL DEFAULT 1,
  attack_bonus INT DEFAULT 0,
  defense_bonus INT DEFAULT 0,
  hp_bonus INT DEFAULT 0,
  description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  character_id INT NOT NULL,
  item_id INT NOT NULL,
  slot INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  is_equipped BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id),
  INDEX idx_character (character_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Monster templates
CREATE TABLE IF NOT EXISTS monster_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  level INT NOT NULL,
  hp INT NOT NULL,
  attack INT NOT NULL,
  defense INT NOT NULL,
  xp_reward INT NOT NULL,
  move_speed FLOAT NOT NULL DEFAULT 1.0,
  attack_speed FLOAT NOT NULL DEFAULT 1.0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default monster templates
INSERT INTO monster_templates (name, level, hp, attack, defense, xp_reward, move_speed, attack_speed) VALUES
('Slime', 1, 50, 5, 2, 10, 0.8, 1.5),
('Wolf', 5, 120, 15, 5, 50, 1.2, 1.0),
('Orc', 10, 250, 30, 10, 100, 1.0, 0.8);

-- Insert default items
INSERT INTO items (name, type, level_req, attack_bonus, defense_bonus, hp_bonus, description) VALUES
('Rusty Sword', 'weapon', 1, 5, 0, 0, 'A basic sword for beginners'),
('Iron Sword', 'weapon', 5, 15, 0, 0, 'A sturdy iron sword'),
('Leather Armor', 'armor', 1, 0, 10, 20, 'Basic leather protection'),
('Health Potion', 'consumable', 1, 0, 0, 50, 'Restores 50 HP'),
('Mana Potion', 'consumable', 1, 0, 0, 0, 'Restores 30 MP');

-- Game statistics
CREATE TABLE IF NOT EXISTS game_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  total_kills INT DEFAULT 0,
  total_deaths INT DEFAULT 0,
  total_logins INT DEFAULT 0,
  peak_players INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO game_stats (id) VALUES (1);
