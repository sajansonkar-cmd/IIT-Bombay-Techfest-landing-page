import { HERO_CONFIG } from "./config.js";

function jitter(amount) {
  return (Math.random() - 0.5) * amount;
}

function pushPoint(target, seeds, point) {
  target.push(point.x, point.y, point.z);
  seeds.push(Math.random());
}

function addCluster(target, seeds, count, sampler) {
  for (let index = 0; index < count; index += 1) {
    const progress = count > 1 ? index / (count - 1) : 0;
    pushPoint(target, seeds, sampler(progress, index));
  }
}

function createFigureGeometry(THREE) {
  const positions = [];
  const seeds = [];

  addCluster(positions, seeds, 920, () => {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 0.43 + jitter(0.06);

    return {
      x: Math.sin(phi) * Math.cos(theta) * radius,
      y: 1.34 + Math.cos(phi) * radius,
      z: Math.sin(phi) * Math.sin(theta) * radius * 0.82
    };
  });

  addCluster(positions, seeds, 1540, (progress) => {
    const y = -0.82 + progress * 1.92;
    const chest = Math.sin(progress * Math.PI);
    const waist = 0.48 - chest * 0.08;
    const theta = Math.random() * Math.PI * 2;

    return {
      x: Math.cos(theta) * waist * (0.56 + chest * 0.34) + jitter(0.04),
      y,
      z: Math.sin(theta) * waist * 0.34 + jitter(0.035)
    };
  });

  const limbs = [
    { ax: -0.5, ay: 0.78, bx: -1.46, by: -0.36 },
    { ax: 0.5, ay: 0.78, bx: 1.46, by: -0.36 },
    { ax: -0.24, ay: -0.76, bx: -0.72, by: -2.18 },
    { ax: 0.24, ay: -0.76, bx: 0.72, by: -2.18 }
  ];

  limbs.forEach((limb) => {
    addCluster(positions, seeds, 430, (progress) => {
      const taper = 0.075 * (1 - progress * 0.45);

      return {
        x: limb.ax + (limb.bx - limb.ax) * progress + jitter(taper),
        y: limb.ay + (limb.by - limb.ay) * progress + jitter(taper),
        z: jitter(0.18)
      };
    });
  });

  addCluster(positions, seeds, 420, (progress) => {
    const turn = progress * Math.PI * 12.5;
    const radius = 0.74 + Math.sin(progress * Math.PI * 4) * 0.07;

    return {
      x: Math.cos(turn) * radius,
      y: 1.12 - progress * 2.86,
      z: Math.sin(turn) * radius * 0.42
    };
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));

  return geometry;
}

function createFieldGeometry(THREE) {
  const positions = [];
  const seeds = [];
  const count = HERO_CONFIG.particleCount.field;

  for (let index = 0; index < count; index += 1) {
    const radius = 2.4 + Math.random() * 5.7;
    const theta = Math.random() * Math.PI * 2;
    const y = -2.45 + Math.random() * 5.1;

    positions.push(Math.cos(theta) * radius, y, Math.sin(theta) * radius * 0.55 - 0.7);
    seeds.push(Math.random());
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));

  return geometry;
}

function createParticleMaterial(THREE, colors, options) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: options.size },
      uOpacity: { value: options.opacity },
      uColorA: { value: new THREE.Color(options.colorA || colors.cyan) },
      uColorB: { value: new THREE.Color(options.colorB || colors.purple) }
    },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      uniform float uSize;
      varying float vSeed;

      void main() {
        vec3 p = position;
        float wave = sin(uTime * 1.35 + aSeed * 6.2831);
        p.x += sin(uTime * 0.45 + position.y * 2.3 + aSeed * 8.0) * 0.025;
        p.y += cos(uTime * 0.55 + position.x * 1.6 + aSeed * 5.0) * 0.018;
        p.z += sin(uTime * 0.4 + position.x * 1.4 + position.y) * 0.035;

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        float perspective = 300.0 / max(1.0, -mvPosition.z);
        gl_PointSize = max(1.0, uSize * (1.0 + wave * 0.28) * perspective);
        gl_Position = projectionMatrix * mvPosition;
        vSeed = aSeed;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vSeed;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float dist = length(uv);
        float glow = smoothstep(0.5, 0.04, dist);
        vec3 color = mix(uColorA, uColorB, smoothstep(0.05, 0.95, vSeed));
        gl_FragColor = vec4(color, glow * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}

export function createParticleSystems(THREE, colors) {
  const group = new THREE.Group();

  const figureMaterial = createParticleMaterial(THREE, colors, {
    size: 3.3,
    opacity: 0.9,
    colorA: colors.cyan,
    colorB: colors.magenta
  });

  const fieldMaterial = createParticleMaterial(THREE, colors, {
    size: 2.1,
    opacity: 0.42,
    colorA: colors.mint,
    colorB: colors.purple
  });

  const figure = new THREE.Points(createFigureGeometry(THREE), figureMaterial);
  const field = new THREE.Points(createFieldGeometry(THREE), fieldMaterial);

  figure.name = "cybernetic-particle-figure";
  field.name = "ambient-particle-field";
  field.position.z = -1.6;

  group.add(field);
  group.add(figure);

  return {
    group,
    materials: [figureMaterial, fieldMaterial],
    update(elapsed) {
      figureMaterial.uniforms.uTime.value = elapsed;
      fieldMaterial.uniforms.uTime.value = elapsed * 0.72;
      figure.rotation.y = elapsed * 0.12;
      field.rotation.y = elapsed * -0.025;
      field.rotation.x = Math.sin(elapsed * 0.18) * 0.04;
    },
    setCompact(compact) {
      figureMaterial.uniforms.uSize.value = compact ? 2.6 : 3.3;
      fieldMaterial.uniforms.uSize.value = compact ? 1.6 : 2.1;
    }
  };
}
