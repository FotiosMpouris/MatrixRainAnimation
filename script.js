// =================================================================
// MAGA MATRIX - SCRIPT.JS - FINAL VERSION
// - Katakana-style Matrix Rain restored.
// - New player and enemy ship designs implemented.
// - Core "Matrix Invaders" gameplay preserved.
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
  initializeMatrixEffect();
  document.addEventListener('click', (e) => {
    createParticle(e);
    createEnergyWave(e.pageX, e.pageY);
  });
});

// Original particle and wave effects
function createParticle(e) {
  const container = document.getElementById('particles-container');
  if (!container) return;
  const particle = document.createElement('div');
  particle.className = 'particle';
  particle.style.left = e.pageX + 'px';
  particle.style.top = e.pageY + 'px';
  container.appendChild(particle);
  setTimeout(() => { if (container.contains(particle)) container.removeChild(particle) }, 2000);
}

function createEnergyWave(x, y) {
  const container = document.getElementById('particles-container');
  if (!container) return;
  const wave = document.createElement('div');
  wave.className = 'energy-wave';
  wave.style.left = (x - 100) + 'px';
  wave.style.top = (y - 100) + 'px';
  container.appendChild(wave);
  setTimeout(() => { if (container.contains(wave)) container.removeChild(wave) }, 3000);
}

// =================================================================
// GAME LOGIC: MATRIX INVADERS (WITH VISUAL UPGRADES)
// =================================================================
let gameInstance = null; 

function startGame() {
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    alert("This simulation requires a physical keyboard for full engagement. Please connect from a desktop terminal.");
    return;
  }
  if (gameInstance) {
    gameInstance.stop();
  }
  
  const canvas = document.getElementById('matrix-canvas');
  const ctx = canvas.getContext('2d');
  
  document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
  canvas.style.display = 'block';
  canvas.width = 800;
  canvas.height = 600;

  const keys = {};
  
  let player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 40,
    height: 20,
    speed: 5,
    lives: 3,
    isHit: false,
    hitTimer: 0
  };
  
  let bullets = [];
  let enemyBullets = [];
  let enemies = [];
  let score = 0;
  let wave = 1;
  let lastFireTime = 0;
  let gameOver = false;
  let gameWon = false;
  let animationFrameId;

  function createEnemies() {
    enemies = [];
    const enemyRows = 3 + Math.floor(wave / 2);
    const enemyCols = 8;
    const enemySpacing = 60;

    for (let row = 0; row < enemyRows; row++) {
      for (let col = 0; col < enemyCols; col++) {
        enemies.push({
          x: 100 + col * enemySpacing,
          y: 50 + row * enemySpacing,
          width: 30,
          height: 30,
          speed: 1 + wave * 0.2,
          direction: 1,
          isHit: false,
          hitTimer: 0
        });
      }
    }
  }

  function drawPlayer() {
    if (player.isHit) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      player.hitTimer--;
      if (player.hitTimer <= 0) player.isHit = false;
    }
    
    // NEW SHIP DESIGN
    const bodyColor = '#c0c0c0'; // Silver
    const wingColor = '#a0a0a0'; // Darker silver

    // Pulsing red engine glow
    const engineGlow = Math.abs(Math.sin(Date.now() / 200)) * 0.5 + 0.5; // Varies between 0.5 and 1
    ctx.fillStyle = `rgba(255, 0, 0, ${engineGlow})`;
    ctx.fillRect(player.x - 5, player.y + player.height - 5, 10, 10);
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'red';
    ctx.fillRect(player.x - 5, player.y + player.height - 5, 10, 10);
    ctx.shadowBlur = 0;
    
    // Main Body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(player.x - player.width / 2, player.y, player.width, player.height);
    
    // Wings
    ctx.fillStyle = wingColor;
    ctx.beginPath();
    ctx.moveTo(player.x - player.width / 2, player.y);
    ctx.lineTo(player.x - player.width / 2 - 10, player.y + player.height);
    ctx.lineTo(player.x - player.width / 2, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width / 2 + 10, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height);
    ctx.closePath();
    ctx.fill();
  }

  function drawBullets() {
    ctx.fillStyle = 'red';
    bullets.forEach(b => {
      ctx.fillRect(b.x - 2, b.y, 4, 15);
      b.y -= b.speed;
    });
    bullets = bullets.filter(b => b.y > 0);
  }

  function drawEnemies() {
    enemies.forEach(enemy => {
      if (enemy.isHit) {
          ctx.fillStyle = `rgba(0, 255, 0, ${Math.random()})`;
          ctx.font = '12px Courier New';
          ctx.fillText(Math.random() > 0.5 ? '1' : '0', enemy.x + Math.random() * 20 - 10, enemy.y + Math.random() * 20 - 10);
          enemy.hitTimer--;
      } else {
        // NEW SENTINEL DESIGN
        const bodyColor = '#00008b'; // Dark blue
        const eyeColor = '#ff0000';   // Red
        
        // Tentacles
        ctx.fillStyle = bodyColor;
        ctx.fillRect(enemy.x, enemy.y + 5, enemy.width, enemy.height - 10); // Horizontal body
        ctx.fillRect(enemy.x + 5, enemy.y, enemy.width - 10, enemy.height); // Vertical body
        
        // Central Eye
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = eyeColor;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
    enemies = enemies.filter(e => e.hitTimer > 0 || !e.isHit);
  }
  
  function drawEnemyBullets() {
      ctx.fillStyle = 'cyan'; // Kept as cyan for high visibility
      enemyBullets.forEach(b => {
          ctx.fillRect(b.x - 2, b.y, 4, 15);
          b.y += b.speed;
      });
      enemyBullets = enemyBullets.filter(b => b.y < canvas.height);
  }

  function update() {
    if (gameOver || gameWon) return;

    if (keys['ArrowLeft'] && player.x > player.width / 2 + 10) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width / 2 - 10) player.x += player.speed;
    
    if (keys[' '] && Date.now() - lastFireTime > 300) {
      bullets.push({ x: player.x, y: player.y, speed: 7 });
      lastFireTime = Date.now();
    }

    let wallHit = false;
    enemies.forEach(enemy => {
      enemy.x += enemy.speed * enemy.direction;
      if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
        wallHit = true;
      }
      if (Math.random() < 0.001 + (wave * 0.0002)) {
          enemyBullets.push({ x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height, speed: 4 });
      }
    });

    if (wallHit) {
      enemies.forEach(enemy => {
        enemy.direction *= -1;
        enemy.y += 20;
      });
    }
    
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (!enemy.isHit && bullet.x > enemy.x && bullet.x < enemy.x + enemy.width && bullet.y > enemy.y && bullet.y < enemy.y + enemy.height) {
                enemy.isHit = true;
                enemy.hitTimer = 10;
                bullets.splice(bIndex, 1);
                score += 10;
            }
        });
    });

    enemyBullets.forEach((bullet, bIndex) => {
        if (bullet.x > player.x - player.width / 2 && bullet.x < player.x + player.width / 2 && bullet.y > player.y && bullet.y < player.y + player.height) {
            enemyBullets.splice(bIndex, 1);
            player.lives--;
            player.isHit = true;
            player.hitTimer = 15;
            if (player.lives <= 0) gameOver = true;
        }
    });
    
    if (enemies.length === 0 && !gameWon) {
        wave++;
        createEnemies();
    }
  }

  function drawHUD() {
      ctx.fillStyle = '#0f0';
      ctx.font = '24px Courier New';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${score}`, 20, 40);
      ctx.fillText(`WAVE: ${wave}`, 20, 70);
      ctx.textAlign = 'right';
      ctx.fillText(`LIVES: ${player.lives}`, canvas.width - 20, 40);
  }
  
  function drawGameOver() {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,canvas.width, canvas.height);
      ctx.fillStyle = 'red';
      ctx.font = '70px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('SYSTEM FAILURE', canvas.width / 2, canvas.height / 2 - 40);
      ctx.font = '30px Courier New';
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
      ctx.font = '20px Courier New';
      ctx.fillText('Press R to restart or Q to quit', canvas.width / 2, canvas.height / 2 + 80);
  }

  function gameLoop() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (gameOver) {
        drawGameOver();
    } else {
        update();
        drawPlayer();
        drawBullets();
        drawEnemies();
        drawEnemyBullets();
        drawHUD();
    }
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function handleKeyDown(e) {
      keys[e.key] = true;
      if (gameOver && e.key.toLowerCase() === 'r') {
          gameInstance.stop();
          startGame();
      }
      if (gameOver && e.key.toLowerCase() === 'q') {
          gameInstance.stop();
          window.location.reload();
      }
  }
  
  function handleKeyUp(e) {
      keys[e.key] = false;
  }
  
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  gameInstance = {
      stop: () => {
          cancelAnimationFrame(animationFrameId);
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      }
  };

  createEnemies();
  gameLoop();
}

// =================================================================
// KATAKANA-STYLE MATRIX BACKGROUND EFFECT (RESTORED)
// =================================================================
function initializeMatrixEffect() {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  
  let letters = [];
  
  function setup() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const columns = Math.floor(canvas.width / 20);
      letters = [];
      for (let i = 0; i < columns; i++) {
          letters[i] = 1;
      }
  }
  
  function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f0';
    ctx.font = '15pt monospace';
    
    letters.forEach((y, index) => {
        // This is the Katakana character set.
        const text = String.fromCharCode(0x30A0 + Math.random() * 96);
        const x = index * 20;
        ctx.fillText(text, x, y * 20);
        if (y * 20 > canvas.height && Math.random() > 0.975) {
            letters[index] = 0;
        }
        letters[index]++;
    });
  }

  setup();
  setInterval(drawMatrix, 50);
  window.addEventListener('resize', setup);
}

// Red Pill Effect
function takeRedPill() {
  const effect = document.getElementById('red-pill-effect');
  effect.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Blue Pill Effect
function takeBluePill() {
  const effect = document.getElementById('blue-pill-effect');
  effect.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close Effect
function closeEffect() {
  const effects = document.querySelectorAll('.pill-effect');
  effects.forEach(effect => {
    effect.classList.remove('active');
  });
  document.body.style.overflow = 'auto';
}
