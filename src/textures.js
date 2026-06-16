import * as THREE from 'three';

// Procedural texture: Prison Brick Wall
export function createBrickWallTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base cement/dark stone color
  ctx.fillStyle = '#2b2c2e';
  ctx.fillRect(0, 0, 512, 512);

  // Add fine noise/grain
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 15;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));     // R
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise)); // G
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise)); // B
  }
  ctx.putImageData(imgData, 0, 0);

  // Draw mortar joints/lines
  ctx.strokeStyle = '#141415';
  ctx.lineWidth = 3;
  
  const rows = 16;
  const rowHeight = 512 / rows;
  const cols = 8;
  const colWidth = 512 / cols;

  for (let r = 0; r <= rows; r++) {
    const y = r * rowHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight;
    // Shift every second row (running bond pattern)
    const xOffset = (r % 2) * (colWidth / 2);
    for (let c = 0; c <= cols + 1; c++) {
      const x = c * colWidth - xOffset;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowHeight);
      ctx.stroke();
    }
  }

  // Add aging effects, dirt streaks, mold/rust water stains
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * 512, 
      Math.random() * 512, 
      Math.random() * 40 + 20, 
      Math.random() * 80 + 30, 
      Math.random() * Math.PI, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
  }

  // Draw some simulated cracks
  ctx.strokeStyle = 'rgba(10, 10, 10, 0.7)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    let cx = Math.random() * 512;
    let cy = Math.random() * 512;
    ctx.moveTo(cx, cy);
    for (let j = 0; j < 5; j++) {
      cx += (Math.random() - 0.5) * 30;
      cy += (Math.random() - 0.2) * 25; // cracks tend to go down
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Procedural texture: Concrete Floor
export function createConcreteFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base concrete grey
  ctx.fillStyle = '#424549';
  ctx.fillRect(0, 0, 512, 512);

  // High intensity noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Dirt & grime spots
  ctx.fillStyle = 'rgba(20, 15, 10, 0.15)'; // brownish dirt
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 50 + 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw expansion joint lines (concrete plates)
  ctx.strokeStyle = '#222325';
  ctx.lineWidth = 4;
  ctx.beginPath();
  // Horizontal line in the middle
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  // Vertical line in the middle
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Procedural texture: Metal Plate (for vents)
export function createMetalPlateTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Metal grey
  ctx.fillStyle = '#6e737a';
  ctx.fillRect(0, 0, 256, 256);

  // Noise
  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Highlight/shadow bevel at edges to make plates pop
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(0, 0, 256, 5); // top
  ctx.fillRect(0, 0, 5, 256); // left

  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(0, 251, 256, 5); // bottom
  ctx.fillRect(251, 0, 5, 256); // right

  // Draw steel plate rivets in the corners
  ctx.fillStyle = '#3c3f44';
  ctx.strokeStyle = '#9ea5af';
  ctx.lineWidth = 1;

  const rivets = [
    [20, 20], [236, 20],
    [20, 236], [236, 236]
  ];

  rivets.forEach(([rx, ry]) => {
    ctx.beginPath();
    ctx.arc(rx, ry, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rivet highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(rx - 2, ry - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3c3f44'; // reset
  });

  // Scratches
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const sx = Math.random() * 256;
    const sy = Math.random() * 256;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 40, sy + (Math.random() - 0.5) * 40);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Procedural texture: Rusty Pipe
export function createRustyPipeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Base metal/iron color (dark gray-blue)
  ctx.fillStyle = '#474c52';
  ctx.fillRect(0, 0, 256, 256);

  // Noise
  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Add patches of orange/brown rust
  ctx.fillStyle = '#8f4e1f'; // dark rust
  for (let i = 0; i < 15; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 12 + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#c9772e'; // bright rust highlights
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 6 + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Longitudinal metal ridges
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 256; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Procedural texture: Ventilation Grate (with transparent slots)
export function createGrateTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Start fully transparent
  ctx.clearRect(0, 0, 256, 256);

  // Draw frame border (metal)
  ctx.fillStyle = '#4c5159';
  ctx.fillRect(0, 0, 256, 256);

  // Draw inside cutout (dark/transparent mask)
  ctx.fillStyle = 'rgba(10, 10, 12, 0.95)';
  ctx.fillRect(15, 15, 226, 226);

  // Draw metal bars
  ctx.fillStyle = '#5c636d';
  
  // Horizontal bars
  const barCount = 10;
  const step = 226 / (barCount + 1);
  for (let i = 1; i <= barCount; i++) {
    const y = 15 + i * step;
    ctx.fillRect(15, y - 3, 226, 6);
  }

  // Vertical support bars (left and right and center)
  ctx.fillRect(15 + 226/3 - 4, 15, 8, 226);
  ctx.fillRect(15 + (226*2)/3 - 4, 15, 8, 226);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Procedural texture: Red / Green Indicator Button
export function createButtonTexture(colorStr = 'red') {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Dark background pedestal
  ctx.fillStyle = '#1e2124';
  ctx.fillRect(0, 0, 128, 128);

  // Metallic rim
  const grad = ctx.createLinearGradient(0, 0, 128, 128);
  grad.addColorStop(0, '#888');
  grad.addColorStop(0.5, '#444');
  grad.addColorStop(1, '#aaa');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 64, 50, 0, Math.PI * 2);
  ctx.fill();

  // Dark inside shadow
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(64, 64, 42, 0, Math.PI * 2);
  ctx.fill();

  // Glowing center button
  const radial = ctx.createRadialGradient(64, 64, 2, 64, 64, 38);
  if (colorStr === 'red') {
    radial.addColorStop(0, '#ff8888');
    radial.addColorStop(0.3, '#ff0000');
    radial.addColorStop(1, '#660000');
  } else {
    radial.addColorStop(0, '#88ff88');
    radial.addColorStop(0.3, '#00ff00');
    radial.addColorStop(1, '#006600');
  }

  ctx.fillStyle = radial;
  ctx.beginPath();
  ctx.arc(64, 64, 38, 0, Math.PI * 2);
  ctx.fill();

  // Glare highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.ellipse(54, 54, 12, 6, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
