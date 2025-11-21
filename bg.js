const bgState = {
  pointer: { x: 0.5, y: 0.5 },
};

function initBackground() {
  if (!window.THREE) return;
  const canvas = document.getElementById("gl-canvas");
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060b, 0.06);

  const camera = new THREE.PerspectiveCamera(
    32,
    window.innerWidth / window.innerHeight,
    0.1,
    80
  );
  camera.position.set(0, 0, 10);

  const ambient = new THREE.AmbientLight(0x7aa8ff, 0.25);
  scene.add(ambient);

  const starGroup = new THREE.Group();
  scene.add(starGroup);

  const makeStars = (count, size, spread, tint) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = spread * (0.5 + Math.random() * 0.5);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      color.setHSL(tint + Math.random() * 0.05, 0.45, 0.65);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      })
    );
  };

  const layerNear = makeStars(220, 0.032, 5.5, 0.58);
  const layerFar = makeStars(320, 0.02, 8.5, 0.55);
  starGroup.add(layerFar, layerNear);

  const clock = new THREE.Clock();

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const onPointer = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    bgState.pointer.x = (event.clientX - rect.left) / rect.width;
    bgState.pointer.y = (event.clientY - rect.top) / rect.height;
  };

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointer);
  resize();

  function animate() {
    const t = clock.getElapsedTime();
    const tiltX = (bgState.pointer.y - 0.5) * 0.1;
    const tiltY = (bgState.pointer.x - 0.5) * 0.16;
    starGroup.rotation.x = tiltX;
    starGroup.rotation.y = tiltY;

    layerFar.rotation.y = t * -0.01;
    layerNear.rotation.y = t * 0.012;
    layerNear.rotation.x = t * 0.004;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}

document.addEventListener("DOMContentLoaded", initBackground);
