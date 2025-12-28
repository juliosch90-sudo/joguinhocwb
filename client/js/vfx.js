// Visual Effects System for Combat
// Optimized particle systems and impact effects

class VFXManager {
  constructor(scene) {
    this.scene = scene;
    this.activeEffects = new Map();
  }

  // Attack impact effect
  createAttackImpact(position, color = new BABYLON.Color3(1, 0.5, 0)) {
    // Create particle system for impact
    const particleSystem = new BABYLON.ParticleSystem('impact', 30, this.scene);

    // Particle texture (simple dot)
    particleSystem.particleTexture = new BABYLON.Texture('https://www.babylonjs-playground.com/textures/flare.png', this.scene);

    // Emission
    particleSystem.emitter = position.clone();
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, 0, -0.1);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.2, 0.1);

    // Colors
    particleSystem.color1 = new BABYLON.Color4(color.r, color.g, color.b, 1);
    particleSystem.color2 = new BABYLON.Color4(color.r * 0.5, color.g * 0.5, color.b * 0.5, 0.5);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);

    // Size
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;

    // Life time
    particleSystem.minLifeTime = 0.2;
    particleSystem.maxLifeTime = 0.4;

    // Emission rate
    particleSystem.emitRate = 100;

    // Blend mode
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    // Speed
    particleSystem.minEmitPower = 2;
    particleSystem.maxEmitPower = 4;
    particleSystem.updateSpeed = 0.01;

    // Direction
    particleSystem.direction1 = new BABYLON.Vector3(-0.5, 0.5, -0.5);
    particleSystem.direction2 = new BABYLON.Vector3(0.5, 1, 0.5);

    // Gravity
    particleSystem.gravity = new BABYLON.Vector3(0, -5, 0);

    // Start and dispose after burst
    particleSystem.start();

    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 500);
    }, 100);

    return particleSystem;
  }

  // Slash effect for melee attacks
  createSlashEffect(position, direction) {
    const slash = BABYLON.MeshBuilder.CreatePlane('slash', {
      width: 1.5,
      height: 0.3
    }, this.scene);

    slash.position = position.clone();
    slash.position.y += 1;

    // Orient towards direction
    const angle = Math.atan2(direction.x, direction.z);
    slash.rotation.y = angle;

    // Material with emissive glow
    const material = new BABYLON.StandardMaterial('slashMat', this.scene);
    material.emissiveColor = new BABYLON.Color3(1, 1, 0.5);
    material.diffuseColor = new BABYLON.Color3(1, 0.8, 0);
    material.alpha = 0.8;
    slash.material = material;

    // Animate slash
    const animation = new BABYLON.Animation(
      'slashAnim',
      'scaling',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: new BABYLON.Vector3(0.1, 1, 1) },
      { frame: 10, value: new BABYLON.Vector3(1.5, 1, 1) },
      { frame: 20, value: new BABYLON.Vector3(0.1, 1, 1) }
    ];

    animation.setKeys(keys);
    slash.animations.push(animation);

    this.scene.beginAnimation(slash, 0, 20, false, 3, () => {
      slash.dispose();
    });

    return slash;
  }

  // Hit flash effect on entity
  createHitFlash(mesh) {
    if (!mesh) return;

    const originalMaterials = new Map();

    // Store original materials and apply white flash
    if (mesh.getChildMeshes) {
      mesh.getChildMeshes().forEach(child => {
        if (child.material) {
          originalMaterials.set(child, child.material);

          const flashMat = new BABYLON.StandardMaterial('flash', this.scene);
          flashMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
          flashMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
          child.material = flashMat;
        }
      });
    } else if (mesh.material) {
      originalMaterials.set(mesh, mesh.material);

      const flashMat = new BABYLON.StandardMaterial('flash', this.scene);
      flashMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
      flashMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
      mesh.material = flashMat;
    }

    // Restore original materials after delay
    setTimeout(() => {
      originalMaterials.forEach((material, m) => {
        if (m && !m.isDisposed()) {
          m.material = material;
        }
      });
    }, 100);
  }

  // Critical hit effect (larger, golden)
  createCriticalHit(position) {
    // Burst of golden particles
    const particleSystem = new BABYLON.ParticleSystem('critical', 50, this.scene);
    particleSystem.particleTexture = new BABYLON.Texture('https://www.babylonjs-playground.com/textures/flare.png', this.scene);

    particleSystem.emitter = position.clone();
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.2, 0, -0.2);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0.3, 0.2);

    // Golden colors
    particleSystem.color1 = new BABYLON.Color4(1, 0.8, 0, 1);
    particleSystem.color2 = new BABYLON.Color4(1, 1, 0.3, 1);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);

    particleSystem.minSize = 0.2;
    particleSystem.maxSize = 0.5;

    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 0.6;

    particleSystem.emitRate = 200;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    particleSystem.minEmitPower = 3;
    particleSystem.maxEmitPower = 6;
    particleSystem.updateSpeed = 0.01;

    particleSystem.direction1 = new BABYLON.Vector3(-1, 0.5, -1);
    particleSystem.direction2 = new BABYLON.Vector3(1, 2, 1);

    particleSystem.gravity = new BABYLON.Vector3(0, -3, 0);

    particleSystem.start();

    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 600);
    }, 150);

    return particleSystem;
  }

  // Heal effect (green upward particles)
  createHealEffect(position) {
    const particleSystem = new BABYLON.ParticleSystem('heal', 40, this.scene);
    particleSystem.particleTexture = new BABYLON.Texture('https://www.babylonjs-playground.com/textures/flare.png', this.scene);

    particleSystem.emitter = position.clone();
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.3, 0, -0.3);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.3, 0.1, 0.3);

    // Green healing colors
    particleSystem.color1 = new BABYLON.Color4(0, 1, 0.3, 1);
    particleSystem.color2 = new BABYLON.Color4(0.3, 1, 0.5, 1);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);

    particleSystem.minSize = 0.15;
    particleSystem.maxSize = 0.3;

    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 1.0;

    particleSystem.emitRate = 60;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 2;
    particleSystem.updateSpeed = 0.01;

    // Upward direction
    particleSystem.direction1 = new BABYLON.Vector3(-0.2, 1, -0.2);
    particleSystem.direction2 = new BABYLON.Vector3(0.2, 2, 0.2);

    particleSystem.gravity = new BABYLON.Vector3(0, -1, 0);

    particleSystem.start();

    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 1000);
    }, 500);

    return particleSystem;
  }

  // Skill cast effect (swirling particles around caster)
  createCastEffect(position, color = new BABYLON.Color3(0.5, 0.5, 1)) {
    const particleSystem = new BABYLON.ParticleSystem('cast', 30, this.scene);
    particleSystem.particleTexture = new BABYLON.Texture('https://www.babylonjs-playground.com/textures/flare.png', this.scene);

    particleSystem.emitter = position.clone();
    particleSystem.createSphereEmitter(1);

    particleSystem.color1 = new BABYLON.Color4(color.r, color.g, color.b, 1);
    particleSystem.color2 = new BABYLON.Color4(color.r * 1.2, color.g * 1.2, color.b * 1.2, 0.8);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.2;

    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 0.6;

    particleSystem.emitRate = 50;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    particleSystem.minEmitPower = 0.5;
    particleSystem.maxEmitPower = 1;
    particleSystem.updateSpeed = 0.01;

    particleSystem.start();

    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 600);
    }, 400);

    return particleSystem;
  }

  // Death explosion effect
  createDeathEffect(position) {
    // Large explosion of particles
    const particleSystem = new BABYLON.ParticleSystem('death', 100, this.scene);
    particleSystem.particleTexture = new BABYLON.Texture('https://www.babylonjs-playground.com/textures/flare.png', this.scene);

    particleSystem.emitter = position.clone();
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, 0, -0.1);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);

    // Mix of red and dark particles
    particleSystem.color1 = new BABYLON.Color4(1, 0.2, 0, 1);
    particleSystem.color2 = new BABYLON.Color4(0.5, 0.1, 0.1, 1);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);

    particleSystem.minSize = 0.2;
    particleSystem.maxSize = 0.6;

    particleSystem.minLifeTime = 0.4;
    particleSystem.maxLifeTime = 0.8;

    particleSystem.emitRate = 300;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    particleSystem.minEmitPower = 4;
    particleSystem.maxEmitPower = 8;
    particleSystem.updateSpeed = 0.01;

    particleSystem.direction1 = new BABYLON.Vector3(-1, 0, -1);
    particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);

    particleSystem.gravity = new BABYLON.Vector3(0, -5, 0);

    particleSystem.start();

    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 800);
    }, 200);

    return particleSystem;
  }
}
