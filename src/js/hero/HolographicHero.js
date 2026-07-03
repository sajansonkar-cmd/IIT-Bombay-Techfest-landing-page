import { HERO_COLORS, HERO_CONFIG } from "./config.js";
import { createCyborgModel } from "./cyborgModel.js";
import { createHolographicCircles } from "./holograms.js";
import { createParticleSystems } from "./particles.js";
import { createScannerRings } from "./rings.js";

export class HolographicHero {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.THREE = window.THREE;
    this.supported = Boolean(canvas && this.THREE);
    this.running = false;
    this.frameId = 0;
    this.compact = false;
    this.pointer = { x: 0, y: 0 };
    this.smoothPointer = { x: 0, y: 0 };
    this.lastPointerMove = 0;

    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.tick = this.tick.bind(this);

    if (!this.supported) {
      return;
    }

    this.initScene();
    this.bindEvents();
    this.handleResize();
  }

  initScene() {
    const THREE = this.THREE;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      HERO_CONFIG.cameraFov,
      1,
      HERO_CONFIG.cameraNear,
      HERO_CONFIG.cameraFar
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      depth: true,
      stencil: false,
      powerPreference: "high-performance"
    });

    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, HERO_CONFIG.dprMax));

    if ("outputEncoding" in this.renderer && "sRGBEncoding" in THREE) {
      this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    this.clock = new THREE.Clock();
    this.target = new THREE.Vector3(0.9, -0.14, 0);
    this.stage = new THREE.Group();
    this.lightRig = new THREE.Group();

    this.particles = createParticleSystems(THREE, HERO_COLORS);
    this.cyborg = createCyborgModel(THREE, HERO_COLORS, HERO_CONFIG.modelUrl);
    this.scannerRings = createScannerRings(THREE, HERO_COLORS);
    this.holograms = createHolographicCircles(THREE, HERO_COLORS);

    this.stage.add(this.particles.group);
    this.stage.add(this.cyborg.group);
    this.stage.add(this.scannerRings.group);
    this.stage.add(this.holograms.group);

    this.createNeonLighting();
    this.scene.add(this.stage);
    this.scene.add(this.lightRig);
  }

  createNeonLighting() {
    const THREE = this.THREE;

    const ambient = new THREE.AmbientLight(0x2d5872, 0.58);
    ambient.name = "ambient-cyborg-fill";
    this.scene.add(ambient);

    const rimLight = new THREE.DirectionalLight(0x6ed8ff, 2.65);
    rimLight.name = "blue-cyborg-rim-light";
    rimLight.position.set(-2.8, 2.4, -4.2);
    this.lightRig.add(rimLight);

    const lights = [
      { color: 0x25f7ff, intensity: 1.95, distance: 8, position: [1.5, 1.5, 2.8] },
      { color: 0xa855f7, intensity: 1.45, distance: 9, position: [3.2, -0.6, 3.4] },
      { color: 0xff2ec4, intensity: 1.05, distance: 8, position: [-1.9, 0.4, 2.6] }
    ];

    lights.forEach((light) => {
      const pointLight = new THREE.PointLight(light.color, light.intensity, light.distance);
      pointLight.position.set(...light.position);
      this.lightRig.add(pointLight);
    });

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.14, 1),
      new THREE.MeshBasicMaterial({
        color: HERO_COLORS.cyan,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );

    core.position.set(0, 0.18, 0.25);
    core.name = "neon-light-core";
    this.stage.add(core);
    this.neonCore = core;
  }

  bindEvents() {
    window.addEventListener("pointermove", this.handlePointerMove, { passive: true });
    window.addEventListener("resize", this.handleResize, { passive: true });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.canvas.parentElement);
    }
  }

  handlePointerMove(event) {
    this.pointer.x = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
    this.pointer.y = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    this.lastPointerMove = performance.now();
  }

  handleResize() {
    if (!this.supported) {
      return;
    }

    const bounds = this.canvas.parentElement.getBoundingClientRect();
    const width = Math.max(1, Math.floor(bounds.width));
    const height = Math.max(1, Math.floor(bounds.height));

    this.compact = width < 760;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, HERO_CONFIG.dprMax));
    this.renderer.setSize(width, height, false);

    this.camera.aspect = width / height;
    this.camera.fov = this.compact ? 62 : HERO_CONFIG.cameraFov;
    this.camera.updateProjectionMatrix();

    this.camera.position.set(this.compact ? 0.1 : 0, this.compact ? 0.12 : 0.18, this.compact ? 7.8 : 6.5);
    this.target.set(this.compact ? 0.34 : 0.9, this.compact ? -0.18 : -0.14, 0);

    this.stage.position.set(this.compact ? 0.42 : 1.38, this.compact ? -0.52 : -0.08, 0);
    this.stage.scale.setScalar(this.compact ? 0.78 : width < 1120 ? 0.92 : 1);

    this.particles.setCompact(this.compact);
    this.cyborg.setCompact(this.compact);
    this.scannerRings.setCompact(this.compact);
    this.holograms.setCompact(this.compact);
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.stop();
      return;
    }

    this.start();
  }

  start() {
    if (!this.supported || this.running) {
      return;
    }

    this.running = true;
    this.clock.start();
    this.frameId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frameId);
  }

  tick() {
    if (!this.running) {
      return;
    }

    const elapsed = this.clock.getElapsedTime();
    const ease = HERO_CONFIG.pointerEase;

    this.smoothPointer.x += (this.pointer.x - this.smoothPointer.x) * ease;
    this.smoothPointer.y += (this.pointer.y - this.smoothPointer.y) * ease;

    const pointerIdleMs = this.lastPointerMove === 0 ? Infinity : performance.now() - this.lastPointerMove;
    const idleFactor = Math.min(
      1,
      Math.max(0, (pointerIdleMs - HERO_CONFIG.idleDelayMs) / HERO_CONFIG.idleBlendMs)
    );

    this.stage.rotation.y = this.smoothPointer.x * 0.14 + Math.sin(elapsed * 0.22) * 0.035;
    this.stage.rotation.x = -this.smoothPointer.y * 0.055;
    this.lightRig.rotation.y = this.smoothPointer.x * 0.18;

    if (this.neonCore) {
      this.neonCore.rotation.x = elapsed * 0.7;
      this.neonCore.rotation.y = elapsed * 1.1;
      this.neonCore.material.opacity = 0.62 + Math.sin(elapsed * 2.4) * 0.18;
    }

    this.particles.update(elapsed);
    this.cyborg.update(elapsed, this.smoothPointer, idleFactor);
    this.scannerRings.update(elapsed);
    this.holograms.update(elapsed);

    this.camera.position.x += (this.smoothPointer.x * (this.compact ? 0.12 : 0.22) - this.camera.position.x) * 0.035;
    this.camera.position.y +=
      ((this.compact ? 0.12 : 0.18) - this.smoothPointer.y * 0.12 - this.camera.position.y) * 0.035;
    this.camera.lookAt(this.target);

    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(this.tick);
  }

  destroy() {
    if (!this.supported) {
      return;
    }

    this.stop();
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }

      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.renderer.dispose();
  }
}
