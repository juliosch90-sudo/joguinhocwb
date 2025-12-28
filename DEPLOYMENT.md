# Deployment Instructions

## ⚠️ IMPORTANT: InfinityFree Limitations

**InfinityFree does NOT support Node.js**. This hosting only supports PHP, HTML, CSS, and JavaScript.

The game as designed requires a Node.js backend server for:
- WebSocket connections
- Real-time multiplayer
- Server-side game logic
- Database management

## Current Deployment Status

The **CLIENT-SIDE ONLY** has been deployed to: `https://project-castiel.xo.je`

This means:
- ✅ You can see the login screen
- ✅ The 3D engine (Babylon.js) will load
- ❌ You CANNOT connect to a game server
- ❌ Multiplayer will NOT work
- ❌ The game will not function

## Solutions

### Option 1: Deploy Full Stack to a Node.js Host (RECOMMENDED)

Deploy the complete project to a hosting provider that supports Node.js:

**Free Options:**
- Render.com (Free tier with Node.js support)
- Railway.app (Free tier available)
- Fly.io (Free tier available)
- Glitch.com (Free, supports Node.js)

**Paid Options:**
- DigitalOcean ($5/month)
- Heroku (Paid plans)
- AWS EC2 / Lightsail

### Option 2: Keep InfinityFree + External Backend

- Host the CLIENT on InfinityFree (current setup)
- Host the SERVER on a Node.js platform (Render, Railway, etc.)
- Update client/js/network.js to connect to external server:

```javascript
// Change this line in network.js:
connect(url = 'ws://localhost:3000') {
// To:
connect(url = 'wss://your-backend-server.onrender.com') {
```

### Option 3: Convert to PHP-based Backend

This would require completely rewriting the backend in PHP and using:
- PHP WebSockets (Ratchet library)
- PHP for game logic
- MySQL for database

**This is NOT recommended** as it would lose the performance and real-time capabilities.

## How to Deploy to Render.com (Free, Supports Node.js)

1. Create account at render.com
2. Create new "Web Service"
3. Connect your GitHub repository (you'll need to push this code to GitHub)
4. Set build command: `npm install`
5. Set start command: `node server/index.js`
6. Deploy!

The full game will work on Render.com.

## Local Testing

To run locally (requires Node.js installed):

```bash
# Install dependencies
npm install

# Run server
npm start

# Access game at http://localhost:8080
```

## Files Uploaded to InfinityFree

Current deployment includes only the client-side files:
- `/htdocs/client/` - Full client (Babylon.js game)
- `/htdocs/README.md` - Documentation
- `/htdocs/package.json` - Dependencies list

Server files are included for reference but cannot run on InfinityFree.

## Next Steps

1. Choose a deployment option above
2. For full game, use Option 1 (Node.js hosting)
3. Update database credentials in server/config.js
4. Deploy and play!

---

**Current Status**: Demo/Preview Only (No Backend)
**To Play**: Deploy to Node.js hosting platform
