/**
 * ============================================================================
 * DonorPulse — Haemovigilance & Micro-Circulation Background Engine
 * ============================================================================
 * High-performance, biological simulation of RBCs (erythrocytes),
 * WBCs (leukocytes), and Platelets (thrombocytes) floating in plasma.
 * 
 * Features:
 * - Medically accurate biconcave 3D tumbling RBCs with central concavity
 * - Amoeboid undulating WBCs with multi-lobed chromatin nuclei & cytoplasmic granules
 * - Stellate / lenticular platelets with active dendritic pseudopodia
 * - Haemodynamic systolic pulse matching human cardiac rhythm (~72 BPM)
 * - Interactive fluid disturbance (mouse velocity wake & scroll parallax)
 * - Depth-of-Field (DOF) 3D layering with depth sorting
 * - Auto-pausing on tab blur / background to preserve battery & CPU (60 FPS)
 * - Self-initializing, zero configuration needed
 * ============================================================================
 */

(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.__DonorPulseBloodCellsLoaded) return;
  window.__DonorPulseBloodCellsLoaded = true;

  // Configuration constants
  const CONFIG = {
    // Cell ratios (sum = 1.0)
    ratioRBC: 0.62,
    ratioWBC: 0.14,
    ratioPlatelet: 0.24,

    // Target particle count based on screen area
    baseDensityDesktop: 52,
    baseDensityMobile: 26,

    // Base flow vector (diagonal laminar plasma flow)
    flowAngle: Math.PI * 0.18, // ~32 degrees downward-right
    baseSpeed: 0.55,           // base drift speed
    systolicPulseAmp: 0.35,    // cardiac heartbeat surge amplitude
    heartRateBPM: 74,          // human resting heart rate

    // Mouse interactivity
    mouseRadius: 150,
    mouseForce: 1.8,

    // Global opacity multiplier (ensures great contrast with page content)
    globalAlpha: 0.52
  };

  // State
  let canvas = null;
  let ctx = null;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let cells = [];
  let animFrameId = null;
  let isRunning = true;
  let isMinimized = false;
  let lastTime = performance.now();
  let lastScrollY = window.scrollY || 0;
  let scrollVelocity = 0;

  // Mouse & touch interaction
  const mouse = {
    x: -9999,
    y: -9999,
    vx: 0,
    vy: 0,
    lastX: -9999,
    lastY: -9999,
    active: false,
    decayTimer: null
  };

  // Palette definitions for authentic medical aesthetics
  const RBC_PALETTES = [
    { rim: '#BC0202', core: '#D45060', edge: '#8A0101', shadow: '#580000' },
    { rim: '#D42B42', core: '#E86B7C', edge: '#A81326', shadow: '#6B000B' },
    { rim: '#C8102E', core: '#DF4D63', edge: '#940019', shadow: '#5A000A' },
    { rim: '#A30018', core: '#C9364C', edge: '#75000F', shadow: '#420006' }
  ];

  const WBC_PALETTES = [
    { membrane: 'rgba(255, 255, 255, 0.85)', glow: 'rgba(225, 240, 255, 0.35)', nucleus: 'rgba(145, 175, 220, 0.45)', granule: 'rgba(180, 205, 240, 0.6)' },
    { membrane: 'rgba(252, 250, 255, 0.88)', glow: 'rgba(235, 230, 255, 0.30)', nucleus: 'rgba(165, 160, 215, 0.42)', granule: 'rgba(195, 190, 245, 0.55)' }
  ];

  const PLATELET_PALETTES = [
    { body: '#F6A87A', edge: '#D9733E', glow: 'rgba(246, 168, 122, 0.35)' },
    { body: '#EDB879', edge: '#C78C3E', glow: 'rgba(237, 184, 121, 0.35)' },
    { body: '#EE8888', edge: '#C94E4E', glow: 'rgba(238, 136, 136, 0.35)' }
  ];

  /**
   * Represents a single living blood component (RBC, WBC, or Platelet)
   */
  class BloodCell {
    constructor(type, initX, initY) {
      this.type = type || 'RBC';
      this.reset(initX, initY);
    }

    reset(initX, initY) {
      // 3D Depth Tier (0.35 = distant, 1.25 = near foreground)
      this.z = 0.35 + Math.random() * 0.9;
      
      // Position
      this.x = initX !== undefined ? initX : Math.random() * (width || window.innerWidth);
      this.y = initY !== undefined ? initY : Math.random() * (height || window.innerHeight);

      // Micro velocity offsets for natural Brownian fluctuation
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;

      // Displacement kick from mouse or scroll
      this.dx = 0;
      this.dy = 0;

      // 3D Rotational dynamics
      this.angle = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.015;
      this.pitch = Math.random() * Math.PI * 2;
      this.pitchSpeed = (0.008 + Math.random() * 0.018) * (Math.random() > 0.5 ? 1 : -1);
      this.roll = Math.random() * Math.PI * 2;
      this.rollSpeed = (Math.random() - 0.5) * 0.012;

      // Brownian oscillation phase
      this.phase = Math.random() * Math.PI * 2;
      this.phaseSpeed = 0.015 + Math.random() * 0.025;

      // Cell type specific setup
      if (this.type === 'RBC') {
        // Red Blood Cell (Erythrocyte)
        this.baseRadius = 14 + Math.random() * 10; // 14px to 24px base
        this.radius = this.baseRadius * (0.65 + this.z * 0.45);
        this.palette = RBC_PALETTES[Math.floor(Math.random() * RBC_PALETTES.length)];
        this.opacity = (0.28 + this.z * 0.32) * CONFIG.globalAlpha;
      } else if (this.type === 'WBC') {
        // White Blood Cell (Leukocyte)
        this.baseRadius = 22 + Math.random() * 12; // 22px to 34px base
        this.radius = this.baseRadius * (0.7 + this.z * 0.4);
        this.palette = WBC_PALETTES[Math.floor(Math.random() * WBC_PALETTES.length)];
        this.opacity = (0.32 + this.z * 0.38) * CONFIG.globalAlpha;
        this.membranePoints = 18;
        this.membranePhase = Math.random() * Math.PI * 2;
        // Precompute 3 nucleus lobes
        this.nucleusLobes = [
          { ox: (Math.random() - 0.5) * 0.35, oy: (Math.random() - 0.5) * 0.35, r: 0.32 + Math.random() * 0.1 },
          { ox: (Math.random() - 0.5) * 0.35, oy: (Math.random() - 0.5) * 0.35, r: 0.28 + Math.random() * 0.1 },
          { ox: (Math.random() - 0.5) * 0.35, oy: (Math.random() - 0.5) * 0.35, r: 0.24 + Math.random() * 0.1 }
        ];
        // Precompute 6 micro-granules
        this.granules = [];
        for (let i = 0; i < 7; i++) {
          const a = Math.random() * Math.PI * 2;
          const dist = Math.random() * 0.65;
          this.granules.push({ x: Math.cos(a) * dist, y: Math.sin(a) * dist, size: 1.2 + Math.random() * 1.5 });
        }
      } else {
        // Platelet (Thrombocyte)
        this.baseRadius = 5.5 + Math.random() * 5.5; // 5.5px to 11px base
        this.radius = this.baseRadius * (0.65 + this.z * 0.45);
        this.palette = PLATELET_PALETTES[Math.floor(Math.random() * PLATELET_PALETTES.length)];
        this.opacity = (0.35 + this.z * 0.35) * CONFIG.globalAlpha;
        this.spiculesCount = 3 + Math.floor(Math.random() * 3); // 3 to 5 pseudopods
        this.rotSpeed *= 2.2; // Platelets flutter faster
        this.pitchSpeed *= 1.8;
      }
    }

    update(dt, pulseFactor, scrollDelta) {
      // 1. Angular tumbling
      this.angle += this.rotSpeed * dt;
      this.pitch += this.pitchSpeed * dt;
      this.roll += this.rollSpeed * dt;
      this.phase += this.phaseSpeed * dt;

      if (this.type === 'WBC') {
        this.membranePhase += 0.02 * dt;
      }

      // 2. Base directional plasma flow with systolic pulse & depth scaling
      const speed = CONFIG.baseSpeed * (0.6 + this.z * 0.6) * pulseFactor;
      const flowX = Math.cos(CONFIG.flowAngle) * speed;
      const flowY = Math.sin(CONFIG.flowAngle) * speed;

      // 3. Brownian undulating motion
      const brownianX = Math.sin(this.phase) * 0.25;
      const brownianY = Math.cos(this.phase * 0.8) * 0.25;

      // 4. Parallax scroll effect
      const scrollYPush = scrollDelta * 0.35 * this.z;

      // 5. Interactive mouse repulsion & fluid wake
      if (mouse.active) {
        const mx = mouse.x;
        const my = mouse.y;
        const distSq = (this.x - mx) * (this.x - mx) + (this.y - my) * (this.y - my);
        const radiusSq = CONFIG.mouseRadius * CONFIG.mouseRadius;

        if (distSq < radiusSq && distSq > 4) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / CONFIG.mouseRadius) * CONFIG.mouseForce * this.z;
          const nx = (this.x - mx) / dist;
          const ny = (this.y - my) / dist;

          // Push outward away from mouse
          this.dx += nx * force * 1.5;
          this.dy += ny * force * 1.5;

          // Add slight rotational wake
          this.angle += (nx * mouse.vy - ny * mouse.vx) * 0.003;
        }
      }

      // Apply displacement with viscous fluid damping
      this.dx *= 0.92;
      this.dy *= 0.92;

      // Combine all position deltas
      this.x += (flowX + this.vx + brownianX + this.dx) * dt;
      this.y += (flowY + this.vy + brownianY + this.dy + scrollYPush) * dt;

      // 6. Seamless wrap-around boundaries
      const pad = this.radius * 2.5 + 40;
      if (this.x > width + pad) {
        this.x = -pad;
        this.y = Math.random() * height;
      } else if (this.x < -pad) {
        this.x = width + pad;
        this.y = Math.random() * height;
      }

      if (this.y > height + pad) {
        this.y = -pad;
        this.x = Math.random() * width;
      } else if (this.y < -pad) {
        this.y = height + pad;
        this.x = Math.random() * width;
      }
    }

    draw(ctx) {
      if (this.type === 'RBC') {
        this.drawRBC(ctx);
      } else if (this.type === 'WBC') {
        this.drawWBC(ctx);
      } else {
        this.drawPlatelet(ctx);
      }
    }

    /**
     * Medically accurate Biconcave Erythrocyte (RBC)
     * Features 3D foreshortening, torus rim, central concavity, and specular highlights
     */
    drawRBC(ctx) {
      const r = this.radius;
      const squash = Math.max(0.18, Math.abs(Math.cos(this.pitch)));
      const pal = this.palette;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      // Check if viewing near edge-on (dumbbell profile)
      if (squash < 0.28) {
        // Edge-on biconcave dumbbell profile
        ctx.scale(1, Math.sign(Math.cos(this.pitch)) || 1);
        const th = r * (0.22 + squash * 0.4); // edge thickness
        const waist = th * 0.45;              // thin center biconcave waist

        ctx.beginPath();
        ctx.moveTo(-r, 0);
        // Top edge with central dip
        ctx.bezierCurveTo(-r * 0.9, -th, -r * 0.35, -waist, 0, -waist);
        ctx.bezierCurveTo(r * 0.35, -waist, r * 0.9, -th, r, 0);
        // Bottom edge with central dip
        ctx.bezierCurveTo(r * 0.9, th, r * 0.35, waist, 0, waist);
        ctx.bezierCurveTo(-r * 0.35, waist, -r * 0.9, th, -r, 0);
        ctx.closePath();

        // Edge gradient
        const edgeGrad = ctx.createLinearGradient(0, -th, 0, th);
        edgeGrad.addColorStop(0, hexToRgba(pal.rim, this.opacity * 0.9));
        edgeGrad.addColorStop(0.5, hexToRgba(pal.edge, this.opacity));
        edgeGrad.addColorStop(1, hexToRgba(pal.shadow, this.opacity * 0.95));

        ctx.fillStyle = edgeGrad;
        ctx.fill();

        // Edge specular gloss
        ctx.beginPath();
        ctx.moveTo(-r * 0.75, -th * 0.45);
        ctx.quadraticCurveTo(0, -waist * 0.7, r * 0.75, -th * 0.45);
        ctx.strokeStyle = `rgba(255, 215, 220, ${this.opacity * 0.45})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
        return;
      }

      // 3D Oblique / Face-on Biconcave Disc
      ctx.scale(1, squash);

      // 1. Outer Torus Ring Radial Gradient
      const grad = ctx.createRadialGradient(
        -r * 0.15, -r * 0.18, r * 0.08,
        0, 0, r
      );
      grad.addColorStop(0, hexToRgba(pal.core, this.opacity * 0.75));   // Thinner concave center
      grad.addColorStop(0.52, hexToRgba(pal.rim, this.opacity));        // Thick rich red donut rim
      grad.addColorStop(0.88, hexToRgba(pal.edge, this.opacity * 0.95)); // Outer curve
      grad.addColorStop(1, hexToRgba(pal.shadow, this.opacity * 0.85));  // Shadowed periphery

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // 2. Central Biconcave Depression (Dimple Ring)
      const dimpleR = r * 0.54;
      const dimpleGrad = ctx.createRadialGradient(
        0, 0, dimpleR * 0.15,
        0, 0, dimpleR
      );
      dimpleGrad.addColorStop(0, hexToRgba(pal.shadow, this.opacity * 0.45));
      dimpleGrad.addColorStop(0.65, hexToRgba(pal.core, this.opacity * 0.20));
      dimpleGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.arc(0, 0, dimpleR, 0, Math.PI * 2);
      ctx.fillStyle = dimpleGrad;
      ctx.fill();

      // 3. Specular lipid bilayer crescent highlight (creates glossy 3D realism)
      ctx.beginPath();
      ctx.ellipse(-r * 0.22, -r * 0.44, r * 0.48, r * 0.18, -Math.PI * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 220, 228, ${this.opacity * 0.4})`;
      ctx.fill();

      ctx.restore();
    }

    /**
     * Amoeboid White Blood Cell (Leukocyte)
     * Features undulating living membrane, soft internal multi-lobed nucleus & granules
     */
    drawWBC(ctx) {
      const r = this.radius;
      const pal = this.palette;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      // 1. Soft Outer Bioluminescent Halo
      const haloGrad = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.35);
      haloGrad.addColorStop(0, pal.glow);
      haloGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
      ctx.fillStyle = haloGrad;
      ctx.fill();

      // 2. Undulating Amoeboid Cell Membrane Path
      ctx.beginPath();
      const pts = this.membranePoints;
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const wave = Math.sin(a * 5 + this.membranePhase) * (r * 0.06) +
                     Math.cos(a * 3 - this.membranePhase * 0.8) * (r * 0.04);
        const currR = r + wave;
        const px = Math.cos(a) * currR;
        const py = Math.sin(a) * currR;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      // Cytoplasm translucent pearlescent fill
      const cytoGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
      cytoGrad.addColorStop(0, 'rgba(255, 255, 255, 0.78)');
      cytoGrad.addColorStop(0.65, pal.membrane);
      cytoGrad.addColorStop(1, 'rgba(220, 235, 250, 0.4)');
      ctx.fillStyle = cytoGrad;
      ctx.fill();

      // Delicate outer membrane line
      ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.9})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 3. Multi-lobed Chromatin Nucleus (characteristic of neutrophil/granulocyte)
      this.nucleusLobes.forEach(lobe => {
        ctx.beginPath();
        ctx.arc(lobe.ox * r, lobe.oy * r, lobe.r * r, 0, Math.PI * 2);
        ctx.fillStyle = pal.nucleus;
        ctx.fill();
      });

      // 4. Cytoplasmic Micro-Granules
      this.granules.forEach(g => {
        ctx.beginPath();
        ctx.arc(g.x * r, g.y * r, g.size, 0, Math.PI * 2);
        ctx.fillStyle = pal.granule;
        ctx.fill();
      });

      // 5. Delicate surface highlight
      ctx.beginPath();
      ctx.ellipse(-r * 0.28, -r * 0.35, r * 0.32, r * 0.18, -Math.PI * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.7})`;
      ctx.fill();

      ctx.restore();
    }

    /**
     * Stellate Platelet (Thrombocyte)
     * Features dendritic pseudopods and golden-amber crystalline refraction
     */
    drawPlatelet(ctx) {
      const r = this.radius;
      const pal = this.palette;
      const squash = 0.5 + Math.abs(Math.cos(this.pitch)) * 0.5;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.scale(1, squash);

      // Platelet Stellate Body with 3-5 Pseudopods
      ctx.beginPath();
      const n = this.spiculesCount * 2;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const isSpike = i % 2 === 1;
        const armR = isSpike ? r * (1.3 + Math.sin(this.phase + i) * 0.25) : r * 0.75;
        const px = Math.cos(a) * armR;
        const py = Math.sin(a) * armR;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      // Amber/rosy platelet glow & fill
      const grad = ctx.createRadialGradient(-r * 0.15, -r * 0.15, r * 0.1, 0, 0, r * 1.2);
      grad.addColorStop(0, hexToRgba(pal.body, this.opacity * 0.9));
      grad.addColorStop(0.7, hexToRgba(pal.edge, this.opacity * 0.75));
      grad.addColorStop(1, 'rgba(255, 180, 120, 0)');

      ctx.fillStyle = grad;
      ctx.fill();

      // Delicate edge highlight
      ctx.strokeStyle = `rgba(255, 235, 200, ${this.opacity * 0.8})`;
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.restore();
    }
  }

  // Helper: Hex color to RGBA
  function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(188, 2, 2, ${alpha})`;
    if (hex.startsWith('rgba')) return hex;
    const c = hex.replace('#', '');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Initializes the Canvas DOM element and attaches listeners
   */
  function initCanvas() {
    canvas = document.getElementById('blood-cells-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'blood-cells-canvas';
      // Insert as first child of body to guarantee it sits behind content
      document.body.insertBefore(canvas, document.body.firstChild);
    }

    ctx = canvas.getContext('2d', { alpha: true });
    resize();

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Track mouse & touch coordinates
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', () => { mouse.active = false; }, { passive: true });

    // Pause animation when tab is hidden to save battery & CPU
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = null;
      } else {
        lastTime = performance.now();
        if (isRunning && !animFrameId) {
          animFrameId = requestAnimationFrame(animate);
        }
      }
    });

    // Populate initial cell pool
    populateCells();

    // Inject minimal floating control badge
    injectControlBadge();
  }

  /**
   * Handles window resizing with high DPI Retina support
   */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance
    width = window.innerWidth;
    height = window.innerHeight;

    if (canvas) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.scale(dpr, dpr);
    }

    // Rebalance cell count if screen dimension changed significantly
    const targetCount = width < 768 ? CONFIG.baseDensityMobile : CONFIG.baseDensityDesktop;
    if (cells.length < targetCount * 0.7 || cells.length > targetCount * 1.5) {
      populateCells();
    }
  }

  /**
   * Populates the pool of blood cells matching biological ratios
   */
  function populateCells() {
    const isMobile = width < 768;
    const total = isMobile ? CONFIG.baseDensityMobile : CONFIG.baseDensityDesktop;

    const rbcCount = Math.round(total * CONFIG.ratioRBC);
    const wbcCount = Math.round(total * CONFIG.ratioWBC);
    const plateletCount = total - rbcCount - wbcCount;

    cells = [];

    for (let i = 0; i < rbcCount; i++) cells.push(new BloodCell('RBC'));
    for (let i = 0; i < wbcCount; i++) cells.push(new BloodCell('WBC'));
    for (let i = 0; i < plateletCount; i++) cells.push(new BloodCell('Platelet'));

    // Sort by depth (z) so distant cells are drawn first
    cells.sort((a, b) => a.z - b.z);
  }

  /**
   * Mouse movement handler
   */
  function handleMouseMove(e) {
    mouse.active = true;
    mouse.vx = e.clientX - (mouse.lastX || e.clientX);
    mouse.vy = e.clientY - (mouse.lastY || e.clientY);
    mouse.lastX = e.clientX;
    mouse.lastY = e.clientY;
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if (mouse.decayTimer) clearTimeout(mouse.decayTimer);
    mouse.decayTimer = setTimeout(() => {
      mouse.active = false;
    }, 1200);
  }

  /**
   * Touch move handler
   */
  function handleTouchMove(e) {
    if (e.touches && e.touches[0]) {
      mouse.active = true;
      const t = e.touches[0];
      mouse.x = t.clientX;
      mouse.y = t.clientY;
    }
  }

  /**
   * Scroll handler for parallax displacement
   */
  function handleScroll() {
    const currentY = window.scrollY || 0;
    scrollVelocity = (currentY - lastScrollY);
    lastScrollY = currentY;
  }

  /**
   * Main 60 FPS Animation Loop
   */
  function animate(now) {
    if (!isRunning) return;

    const dt = Math.min((now - lastTime) / 16.67, 2.5); // Normalized to 60fps unit (clamped)
    lastTime = now;

    // Decay scroll velocity smoothly
    scrollVelocity *= 0.88;

    // Cardiac Systolic Pulse (~74 BPM)
    // Produces a natural periodic surge forward followed by diastolic coasting
    const heartbeatPeriodMs = (60 / CONFIG.heartRateBPM) * 1000;
    const pulseCycle = (now % heartbeatPeriodMs) / heartbeatPeriodMs;
    // Asymmetric pulse curve (quick systolic spike, gentle diastolic descent)
    const systolicPulse = 1 + CONFIG.systolicPulseAmp * Math.pow(Math.sin(pulseCycle * Math.PI), 6);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Update and draw all blood cells in depth order
    const len = cells.length;
    for (let i = 0; i < len; i++) {
      const cell = cells[i];
      cell.update(dt, systolicPulse, scrollVelocity);
      cell.draw(ctx);
    }

    animFrameId = requestAnimationFrame(animate);
  }

  /**
   * Injects an aesthetic, non-intrusive floating control badge
   */
  function injectControlBadge() {
    // Remove if already exists
    const existing = document.getElementById('donor-pulse-cell-badge');
    if (existing) existing.remove();

    const badge = document.createElement('div');
    badge.id = 'donor-pulse-cell-badge';
    badge.className = 'blood-flow-toggle';
    badge.title = 'DonorPulse Haemovigilance Grid — Live Micro-Circulation';
    badge.innerHTML = `
      <span class="cell-badge-dot"></span>
      <span class="cell-badge-text">Micro-Circulation: Active</span>
      <button type="button" class="cell-badge-btn" aria-label="Toggle blood cell flow">
        <span class="material-symbols-outlined" style="font-size: 14px;">pause</span>
      </button>
    `;

    document.body.appendChild(badge);

    // Toggle button handler
    const btn = badge.querySelector('.cell-badge-btn');
    const text = badge.querySelector('.cell-badge-text');
    const dot = badge.querySelector('.cell-badge-dot');

    badge.addEventListener('click', (e) => {
      // Toggle play/pause
      isRunning = !isRunning;
      if (isRunning) {
        lastTime = performance.now();
        animFrameId = requestAnimationFrame(animate);
        text.textContent = 'Micro-Circulation: Active';
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px;">pause</span>';
        dot.style.background = '#00583c'; // Green active pulse
        badge.classList.remove('paused');
      } else {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = null;
        text.textContent = 'Micro-Circulation: Paused';
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px;">play_arrow</span>';
        dot.style.background = '#8A0101'; // Muted red paused
        badge.classList.add('paused');
      }
    });
  }

  // Public API exposed on window for programmatic control
  window.DonorPulseBloodFlow = {
    pause: () => {
      if (isRunning) {
        isRunning = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = null;
        const text = document.querySelector('.cell-badge-text');
        if (text) text.textContent = 'Micro-Circulation: Paused';
      }
    },
    resume: () => {
      if (!isRunning) {
        isRunning = true;
        lastTime = performance.now();
        animFrameId = requestAnimationFrame(animate);
        const text = document.querySelector('.cell-badge-text');
        if (text) text.textContent = 'Micro-Circulation: Active';
      }
    },
    setSpeed: (speed) => {
      CONFIG.baseSpeed = Math.max(0.1, Math.min(3.0, speed));
    },
    setAlpha: (alpha) => {
      CONFIG.globalAlpha = Math.max(0.1, Math.min(1.0, alpha));
      populateCells();
    },
    toggleBadge: (visible) => {
      const b = document.getElementById('donor-pulse-cell-badge');
      if (b) b.style.display = visible ? 'flex' : 'none';
    }
  };

  // Auto-boot once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCanvas();
      if (!animFrameId) animFrameId = requestAnimationFrame(animate);
    });
  } else {
    initCanvas();
    if (!animFrameId) animFrameId = requestAnimationFrame(animate);
  }

})();
