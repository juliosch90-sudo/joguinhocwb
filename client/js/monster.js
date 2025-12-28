class MonsterRenderer {
  constructor(scene, monsterData) {
    this.scene = scene;
    this.data = monsterData;
    this.id = monsterData.id;
    this.mesh = null;
    this.nameTag = null;
    this.healthBar = null;

    this.createMesh();
  }

  createMesh() {
    // Different shapes based on monster name
    let mesh;
    const name = this.data.name.toLowerCase();

    if (name.includes('slime')) {
      mesh = BABYLON.MeshBuilder.CreateSphere(`monster_${this.id}`, {
        diameter: 1.5,
        segments: 8
      }, this.scene);

      const material = new BABYLON.StandardMaterial(`monsterMat_${this.id}`, this.scene);
      material.diffuseColor = new BABYLON.Color3(0, 1, 0.5);
      material.emissiveColor = new BABYLON.Color3(0, 0.2, 0.1);
      mesh.material = material;

    } else if (name.includes('wolf')) {
      mesh = BABYLON.MeshBuilder.CreateBox(`monster_${this.id}`, {
        width: 1.2,
        height: 1,
        depth: 1.8
      }, this.scene);

      const material = new BABYLON.StandardMaterial(`monsterMat_${this.id}`, this.scene);
      material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
      material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
      mesh.material = material;

    } else if (name.includes('orc')) {
      mesh = BABYLON.MeshBuilder.CreateCylinder(`monster_${this.id}`, {
        height: 2.5,
        diameter: 1.5
      }, this.scene);

      const material = new BABYLON.StandardMaterial(`monsterMat_${this.id}`, this.scene);
      material.diffuseColor = new BABYLON.Color3(0, 0.6, 0);
      material.emissiveColor = new BABYLON.Color3(0, 0.1, 0);
      mesh.material = material;

    } else {
      mesh = BABYLON.MeshBuilder.CreateBox(`monster_${this.id}`, {
        size: 1.5
      }, this.scene);

      const material = new BABYLON.StandardMaterial(`monsterMat_${this.id}`, this.scene);
      material.diffuseColor = new BABYLON.Color3(1, 0, 0);
      mesh.material = material;
    }

    mesh.position.x = this.data.position.x;
    mesh.position.y = 1;
    mesh.position.z = this.data.position.z;

    // Store monster reference on mesh for click detection
    mesh.monster = this;

    this.mesh = mesh;
    this.createNameTag();
    this.createHealthBar();
  }

  createNameTag() {
    const plane = BABYLON.MeshBuilder.CreatePlane(`monsterName_${this.id}`, {
      width: 2,
      height: 0.4
    }, this.scene);

    plane.position.y = 2;
    plane.parent = this.mesh;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const texture = new BABYLON.DynamicTexture(`monsterNameTex_${this.id}`, {
      width: 256,
      height: 64
    }, this.scene);

    const material = new BABYLON.StandardMaterial(`monsterNameMat_${this.id}`, this.scene);
    material.diffuseTexture = texture;
    material.emissiveTexture = texture;
    material.opacityTexture = texture;
    plane.material = material;

    const ctx = texture.getContext();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.data.name} Lv.${this.data.level}`, 128, 40);
    texture.update();

    this.nameTag = plane;
  }

  createHealthBar() {
    // Background
    const bgPlane = BABYLON.MeshBuilder.CreatePlane(`hpBg_${this.id}`, {
      width: 1.5,
      height: 0.2
    }, this.scene);

    bgPlane.position.y = 1.7;
    bgPlane.parent = this.mesh;
    bgPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const bgMaterial = new BABYLON.StandardMaterial(`hpBgMat_${this.id}`, this.scene);
    bgMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    bgMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    bgPlane.material = bgMaterial;

    // Health bar
    const hpPlane = BABYLON.MeshBuilder.CreatePlane(`hpBar_${this.id}`, {
      width: 1.4,
      height: 0.15
    }, this.scene);

    hpPlane.position.y = 1.7;
    hpPlane.position.z = -0.01;
    hpPlane.parent = this.mesh;
    hpPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const hpMaterial = new BABYLON.StandardMaterial(`hpBarMat_${this.id}`, this.scene);
    hpMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
    hpMaterial.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
    hpPlane.material = hpMaterial;

    this.healthBar = {
      bg: bgPlane,
      bar: hpPlane,
      maxWidth: 1.4
    };
  }

  update(data) {
    this.data = { ...this.data, ...data };

    if (this.mesh && data.position) {
      // Smooth movement
      BABYLON.Animation.CreateAndStartAnimation(
        'monsterMove',
        this.mesh,
        'position',
        60,
        5,
        this.mesh.position.clone(),
        new BABYLON.Vector3(data.position.x, 1, data.position.z),
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
    }

    // Update health bar
    if (this.healthBar && data.hp !== undefined) {
      const hpPercentage = data.hp / data.maxHp;
      this.healthBar.bar.scaling.x = hpPercentage;
      this.healthBar.bar.position.x = -(this.healthBar.maxWidth / 2) * (1 - hpPercentage);

      // Change color based on HP
      if (hpPercentage > 0.5) {
        this.healthBar.bar.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
      } else if (hpPercentage > 0.25) {
        this.healthBar.bar.material.diffuseColor = new BABYLON.Color3(1, 1, 0);
      } else {
        this.healthBar.bar.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
      }
    }
  }

  destroy() {
    if (this.mesh) {
      this.mesh.dispose();
    }
    if (this.nameTag) {
      this.nameTag.dispose();
    }
    if (this.healthBar) {
      this.healthBar.bg.dispose();
      this.healthBar.bar.dispose();
    }
  }
}
