import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface VoxelBlock {
  x: number;
  y: number;
  z: number;
  color?: number;
}

interface Interactive3DGeometryProps {
  blocks: VoxelBlock[];
  polyhedronType?: 'cube_stack' | 'octahedron' | 'dodecahedron' | 'icosahedron';
  className?: string;
}

export default function Interactive3DGeometry({
  blocks,
  polyhedronType = 'cube_stack',
  className = '',
}: Interactive3DGeometryProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    let isSoftwareGl = true;
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const gpu = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));

    const w = container.clientWidth || 320;
    const h = container.clientHeight || 260;
    renderer.setSize(w, h);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTex = pmrem.fromScene(room, 0.04);
    scene.environment = envTex.texture;
    room.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 50);
    camera.position.set(3.4, 2.8, 3.8);
    camera.lookAt(0, 0.2, 0);

    scene.add(new THREE.HemisphereLight(0xbae6fd, 0x0f172a, 0.9));
    const key = new THREE.DirectionalLight(0xfff7ed, 2.0);
    key.position.set(4, 6, 5);
    scene.add(key);

    const group = new THREE.Group();
    if (polyhedronType === 'cube_stack') {
      const boxGeo = new THREE.BoxGeometry(0.86, 0.86, 0.86);
      const edgeGeo = new THREE.EdgesGeometry(boxGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xe0f2fe });

      blocks.forEach((b) => {
        const mat = new THREE.MeshStandardMaterial({
          color: b.color ?? 0x38bdf8,
          metalness: 0.25,
          roughness: 0.35,
        });
        const mesh = new THREE.Mesh(boxGeo, mat);
        mesh.position.set(b.x * 0.9, b.y * 0.9 - 0.5, b.z * 0.9);
        const edges = new THREE.LineSegments(edgeGeo, lineMat);
        mesh.add(edges);
        group.add(mesh);
      });
    } else {
      const geo =
        polyhedronType === 'octahedron'
          ? new THREE.OctahedronGeometry(1.25, 0)
          : polyhedronType === 'dodecahedron'
            ? new THREE.DodecahedronGeometry(1.2, 0)
            : new THREE.IcosahedronGeometry(1.2, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.75,
        roughness: 0.22,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xffffff })
      );
      mesh.add(edges);
      group.add(mesh);
    }
    scene.add(group);

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let rotY = 0.4;
    let rotX = 0.2;
    let needsRender = true;

    const canvas = renderer.domElement;
    canvas.style.cursor = 'grab';

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      rotY += dx * 0.012;
      rotX = THREE.MathUtils.clamp(rotX + dy * 0.012, -1.1, 1.1);
      needsRender = true;
    };
    const onUp = () => {
      dragging = false;
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    let disposed = false;
    let frameId = 0;
    const renderLoop = () => {
      if (disposed) return;
      if (!dragging) {
        rotY += 0.005;
        needsRender = true;
      }
      if (needsRender) {
        group.rotation.y = rotY;
        group.rotation.x = rotX;
        renderer.render(scene, camera);
        needsRender = false;
      }
      if (isSoftwareGl) {
        frameId = window.setTimeout(renderLoop, 80);
      } else {
        frameId = requestAnimationFrame(renderLoop);
      }
    };
    renderLoop();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
      envTex.dispose();
      renderer.dispose();
    };
  }, [blocks, polyhedronType]);

  return (
    <div
      ref={mountRef}
      className={`w-full h-64 rounded-xl bg-slate-950/70 border border-slate-700/70 overflow-hidden ${className}`}
    />
  );
}
