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

      // Update remote players interpolation
      for (const remotePlayer of this.remotePlayers.values()) {
        if (remotePlayer.interpolate) {
          remotePlayer.interpolate();
        }
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

    // Initialize model factory
    window.modelFactory = new ModelFactory(this.scene);

    // Enhanced sky color (dawn/dusk atmosphere)
    this.scene.clearColor = new BABYLON.Color3(0.6, 0.75, 0.9);

    // Create temporary camera (will be replaced by player camera)
    const tempCamera = new BABYLON.FreeCamera('tempCamera', new BABYLON.Vector3(0, 5, -10), this.scene);
    tempCamera.setTarget(BABYLON.Vector3.Zero());
    this.scene.activeCamera = tempCamera;

    // Enhanced lighting for fantasy feel
    const hemisphericLight = new BABYLON.HemisphericLight('hemispheric', new BABYLON.Vector3(0, 1, 0), this.scene);
    hemisphericLight.intensity = 0.6;
    hemisphericLight.groundColor = new BABYLON.Color3(0.3, 0.25, 0.2); // Warmer ground bounce

    const dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-0.5, -1, -0.5), this.scene);
    dirLight.intensity = 0.7;
    dirLight.diffuse = new BABYLON.Color3(1, 0.95, 0.8); // Warm sunlight
    dirLight.specular = new BABYLON.Color3(0.5, 0.5, 0.4);

    // Enable shadows for depth
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurScale = 2;
    this.shadowGenerator = shadowGenerator;

    // Enhanced ground with texture
    const ground = BABYLON.MeshBuilder.CreateGround('ground', {
      width: 200,
      height: 200,
      subdivisions: 20
    }, this.scene);

    const groundMaterial = new BABYLON.StandardMaterial('groundMat', this.scene);

    // Create procedural grass texture
    const groundTexture = new BABYLON.DynamicTexture('groundTexture', 512, this.scene);
    const ctx = groundTexture.getContext();

    // Base grass color
    ctx.fillStyle = '#4a7c3b';
    ctx.fillRect(0, 0, 512, 512);

    // Add variety with random dark/light patches
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = 20 + Math.random() * 40;
      const shade = 0.8 + Math.random() * 0.4;
      ctx.fillStyle = `rgb(${74 * shade}, ${124 * shade}, ${59 * shade})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    groundTexture.update();

    groundMaterial.diffuseTexture = groundTexture;
    groundMaterial.diffuseTexture.uScale = 20;
    groundMaterial.diffuseTexture.vScale = 20;
    groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    groundMaterial.specularPower = 32;
    ground.material = groundMaterial;
    ground.receiveShadows = true;

    // Gradient skybox for depth
    const skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: 500 }, this.scene);
    const skyboxMaterial = new BABYLON.StandardMaterial('skyboxMat', this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;

    // Create gradient texture for sky
    const skyTexture = new BABYLON.DynamicTexture('skyTexture', 512, this.scene);
    const skyCtx = skyTexture.getContext();
    const gradient = skyCtx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue at top
    gradient.addColorStop(0.5, '#B0D4E3'); // Lighter middle
    gradient.addColorStop(1, '#E8F4F8'); // Almost white at horizon
    skyCtx.fillStyle = gradient;
    skyCtx.fillRect(0, 0, 512, 512);
    skyTexture.update();

    skyboxMaterial.emissiveTexture = skyTexture;
    skybox.material = skyboxMaterial;

    // Add some environmental props
    this.addEnvironmentProps();
  }

  addEnvironmentProps() {
    // Add trees around the map edges
    const treePositions = [
      [-80, 0, -80], [-60, 0, -85], [-70, 0, -75],
      [80, 0, 80], [75, 0, 85], [85, 0, 75],
      [-80, 0, 80], [-85, 0, 75], [-75, 0, 85],
      [80, 0, -80], [75, 0, -85], [85, 0, -75]
    ];

    treePositions.forEach(pos => {
      const tree = window.modelFactory.createTree(2.5 + Math.random() * 1.5);
      tree.position.set(pos[0], pos[1], pos[2]);
      tree.rotation.y = Math.random() * Math.PI * 2;

      // Add trees to shadow casters
      tree.getChildMeshes().forEach(mesh => {
        if (this.shadowGenerator) {
          this.shadowGenerator.addShadowCaster(mesh);
        }
      });
    });

    // Add rocks
    const rockPositions = [
      [-50, 0, -50], [60, 0, -40], [-45, 0, 55], [70, 0, 65]
    ];

    rockPositions.forEach(pos => {
      const rock = window.modelFactory.createRock(0.5 + Math.random() * 0.5);
      rock.position.set(pos[0], 0, pos[2]);
      rock.rotation.y = Math.random() * Math.PI * 2;

      if (this.shadowGenerator) {
        this.shadowGenerator.addShadowCaster(rock);
      }
    });
  }

  setupNetworkHandlers() {
    this.network.on('join_success', (data) => {
      console.log('Joined game successfully');

      // Create local player
      this.player = new PlayerController(this.scene, data.player);

      // Add player to shadow casters
      if (this.shadowGenerator && this.player.mesh) {
        if (this.player.mesh.getChildMeshes) {
          this.player.mesh.getChildMeshes().forEach(mesh => {
            this.shadowGenerator.addShadowCaster(mesh);
          });
        } else {
          this.shadowGenerator.addShadowCaster(this.player.mesh);
        }
      }

      // Set player camera as active
      if (this.player.camera) {
        this.scene.activeCamera = this.player.camera;
      }

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
