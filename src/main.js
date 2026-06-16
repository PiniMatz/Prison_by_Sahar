import * as THREE from 'three';
import './style.css';
import { updatePlayerPhysics, getPlayerBox, checkOverlap } from './physics.js';
import { loadLevel1 } from './levels/level1.js';
import { loadLevel2 } from './levels/level2.js';
import { loadLevel3 } from './levels/level3.js';
import { loadLevel4 } from './levels/level4.js';

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
  pitch: 0, // Vertical look tilt angle
  velocityY: 0,
  isGrounded: false,
  height: 1.8,
  speed: 3.5,
  jumpForce: 7.2,
  keys: {},
  hasGun: false, // equipped rifle state
  hp: 100        // player hitpoints
};
window.playerObject = player; // expose for level4.js AI access

// Combat and weapon entities
const playerBullets = [];
let gunViewModel = null;
let recoilOffset = 0;
let shootCooldown = 0;
let isTouchDevice = false;

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
  isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (isTouchDevice) {
    document.body.classList.add('touch-device');
  }

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

  // Mouse look with Pointer Lock and click-drag fallback
  let isMouseDown = false;
  let prevMouseX = 0;
  let prevMouseY = 0;

  canvas.addEventListener('mousedown', (e) => {
    if (isTouchDevice) return;
    isMouseDown = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
    if (state === 'PLAYING') {
      canvas.requestPointerLock();
    }
  });

  window.addEventListener('mouseup', () => {
    if (isTouchDevice) return;
    isMouseDown = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (state !== 'PLAYING' || isTouchDevice) return;

    const sensitivity = 0.0025;

    if (document.pointerLockElement === canvas) {
      player.yaw -= e.movementX * sensitivity;
      player.pitch -= e.movementY * sensitivity;
    } else if (isMouseDown) {
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      player.yaw -= deltaX * sensitivity;
      player.pitch -= deltaY * sensitivity;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    }

    // Clamp look tilt to prevent flipping (approx 82 degrees up/down)
    player.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, player.pitch));
  });

  // Mobile Touch Controls Bindings
  bindTouchButton('touch-up', 'ArrowUp');
  bindTouchButton('touch-down', 'ArrowDown');
  bindTouchButton('touch-left', 'ArrowLeft');
  bindTouchButton('touch-right', 'ArrowRight');

  // Custom action buttons for touch controls
  const btnAction = document.getElementById('touch-action');
  if (btnAction) {
    btnAction.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (player.hasGun) {
        shootWeapon();
      } else {
        player.keys[' '] = true;
      }
    });
    btnAction.addEventListener('touchend', (e) => {
      e.preventDefault();
      player.keys[' '] = false;
    });
    btnAction.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      player.keys[' '] = false;
    });
  }

  const btnInteract = document.getElementById('touch-interact');
  if (btnInteract) {
    btnInteract.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleInteraction();
    });
  }

  // Touch look-around (swipe to look)
  let isTouching = false;
  let prevTouchX = 0;
  let prevTouchY = 0;
  const touchSensitivity = 0.0035;

  canvas.addEventListener('touchstart', (e) => {
    if (e.target === canvas) {
      isTouching = true;
      prevTouchX = e.touches[0].clientX;
      prevTouchY = e.touches[0].clientY;
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (!isTouching || state !== 'PLAYING') return;

    const deltaX = e.touches[0].clientX - prevTouchX;
    const deltaY = e.touches[0].clientY - prevTouchY;

    player.yaw -= deltaX * touchSensitivity;
    player.pitch -= deltaY * touchSensitivity;
    player.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, player.pitch));

    prevTouchX = e.touches[0].clientX;
    prevTouchY = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', () => { isTouching = false; });
  canvas.addEventListener('touchcancel', () => { isTouching = false; });

  // Enable Viewmodel rendering (attach camera to scene and gun to camera)
  scene.add(camera);
  createGunViewModel();
}

function bindTouchButton(id, keyName) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    player.keys[keyName] = true;
  });
  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    player.keys[keyName] = false;
  });
  btn.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    player.keys[keyName] = false;
  });
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

  // Shoot weapon with Space if player has the gun
  if (e.key === ' ' && player.hasGun) {
    shootWeapon();
  }

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
    // If finished level 3, transition to the Boss Battle (Level 4)
    if (currentLevelNum === 3) {
      loadLevel(4);
    } else {
      state = 'WON';
      uiHud.classList.remove('active');
      uiWinScreen.classList.add('active');
    }
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

  // Unload previous level data specific meshes
  if (levelData && typeof levelData.unload === 'function') {
    levelData.unload();
  }

  // Clear bullets
  playerBullets.forEach(b => scene.remove(b.mesh));
  playerBullets.length = 0;

  // Reset player stats
  player.hasGun = false;
  player.hp = 100;
  const hpDisplay = document.getElementById('player-hp');
  if (hpDisplay) hpDisplay.innerText = 100;

  const btnActionLabel = document.getElementById('touch-action');
  if (btnActionLabel) btnActionLabel.innerText = "קפיצה";

  // Hide boss health bar by default
  const bossBar = document.getElementById('boss-health-bar');
  if (bossBar) bossBar.classList.remove('active');

  // Load level specific geometry
  if (levelNum === 1) {
    levelData = loadLevel1(scene, obstacles, interactiveObjects);
    scene.fog.density = 0.08;
  } else if (levelNum === 2) {
    levelData = loadLevel2(scene, obstacles, interactiveObjects);
    scene.fog.density = 0.15;
  } else if (levelNum === 3) {
    levelData = loadLevel3(scene, obstacles, interactiveObjects);
    scene.fog.density = 0.05;
  } else if (levelNum === 4) {
    levelData = loadLevel4(scene, obstacles, interactiveObjects);
    scene.fog.density = 0.0; // Disable fog for maximum visibility in Level 4
  }

  // Ensure the camera is added to the scene (since clearing the scene in the level loader removes it)
  scene.add(camera);

  // Position Player
  player.position.set(
    levelData.spawnPosition.x,
    levelData.spawnPosition.y,
    levelData.spawnPosition.z
  );
  player.yaw = levelData.spawnYaw;
  player.pitch = 0; // reset vertical look tilt
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

// Create the first-person gun viewmodel mesh
function createGunViewModel() {
  gunViewModel = new THREE.Group();

  const gunMat = new THREE.MeshStandardMaterial({ 
    color: 0x1f2937, 
    roughness: 0.5, 
    metalness: 0.8 
  });

  // Barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8), gunMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0, -0.2);
  gunViewModel.add(barrel);

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.2), gunMat);
  body.position.set(0, -0.01, -0.05);
  gunViewModel.add(body);

  // Scope
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), gunMat);
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, 0.035, -0.1);
  gunViewModel.add(scope);

  // Position at bottom-right corner of camera frame
  gunViewModel.position.set(0.18, -0.15, -0.4);
  gunViewModel.visible = false;
  camera.add(gunViewModel);
}

// Shoot a neon laser bullet
function shootWeapon() {
  if (state !== 'PLAYING' || !player.hasGun || shootCooldown > 0) return;
  shootCooldown = 0.3; // 300ms fire rate cooldown

  const bulletGeo = new THREE.SphereGeometry(0.04, 6, 6);
  const bulletMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);

  // Start bullet at camera position
  bulletMesh.position.copy(camera.position);

  // Move bullet slightly forward and right relative to camera so it emerges from barrel
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();

  bulletMesh.position.addScaledVector(right, 0.18);
  bulletMesh.position.addScaledVector(forward, 0.45);
  bulletMesh.position.y -= 0.15; // match gun muzzle height

  scene.add(bulletMesh);

  playerBullets.push({
    mesh: bulletMesh,
    dir: forward,
    speed: 28.0, // fast projectile
    lifetime: 2.0
  });

  // Snappy recoil kickback
  recoilOffset = 0.08;
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
    // Update shoot cooldown
    if (shootCooldown > 0) {
      shootCooldown -= dt;
    }

    // 1. Update Player position and physics collisions
    updatePlayerPhysics(player, dt, obstacles, ladders);

    // Update gun viewmodel animation
    if (player.hasGun && gunViewModel) {
      gunViewModel.visible = true;
      recoilOffset += (0 - recoilOffset) * 12 * dt; // Snappy return to center
      gunViewModel.position.set(0.18, -0.15, -0.4 + recoilOffset);
    } else if (gunViewModel) {
      gunViewModel.visible = false;
    }

    // Update player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      const bullet = playerBullets[i];
      bullet.mesh.position.addScaledVector(bullet.dir, bullet.speed * dt);
      bullet.lifetime -= dt;

      // Check hit on Boss (only in level 4)
      if (currentLevelNum === 4 && levelData && typeof levelData.getBossAABB === 'function') {
        const bossAABB = levelData.getBossAABB();
        const bulletBox = getPlayerBox(bullet.mesh.position, 0.1, 0.1);
        
        if (checkOverlap(bulletBox, bossAABB)) {
          levelData.takeDamage(10, stateManager); // Boss takes 10 damage
          scene.remove(bullet.mesh);
          playerBullets.splice(i, 1);
          continue;
        }
      }

      // Clean up old bullets
      if (bullet.lifetime <= 0) {
        scene.remove(bullet.mesh);
        playerBullets.splice(i, 1);
      }
    }

    // 2. Align Camera at eye height
    camera.position.set(
      player.position.x,
      player.position.y + player.height * 0.85, // Eyes offset
      player.position.z
    );
    
    // Set yaw and pitch rotation (order YXZ ensures horizon stays flat)
    camera.rotation.set(player.pitch, player.yaw, 0);

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
