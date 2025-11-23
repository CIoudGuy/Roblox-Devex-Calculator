import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function BackgroundCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.4));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05060b, 0.04);

    const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 80);
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
        color.setHSL(tint + Math.random() * 0.05, 0.35, 0.62);
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
          opacity: 0.55,
          depthWrite: false,
        })
      );
    };

    const layerNear = makeStars(260, 0.04, 6.5, 0.58);
    const layerMid = makeStars(340, 0.032, 9.5, 0.56);
    const layerFar = makeStars(520, 0.022, 14, 0.54);
    starGroup.add(layerFar, layerMid, layerNear);

    const clock = new THREE.Clock();
    let smoothX = 0.5;
    let smoothY = 0.5;
    const pointer = { x: 0.5, y: 0.5 };

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const onPointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer);
    resize();

    const lerp = (a, b, t) => a + (b - a) * t;

    let mounted = true;
    const animate = () => {
      if (!mounted) return;
      const t = clock.getElapsedTime();
      smoothX = lerp(smoothX, pointer.x, 0.018);
      smoothY = lerp(smoothY, pointer.y, 0.018);
      const tiltX = (smoothY - 0.5) * 0.02;
      const tiltY = (smoothX - 0.5) * 0.038;
      starGroup.rotation.x = tiltX;
      starGroup.rotation.y = tiltY;

      layerFar.rotation.y = t * -0.004;
      layerMid.rotation.y = t * 0.0035;
      layerNear.rotation.y = t * 0.0048;
      layerNear.rotation.x = t * 0.0018;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      mounted = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      renderer.dispose();
    };
  }, []);

  return <canvas id="gl-canvas" ref={ref} />;
}
