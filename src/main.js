import * as THREE from 'three';
import './style.css';
import { updatePlayerPhysics, getPlayerBox, checkOverlap } from './physics.js';
import { loadLevel1 } from './levels/level1.js';
import { loadLevel2 } from './levels/level2.js';
import { loadLevel3 } from './levels/level3.js';

// Game state variables
let state = 'MENU'; // MENU, PLAYING, CAUGHT, WON
let currentLevelNum = 1;
let levelData = null;

// Three.js Core Objects
let scene, camera, renderer;
const obstacles = [];
const interactiveObjects = [];
const ladders = [];

// Player representation
const player = {
  position: new THREE.Vector3(0, 0, 0),
  yaw: 0,
  velocityY: 0,
  isGrounded: false,
  height: 1.8,
  speed: 3.5,
  jumpForce: 7.2,
  keys: {}
};

// HTML UI Elements
const uiStartMenu = document.getElementById('start-menu');
const uiHud = document.getElementById('hud');
const uiCaughtScreen = document.getElementById('caught-screen');
const uiWinScreen = document.getElementById('win-screen');
const uiLevelNum = document.getElementById('level-num');
const uiObjectiveText = document.getElementById('objective-text');
const uiInteractionPrompt = document.getElementById('interaction-prompt');
const uiWarningHud = document.getElementById('warning-hud');

const btnStart = document.getElementById('start-btn');
const btnRetry = document.getElementById('retry-btn');
const btnRestart = document.getElementById('restart-btn');

// Initialize WebGL Scene
function initEngine() {
  scene = new THREE.Scene();
  
  // Dark prison-like atmosphere fog
  scene.background = new THREE.Color(0x0a0c10);
  scene.fog = new THREE.FogExp2(0x0a0c10, 0.08);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  // Enable rotation ordering for standard FPS look (Y then X)
  camera.rotation.order = 'YXZ';

  const canvas = document.getElementById('game-canvas');
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Window Resize
  window.addEventListener('resize', onWindowResize);

  // Keyboard Event Listeners
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Setup Button Click Event Handlers
  btnStart.addEventListener('click', startGame);
  btnRetry.addEventListener('click', () => resetLevel(currentLevelNum));
  btnRestart.addEventListener('click', restartGame);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Key handling
function onKeyDown(e) {
  // Store key states
  player.keys[e.key] = true;
  
  // Support both arrow keys and WASD just in case, but prioritize arrows
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') player.keys['ArrowUp'] = true;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') player.keys['ArrowDown'] = true;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') player.keys['ArrowLeft'] = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') player.keys['ArrowRight'] = true;

  // Interaction Key (E / e / ק)
  // Checking e.code === 'KeyE' handles QWERTY physical key regardless of layout (e.g. Hebrew)
  if (e.code === 'KeyE' || e.key.toLowerCase() === 'e' || e.key === 'ק') {
    handleInteraction();
  }
}

function onKeyUp(e) {
  player.keys[e.key] = false;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') player.keys['ArrowUp'] = false;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') player.keys['ArrowDown'] = false;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') player.keys['ArrowLeft'] = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') player.keys['ArrowRight'] = false;
}

// Start button callback
function startGame() {
  uiStartMenu.classList.remove('active');
  uiHud.classList.add('active');
  state = 'PLAYING';
  loadLevel(1);
}

// Game over / Caught by guard callback
const stateManager = {
  changeLevel: (levelNum) => {
    loadLevel(levelNum);
  },
  caughtByGuard: () => {
    state = 'CAUGHT';
    uiHud.classList.remove('active');
    uiCaughtScreen.classList.add('active');
  },
  winGame: () => {
    state = 'WON';
    uiHud.classList.remove('active');
    uiWinScreen.classList.add('active');
  }
};

function loadLevel(levelNum) {
  currentLevelNum = levelNum;
  obstacles.length = 0;
  interactiveObjects.length = 0;
  ladders.length = 0;
  
  // Hide overlays
  uiCaughtScreen.classList.remove('active');
  uiWinScreen.classList.remove('active');
  uiWarningHud.classList.remove('active');
  uiInteractionPrompt.classList.remove('active');

  uiHud.classList.add('active');
  uiLevelNum.innerText = levelNum;

  // Load level specific geometry
  if (levelNum === 1) {
    levelData = loadLevel1(scene, obstacles, interactiveObjects);
    scene.fog.density = 0.08;
  } else if (levelNum === 2) {
    levelData = loadLevel2(scene, obstacles, interactiveObjects);
    // Vents are dustier/foggy
    scene.fog.density = 0.15;
  } else if (levelNum === 3) {
    levelData = loadLevel3(scene, obstacles, interactiveObjects);
    scene.fog.density = 0.05;
  }

  // Position Player
  player.position.set(
    levelData.spawnPosition.x,
    levelData.spawnPosition.y,
    levelData.spawnPosition.z
  );
  player.yaw = levelData.spawnYaw;
  player.velocityY = 0;
  player.isGrounded = false;
  player.height = levelData.playerHeight;
  player.speed = levelData.playerSpeed;
  player.jumpForce = levelData.jumpForce;

  uiObjectiveText.innerText = levelData.objective;
  uiObjectiveText.style.color = '#fff'; // reset color

  if (levelData && levelData.ladders) {
    ladders.push(...levelData.ladders);
  }

  state = 'PLAYING';
}

function resetLevel(levelNum) {
  loadLevel(levelNum);
}

function restartGame() {
  uiWinScreen.classList.remove('active');
  loadLevel(1);
}

// Process E interaction press
function handleInteraction() {
  if (state !== 'PLAYING') return;

  const playerBox = getPlayerBox(player.position, player.height);
  
  for (const obj of interactiveObjects) {
    if (checkOverlap(playerBox, obj.trigger)) {
      obj.action(stateManager);
      break;
    }
  }
}

// Look for nearby interactable things to display prompts
function updateInteractionHUD() {
  const playerBox = getPlayerBox(player.position, player.height);
  let nearAnything = false;

  for (const obj of interactiveObjects) {
    if (checkOverlap(playerBox, obj.trigger)) {
      uiInteractionPrompt.innerHTML = `לחץ <span class="key-e">E</span> כדי לְבַצֵעַ: ${obj.promptMessage || 'אינטראקציה'}`;
      uiInteractionPrompt.classList.add('active');
      nearAnything = true;
      break;
    }
  }

  if (!nearAnything) {
    uiInteractionPrompt.classList.remove('active');
  }
}

// Main Game Loop
let lastTime = 0;

function gameLoop(time) {
  requestAnimationFrame(gameLoop);

  // Calculate delta time in seconds
  let dt = (time - lastTime) / 1000;
  lastTime = time;

  // Clamp dt to avoid huge physics steps when switching tabs
  if (dt > 0.1) dt = 0.1;

  if (state === 'PLAYING') {
    // 1. Update Player position and physics collisions
    updatePlayerPhysics(player, dt, obstacles, ladders);

    // 2. Align Camera at eye height
    camera.position.set(
      player.position.x,
      player.position.y + player.height * 0.85, // Eyes offset
      player.position.z
    );
    
    // Set yaw rotation (Left/Right)
    camera.rotation.set(0, player.yaw, 0);

    // 3. Update level-specific AI (e.g. Guard chasing)
    if (levelData && typeof levelData.update === 'function') {
      levelData.update(player, dt, stateManager);
      
      // Level 3 Guard proximity warning HUD
      if (currentLevelNum === 3) {
        uiWarningHud.classList.add('active');
      }
    } else {
      uiWarningHud.classList.remove('active');
    }

    // 4. Check interaction range for HUD prompts
    updateInteractionHUD();
  }

  // 5. Render Scene
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Initialize and start loop
initEngine();
requestAnimationFrame(gameLoop);
