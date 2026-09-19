import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, RefreshCw, Eye, Sliders, Maximize2, Info, Compass } from 'lucide-react';

export const ThreeDVisualizer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'vol_surface' | 'correlation_manifold' | 'stress_deformation'>('vol_surface');
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [amplitude, setAmplitude] = useState<number>(1.0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [hoverData, setHoverData] = useState<{ moneyness: string; tenor: string; iv: string } | null>({
    moneyness: '100% (ATM)',
    tenor: '90 Days (3M)',
    iv: '16.8%'
  });

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = Math.max(450, container.clientHeight || 520);

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(30, 24, 34);
    camera.lookAt(0, 0, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Grid & Coordinate axes helpers
    const gridHelper = new THREE.GridHelper(40, 20, 0x334155, 0x1e293b);
    gridHelper.position.y = -6;
    scene.add(gridHelper);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(20, 40, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 0.8);
    dirLight2.position.set(-20, -20, -20);
    scene.add(dirLight2);

    // 5. Parametric Volatility Surface
    const sizeX = 32;
    const sizeZ = 32;
    const segmentsX = 48;
    const segmentsZ = 48;

    const geometry = new THREE.PlaneGeometry(sizeX, sizeZ, segmentsX, segmentsZ);
    geometry.rotateX(-Math.PI / 2);

    // Vertex colors based on elevation
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({
      roughness: 0.25,
      metalness: 0.35,
      wireframe: wireframe,
      vertexColors: true,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    scene.add(mesh);

    // Axis markers/labels using small spheres
    const axisGroup = new THREE.Group();
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let x = -15; x <= 15; x += 7.5) {
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), markerMat);
      marker.position.set(x, -5.8, 16);
      axisGroup.add(marker);
    }
    scene.add(axisGroup);

    // Mouse drag interaction
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotationAngle = 0.6;
    let pitchAngle = 0.5;
    let distance = 46;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouse.x;
        const deltaY = e.clientY - prevMouse.y;
        prevMouse = { x: e.clientX, y: e.clientY };

        rotationAngle += deltaX * 0.008;
        pitchAngle = Math.max(0.1, Math.min(Math.PI / 2.2, pitchAngle + deltaY * 0.008));
      }

      // Update HUD based on normalized pointer
      const rect = renderer.domElement.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      const moneynessPct = Math.round(100 + normX * 25);
      const tenorDays = Math.max(14, Math.round(180 + normY * 150));
      const simulatedIv = (14.5 + Math.abs(normX) * 12 + Math.max(0, -normY) * 6).toFixed(1);

      setHoverData({
        moneyness: `${moneynessPct}% (${moneynessPct > 100 ? 'OTM Call' : moneynessPct < 100 ? 'OTM Put' : 'ATM'})`,
        tenor: `${tenorDays} Days`,
        iv: `${simulatedIv}%`
      });
    };

    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      distance = Math.max(20, Math.min(80, distance + e.deltaY * 0.05));
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('wheel', onWheel, { passive: true });

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const time = clock.getElapsedTime() * speed;

      if (autoRotate && !isDragging) {
        rotationAngle += 0.004;
      }

      // Camera orbital position
      camera.position.x = distance * Math.sin(rotationAngle) * Math.cos(pitchAngle);
      camera.position.y = distance * Math.sin(pitchAngle);
      camera.position.z = distance * Math.cos(rotationAngle) * Math.cos(pitchAngle);
      camera.lookAt(0, 0, 0);

      // Deform surface geometry based on mode & time
      const posAttr = geometry.attributes.position;
      const colAttr = geometry.attributes.color;

      for (let i = 0; i < count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);

        let y = 0;
        if (mode === 'vol_surface') {
          // Implied Volatility Smile / Skew (convexity in strike x, upward term structure in z)
          const moneynessSkew = 0.035 * Math.pow(x, 2) - 0.05 * x; // Put skew
          const termStructure = 0.08 * z;
          const liveWave = Math.sin(x * 0.35 + time * 1.5) * Math.cos(z * 0.3 + time) * 0.8;
          y = (moneynessSkew + termStructure + liveWave) * amplitude;
        } else if (mode === 'correlation_manifold') {
          // Correlation cross-waves
          const waveA = Math.sin(x * 0.4 + time) * 2.5;
          const waveB = Math.cos(z * 0.4 - time * 0.8) * 2.5;
          const systemicPillar = 4.0 * Math.exp(-(x * x + z * z) / 80);
          y = (waveA + waveB + systemicPillar) * amplitude;
        } else {
          // Stress deformation (Crisis shock trench)
          const crashShock = -7.0 * Math.exp(-(Math.pow(x - 4, 2) + Math.pow(z + 2, 2)) / 50);
          const volatilitySpike = 5.0 * Math.exp(-(Math.pow(x + 8, 2)) / 40);
          const turbulence = Math.sin(x * 0.8 + time * 3) * 0.6;
          y = (crashShock + volatilitySpike + turbulence) * amplitude;
        }

        posAttr.setY(i, y);

        // Color mapping: Low Vol (Emerald) -> Mid Vol (Cyan/Indigo) -> High Vol (Crimson)
        const normY = (y + 6) / 14;
        let r = 0.1, g = 0.7, b = 0.5;
        if (normY < 0.4) {
          // Emerald to Cyan
          r = 0.05 + normY * 0.2;
          g = 0.65 + normY * 0.3;
          b = 0.6 + normY * 0.4;
        } else if (normY < 0.75) {
          // Cyan to Indigo
          const t = (normY - 0.4) / 0.35;
          r = 0.2 + t * 0.4;
          g = 0.75 - t * 0.4;
          b = 0.95;
        } else {
          // Peak Volatility: Crimson / Orange
          const t = Math.min(1.0, (normY - 0.75) / 0.25);
          r = 0.85 + t * 0.15;
          g = 0.3 - t * 0.2;
          b = 0.4 - t * 0.3;
        }

        colAttr.setXYZ(i, r, g, b);
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      geometry.computeVertexNormals();

      renderer.render(scene, camera);
    };

    animate();

    // ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !rendererRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = Math.max(450, containerRef.current.clientHeight || 520);
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    });
    resizeObserver.observe(container);

    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      resizeObserver.disconnect();
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('wheel', onWheel);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [mode, speed]);

  // Update material properties dynamically without re-creating scene
  useEffect(() => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).wireframe = wireframe;
    }
  }, [wireframe]);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              3D Multi-Asset Volatility Surface &amp; Correlation Manifold
            </h2>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono font-medium">
              Three.js WebGL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive real-time parametric manifold mapping implied volatility smile, cross-asset correlation topology, and liquidity stress shocks.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
          <button
            id="btn-mode-vol"
            onClick={() => setMode('vol_surface')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              mode === 'vol_surface'
                ? 'bg-cyan-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            IV Surface (Strike x Tenor)
          </button>
          <button
            id="btn-mode-corr"
            onClick={() => setMode('correlation_manifold')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              mode === 'correlation_manifold'
                ? 'bg-cyan-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cross-Asset Correlation
          </button>
          <button
            id="btn-mode-stress"
            onClick={() => setMode('stress_deformation')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              mode === 'stress_deformation'
                ? 'bg-rose-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Crisis Stress Trench
          </button>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        <div ref={containerRef} className="w-full h-[520px] cursor-grab active:cursor-grabbing" />

        {/* HUD Overlay - Top Left Info */}
        <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-mono shadow-lg pointer-events-none">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-sans font-bold">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            Active Surface Coordinates
          </div>
          <div className="grid grid-cols-3 gap-3 text-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px]">MONEYNESS (X)</span>
              <span className="font-semibold text-cyan-300">{hoverData?.moneyness}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">EXPIRY TENOR (Z)</span>
              <span className="font-semibold text-indigo-300">{hoverData?.tenor}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">IMPLIED VOL (Y)</span>
              <span className="font-semibold text-emerald-300">{hoverData?.iv}</span>
            </div>
          </div>
        </div>

        {/* Legend - Top Right */}
        <div className="absolute top-4 right-4 bg-slate-900/85 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-xl text-[11px] shadow-lg pointer-events-none flex items-center gap-3">
          <span className="text-slate-400">Surface Heatmap:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Low Vol (&lt;14%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span className="text-slate-300">Equilibrium (18-24%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300">Stress Spike (&gt;35%)</span>
          </div>
        </div>

        {/* Floating Controls - Bottom Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-5 text-xs text-slate-300">
          <button
            id="btn-toggle-autorotate"
            onClick={() => setAutoRotate(!autoRotate)}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{autoRotate ? 'Pause Rotation' : 'Auto Rotate'}</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <button
            id="btn-toggle-wireframe"
            onClick={() => setWireframe(!wireframe)}
            className={`flex items-center gap-1.5 transition-colors ${wireframe ? 'text-cyan-400 font-semibold' : 'hover:text-white'}`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Wireframe {wireframe ? 'ON' : 'OFF'}</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Elevation:</span>
            <input
              type="range"
              min="0.4"
              max="2.2"
              step="0.1"
              value={amplitude}
              onChange={(e) => setAmplitude(parseFloat(e.target.value))}
              className="w-20 accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Wave Speed:</span>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.2"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-20 accent-indigo-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Surface Insights Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs">
          <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" /> Moneyness Skew Analysis
          </div>
          <p className="text-slate-400 leading-relaxed">
            Pronounced downside put wing steepness indicates institutional hedging demand for SPY &amp; QQQ tail risk protection below 95% moneyness.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs">
          <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" /> Term Structure Dynamics
          </div>
          <p className="text-slate-400 leading-relaxed">
            Contango in front months (VIX 1-3M) transitions into flat backwardation beyond 180 days, reflecting long-term macro policy uncertainty.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs">
          <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-rose-400" /> Correlation Breakdown Warning
          </div>
          <p className="text-slate-400 leading-relaxed">
            Cross-manifold displacement indicates that during liquidity crises, asset correlations converge rapidly toward 1.0, neutralizing naive diversification.
          </p>
        </div>
      </div>
    </div>
  );
};
