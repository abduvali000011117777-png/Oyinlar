import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AgeGroupId } from '../types/platform';

interface ArenaScene3DProps {
  ageGroup?: AgeGroupId;
  pulseSignal?: number; // increment for celebratory energy pulse
  className?: string;
}

const _vec3 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);
const _euler = new THREE.Euler();

function detectSoftwareGl(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function buildCompositeWorldHero(ageGroup: AgeGroupId): THREE.Group {
  const hero = new THREE.Group();

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.85,
    roughness: 0.2,
  });
  const cyanMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.35,
    roughness: 0.25,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.28,
  });
  const coralMat = new THREE.MeshStandardMaterial({
    color: 0xfb7185,
    metalness: 0.1,
    roughness: 0.55,
  });
  const emeraldMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    metalness: 0.15,
    roughness: 0.45,
  });
  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.7,
    roughness: 0.28,
  });

  if (ageGroup === '3-5') {
    // Stylized 6-part wooden/toy rainbow castle & star totem
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.35, 24), emeraldMat);
    base.position.y = -1.1;
    hero.add(base);

    const block1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), coralMat);
    block1.position.set(-0.65, -0.35, 0);
    block1.rotation.y = 0.25;
    hero.add(block1);

    const block2 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.3, 20), cyanMat);
    block2.position.set(0.65, -0.25, 0.15);
    hero.add(block2);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.75, 16), goldMat);
    roof.position.set(0.65, 0.78, 0.15);
    hero.add(roof);

    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.14, 14, 32, Math.PI), goldMat);
    arch.position.set(0, -0.8, -0.2);
    hero.add(arch);

    const starCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), goldMat);
    starCore.position.set(0, 0.7, 0.35);
    starCore.name = 'spinner';
    hero.add(starCore);
  } else if (ageGroup === '6-9') {
    // Floating adventure compass tower & crystal island (7 parts)
    const island = new THREE.Mesh(new THREE.ConeGeometry(1.75, 1.4, 7), emeraldMat);
    island.rotation.x = Math.PI;
    island.position.y = -1.15;
    hero.add(island);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.78, 1.65, 0.22, 7), emeraldMat);
    cap.position.y = -0.38;
    hero.add(cap);

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.62, 1.35, 12), obsidianMat);
    tower.position.set(0, 0.38, 0);
    hero.add(tower);

    const compassRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.08, 12, 32), goldMat);
    compassRing.position.set(0, 0.5, 0);
    compassRing.name = 'spinner';
    hero.add(compassRing);

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), cyanMat);
    crystal.position.set(0, 1.42, 0);
    crystal.name = 'crystal';
    hero.add(crystal);

    const sat1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), goldMat);
    sat1.position.set(-1.35, 0.3, 0.3);
    hero.add(sat1);

    const sat2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), coralMat);
    sat2.position.set(1.35, 0.45, -0.25);
    hero.add(sat2);
  } else if (ageGroup === '10-15') {
    // Astronomical brass & glass orrery (8 parts)
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.55, 0.28, 32), obsidianMat);
    plinth.position.y = -1.25;
    hero.add(plinth);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 1.15, 16), goldMat);
    stem.position.y = -0.6;
    hero.add(stem);

    const sun = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 2), goldMat);
    sun.position.y = 0.2;
    sun.name = 'crystal';
    hero.add(sun);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.035, 12, 48), goldMat);
    ring1.position.y = 0.2;
    ring1.rotation.x = Math.PI / 2.6;
    ring1.name = 'spinner';
    hero.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.03, 12, 56), cyanMat);
    ring2.position.y = 0.2;
    ring2.rotation.x = Math.PI / 3.4;
    ring2.rotation.y = 0.45;
    ring2.name = 'spinner2';
    hero.add(ring2);

    const planet1 = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), cyanMat);
    planet1.position.set(1.05, 0.2, 0);
    ring1.add(planet1);

    const planet2 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), emeraldMat);
    planet2.position.set(-1.55, 0.2, 0);
    ring2.add(planet2);
  } else {
    // 16-20 Grandmaster Tactical Polyhedral Core (8 parts)
    const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.8, 0.2, 8), obsidianMat);
    basePlate.position.y = -1.25;
    hero.add(basePlate);

    const goldTrim = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.045, 10, 48), goldMat);
    goldTrim.rotation.x = Math.PI / 2;
    goldTrim.position.y = -1.14;
    hero.add(goldTrim);

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.68, 0), goldMat);
    core.position.y = 0.18;
    core.name = 'crystal';
    hero.add(core);

    const cage = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.95, 0),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        wireframe: true,
        metalness: 0.7,
        roughness: 0.2,
      })
    );
    cage.position.y = 0.18;
    cage.name = 'spinner';
    hero.add(cage);

    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.04, 12, 64), goldMat);
    outerRing.position.y = 0.18;
    outerRing.rotation.x = Math.PI / 3;
    outerRing.name = 'spinner2';
    hero.add(outerRing);

    for (let i = 0; i < 4; i++) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), obsidianMat);
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      pillar.position.set(Math.cos(angle) * 1.35, -0.85, Math.sin(angle) * 1.35);
      hero.add(pillar);
    }
  }

  return hero;
}

export default function ArenaScene3D({
  ageGroup = '10-15',
  pulseSignal = 0,
  className = '',
}: ArenaScene3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pulseRef = useRef(0);

  useEffect(() => {
    if (pulseSignal > 0) {
      pulseRef.current = 1.0;
    }
  }, [pulseSignal]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isSoftwareGl = detectSoftwareGl();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080d1a, 0.055);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 80);
    camera.position.set(0, 0.65, 6.2);

    // 3-point balanced lighting rig
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 1.9);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    // Hero composite model
    const heroGroup = buildCompositeWorldHero(ageGroup);
    heroGroup.position.set(0, 0.05, 0);
    scene.add(heroGroup);

    // Instanced floating geometric particles
    const particleCount = 42;
    const pGeo = new THREE.OctahedronGeometry(0.08, 0);
    const pMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.6,
      roughness: 0.25,
    });
    const instanced = new THREE.InstancedMesh(pGeo, pMat, particleCount);
    instanced.frustumCulled = false;

    const pSeeds: Array<{ x: number; y: number; z: number; speed: number; phase: number; s: number }> = [];
    const palette = [
      new THREE.Color(0xfbbf24),
      new THREE.Color(0x38bdf8),
      new THREE.Color(0x34d399),
      new THREE.Color(0xfb7185),
    ];
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 2.6 + (i % 5) * 0.75;
      pSeeds.push({
        x: Math.cos(angle) * radius,
        y: ((i % 7) - 3) * 0.65,
        z: Math.sin(angle) * radius - 1.5,
        speed: 0.35 + (i % 4) * 0.15,
        phase: i * 0.7,
        s: 0.6 + (i % 4) * 0.3,
      });
      instanced.setColorAt(i, palette[i % palette.length]);
    }
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
    scene.add(instanced);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (e: PointerEvent) => {
      pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      pointerY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    let disposed = false;
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Exponential damping for subtle pointer parallax
        heroGroup.rotation.y = THREE.MathUtils.damp(
          heroGroup.rotation.y,
          pointerX * 0.45 + elapsed * 0.25,
          3.5,
          delta
        );
        heroGroup.rotation.x = THREE.MathUtils.damp(
          heroGroup.rotation.x,
          pointerY * 0.2,
          3.5,
          delta
        );

        const pulseScale = 1 + pulseRef.current * 0.16;
        pulseRef.current = THREE.MathUtils.damp(pulseRef.current, 0, 5, delta);
        heroGroup.scale.setScalar(pulseScale);

        const spinner = heroGroup.getObjectByName('spinner');
        if (spinner) {
          spinner.rotation.y += delta * 0.8;
          spinner.rotation.z += delta * 0.35;
        }
        const spinner2 = heroGroup.getObjectByName('spinner2');
        if (spinner2) {
          spinner2.rotation.y -= delta * 0.55;
        }
        const crystal = heroGroup.getObjectByName('crystal');
        if (crystal) {
          crystal.rotation.y += delta * 1.1;
          crystal.position.y += Math.sin(elapsed * 2.2) * 0.0018;
        }

        for (let i = 0; i < particleCount; i++) {
          const p = pSeeds[i];
          _vec3.set(
            p.x + Math.sin(elapsed * p.speed + p.phase) * 0.2,
            p.y + Math.cos(elapsed * p.speed + p.phase) * 0.28,
            p.z
          );
          _euler.set(elapsed * p.speed, elapsed * 0.5, 0);
          _quat.setFromEuler(_euler);
          _scale.setScalar(p.s);
          _mat4.compose(_vec3, _quat, _scale);
          instanced.setMatrixAt(i, _mat4);
        }
        instanced.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);

      if (prefersReducedMotion) return;
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      envTarget.dispose();
      renderer.dispose();
    };
  }, [ageGroup]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    />
  );
}
