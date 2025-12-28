class PlayerController {
  constructor(scene, playerData) {
    this.scene = scene;
    this.data = playerData;
    this.mesh = null;
    this.nameTag = null;
    this.camera = null;
    this.keys = {};
    this.moveSpeed = 5;
    this.isMoving = false;

    this.createPlayer();
    this.createCamera();
    this.setupControls();
  }

  createPlayer() {
    // Create simple capsule for player
    this.mesh = BABYLON.MeshBuilder.CreateCapsule('player', {
      height: 2,
      radius: 0.5
    }, this.scene);

    this.mesh.position.x = this.data.position.x;
    this.mesh.position.y = 1;
    this.mesh.position.z = this.data.position.z;

    // Player material
    const material = new BABYLON.StandardMaterial('playerMat', this.scene);
    material.diffuseColor = new BABYLON.Color3(0, 1, 0);
    material.emissiveColor = new BABYLON.Color3(0, 0.3, 0);
    this.mesh.material = material;

    // Name tag
    this.createNameTag();
  }

  createNameTag() {
    const plane = BABYLON.MeshBuilder.CreatePlane('nameTag', { width: 2, height: 0.5 }, this.scene);
    plane.position.y = 2.5;
    plane.parent = this.mesh;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const texture = new BABYLON.DynamicTexture('nameTagTexture', { width: 256, height: 64 }, this.scene);
    const material = new BABYLON.StandardMaterial('nameTagMat', this.scene);
    material.diffuseTexture = texture;
    material.emissiveTexture = texture;
    material.opacityTexture = texture;
    plane.material = material;

    const ctx = texture.getContext();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.data.name, 128, 42);
    texture.update();

    this.nameTag = plane;
  }

  createCamera() {
    this.camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 3,
      15,
      this.mesh.position,
      this.scene
    );

    this.camera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);
    this.camera.lowerRadiusLimit = 5;
    this.camera.upperRadiusLimit = 25;
    this.camera.lowerBetaLimit = 0.1;
    this.camera.upperBetaLimit = Math.PI / 2 - 0.1;
  }

  setupControls() {
    const canvas = this.scene.getEngine().getRenderingCanvas();

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.handleSkillKeys(e.key);
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Click-to-move
    canvas.addEventListener('click', (e) => {
      if (e.button === 0) { // Left click
        this.handleClick();
      }
    });
  }

  handleSkillKeys(key) {
    const skillMap = { '1': 1, '2': 2, '3': 3, '4': 4 };
    const skillId = skillMap[key];

    if (skillId && window.game && window.game.network) {
      window.game.network.useSkill(skillId, window.game.currentTarget?.id);
    }
  }

  handleClick() {
    const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);

    if (pickResult.hit) {
      // Check if clicked on monster or player
      const clickedMesh = pickResult.pickedMesh;

      if (clickedMesh.monster) {
        // Attack monster
        window.game.setTarget(clickedMesh.monster);
        window.game.network.attack(clickedMesh.monster.id, 'monster');
      } else if (clickedMesh.name === 'ground') {
        // Move to position
        const point = pickResult.pickedPoint;
        window.game.network.move('target', point.x, point.y, point.z);
      }
    }
  }

  update() {
    // WASD movement
    let moveX = 0;
    let moveZ = 0;

    if (this.keys['w']) moveZ = 1;
    if (this.keys['s']) moveZ = -1;
    if (this.keys['a']) moveX = -1;
    if (this.keys['d']) moveX = 1;

    this.isMoving = (moveX !== 0 || moveZ !== 0);

    if (this.isMoving) {
      // Normalize diagonal movement
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      if (length > 0) {
        moveX /= length;
        moveZ /= length;
      }

      // Send movement to server
      if (window.game && window.game.network) {
        window.game.network.move('velocity', moveX, 0, moveZ);
      }
    } else if (Object.keys(this.keys).some(k => this.keys[k])) {
      // Send stop movement
      if (window.game && window.game.network) {
        window.game.network.move('velocity', 0, 0, 0);
      }
    }

    // Update camera target
    if (this.camera) {
      this.camera.target = this.mesh.position;
    }
  }

  updatePosition(x, y, z) {
    if (this.mesh) {
      this.mesh.position.x = x;
      this.mesh.position.y = y + 1;
      this.mesh.position.z = z;
    }
  }

  destroy() {
    if (this.mesh) {
      this.mesh.dispose();
    }
    if (this.nameTag) {
      this.nameTag.dispose();
    }
  }
}

class RemotePlayer {
  constructor(scene, playerData) {
    this.scene = scene;
    this.data = playerData;
    this.mesh = null;
    this.nameTag = null;

    this.createMesh();
  }

  createMesh() {
    this.mesh = BABYLON.MeshBuilder.CreateCapsule(`player_${this.data.id}`, {
      height: 2,
      radius: 0.5
    }, this.scene);

    this.mesh.position.x = this.data.position.x;
    this.mesh.position.y = 1;
    this.mesh.position.z = this.data.position.z;

    const material = new BABYLON.StandardMaterial(`playerMat_${this.data.id}`, this.scene);
    material.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
    this.mesh.material = material;

    this.createNameTag();
  }

  createNameTag() {
    const plane = BABYLON.MeshBuilder.CreatePlane(`nameTag_${this.data.id}`, {
      width: 2,
      height: 0.5
    }, this.scene);

    plane.position.y = 2.5;
    plane.parent = this.mesh;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const texture = new BABYLON.DynamicTexture(`nameTagTexture_${this.data.id}`, {
      width: 256,
      height: 64
    }, this.scene);

    const material = new BABYLON.StandardMaterial(`nameTagMat_${this.data.id}`, this.scene);
    material.diffuseTexture = texture;
    material.emissiveTexture = texture;
    material.opacityTexture = texture;
    plane.material = material;

    const ctx = texture.getContext();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.data.name, 128, 42);
    texture.update();

    this.nameTag = plane;
  }

  update(data) {
    this.data = { ...this.data, ...data };

    if (this.mesh) {
      // Smooth interpolation
      BABYLON.Animation.CreateAndStartAnimation(
        'playerMove',
        this.mesh,
        'position',
        60,
        5,
        this.mesh.position.clone(),
        new BABYLON.Vector3(data.position.x, 1, data.position.z),
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
    }
  }

  destroy() {
    if (this.mesh) {
      this.mesh.dispose();
    }
    if (this.nameTag) {
      this.nameTag.dispose();
    }
  }
}
