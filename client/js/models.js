// Procedural 3D model creation for characters and props
// Low-poly, optimized for WebGL performance

class ModelFactory {
  constructor(scene) {
    this.scene = scene;
    this.materialCache = new Map();
  }

  // Create a stylized low-poly player character
  createPlayerCharacter(name, colorScheme = 'warrior') {
    const character = new BABYLON.TransformNode(`character_${name}`, this.scene);

    // Color schemes for different classes
    const schemes = {
      warrior: { primary: new BABYLON.Color3(0.8, 0.2, 0.2), secondary: new BABYLON.Color3(0.3, 0.3, 0.3) },
      mage: { primary: new BABYLON.Color3(0.2, 0.4, 0.9), secondary: new BABYLON.Color3(0.6, 0.3, 0.8) },
      archer: { primary: new BABYLON.Color3(0.2, 0.7, 0.3), secondary: new BABYLON.Color3(0.5, 0.3, 0.2) }
    };

    const colors = schemes[colorScheme] || schemes.warrior;

    // Body (torso) - slightly wider at shoulders
    const body = BABYLON.MeshBuilder.CreateCylinder(`${name}_body`, {
      height: 0.8,
      diameterTop: 0.5,
      diameterBottom: 0.4,
      tessellation: 8
    }, this.scene);
    body.position.y = 1.2;
    body.parent = character;

    // Head - octagonal for style
    const head = BABYLON.MeshBuilder.CreateSphere(`${name}_head`, {
      diameter: 0.4,
      segments: 8
    }, this.scene);
    head.position.y = 1.8;
    head.parent = character;

    // Legs
    const legHeight = 0.9;
    const legRadius = 0.12;

    const leftLeg = BABYLON.MeshBuilder.CreateCylinder(`${name}_leg_l`, {
      height: legHeight,
      diameter: legRadius * 2,
      tessellation: 6
    }, this.scene);
    leftLeg.position.set(-0.15, 0.45, 0);
    leftLeg.parent = character;

    const rightLeg = BABYLON.MeshBuilder.CreateCylinder(`${name}_leg_r`, {
      height: legHeight,
      diameter: legRadius * 2,
      tessellation: 6
    }, this.scene);
    rightLeg.position.set(0.15, 0.45, 0);
    rightLeg.parent = character;

    // Arms
    const armLength = 0.7;
    const armRadius = 0.1;

    const leftArm = BABYLON.MeshBuilder.CreateCylinder(`${name}_arm_l`, {
      height: armLength,
      diameter: armRadius * 2,
      tessellation: 6
    }, this.scene);
    leftArm.position.set(-0.35, 1.2, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.parent = character;

    const rightArm = BABYLON.MeshBuilder.CreateCylinder(`${name}_arm_r`, {
      height: armLength,
      diameter: armRadius * 2,
      tessellation: 6
    }, this.scene);
    rightArm.position.set(0.35, 1.2, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.parent = character;

    // Shoulder pads (armor detail)
    const leftShoulder = BABYLON.MeshBuilder.CreateBox(`${name}_shoulder_l`, {
      width: 0.25,
      height: 0.15,
      depth: 0.25
    }, this.scene);
    leftShoulder.position.set(-0.35, 1.5, 0);
    leftShoulder.parent = character;

    const rightShoulder = BABYLON.MeshBuilder.CreateBox(`${name}_shoulder_r`, {
      width: 0.25,
      height: 0.15,
      depth: 0.25
    }, this.scene);
    rightShoulder.position.set(0.35, 1.5, 0);
    rightShoulder.parent = character;

    // Apply materials
    const bodyMat = this.getOrCreateMaterial('player_body', colors.primary, 0.3);
    body.material = bodyMat;
    leftLeg.material = bodyMat;
    rightLeg.material = bodyMat;

    const armorMat = this.getOrCreateMaterial('player_armor', colors.secondary, 0.5);
    leftShoulder.material = armorMat;
    rightShoulder.material = armorMat;

    const limbMat = this.getOrCreateMaterial('player_limbs', colors.primary.scale(0.8), 0.2);
    leftArm.material = limbMat;
    rightArm.material = limbMat;

    const headMat = this.getOrCreateMaterial('player_head', new BABYLON.Color3(0.9, 0.7, 0.6), 0.1);
    head.material = headMat;

    return character;
  }

  // Create a stylized monster
  createMonster(name, monsterType = 'slime') {
    const monster = new BABYLON.TransformNode(`monster_${name}`, this.scene);

    if (monsterType === 'slime') {
      return this.createSlimeMonster(monster, name);
    } else if (monsterType === 'wolf') {
      return this.createWolfMonster(monster, name);
    } else if (monsterType === 'orc') {
      return this.createOrcMonster(monster, name);
    }

    return monster;
  }

  createSlimeMonster(parent, name) {
    // Cute slime with squash-stretch shape
    const body = BABYLON.MeshBuilder.CreateSphere(`${name}_body`, {
      diameter: 0.8,
      segments: 12
    }, this.scene);
    body.scaling.y = 0.7; // Squash it a bit
    body.position.y = 0.3;
    body.parent = parent;

    // Eyes
    const leftEye = BABYLON.MeshBuilder.CreateSphere(`${name}_eye_l`, {
      diameter: 0.15,
      segments: 8
    }, this.scene);
    leftEye.position.set(-0.15, 0.4, 0.35);
    leftEye.parent = parent;

    const rightEye = BABYLON.MeshBuilder.CreateSphere(`${name}_eye_r`, {
      diameter: 0.15,
      segments: 8
    }, this.scene);
    rightEye.position.set(0.15, 0.4, 0.35);
    rightEye.parent = parent;

    // Materials
    const slimeMat = this.getOrCreateMaterial('slime', new BABYLON.Color3(0.3, 0.8, 0.3), 0.7);
    body.material = slimeMat;

    const eyeMat = this.getOrCreateMaterial('monster_eye', new BABYLON.Color3(0.1, 0.1, 0.1), 0.0);
    leftEye.material = eyeMat;
    rightEye.material = eyeMat;

    return parent;
  }

  createWolfMonster(parent, name) {
    // Wolf-like creature
    const body = BABYLON.MeshBuilder.CreateBox(`${name}_body`, {
      width: 0.4,
      height: 0.4,
      depth: 0.8
    }, this.scene);
    body.position.y = 0.5;
    body.parent = parent;

    const head = BABYLON.MeshBuilder.CreateBox(`${name}_head`, {
      width: 0.3,
      height: 0.3,
      depth: 0.4
    }, this.scene);
    head.position.set(0, 0.6, 0.5);
    head.parent = parent;

    // Ears
    const leftEar = BABYLON.MeshBuilder.CreateCylinder(`${name}_ear_l`, {
      height: 0.2,
      diameter: 0.1,
      tessellation: 4
    }, this.scene);
    leftEar.position.set(-0.12, 0.8, 0.5);
    leftEar.parent = parent;

    const rightEar = BABYLON.MeshBuilder.CreateCylinder(`${name}_ear_r`, {
      height: 0.2,
      diameter: 0.1,
      tessellation: 4
    }, this.scene);
    rightEar.position.set(0.12, 0.8, 0.5);
    rightEar.parent = parent;

    // Legs
    const legPositions = [
      [-0.15, 0.15, 0.3],
      [0.15, 0.15, 0.3],
      [-0.15, 0.15, -0.3],
      [0.15, 0.15, -0.3]
    ];

    legPositions.forEach((pos, i) => {
      const leg = BABYLON.MeshBuilder.CreateCylinder(`${name}_leg_${i}`, {
        height: 0.3,
        diameter: 0.1,
        tessellation: 6
      }, this.scene);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.parent = parent;
    });

    const wolfMat = this.getOrCreateMaterial('wolf', new BABYLON.Color3(0.4, 0.3, 0.25), 0.3);
    parent.getChildMeshes().forEach(mesh => mesh.material = wolfMat);

    return parent;
  }

  createOrcMonster(parent, name) {
    // Orc - bulky humanoid
    const body = BABYLON.MeshBuilder.CreateCylinder(`${name}_body`, {
      height: 1.0,
      diameterTop: 0.6,
      diameterBottom: 0.5,
      tessellation: 8
    }, this.scene);
    body.position.y = 1.0;
    body.parent = parent;

    const head = BABYLON.MeshBuilder.CreateBox(`${name}_head`, {
      size: 0.5
    }, this.scene);
    head.position.y = 1.7;
    head.parent = parent;

    // Tusks
    const leftTusk = BABYLON.MeshBuilder.CreateCylinder(`${name}_tusk_l`, {
      height: 0.2,
      diameter: 0.05,
      tessellation: 4
    }, this.scene);
    leftTusk.position.set(-0.15, 1.5, 0.25);
    leftTusk.rotation.x = -Math.PI / 4;
    leftTusk.parent = parent;

    const rightTusk = BABYLON.MeshBuilder.CreateCylinder(`${name}_tusk_r`, {
      height: 0.2,
      diameter: 0.05,
      tessellation: 4
    }, this.scene);
    rightTusk.position.set(0.15, 1.5, 0.25);
    rightTusk.rotation.x = -Math.PI / 4;
    rightTusk.parent = parent;

    // Arms (bigger than player)
    const leftArm = BABYLON.MeshBuilder.CreateCylinder(`${name}_arm_l`, {
      height: 0.8,
      diameter: 0.15,
      tessellation: 6
    }, this.scene);
    leftArm.position.set(-0.4, 1.0, 0);
    leftArm.rotation.z = Math.PI / 5;
    leftArm.parent = parent;

    const rightArm = BABYLON.MeshBuilder.CreateCylinder(`${name}_arm_r`, {
      height: 0.8,
      diameter: 0.15,
      tessellation: 6
    }, this.scene);
    rightArm.position.set(0.4, 1.0, 0);
    rightArm.rotation.z = -Math.PI / 5;
    rightArm.parent = parent;

    const orcMat = this.getOrCreateMaterial('orc', new BABYLON.Color3(0.3, 0.5, 0.2), 0.4);
    parent.getChildMeshes().forEach(mesh => {
      if (!mesh.name.includes('tusk')) {
        mesh.material = orcMat;
      }
    });

    const tuskMat = this.getOrCreateMaterial('tusk', new BABYLON.Color3(0.9, 0.9, 0.8), 0.2);
    leftTusk.material = tuskMat;
    rightTusk.material = tuskMat;

    return parent;
  }

  // Optimized material system with caching
  getOrCreateMaterial(name, color, metallic = 0.0) {
    const cacheKey = `${name}_${color.r}_${color.g}_${color.b}_${metallic}`;

    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey);
    }

    const material = new BABYLON.StandardMaterial(cacheKey, this.scene);
    material.diffuseColor = color;
    material.specularColor = new BABYLON.Color3(metallic, metallic, metallic);
    material.specularPower = 32;

    // Add subtle emissive for fantasy feel
    if (metallic > 0.3) {
      material.emissiveColor = color.scale(0.1);
    }

    this.materialCache.set(cacheKey, material);
    return material;
  }

  // Create environment props
  createTree(height = 3) {
    const tree = new BABYLON.TransformNode('tree', this.scene);

    // Trunk
    const trunk = BABYLON.MeshBuilder.CreateCylinder('trunk', {
      height: height * 0.6,
      diameter: height * 0.1,
      tessellation: 8
    }, this.scene);
    trunk.position.y = height * 0.3;
    trunk.parent = tree;

    // Foliage (simple cone)
    const foliage = BABYLON.MeshBuilder.CreateCylinder('foliage', {
      height: height * 0.5,
      diameterTop: 0,
      diameterBottom: height * 0.4,
      tessellation: 8
    }, this.scene);
    foliage.position.y = height * 0.8;
    foliage.parent = tree;

    const trunkMat = this.getOrCreateMaterial('tree_trunk', new BABYLON.Color3(0.3, 0.2, 0.1), 0.0);
    trunk.material = trunkMat;

    const foliageMat = this.getOrCreateMaterial('tree_foliage', new BABYLON.Color3(0.2, 0.5, 0.2), 0.0);
    foliage.material = foliageMat;

    return tree;
  }

  createRock(size = 1) {
    const rock = BABYLON.MeshBuilder.CreatePolyhedron('rock', {
      type: 1, // Icosahedron
      size: size
    }, this.scene);

    // Randomize shape slightly
    const positions = rock.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    for (let i = 0; i < positions.length; i += 3) {
      const randomFactor = 0.8 + Math.random() * 0.4;
      positions[i] *= randomFactor;
      positions[i + 1] *= randomFactor;
      positions[i + 2] *= randomFactor;
    }
    rock.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);

    const rockMat = this.getOrCreateMaterial('rock', new BABYLON.Color3(0.4, 0.4, 0.4), 0.1);
    rock.material = rockMat;

    return rock;
  }
}
