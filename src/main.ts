import * as THREE from "three";
import { loadConstitution, type ChapterNode } from "./data";

// --- 1. Scene & Global Systems Initializer ---
const scene = new THREE.Scene();

// Cache computed design token variables directly from DOM styles
function getThemeColor(variableName: string): number {
  const hex = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  return parseInt(hex.replace("#", "0x"));
}

scene.background = new THREE.Color(getThemeColor("--bg-canvas"));

const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 3.5, 6);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- 2. Advanced Adaptive Lights Setup ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfffdf0, 1.2);
dirLight.position.set(5, 8, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0x90b0ff, 0.25);
fillLight.position.set(-5, 2, -3);
scene.add(fillLight);

// --- 3. Standalone Procedural Paper Foley Synthesizer ---
class PaperAudioEngine {
  private ctx: AudioContext | null = null;

  public playFlippingEffect(): void {
    // Standard user-gesture browser unlocking safety wrapper
    if (!this.ctx) {
      this.ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const duration = 0.55;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate White Noise with a low-pass sweeping envelope to simulate canvas scraping friction
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";

    // Sweep the cutoff frequency downwards to mirror a swinging cover slowing to a halt
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(
      120,
      this.ctx.currentTime + duration,
    );

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.0, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      this.ctx.currentTime + duration,
    );

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    noiseNode.start();
  }
}
const sfx = new PaperAudioEngine();

// --- 4. Premium Material Graphics Generation (Unchanged Court Green Structure) ---
function createKenyanCoverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1433;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#004d26"; // Explicitly retained core green cover styling
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 16;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.lineWidth = 4;
  ctx.strokeRect(65, 65, canvas.width - 130, canvas.height - 130);

  const stripeY = canvas.height - 180;
  const stripeH = 20;
  ctx.fillStyle = "#000000";
  ctx.fillRect(65, stripeY, canvas.width - 130, stripeH);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(65, stripeY + stripeH, canvas.width - 130, 6);
  ctx.fillStyle = "#990000";
  ctx.fillRect(65, stripeY + stripeH + 6, canvas.width - 130, stripeH);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(65, stripeY + stripeH * 2 + 6, canvas.width - 130, 6);
  ctx.fillStyle = "#006633";
  ctx.fillRect(65, stripeY + stripeH * 2 + 12, canvas.width - 130, stripeH);

  ctx.fillStyle = "#ffd700";
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  ctx.textAlign = "center";

  ctx.font = "bold 58px 'Times New Roman', serif";
  ctx.fillText("THE CONSTITUTION", canvas.width / 2, 220);
  ctx.font = "bold 44px 'Times New Roman', serif";
  ctx.fillText("OF THE", canvas.width / 2, 290);
  ctx.font = "bold 72px 'Times New Roman', serif";
  ctx.fillText("REPUBLIC OF KENYA", canvas.width / 2, 390);

  // Maasai Shield Graphic Sub-render
  ctx.save();
  ctx.translate(canvas.width / 2, 750);
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-160, 160);
  ctx.lineTo(160, -160);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(160, 160);
  ctx.lineTo(-160, -160);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -180);
  ctx.bezierCurveTo(90, -140, 110, 0, 0, 180);
  ctx.bezierCurveTo(-110, 0, -90, -140, 0, -180);
  ctx.closePath();
  ctx.fillStyle = "#990000";
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(0, -180);
  ctx.bezierCurveTo(45, -140, 55, 0, 0, 180);
  ctx.bezierCurveTo(-55, 0, -45, -140, 0, -180);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-6, -100, 12, 200);
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#ffd700";
  ctx.font = "italic bold 36px 'Times New Roman', serif";
  ctx.fillText("Harambee", canvas.width / 2, canvas.height - 240);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const coverTexture = createKenyanCoverTexture();

// --- 5. Assembly of the 3D Asset Geometry ---
const bookWidth = 2.0;
const bookHeight = 2.8;
const bookThickness = 0.4;
const coverThickness = 0.05;

const bookGroup = new THREE.Group();
scene.add(bookGroup);

const coverColor = 0x004d26;
const pageColor = 0xfffef0;

const coverMatGeneric = new THREE.MeshStandardMaterial({
  color: coverColor,
  roughness: 0.6,
  metalness: 0.1,
});

// Gilded Inner Pages
const pageGeo = new THREE.BoxGeometry(
  bookWidth - 0.04,
  bookThickness,
  bookHeight - 0.04,
);
const pageSideMat = new THREE.MeshStandardMaterial({
  color: 0xe6b800,
  roughness: 0.3,
  metalness: 0.4,
});
const pageTopMat = new THREE.MeshStandardMaterial({
  color: pageColor,
  roughness: 0.9,
});
const pageMaterials = [
  pageSideMat,
  pageSideMat,
  pageTopMat,
  pageTopMat,
  pageSideMat,
  pageSideMat,
];

const pagesMesh = new THREE.Mesh(pageGeo, pageMaterials);
pagesMesh.castShadow = true;
pagesMesh.receiveShadow = true;
bookGroup.add(pagesMesh);

// Back Cover
const backCoverGeo = new THREE.BoxGeometry(
  bookWidth + 0.06,
  coverThickness,
  bookHeight + 0.06,
);
const backCoverMesh = new THREE.Mesh(backCoverGeo, coverMatGeneric);
backCoverMesh.position.set(0, -(bookThickness / 2 + coverThickness / 2), 0);
backCoverMesh.receiveShadow = true;
bookGroup.add(backCoverMesh);

// Spine
const spineGeo = new THREE.BoxGeometry(
  coverThickness,
  bookThickness + coverThickness * 2,
  bookHeight + 0.06,
);
const spineMesh = new THREE.Mesh(spineGeo, coverMatGeneric);
spineMesh.position.set(-(bookWidth / 2 + coverThickness / 2), 0, 0);
bookGroup.add(spineMesh);

// Front Hinge Mechanical Node Assembly
const frontCoverPivot = new THREE.Group();
frontCoverPivot.position.set(-(bookWidth / 2), bookThickness / 2, 0);
bookGroup.add(frontCoverPivot);

const frontCoverGeo = new THREE.BoxGeometry(
  bookWidth,
  coverThickness,
  bookHeight + 0.06,
);
const decorativeFrontMat = new THREE.MeshStandardMaterial({
  map: coverTexture,
  roughness: 0.4,
  metalness: 0.15,
});
const frontCoverMaterials = [
  coverMatGeneric,
  coverMatGeneric,
  decorativeFrontMat,
  coverMatGeneric,
  coverMatGeneric,
  coverMatGeneric,
];

const frontCoverMesh = new THREE.Mesh(frontCoverGeo, frontCoverMaterials);
frontCoverMesh.position.set(bookWidth / 2, coverThickness / 2, 0);
frontCoverMesh.castShadow = true;
frontCoverPivot.add(frontCoverMesh);

bookGroup.rotation.set(0.4, -0.5, 0.1);

// --- 6. Interaction & Dynamic UX State Hooks ---
let isOpen = false;
let targetRotation = 0;
const animationSpeed = 0.06;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const infoPanel = document.getElementById("infoPanel")!;
const hintOverlay = document.getElementById("hintOverlay")!;
const chapterList = document.getElementById("chapterList")!;
const panelSubtitle = document.getElementById("panelSubtitle")!;

// --- Populate the side panel from ke-katiba-digest JSON ---
function summarizeChapter(chapter: ChapterNode): string {
  const first = chapter.articles[0];
  if (!first) return `${chapter.articles.length} articles`;
  const wordCount = chapter.articles.reduce((acc, a) => {
    if (a.raw_text) return acc + a.raw_text.split(/\s+/).length;
    return acc + (a.clauses ?? []).reduce((c, cl) => c + cl.text.split(/\s+/).length, 0);
  }, 0);
  return `${chapter.articles.length} articles · ~${wordCount.toLocaleString()} words`;
}

function renderChapters(chapters: ChapterNode[], source: string): void {
  chapterList.removeAttribute("data-loading");
  panelSubtitle.textContent = `Republic of Kenya · ${chapters.length} chapters · source: ${source}`;
  const frag = document.createDocumentFragment();
  for (const chapter of chapters) {
    const card = document.createElement("article");
    card.className = "chapter-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open Chapter ${chapter.number}: ${chapter.title}`);
    const heading = document.createElement("h4");
    heading.textContent = `Chapter ${chapter.number}`;
    const title = document.createElement("p");
    title.className = "chapter-card-title";
    title.textContent = chapter.title;
    const meta = document.createElement("p");
    meta.className = "chapter-card-meta";
    meta.textContent = summarizeChapter(chapter);
    card.append(heading, title, meta);
    frag.appendChild(card);
  }
  chapterList.replaceChildren(frag);
}

loadConstitution()
  .then((doc) => {
    const source = doc.metadata?.source ?? "ke-katiba-digest";
    renderChapters(doc.chapters, source);
  })
  .catch((err: unknown) => {
    chapterList.removeAttribute("data-loading");
    chapterList.textContent = `Failed to load constitution: ${(err as Error).message}`;
  });

window.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary) return;
  // Guard click mechanics if the user triggers interactive control elements or side panel
  if ((event.target as HTMLElement).closest(".interactive-element") || (event.target as HTMLElement).closest(".info-panel")) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(bookGroup.children, true);

  if (intersects.length > 0) {
    isOpen = !isOpen;
    targetRotation = isOpen ? Math.PI * 0.92 : 0;

    // Play the lowpass swept synthesized book-flip event audio node
    sfx.playFlippingEffect();

    // Structural Side UI Panel Sync triggers
    if (isOpen) {
      infoPanel.classList.add("visible");
      hintOverlay.style.opacity = "0";
    } else {
      infoPanel.classList.remove("visible");
      hintOverlay.style.opacity = "1";
    }
  }
});

// Live Synchronized Design System Theme Toggler
const themeBtn = document.getElementById("themeBtn")!;
themeBtn.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", nextTheme);
  themeBtn.textContent = `Switch to ${nextTheme === "dark" ? "Light" : "Dark"}`;
  // Update Three.js rendering context environment instantly
  scene.background = new THREE.Color(getThemeColor("--bg-canvas"));
});

function updateCameraForViewport() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;

  if (aspect < 1) {
    // Mobile Portrait Adjustments
    camera.fov = 55;
    camera.position.set(0, 4.2, 7.5);
  } else {
    // Desktop / Landscape Adjustments
    camera.fov = 40;
    camera.position.set(0, 3.5, 6);
  }

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", updateCameraForViewport);
updateCameraForViewport();
// --- 7. Execution Frame Loop ---
function animate() {
  requestAnimationFrame(animate);
  frontCoverPivot.rotation.z +=
    (targetRotation - frontCoverPivot.rotation.z) * animationSpeed;
  if (!isOpen) {
    bookGroup.position.y = Math.sin(Date.now() * 0.0012) * 0.06;
    bookGroup.rotation.y = -0.5 + Math.sin(Date.now() * 0.0005) * 0.03;
  } else {
    bookGroup.position.y = THREE.MathUtils.lerp(
      bookGroup.position.y,
      -0.2,
      0.05,
    );
    bookGroup.rotation.y = THREE.MathUtils.lerp(
      bookGroup.rotation.y,
      -0.1,
      0.05,
    );
  }
  renderer.render(scene, camera);
}
animate();
