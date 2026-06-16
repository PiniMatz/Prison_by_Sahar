import * as THREE from 'three';
import { AABB } from '../physics.js';
import { 
  createBrickWallTexture, 
  createConcreteFloorTexture, 
  createButtonTexture, 
  createGrateTexture 
} from '../textures.js';

export function loadLevel3(scene, obstacles, interactiveObjects) {
  // Clear scene
  while(scene.children.length > 0) { 
    scene.remove(scene.children[0]); 
  }

  // Create Materials
  const brickWallTex = createBrickWallTexture();
  brickWallTex.repeat.set(6, 4);
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    map: brickWallTex,
    roughness: 0.9,
    metalness: 0.1
  });

  const concreteFloorTex = createConcreteFloorTexture();
  concreteFloorTex.repeat.set(6, 6);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    map: concreteFloorTex,
    roughness: 0.8
  });

  const concretePlatformMaterial = new THREE.MeshStandardMaterial({
    map: concreteFloorTex, // reuse concrete
    roughness: 0.7
  });

  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.5,
    metalness: 0.8
  });

  // Level dimensions
  const width = 16;
  const depth = 16;
  const height = 10;

  // 1. Floor (Y = 0)
  const floorGeo = new THREE.PlaneGeometry(width, depth);
  const floor = new THREE.Mesh(floorGeo, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);
  obstacles.push(new AABB({ x: -width/2, y: -1, z: -depth/2 }, { x: width/2, y: 0, z: depth/2 }, 'floor'));

  // 2. Ceiling (Y = 10)
  const ceilingGeo = new THREE.PlaneGeometry(width, depth);
  const ceiling = new THREE.Mesh(ceilingGeo, concretePlatformMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  scene.add(ceiling);
  obstacles.push(new AABB({ x: -width/2, y: height, z: -depth/2 }, { x: width/2, y: height + 1, z: depth/2 }, 'ceiling'));

  // 3. Walls
  // Back Wall (Z = -8)
  const wallBackGeo = new THREE.PlaneGeometry(width, height);
  const wallBack = new THREE.Mesh(wallBackGeo, wallMaterial);
  wallBack.position.set(0, height/2, -depth/2);
  wallBack.receiveShadow = true;
  scene.add(wallBack);
  obstacles.push(new AABB({ x: -width/2, y: 0, z: -depth/2 - 1 }, { x: width/2, y: height, z: -depth/2 }, 'wall_back'));

  // Front Wall (Z = 8)
  const wallFrontGeo = new THREE.PlaneGeometry(width, height);
  const wallFront = new THREE.Mesh(wallFrontGeo, wallMaterial);
  wallFront.rotation.y = Math.PI;
  wallFront.position.set(0, height/2, depth/2);
  wallFront.receiveShadow = true;
  scene.add(wallFront);
  obstacles.push(new AABB({ x: -width/2, y: 0, z: depth/2 }, { x: width/2, y: height, z: depth/2 + 1 }, 'wall_front'));

  // Left Wall (X = -8)
  const wallLeftGeo = new THREE.PlaneGeometry(depth, height);
  const wallLeft = new THREE.Mesh(wallLeftGeo, wallMaterial);
  wallLeft.rotation.y = Math.PI / 2;
  wallLeft.position.set(-width/2, height/2, 0);
  wallLeft.receiveShadow = true;
  scene.add(wallLeft);
  obstacles.push(new AABB({ x: -width/2 - 1, y: 0, z: -depth/2 }, { x: -width/2, y: height, z: depth/2 }, 'wall_left'));

  // Right Wall (X = 8)
  const wallRightGeo = new THREE.PlaneGeometry(depth, height);
  const wallRight = new THREE.Mesh(wallRightGeo, wallMaterial);
  wallRight.rotation.y = -Math.PI / 2;
  wallRight.position.set(width/2, height/2, 0);
  wallRight.receiveShadow = true;
  scene.add(wallRight);
  obstacles.push(new AABB({ x: width/2, y: 0, z: -depth/2 }, { x: width/2 + 1, y: height, z: depth/2 }, 'wall_right'));

  // 4. Pedestal with Button
  const pedestalGeo = new THREE.BoxGeometry(0.6, 1.1, 0.6);
  const pedestal = new THREE.Mesh(pedestalGeo, metalMaterial);
  pedestal.position.set(-5.5, 0.55, 5.5);
  pedestal.castShadow = true;
  scene.add(pedestal);
  obstacles.push(new AABB({ x: -5.9, y: 0, z: 5.1 }, { x: -5.1, y: 1.15, z: 5.9 }, 'pedestal'));

  // The button mesh
  const redBtnTex = createButtonTexture('red');
  const greenBtnTex = createButtonTexture('green');
  
  const buttonGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16);
  const buttonMaterial = new THREE.MeshBasicMaterial({ map: redBtnTex });
  const buttonMesh = new THREE.Mesh(buttonGeo, buttonMaterial);
  buttonMesh.position.set(-5.5, 1.12, 5.5);
  scene.add(buttonMesh);

  // Button state variables
  let isUnlocked = false;

  // 5. Escape platform (Corner at X = [5.0, 8.0], Z = [-8.0, -5.0])
  const platformH = 4.5;
  const platformGeo = new THREE.BoxGeometry(3.0, platformH, 3.0);
  const platformMesh = new THREE.Mesh(platformGeo, concretePlatformMaterial);
  platformMesh.position.set(6.5, platformH/2, -6.5);
  platformMesh.castShadow = true;
  platformMesh.receiveShadow = true;
  scene.add(platformMesh);
  obstacles.push(new AABB({ x: 5.0, y: 0, z: -8.0 }, { x: 8.0, y: platformH, z: -5.0 }, 'platform'));

  // Platform Railing (visual only)
  const railGroup = new THREE.Group();
  railGroup.position.set(6.5, platformH, -6.5);
  
  const postGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8);
  const railGeo = new THREE.BoxGeometry(3.0, 0.04, 0.04);

  // Outer railing post (front-left of platform: X=5.0, Z=-5.0 -> relative: X=-1.5, Z=1.5)
  const p1 = new THREE.Mesh(postGeo, metalMaterial); p1.position.set(-1.4, 0.5, 1.4); railGroup.add(p1);
  const p2 = new THREE.Mesh(postGeo, metalMaterial); p2.position.set(-1.4, 0.5, -1.4); railGroup.add(p2);
  const p3 = new THREE.Mesh(postGeo, metalMaterial); p3.position.set(1.4, 0.5, 1.4); railGroup.add(p3);

  // Top rails
  const r1 = new THREE.Mesh(railGeo, metalMaterial); r1.position.set(0, 1.0, 1.4); railGroup.add(r1); // front
  const r2 = new THREE.Mesh(railGeo, metalMaterial); r2.position.set(-1.4, 1.0, 0); r2.rotation.y = Math.PI/2; railGroup.add(r2); // left
  
  scene.add(railGroup);

  // 6. Stairs (concrete blocks step-by-step from Z = 2.0 down to Z = -5.0)
  const stairsXMin = 5.0;
  const stairsXMax = 8.0;
  const stepCount = 9;
  const startZ = 1.0;
  const endZ = -5.0;
  const stepDepth = (startZ - endZ) / stepCount; // 6 / 9 = 0.66 units each
  const stepH = platformH / stepCount;          // 4.5 / 9 = 0.5 units each

  for (let i = 0; i < stepCount; i++) {
    const sHeight = (i + 1) * stepH;
    const sZCenter = startZ - (i * stepDepth) - (stepDepth / 2);
    
    const stepGeo = new THREE.BoxGeometry(3.0, sHeight, stepDepth);
    const stepMesh = new THREE.Mesh(stepGeo, concretePlatformMaterial);
    stepMesh.position.set(6.5, sHeight/2, sZCenter);
    stepMesh.castShadow = true;
    stepMesh.receiveShadow = true;
    scene.add(stepMesh);

    // Physics AABB for each step
    obstacles.push(new AABB(
      { x: stairsXMin, y: 0, z: sZCenter - stepDepth/2 },
      { x: stairsXMax, y: sHeight, z: sZCenter + stepDepth/2 },
      `step_${i}`
    ));
  }

  // 7. Interactive Object: Button Pedestal Action
  const interactiveButton = {
    mesh: buttonMesh,
    trigger: new AABB({ x: -6.5, y: 0, z: 4.5 }, { x: -4.5, y: 2.2, z: 6.5 }, 'button_trigger'),
    action: (stateManager) => {
      if (!isUnlocked) {
        isUnlocked = true;
        buttonMaterial.map = greenBtnTex;
        buttonMaterial.needsUpdate = true;
        // Move button slightly down to look pressed
        buttonMesh.position.y = 1.09;
        
        // Notify player via UI
        document.getElementById('objective-text').innerText = "תעלת האוורור פתוחה! רוץ למדרגות ועלה לקצה כדי לברוח!";
        document.getElementById('objective-text').style.color = '#4ade80';
        
        // Open the vent door visually (tilt it)
        exitGrateMesh.rotation.y = -Math.PI / 1.5;
        exitGrateMesh.position.set(7.5, 5.3, -7.5); // Pivot open
      }
    },
    promptMessage: "לחץ על הכפתור לפתיחת תעלת האוורור (E)"
  };
  interactiveObjects.push(interactiveButton);

  // 8. Exit Vent (on the back wall of the platform at Z = -8)
  const ventTex = createGrateTexture();
  const ventGrateMat = new THREE.MeshStandardMaterial({
    map: ventTex,
    transparent: true,
    side: THREE.DoubleSide
  });

  const exitGrateMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), ventGrateMat);
  exitGrateMesh.position.set(6.5, 5.3, -7.9); // flat against the wall Z = -8.0
  exitGrateMesh.receiveShadow = true;
  scene.add(exitGrateMesh);

  // Dark background behind the vent door
  const exitBgGeo = new THREE.PlaneGeometry(1.1, 1.1);
  const exitBgMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  const exitBg = new THREE.Mesh(exitBgGeo, exitBgMat);
  exitBg.position.set(6.5, 5.3, -7.95);
  scene.add(exitBg);

  const interactiveExit = {
    mesh: exitGrateMesh,
    trigger: new AABB({ x: 5.5, y: 4.5, z: -8.0 }, { x: 7.5, y: 6.5, z: -6.5 }, 'exit_trigger'),
    action: (stateManager) => {
      if (isUnlocked) {
        stateManager.winGame();
      } else {
        // Locked warning
        const oldText = document.getElementById('objective-text').innerText;
        document.getElementById('objective-text').innerText = "נעול! מצא את הכפתור האדום בקצה החדר כדי לשחרר את הנעילה.";
        document.getElementById('objective-text').style.color = '#ef4444';
        setTimeout(() => {
          if (!isUnlocked) {
            document.getElementById('objective-text').innerText = oldText;
            document.getElementById('objective-text').style.color = '#fff';
          }
        }, 3000);
      }
    },
    get promptMessage() {
      return isUnlocked ? "פתח את תעלת האוורור וברח לחופש! (E)" : "פתח האוורור נעול! (E)";
    }
  };
  interactiveObjects.push(interactiveExit);

  // 9. Lighting
  // Ambient visibility
  const ambient = new THREE.AmbientLight(0x111622, 0.4);
  scene.add(ambient);

  // Central prison fluorescent fixture
  const fixtureGeo = new THREE.BoxGeometry(3.0, 0.15, 0.4);
  const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
  fixture.position.set(0, height - 0.1, 0);
  scene.add(fixture);

  const tubeGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.8, 8);
  const tubeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  tube.rotation.z = Math.PI / 2;
  tube.position.set(0, height - 0.18, 0);
  scene.add(tube);

  const roomLight = new THREE.PointLight(0xdbeafe, 1.4, 25);
  roomLight.position.set(0, height - 0.3, 0);
  roomLight.castShadow = true;
  roomLight.shadow.mapSize.width = 1024;
  roomLight.shadow.mapSize.height = 1024;
  scene.add(roomLight);

  // 10. Policeman Guard (Chasing AI)
  const guardGroup = new THREE.Group();
  guardGroup.position.set(5.0, 0, 5.0); // Spawns near center-left

  // Body: Dark blue uniform cylinder
  const bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.3, 12);
  const uniformMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.7 });
  const bodyMesh = new THREE.Mesh(bodyGeo, uniformMat);
  bodyMesh.position.y = 0.65;
  bodyMesh.castShadow = true;
  guardGroup.add(bodyMesh);

  // Pants
  const pantsGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.4, 12);
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
  const pantsMesh = new THREE.Mesh(pantsGeo, pantsMat);
  pantsMesh.position.y = 0.2;
  guardGroup.add(pantsMesh);

  // Head
  const headGeo = new THREE.SphereGeometry(0.18, 12, 12);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.9 });
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.y = 1.45;
  headMesh.castShadow = true;
  guardGroup.add(headMesh);

  // Officer Hat
  const hatGroup = new THREE.Group();
  hatGroup.position.y = 1.6;
  const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.1, 12), pantsMat);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.08), metalMaterial);
  visor.position.set(0, -0.04, 0.16);
  visor.rotation.x = Math.PI / 12;
  hatGroup.add(hatBase);
  hatGroup.add(visor);
  
  // Gold badge on hat
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.01), new THREE.MeshBasicMaterial({ color: 0xeab308 }));
  badge.position.set(0, 0, 0.2);
  hatGroup.add(badge);
  guardGroup.add(hatGroup);

  // Flashlight Object in Guard's hand
  const flashlightGroup = new THREE.Group();
  flashlightGroup.position.set(-0.35, 0.8, 0.25); // side and forward
  
  const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
  const handle = new THREE.Mesh(handleGeo, metalMaterial);
  handle.rotation.x = Math.PI / 2;
  flashlightGroup.add(handle);

  const bulbRimGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.1, 8);
  const bulbRim = new THREE.Mesh(bulbRimGeo, metalMaterial);
  bulbRim.rotation.x = Math.PI / 2;
  bulbRim.position.z = 0.18;
  flashlightGroup.add(bulbRim);

  guardGroup.add(flashlightGroup);
  scene.add(guardGroup);

  // Flashlight SpotLight pointing forward from the guard
  const flashLight = new THREE.SpotLight(0xfef08a, 4.0, 15, Math.PI / 7, 0.6, 1.0);
  flashLight.position.set(5.0 - 0.35, 0.8, 5.0 + 0.4);
  flashLight.castShadow = true;
  flashLight.shadow.mapSize.width = 512;
  flashLight.shadow.mapSize.height = 512;
  scene.add(flashLight);

  // Add a SpotLight target
  const lightTarget = new THREE.Object3D();
  lightTarget.position.set(5.0, 0.8, 10.0);
  scene.add(lightTarget);
  flashLight.target = lightTarget;

  // Track guard properties
  let guardSpeed = 2.0;

  // AI Update function
  const updateGuard = (player, dt, stateManager) => {
    // 1. Calculate vector to player in 2D (ignore height for horizontal speed vector)
    const dx = player.position.x - guardGroup.position.x;
    const dz = player.position.z - guardGroup.position.z;
    const dist2D = Math.sqrt(dx * dx + dz * dz);

    // Increase guard speed slowly over time to build pressure
    guardSpeed += 0.04 * dt;
    if (guardSpeed > 3.4) guardSpeed = 3.4; // cap speed

    if (dist2D > 0.05) {
      const dirX = dx / dist2D;
      const dirZ = dz / dist2D;

      // Move toward player
      guardGroup.position.x += dirX * guardSpeed * dt;
      guardGroup.position.z += dirZ * guardSpeed * dt;

      // Rotate body to face movement direction
      // Math.atan2 takes (x, z) to compute angle relative to positive Z
      guardGroup.rotation.y = Math.atan2(dirX, dirZ);
    }

    // Keep flashlight position sync'd with guard body
    flashLight.position.copy(guardGroup.position);
    flashLight.position.y += 0.8; // Hand level
    
    // Update flashlight target in front of guard based on yaw rotation
    const forwardX = Math.sin(guardGroup.rotation.y);
    const forwardZ = Math.cos(guardGroup.rotation.y);
    lightTarget.position.set(
      guardGroup.position.x + forwardX * 4,
      0.5,
      guardGroup.position.z + forwardZ * 4
    );

    // 2. Check collision with player
    // Guard only catches player if they are vertically close (so player is safe high up on stairs)
    const vertDist = Math.abs(player.position.y - guardGroup.position.y);
    if (dist2D < 1.3 && vertDist < 1.9) {
      stateManager.caughtByGuard();
    }
  };

  // Level initial setup
  return {
    spawnPosition: { x: 0, y: 0.1, z: -5.0 }, // Spawn in back center
    spawnYaw: 0, // facing forward
    playerHeight: 1.8,
    playerSpeed: 3.8,
    jumpForce: 7.5,
    objective: "התחמק מהשוטר! מצא את הכפתור האדום כדי לפתוח את פתח האוורור שבראש המדרגות, וברח.",
    update: updateGuard // return AI update callback
  };
}
