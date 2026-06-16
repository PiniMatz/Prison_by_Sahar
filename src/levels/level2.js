import * as THREE from 'three';
import { AABB } from '../physics.js';
import { 
  createMetalPlateTexture, 
  createGrateTexture,
  createConcreteFloorTexture 
} from '../textures.js';

// Helper to create a procedural skull
function createSkullMesh() {
  const skullGroup = new THREE.Group();
  const skullMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xdddbd0, 
    roughness: 0.9 
  });
  const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x0c0c0c });

  // Main skull dome
  const domeGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const dome = new THREE.Mesh(domeGeo, skullMaterial);
  dome.scale.set(1, 1.1, 1.2);
  skullGroup.add(dome);

  // Jaw/Teeth area
  const jawGeo = new THREE.BoxGeometry(0.1, 0.08, 0.08);
  const jaw = new THREE.Mesh(jawGeo, skullMaterial);
  jaw.position.set(0, -0.07, 0.08);
  skullGroup.add(jaw);

  // Eye Sockets (left and right)
  const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, blackMaterial);
  eyeL.position.set(0.04, 0.01, 0.1);
  const eyeR = new THREE.Mesh(eyeGeo, blackMaterial);
  eyeR.position.set(-0.04, 0.01, 0.1);
  skullGroup.add(eyeL);
  skullGroup.add(eyeR);

  // Nose socket
  const noseGeo = new THREE.ConeGeometry(0.012, 0.03, 4);
  const nose = new THREE.Mesh(noseGeo, blackMaterial);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.03, 0.11);
  skullGroup.add(nose);

  skullGroup.castShadow = true;
  return skullGroup;
}

// Helper to create a procedural limb bone
function createBoneMesh() {
  const boneGroup = new THREE.Group();
  const boneMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xdddbd0, 
    roughness: 0.9 
  });

  // Shaft
  const shaftGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.45, 8);
  const shaft = new THREE.Mesh(shaftGeo, boneMaterial);
  shaft.rotation.x = Math.PI / 2;
  boneGroup.add(shaft);

  // Knuckles (2 spheres at each end)
  const knuckleGeo = new THREE.SphereGeometry(0.032, 8, 8);
  
  const k1 = new THREE.Mesh(knuckleGeo, boneMaterial); k1.position.set(0.02, 0, -0.22); boneGroup.add(k1);
  const k2 = new THREE.Mesh(knuckleGeo, boneMaterial); k2.position.set(-0.02, 0, -0.22); boneGroup.add(k2);
  const k3 = new THREE.Mesh(knuckleGeo, boneMaterial); k3.position.set(0.02, 0, 0.22); boneGroup.add(k3);
  const k4 = new THREE.Mesh(knuckleGeo, boneMaterial); k4.position.set(-0.02, 0, 0.22); boneGroup.add(k4);

  boneGroup.castShadow = true;
  return boneGroup;
}

export function loadLevel2(scene, obstacles, interactiveObjects) {
  // Clear scene
  while(scene.children.length > 0) { 
    scene.remove(scene.children[0]); 
  }

  // Create Materials
  const metalTex = createMetalPlateTexture();
  metalTex.repeat.set(1, 1);
  const wallMat = new THREE.MeshStandardMaterial({
    map: metalTex,
    roughness: 0.4,
    metalness: 0.8
  });

  // Ceiling and Floor can be similar metal plates
  const floorCeilMat = new THREE.MeshStandardMaterial({
    map: metalTex,
    roughness: 0.5,
    metalness: 0.7
  });

  // Dimensions of L-shaped Tunnel
  // Segment 1 (goes straight forward along -Z, from Z = 2.0 to Z = -10.0 at X = 0)
  // Segment 2 (turns right along +X, from X = 0 to X = 12.0 at Z = -10.0)
  const ductW = 1.3;
  const ductH = 1.0;

  // Helpers to spawn wall segments (so they look like panels)
  function createDuctSegment(start, end, dir) {
    // dir can be 'Z' or 'X'
    if (dir === 'Z') {
      const length = Math.abs(end - start);
      const centerZ = (start + end) / 2;

      // Floor
      const floorGeo = new THREE.PlaneGeometry(ductW, length);
      const floor = new THREE.Mesh(floorGeo, floorCeilMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, 0, centerZ);
      floor.receiveShadow = true;
      scene.add(floor);

      // Ceiling
      const ceilingGeo = new THREE.PlaneGeometry(ductW, length);
      const ceiling = new THREE.Mesh(ceilingGeo, floorCeilMat);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(0, ductH, centerZ);
      scene.add(ceiling);

      // Left Wall (X = -ductW/2)
      const leftWallGeo = new THREE.PlaneGeometry(length, ductH);
      const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
      leftWall.rotation.y = Math.PI / 2;
      leftWall.position.set(-ductW/2, ductH/2, centerZ);
      leftWall.receiveShadow = true;
      scene.add(leftWall);

      // Right Wall (X = ductW/2) - only up to Z = -8.7, so we can turn right
      const rightWallGeo = new THREE.PlaneGeometry(length, ductH);
      const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
      rightWall.rotation.y = -Math.PI / 2;
      rightWall.position.set(ductW/2, ductH/2, centerZ);
      rightWall.receiveShadow = true;
      scene.add(rightWall);
    } 
    else if (dir === 'X') {
      const length = Math.abs(end - start);
      const centerX = (start + end) / 2;
      const zLoc = -10.0;

      // Floor
      const floorGeo = new THREE.PlaneGeometry(length, ductW);
      const floor = new THREE.Mesh(floorGeo, floorCeilMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(centerX, 0, zLoc);
      floor.receiveShadow = true;
      scene.add(floor);

      // Ceiling
      const ceilingGeo = new THREE.PlaneGeometry(length, ductW);
      const ceiling = new THREE.Mesh(ceilingGeo, floorCeilMat);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(centerX, ductH, zLoc);
      scene.add(ceiling);

      // Back Wall (Z = -10.0 - ductW/2)
      const backWallGeo = new THREE.PlaneGeometry(length, ductH);
      const backWall = new THREE.Mesh(backWallGeo, wallMat);
      backWall.position.set(centerX, ductH/2, zLoc - ductW/2);
      backWall.receiveShadow = true;
      scene.add(backWall);

      // Front Wall (Z = -10.0 + ductW/2)
      const frontWallGeo = new THREE.PlaneGeometry(length, ductH);
      const frontWall = new THREE.Mesh(frontWallGeo, wallMat);
      frontWall.rotation.y = Math.PI;
      frontWall.position.set(centerX, ductH/2, zLoc + ductW/2);
      frontWall.receiveShadow = true;
      scene.add(frontWall);
    }
  }

  // Draw Segment 1 (Z goes from 2.0 to -10.0)
  createDuctSegment(2.0, -10.0, 'Z');
  // Draw Segment 2 (X goes from 0.0 to 12.0)
  createDuctSegment(0.0, 12.0, 'X');

  // Closed start wall at Z = 2.0
  const startWallGeo = new THREE.PlaneGeometry(ductW, ductH);
  const startWall = new THREE.Mesh(startWallGeo, wallMat);
  startWall.position.set(0, ductH/2, 2.0);
  scene.add(startWall);

  // Set up solid boundaries/AABB obstacles for the physics engine
  // Global floor and ceiling
  obstacles.push(new AABB({ x: -10, y: -0.5, z: -20 }, { x: 20, y: 0, z: 10 }, 'vent_floor'));
  obstacles.push(new AABB({ x: -10, y: ductH, z: -20 }, { x: 20, y: ductH + 0.5, z: 10 }, 'vent_ceiling'));

  // Segment 1 walls:
  obstacles.push(new AABB({ x: -ductW/2 - 0.5, y: 0, z: -10.65 }, { x: -ductW/2, y: ductH, z: 2.5 }, 's1_left_wall'));
  // Start wall blocker
  obstacles.push(new AABB({ x: -ductW/2, y: 0, z: 2.0 }, { x: ductW/2, y: ductH, z: 2.5 }, 's1_start_wall'));
  // Right wall has a gap around Z = -10 for the turn (so it ends at -10 + ductW/2 = -9.35)
  obstacles.push(new AABB({ x: ductW/2, y: 0, z: -9.35 }, { x: ductW/2 + 0.5, y: ductH, z: 2.5 }, 's1_right_wall'));

  // Segment 2 walls:
  // Back wall blocker (along Z = -10 - ductW/2 = -10.65)
  obstacles.push(new AABB({ x: -ductW/2, y: 0, z: -10.65 - 0.5 }, { x: 12.5, y: ductH, z: -10.65 }, 's2_back_wall'));
  // Front wall blocker (along Z = -10 + ductW/2 = -9.35)
  obstacles.push(new AABB({ x: ductW/2, y: 0, z: -9.35 }, { x: 12.5, y: ductH, z: -9.35 + 0.5 }, 's2_front_wall'));

  // 7. Scatter Bones & Skulls along the floor
  const bonesContainer = new THREE.Group();

  // Skeleton pile 1 (Z = -4.0, X = -0.2)
  const skull1 = createSkullMesh();
  skull1.position.set(-0.2, 0.1, -4.0);
  skull1.rotation.set(0.2, 0.5, -0.3);
  bonesContainer.add(skull1);

  const b1 = createBoneMesh();
  b1.position.set(-0.1, 0.03, -4.2);
  b1.rotation.set(Math.PI/2, 0.3, 0.9);
  bonesContainer.add(b1);

  const b2 = createBoneMesh();
  b2.position.set(-0.3, 0.03, -3.9);
  b2.rotation.set(0, 0.8, -0.4);
  bonesContainer.add(b2);

  // Skeleton pile 2 - In the corner (X = 0, Z = -9.9) - a complete failed escapee skeleton!
  const skull2 = createSkullMesh();
  skull2.position.set(0, 0.1, -10.1);
  skull2.rotation.set(-0.1, -0.8, 0.2);
  bonesContainer.add(skull2);

  for(let i=0; i<4; i++) {
    const bone = createBoneMesh();
    bone.position.set((Math.random()-0.5)*0.3, 0.03, -10.0 + (Math.random()-0.5)*0.3);
    bone.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    bonesContainer.add(bone);
  }

  // Skeleton pile 3 (X = 5.5, Z = -10.0)
  const skull3 = createSkullMesh();
  skull3.position.set(5.5, 0.1, -10.05);
  skull3.rotation.set(0, 0, Math.PI); // upside down skull!
  bonesContainer.add(skull3);

  const b3 = createBoneMesh();
  b3.position.set(5.8, 0.03, -9.9);
  b3.rotation.set(0.5, 1.2, 0);
  bonesContainer.add(b3);

  // Skeleton pile 4 (X = 9.0, Z = -9.8)
  const b4 = createBoneMesh();
  b4.position.set(9.0, 0.03, -9.85);
  b4.rotation.set(-0.2, 0.5, 1.5);
  bonesContainer.add(b4);

  const b5 = createBoneMesh();
  b5.position.set(9.1, 0.03, -10.0);
  b5.rotation.set(0.8, -0.6, 0.2);
  bonesContainer.add(b5);

  scene.add(bonesContainer);

  // 8. Exit Grate (at X = 12.0, Z = -10.0)
  const grateTex = createGrateTexture();
  const grateMat = new THREE.MeshStandardMaterial({
    map: grateTex,
    transparent: true,
    side: THREE.DoubleSide
  });

  const exitGrateGroup = new THREE.Group();
  exitGrateGroup.position.set(12.0, ductH/2, -10.0);

  const grateGeo = new THREE.PlaneGeometry(ductW, ductH);
  const grateMesh = new THREE.Mesh(grateGeo, grateMat);
  grateMesh.rotation.y = Math.PI / 2; // Face perpendicular to X axis
  exitGrateGroup.add(grateMesh);
  scene.add(exitGrateGroup);

  // Closed end wall blocker beyond the grate
  obstacles.push(new AABB({ x: 12.0, y: 0, z: -10.0 - ductW/2 }, { x: 12.5, y: ductH, z: -10.0 + ductW/2 }, 'vent_exit_wall'));

  const interactiveExit = {
    mesh: exitGrateGroup,
    // Trigger zone: near the end of the duct
    trigger: new AABB({ x: 10.8, y: 0, z: -10.0 - ductW/2 }, { x: 12.0, y: ductH, z: -10.0 + ductW/2 }, 'exit_trigger'),
    action: (stateManager) => {
      // Transition to Level 3
      stateManager.changeLevel(3);
    },
    promptMessage: "פתח את פתח האוורור וזחל החוצה (E)"
  };
  interactiveObjects.push(interactiveExit);

  // 9. Lighting
  // Very dim ambient light for tunnel mood
  const ambientLight = new THREE.AmbientLight(0x0c0f12, 0.3);
  scene.add(ambientLight);

  // Dim green emergency lights along the ceiling
  const lightColor = 0x22ff44; // Greenish
  const lightPositions = [
    [0, -2],
    [0, -6],
    [0, -9.5],
    [3.5, -10],
    [7.5, -10],
    [10.5, -10]
  ];

  const lightCapGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 8);
  const lightCapMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
  const bulbGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const bulbMat = new THREE.MeshBasicMaterial({ color: lightColor });

  lightPositions.forEach(([lx, lz]) => {
    // Cap
    const cap = new THREE.Mesh(lightCapGeo, lightCapMat);
    cap.position.set(lx, ductH - 0.025, lz);
    scene.add(cap);

    // Bulb
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(lx, ductH - 0.05, lz);
    scene.add(bulb);

    // Point Light
    const pLight = new THREE.PointLight(lightColor, 0.8, 4.5);
    pLight.position.set(lx, ductH - 0.1, lz);
    pLight.castShadow = true;
    pLight.shadow.bias = -0.002;
    scene.add(pLight);
  });

  // Level initial state parameters
  return {
    spawnPosition: { x: 0, y: 0.01, z: 1.0 },
    spawnYaw: 0, // Facing straight forward (Z negative)
    playerHeight: 0.65, // Crawling height!
    playerSpeed: 1.8,   // Crawling speed (slower)
    jumpForce: 0.0,     // No jumping in vents!
    objective: "זחל בתעלת האוורור המפותלת, מצא את דרכך ועבור לחדר הבא בקצה."
  };
}
