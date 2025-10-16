// 元素
const player = document.getElementById("player");
const gameContainer = document.getElementById("game-container");
const scoreDisplay = document.getElementById("score");
const speedDisplay = document.getElementById("speed");
const timeDisplay = document.getElementById("time");

// 游戏状态
let isJumping = false;
let gravity = 0.9;
let position = 0;
let score = 0;
let gameStartTime = Date.now();
let animationId;
let activeHurdles = []; // 当前屏幕上的栏板
let isGameOver = false;

// 音效
const jumpSound = new Audio('music/01.mp3');
const failSound = new Audio('music/02.mp3');

// 移动端自动解锁音效
function unlockAudio() {
  [jumpSound, failSound].forEach(sound => {
    sound.volume = 0.3;
    sound.play().then(() => sound.pause()).catch(() => { });
  });
  document.removeEventListener('touchstart', unlockAudio);
  document.removeEventListener('click', unlockAudio);
}
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });


function playJumpSound() {
  // 重置播放时间
  jumpSound.currentTime = 0;
  // 尝试播放
  jumpSound.play().catch(e => {
    console.warn("跳跃音效被阻止:", e);
  });
}

function playFailSound() {
  // 重置时间
  failSound.currentTime = 0;
  failSound.play().catch(e => {
    console.warn("失败音效被阻止:", e);
  });
}



// 跳跃
function jump() {
  if (isJumping || isGameOver) return;
  isJumping = true;
  position = 0;
  let upSpeed = 12;

  playJumpSound();

  const jumpInterval = setInterval(() => {
    position += upSpeed;
    upSpeed -= gravity;
    player.style.bottom = position + "px";

    if (position <= 0) {
      clearInterval(jumpInterval);
      isJumping = false;
      position = 0;
      player.style.bottom = "0";
    }
  }, 18);
}

// 获取难度系数（对数增长）
function getDifficultyFactor() {
  const elapsedSeconds = (Date.now() - gameStartTime) / 1000;
  return Math.min(4, 1 + Math.log(1 + elapsedSeconds / 8));
}

// 创建栏板
function createHurdle() {
  if (isGameOver) return;

  const hurdle = document.createElement("div");
  hurdle.classList.add("hurdle");
  gameContainer.appendChild(hurdle);
  activeHurdles.push(hurdle);

  let hurdlePosition = gameContainer.offsetWidth;

  const difficulty = getDifficultyFactor();
  const moveSpeed = Math.min(3, 1 + (difficulty - 1) * 0.8);

  // 更新速度显示
  speedDisplay.textContent = moveSpeed.toFixed(1);

  const moveHurdle = setInterval(() => {
    if (isGameOver) {
      clearInterval(moveHurdle);
      return;
    }

    hurdlePosition -= 8 * moveSpeed;
    hurdle.style.right = (gameContainer.offsetWidth - hurdlePosition) + "px";

    // 碰撞检测
    const playerRect = player.getBoundingClientRect();
    const hurdleRect = hurdle.getBoundingClientRect();
    if (
      playerRect.right > hurdleRect.left &&
      playerRect.left < hurdleRect.right &&
      position < 40
    ) {
      clearInterval(moveHurdle);
      endGame();
      return;
    }

    // 移出屏幕后清理
    if (hurdlePosition < -40) {
      clearInterval(moveHurdle);
      if (hurdle.parentNode) {
        hurdle.parentNode.removeChild(hurdle);
      }
      activeHurdles = activeHurdles.filter(h => h !== hurdle);
      score++;
      scoreDisplay.textContent = score;
    }
  }, 30);
}

// 独立的栏板生成器：持续按难度随机生成，不限于前一个
function startHurdleGenerator() {
  const hurdleInterval = setInterval(() => {
    if (isGameOver) {
      clearInterval(hurdleInterval);
      return;
    }

    // 控制最大同时存在的栏板数
    if (activeHurdles.length >= 8) return;

    const difficulty = getDifficultyFactor();
    const baseMin = 1800;
    const finalMin = 800;
    const currentMin = Math.max(finalMin, baseMin / difficulty);
    const delay = currentMin + Math.random() * 400; // 随机间隔

    createHurdle(); // 直接创建，不递归

    // 当前间隔作为下次触发时间
    clearInterval(hurdleInterval);
    setTimeout(() => {
      startHurdleGenerator();
    }, delay);
  }, 10); // 初始快速检查，实际由 delay 控制
}


// 实时更新时间
function updateTime() {
  const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
  timeDisplay.textContent = elapsed;
}

// 游戏结束
function endGame() {
  if (isGameOver) return;
  isGameOver = true;
  playFailSound();
  cancelAnimationFrame(animationId);
  setTimeout(() => {
    alert(`游戏结束！\n得分: ${score}\n游戏时长: ${timeDisplay.textContent}s`);
    location.reload();
  }, 1500);
}

// 绑定事件
document.addEventListener("touchstart", (e) => {
  e.preventDefault();
  jump();
}, { passive: false });

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    jump();
  }
});

// 开始游戏
function startGame() {
  startHurdleGenerator(); // 新：独立定时生成器
  animationId = requestAnimationFrame(updateLoop);
}


function updateLoop() {
  updateTime();
  if (!isGameOver) {
    animationId = requestAnimationFrame(updateLoop);
  }
}

// 延迟开始，确保 UI 渲染完成
setTimeout(startGame, 1000);