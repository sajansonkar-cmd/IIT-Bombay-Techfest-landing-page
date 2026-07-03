function createCircleGeometry(THREE, radius, segments) {
  const positions = [];

  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

  return geometry;
}

function createDashedCircle(THREE, colors, radius, color, opacity) {
  const line = new THREE.LineLoop(
    createCircleGeometry(THREE, radius, 96),
    new THREE.LineDashedMaterial({
      color,
      transparent: true,
      opacity,
      dashSize: 0.05,
      gapSize: 0.04,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );

  line.computeLineDistances();
  return line;
}

export function createHolographicCircles(THREE, colors) {
  const group = new THREE.Group();
  const circles = [];
  const configs = [
    { x: -1.9, y: 1.2, z: -1.2, r: 0.34, color: colors.cyan, opacity: 0.46 },
    { x: -2.55, y: -0.4, z: -0.8, r: 0.52, color: colors.purple, opacity: 0.42 },
    { x: 2.34, y: 1.42, z: -1.1, r: 0.42, color: colors.magenta, opacity: 0.38 },
    { x: 2.78, y: -0.82, z: -0.9, r: 0.66, color: colors.mint, opacity: 0.36 },
    { x: 0.06, y: 2.0, z: -1.5, r: 0.25, color: colors.cyan, opacity: 0.34 },
    { x: -0.28, y: -1.9, z: -1.2, r: 0.48, color: colors.purple, opacity: 0.3 }
  ];

  configs.forEach((config, index) => {
    const circle = createDashedCircle(THREE, colors, config.r, config.color, config.opacity);

    circle.position.set(config.x, config.y, config.z);
    circle.rotation.set(Math.PI / 2.8 + index * 0.18, index * 0.34, index * 0.12);
    circle.userData = {
      baseY: config.y,
      baseOpacity: config.opacity,
      spin: index % 2 === 0 ? 0.2 : -0.16
    };

    circles.push(circle);
    group.add(circle);
  });

  return {
    group,
    update(elapsed) {
      circles.forEach((circle, index) => {
        circle.rotation.z += circle.userData.spin * 0.01;
        circle.position.y = circle.userData.baseY + Math.sin(elapsed * 0.64 + index) * 0.08;
        circle.material.opacity = circle.userData.baseOpacity + Math.sin(elapsed * 1.1 + index) * 0.08;
      });
    },
    setCompact(compact) {
      group.visible = !compact;
    }
  };
}
