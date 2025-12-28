class HUD {
  constructor() {
    this.elements = {
      charName: document.getElementById('char-name'),
      charLevel: document.getElementById('char-level'),
      hpBar: document.getElementById('hp-bar'),
      hpText: document.getElementById('hp-text'),
      mpBar: document.getElementById('mp-bar'),
      mpText: document.getElementById('mp-text'),
      xpBar: document.getElementById('xp-bar'),
      xpText: document.getElementById('xp-text'),
      charAttack: document.getElementById('char-attack'),
      charDefense: document.getElementById('char-defense'),
      targetInfo: document.getElementById('target-info'),
      targetName: document.getElementById('target-name'),
      targetLevel: document.getElementById('target-level'),
      targetHpBar: document.getElementById('target-hp-bar'),
      targetHpText: document.getElementById('target-hp-text'),
      chatMessages: document.getElementById('chat-messages'),
      chatInput: document.getElementById('chat-input'),
      damageNumbers: document.getElementById('damage-numbers')
    };

    this.skills = [1, 2, 3, 4].map(i => ({
      element: document.getElementById(`skill-${i}`),
      cooldown: 0
    }));

    this.initMinimap();
    this.initChat();
  }

  initMinimap() {
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');
  }

  initChat() {
    this.elements.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && this.elements.chatInput.value.trim()) {
        if (window.game && window.game.network) {
          window.game.network.chat(this.elements.chatInput.value);
          this.elements.chatInput.value = '';
        }
      }
    });
  }

  updatePlayerStats(player) {
    this.elements.charName.textContent = player.name;
    this.elements.charLevel.textContent = player.level;
    this.elements.charAttack.textContent = player.attack;
    this.elements.charDefense.textContent = player.defense;

    this.updateBar(this.elements.hpBar, this.elements.hpText, player.hp, player.maxHp);
    this.updateBar(this.elements.mpBar, this.elements.mpText, player.mp, player.maxMp);

    const xpNeeded = player.level * 100;
    this.updateBar(this.elements.xpBar, this.elements.xpText, player.experience, xpNeeded);
  }

  updateBar(barElement, textElement, current, max) {
    const percentage = (current / max) * 100;
    barElement.style.width = percentage + '%';
    textElement.textContent = `${Math.floor(current)}/${max}`;
  }

  showTarget(target) {
    this.elements.targetInfo.style.display = 'block';
    this.elements.targetName.textContent = target.name;
    this.elements.targetLevel.textContent = target.level;
    this.updateBar(this.elements.targetHpBar, this.elements.targetHpText, target.hp, target.maxHp);
  }

  hideTarget() {
    this.elements.targetInfo.style.display = 'none';
  }

  addChatMessage(playerName, message, isSystem = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message' + (isSystem ? ' system' : '');

    if (isSystem) {
      msgDiv.textContent = message;
    } else {
      msgDiv.innerHTML = `<span class="player-name">${playerName}:</span> ${message}`;
    }

    this.elements.chatMessages.appendChild(msgDiv);
    this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
  }

  showDamageNumber(damage, position, isHeal = false) {
    const damageDiv = document.createElement('div');
    damageDiv.className = 'damage-number ' + (isHeal ? 'heal' : 'player-damage');
    damageDiv.textContent = (isHeal ? '+' : '-') + damage;
    damageDiv.style.left = position.x + 'px';
    damageDiv.style.top = position.y + 'px';

    this.elements.damageNumbers.appendChild(damageDiv);

    setTimeout(() => {
      damageDiv.remove();
    }, 1000);
  }

  setSkillCooldown(skillId, cooldown) {
    const skill = this.skills[skillId - 1];
    if (!skill) return;

    skill.cooldown = cooldown;
    skill.element.classList.add('on-cooldown');

    const cooldownDisplay = skill.element.querySelector('.skill-cooldown');
    if (cooldownDisplay) {
      cooldownDisplay.style.display = 'flex';
      this.updateSkillCooldown(skillId);
    }
  }

  updateSkillCooldown(skillId) {
    const skill = this.skills[skillId - 1];
    if (!skill || skill.cooldown <= 0) return;

    const cooldownDisplay = skill.element.querySelector('.skill-cooldown');
    const remaining = Math.ceil(skill.cooldown / 1000);

    if (remaining > 0) {
      cooldownDisplay.textContent = remaining;
      setTimeout(() => this.updateSkillCooldown(skillId), 100);
    } else {
      cooldownDisplay.style.display = 'none';
      skill.element.classList.remove('on-cooldown');
    }

    skill.cooldown -= 100;
  }

  updateMinimap(playerPos, otherPlayers, monsters, mapSize) {
    const ctx = this.minimapCtx;
    const canvas = this.minimapCanvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const pos = (i / 10) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(canvas.width, pos);
      ctx.stroke();
    }

    const scale = canvas.width / mapSize;

    // Draw monsters
    ctx.fillStyle = '#e74c3c';
    for (const monster of monsters) {
      const x = (monster.position.x + mapSize / 2) * scale;
      const z = (monster.position.z + mapSize / 2) * scale;
      ctx.beginPath();
      ctx.arc(x, z, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw other players
    ctx.fillStyle = '#3498db';
    for (const player of otherPlayers) {
      const x = (player.position.x + mapSize / 2) * scale;
      const z = (player.position.z + mapSize / 2) * scale;
      ctx.beginPath();
      ctx.arc(x, z, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw local player
    ctx.fillStyle = '#2ecc71';
    const px = (playerPos.x + mapSize / 2) * scale;
    const pz = (playerPos.z + mapSize / 2) * scale;
    ctx.beginPath();
    ctx.arc(px, pz, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
