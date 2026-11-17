import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Activity,
  Layers,
  Eye,
  Maximize2,
  Sun,
  Moon,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  X
} from 'lucide-react';

const CATEGORY_COLORS = {
  pothole: 0xef4444,        // Red
  garbage: 0xf97316,        // Orange
  streetlight: 0xeab308,    // Amber/Yellow
  water_leak: 0x06b6d4,     // Cyan
  drainage: 0x14b8a6,       // Teal
  fallen_tree: 0x84cc16,    // Lime
  traffic_signal: 0xf43f5e  // Rose
};

export default function City3D({ complaints = [], onSelectComplaint }) {
  const mountRef = useRef(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isNightMode, setIsNightMode] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [trafficDensity, setTrafficDensity] = useState('HIGH');
  const [fps, setFps] = useState(60);

  // References for Three.js animation lifecycle
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const problemMeshesRef = useRef([]);
  const carsRef = useRef([]);
  const targetCameraPos = useRef(null);
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(isNightMode ? 0x060913 : 0xbfdbfe);
    scene.fog = new THREE.FogExp2(isNightMode ? 0x060913 : 0xbfdbfe, 0.009);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(45, 50, 60);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(
      isNightMode ? 0x1e293b : 0xffffff,
      isNightMode ? 1.4 : 1.8
    );
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(
      isNightMode ? 0x38bdf8 : 0xfffbeb,
      isNightMode ? 1.8 : 2.5
    );
    sunLight.position.set(60, 90, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // City Ground Grid
    const groundGeo = new THREE.PlaneGeometry(240, 240);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0x0b1120 : 0xe2e8f0,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 5. Build Urban Procedural City Blocks & Roads
    const citySize = 7;
    const blockSize = 14;
    const streetWidth = 5;
    const offset = (citySize * (blockSize + streetWidth)) / 2;

    const buildingGeos = [];
    const windowMaterials = [
      new THREE.MeshStandardMaterial({ color: isNightMode ? 0x00f5ff : 0x0284c7, emissive: isNightMode ? 0x00f5ff : 0x000000, emissiveIntensity: 0.4 }),
      new THREE.MeshStandardMaterial({ color: isNightMode ? 0xf59e0b : 0xd97706, emissive: isNightMode ? 0xf59e0b : 0x000000, emissiveIntensity: 0.3 }),
      new THREE.MeshStandardMaterial({ color: isNightMode ? 0x1e293b : 0x94a3b8, roughness: 0.6 })
    ];

    // Seeded building generation
    for (let x = 0; x < citySize; x++) {
      for (let z = 0; z < citySize; z++) {
        // Skip center square for civic plaza
        if (x === 3 && z === 3) {
          // Central Civic Monument / Town Hall
          const plazaGeo = new THREE.CylinderGeometry(8, 9, 3, 16);
          const plazaMat = new THREE.MeshStandardMaterial({
            color: 0x1e1b4b,
            emissive: 0x4338ca,
            emissiveIntensity: 0.5,
            roughness: 0.3
          });
          const plaza = new THREE.Mesh(plazaGeo, plazaMat);
          plaza.position.set(0, 1.5, 0);
          plaza.castShadow = true;
          plaza.receiveShadow = true;
          scene.add(plaza);

          // Monument Spire
          const spireGeo = new THREE.ConeGeometry(2, 14, 8);
          const spireMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.8 });
          const spire = new THREE.Mesh(spireGeo, spireMat);
          spire.position.set(0, 10, 0);
          scene.add(spire);
          continue;
        }

        const posX = x * (blockSize + streetWidth) - offset + blockSize / 2;
        const posZ = z * (blockSize + streetWidth) - offset + blockSize / 2;

        // Heights
        const distFromCenter = Math.sqrt(Math.pow(x - 3, 2) + Math.pow(z - 3, 2));
        const height = Math.max(8, Math.floor(32 - distFromCenter * 5 + ((x * 17 + z * 31) % 15)));

        const bldGeo = new THREE.BoxGeometry(blockSize - 1.5, height, blockSize - 1.5);
        const bldMat = new THREE.MeshStandardMaterial({
          color: isNightMode ? 0x0f172a : 0x64748b,
          roughness: 0.4,
          metalness: 0.3
        });
        const building = new THREE.Mesh(bldGeo, bldMat);
        building.position.set(posX, height / 2, posZ);
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);

        // Rooftop glowing element
        if (height > 18) {
          const antennaGeo = new THREE.CylinderGeometry(0.1, 0.1, 4);
          const antennaMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
          const antenna = new THREE.Mesh(antennaGeo, antennaMat);
          antenna.position.set(posX, height + 2, posZ);
          scene.add(antenna);
        }
      }
    }

    // 6. Roads & Road Markings
    const roadMat = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0x090d16 : 0x334155,
      roughness: 0.95
    });

    for (let i = 0; i <= citySize; i++) {
      const coord = i * (blockSize + streetWidth) - offset - streetWidth / 2;

      // X-axis Road
      const roadX = new THREE.Mesh(new THREE.PlaneGeometry(240, streetWidth), roadMat);
      roadX.rotation.x = -Math.PI / 2;
      roadX.position.set(0, 0.02, coord);
      roadX.receiveShadow = true;
      scene.add(roadX);

      // Z-axis Road
      const roadZ = new THREE.Mesh(new THREE.PlaneGeometry(streetWidth, 240), roadMat);
      roadZ.rotation.x = -Math.PI / 2;
      roadZ.position.set(coord, 0.02, 0);
      roadZ.receiveShadow = true;
      scene.add(roadZ);
    }

    // 7. Dynamic Traffic Simulation (Moving cars with headlights/taillights)
    const cars = [];
    const carColors = [0x38bdf8, 0xf43f5e, 0xfacc15, 0x4ade80, 0xa855f7];
    const carCount = 28;

    for (let c = 0; c < carCount; c++) {
      const carGroup = new THREE.Group();
      const carBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.7, 3),
        new THREE.MeshStandardMaterial({
          color: carColors[c % carColors.length],
          metalness: 0.5,
          roughness: 0.2
        })
      );
      carBody.position.y = 0.45;
      carGroup.add(carBody);

      // Headlights
      const hlGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const hl1 = new THREE.Mesh(hlGeo, hlMat);
      hl1.position.set(0.6, 0.45, 1.5);
      const hl2 = new THREE.Mesh(hlGeo, hlMat);
      hl2.position.set(-0.6, 0.45, 1.5);
      carGroup.add(hl1, hl2);

      // Taillights
      const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const tl1 = new THREE.Mesh(hlGeo, tlMat);
      tl1.position.set(0.6, 0.45, -1.5);
      const tl2 = new THREE.Mesh(hlGeo, tlMat);
      tl2.position.set(-0.6, 0.45, -1.5);
      carGroup.add(tl1, tl2);

      // Direction: horizontal or vertical
      const isHorizontal = c % 2 === 0;
      const roadIndex = (c % citySize);
      const laneOffset = (c % 2 === 0 ? 1 : -1) * 1.3;
      const roadCoord = roadIndex * (blockSize + streetWidth) - offset - streetWidth / 2 + laneOffset;

      if (isHorizontal) {
        carGroup.position.set((Math.random() - 0.5) * 180, 0, roadCoord);
        carGroup.rotation.y = laneOffset > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        carGroup.position.set(roadCoord, 0, (Math.random() - 0.5) * 180);
        carGroup.rotation.y = laneOffset > 0 ? 0 : Math.PI;
      }

      carGroup.userData = {
        isHorizontal,
        speed: 0.35 + Math.random() * 0.3,
        dir: laneOffset > 0 ? 1 : -1
      };

      scene.add(carGroup);
      cars.push(carGroup);
    }
    carsRef.current = cars;

    // 8. Place 3D Problem Beacons
    const problemMeshes = [];

    complaints.forEach((comp, idx) => {
      // Map latitude & longitude into 3D city plane coordinates
      const normX = ((comp.longitude - 85.81) / 0.035) * 140 - 70;
      const normZ = ((comp.latitude - 20.285) / 0.04) * 140 - 70;
      const colorHex = CATEGORY_COLORS[comp.category] || 0xef4444;

      const issueGroup = new THREE.Group();
      issueGroup.position.set(
        Math.max(-85, Math.min(85, normX)),
        0.1,
        Math.max(-85, Math.min(85, normZ))
      );

      // Pulsing Base Ring
      const ringGeo = new THREE.RingGeometry(1.2, 2.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      issueGroup.add(ring);

      // Vertical Pulsing Pillar Beacon
      const pillarHeight = comp.priority_score >= 85 ? 18 : 12;
      const pillarGeo = new THREE.CylinderGeometry(0.2, 0.4, pillarHeight, 16);
      const pillarMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.65
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.y = pillarHeight / 2;
      issueGroup.add(pillar);

      // Floating Hologram Diamond / Orb
      const diamondGeo = new THREE.OctahedronGeometry(1.6, 0);
      const diamondMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.8,
        roughness: 0.1
      });
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      diamond.position.y = pillarHeight + 2;
      issueGroup.add(diamond);

      issueGroup.userData = {
        complaint: comp,
        diamond,
        ring,
        baseY: pillarHeight + 2
      };

      scene.add(issueGroup);
      problemMeshes.push(issueGroup);
    });
    problemMeshesRef.current = problemMeshes;

    // 9. Raycasting for Click / Inspection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        let parent = hit.object;
        while (parent && !parent.userData?.complaint && parent.parent !== scene) {
          parent = parent.parent;
        }

        if (parent && parent.userData?.complaint) {
          const comp = parent.userData.complaint;
          setSelectedIssue(comp);

          // Fly camera toward this problem
          targetCameraPos.current = new THREE.Vector3(
            parent.position.x + 12,
            16,
            parent.position.z + 18
          );
          targetLookAt.current = new THREE.Vector3(
            parent.position.x,
            2,
            parent.position.z
          );

          if (onSelectComplaint) onSelectComplaint(comp);
          break;
        }
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);

    // 10. Mouse Drag Controls for Orbit
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onMouseUp = () => {
      isMouseDown = false;
    };
    const onMouseMove = (e) => {
      if (!isMouseDown) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      // Orbit camera around target look at
      const radius = camera.position.distanceTo(currentLookAt.current);
      let theta = Math.atan2(camera.position.x - currentLookAt.current.x, camera.position.z - currentLookAt.current.z);
      let phi = Math.acos(Math.max(-1, Math.min(1, (camera.position.y - currentLookAt.current.y) / radius)));

      theta -= deltaX * 0.007;
      phi = Math.max(0.1, Math.min(Math.PI / 2.1, phi - deltaY * 0.007));

      camera.position.x = currentLookAt.current.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = currentLookAt.current.y + radius * Math.cos(phi);
      camera.position.z = currentLookAt.current.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(currentLookAt.current);

      targetCameraPos.current = null; // User manual control overrides automated fly-to
    };

    const onWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      const offsetVec = camera.position.clone().sub(currentLookAt.current);
      offsetVec.multiplyScalar(zoomFactor);
      if (offsetVec.length() > 8 && offsetVec.length() < 160) {
        camera.position.copy(currentLookAt.current).add(offsetVec);
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 11. Render Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth Camera Fly-To Lerp
      if (targetCameraPos.current) {
        camera.position.lerp(targetCameraPos.current, 0.05);
        currentLookAt.current.lerp(targetLookAt.current, 0.05);
        camera.lookAt(currentLookAt.current);
      }

      // Animate Traffic Cars
      cars.forEach((car) => {
        const { isHorizontal, speed, dir } = car.userData;
        if (isHorizontal) {
          car.position.x += speed * dir;
          if (car.position.x > 100) car.position.x = -100;
          if (car.position.x < -100) car.position.x = 100;
        } else {
          car.position.z += speed * dir;
          if (car.position.z > 100) car.position.z = -100;
          if (car.position.z < -100) car.position.z = 100;
        }
      });

      // Animate Problem Beacons
      problemMeshes.forEach((mesh) => {
        const { diamond, ring, baseY } = mesh.userData;
        if (diamond) {
          diamond.rotation.y = elapsed * 1.5;
          diamond.position.y = baseY + Math.sin(elapsed * 3) * 0.6;
        }
        if (ring) {
          const scale = 1 + Math.sin(elapsed * 4) * 0.25;
          ring.scale.set(scale, scale, 1);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [complaints, isNightMode]);

  // Filter visible 3D beacons
  useEffect(() => {
    problemMeshesRef.current.forEach((mesh) => {
      const comp = mesh.userData.complaint;
      if (filterCategory === 'ALL' || comp.category === filterCategory) {
        mesh.visible = true;
      } else {
        mesh.visible = false;
      }
    });
  }, [filterCategory]);

  const resetCamera = () => {
    targetCameraPos.current = new THREE.Vector3(45, 50, 60);
    targetLookAt.current = new THREE.Vector3(0, 0, 0);
    setSelectedIssue(null);
  };

  const categories = [
    { id: 'ALL', label: 'All Issues' },
    { id: 'pothole', label: '🕳️ Potholes' },
    { id: 'garbage', label: '🗑️ Garbage' },
    { id: 'streetlight', label: '💡 Streetlights' },
    { id: 'water_leak', label: '💧 Water Leaks' },
    { id: 'drainage', label: '🚰 Drainage' },
    { id: 'fallen_tree', label: '🌳 Fallen Trees' },
    { id: 'traffic_signal', label: '🚦 Signals' }
  ];

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden select-none">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-10">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-xl pointer-events-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterCategory === cat.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* View & Lighting Mode Toggles */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-xl pointer-events-auto">
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Day/Night Cyber Mode"
          >
            {isNightMode ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span>{isNightMode ? 'Cyber Night' : 'Day View'}</span>
          </button>

          <button
            onClick={resetCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset Camera Angle"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Overview</span>
          </button>
        </div>
      </div>

      {/* 3D Holographic City HUD in Bottom Left */}
      <div className="absolute bottom-6 left-6 pointer-events-none z-10 hidden sm:block">
        <div className="p-4 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 max-w-xs pointer-events-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-black tracking-wider text-white">CIVIC 3D TWIN</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              LIVE DIGITAL TWIN
            </span>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Total 3D Beacons:</span>
              <span className="font-bold text-white font-mono">{complaints.length}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Traffic Simulation:</span>
              <span className="font-bold text-emerald-400 font-mono">28 Autonomous Agents</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Camera Mode:</span>
              <span className="font-bold text-cyan-300 font-mono">Interactive Orbit / Fly-To</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            💡 <strong className="text-slate-200">Tip:</strong> Click any pulsing beacon in the city to fly the camera into inspection range.
          </div>
        </div>
      </div>

      {/* Selected Problem Inspection Holographic Card (Right Side Drawer) */}
      {selectedIssue && (
        <div className="absolute top-20 right-6 w-96 p-5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 shadow-2xl z-20 animate-fadeIn text-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                #{selectedIssue.id}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  selectedIssue.priority_score >= 85
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : selectedIssue.priority_score >= 70
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                Priority {selectedIssue.priority_score}/100
              </span>
            </div>
            <button
              onClick={() => setSelectedIssue(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Photo preview */}
          {selectedIssue.image_url && (
            <div className="relative mt-3 h-36 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
              <img
                src={selectedIssue.image_url}
                alt={selectedIssue.category}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-cyan-300 font-mono">
                AI Confidence: {((selectedIssue.ai_detection_meta?.confidence || 0.94) * 100).toFixed(0)}%
              </div>
            </div>
          )}

          <div className="mt-3">
            <h3 className="text-base font-bold text-white capitalize flex items-center gap-2">
              {selectedIssue.category.replace('_', ' ')}
            </h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-3">{selectedIssue.description}</p>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Location:</span>
              <span className="text-slate-200 font-medium truncate max-w-[190px]">{selectedIssue.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Department:</span>
              <span className="text-cyan-300 font-semibold">{selectedIssue.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-amber-300">{selectedIssue.status}</span>
            </div>
            {selectedIssue.assigned_worker_name && (
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned To:</span>
                <span className="text-slate-200">{selectedIssue.assigned_worker_name}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                if (onSelectComplaint) onSelectComplaint(selectedIssue);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:brightness-110 shadow-lg shadow-cyan-500/25 transition-all"
            >
              Inspect Details & Actions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
