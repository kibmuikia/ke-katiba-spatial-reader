export interface KenyaBackgroundController {
  setTheme: (theme: "dark" | "light") => void;
  destroy: () => void;
}

export function initKenyaBackground(container: HTMLElement, initialTheme: "dark" | "light" = "dark"): KenyaBackgroundController {
  // Inject HTML structure inside container
  container.className = "bg-scene";
  container.innerHTML = `
    <canvas id="bg-motion"></canvas>
    <div class="mark" aria-hidden="true">
      <div class="spear a"></div>
      <div class="spear b"></div>
      <div class="guardian left"></div>
      <div class="guardian right"></div>
      <div class="shield"></div>
    </div>
    <div class="halo"></div>
    <div class="grain"></div>
    <div class="vignette"></div>
    <div class="label">Kenya · Law · Digital</div>
  `;

  const canvas = container.querySelector("#bg-motion") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d", { alpha: true })!;

  let currentTheme: "dark" | "light" = initialTheme;
  let W = 0, H = 0, DPR = 1;
  let animId = 0;

  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    a: number;
    c: [number, number, number];
  }> = [];

  const watermarks: Array<{
    x: number;
    y: number;
    w: number;
    ratio: number;
    angle: number;
    spin: number;
    driftX: number;
    driftY: number;
    c: [number, number, number];
    a: number;
  }> = [];

  const getPalette = (): [number, number, number][] => {
    if (currentTheme === "dark") {
      return [
        [216, 180, 90],  // gold
        [201, 37, 45],   // red
        [8, 120, 62],    // green
        [241, 234, 216], // cream
      ];
    } else {
      return [
        [180, 140, 50],  // warm gold
        [180, 30, 40],   // warm red
        [8, 120, 62],    // green
        [120, 90, 70],   // warm brown
      ];
    }
  };

  function makeParticle(initial = false) {
    const palette = getPalette();
    const c = palette[Math.floor(Math.random() * palette.length)];
    return {
      x: Math.random() * W,
      y: initial ? Math.random() * H : H + Math.random() * 80,
      vx: (Math.random() - 0.5) * 0.1,
      vy: -(0.06 + Math.random() * 0.22),
      r: 0.5 + Math.random() * 2.1,
      a: 0.06 + Math.random() * 0.36,
      c,
    };
  }

  function shieldPath(cx: number, cy: number, w: number, h: number) {
    const p = new Path2D();
    const top = cy - h / 2;
    const bottom = cy + h / 2;
    const left = cx - w / 2;
    const right = cx + w / 2;
    p.moveTo(cx, top);
    p.quadraticCurveTo(right, top + h * 0.18, right, cy - h * 0.05);
    p.quadraticCurveTo(right, cy + h * 0.32, cx, bottom);
    p.quadraticCurveTo(left, cy + h * 0.32, left, cy - h * 0.05);
    p.quadraticCurveTo(left, top + h * 0.18, cx, top);
    p.closePath();
    return p;
  }

  function makeWatermark(i: number) {
    const palette = getPalette();
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      w: 240 + Math.random() * 220,
      ratio: 1.35,
      angle: (Math.random() - 0.5) * 0.12,
      spin: (Math.random() - 0.5) * 0.00006,
      driftX: (Math.random() - 0.5) * 0.02,
      driftY: (Math.random() - 0.5) * 0.015,
      c: palette[i % palette.length],
      a: currentTheme === "dark" ? 0.03 + Math.random() * 0.035 : 0.04 + Math.random() * 0.04,
    };
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    particles.length = 0;
    watermarks.length = 0;

    const count = Math.min(140, Math.floor((W * H) / 11000));
    for (let i = 0; i < count; i++) particles.push(makeParticle(true));

    const wmCount = W < 700 ? 2 : 3;
    for (let i = 0; i < wmCount; i++) watermarks.push(makeWatermark(i));
  }

  function drawWatermarks() {
    ctx.save();
    watermarks.forEach((s) => {
      s.x += s.driftX;
      s.y += s.driftY;
      s.angle += s.spin;
      if (s.x < -s.w) s.x = W + s.w;
      if (s.x > W + s.w) s.x = -s.w;
      if (s.y < -s.w) s.y = H + s.w;
      if (s.y > H + s.w) s.y = -s.w;

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      const alpha = currentTheme === "dark" ? s.a : s.a * 1.2;
      ctx.strokeStyle = `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke(shieldPath(0, 0, s.w, s.w * s.ratio));
      ctx.restore();
    });
    ctx.restore();
  }

  function ridgePoints(baseY: number, amp: number, seed: number, points: number) {
    const pts: [number, number][] = [];
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const x = t * W;
      const jag =
        Math.sin(t * 9 + seed) * amp * 0.4 +
        Math.sin(t * 23 + seed * 1.7) * amp * 0.18 +
        Math.abs(Math.sin(t * 3.1 + seed * 0.5)) * amp * 0.9;
      pts.push([x, baseY - jag]);
    }
    return pts;
  }

  function drawRidge(t: number) {
    const farBase = H * 0.86 + Math.sin(t * 0.00009) * 4;
    const nearBase = H * 0.95 + Math.sin(t * 0.00007 + 2) * 5;

    const far = ridgePoints(farBase, 60, 1.3, 22);
    ctx.beginPath();
    ctx.moveTo(0, H);
    far.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(W, H);
    ctx.closePath();

    if (currentTheme === "dark") {
      ctx.fillStyle = "rgba(6, 63, 40, 0.4)";
    } else {
      ctx.fillStyle = "rgba(8, 120, 62, 0.12)";
    }
    ctx.fill();

    const near = ridgePoints(nearBase, 85, 4.1, 18);
    ctx.beginPath();
    ctx.moveTo(0, H);
    near.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(W, H);
    ctx.closePath();

    if (currentTheme === "dark") {
      ctx.fillStyle = "rgba(5, 6, 7, 0.85)";
    } else {
      ctx.fillStyle = "rgba(235, 228, 218, 0.88)";
    }
    ctx.fill();

    ctx.beginPath();
    near.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    if (currentTheme === "dark") {
      ctx.strokeStyle = "rgba(241, 234, 216, 0.08)";
    } else {
      ctx.strokeStyle = "rgba(141, 100, 74, 0.18)";
    }
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function glowDot(x: number, y: number, r: number, c: [number, number, number], a: number) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 8);
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`);
    g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = currentTheme === "dark" ? "screen" : "multiply";

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx + (pointer.x - 0.5) * 0.04;
      p.y += p.vy;

      if (p.y < -30 || p.x < -30 || p.x > W + 30) {
        Object.assign(p, makeParticle(false));
      }

      const pAlpha = currentTheme === "dark" ? p.a * 0.5 : p.a * 0.4;
      glowDot(p.x, p.y, p.r, p.c, pAlpha);

      ctx.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${p.a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGeometry(t: number) {
    const cx = W / 2 + (pointer.x - 0.5) * W * 0.02;
    const cy = H / 2 + (pointer.y - 0.5) * H * 0.02;
    const palette = getPalette();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalCompositeOperation = currentTheme === "dark" ? "screen" : "source-over";

    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate(t * 0.00004 * (i % 2 ? -1 : 1) + (i * Math.PI) / 2);
      const strokeAlpha = currentTheme === "dark" ? 0.10 : 0.12;
      ctx.strokeStyle = `rgba(${palette[i][0]},${palette[i][1]},${palette[i][2]},${strokeAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -H * 0.32);
      ctx.lineTo(W * 0.16, 0);
      ctx.lineTo(0, H * 0.32);
      ctx.lineTo(-W * 0.16, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    const creamCol = currentTheme === "dark" ? [241, 234, 216] : [141, 100, 74];
    const bands = [
      { y: -H * 0.045, h: H * 0.012, c: creamCol, a: 0.10 },
      { y: -H * 0.012, h: H * 0.035, c: [201, 37, 45], a: currentTheme === "dark" ? 0.10 : 0.08 },
      { y: H * 0.032, h: H * 0.012, c: creamCol, a: 0.08 },
      { y: H * 0.05, h: H * 0.025, c: [8, 120, 62], a: currentTheme === "dark" ? 0.08 : 0.07 },
    ];

    bands.forEach((b) => {
      ctx.fillStyle = `rgba(${b.c[0]},${b.c[1]},${b.c[2]},${b.a})`;
      ctx.fillRect(-W * 0.18, b.y, W * 0.36, b.h);
    });

    ctx.restore();
  }

  function animate(t: number) {
    ctx.clearRect(0, 0, W, H);

    const gx = W * (0.5 + Math.sin(t * 0.00007) * 0.2);
    const gy = H * (0.48 + Math.cos(t * 0.00009) * 0.16);
    const ambient = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(W, H) * 0.65);

    if (currentTheme === "dark") {
      ambient.addColorStop(0, "rgba(216,180,90,.045)");
      ambient.addColorStop(0.35, "rgba(8,120,62,.02)");
      ambient.addColorStop(0.7, "rgba(201,37,45,.015)");
      ambient.addColorStop(1, "rgba(0,0,0,0)");
    } else {
      ambient.addColorStop(0, "rgba(216,180,90,.08)");
      ambient.addColorStop(0.35, "rgba(8,120,62,.04)");
      ambient.addColorStop(0.7, "rgba(201,37,45,.03)");
      ambient.addColorStop(1, "rgba(249,247,243,0)");
    }

    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, W, H);

    drawWatermarks();
    drawRidge(t);
    drawGeometry(t);
    drawParticles();

    pointer.x += (pointer.tx - pointer.x) * 0.02;
    pointer.y += (pointer.ty - pointer.y) * 0.02;

    animId = requestAnimationFrame(animate);
  }

  const handleResize = () => resize();
  const handlePointerMove = (e: PointerEvent) => {
    pointer.tx = e.clientX / W;
    pointer.ty = e.clientY / H;
  };
  const handlePointerLeave = () => {
    pointer.tx = 0.5;
    pointer.ty = 0.5;
  };

  window.addEventListener("resize", handleResize);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerleave", handlePointerLeave);

  resize();
  animId = requestAnimationFrame(animate);

  return {
    setTheme: (newTheme: "dark" | "light") => {
      currentTheme = newTheme;
      resize();
    },
    destroy: () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      container.innerHTML = "";
    },
  };
}
