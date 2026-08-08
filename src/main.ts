import * as THREE from "three";

// --- 1. Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 3, 6);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- 2. Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 8, 5);
dirLight.castShadow = true;
scene.add(dirLight);

// --- 3. Creating the Constitution Book ---
const bookWidth = 2.0;
const bookHeight = 2.8;
const bookThickness = 0.4;
const coverThickness = 0.04;

const bookGroup = new THREE.Group();
scene.add(bookGroup);

// Colors representing the Kenyan Flag / National Theme
const coverColor = 0x006633; // Court / Republic Green
const goldColor = 0xffd700; // Gold text lettering
const pageColor = 0xf5f5dc; // Off-white / Cream paper pages

// A. The Inner Pages (Stays flat initially)
const pageGeo = new THREE.BoxGeometry(
  bookWidth - 0.05,
  bookThickness,
  bookHeight - 0.05,
);
const pageMat = new THREE.MeshStandardMaterial({
  color: pageColor,
  roughness: 0.8,
});
const pagesMesh = new THREE.Mesh(pageGeo, pageMat);
pagesMesh.position.set(0, 0, 0);
bookGroup.add(pagesMesh);

// B. The Back Cover (Stays flat at the bottom)
const backCoverGeo = new THREE.BoxGeometry(
  bookWidth + 0.05,
  coverThickness,
  bookHeight + 0.05,
);
const coverMat = new THREE.MeshStandardMaterial({
  color: coverColor,
  roughness: 0.5,
});
const backCoverMesh = new THREE.Mesh(backCoverGeo, coverMat);
backCoverMesh.position.set(0, -(bookThickness / 2 + coverThickness / 2), 0);
bookGroup.add(backCoverMesh);

// C. The Spine
const spineGeo = new THREE.BoxGeometry(
  coverThickness,
  bookThickness + coverThickness * 2,
  bookHeight + 0.05,
);
const spineMesh = new THREE.Mesh(spineGeo, coverMat);
spineMesh.position.set(-(bookWidth / 2 + coverThickness / 2), 0, 0);
bookGroup.add(spineMesh);

// D. Front Cover with Edge Hinge Pivot (Crucial for Opening Animation)
const frontCoverPivot = new THREE.Group();
// Shift pivot point to the left edge of the book spine
frontCoverPivot.position.set(-(bookWidth / 2), bookThickness / 2, 0);
bookGroup.add(frontCoverPivot);

const frontCoverGeo = new THREE.BoxGeometry(
  bookWidth,
  coverThickness,
  bookHeight + 0.05,
);

// Multi-material to put the Gold Coat of Arms / Text on the front face
const goldTextMat = new THREE.MeshStandardMaterial({
  color: goldColor,
  roughness: 0.3,
});
const frontCoverMaterials = [
  coverMat, // right
  coverMat, // left
  goldTextMat, // top face (Where the "Constitution" title goes)
  coverMat, // bottom face
  coverMat, // front
  coverMat, // back
];

const frontCoverMesh = new THREE.Mesh(frontCoverGeo, frontCoverMaterials);
// Offset mesh inside the group so its left edge aligns perfectly with the pivot center
frontCoverMesh.position.set(bookWidth / 2, coverThickness / 2, 0);
frontCoverPivot.add(frontCoverMesh);

// Slightly tilt the whole book for a better 3D presentation
bookGroup.rotation.set(0.3, -0.4, 0);

// --- 4. Interaction & Animation Logic ---
let isOpen = false;
let targetRotation = 0;
const animationSpeed = 0.05;

// Raycasting to handle clicks accurately on the 3D canvas
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
  // Normalize mouse coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Check if user clicked any part of our book group
  const intersects = raycaster.intersectObjects(bookGroup.children, true);

  if (intersects.length > 0) {
    isOpen = !isOpen;
    // Rotate around Z axis to flap open sideways
    targetRotation = isOpen ? Math.PI * 0.85 : 0;
  }
});

// --- 5. Window Resize Handler ---
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 6. Render Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Smoothly interpolate (LERP) front cover rotation toward target open/close angle
  frontCoverPivot.rotation.z +=
    (targetRotation - frontCoverPivot.rotation.z) * animationSpeed;

  // Add a very subtle idle float to the entire book structure
  if (!isOpen) {
    bookGroup.position.y = Math.sin(Date.now() * 0.001) * 0.05;
  } else {
    bookGroup.position.y = 0;
  }

  renderer.render(scene, camera);
}

animate();
