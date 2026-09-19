import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Maximize2, Minimize2, Move3d, Palette, Sliders, Sparkles, Zap } from 'lucide-react';

export type LiveBackgroundTheme = 'pink_sky' | 'miami_sunset' | 'vaporwave' | 'quantum_pink' | 'cyber_neon';

interface FinancialWorldBackgroundProps {
  opacity?: number;
  interactive?: boolean;
}

interface FloatingQuote {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

export const FinancialWorldBackground: React.FC<FinancialWorldBackgroundProps> = ({
  opacity = 0.9,
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<LiveBackgroundTheme>('pink_sky');
  const [flowSpeed, setFlowSpeed] = useState<number>(1.15);
  const [waveTurbulence, setWaveTurbulence] = useState<number>(1.1);
  const [colorIntensity, setColorIntensity] = useState<number>(1.3);
  const [isInteractiveCanvas] = useState<boolean>(true);
  const [isExpandedViewer, setIsExpandedViewer] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [floatingQuotes, setFloatingQuotes] = useState<FloatingQuote[]>([]);
  const [activePresetName, setActivePresetName] = useState<string>('Hot Pink & Sky Blue');

  // References for live 3D animation loop
  const themeRef = useRef<LiveBackgroundTheme>(theme);
  const flowSpeedRef = useRef<number>(flowSpeed);
  const waveTurbulenceRef = useRef<number>(waveTurbulence);
  const colorIntensityRef = useRef<number>(colorIntensity);
  const shockwaveTriggerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    flowSpeedRef.current = flowSpeed;
  }, [flowSpeed]);

  useEffect(() => {
    waveTurbulenceRef.current = waveTurbulence;
  }, [waveTurbulence]);

  useEffect(() => {
    colorIntensityRef.current = colorIntensity;
  }, [colorIntensity]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. Scene & Atmosphere (Deep midnight obsidian canvas with pink & sky blue atmospheric fog)
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060913, 0.012);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 1000);

    // Orbital Coordinates
    let targetRadius = 38;
    let currentRadius = 38;
    let targetAzimuth = 0;
    let currentAzimuth = 0;
    let targetElevation = 0.14;
    let currentElevation = 0.14;

    const updateCameraPos = () => {
      const cosElev = Math.cos(currentElevation);
      camera.position.x = currentRadius * cosElev * Math.sin(currentAzimuth);
      camera.position.y = currentRadius * Math.sin(currentElevation);
      camera.position.z = currentRadius * cosElev * Math.cos(currentAzimuth);
      camera.lookAt(0, 1.2, 0);
    };
    updateCameraPos();

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Multi-Point Pink & Sky Blue Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x0a1020, 2.0);
    scene.add(ambientLight);

    // Primary Electric Sky Blue Key Light
    const skyBlueLight = new THREE.DirectionalLight(0x38bdf8, 3.2);
    skyBlueLight.position.set(30, 42, 25);
    scene.add(skyBlueLight);

    // Vivid Hot Pink Rim Light
    const hotPinkLight = new THREE.DirectionalLight(0xff2a85, 3.0);
    hotPinkLight.position.set(-30, 36, 18);
    scene.add(hotPinkLight);

    // Ground Sky Blue Fill
    const skyFill = new THREE.PointLight(0x0ea5e9, 3.0, 70);
    skyFill.position.set(0, -6, -14);
    scene.add(skyFill);

    // Overhead Magenta/Pink Glow Fill
    const pinkFill = new THREE.PointLight(0xec4899, 3.2, 65);
    pinkFill.position.set(16, 18, 10);
    scene.add(pinkFill);

    // Cursor Follow Light (Cycles dynamically between Pink and Sky Blue)
    const cursorPointLight = new THREE.PointLight(0x38bdf8, 4.2, 50);
    cursorPointLight.position.set(0, 5, 10);
    scene.add(cursorPointLight);

    // 4. Perspective Dual-Tone Floor Grid (Sky Blue & Hot Pink)
    const gridHelper = new THREE.GridHelper(160, 80, 0x38bdf8, 0x4a044e);
    gridHelper.position.y = -14;
    scene.add(gridHelper);

    // Radiant Concentric Rings on Ground Plane
    const innerRingGeo = new THREE.RingGeometry(14, 14.35, 64);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = -13.9;
    scene.add(innerRing);

    const outerRingGeo = new THREE.RingGeometry(26, 26.45, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xff2a85,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = -13.9;
    scene.add(outerRing);

    // 5. Stylized Dual-Tone Architectural Pillars (Hot Pink & Sky Blue Accents)
    const pillarConfigs = [
      { x: -22, z: -10, width: 2.8, depth: 2.8, baseH: 24, accentColor: 0xff2a85, bodyColor: 0x1f0b18 }, // Hot Pink
      { x: -14, z: -3,  width: 2.4, depth: 2.4, baseH: 18, accentColor: 0x38bdf8, bodyColor: 0x091b29 }, // Sky Blue
      { x: -6,  z: -14, width: 3.2, depth: 3.2, baseH: 28, accentColor: 0xf43f5e, bodyColor: 0x240a12 }, // Rose Pink
      { x: 1,   z: -5,  width: 2.6, depth: 2.6, baseH: 20, accentColor: 0x0ea5e9, bodyColor: 0x081726 }, // Deep Sky
      { x: 8,   z: -12, width: 3.0, depth: 3.0, baseH: 30, accentColor: 0xff2a85, bodyColor: 0x220b1c }, // Hot Pink
      { x: 16,  z: -6,  width: 2.4, depth: 2.4, baseH: 22, accentColor: 0x38bdf8, bodyColor: 0x0a1a28 }, // Sky Blue
      { x: 23,  z: -15, width: 3.6, depth: 3.6, baseH: 34, accentColor: 0xec4899, bodyColor: 0x1f0c18 }, // Pink
      { x: -28, z: -20, width: 4.2, depth: 4.2, baseH: 36, accentColor: 0x0284c7, bodyColor: 0x071524 }, // Cerulean
      { x: -2,  z: -20, width: 3.0, depth: 3.0, baseH: 26, accentColor: 0xff2a85, bodyColor: 0x240d1e }, // Neon Pink
      { x: 14,  z: 2,   width: 2.0, depth: 2.0, baseH: 16, accentColor: 0x38bdf8, bodyColor: 0x0a1926 }, // Sky Blue
      { x: -8,  z: 7,   width: 2.2, depth: 2.2, baseH: 14, accentColor: 0xf472b6, bodyColor: 0x1e0b16 }, // Soft Pink
      { x: 7,   z: 6,   width: 2.4, depth: 2.4, baseH: 15, accentColor: 0x38bdf8, bodyColor: 0x081726 }, // Sky Blue
      { x: -18, z: 4,   width: 2.0, depth: 2.0, baseH: 13, accentColor: 0xff2a85, bodyColor: 0x1f0c18 }, // Hot Pink
      { x: 20,  z: -1,  width: 2.2, depth: 2.2, baseH: 17, accentColor: 0x0ea5e9, bodyColor: 0x091826 }, // Sky Blue
    ];

    const pillarGroup = new THREE.Group();
    const pillarMeshes: {
      mesh: THREE.Mesh;
      capMesh: THREE.Mesh;
      laserMesh: THREE.Mesh;
      cfg: (typeof pillarConfigs)[0];
      bounce: number;
    }[] = [];

    pillarConfigs.forEach((cfg) => {
      const geo = new THREE.BoxGeometry(cfg.width, cfg.baseH, cfg.depth);
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.bodyColor,
        roughness: 0.3,
        metalness: 0.85,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cfg.x, -14 + cfg.baseH / 2, cfg.z);
      pillarGroup.add(mesh);

      // Glowing Neon Cap (Alternating Hot Pink & Sky Blue)
      const capGeo = new THREE.BoxGeometry(cfg.width * 1.05, 0.45, cfg.depth * 1.05);
      const capMat = new THREE.MeshBasicMaterial({
        color: cfg.accentColor,
        transparent: true,
        opacity: 0.98,
      });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.set(cfg.x, -14 + cfg.baseH + 0.22, cfg.z);
      pillarGroup.add(capMesh);

      // Animated Horizontal Scanning Laser Slice
      const laserGeo = new THREE.BoxGeometry(cfg.width * 1.08, 0.22, cfg.depth * 1.08);
      const laserMat = new THREE.MeshBasicMaterial({
        color: cfg.accentColor === 0xff2a85 ? 0x38bdf8 : 0xff2a85, // Complementary laser
        transparent: true,
        opacity: 0.92,
      });
      const laserMesh = new THREE.Mesh(laserGeo, laserMat);
      laserMesh.position.set(cfg.x, -14 + cfg.baseH * 0.6, cfg.z);
      pillarGroup.add(laserMesh);

      pillarMeshes.push({ mesh, capMesh, laserMesh, cfg, bounce: 0 });
    });
    scene.add(pillarGroup);

    // 6. Dual-Tone Primary Spline Curves (Hot Pink & Sky Blue)
    // Curve 1: Radiant Hot Pink Spline (Equities / Alpha Momentum Wave)
    const pinkPoints = [
      new THREE.Vector3(-32, -7, 3),
      new THREE.Vector3(-24, -2, 6),
      new THREE.Vector3(-16, 5, 7),
      new THREE.Vector3(-9, 0, 4),
      new THREE.Vector3(-2, 8, 6),
      new THREE.Vector3(4, 3, 3),
      new THREE.Vector3(11, -2, 1),
      new THREE.Vector3(18, 6, 4),
      new THREE.Vector3(25, 1, 2),
      new THREE.Vector3(32, -3, -1),
      new THREE.Vector3(38, -6, -3),
    ];
    const currPinkPoints = pinkPoints.map((p) => p.clone());
    const pinkCurve = new THREE.CatmullRomCurve3(currPinkPoints);
    const pinkGeo = new THREE.TubeGeometry(pinkCurve, 140, 0.38, 14, false);
    const pinkMat = new THREE.MeshStandardMaterial({
      color: 0xff2a85,
      emissive: 0xff2a85,
      emissiveIntensity: 1.35,
      roughness: 0.1,
      metalness: 0.5,
    });
    const pinkMesh = new THREE.Mesh(pinkGeo, pinkMat);
    scene.add(pinkMesh);

    // Curve 2: Electric Sky Blue Spline (Liquidity & Volatility Manifold)
    const skyPoints = [
      new THREE.Vector3(-32, -3, -2),
      new THREE.Vector3(-22, 3, 0),
      new THREE.Vector3(-15, 9, 2),
      new THREE.Vector3(-8, 5, -1),
      new THREE.Vector3(0, 11, 1),
      new THREE.Vector3(8, 6, -2),
      new THREE.Vector3(15, 3, -4),
      new THREE.Vector3(22, 10, -1),
      new THREE.Vector3(28, 4, -3),
      new THREE.Vector3(38, 0, -5),
    ];
    const currSkyPoints = skyPoints.map((p) => p.clone());
    const skyCurve = new THREE.CatmullRomCurve3(currSkyPoints);
    const skyGeo = new THREE.TubeGeometry(skyCurve, 140, 0.32, 14, false);
    const skyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.3,
      roughness: 0.1,
      metalness: 0.5,
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyMesh);

    // Curve 3: Neon Rose & Sky Blue Intermediate Harmonic
    const harmonicPoints = [
      new THREE.Vector3(-30, -1, 5),
      new THREE.Vector3(-20, 7, 4),
      new THREE.Vector3(-12, 2, 1),
      new THREE.Vector3(-4, 9, 3),
      new THREE.Vector3(5, 12, -1),
      new THREE.Vector3(13, 7, 2),
      new THREE.Vector3(20, 0, 0),
      new THREE.Vector3(28, 8, 2),
      new THREE.Vector3(36, 2, -2),
    ];
    const currHarmonicPoints = harmonicPoints.map((p) => p.clone());
    const harmonicCurve = new THREE.CatmullRomCurve3(currHarmonicPoints);
    const harmonicGeo = new THREE.TubeGeometry(harmonicCurve, 130, 0.26, 14, false);
    const harmonicMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xf472b6,
      emissiveIntensity: 1.15,
      roughness: 0.1,
      metalness: 0.6,
    });
    const harmonicMesh = new THREE.Mesh(harmonicGeo, harmonicMat);
    scene.add(harmonicMesh);

    // Glowing Waypoint Nodes along the curves with Alternating Halos
    const nodeSpheres: { node: THREE.Mesh; halo: THREE.Mesh; color: number }[] = [];
    const sphereGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const haloGeo = new THREE.RingGeometry(0.75, 1.15, 32);

    currPinkPoints.slice(2, 9).forEach((pt, i) => {
      const isSky = i % 2 === 1;
      const col = isSky ? 0x38bdf8 : 0xff2a85;
      const sMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const node = new THREE.Mesh(sphereGeo, sMat);
      node.position.copy(pt);
      scene.add(node);

      const hMat = new THREE.MeshBasicMaterial({
        color: col,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      });
      const halo = new THREE.Mesh(haloGeo, hMat);
      halo.position.copy(pt);
      scene.add(halo);

      nodeSpheres.push({ node, halo, color: col });
    });

    // 7. Sparkle Particles in Hot Pink & Sky Blue
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleVelocities: { x: number; y: number; z: number }[] = [];

    const pinkColor = new THREE.Color(0xff2a85);
    const skyColor = new THREE.Color(0x38bdf8);
    const softPinkColor = new THREE.Color(0xf472b6);
    const deepSkyColor = new THREE.Color(0x0ea5e9);

    const dualPalette = [pinkColor, skyColor, softPinkColor, deepSkyColor];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 72;
      particlePositions[i * 3 + 1] = Math.random() * 32 - 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 55;

      const c = dualPalette[Math.floor(Math.random() * dualPalette.length)];
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;

      particleVelocities.push({
        x: (Math.random() - 0.5) * 0.05,
        y: (Math.random() - 0.5) * 0.035,
        z: (Math.random() - 0.5) * 0.05,
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);

    // 8. Expanding Concentric Shockwaves in Pink & Sky Blue
    const ripples: {
      mesh: THREE.Mesh;
      scale: number;
      opacity: number;
      speed: number;
      maxScale: number;
    }[] = [];

    const rippleGeo = new THREE.RingGeometry(0.5, 1.15, 64);

    const createShockwave = (x: number, z: number, primaryColor?: number) => {
      const isPink = Math.random() > 0.5;
      const col1 = primaryColor !== undefined ? primaryColor : isPink ? 0xff2a85 : 0x38bdf8;
      const col2 = isPink ? 0x38bdf8 : 0xff2a85;

      // Primary Wave
      const rMat1 = new THREE.MeshBasicMaterial({
        color: col1,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.98,
      });
      const rMesh1 = new THREE.Mesh(rippleGeo, rMat1);
      rMesh1.rotation.x = -Math.PI / 2;
      rMesh1.position.set(x, -13.85, z);
      scene.add(rMesh1);
      ripples.push({ mesh: rMesh1, scale: 1, opacity: 0.98, speed: 0.95, maxScale: 42 });

      // Secondary Complementary Wave
      const rMat2 = new THREE.MeshBasicMaterial({
        color: col2,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const rMesh2 = new THREE.Mesh(rippleGeo, rMat2);
      rMesh2.rotation.x = -Math.PI / 2;
      rMesh2.position.set(x, -13.83, z);
      scene.add(rMesh2);
      ripples.push({ mesh: rMesh2, scale: 0.6, opacity: 0.85, speed: 0.78, maxScale: 36 });

      // Kinetic bounce on nearby pillars
      pillarMeshes.forEach((p) => {
        const dx = p.cfg.x - x;
        const dz = p.cfg.z - z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 24) {
          p.bounce = Math.max(p.bounce, (24 - dist) * 0.48);
        }
      });
    };

    shockwaveTriggerRef.current = () => {
      createShockwave(0, 0);
    };

    // 9. Interactive Drag Orbit & Mouse Physics
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let mouseWorldX = 0;
    let mouseWorldY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseWorldX = normX * 24;
      mouseWorldY = normY * 14 + 3;

      cursorPointLight.position.x = mouseWorldX;
      cursorPointLight.position.y = Math.max(mouseWorldY, -9);

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        targetAzimuth += deltaX * 0.007;
        targetElevation = Math.max(-0.25, Math.min(1.25, targetElevation + deltaY * 0.005));
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      targetRadius = Math.max(16, Math.min(68, targetRadius + e.deltaY * 0.035));
    };

    // Click on 3D floor for interactive multi-color pulse
    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const clickY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(clickX, clickY), camera);

      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 14);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(floorPlane, intersectPoint);

      if (intersectPoint) {
        const isPink = Math.random() > 0.5;
        const randomColor = isPink ? '#ff2a85' : '#38bdf8';

        createShockwave(intersectPoint.x, intersectPoint.z);

        const tags = [
          '+4.12% ALPHA IMPULSE',
          'PINK & SKY LIQUIDITY',
          '+$310.20 ARBITRAGE',
          'STOCHASTIC VOL SURGE',
          'GAMMA ACCELERATION',
          'NEON HARMONIC LOCK',
        ];
        const randomTag = tags[Math.floor(Math.random() * tags.length)];

        const newQuote: FloatingQuote = {
          id: Date.now() + Math.random(),
          x: e.clientX,
          y: e.clientY,
          text: randomTag,
          color: randomColor,
        };

        setFloatingQuotes((prev) => [...prev.slice(-4), newQuote]);
        setTimeout(() => {
          setFloatingQuotes((prev) => prev.filter((q) => q.id !== newQuote.id));
        }, 2200);
      }
    };

    // Touch Support
    let touchStartX = 0;
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        targetAzimuth += deltaX * 0.008;
        targetElevation = Math.max(-0.25, Math.min(1.25, targetElevation + deltaY * 0.006));
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domEl.addEventListener('wheel', handleWheel, { passive: true });
    domEl.addEventListener('click', handleClick);
    domEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    domEl.addEventListener('touchmove', handleTouchMove, { passive: true });

    // 10. Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const speed = flowSpeedRef.current;
      const turbulence = waveTurbulenceRef.current;
      const intensity = colorIntensityRef.current;
      const currentTheme = themeRef.current;

      // Auto gentle orbital drift
      if (!isDragging) {
        targetAzimuth += 0.0022 * speed;
      }

      // Smooth camera interpolation
      currentRadius += (targetRadius - currentRadius) * 0.06;
      currentAzimuth += (targetAzimuth - currentAzimuth) * 0.06;
      currentElevation += (targetElevation - currentElevation) * 0.06;
      updateCameraPos();

      // Smoothly oscillate cursor light color between Hot Pink and Sky Blue
      const colorBlend = (Math.sin(time * 2.0 * speed) + 1) / 2;
      const cursorCol = new THREE.Color().lerpColors(
        new THREE.Color(0xff2a85),
        new THREE.Color(0x38bdf8),
        colorBlend
      );
      cursorPointLight.color.copy(cursorCol);

      // Theme Harmonization
      if (currentTheme === 'pink_sky') {
        skyBlueLight.color.setHex(0x38bdf8);
        hotPinkLight.color.setHex(0xff2a85);
        (pinkMesh.material as THREE.MeshStandardMaterial).color.setHex(0xff2a85);
        (pinkMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xff2a85);
        (skyMesh.material as THREE.MeshStandardMaterial).color.setHex(0x38bdf8);
        (skyMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x38bdf8);
        (harmonicMesh.material as THREE.MeshStandardMaterial).color.setHex(0xf472b6);
        (harmonicMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xf472b6);
      } else if (currentTheme === 'miami_sunset') {
        skyBlueLight.color.setHex(0x06b6d4);
        hotPinkLight.color.setHex(0xf43f5e);
        (pinkMesh.material as THREE.MeshStandardMaterial).color.setHex(0xf43f5e);
        (pinkMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xf43f5e);
        (skyMesh.material as THREE.MeshStandardMaterial).color.setHex(0x06b6d4);
        (skyMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x06b6d4);
        (harmonicMesh.material as THREE.MeshStandardMaterial).color.setHex(0xfb7185);
        (harmonicMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xfb7185);
      } else if (currentTheme === 'vaporwave') {
        skyBlueLight.color.setHex(0x7dd3fc);
        hotPinkLight.color.setHex(0xf472b6);
        (pinkMesh.material as THREE.MeshStandardMaterial).color.setHex(0xf472b6);
        (pinkMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xf472b6);
        (skyMesh.material as THREE.MeshStandardMaterial).color.setHex(0x7dd3fc);
        (skyMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x7dd3fc);
        (harmonicMesh.material as THREE.MeshStandardMaterial).color.setHex(0xc084fc);
        (harmonicMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xc084fc);
      } else if (currentTheme === 'quantum_pink') {
        skyBlueLight.color.setHex(0x00f0ff);
        hotPinkLight.color.setHex(0xd946ef);
        (pinkMesh.material as THREE.MeshStandardMaterial).color.setHex(0xd946ef);
        (pinkMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xd946ef);
        (skyMesh.material as THREE.MeshStandardMaterial).color.setHex(0x00f0ff);
        (skyMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x00f0ff);
        (harmonicMesh.material as THREE.MeshStandardMaterial).color.setHex(0xe879f9);
        (harmonicMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xe879f9);
      } else if (currentTheme === 'cyber_neon') {
        skyBlueLight.color.setHex(0x38bdf8);
        hotPinkLight.color.setHex(0xf43f5e);
        (pinkMesh.material as THREE.MeshStandardMaterial).color.setHex(0xf43f5e);
        (pinkMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xf43f5e);
        (skyMesh.material as THREE.MeshStandardMaterial).color.setHex(0x38bdf8);
        (skyMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x38bdf8);
        (harmonicMesh.material as THREE.MeshStandardMaterial).color.setHex(0xec4899);
        (harmonicMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xec4899);
      }

      // Dynamic Spline Wave 1 (Hot Pink)
      for (let i = 0; i < pinkPoints.length; i++) {
        currPinkPoints[i].y =
          pinkPoints[i].y + Math.sin(time * 2.4 * speed + i * 0.9) * 2.0 * turbulence;
      }
      pinkCurve.points = currPinkPoints;
      const newPinkGeo = new THREE.TubeGeometry(pinkCurve, 140, 0.38, 14, false);
      pinkMesh.geometry.dispose();
      pinkMesh.geometry = newPinkGeo;

      // Dynamic Spline Wave 2 (Sky Blue)
      for (let i = 0; i < skyPoints.length; i++) {
        currSkyPoints[i].y =
          skyPoints[i].y + Math.cos(time * 2.0 * speed + i * 0.8) * 1.7 * turbulence;
      }
      skyCurve.points = currSkyPoints;
      const newSkyGeo = new THREE.TubeGeometry(skyCurve, 140, 0.32, 14, false);
      skyMesh.geometry.dispose();
      skyMesh.geometry = newSkyGeo;

      // Dynamic Spline Wave 3 (Soft Pink Harmonic)
      for (let i = 0; i < harmonicPoints.length; i++) {
        currHarmonicPoints[i].y =
          harmonicPoints[i].y + Math.sin(time * 2.1 * speed + i * 1.1 + 1.5) * 1.8 * turbulence;
      }
      harmonicCurve.points = currHarmonicPoints;
      const newHarmonicGeo = new THREE.TubeGeometry(harmonicCurve, 130, 0.26, 14, false);
      harmonicMesh.geometry.dispose();
      harmonicMesh.geometry = newHarmonicGeo;

      // Update Node Spheres & Rotating Halos
      currPinkPoints.slice(2, 9).forEach((pt, idx) => {
        if (nodeSpheres[idx]) {
          nodeSpheres[idx].node.position.copy(pt);
          nodeSpheres[idx].halo.position.copy(pt);
          nodeSpheres[idx].halo.rotation.z += 0.025 * speed;
        }
      });

      // Update Pillars (Bouncy waves & scanning lasers)
      pillarMeshes.forEach((p, idx) => {
        if (p.bounce > 0.01) {
          p.bounce *= 0.91;
        } else {
          p.bounce = 0;
        }
        const heightMultiplier = 1 + Math.sin(time * 1.4 * speed + idx * 0.75) * 0.07 * turbulence;
        const currentH = p.cfg.baseH * heightMultiplier + p.bounce;
        p.mesh.scale.y = currentH / p.cfg.baseH;
        p.mesh.position.y = -14 + currentH / 2;

        p.capMesh.position.y = -14 + currentH + 0.22;

        // Animated oscillating laser scan slice
        const scanNorm = 0.5 + 0.45 * Math.sin(time * 2.2 * speed + idx * 1.2);
        p.laserMesh.position.y = -14 + currentH * scanNorm;
      });

      // Update Shockwaves
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.scale += r.speed * speed;
        r.opacity -= 0.022 * speed;
        r.mesh.scale.set(r.scale, r.scale, r.scale);
        (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, r.opacity);
        if (r.opacity <= 0 || r.scale >= r.maxScale) {
          scene.remove(r.mesh);
          r.mesh.geometry.dispose();
          (r.mesh.material as THREE.Material).dispose();
          ripples.splice(i, 1);
        }
      }

      // Update Sparkle Particles
      const pAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArray = pAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const px = posArray[i * 3];
        const py = posArray[i * 3 + 1];
        const pz = posArray[i * 3 + 2];

        const dx = cursorPointLight.position.x - px;
        const dy = cursorPointLight.position.y - py;
        const dz = cursorPointLight.position.z - pz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;

        if (dist < 24) {
          posArray[i * 3] += (dx / dist) * 0.035 * speed;
          posArray[i * 3 + 1] += (dy / dist) * 0.035 * speed;
          posArray[i * 3 + 2] += (dz / dist) * 0.035 * speed;
        } else {
          posArray[i * 3] += particleVelocities[i].x * speed;
          posArray[i * 3 + 1] += particleVelocities[i].y * speed;
          posArray[i * 3 + 2] += particleVelocities[i].z * speed;
        }

        if (Math.abs(posArray[i * 3]) > 38) posArray[i * 3] *= -0.95;
        if (posArray[i * 3 + 1] > 22) posArray[i * 3 + 1] = -12;
        if (posArray[i * 3 + 1] < -14) posArray[i * 3 + 1] = 20;
        if (Math.abs(posArray[i * 3 + 2]) > 32) posArray[i * 3 + 2] *= -0.95;
      }
      pAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domEl.removeEventListener('wheel', handleWheel);
      domEl.removeEventListener('click', handleClick);
      domEl.removeEventListener('touchstart', handleTouchStart);
      domEl.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      pinkGeo.dispose();
      pinkMat.dispose();
      skyGeo.dispose();
      skyMat.dispose();
      harmonicGeo.dispose();
      harmonicMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      pillarMeshes.forEach((p) => {
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        p.capMesh.geometry.dispose();
        (p.capMesh.material as THREE.Material).dispose();
        p.laserMesh.geometry.dispose();
        (p.laserMesh.material as THREE.Material).dispose();
      });
    };
  }, []);

  const selectTheme = (t: LiveBackgroundTheme, name: string) => {
    setTheme(t);
    setActivePresetName(name);
  };

  const triggerManualShockwave = () => {
    if (shockwaveTriggerRef.current) {
      shockwaveTriggerRef.current();
    }
  };

  return (
    <div
      className={`fixed inset-0 select-none transition-opacity duration-700 ${
        isExpandedViewer ? 'z-40' : '-z-10'
      }`}
      style={{ opacity }}
    >
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className={`w-full h-full absolute inset-0 ${
          isInteractiveCanvas
            ? 'cursor-grab active:cursor-grabbing pointer-events-auto'
            : 'pointer-events-none'
        }`}
      />

      {/* Floating Dynamic Click Quotes in Pink & Sky Blue */}
      {floatingQuotes.map((q) => (
        <div
          key={q.id}
          className="fixed pointer-events-none z-50 font-mono text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xl border backdrop-blur-md transform -translate-x-1/2 -translate-y-full animate-bounce"
          style={{
            left: `${q.x}px`,
            top: `${q.y}px`,
            backgroundColor: 'rgba(8, 12, 24, 0.9)',
            borderColor: q.color,
            color: q.color,
            boxShadow: `0 0 24px ${q.color}50`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: q.color }} />
            <span>{q.text}</span>
          </div>
        </div>
      ))}

      {/* Ambient Pink & Sky Blue Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_0%,rgba(6,9,19,0.58)_100%)] pointer-events-none" />

      {/* Interactive 3D Live World HUD Controls */}
      <div className="fixed bottom-14 right-4 sm:right-6 z-50 pointer-events-auto flex flex-col items-end gap-2">
        {/* Expanded Controller Panel */}
        {showControls && (
          <div className="bg-slate-950/95 border border-pink-500/40 p-4 rounded-2xl shadow-2xl shadow-pink-950/50 backdrop-blur-2xl w-80 space-y-3.5 text-xs text-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-100">
                <Palette className="w-4 h-4 text-pink-400" />
                <span className="bg-gradient-to-r from-pink-400 to-sky-400 bg-clip-text text-transparent">
                  Pink &amp; Sky Blue 3D Studio
                </span>
              </div>
              <span className="text-[10px] font-mono text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                LIVE DUAL-TONE
              </span>
            </div>

            {/* Presets Grid */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                Pink &amp; Sky Blue Palettes
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => selectTheme('pink_sky', 'Hot Pink & Sky Blue')}
                  className={`py-2 px-2.5 rounded-lg text-[11px] font-semibold border flex items-center gap-2 transition-all ${
                    theme === 'pink_sky'
                      ? 'bg-gradient-to-r from-pink-950/80 to-sky-950/80 border-pink-400 text-pink-200 shadow-md shadow-pink-950/50'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-500 to-sky-400 shadow-sm" />
                  Hot Pink &amp; Sky
                </button>
                <button
                  onClick={() => selectTheme('miami_sunset', 'Miami Rose & Cyan')}
                  className={`py-2 px-2.5 rounded-lg text-[11px] font-semibold border flex items-center gap-2 transition-all ${
                    theme === 'miami_sunset'
                      ? 'bg-gradient-to-r from-rose-950/80 to-cyan-950/80 border-rose-400 text-rose-200 shadow-md shadow-rose-950/50'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-cyan-400 shadow-sm" />
                  Miami Rose
                </button>
                <button
                  onClick={() => selectTheme('vaporwave', 'Vaporwave Pastel')}
                  className={`py-2 px-2.5 rounded-lg text-[11px] font-semibold border flex items-center gap-2 transition-all ${
                    theme === 'vaporwave'
                      ? 'bg-gradient-to-r from-pink-950/80 to-sky-950/80 border-sky-400 text-sky-200 shadow-md shadow-sky-950/50'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-400 to-sky-300 shadow-sm" />
                  Vaporwave
                </button>
                <button
                  onClick={() => selectTheme('quantum_pink', 'Quantum Fuchsia')}
                  className={`py-2 px-2.5 rounded-lg text-[11px] font-semibold border flex items-center gap-2 transition-all ${
                    theme === 'quantum_pink'
                      ? 'bg-gradient-to-r from-fuchsia-950/80 to-sky-950/80 border-fuchsia-400 text-fuchsia-200 shadow-md shadow-fuchsia-950/50'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-300 shadow-sm" />
                  Quantum Fuchsia
                </button>
              </div>
            </div>

            {/* Tactile Sliders */}
            <div className="space-y-2.5 pt-1">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Pink/Sky Glow Saturation:</span>
                  <span className="font-mono text-pink-300">{(colorIntensity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={colorIntensity}
                  onChange={(e) => setColorIntensity(Number(e.target.value))}
                  className="w-full accent-pink-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Wave Turbulence:</span>
                  <span className="font-mono text-sky-300">{waveTurbulence.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={waveTurbulence}
                  onChange={(e) => setWaveTurbulence(Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Flow Velocity:</span>
                  <span className="font-mono text-pink-300">{flowSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.1"
                  value={flowSpeed}
                  onChange={(e) => setFlowSpeed(Number(e.target.value))}
                  className="w-full accent-pink-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={triggerManualShockwave}
                className="flex-1 py-2 px-2.5 rounded-lg bg-gradient-to-r from-pink-500 to-sky-500 hover:from-pink-400 hover:to-sky-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-pink-950/50"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                Pulse Pink &amp; Sky Wave
              </button>
              <button
                onClick={() => setIsExpandedViewer(!isExpandedViewer)}
                className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                  isExpandedViewer
                    ? 'bg-pink-600 border-pink-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Fullscreen 3D Explorer Mode"
              >
                {isExpandedViewer ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-[10px] text-slate-500 text-center font-mono pt-1">
              Drag to Orbit &bull; Wheel to Zoom &bull; Click for Shockwave
            </div>
          </div>
        )}

        {/* Floating Quick Pill with Pink & Sky Blue Theme */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 border border-pink-500/40 p-1.5 rounded-full shadow-2xl backdrop-blur-xl shadow-pink-950/40">
          <button
            onClick={() => setShowControls(!showControls)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              showControls
                ? 'bg-gradient-to-r from-pink-500 to-sky-500 text-white shadow-lg shadow-pink-900/50'
                : 'text-slate-200 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-500 to-sky-400 animate-pulse" />
            <span className="bg-gradient-to-r from-pink-300 to-sky-300 bg-clip-text text-transparent">
              Theme: {activePresetName}
            </span>
          </button>

          <button
            onClick={triggerManualShockwave}
            className="p-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-pink-400 border border-pink-500/30 transition-all hover:scale-105"
            title="Trigger Shockwave Ripple"
          >
            <Zap className="w-3.5 h-3.5 text-sky-400" />
          </button>

          <button
            onClick={() => setIsExpandedViewer(!isExpandedViewer)}
            className={`p-1.5 rounded-full border transition-all ${
              isExpandedViewer
                ? 'bg-pink-600 border-pink-400 text-white'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Fullscreen 3D View"
          >
            {isExpandedViewer ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Exit Button when in Fullscreen 3D Explorer Mode */}
      {isExpandedViewer && (
        <div className="fixed top-6 left-6 z-50 pointer-events-auto">
          <button
            onClick={() => setIsExpandedViewer(false)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-pink-500/50 text-white font-bold text-xs shadow-2xl backdrop-blur-md hover:bg-slate-800 transition-all shadow-pink-950/60"
          >
            <Minimize2 className="w-4 h-4 text-sky-400" />
            <span>Return to Financial Dashboard</span>
          </button>
        </div>
      )}
    </div>
  );
};
