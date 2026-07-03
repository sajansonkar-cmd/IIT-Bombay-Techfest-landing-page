function createRingMaterial(THREE, color, opacity) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}

export function createScannerRings(THREE, colors) {
  const group = new THREE.Group();
  const rings = [];
  const configs = [
    {
      radius: 1.08,
      tube: 0.006,
      color: colors.cyan,
      opacity: 0.72,
      rotation: [Math.PI / 2.45, 0.12, 0.2],
      speed: 0.64
    },
    {
      radius: 1.56,
      tube: 0.005,
      color: colors.purple,
      opacity: 0.56,
      rotation: [Math.PI / 2.12, -0.28, -0.4],
      speed: -0.42
    },
    {
      radius: 2.08,
      tube: 0.004,
      color: colors.magenta,
      opacity: 0.44,
      rotation: [Math.PI / 1.86, 0.44, 0.12],
      speed: 0.28
    },
    {
      radius: 2.72,
      tube: 0.003,
      color: colors.mint,
      opacity: 0.28,
      rotation: [Math.PI / 2.8, -0.16, 0.72],
      speed: -0.2
    }
  ];

  configs.forEach((config) => {
    const geometry = new THREE.TorusGeometry(config.radius, config.tube, 8, 192);
    const material = createRingMaterial(THREE, config.color, config.opacity);
    const ring = new THREE.Mesh(geometry, material);

    ring.rotation.set(...config.rotation);
    ring.userData = {
      baseRotation: ring.rotation.clone(),
      speed: config.speed,
      baseOpacity: config.opacity
    };

    rings.push(ring);
    group.add(ring);
  });

  const sweepGeometry = new THREE.BufferGeometry();
  const sweepPositions = [];

  for (let index = 0; index < 74; index += 1) {
    const progress = index / 73;
    const angle = progress * Math.PI * 1.22;
    const radius = 2.42;
    sweepPositions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius * 0.48);
  }

  sweepGeometry.setAttribute("position", new THREE.Float32BufferAttribute(sweepPositions, 3));

  const sweep = new THREE.Line(
    sweepGeometry,
    new THREE.LineBasicMaterial({
      color: colors.cyan,
      transparent: true,
      opacity: 0.64,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );

  sweep.rotation.x = Math.PI / 2.32;
  group.add(sweep);

  return {
    group,
    update(elapsed) {
      rings.forEach((ring, index) => {
        ring.rotation.z = ring.userData.baseRotation.z + elapsed * ring.userData.speed;
        ring.rotation.x = ring.userData.baseRotation.x + Math.sin(elapsed * 0.24 + index) * 0.045;
        ring.material.opacity = ring.userData.baseOpacity + Math.sin(elapsed * 1.6 + index) * 0.08;
      });

      sweep.rotation.z = elapsed * 0.9;
      sweep.material.opacity = 0.44 + Math.sin(elapsed * 2.1) * 0.18;
    },
    setCompact(compact) {
      group.scale.setScalar(compact ? 0.82 : 1);
    }
  };
}
