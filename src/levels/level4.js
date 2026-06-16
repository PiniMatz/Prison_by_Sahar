import * as THREE from 'three';
import { AABB, checkOverlap, getPlayerBox } from '../physics.js';
import { 
  createMetalPlateTexture, 
  createConcreteFloorTexture 
} from '../textures.js';

export function loadLevel4(scene, obstacles, interactiveObjects) {
  // Clear scene
  while(scene.children.length > 0) { 
    scene.remove(scene.children[0]); 
  }

  // Show boss health bar in UI
  const bossHealthBar = document.getElementById('boss-health-bar');
  if (bossHealthBar) bossHealthBar.classList.add('active');
  
  // Set default fill
  const bossHpFill = document.getElementById('boss-hp-fill');
  if (bossHpFill) bossHpFill.style.width = '100%';

  // Create Materials
  const metalTex = createMetalPlateTexture();
  metalTex.repeat.set(4, 4);
  const wallMat = new THREE.MeshStandardMaterial({
    map: metalTex,
    roughness: 0.4,
    metalness: 0.8
  });

  const concreteTex = createConcreteFloorTexture();
  concreteTex.repeat.set(5, 5);
  const floorMat = new THREE.MeshStandardMaterial({
    map: concreteTex,
    roughness: 0.7
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.5,
    metalness: 0.8
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.4,
    roughness: 0.1,
    metalness: 0.9
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.2,
    metalness: 0.9
  });

  // Arena dimensions: W = 24, D = 24, H = 12
  const width = 24;
  const depth = 24;
  const height = 12;

  // 1. Floor (Y = 0)
  const floorGeo = new THREE.PlaneGeometry(width, depth);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  obstacles.push(new AABB({ x: -width/2, y: -1, z: -depth/2 }, { x: width/2, y: 0, z: depth/2 }, 'floor'));

  // 2. Ceiling (Y = 12)
  const ceiling = new THREE.Mesh(floorGeo, floorMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  scene.add(ceiling);
  obstacles.push(new AABB({ x: -width/2, y: height, z: -depth/2 }, { x: width/2, y: height + 1, z: depth/2 }, 'ceiling'));

  // 3. Walls
  // Back Wall (Z = -12)
  const wallBackGeo = new THREE.PlaneGeometry(width, height);
  const wallBack = new THREE.Mesh(wallBackGeo, wallMat);
  wallBack.position.set(0, height/2, -depth/2);
  wallBack.receiveShadow = true;
  scene.add(wallBack);
  obstacles.push(new AABB({ x: -width/2, y: 0, z: -depth/2 - 1 }, { x: width/2, y: height, z: -depth/2 }, 'wall_back'));

  // Front Wall (Z = 12)
  const wallFront = new THREE.Mesh(wallBackGeo, wallMat);
  wallFront.rotation.y = Math.PI;
  wallFront.position.set(0, height/2, depth/2);
  wallFront.receiveShadow = true;
  scene.add(wallFront);
  obstacles.push(new AABB({ x: -width/2, y: 0, z: depth/2 }, { x: width/2, y: height, z: depth/2 + 1 }, 'wall_front'));

  // Left Wall (X = -12)
  const wallLeftGeo = new THREE.PlaneGeometry(depth, height);
  const wallLeft = new THREE.Mesh(wallLeftGeo, wallMat);
  wallLeft.rotation.y = Math.PI / 2;
  wallLeft.position.set(-width/2, height/2, 0);
  wallLeft.receiveShadow = true;
  scene.add(wallLeft);
  obstacles.push(new AABB({ x: -width/2 - 1, y: 0, z: -depth/2 }, { x: -width/2, y: height, z: depth/2 }, 'wall_left'));

  // Right Wall (X = 12)
  const wallRight = new THREE.Mesh(wallLeftGeo, wallMat);
  wallRight.rotation.y = -Math.PI / 2;
  wallRight.position.set(width/2, height/2, 0);
  wallRight.receiveShadow = true;
  scene.add(wallRight);
  obstacles.push(new AABB({ x: width/2, y: 0, z: -depth/2 }, { x: width/2 + 1, y: height, z: depth/2 }, 'wall_right'));

  // 4. Pillars/Obstacles in Arena corners
  const pillarGeo = new THREE.BoxGeometry(2.0, height, 2.0);
  const pillarPositions = [
    [-8, -8], [-8, 8], [8, -8], [8, 8]
  ];
  pillarPositions.forEach(([px, pz], idx) => {
    const pillar = new THREE.Mesh(pillarGeo, ironMat);
    pillar.position.set(px, height/2, pz);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);
    obstacles.push(new AABB(
      { x: px - 1.0, y: 0, z: pz - 1.0 },
      { x: px + 1.0, y: height, z: pz + 1.0 },
      `pillar_${idx}`
    ));
  });

  // 5. Weapon Pedestal in center
  const pedGeo = new THREE.BoxGeometry(0.8, 0.9, 0.8);
  const pedestal = new THREE.Mesh(pedGeo, ironMat);
  pedestal.position.set(0, 0.45, 0);
  pedestal.castShadow = true;
  scene.add(pedestal);
  obstacles.push(new AABB({ x: -0.45, y: 0, z: -0.45 }, { x: 0.45, y: 0.95, z: 0.45 }, 'rifle_pedestal'));

  // 3D Rifle model lying on pedestal
  const rifleGroup = new THREE.Group();
  rifleGroup.position.set(0, 0.95, 0);

  // Barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8), metalMat);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.x = 0.2;
  rifleGroup.add(barrel);

  // Stock / Body
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.04), ironMat);
  stock.position.x = -0.2;
  rifleGroup.add(stock);

  // Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.03), ironMat);
  grip.position.set(-0.15, -0.06, 0);
  grip.rotation.z = -Math.PI / 6;
  rifleGroup.add(grip);

  // Scope
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), ironMat);
  scope.rotation.z = Math.PI / 2;
  scope.position.y = 0.05;
  rifleGroup.add(scope);

  scene.add(rifleGroup);

  // Interactive Action: Picking up the gun
  const interactiveRifle = {
    mesh: rifleGroup,
    trigger: new AABB({ x: -1.2, y: 0, z: -1.2 }, { x: 1.2, y: 1.5, z: 1.2 }, 'rifle_pickup'),
    action: (stateManager) => {
      // Set gun equipped status on player
      // We will access player object via window/global or state manager
      window.playerObject.hasGun = true;
      
      // Remove rifle mesh from arena floor
      scene.remove(rifleGroup);

      // Remove from interactive objects list
      const idx = interactiveObjects.indexOf(interactiveRifle);
      if (idx !== -1) interactiveObjects.splice(idx, 1);

      // Update instructions
      document.getElementById('objective-text').innerText = "הרובה בידיך! לחץ על מקש הרווח (Space) או כפתור 'ירייה' כדי לירות. חסל את רובוט השוטר!";
      document.getElementById('objective-text').style.color = '#38bdf8';

      // Update touch action button label
      const btnActionLabel = document.getElementById('touch-action');
      if (btnActionLabel) btnActionLabel.innerText = "ירייה";
    },
    promptMessage: "אסוף את רובה הלייזר (E)"
  };
  interactiveObjects.push(interactiveRifle);

  // 6. Spawn Robot Boss (שוטר בתוך רובוט)
  const bossGroup = new THREE.Group();
  bossGroup.position.set(0, 0, -8.0); // Spawn opposite the player

  // Robot Base Legs
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 10), ironMat);
  legL.position.set(-0.6, 0.6, 0);
  legL.castShadow = true;
  bossGroup.add(legL);

  const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 10), ironMat);
  legR.position.set(0.6, 0.6, 0);
  legR.castShadow = true;
  bossGroup.add(legR);

  // Main mechanical cockpit housing
  const cockpitHousing = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.8, 1.4, 12), ironMat);
  cockpitHousing.position.y = 1.8;
  cockpitHousing.castShadow = true;
  bossGroup.add(cockpitHousing);

  // Cockpit glass bubble
  const cockpitGlass = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 12), glassMat);
  cockpitGlass.position.set(0, 2.0, 0.35); // offset forward
  bossGroup.add(cockpitGlass);

  // Arm Cannons (left and right)
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), ironMat);
  armL.rotation.x = Math.PI / 2; // point forward
  armL.position.set(-1.1, 1.8, 0.4);
  armL.castShadow = true;
  bossGroup.add(armL);

  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), ironMat);
  armR.rotation.x = Math.PI / 2;
  armR.position.set(1.1, 1.8, 0.4);
  armR.castShadow = true;
  bossGroup.add(armR);

  // The Policeman inside the cockpit (low poly capsule look)
  const innerGuard = new THREE.Group();
  innerGuard.position.set(0, 1.6, 0.1);
  innerGuard.scale.set(0.7, 0.7, 0.7);

  const gBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0x1e3a8a }));
  gBody.position.y = 0.4;
  innerGuard.add(gBody);

  const gHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
  gHead.position.y = 0.9;
  innerGuard.add(gHead);

  const gHat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.08, 8), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
  gHat.position.y = 1.0;
  innerGuard.add(gHat);

  bossGroup.add(innerGuard);
  scene.add(bossGroup);

  // 7. Lighting
  // Super bright ambient light for complete visibility
  const ambient = new THREE.AmbientLight(0xffffff, 1.6);
  scene.add(ambient);

  // Ceiling floodlights
  const pLight = new THREE.PointLight(0xffffff, 3.5, 40);
  pLight.position.set(0, height - 1.0, 0);
  pLight.castShadow = true;
  scene.add(pLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(0, height - 0.5, 0);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // Red alert spinning spotlight (visual effect)
  const redAlertLight = new THREE.PointLight(0xef4444, 2.5, 25);
  redAlertLight.position.set(0, height - 1.5, 0);
  scene.add(redAlertLight);

  // 8. Boss state
  let bossHealth = 100;
  let flashTimer = 0;
  let fireTimer = 1.0; // Firing timer
  const laserProjectiles = [];

  // Expose boss hit bounds & health control
  const levelData = {
    spawnPosition: { x: 0, y: 0.1, z: 8.0 },
    spawnYaw: 0,
    playerHeight: 1.8,
    playerSpeed: 4.5,
    jumpForce: 7.5,
    objective: "אסוף את הרובה מהמרכז (E) והילחם ברובוט השוטר!",
    
    // Check bullet collision
    getBossAABB: () => {
      // Returns AABB of the boss
      const pos = bossGroup.position;
      return new AABB(
        { x: pos.x - 1.2, y: pos.y, z: pos.z - 1.0 },
        { x: pos.x + 1.2, y: pos.y + 2.7, z: pos.z + 1.0 },
        'boss_robot'
      );
    },

    takeDamage: (amount, stateManager) => {
      if (bossHealth <= 0) return;
      bossHealth -= amount;
      if (bossHealth < 0) bossHealth = 0;

      // Update HUD Health Bar
      const fill = document.getElementById('boss-hp-fill');
      if (fill) fill.style.width = `${bossHealth}%`;

      // Flash boss red
      flashTimer = 0.15;
      bossGroup.traverse((child) => {
        if (child.isMesh && child.material && child !== cockpitGlass) {
          child.material.color.setHex(0xef4444);
        }
      });

      // Check for death
      if (bossHealth <= 0) {
        // Trigger explosion scale and win!
        bossGroup.scale.set(0.1, 0.1, 0.1); // simple shrink effect
        stateManager.winGame();
      }
    },

    // AI Loop
    update: (player, dt, stateManager) => {
      // 1. Move toward player
      const dx = player.position.x - bossGroup.position.x;
      const dz = player.position.z - bossGroup.position.z;
      const dist2D = Math.sqrt(dx * dx + dz * dz);

      if (dist2D > 3.0 && bossHealth > 0) {
        const speed = 1.8;
        bossGroup.position.x += (dx / dist2D) * speed * dt;
        bossGroup.position.z += (dz / dist2D) * speed * dt;
        
        // Rotate to face player
        bossGroup.rotation.y = Math.atan2(dx, dz);
      }

      // Reset flash color after timer
      if (flashTimer > 0) {
        flashTimer -= dt;
        if (flashTimer <= 0) {
          // Reset to default colors
          legL.material.color.setHex(0x1f2937);
          legR.material.color.setHex(0x1f2937);
          cockpitHousing.material.color.setHex(0x1f2937);
          armL.material.color.setHex(0x1f2937);
          armR.material.color.setHex(0x1f2937);
          gBody.material.color.setHex(0x1e3a8a);
          gHead.material.color.setHex(0xffdbac);
          gHat.material.color.setHex(0x0f172a);
        }
      }

      // 2. Boss firing lasers AI
      if (bossHealth > 0) {
        fireTimer -= dt;
        if (fireTimer <= 0) {
          fireTimer = 1.4; // fire every 1.4 seconds
          
          // Spawn two energy laser bolts (red basic cylinders)
          const spawnLasers = [
            // Left cannon position
            new THREE.Vector3(-0.9, 1.8, 0.8).applyMatrix4(bossGroup.matrixWorld),
            // Right cannon position
            new THREE.Vector3(0.9, 1.8, 0.8).applyMatrix4(bossGroup.matrixWorld)
          ];

          // Direction pointing toward player
          const dir = new THREE.Vector3(
            player.position.x - bossGroup.position.x,
            player.position.y + 0.9 - 1.8, // center height target
            player.position.z - bossGroup.position.z
          ).normalize();

          spawnLasers.forEach((pos) => {
            const laserMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
            const laserGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6);
            const laserMesh = new THREE.Mesh(laserGeo, laserMat);
            laserMesh.rotation.x = Math.PI / 2;
            laserMesh.position.copy(pos);
            scene.add(laserMesh);

            laserProjectiles.push({
              mesh: laserMesh,
              dir: dir,
              speed: 12.0, // bullet speed
              lifetime: 3.0 // 3 seconds before cleanup
            });
          });
        }
      }

      // 3. Update active laser projectiles
      for (let i = laserProjectiles.length - 1; i >= 0; i--) {
        const lp = laserProjectiles[i];
        
        // Move laser forward
        lp.mesh.position.addScaledVector(lp.dir, lp.speed * dt);
        lp.lifetime -= dt;

        // Check collision with player
        const distToPlayer = lp.mesh.position.distanceTo(
          new THREE.Vector3(player.position.x, player.position.y + player.height/2, player.position.z)
        );

        if (distToPlayer < 0.7) {
          // Player hit!
          player.hp -= 15; // Lose 15 HP
          document.getElementById('player-hp').innerText = player.hp;

          // Flash HUD red
          const hud = document.getElementById('hud');
          hud.style.boxShadow = 'inset 0 0 50px rgba(239, 68, 68, 0.8)';
          setTimeout(() => {
            hud.style.boxShadow = 'none';
          }, 150);

          if (player.hp <= 0) {
            player.hp = 0;
            document.getElementById('player-hp').innerText = 0;
            stateManager.caughtByGuard(); // Caught (restart level)
          }

          // Destroy laser
          scene.remove(lp.mesh);
          laserProjectiles.splice(i, 1);
          continue;
        }

        // Clean up old lasers
        if (lp.lifetime <= 0) {
          scene.remove(lp.mesh);
          laserProjectiles.splice(i, 1);
        }
      }
    },

    // Clean up lasers on level unload
    unload: () => {
      laserProjectiles.forEach((lp) => scene.remove(lp.mesh));
      laserProjectiles.length = 0;
      
      // Hide health bar
      const bar = document.getElementById('boss-health-bar');
      if (bar) bar.classList.remove('active');
    }
  };

  return levelData;
}
