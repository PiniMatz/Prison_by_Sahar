import * as THREE from 'three';
import { AABB } from '../physics.js';
import { 
  createBrickWallTexture, 
  createConcreteFloorTexture, 
  createRustyPipeTexture, 
  createGrateTexture 
} from '../textures.js';

export function loadLevel1(scene, obstacles, interactiveObjects) {
  // Clear scene
  while(scene.children.length > 0) { 
    scene.remove(scene.children[0]); 
  }

  // Create materials using our procedural textures
  const brickWallTex = createBrickWallTexture();
  brickWallTex.repeat.set(4, 4);
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    map: brickWallTex,
    roughness: 0.9,
    metalness: 0.1
  });

  const concreteFloorTex = createConcreteFloorTexture();
  concreteFloorTex.repeat.set(4, 4);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    map: concreteFloorTex,
    roughness: 0.8
  });

  const ceilingMaterial = new THREE.MeshStandardMaterial({ 
    map: concreteFloorTex, // Reuse concrete
    roughness: 0.9
  });

  const pipeTex = createRustyPipeTexture();
  pipeTex.repeat.set(4, 1);
  const pipeMaterial = new THREE.MeshStandardMaterial({ 
    map: pipeTex,
    roughness: 0.6,
    metalness: 0.8
  });

  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.4,
    metalness: 0.8
  });

  const mattressMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a635d, // prison green blanket
    roughness: 0.9
  });

  const pillowMaterial = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    roughness: 0.9
  });

  // Room Dimensions
  const width = 8;
  const depth = 8;
  const height = 7;

  // 1. Floor (Y = 0)
  const floorGeo = new THREE.PlaneGeometry(width, depth);
  const floor = new THREE.Mesh(floorGeo, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);
  obstacles.push(new AABB({ x: -width/2, y: -1, z: -depth/2 }, { x: width/2, y: 0, z: depth/2 }, 'floor'));

  // 2. Ceiling (Y = 7)
  const ceilingGeo = new THREE.PlaneGeometry(width, depth);
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  scene.add(ceiling);
  obstacles.push(new AABB({ x: -width/2, y: height, z: -depth/2 }, { x: width/2, y: height + 1, z: depth/2 }, 'ceiling'));

  // 3. Walls
  // Back Wall (Z = -4)
  const wallBackGeo = new THREE.PlaneGeometry(width, height);
  const wallBack = new THREE.Mesh(wallBackGeo, wallMaterial);
  wallBack.position.set(0, height / 2, -depth / 2);
  wallBack.receiveShadow = true;
  scene.add(wallBack);
  obstacles.push(new AABB({ x: -width/2, y: 0, z: -depth/2 - 1 }, { x: width/2, y: height, z: -depth/2 }, 'wall_back'));

  // Front Wall (Z = 4)
  const wallFrontGeo = new THREE.PlaneGeometry(width, height);
  const wallFront = new THREE.Mesh(wallFrontGeo, wallMaterial);
  wallFront.rotation.y = Math.PI;
  wallFront.position.set(0, height / 2, depth / 2);
  wallFront.receiveShadow = true;
  scene.add(wallFront);
  obstacles.push(new AABB({ x: -width/2, y: 0, z: depth/2 }, { x: width/2, y: height, z: depth/2 + 1 }, 'wall_front'));

  // Left Wall (X = -4)
  const wallLeftGeo = new THREE.PlaneGeometry(depth, height);
  const wallLeft = new THREE.Mesh(wallLeftGeo, wallMaterial);
  wallLeft.rotation.y = Math.PI / 2;
  wallLeft.position.set(-width / 2, height / 2, 0);
  wallLeft.receiveShadow = true;
  scene.add(wallLeft);
  obstacles.push(new AABB({ x: -width/2 - 1, y: 0, z: -depth/2 }, { x: -width/2, y: height, z: depth/2 }, 'wall_left'));

  // Right Wall (X = 4)
  const wallRightGeo = new THREE.PlaneGeometry(depth, height);
  const wallRight = new THREE.Mesh(wallRightGeo, wallMaterial);
  wallRight.rotation.y = -Math.PI / 2;
  wallRight.position.set(width / 2, height / 2, 0);
  wallRight.receiveShadow = true;
  scene.add(wallRight);
  obstacles.push(new AABB({ x: width/2, y: 0, z: -depth/2 }, { x: width/2 + 1, y: height, z: depth/2 }, 'wall_right'));

  // 4. Bunk Bed (Procedural 3D model)
  const bedGroup = new THREE.Group();
  bedGroup.position.set(-2.6, 0, -2.4); // Position in corner

  // Bed dimensions: W=1.2, H=3.0, L=2.4
  // 4 Corner Metal Posts
  const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.2, 8);
  const postFL = new THREE.Mesh(postGeo, metalMaterial); postFL.position.set(0.6, 1.6, 1.2); postFL.castShadow = true; bedGroup.add(postFL);
  const postFR = new THREE.Mesh(postGeo, metalMaterial); postFR.position.set(-0.6, 1.6, 1.2); postFR.castShadow = true; bedGroup.add(postFR);
  const postBL = new THREE.Mesh(postGeo, metalMaterial); postBL.position.set(0.6, 1.6, -1.2); postBL.castShadow = true; bedGroup.add(postBL);
  const postBR = new THREE.Mesh(postGeo, metalMaterial); postBR.position.set(-0.6, 1.6, -1.2); postBR.castShadow = true; bedGroup.add(postBR);

  // Bottom Mattress & Frame
  const frameGeo = new THREE.BoxGeometry(1.2, 0.08, 2.4);
  const bottomFrame = new THREE.Mesh(frameGeo, metalMaterial);
  bottomFrame.position.y = 0.4;
  bottomFrame.castShadow = true;
  bedGroup.add(bottomFrame);

  const matGeo = new THREE.BoxGeometry(1.1, 0.2, 2.3);
  const bottomMattress = new THREE.Mesh(matGeo, mattressMaterial);
  bottomMattress.position.y = 0.54;
  bottomMattress.receiveShadow = true;
  bedGroup.add(bottomMattress);

  // Top Mattress & Frame
  const topFrame = new THREE.Mesh(frameGeo, metalMaterial);
  topFrame.position.y = 2.1;
  topFrame.castShadow = true;
  bedGroup.add(topFrame);

  const topMattress = new THREE.Mesh(matGeo, mattressMaterial);
  topMattress.position.y = 2.24;
  topMattress.castShadow = true;
  bedGroup.add(topMattress);

  // Pillows
  const pillowGeo = new THREE.BoxGeometry(0.8, 0.08, 0.4);
  const pillowBottom = new THREE.Mesh(pillowGeo, pillowMaterial);
  pillowBottom.position.set(0, 0.65, -0.9);
  bedGroup.add(pillowBottom);

  const pillowTop = new THREE.Mesh(pillowGeo, pillowMaterial);
  pillowTop.position.set(0, 2.35, -0.9);
  bedGroup.add(pillowTop);

  // Ladder
  const ladderGroup = new THREE.Group();
  ladderGroup.position.set(0.6, 0, 0); // attached to outer side
  const ladderPostGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8);
  const lp1 = new THREE.Mesh(ladderPostGeo, metalMaterial); lp1.position.set(0, 1.1, 0.3); lp1.castShadow = true; ladderGroup.add(lp1);
  const lp2 = new THREE.Mesh(ladderPostGeo, metalMaterial); lp2.position.set(0, 1.1, -0.3); lp2.castShadow = true; ladderGroup.add(lp2);
  // Rungs
  const rungGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8);
  for(let i=0; i<6; i++) {
    const rung = new THREE.Mesh(rungGeo, metalMaterial);
    rung.rotation.x = Math.PI / 2;
    rung.position.set(0, 0.2 + i * 0.35, 0);
    rung.castShadow = true;
    ladderGroup.add(rung);
  }
  bedGroup.add(ladderGroup);

  scene.add(bedGroup);

  // Add Bunk Bed Physics Obstacles
  // Bottom Bed: X from -3.3 to -1.9, Z from -3.7 to -1.1, Y from 0 to 0.7
  obstacles.push(new AABB({ x: -3.3, y: 0, z: -3.7 }, { x: -1.9, y: 0.7, z: -1.1 }, 'bed_bottom'));
  // Top Bed: X from -3.3 to -1.9, Z from -3.7 to -1.1, Y from 2.0 to 2.45
  obstacles.push(new AABB({ x: -3.3, y: 2.0, z: -3.7 }, { x: -1.9, y: 2.45, z: -1.1 }, 'bed_top'));

  // 5. Water Pipe (Jumpable Parkour Object)
  // Horizontal pipe along the back wall (Z = -3.8) at height Y = 4.3
  const pipeLength = 6.0;
  const pipeRadius = 0.12;
  const pipeGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeLength, 12);
  const pipe = new THREE.Mesh(pipeGeo, pipeMaterial);
  pipe.rotation.z = Math.PI / 2;
  pipe.position.set(0.5, 4.3, -3.75); // Centered, slightly offset from back wall
  pipe.castShadow = true;
  pipe.receiveShadow = true;
  scene.add(pipe);

  // Vertical pipe connector leading down to floor
  const vertPipeGeo = new THREE.CylinderGeometry(pipeRadius * 0.8, pipeRadius * 0.8, 4.3, 12);
  const vertPipe = new THREE.Mesh(vertPipeGeo, pipeMaterial);
  vertPipe.position.set(3.4, 2.15, -3.75);
  vertPipe.castShadow = true;
  scene.add(vertPipe);

  // Pipe joints (small cylinders around the pipe for visual complexity)
  const jointGeo = new THREE.CylinderGeometry(pipeRadius + 0.02, pipeRadius + 0.02, 0.15, 12);
  const joint1 = new THREE.Mesh(jointGeo, metalMaterial);
  joint1.rotation.z = Math.PI/2;
  joint1.position.set(-1.5, 4.3, -3.75);
  scene.add(joint1);

  const joint2 = new THREE.Mesh(jointGeo, metalMaterial);
  joint2.rotation.z = Math.PI/2;
  joint2.position.set(2.0, 4.3, -3.75);
  scene.add(joint2);

  // Add Pipe Physics Obstacle
  // X from -2.5 to 3.5, Y from 4.18 to 4.42, Z from -3.9 to -3.6
  obstacles.push(new AABB({ x: -2.5, y: 4.15, z: -3.9 }, { x: 3.5, y: 4.45, z: -3.6 }, 'water_pipe'));

  // 6. Interactive Object: Ceiling Ventilation Grate
  const ventGrateTex = createGrateTexture();
  const ventMaterial = new THREE.MeshStandardMaterial({ 
    map: ventGrateTex,
    transparent: true,
    side: THREE.DoubleSide
  });

  const ventGroup = new THREE.Group();
  ventGroup.position.set(0, height - 0.01, 0); // Flat on the ceiling

  const grateGeo = new THREE.PlaneGeometry(1.4, 1.4);
  const grateMesh = new THREE.Mesh(grateGeo, ventMaterial);
  grateMesh.rotation.x = Math.PI / 2; // Flat facing down
  grateMesh.receiveShadow = true;
  ventGroup.add(grateMesh);

  scene.add(ventGroup);

  // Add interactive object structure
  const interactiveVent = {
    mesh: ventGroup,
    // Trigger zone: Player needs to stand on the pipe (which is at Y=4.3) or jump and be close to X=0, Z=0, Y > 5.2
    trigger: new AABB({ x: -1.2, y: 4.8, z: -1.2 }, { x: 1.2, y: 7.2, z: 1.2 }, 'vent_trigger'),
    action: (stateManager) => {
      // Transition to Level 2
      stateManager.changeLevel(2);
    },
    promptMessage: "פתח את תעלת האוורור (E)"
  };
  interactiveObjects.push(interactiveVent);

  // 7. Lighting
  // Ambient light for general dark visibility
  const ambientLight = new THREE.AmbientLight(0x444d66, 0.75);
  scene.add(ambientLight);

  // Main cell hanging bulb (PointLight)
  const bulbGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
  const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
  bulbMesh.position.set(0, height - 0.5, 0);
  
  // Wire for bulb
  const wireGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.5, 8);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const wireMesh = new THREE.Mesh(wireGeo, wireMat);
  wireMesh.position.set(0, height - 0.25, 0);
  scene.add(wireMesh);
  scene.add(bulbMesh);

  const cellLight = new THREE.PointLight(0xfff5e0, 3.2, 16);
  cellLight.position.set(0, height - 0.6, 0);
  cellLight.castShadow = true;
  cellLight.shadow.mapSize.width = 1024;
  cellLight.shadow.mapSize.height = 1024;
  cellLight.shadow.bias = -0.005;
  scene.add(cellLight);

  // Moonlight coming through cell bars (directional light from side)
  const moonLight = new THREE.DirectionalLight(0x5c7cfa, 1.2);
  moonLight.position.set(6, 4, 0);
  scene.add(moonLight);

  // Visual Prison bars (Cell door on right side)
  const barsGroup = new THREE.Group();
  barsGroup.position.set(3.9, 0, 0);
  
  const barMetalGeo = new THREE.CylinderGeometry(0.03, 0.03, height, 8);
  for(let z = -2.5; z <= 2.5; z += 0.5) {
    const bar = new THREE.Mesh(barMetalGeo, metalMaterial);
    bar.position.set(0, height/2, z);
    bar.castShadow = true;
    barsGroup.add(bar);
  }
  scene.add(barsGroup);
  // Add collision for bars so player can't walk out
  obstacles.push(new AABB({ x: 3.8, y: 0, z: -2.8 }, { x: 4.0, y: height, z: 2.8 }, 'bars_door'));

  // Player initial parameters
  return {
    spawnPosition: { x: 0, y: 0.1, z: 2.0 },
    spawnYaw: Math.PI, // Facing the bed/wall
    playerHeight: 1.8,
    playerSpeed: 3.5,
    jumpForce: 7.2,
    objective: "טפס על המיטה והצינור כדי להגיע לפתח האוורור בתקרה, ולחץ E לפתיחה.",
    ladders: [
      new AABB({ x: -2.15, y: 0, z: -2.8 }, { x: -1.85, y: 2.4, z: -2.0 }, 'ladder_bunkbed')
    ]
  };
}
