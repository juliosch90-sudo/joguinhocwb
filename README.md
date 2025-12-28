# 🎮 Browser MMORPG - MU-Style Game

A fully playable 3D MMORPG in the browser inspired by classic MMORPGs like MU Online.

## 🚀 Technologies

- **Frontend**: Babylon.js (3D rendering)
- **Backend**: Node.js + Express + WebSocket (ws library)
- **Database**: MySQL
- **Communication**: WebSocket for real-time multiplayer

## 📂 Project Structure

```
mmorpg/
├── client/                 # Frontend (Babylon.js)
│   ├── index.html         # Main HTML file
│   ├── css/
│   │   └── style.css      # Game UI styles
│   ├── js/
│   │   ├── main.js        # Entry point
│   │   ├── game.js        # Game scene manager
│   │   ├── player.js      # Player controller
│   │   ├── network.js     # WebSocket client
│   │   ├── hud.js         # UI/HUD manager
│   │   └── monster.js     # Monster rendering
│   └── assets/            # 3D models, textures (to be added)
│
├── server/                # Backend (Node.js)
│   ├── index.js           # Server entry point
│   ├── game/
│   │   ├── GameServer.js  # Main game server
│   │   ├── Player.js      # Player entity
│   │   ├── Monster.js     # Monster entity
│   │   ├── Map.js         # Map/World manager
│   │   └── Combat.js      # Combat system
│   ├── database/
│   │   ├── db.js          # Database connection
│   │   └── schema.sql     # Database schema
│   └── config.js          # Server configuration
│
├── shared/                # Shared code (client/server)
│   └── constants.js       # Game constants
│
├── package.json           # Dependencies
└── README.md             # This file
```

## 🎯 Features (MVP)

### ✅ Implemented
- 3D world with Babylon.js
- Third-person camera
- Player movement (WASD + Click-to-move)
- Real-time multiplayer
- Monster spawning and AI
- Combat system (PvE and PvP)
- Level and XP system
- Simple loot drops
- HUD (HP, Level, Skills)
- Database persistence

### 🔜 Future Features
- Inventory system
- Equipment system
- Multiple classes
- More maps
- Party system
- Chat system

## 🏗️ Architecture

### Client (Frontend)
- **Babylon.js Scene**: Renders 3D world, players, monsters
- **Network Client**: Connects to server via WebSocket
- **Input Handler**: WASD movement, click-to-move, skills
- **HUD Manager**: Displays player stats, health bars

### Server (Backend)
- **Authoritative Server**: Validates all actions (anti-cheat)
- **Game Loop**: 60 tick/s for physics and AI
- **WebSocket Server**: Handles player connections
- **Database**: Persistent storage for accounts, characters, items

### Data Flow
```
Client Input → WebSocket → Server Validation → Game State Update →
Broadcast to Clients → Client Rendering
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### Database Setup

1. Create MySQL database:
```sql
CREATE DATABASE mmorpg_game;
```

2. Import schema:
```bash
mysql -u root -p mmorpg_game < server/database/schema.sql
```

3. Update database credentials in `server/config.js`

### Install Dependencies

```bash
npm install
```

### Run the Game

1. Start the server:
```bash
node server/index.js
```

2. Open client in browser:
```bash
# Open client/index.html in your browser
# Or use a local server:
npx http-server client -p 8080
```

3. Access the game:
```
http://localhost:8080
```

## 🎮 Game Controls

- **WASD**: Move character
- **Mouse Click**: Click-to-move
- **1-4**: Use skills
- **Tab**: Toggle character panel
- **Enter**: Open chat

## 🗺️ Game World

### Map: Lorencia Plains
- Open field with grass terrain
- 3 monster types with different difficulties
- Safe zone near spawn point

### Monsters
1. **Slime** (Level 1-3) - Easy
2. **Wolf** (Level 4-7) - Medium
3. **Orc** (Level 8-12) - Hard

### Character
- **Class**: Warrior (initial MVP class)
- **Starting Level**: 1
- **Starting Stats**: HP 100, Attack 10

## 📊 Combat System

- **Damage Calculation**: Attack - Defense + Random(0-5)
- **XP Formula**: Monster Level × 10
- **Level Up**: XP Required = Current Level × 100
- **Drop Rate**: 30% chance for items

## 🔐 Security

- Server-side validation for all actions
- No client-side stat modification
- Movement speed validation
- Cooldown enforcement
- Anti-teleport checks

## 🐛 Known Issues

- Monster pathfinding is basic (straight line pursuit)
- No collision detection on terrain yet
- Limited to single map instance

## 📝 License

This project is for educational purposes. All original code by the development team.

## 🤝 Contributing

This is an MVP. Future expansions welcome!

---

**Enjoy the game!** 🎮⚔️
