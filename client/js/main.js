// Main entry point
let game = null;

window.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('login-screen');
  const gameScreen = document.getElementById('game-screen');
  const loadingScreen = document.getElementById('loading-screen');
  const joinBtn = document.getElementById('join-btn');
  const characterNameInput = document.getElementById('character-name');

  joinBtn.addEventListener('click', async () => {
    const characterName = characterNameInput.value.trim();

    if (!characterName || characterName.length < 3) {
      alert('Please enter a character name (min 3 characters)');
      return;
    }

    // Show loading screen
    loginScreen.classList.remove('active');
    loadingScreen.classList.add('active');

    // Initialize game
    game = new Game();
    window.game = game; // Make accessible globally for debugging

    const success = await game.init(characterName);

    if (success) {
      // Show game screen
      loadingScreen.classList.remove('active');
      gameScreen.classList.add('active');
    } else {
      // Show login screen again
      loadingScreen.classList.remove('active');
      loginScreen.classList.add('active');
    }
  });

  // Allow Enter key to join
  characterNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      joinBtn.click();
    }
  });

  // Handle page unload
  window.addEventListener('beforeunload', () => {
    if (game) {
      game.shutdown();
    }
  });

  console.log('🎮 MMORPG Client loaded');
  console.log('Enter a character name to start playing!');
});
