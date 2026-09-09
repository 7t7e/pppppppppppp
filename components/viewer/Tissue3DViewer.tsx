import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Layers,
  Sliders,
  Play,
  Pause,
  Eye,
  EyeOff,
  Crosshair,
  Info,
} from 'lucide-react';
import { CellMeasurement } from '../../types';

interface Tissue3DViewerProps {
  measurements?: CellMeasurement[];
  totalVolume?: number;
  daiPercent?: number;
  interactive?: boolean;
  heightClass?: string;
}

export const Tissue3DViewer: React.FC<Tissue3DViewerProps> = ({
  measurements = [],
  totalVolume = 12.8,
  daiPercent = 37.5,
  interactive = true,
  heightClass = 'h-[460px]',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Layer Visibility
  const [showHealthy, setShowHealthy] = useState(true);
  const [showDamaged, setShowDamaged] = useState(true);
  const [showTransition, setShowTransition] = useState(true);
  const [showWireframe, setShowWireframe] = useState(true);
  const [isRotating, setIsRotating] = useState(true);
  const [opacity, setOpacity] = useState(0.85);
  const [clipZ, setClipZ] = useState(1.0); // 0.0 to 1.0
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<CellMeasurement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(25, 20, 30);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(30, 40, 30);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xdbeafe, 0.6);
    dirLight2.position.set(-20, -10, -20);
    scene.add(dirLight2);

    // Root Tissue Specimen Group
    const rootGroup = new THREE.Group();
    groupRef.current = rootGroup;
    scene.add(rootGroup);

    // Bounding Box Grid / Volume boundary
    const boxGeometry = new THREE.BoxGeometry(20, 14, 20);
    const boxEdges = new THREE.EdgesGeometry(boxGeometry);
    const boxMaterial = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.35,
    });
    const boxWire = new THREE.LineSegments(boxEdges, boxMaterial);
    rootGroup.add(boxWire);

    // Grid Floor
    const grid = new THREE.GridHelper(26, 13, 0xd97706, 0xe2e8f0);
    grid.position.y = -7.05;
    rootGroup.add(grid);

    // Synthetic or real cellular distribution
    const cellCount = measurements.length > 0 ? measurements.length : 120;
    const sphereGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const cylinderGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);

    // Create materials with clip planes
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 7 * clipZ);

    // Generate tissue cellular clusters
    for (let i = 0; i < cellCount; i++) {
      let x = 0, y = 0, z = 0;
      let classification: 'healthy' | 'damaged' | 'transition' = 'healthy';
      let radius = 0.6;

      if (measurements[i]) {
        const m = measurements[i];
        x = (m.x - 50) * 0.25;
        y = (m.z - 25) * 0.25;
        z = (m.y - 80) * 0.25;
        classification = m.tissueClass === 'damaged' ? 'damaged' : (m.tissueClass === 'transition' ? 'transition' : 'healthy');
        radius = m.type === 'Vessel' ? 1.4 : 0.6;
      } else {
        // Algorithmic cluster based on DAI
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = Math.cbrt(Math.random()) * 8;
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta) * 0.7;
        z = r * Math.cos(phi);

        // Region near top/corner has higher atrophy
        const distToFocal = Math.hypot(x - 3, y - 2, z - 2);
        if (distToFocal < 4.2) {
          classification = 'damaged';
        } else if (distToFocal < 6.0) {
          classification = 'transition';
        } else {
          classification = 'healthy';
        }
      }

      let color = 0x10b981; // emerald
      if (classification === 'damaged') color = 0xef4444; // rose
      else if (classification === 'transition') color = 0xf59e0b; // amber

      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.35,
        metalness: 0.1,
        transparent: true,
        opacity,
        clippingPlanes: [clipPlane],
        clipShadows: true,
      });

      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.setScalar(radius);
      mesh.name = classification;
      rootGroup.add(mesh);
    }

    // Add tubular microvascular branch (Vessel network)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8, -4, -6),
      new THREE.Vector3(-3, -1, -2),
      new THREE.Vector3(2, 2, 1),
      new THREE.Vector3(7, 4, 6),
    ]);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.4, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      transparent: true,
      opacity: 0.8,
      clippingPlanes: [clipPlane],
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    tubeMesh.name = 'vessel';
    rootGroup.add(tubeMesh);

    // Mouse Drag Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !rootGroup || !interactive) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      rootGroup.rotation.y += deltaX * 0.008;
      rootGroup.rotation.x += deltaY * 0.008;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
      camera.position.z = Math.min(Math.max(camera.position.z + e.deltaY * 0.04, 12), 60);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('wheel', onWheel, { passive: false });

    // Render loop
    const animate = () => {
      if (isRotating && rootGroup && !isDragging) {
        rootGroup.rotation.y += 0.003;
      }
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('wheel', onWheel);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, [interactive]);

  // Update layer visibility and opacity
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.name === 'healthy') child.visible = showHealthy;
        if (child.name === 'damaged') child.visible = showDamaged;
        if (child.name === 'transition') child.visible = showTransition;
        if (child.material) {
          child.material.opacity = opacity;
        }
      }
      if (child instanceof THREE.LineSegments) {
        child.visible = showWireframe;
      }
    });
  }, [showHealthy, showDamaged, showTransition, showWireframe, opacity]);

  const resetCamera = () => {
    if (cameraRef.current && groupRef.current) {
      cameraRef.current.position.set(25, 20, 30);
      groupRef.current.rotation.set(0, 0, 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`relative bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col ${heightClass}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D95B26] animate-pulse"></div>
          <span className="font-semibold text-slate-800">الخريطة النسيجية ثلاثية الأبعاد (3D Tissue Model)</span>
          <span className="text-xs bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded">
            {totalVolume} mm³
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsRotating(!isRotating)}
            title={isRotating ? 'إيقاف التدوير' : 'تشغيل التدوير'}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition"
          >
            {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={resetCamera}
            title="إعادة ضبط المنظور"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            title="ملء الشاشة"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div ref={containerRef} className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        {/* Floating Quick Legend */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-lg p-2.5 shadow-sm text-xs space-y-1.5 z-10 select-none">
          <div className="font-medium text-slate-700 pb-1 border-b border-slate-100 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>مفتاح الطبقات والألوان:</span>
          </div>

          <button
            onClick={() => setShowHealthy(!showHealthy)}
            className={`flex items-center justify-between w-full gap-2 px-1.5 py-0.5 rounded transition ${
              showHealthy ? 'bg-emerald-50 text-emerald-800' : 'text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>نسيج سليم / وظيفي</span>
            </div>
            {showHealthy ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>

          <button
            onClick={() => setShowDamaged(!showDamaged)}
            className={`flex items-center justify-between w-full gap-2 px-1.5 py-0.5 rounded transition ${
              showDamaged ? 'bg-rose-50 text-rose-800' : 'text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>نسيج متضرر / ضامر</span>
            </div>
            {showDamaged ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>

          <button
            onClick={() => setShowTransition(!showTransition)}
            className={`flex items-center justify-between w-full gap-2 px-1.5 py-0.5 rounded transition ${
              showTransition ? 'bg-amber-50 text-amber-800' : 'text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>منطقة انتقالية (Border)</span>
            </div>
            {showTransition ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>

          <button
            onClick={() => setShowWireframe(!showWireframe)}
            className={`flex items-center justify-between w-full gap-2 px-1.5 py-0.5 rounded transition ${
              showWireframe ? 'bg-slate-100 text-slate-800' : 'text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 border border-slate-500"></span>
              <span>حدود التجزئة الحجمية</span>
            </div>
            {showWireframe ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
        </div>

        {/* Floating Interactive Controls bottom-left */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-lg p-2.5 shadow-sm text-xs space-y-2 z-10 w-48">
          <div>
            <div className="flex justify-between text-slate-600 mb-1">
              <span>شفافية النسيج:</span>
              <span className="font-mono">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#D95B26]"
            />
          </div>

          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>اسحب للتدوير • العجلة للتكبير</span>
            <Crosshair className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
