export class AABB {
  constructor(min, max, label = '') {
    this.min = { x: min.x, y: min.y, z: min.z };
    this.max = { x: max.x, y: max.y, z: max.z };
    this.label = label; // useful for debugging
  }
}

export function checkOverlap(a, b) {
  return (
    a.min.x < b.max.x && a.max.x > b.min.x &&
    a.min.y < b.max.y && a.max.y > b.min.y &&
    a.min.z < b.max.z && a.max.z > b.min.z
  );
}

// Bounding box for player based on their height and a horizontal radius
export function getPlayerBox(position, height, radius = 0.3) {
  return new AABB(
    { x: position.x - radius, y: position.y, z: position.z - radius },
    { x: position.x + radius, y: position.y + height, z: position.z + radius }
  );
}

// Main physics update loop for character movement
export function updatePlayerPhysics(player, dt, obstacles, ladders = [], gravity = 22) {
  // Check if player is touching a ladder
  let isOnLadder = false;
  let playerBox = getPlayerBox(player.position, player.height);
  for (const ladder of ladders) {
    if (checkOverlap(playerBox, ladder)) {
      isOnLadder = true;
      break;
    }
  }

  // Apply gravity or ladder climbing
  if (isOnLadder) {
    player.velocityY = 0;
    player.isGrounded = true; // allow jumping off the ladder
    
    // Climb up/down using Up/Down arrows
    if (player.keys['ArrowUp']) {
      player.position.y += player.speed * 0.7 * dt;
    }
    if (player.keys['ArrowDown']) {
      player.position.y -= player.speed * 0.7 * dt;
    }
  } else {
    // Apply gravity
    if (!player.isGrounded) {
      player.velocityY -= gravity * dt;
      // Terminal velocity to prevent falling through floor at extreme speeds
      if (player.velocityY < -35) player.velocityY = -35;
    }
  }

  // Calculate movement direction based on key inputs or virtual joystick
  let moveX = 0;
  let moveZ = 0;

  const joystick = player.joystick || { x: 0, y: 0 };

  if (joystick.y !== 0) {
    // y is negative for forward (dragged up) and positive for backward (dragged down)
    const speedFactor = -joystick.y; // positive for forward, negative for backward
    moveX += -Math.sin(player.yaw) * player.speed * speedFactor;
    moveZ += -Math.cos(player.yaw) * player.speed * speedFactor;
  } else {
    if (player.keys['ArrowUp']) {
      moveX += -Math.sin(player.yaw) * player.speed;
      moveZ += -Math.cos(player.yaw) * player.speed;
    }
    if (player.keys['ArrowDown']) {
      moveX += Math.sin(player.yaw) * player.speed;
      moveZ += Math.cos(player.yaw) * player.speed;
    }
  }

  // Yaw Rotation (turning head/body left and right)
  const turnSpeed = 2.0; // Rads per sec
  if (joystick.x !== 0) {
    // x is positive for right (clockwise rotation) and negative for left (counter-clockwise)
    player.yaw -= joystick.x * turnSpeed * dt;
  } else {
    if (player.keys['ArrowLeft']) {
      player.yaw += turnSpeed * dt;
    }
    if (player.keys['ArrowRight']) {
      player.yaw -= turnSpeed * dt;
    }
  }

  // Jump control (only if player doesn't have a gun)
  if (player.keys[' '] && player.isGrounded && !player.hasGun) {
    player.velocityY = player.jumpForce;
    player.isGrounded = false;
  }

  const dx = moveX * dt;
  const dz = moveZ * dt;
  const dy = player.velocityY * dt;

  // 1. Move Y first and resolve vertical collisions
  player.position.y += dy;
  player.isGrounded = false;

  playerBox = getPlayerBox(player.position, player.height);

  for (const obstacle of obstacles) {
    if (checkOverlap(playerBox, obstacle)) {
      if (dy < 0) { // Moving down (falling)
        // Land on top
        player.position.y = obstacle.max.y;
        player.velocityY = 0;
        player.isGrounded = true;
      } else if (dy > 0) { // Moving up (jumping)
        // Hit ceiling/bottom of object
        player.position.y = obstacle.min.y - player.height;
        player.velocityY = 0;
      }
      playerBox = getPlayerBox(player.position, player.height); // Update box after change
    }
  }

  // 2. Move X and resolve collisions (with step-up logic for stairs)
  if (dx !== 0) {
    const originalY = player.position.y;
    player.position.x += dx;
    playerBox = getPlayerBox(player.position, player.height);

    let collided = false;
    let collidingObstacle = null;
    for (const obstacle of obstacles) {
      if (checkOverlap(playerBox, obstacle)) {
        collided = true;
        collidingObstacle = obstacle;
        break;
      }
    }

    if (collided) {
      // Step-up logic: if the colliding object's top is lower than stepHeight, try stepping up
      const maxStepHeight = 0.35;
      const heightDiff = collidingObstacle.max.y - originalY;
      if (heightDiff > 0 && heightDiff <= maxStepHeight) {
        player.position.y = collidingObstacle.max.y;
        playerBox = getPlayerBox(player.position, player.height);

        let stepCollided = false;
        for (const obs of obstacles) {
          if (checkOverlap(playerBox, obs)) {
            stepCollided = true;
            break;
          }
        }
        if (stepCollided) {
          // Can't step up, revert X and Y
          player.position.x -= dx;
          player.position.y = originalY;
        } else {
          // Stepped up successfully!
          player.isGrounded = true;
          player.velocityY = 0;
        }
      } else {
        // Cannot step up, revert X movement
        player.position.x -= dx;
      }
    }
  }

  // 3. Move Z and resolve collisions (with step-up logic)
  if (dz !== 0) {
    const originalY = player.position.y;
    player.position.z += dz;
    playerBox = getPlayerBox(player.position, player.height);

    let collided = false;
    let collidingObstacle = null;
    for (const obstacle of obstacles) {
      if (checkOverlap(playerBox, obstacle)) {
        collided = true;
        collidingObstacle = obstacle;
        break;
      }
    }

    if (collided) {
      const maxStepHeight = 0.35;
      const heightDiff = collidingObstacle.max.y - originalY;
      if (heightDiff > 0 && heightDiff <= maxStepHeight) {
        player.position.y = collidingObstacle.max.y;
        playerBox = getPlayerBox(player.position, player.height);

        let stepCollided = false;
        for (const obs of obstacles) {
          if (checkOverlap(playerBox, obs)) {
            stepCollided = true;
            break;
          }
        }
        if (stepCollided) {
          player.position.z -= dz;
          player.position.y = originalY;
        } else {
          player.isGrounded = true;
          player.velocityY = 0;
        }
      } else {
        player.position.z -= dz;
      }
    }
  }
}
