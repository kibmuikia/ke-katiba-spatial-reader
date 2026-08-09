import * as THREE from "three";
import {
  loadConstitution,
  type ChapterNode,
  type ConstitutionDoc,
} from "./data";
import { createPageTexture } from "./pageTexture";
import { initKenyaBackground } from "./background";
import { logger } from "./utils/logger";

const LOG_MODULE = "KKR-NM";

// --- 1. Scene & Global Systems Initializer ---
const scene = new THREE.Scene();

let currentTheme: "dark" | "light" =
  (document.documentElement.getAttribute("data-theme") as "dark" | "light") ||
  "dark";

const bgContainer = document.getElementById("bgContainer")!;
const bgController = initKenyaBackground(bgContainer, currentTheme);

const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 3.5, 6);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.domElement.classList.add("webgl-canvas");
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- 2. Adaptive Lights Setup ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfffdf0, 1.2);
dirLight.position.set(5, 8, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0x90b0ff, 0.3);
fillLight.position.set(-5, 2, -3);
scene.add(fillLight);

// --- 3. Audio Foley Synthesizer ---
class PaperAudioEngine {
  private ctx: AudioContext | null = null;

  public playFlippingEffect(): void {
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

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";

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

// --- 4. Kenyan Front Cover Canvas Texture ---
function createKenyanCoverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1433;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#004d26";
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

// --- 5. Assembly of 3D Book Geometry ---
const bookWidth = 2.0;
const bookHeight = 2.8;
const bookThickness = 0.4;
const coverThickness = 0.05;

const bookGroup = new THREE.Group();
scene.add(bookGroup);

const coverColor = 0x004d26;

const coverMatGeneric = new THREE.MeshStandardMaterial({
  color: coverColor,
  roughness: 0.6,
  metalness: 0.1,
});

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

const leftPageMat = new THREE.MeshStandardMaterial({
  roughness: 0.8,
  metalness: 0.1,
});
const rightPageMat = new THREE.MeshStandardMaterial({
  roughness: 0.8,
  metalness: 0.1,
});

const pagesMesh = new THREE.Mesh(pageGeo, [
  pageSideMat,
  pageSideMat,
  leftPageMat,
  pageSideMat,
  pageSideMat,
  pageSideMat,
]);
pagesMesh.castShadow = true;
pagesMesh.receiveShadow = true;
bookGroup.add(pagesMesh);

const rightPageGeo = new THREE.PlaneGeometry(
  bookWidth - 0.04,
  bookHeight - 0.04,
);
const rightPageMesh = new THREE.Mesh(rightPageGeo, rightPageMat);
rightPageMesh.rotation.x = -Math.PI / 2;
rightPageMesh.position.set(0, bookThickness / 2 + 0.001, 0);
bookGroup.add(rightPageMesh);

const leftPageGeo = new THREE.PlaneGeometry(
  bookWidth - 0.04,
  bookHeight - 0.04,
);
const leftPageMesh = new THREE.Mesh(leftPageGeo, leftPageMat);
leftPageMesh.rotation.x = -Math.PI / 2;
leftPageMesh.position.set(bookWidth / 2, coverThickness / 2 + 0.002, 0);

const backCoverGeo = new THREE.BoxGeometry(
  bookWidth + 0.06,
  coverThickness,
  bookHeight + 0.06,
);
const backCoverMesh = new THREE.Mesh(backCoverGeo, coverMatGeneric);
backCoverMesh.position.set(0, -(bookThickness / 2 + coverThickness / 2), 0);
backCoverMesh.receiveShadow = true;
bookGroup.add(backCoverMesh);

const spineGeo = new THREE.BoxGeometry(
  coverThickness,
  bookThickness + coverThickness * 2,
  bookHeight + 0.06,
);
const spineMesh = new THREE.Mesh(spineGeo, coverMatGeneric);
spineMesh.position.set(-(bookWidth / 2 + coverThickness / 2), 0, 0);
bookGroup.add(spineMesh);

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

const frontCoverMesh = new THREE.Mesh(frontCoverGeo, [
  coverMatGeneric,
  coverMatGeneric,
  decorativeFrontMat,
  coverMatGeneric,
  coverMatGeneric,
  coverMatGeneric,
]);
frontCoverMesh.position.set(bookWidth / 2, coverThickness / 2, 0);
frontCoverMesh.castShadow = true;
frontCoverPivot.add(frontCoverMesh);
frontCoverPivot.add(leftPageMesh);

// --- 6. State & UI References ---
let constitutionData: ConstitutionDoc | null = null;
let selectedChapter: ChapterNode | null = null;
let isOpen = false;

const chapterHud = document.getElementById("chapterHud")!;
const chapterSelect = document.getElementById(
  "chapterSelect",
) as HTMLSelectElement;
const prevChapterBtn = document.getElementById("prevChapterBtn")!;
const nextChapterBtn = document.getElementById("nextChapterBtn")!;
const closeBookBtn = document.getElementById("closeBookBtn")!;

const aboutBtn = document.getElementById("aboutBtn")!;
const aboutMorphPage = document.getElementById("aboutMorphPage")!;
const backToBookBtn = document.getElementById("backToBookBtn")!;

function refreshPageTextures(): void {
  if (!constitutionData) return;

  const leftTex = createPageTexture({
    theme: currentTheme,
    type: "table-of-contents",
    chapters: constitutionData.chapters,
    selectedChapter: selectedChapter,
    pageIndex: 1,
  });

  const rightTex = createPageTexture({
    theme: currentTheme,
    type: "chapter-detail",
    selectedChapter: selectedChapter || constitutionData.chapters[0],
    pageIndex: selectedChapter ? selectedChapter.number + 1 : 2,
  });

  leftPageMat.map = leftTex;
  leftPageMat.needsUpdate = true;

  rightPageMat.map = rightTex;
  rightPageMat.needsUpdate = true;

  if (selectedChapter) {
    chapterSelect.value = selectedChapter.number.toString();
  }
}

function populateChapterSelect(): void {
  if (!constitutionData) return;

  chapterSelect.innerHTML = "";
  constitutionData.chapters.forEach((ch) => {
    const opt = document.createElement("option");
    opt.value = ch.number.toString();
    opt.textContent = `Ch. ${ch.number}: ${ch.title}`;
    chapterSelect.appendChild(opt);
  });
}

function setOpenState(open: boolean): void {
  isOpen = open;
  targetRotation = isOpen ? Math.PI * 0.92 : 0;
  sfx.playFlippingEffect();

  if (isOpen) {
    chapterHud.classList.remove("hidden");
  } else {
    chapterHud.classList.add("hidden");
  }
  updateViewportState();
}

loadConstitution()
  .then((doc) => {
    constitutionData = doc;
    selectedChapter = doc.chapters[0];
    populateChapterSelect();
    refreshPageTextures();
  })
  .catch((err) => {
    console.error("Failed to load constitution:", err);
  });

// --- 7. Event Handlers & Morph Transition ---
chapterSelect.addEventListener("change", (e) => {
  const chNum = parseInt((e.target as HTMLSelectElement).value, 10);
  if (constitutionData) {
    const found = constitutionData.chapters.find((c) => c.number === chNum);
    if (found) {
      selectedChapter = found;
      sfx.playFlippingEffect();
      refreshPageTextures();
    }
  }
});

prevChapterBtn.addEventListener("click", () => {
  if (!constitutionData || !selectedChapter) return;
  const currIdx = selectedChapter.number - 1;
  const prevIdx =
    (currIdx - 1 + constitutionData.chapters.length) %
    constitutionData.chapters.length;
  selectedChapter = constitutionData.chapters[prevIdx];
  sfx.playFlippingEffect();
  refreshPageTextures();
});

nextChapterBtn.addEventListener("click", () => {
  if (!constitutionData || !selectedChapter) return;
  const currIdx = selectedChapter.number - 1;
  const nextIdx = (currIdx + 1) % constitutionData.chapters.length;
  selectedChapter = constitutionData.chapters[nextIdx];
  sfx.playFlippingEffect();
  refreshPageTextures();
});

closeBookBtn.addEventListener("click", () => setOpenState(false));

// Full-Page Morph Transition Handlers
aboutBtn.addEventListener("click", () => {
  aboutMorphPage.classList.add("active");
});
backToBookBtn.addEventListener("click", () => {
  aboutMorphPage.classList.remove("active");
});

// --- Keyboard Navigation ---
window.addEventListener("keydown", (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  if (
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT")
  ) {
    return;
  }

  logger.debug("Key-pressed", {
    module: LOG_MODULE,
    scope: "keyboard",
    data: {
      key: event.key,
      targetTag: target?.tagName || null,
    },
  });

  if (event.key === "Escape") {
    if (aboutMorphPage.classList.contains("active")) {
      aboutMorphPage.classList.remove("active");
      return;
    }
    if (isOpen) {
      setOpenState(false);
      return;
    }
  }
  if (!isOpen) return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    prevChapterBtn.click();
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    nextChapterBtn.click();
  }
});

// --- 8. Dynamic Aspect-Ratio Viewport & Camera Distance Scaling ---
let targetRotation = 0;
const animationSpeed = 0.06;

const camClosedPos = new THREE.Vector3(0, 3.5, 6);
const camOpenPos = new THREE.Vector3(0, 3.8, 0.1);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary) return;
  if ((event.target as HTMLElement).closest(".interactive-element")) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  if (isOpen) {
    const pageIntersects = raycaster.intersectObjects([
      leftPageMesh,
      rightPageMesh,
    ]);
    if (pageIntersects.length > 0) {
      const hit = pageIntersects[0];
      if (hit.object === leftPageMesh && constitutionData) {
        const currIdx = selectedChapter ? selectedChapter.number - 1 : 0;
        const nextIdx = (currIdx + 1) % constitutionData.chapters.length;
        selectedChapter = constitutionData.chapters[nextIdx];
        sfx.playFlippingEffect();
        refreshPageTextures();
        return;
      } else if (hit.object === rightPageMesh && constitutionData) {
        const currIdx = selectedChapter ? selectedChapter.number - 1 : 0;
        const prevIdx =
          (currIdx - 1 + constitutionData.chapters.length) %
          constitutionData.chapters.length;
        selectedChapter = constitutionData.chapters[prevIdx];
        sfx.playFlippingEffect();
        refreshPageTextures();
        return;
      }
    }
  }

  const bookIntersects = raycaster.intersectObjects(bookGroup.children, true);
  if (bookIntersects.length > 0) {
    setOpenState(!isOpen);
  }
});

// Live Theme Switcher
const themeBtn = document.getElementById("themeBtn")!;
themeBtn.addEventListener("click", () => {
  const currentThemeAttr = document.documentElement.getAttribute("data-theme");
  const nextTheme = currentThemeAttr === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", nextTheme);
  themeBtn.textContent = `Switch to ${nextTheme === "dark" ? "Light" : "Dark"}`;
  currentTheme = nextTheme as "dark" | "light";

  bgController.setTheme(currentTheme);
  refreshPageTextures();
});

/**
 * Calculates adaptive camera zoom and FOV based on viewport aspect ratio.
 * Fixes mobile horizontal page overflow.
 */
function updateViewportState() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;

  if (isOpen) {
    if (aspect < 1.0) {
      // Mobile Portrait: Scale camera Z-distance inversely with aspect ratio
      const targetZ = Math.max(5.2, 3.4 / aspect);
      camOpenPos.set(0, targetZ, 0.1);
    } else {
      // Desktop Landscape
      camOpenPos.set(0, 3.8, 0.1);
    }
  } else {
    if (aspect < 1.0) {
      camClosedPos.set(0, 4.2, Math.max(7.0, 5.0 / aspect));
    } else {
      camClosedPos.set(0, 3.5, 6);
    }
  }

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", updateViewportState);
updateViewportState();

// --- 9. Render Animation Loop ---
function animate() {
  requestAnimationFrame(animate);

  frontCoverPivot.rotation.z +=
    (targetRotation - frontCoverPivot.rotation.z) * animationSpeed;

  if (!isOpen) {
    bookGroup.position.y = Math.sin(Date.now() * 0.0012) * 0.06;
    bookGroup.position.x = THREE.MathUtils.lerp(bookGroup.position.x, 0, 0.05);
    bookGroup.rotation.x = THREE.MathUtils.lerp(
      bookGroup.rotation.x,
      0.4,
      0.05,
    );
    bookGroup.rotation.y = -0.5 + Math.sin(Date.now() * 0.0005) * 0.03;

    camera.position.lerp(camClosedPos, 0.05);
    camera.lookAt(0, 0, 0);
  } else {
    const aspect = window.innerWidth / window.innerHeight;
    const targetYOffset = aspect < 1.0 ? -0.2 : 0;

    bookGroup.position.y = THREE.MathUtils.lerp(
      bookGroup.position.y,
      targetYOffset,
      0.05,
    );
    bookGroup.position.x = THREE.MathUtils.lerp(bookGroup.position.x, 0, 0.05);
    bookGroup.rotation.x = THREE.MathUtils.lerp(bookGroup.rotation.x, 0, 0.05);
    bookGroup.rotation.y = THREE.MathUtils.lerp(bookGroup.rotation.y, 0, 0.05);

    camera.position.lerp(camOpenPos, 0.05);
    camera.lookAt(0, targetYOffset, 0);
  }

  renderer.render(scene, camera);
}
animate();
