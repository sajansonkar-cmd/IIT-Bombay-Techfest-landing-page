const MODEL_TARGET_HEIGHT = 3.35;

function cloneMaterialWithGlow(THREE, material, colors) {
  const source = material || new THREE.MeshStandardMaterial({ color: 0xc9f8ff });
  const next = source.clone();
  const blue = new THREE.Color(colors.cyan);

  if ("color" in next && next.color) {
    next.color.lerp(new THREE.Color(0xd9fbff), 0.24);
  }

  if ("emissive" in next && next.emissive) {
    next.emissive.copy(blue);
    next.emissiveIntensity = Math.max(next.emissiveIntensity || 0, 0.85);
  }

  if ("metalness" in next) {
    next.metalness = Math.max(next.metalness, 0.68);
  }

  if ("roughness" in next) {
    next.roughness = Math.min(next.roughness, 0.32);
  }

  next.needsUpdate = true;
  return next;
}

function applyBlueEmissiveGlow(THREE, model, colors) {
  model.traverse((object) => {
    if (!object.isMesh) {
      return;
    }

    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = true;

    if (Array.isArray(object.material)) {
      object.material = object.material.map((material) => cloneMaterialWithGlow(THREE, material, colors));
    } else {
      object.material = cloneMaterialWithGlow(THREE, object.material, colors);
    }
  });
}

function createGlowShell(THREE, model, colors) {
  const shell = model.clone(true);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: colors.cyan,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
  });

  shell.traverse((object) => {
    if (object.isMesh) {
      object.material = glowMaterial;
    }
  });

  shell.scale.setScalar(1.035);
  return shell;
}

function normalizeModel(THREE, model, targetHeight) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const height = Math.max(size.y, 0.001);

  model.position.sub(center);

  return targetHeight / height;
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}

function createFallbackCyborg(THREE, colors) {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x9db7c8,
    metalness: 0.86,
    roughness: 0.22,
    emissive: new THREE.Color(colors.cyan),
    emissiveIntensity: 0.72
  });
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: colors.cyan,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.34, 1.28, 18), bodyMaterial);
  torso.position.y = 0.18;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 18), bodyMaterial);
  head.position.y = 1.08;
  group.add(head);

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), coreMaterial);
  core.position.set(0, 0.42, 0.36);
  group.add(core);

  const limbGeometry = new THREE.CylinderGeometry(0.055, 0.07, 1.08, 10);
  const limbs = [
    { position: [-0.58, 0.16, 0], rotation: [0, 0, -0.42] },
    { position: [0.58, 0.16, 0], rotation: [0, 0, 0.42] },
    { position: [-0.24, -0.92, 0], rotation: [0, 0, 0.18] },
    { position: [0.24, -0.92, 0], rotation: [0, 0, -0.18] }
  ];

  limbs.forEach((limb) => {
    const mesh = new THREE.Mesh(limbGeometry, bodyMaterial);
    mesh.position.set(...limb.position);
    mesh.rotation.set(...limb.rotation);
    group.add(mesh);
  });

  return group;
}

export function createCyborgModel(THREE, colors, modelUrl) {
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  const fallback = createFallbackCyborg(THREE, colors);

  fallback.name = "cyborg-fallback";
  pivot.add(fallback);
  group.add(pivot);

  const state = {
    loaded: false,
    baseScale: 1,
    responsiveScale: 1,
    baseY: 0,
    targetRotationX: 0,
    targetRotationY: 0
  };

  function setLoadedModel(model) {
    applyBlueEmissiveGlow(THREE, model, colors);
    const normalizationScale = normalizeModel(THREE, model, MODEL_TARGET_HEIGHT);
    const shell = createGlowShell(THREE, model, colors);

    disposeObject(fallback);
    pivot.clear();
    pivot.add(model);
    pivot.add(shell);
    pivot.scale.setScalar(normalizationScale);
    state.loaded = true;
  }

  if (THREE.GLTFLoader) {
    const loader = new THREE.GLTFLoader();

    loader.load(
      modelUrl,
      (gltf) => {
        setLoadedModel(gltf.scene);
      },
      undefined,
      (error) => {
        console.warn(`[Techfest Hero] Could not load GLB model at ${modelUrl}.`, error);
        state.loaded = false;
      }
    );
  } else {
    console.warn("[Techfest Hero] THREE.GLTFLoader is unavailable. Using fallback cyborg mesh.");
  }

  return {
    group,
    update(elapsed, pointer, idleFactor) {
      const idleRotation = elapsed * 0.34;
      const mouseRotation = pointer.x * 0.62;

      state.targetRotationY = mouseRotation * (1 - idleFactor) + idleRotation * idleFactor;
      state.targetRotationX = -pointer.y * 0.16 * (1 - idleFactor);

      pivot.rotation.y += (state.targetRotationY - pivot.rotation.y) * 0.06;
      pivot.rotation.x += (state.targetRotationX - pivot.rotation.x) * 0.06;
      group.position.y = state.baseY + Math.sin(elapsed * 1.18) * 0.095;
    },
    setCompact(compact) {
      state.responsiveScale = compact ? 0.78 : 1;
      group.scale.setScalar(state.responsiveScale);
      group.position.x = compact ? 0.08 : 0;
      state.baseY = compact ? -0.04 : 0;
    }
  };
}
