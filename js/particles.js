/* ═══════════════════════════════════════════
   THREE.JS 3D PARTICLE FIELD
   Responds to scroll position and mouse movement
   ═══════════════════════════════════════════ */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 50;

  /* ─── PARTICLE SYSTEM ─── */
  const PARTICLE_COUNT = 2000;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const opacities = new Float32Array(PARTICLE_COUNT);

  const spread = 120;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * spread;
    positions[i3 + 1] = (Math.random() - 0.5) * spread;
    positions[i3 + 2] = (Math.random() - 0.5) * spread - 20;

    velocities[i3] = (Math.random() - 0.5) * 0.01;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.005;

    sizes[i] = Math.random() * 2.5 + 0.5;
    opacities[i] = Math.random() * 0.6 + 0.1;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const vertexShader = `
    attribute float size;
    varying float vOpacity;
    uniform float uScrollY;
    uniform float uTime;

    void main() {
      vec3 pos = position;
      pos.y += sin(uTime * 0.3 + pos.x * 0.05) * 1.5;
      pos.x += cos(uTime * 0.2 + pos.z * 0.05) * 1.0;
      pos.y -= uScrollY * 0.015;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * (50.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;

      float dist = length(mvPosition.xyz);
      vOpacity = smoothstep(80.0, 20.0, dist) * 0.5;
    }
  `;

  const fragmentShader = `
    varying float vOpacity;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uTime;

    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;

      float alpha = smoothstep(0.5, 0.1, d) * vOpacity;
      vec3 color = mix(uColor1, uColor2, sin(uTime * 0.5) * 0.5 + 0.5);
      gl_FragColor = vec4(color, alpha);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uScrollY: { value: 0 },
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(0xe8734a) },
      uColor2: { value: new THREE.Color(0x7b8cde) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  /* ─── CONNECTING LINES (subtle mesh) ─── */
  const lineGeometry = new THREE.BufferGeometry();
  const MAX_LINES = 600;
  const linePositions = new Float32Array(MAX_LINES * 6);
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeometry.setDrawRange(0, 0);

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x7b8cde,
    transparent: true,
    opacity: 0.04,
    blending: THREE.AdditiveBlending,
  });

  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  /* ─── STATE ─── */
  let scrollY = 0;
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  window.addEventListener('scroll', () => {
    scrollY = window.pageYOffset;
  }, { passive: true });

  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ─── ANIMATION LOOP ─── */
  const clock = new THREE.Clock();

  function updateLines() {
    const pos = geometry.attributes.position.array;
    let lineIdx = 0;
    const threshold = 12;

    for (let i = 0; i < Math.min(PARTICLE_COUNT, 200); i++) {
      for (let j = i + 1; j < Math.min(PARTICLE_COUNT, 200); j++) {
        if (lineIdx >= MAX_LINES) break;
        const i3 = i * 3;
        const j3 = j * 3;
        const dx = pos[i3] - pos[j3];
        const dy = pos[i3 + 1] - pos[j3 + 1];
        const dz = pos[i3 + 2] - pos[j3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < threshold) {
          const li = lineIdx * 6;
          linePositions[li] = pos[i3];
          linePositions[li + 1] = pos[i3 + 1];
          linePositions[li + 2] = pos[i3 + 2];
          linePositions[li + 3] = pos[j3];
          linePositions[li + 4] = pos[j3 + 1];
          linePositions[li + 5] = pos[j3 + 2];
          lineIdx++;
        }
      }
      if (lineIdx >= MAX_LINES) break;
    }

    lineGeometry.setDrawRange(0, lineIdx * 2);
    lineGeometry.attributes.position.needsUpdate = true;
  }

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    material.uniforms.uScrollY.value = scrollY;
    material.uniforms.uTime.value = elapsed;

    particles.rotation.y = mouseX * 0.15 + elapsed * 0.02;
    particles.rotation.x = mouseY * 0.08;

    lines.rotation.y = particles.rotation.y;
    lines.rotation.x = particles.rotation.x;

    const posAttr = geometry.attributes.position;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      posAttr.array[i3] += velocities[i3];
      posAttr.array[i3 + 1] += velocities[i3 + 1];
      posAttr.array[i3 + 2] += velocities[i3 + 2];

      if (Math.abs(posAttr.array[i3]) > spread / 2) velocities[i3] *= -1;
      if (Math.abs(posAttr.array[i3 + 1]) > spread / 2) velocities[i3 + 1] *= -1;
      if (Math.abs(posAttr.array[i3 + 2]) > spread / 2) velocities[i3 + 2] *= -1;
    }
    posAttr.needsUpdate = true;

    if (Math.floor(elapsed * 2) % 3 === 0) {
      updateLines();
    }

    const fadeOpacity = Math.max(0, 1 - scrollY / (window.innerHeight * 2));
    renderer.domElement.style.opacity = Math.max(0.15, fadeOpacity);

    renderer.render(scene, camera);
  }

  animate();
})();
