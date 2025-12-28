// Procedural Animation System
// Creates realistic movement without pre-baked animations

class ProceduralAnimator {
  constructor(mesh, type = 'humanoid') {
    this.mesh = mesh;
    this.type = type;
    this.time = 0;
    this.isMoving = false;
    this.moveSpeed = 0;

    // Animation state
    this.bobAmount = 0.15; // How much to bob up and down
    this.bobSpeed = 8; // Speed of bobbing
    this.breatheAmount = 0.03; // Idle breathing
    this.breatheSpeed = 2;

    // Store original positions of body parts
    this.originalPositions = new Map();
    this.originalScales = new Map();

    if (this.mesh.getChildMeshes) {
      this.mesh.getChildMeshes().forEach(child => {
        this.originalPositions.set(child.name, child.position.clone());
        this.originalScales.set(child.name, child.scaling.clone());
      });
    }
  }

  update(deltaTime, velocity) {
    this.time += deltaTime;
    this.moveSpeed = velocity ? velocity.length() : 0;
    this.isMoving = this.moveSpeed > 0.1;

    if (this.type === 'humanoid') {
      this.updateHumanoid(deltaTime);
    } else if (this.type === 'slime') {
      this.updateSlime(deltaTime);
    } else if (this.type === 'wolf') {
      this.updateWolf(deltaTime);
    } else if (this.type === 'orc') {
      this.updateOrc(deltaTime);
    }
  }

  updateHumanoid(deltaTime) {
    if (!this.mesh.getChildMeshes) return;

    const children = this.mesh.getChildMeshes();

    if (this.isMoving) {
      // Walking animation
      const bobCycle = Math.sin(this.time * this.bobSpeed * this.moveSpeed);
      const stepCycle = Math.sin(this.time * this.bobSpeed * 2 * this.moveSpeed);

      // Bob entire body up and down
      this.mesh.position.y = Math.abs(bobCycle) * this.bobAmount;

      // Animate legs
      children.forEach(child => {
        const origPos = this.originalPositions.get(child.name);
        if (!origPos) return;

        if (child.name.includes('leg_l')) {
          // Left leg swings
          child.rotation.x = stepCycle * 0.5;
          child.position.y = origPos.y + Math.max(0, stepCycle * 0.1);
        } else if (child.name.includes('leg_r')) {
          // Right leg swings opposite
          child.rotation.x = -stepCycle * 0.5;
          child.position.y = origPos.y + Math.max(0, -stepCycle * 0.1);
        } else if (child.name.includes('arm_l')) {
          // Left arm swings opposite to left leg
          child.rotation.x = -stepCycle * 0.3;
        } else if (child.name.includes('arm_r')) {
          // Right arm swings opposite to right leg
          child.rotation.x = stepCycle * 0.3;
        } else if (child.name.includes('body')) {
          // Slight torso rotation while walking
          child.rotation.y = bobCycle * 0.05;
        }
      });
    } else {
      // Idle breathing animation
      const breathe = Math.sin(this.time * this.breatheSpeed) * this.breatheAmount;

      this.mesh.position.y = breathe;

      // Reset limb rotations smoothly
      children.forEach(child => {
        if (child.name.includes('leg') || child.name.includes('arm')) {
          child.rotation.x *= 0.9; // Smooth decay to 0
        }
        if (child.name.includes('body')) {
          child.rotation.y *= 0.9;
        }

        // Restore original positions
        const origPos = this.originalPositions.get(child.name);
        if (origPos && child.name.includes('leg')) {
          child.position.y = BABYLON.Scalar.Lerp(child.position.y, origPos.y, 0.1);
        }
      });
    }
  }

  updateSlime(deltaTime) {
    if (!this.mesh.getChildMeshes) return;

    const children = this.mesh.getChildMeshes();
    const body = children.find(c => c.name.includes('body'));

    if (!body) return;

    const origScale = this.originalScales.get(body.name);
    if (!origScale) return;

    if (this.isMoving) {
      // Slime bounces when moving
      const bounce = Math.abs(Math.sin(this.time * this.bobSpeed * this.moveSpeed));

      // Squash and stretch
      body.scaling.y = origScale.y * (0.7 + bounce * 0.5);
      body.scaling.x = origScale.x * (1.15 - bounce * 0.25);
      body.scaling.z = origScale.z * (1.15 - bounce * 0.25);

      // Hop up and down
      this.mesh.position.y = bounce * 0.3;

      // Eyes blink during jump
      children.forEach(child => {
        if (child.name.includes('eye')) {
          const blink = bounce > 0.8 ? 0.5 : 1;
          const origEyeScale = this.originalScales.get(child.name);
          if (origEyeScale) {
            child.scaling.y = origEyeScale.y * blink;
          }
        }
      });
    } else {
      // Idle breathing (slime jiggles)
      const jiggle = Math.sin(this.time * this.breatheSpeed * 2);

      body.scaling.y = origScale.y * (1 + jiggle * 0.05);
      body.scaling.x = origScale.x * (1 - jiggle * 0.03);
      body.scaling.z = origScale.z * (1 - jiggle * 0.03);

      this.mesh.position.y = Math.abs(jiggle) * 0.02;

      // Eyes blink occasionally
      const blinkTime = Math.sin(this.time * 3);
      children.forEach(child => {
        if (child.name.includes('eye')) {
          const blink = blinkTime > 2.9 ? 0.3 : 1;
          const origEyeScale = this.originalScales.get(child.name);
          if (origEyeScale) {
            child.scaling.y = origEyeScale.y * blink;
          }
        }
      });
    }
  }

  updateWolf(deltaTime) {
    if (!this.mesh.getChildMeshes) return;

    const children = this.mesh.getChildMeshes();

    if (this.isMoving) {
      // Quadruped gallop
      const gallopCycle = Math.sin(this.time * this.bobSpeed * 1.5 * this.moveSpeed);

      // Body bob
      this.mesh.position.y = Math.abs(gallopCycle) * 0.1;

      // Animate legs in pairs
      children.forEach(child => {
        if (child.name.includes('leg_0') || child.name.includes('leg_1')) {
          // Front legs move together
          child.rotation.x = gallopCycle * 0.4;
        } else if (child.name.includes('leg_2') || child.name.includes('leg_3')) {
          // Back legs move together, opposite phase
          child.rotation.x = -gallopCycle * 0.4;
        } else if (child.name.includes('head')) {
          // Head nods slightly
          child.rotation.x = -gallopCycle * 0.1;
        } else if (child.name.includes('body')) {
          // Body tilts forward slightly when running
          child.rotation.x = -0.1;
        }
      });
    } else {
      // Idle panting
      const pant = Math.sin(this.time * 4);

      this.mesh.position.y = 0;

      children.forEach(child => {
        if (child.name.includes('leg')) {
          child.rotation.x *= 0.9;
        } else if (child.name.includes('head')) {
          child.rotation.x = pant * 0.05;
        } else if (child.name.includes('body')) {
          child.rotation.x *= 0.9;
        }
      });
    }
  }

  updateOrc(deltaTime) {
    // Orc moves like humanoid but more aggressive
    if (!this.mesh.getChildMeshes) return;

    const children = this.mesh.getChildMeshes();

    if (this.isMoving) {
      // Heavy stomping walk
      const stompCycle = Math.sin(this.time * this.bobSpeed * 0.8 * this.moveSpeed);
      const stepCycle = Math.sin(this.time * this.bobSpeed * 1.6 * this.moveSpeed);

      // Heavy bob
      this.mesh.position.y = Math.abs(stompCycle) * 0.2;

      children.forEach(child => {
        const origPos = this.originalPositions.get(child.name);
        if (!origPos) return;

        if (child.name.includes('arm_l')) {
          // Arms swing more aggressively
          child.rotation.x = -stepCycle * 0.5;
          child.rotation.z = Math.abs(stompCycle) * 0.1;
        } else if (child.name.includes('arm_r')) {
          child.rotation.x = stepCycle * 0.5;
          child.rotation.z = -Math.abs(stompCycle) * 0.1;
        } else if (child.name.includes('body')) {
          // Body sways side to side
          child.rotation.z = stompCycle * 0.08;
        } else if (child.name.includes('head')) {
          // Head moves opposite to body
          child.rotation.z = -stompCycle * 0.05;
        }
      });
    } else {
      // Idle breathing (heavier than normal humanoid)
      const breathe = Math.sin(this.time * this.breatheSpeed * 1.5);

      this.mesh.position.y = Math.abs(breathe) * 0.05;

      children.forEach(child => {
        if (child.name.includes('arm')) {
          child.rotation.x *= 0.95;
          child.rotation.z *= 0.95;
        }
        if (child.name.includes('body')) {
          child.rotation.z = breathe * 0.02;
        }
        if (child.name.includes('head')) {
          child.rotation.z *= 0.95;
        }
      });
    }
  }

  // Attack animation
  playAttackAnimation() {
    if (!this.mesh.getChildMeshes) return;

    const children = this.mesh.getChildMeshes();
    const armRight = children.find(c => c.name.includes('arm_r'));

    if (armRight) {
      // Quick swing animation
      const originalRotation = armRight.rotation.clone();

      // Wind up
      BABYLON.Animation.CreateAndStartAnimation(
        'attackWindup',
        armRight,
        'rotation.x',
        60,
        5,
        originalRotation.x,
        originalRotation.x - 1,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        null,
        () => {
          // Strike
          BABYLON.Animation.CreateAndStartAnimation(
            'attackStrike',
            armRight,
            'rotation.x',
            60,
            10,
            armRight.rotation.x,
            originalRotation.x + 0.5,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            null,
            () => {
              // Return
              BABYLON.Animation.CreateAndStartAnimation(
                'attackReturn',
                armRight,
                'rotation.x',
                60,
                10,
                armRight.rotation.x,
                originalRotation.x,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
              );
            }
          );
        }
      );
    }
  }

  // Hit reaction animation
  playHitReaction() {
    const originalPos = this.mesh.position.clone();

    // Quick knockback
    BABYLON.Animation.CreateAndStartAnimation(
      'hitReaction',
      this.mesh,
      'position.y',
      60,
      5,
      originalPos.y,
      originalPos.y + 0.2,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
      null,
      () => {
        BABYLON.Animation.CreateAndStartAnimation(
          'hitReturn',
          this.mesh,
          'position.y',
          60,
          10,
          this.mesh.position.y,
          originalPos.y,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
      }
    );
  }
}
