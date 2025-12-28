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

    // Movement physics
    this.velocity = BABYLON.Vector3.Zero();
    this.acceleration = 15; // Units per second squared
    this.deceleration = 20; // Units per second squared
    this.currentSpeed = 0;

    // Client-side prediction
    this.predictedPosition = null;
    this.lastServerPosition = null;
    this.lastServerUpdate = Date.now();

    this.createPlayer();
    this.createCamera();
    this.setupControls();

    // Initialize procedural animator
    this.animator = new ProceduralAnimator(this.mesh, 'humanoid');
  }

  createPlayer() {
    // Create stylized character model
    if (window.modelFactory) {
      this.mesh = window.modelFactory.createPlayerCharacter(this.data.name, 'warrior');
    } else {
      // Fallback to simple capsule
      this.mesh = BABYLON.MeshBuilder.CreateCapsule('player', {
        height: 2,
        radius: 0.5
      }, this.scene);

      const material = new BABYLON.StandardMaterial('playerMat', this.scene);
      material.diffuseColor = new BABYLON.Color3(0, 1, 0);
      material.emissiveColor = new BABYLON.Color3(0, 0.3, 0);
      this.mesh.material = material;
    }

    this.mesh.position.x = this.data.position.x;
    this.mesh.position.y = 0;
    this.mesh.position.z = this.data.position.z;

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
    const deltaTime = this.scene.getEngine().getDeltaTime() / 1000; // Convert to seconds

    // WASD movement input
    let inputX = 0;
    let inputZ = 0;

    if (this.keys['w']) inputZ = 1;
    if (this.keys['s']) inputZ = -1;
    if (this.keys['a']) inputX = -1;
    if (this.keys['d']) inputX = 1;

    // Normalize diagonal movement
    const inputLength = Math.sqrt(inputX * inputX + inputZ * inputZ);
    if (inputLength > 0) {
      inputX /= inputLength;
      inputZ /= inputLength;
    }

    this.isMoving = (inputLength > 0);

    // Apply acceleration/deceleration
    if (this.isMoving) {
      // Accelerate
      this.currentSpeed = Math.min(this.currentSpeed + this.acceleration * deltaTime, this.moveSpeed);

      // Calculate target velocity
      const targetVelocity = new BABYLON.Vector3(inputX, 0, inputZ).scale(this.currentSpeed);

      // Smooth velocity change
      this.velocity = BABYLON.Vector3.Lerp(this.velocity, targetVelocity, 0.2);

      // Rotate player to face movement direction
      if (this.velocity.length() > 0.1) {
        const angle = Math.atan2(this.velocity.x, this.velocity.z);
        const targetRotation = new BABYLON.Vector3(0, angle, 0);
        this.mesh.rotation = BABYLON.Vector3.Lerp(this.mesh.rotation, targetRotation, 0.15);
      }

      // Send movement to server
      if (window.game && window.game.network) {
        window.game.network.move('velocity', inputX, 0, inputZ);
      }
    } else {
      // Decelerate
      this.currentSpeed = Math.max(this.currentSpeed - this.deceleration * deltaTime, 0);
      this.velocity.scaleInPlace(Math.max(0, 1 - this.deceleration * deltaTime / this.moveSpeed));

      // Stop when velocity is very small
      if (this.velocity.length() < 0.01) {
        this.velocity = BABYLON.Vector3.Zero();
        this.currentSpeed = 0;

        // Send stop to server once
        if (window.game && window.game.network && !this.hasSentStop) {
          window.game.network.move('velocity', 0, 0, 0);
          this.hasSentStop = true;
        }
      }
    }

    // Reset stop flag when moving
    if (this.isMoving) {
      this.hasSentStop = false;
    }

    // Client-side prediction: apply velocity locally
    if (this.velocity.length() > 0.01) {
      const movement = this.velocity.scale(deltaTime);
      this.mesh.position.addInPlace(movement);
      this.predictedPosition = this.mesh.position.clone();
    }

    // Update procedural animation
    if (this.animator) {
      this.animator.update(deltaTime, this.velocity);
    }

    // Update camera target
    if (this.camera) {
      this.camera.target = this.mesh.position;
    }
  }

  updatePosition(x, y, z) {
    if (!this.mesh) return;

    const serverPosition = new BABYLON.Vector3(x, y + 1, z);
    this.lastServerPosition = serverPosition.clone();
    this.lastServerUpdate = Date.now();

    // Server reconciliation
    const currentPosition = this.mesh.position;
    const positionError = BABYLON.Vector3.Distance(currentPosition, serverPosition);

    if (positionError > 2.0) {
      // Large error: snap to server position (possible teleport or desync)
      console.log(`Large position error detected: ${positionError.toFixed(2)} units. Snapping to server.`);
      this.mesh.position = serverPosition;
      this.velocity = BABYLON.Vector3.Zero();
      this.currentSpeed = 0;
    } else if (positionError > 0.5) {
      // Medium error: smooth correction over time
      const correctionSpeed = 0.3; // 30% correction per frame
      this.mesh.position = BABYLON.Vector3.Lerp(currentPosition, serverPosition, correctionSpeed);
    } else if (positionError > 0.1) {
      // Small error: gentle correction
      const correctionSpeed = 0.1; // 10% correction per frame
      this.mesh.position = BABYLON.Vector3.Lerp(currentPosition, serverPosition, correctionSpeed);
    }
    // If error < 0.1, trust client prediction completely
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

    // Smooth interpolation
    this.targetPosition = null;
    this.lastPosition = null;
    this.interpolationAlpha = 0;
    this.interpolationSpeed = 10; // Units per second
    this.velocity = BABYLON.Vector3.Zero();

    this.createMesh();

    // Initialize animator
    this.animator = new ProceduralAnimator(this.mesh, 'humanoid');
  }

  createMesh() {
    // Create stylized character model
    if (window.modelFactory) {
      this.mesh = window.modelFactory.createPlayerCharacter(`remote_${this.data.id}`, 'mage');
    } else {
      // Fallback
      this.mesh = BABYLON.MeshBuilder.CreateCapsule(`player_${this.data.id}`, {
        height: 2,
        radius: 0.5
      }, this.scene);

      const material = new BABYLON.StandardMaterial(`playerMat_${this.data.id}`, this.scene);
      material.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
      this.mesh.material = material;
    }

    this.mesh.position.x = this.data.position.x;
    this.mesh.position.y = 0;
    this.mesh.position.z = this.data.position.z;

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

    if (this.mesh && data.position) {
      // Set target position
      this.targetPosition = new BABYLON.Vector3(data.position.x, 1, data.position.z);

      // Calculate rotation to face movement direction
      if (this.lastPosition) {
        const direction = this.targetPosition.subtract(this.mesh.position);
        if (direction.length() > 0.1) {
          const angle = Math.atan2(direction.x, direction.z);
          const targetRotation = new BABYLON.Vector3(0, angle, 0);

          // Smooth rotation
          this.mesh.rotation = BABYLON.Vector3.Lerp(
            this.mesh.rotation,
            targetRotation,
            0.15
          );
        }
      }

      this.lastPosition = this.mesh.position.clone();
    }
  }

  interpolate() {
    if (!this.mesh || !this.targetPosition) return;

    const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
    const distance = BABYLON.Vector3.Distance(this.mesh.position, this.targetPosition);

    // Calculate velocity for animation
    const oldPos = this.mesh.position.clone();

    if (distance > 0.05) {
      // Calculate interpolation speed based on distance
      const speed = Math.min(this.interpolationSpeed, distance * 5);
      const maxStep = speed * deltaTime;

      // Move towards target
      this.mesh.position = BABYLON.Vector3.Lerp(
        this.mesh.position,
        this.targetPosition,
        Math.min(maxStep / distance, 1)
      );
    } else {
      // Snap to target when very close
      this.mesh.position = this.targetPosition;
    }

    // Calculate velocity for animation
    this.velocity = this.mesh.position.subtract(oldPos).scale(1 / deltaTime);

    // Update procedural animation
    if (this.animator) {
      this.animator.update(deltaTime, this.velocity);
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
