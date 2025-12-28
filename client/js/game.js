class Game {
  constructor() {
    this.engine = null;
    this.scene = null;
    this.network = null;
    this.hud = null;
    this.player = null;
    this.remotePlayers = new Map();
    this.monsters = new Map();
    this.currentTarget = null;
    this.isInitialized = false;
  }

  async init(characterName) {
    console.log('Initializing game...');

    // Create Babylon engine
    const canvas = document.getElementById('renderCanvas');
    this.engine = new BABYLON.Engine(canvas, true);

    // Create scene
    this.createScene();

    // Initialize HUD
    this.hud = new HUD();

    // Connect to server
    this.network = new NetworkClient();

    try {
      await this.network.connect();
      this.setupNetworkHandlers();
      this.network.join(characterName);
    } catch (error) {
      console.error('Failed to connect to server:', error);
      alert('Failed to connect to server. Please make sure the server is running.');
      return false;
    }

    // Start render loop
    this.engine.runRenderLoop(() => {
      if (this.player) {
        this.player.update();
      }
      this.scene.render();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });

    this.isInitialized = true;
    return true;
  }

  createScene() {
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color3(0.5, 0.7, 1);

    // Lighting
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;

    const dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -2, -1), this.scene);
    dirLight.intensity = 0.5;

    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround('ground', {
      width: 200,
      height: 200,
      subdivisions: 10
    }, this.scene);

    const groundMaterial = new BABYLON.StandardMaterial('groundMat', this.scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.6, 0.3);
    groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    ground.material = groundMaterial;

    // Add grid texture
    const gridTexture = new BABYLON.GridMaterial('gridMat', this.scene);
    gridTexture.mainColor = new BABYLON.Color3(0.3, 0.6, 0.3);
    gridTexture.lineColor = new BABYLON.Color3(0.2, 0.4, 0.2);
    gridTexture.opacity = 0.98;
    ground.material = gridTexture;

    // Skybox
    const skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: 500 }, this.scene);
    const skyboxMaterial = new BABYLON.StandardMaterial('skyboxMat', this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.7, 1);
    skybox.material = skyboxMaterial;
  }

  setupNetworkHandlers() {
    this.network.on('join_success', (data) => {
      console.log('Joined game successfully');

      // Create local player
      this.player = new PlayerController(this.scene, data.player);

      // Update HUD
      this.hud.updatePlayerStats(data.player);

      // Add existing players
      for (const playerData of data.map.players) {
        if (playerData.id !== data.player.id) {
          this.addRemotePlayer(playerData);
        }
      }

      // Add monsters
      for (const monsterData of data.map.monsters) {
        this.addMonster(monsterData);
      }

      this.hud.addChatMessage('System', 'Welcome to the game!', true);
    });

    this.network.on('game_state', (data) => {
      // Update players
      for (const playerData of data.players) {
        if (this.player && playerData.id === this.player.data.id) {
          // Update local player data
          this.player.data = { ...this.player.data, ...playerData };
          this.player.updatePosition(playerData.position.x, playerData.position.y, playerData.position.z);
          this.hud.updatePlayerStats(this.player.data);
        } else {
          // Update remote player
          const remotePlayer = this.remotePlayers.get(playerData.id);
          if (remotePlayer) {
            remotePlayer.update(playerData);
          }
        }
      }

      // Update monsters
      for (const monsterData of data.monsters) {
        const monster = this.monsters.get(monsterData.id);
        if (monster) {
          monster.update(monsterData);

          // Update target info if this is the current target
          if (this.currentTarget && this.currentTarget.id === monsterData.id) {
            this.hud.showTarget(monsterData);
          }
        }
      }

      // Update minimap
      if (this.player) {
        this.hud.updateMinimap(
          this.player.data.position,
          data.players.filter(p => p.id !== this.player.data.id),
          data.monsters,
          200
        );
      }
    });

    this.network.on('player_joined', (data) => {
      this.addRemotePlayer(data);
      this.hud.addChatMessage('System', `${data.name} joined the game`, true);
    });

    this.network.on('player_left', (data) => {
      this.removeRemotePlayer(data.playerId);
    });

    this.network.on('attack', (data) => {
      console.log('Attack:', data);
      // Show damage number
      // This would need screen position calculation
    });

    this.network.on('monster_death', (data) => {
      const monster = this.monsters.get(data.monsterId);
      if (monster) {
        monster.destroy();
        this.monsters.delete(data.monsterId);
      }

      if (this.currentTarget && this.currentTarget.id === data.monsterId) {
        this.currentTarget = null;
        this.hud.hideTarget();
      }

      this.hud.addChatMessage('System', `${data.xp} XP gained!`, true);
    });

    this.network.on('player_death', (data) => {
      if (this.player && data.playerId === this.player.data.id) {
        this.hud.addChatMessage('System', 'You died!', true);
      }
    });

    this.network.on('chat', (data) => {
      this.hud.addChatMessage(data.playerName, data.message);
    });

    this.network.on('skill_used', (data) => {
      console.log('Skill used:', data);
      // Visual effects would go here
    });
  }

  addRemotePlayer(playerData) {
    if (!this.remotePlayers.has(playerData.id)) {
      const remotePlayer = new RemotePlayer(this.scene, playerData);
      this.remotePlayers.set(playerData.id, remotePlayer);
    }
  }

  removeRemotePlayer(playerId) {
    const remotePlayer = this.remotePlayers.get(playerId);
    if (remotePlayer) {
      remotePlayer.destroy();
      this.remotePlayers.delete(playerId);
    }
  }

  addMonster(monsterData) {
    if (!this.monsters.has(monsterData.id)) {
      const monster = new MonsterRenderer(this.scene, monsterData);
      this.monsters.set(monsterData.id, monster);
    }
  }

  setTarget(monster) {
    this.currentTarget = monster;
    this.hud.showTarget(monster.data);
  }

  clearTarget() {
    this.currentTarget = null;
    this.hud.hideTarget();
  }

  shutdown() {
    if (this.network) {
      this.network.disconnect();
    }

    if (this.engine) {
      this.engine.dispose();
    }
  }
}
