import * as THREE from "three";

// 1. Initialize Scene, Camera, and Renderer
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth * 0.9, window.innerHeight * 0.9);
document.body.appendChild(renderer.domElement);

// 2. Create Geometry, Material, and Mesh
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true,
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 3. Handle Window Resizing
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width * 0.9, height * 0.9);
});

// 4. Animation Loop
function animate(): void {
  requestAnimationFrame(animate);

  // Rotate mesh safely using built-in properties
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render(scene, camera);
}

animate();
