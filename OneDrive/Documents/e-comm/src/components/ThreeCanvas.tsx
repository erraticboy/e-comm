import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useApp } from '../context/AppContext';

export const ThreeCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentPage, products, selectedProductId } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const modelRotation = useRef({ x: 0, y: 0 });
  const mousePos = useRef({ x: 0, y: 0 });

  // Get active product model type
  const activeProduct = products.find(p => p.id === selectedProductId) || products[0];
  const modelType = activeProduct ? activeProduct.modelType : 'default';

  // Track refs for animation loop to avoid re-running effect
  const stateRef = useRef({ currentPage, modelType, isDragging });
  useEffect(() => {
    stateRef.current = { currentPage, modelType, isDragging };
  }, [currentPage, modelType, isDragging]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- SETUP SCENE, CAMERA, RENDERER ---
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    // Add atmospheric deep fog
    scene.fog = new THREE.FogExp2(0x050505, 0.08);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 1, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0x0d0d1a, 1.5);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00F5FF, 3, 20);
    cyanLight.position.set(3, 4, 3);
    scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0x8A2BE2, 3, 20);
    purpleLight.position.set(-3, -2, 3);
    scene.add(purpleLight);

    const whiteLight = new THREE.DirectionalLight(0xffffff, 0.8);
    whiteLight.position.set(0, 10, 5);
    scene.add(whiteLight);

    // --- PARTICLE SYSTEM ---
    const particleCount = 700;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Cylindrical/spherical distribution
      const r = 5 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 20;

      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = r * Math.sin(theta);

      // Random color: cyber cyan or electric purple
      const isCyan = Math.random() > 0.4;
      colors[i * 3] = isCyan ? 0.0 : 0.54;
      colors[i * 3 + 1] = isCyan ? 0.96 : 0.17;
      colors[i * 3 + 2] = isCyan ? 1.0 : 0.89;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle texture - procedural circular gradient
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // --- HOLOGRAPHIC GRID FLOOR (for admin/dashboards) ---
    const gridHelper = new THREE.GridHelper(30, 30, 0x8A2BE2, 0x111122);
    gridHelper.position.y = -2.5;
    scene.add(gridHelper);

    // --- CENTRAL MODEL GROUP ---
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Track active meshes
    let meshGroup = new THREE.Group();
    modelGroup.add(meshGroup);

    // Helper to generate futuristic procedural meshes
    const rebuildModel = (type: string, page: string) => {
      // Clear old meshes
      while (meshGroup.children.length > 0) {
        const obj = meshGroup.children[0];
        meshGroup.remove(obj);
      }

      // Materials
      const wireframeCyan = new THREE.MeshStandardMaterial({
        color: 0x00F5FF,
        wireframe: true,
        emissive: 0x00A3FF,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8
      });

      const solidPurple = new THREE.MeshStandardMaterial({
        color: 0x8A2BE2,
        roughness: 0.1,
        metalness: 0.9,
        flatShading: true
      });

      const glowGlass = new THREE.MeshPhysicalMaterial({
        color: 0x00F5FF,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.9,
        ior: 1.5
      });

      if (page === 'home' || page === 'wishlist') {
        // Holographic Globe / Shopping Core
        const coreGeo = new THREE.IcosahedronGeometry(1.5, 2);
        const coreMesh = new THREE.Mesh(coreGeo, wireframeCyan);
        meshGroup.add(coreMesh);

        const ringGeo = new THREE.TorusGeometry(2.2, 0.05, 16, 100);
        const ringMesh = new THREE.Mesh(ringGeo, solidPurple);
        ringMesh.rotation.x = Math.PI / 2.2;
        meshGroup.add(ringMesh);

        const innerGeo = new THREE.OctahedronGeometry(0.7, 1);
        const innerMesh = new THREE.Mesh(innerGeo, solidPurple);
        meshGroup.add(innerMesh);

      } else if (page === 'shop' || page === 'cart') {
        // Futuristic floating retail crystal
        const crystalGeo = new THREE.OctahedronGeometry(1.4, 0);
        const crystalMesh = new THREE.Mesh(crystalGeo, wireframeCyan);
        meshGroup.add(crystalMesh);

        const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.03, 8, 64), solidPurple);
        orbitRing.rotation.x = Math.PI / 4;
        meshGroup.add(orbitRing);
        
        const orbitRing2 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.02, 8, 64), wireframeCyan);
        orbitRing2.rotation.y = Math.PI / 3;
        meshGroup.add(orbitRing2);

      } else if (page === 'checkout' || page === 'track') {
        // Safe Transaction Node: Pulsing core inside locked cage
        const cageGeo = new THREE.DodecahedronGeometry(1.3, 1);
        const cageMesh = new THREE.Mesh(cageGeo, wireframeCyan);
        meshGroup.add(cageMesh);

        const nodeGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const nodeMesh = new THREE.Mesh(nodeGeo, solidPurple);
        meshGroup.add(nodeMesh);

        // Orbital rings
        const pathRing = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.02, 8, 64), solidPurple);
        pathRing.rotation.x = Math.PI / 2;
        meshGroup.add(pathRing);

      } else if (page === 'dashboard' || page === 'admin') {
        // Matrix Server Cube / Diagnostics Mesh
        const mainCube = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), wireframeCyan);
        meshGroup.add(mainCube);

        const centerSphere = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), solidPurple);
        meshGroup.add(centerSphere);

        // Surrounding floaters
        for (let i = 0; i < 4; i++) {
          const orbitCube = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), solidPurple);
          const angle = (i / 4) * Math.PI * 2;
          orbitCube.position.set(Math.cos(angle) * 1.8, 0, Math.sin(angle) * 1.8);
          meshGroup.add(orbitCube);
        }

      } else if (page === 'detail') {
        // Build product models programmatically based on category
        switch (type) {
          case 'visor':
            // Cyber AR Visor model
            const visorFrame = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.6, 16, 1, true, -Math.PI/2, Math.PI), wireframeCyan);
            visorFrame.rotation.x = Math.PI / 2;
            meshGroup.add(visorFrame);

            const visorShield = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.45, 16, 1, false, -Math.PI/2.5, Math.PI/1.25), glowGlass);
            visorShield.rotation.x = Math.PI / 2;
            meshGroup.add(visorShield);

            const earBandL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 1.2), solidPurple);
            earBandL.position.set(-1, 0, 0.5);
            meshGroup.add(earBandL);

            const earBandR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 1.2), solidPurple);
            earBandR.position.set(1, 0, 0.5);
            meshGroup.add(earBandR);
            break;

          case 'drone':
            // Cyber drone model
            const droneBody = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), solidPurple);
            droneBody.scale.y = 0.5;
            meshGroup.add(droneBody);

            const ringGuard = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 8, 32), wireframeCyan);
            ringGuard.rotation.x = Math.PI / 2;
            meshGroup.add(ringGuard);

            // 4 arms and rotors
            for (let i = 0; i < 4; i++) {
              const armGroup = new THREE.Group();
              const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;

              const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.9), solidPurple);
              arm.position.z = 0.45;
              arm.rotation.y = angle;
              armGroup.add(arm);

              const rotorMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8), wireframeCyan);
              rotorMotor.position.set(Math.sin(angle) * 0.9, 0.1, Math.cos(angle) * 0.9);
              armGroup.add(rotorMotor);

              const blade = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.01, 0.06), solidPurple);
              blade.name = `blade_${i}`;
              blade.position.set(Math.sin(angle) * 0.9, 0.2, Math.cos(angle) * 0.9);
              armGroup.add(blade);

              meshGroup.add(armGroup);
            }
            break;

          case 'deck':
            // Cyber hacking deck keyboard shape
            const keyboardBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.9), solidPurple);
            meshGroup.add(keyboardBase);

            const screenHolo = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 0.7), wireframeCyan);
            screenHolo.position.y = 0.2;
            screenHolo.rotation.x = -Math.PI / 10;
            meshGroup.add(screenHolo);

            const gridLines = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 32), solidPurple);
            gridLines.position.set(0.6, 0.1, 0);
            gridLines.rotation.x = Math.PI / 2;
            meshGroup.add(gridLines);
            break;

          case 'car':
            // Wedge shaped hyper-car
            const carBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.9), solidPurple);
            meshGroup.add(carBase);

            const cabin = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.6, 4), glowGlass);
            cabin.rotation.x = Math.PI / 2;
            cabin.rotation.z = Math.PI / 4;
            cabin.scale.set(1.4, 1.2, 0.7);
            cabin.position.set(0, 0.25, 0);
            meshGroup.add(cabin);

            // Glowing thruster
            const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8), wireframeCyan);
            thruster.rotation.z = Math.PI / 2;
            thruster.position.set(-1.25, 0, 0);
            meshGroup.add(thruster);

            // Cyber Wheels
            for (let x of [-0.6, 0.6]) {
              for (let z of [-0.5, 0.5]) {
                const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.08, 8, 16), wireframeCyan);
                wheel.position.set(x, -0.15, z);
                meshGroup.add(wheel);
              }
            }
            break;

          case 'patch':
            // Glowing circular health patch
            const patchBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.15, 16), solidPurple);
            meshGroup.add(patchBase);

            const helixGeo = new THREE.TorusGeometry(0.65, 0.05, 8, 32);
            const helixRing = new THREE.Mesh(helixGeo, wireframeCyan);
            helixRing.position.y = 0.15;
            helixRing.rotation.x = Math.PI / 2;
            meshGroup.add(helixRing);

            const coreOrb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), wireframeCyan);
            coreOrb.position.y = 0.25;
            meshGroup.add(coreOrb);
            break;

          case 'watch':
            // Futuristic circular smart timepiece
            const watchBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.25, 32), solidPurple);
            meshGroup.add(watchBezel);

            const dialGeo = new THREE.RingGeometry(0.6, 0.75, 32);
            const dialHolo = new THREE.Mesh(dialGeo, wireframeCyan);
            dialHolo.position.y = 0.13;
            dialHolo.rotation.x = -Math.PI / 2;
            meshGroup.add(dialHolo);

            const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.8), solidPurple);
            strapL.position.set(0, 0, -0.9);
            meshGroup.add(strapL);

            const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.8), solidPurple);
            strapR.position.set(0, 0, 0.9);
            meshGroup.add(strapR);

            const coreRadar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 3), wireframeCyan);
            coreRadar.position.y = 0.14;
            meshGroup.add(coreRadar);
            break;
        }
      }
    };

    // Build the initial model configuration
    rebuildModel(modelType, currentPage);

    // --- INTERACTIVE EVENTS ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse positions between -1 and 1
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();
    let animFrameId: number;

    const tick = () => {
      const state = stateRef.current;
      const elapsedTime = clock.getElapsedTime();

      // 1. Rotate particles
      particles.rotation.y = elapsedTime * 0.02;
      particles.rotation.x = elapsedTime * 0.008;

      // Accelerate particles depending on page
      let speedFactor = 1.0;
      if (state.currentPage === 'checkout') speedFactor = 4.0;
      if (state.currentPage === 'track') speedFactor = 2.5;
      if (state.currentPage === 'admin') speedFactor = 1.8;

      const pPos = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        // Drift particles vertically
        pPos[i * 3 + 1] -= 0.015 * speedFactor;
        if (pPos[i * 3 + 1] < -10) {
          pPos[i * 3 + 1] = 10;
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // 2. Animate central meshes (rotations, floats)
      if (!state.isDragging) {
        // Standard gentle rotation
        modelGroup.rotation.y = elapsedTime * 0.25 + modelRotation.current.y;
        modelGroup.rotation.x = Math.sin(elapsedTime * 0.5) * 0.15 + modelRotation.current.x;
      } else {
        // Apply manual rotations during dragging
        modelGroup.rotation.y = modelRotation.current.y;
        modelGroup.rotation.x = modelRotation.current.x;
      }

      // Animate drone propellers if active model is drone
      if (state.currentPage === 'detail' && state.modelType === 'drone') {
        for (let i = 0; i < 4; i++) {
          const propeller = meshGroup.getObjectByName(`blade_${i}`);
          if (propeller) {
            propeller.rotation.y += 0.8;
          }
        }
      }

      // Gentle floating amplitude
      modelGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.15;

      // 3. Move camera to match active page context
      let targetCam = new THREE.Vector3(0, 0, 6);
      let lookAtTarget = new THREE.Vector3(0, 0, 0);

      switch (state.currentPage) {
        case 'home':
          targetCam.set(0, 0.4, 5);
          break;
        case 'shop':
          // Move camera further right and back to fit the grids
          targetCam.set(2, 1, 7.5);
          break;
        case 'detail':
          // Focused close-up. Shift slightly right to match layouts
          targetCam.set(1.5, 0.1, 3.8);
          break;
        case 'cart':
        case 'wishlist':
          targetCam.set(-1.5, 0.4, 6.2);
          break;
        case 'checkout':
          // Dynamic angle
          targetCam.set(Math.sin(elapsedTime * 0.1) * 2, 1.5, 5);
          break;
        case 'track':
          targetCam.set(0, 2, 5.5);
          break;
        case 'dashboard':
        case 'admin':
          // High diagnostic angle
          targetCam.set(0, 4, 6.5);
          lookAtTarget.set(0, -0.5, 0);
          break;
        default:
          targetCam.set(0, 0, 6);
      }

      // Mouse-follow parallax check
      const parallaxX = mousePos.current.x * 0.5;
      const parallaxY = mousePos.current.y * 0.3;
      camera.position.x += (targetCam.x + parallaxX - camera.position.x) * 0.05;
      camera.position.y += (targetCam.y + parallaxY - camera.position.y) * 0.05;
      camera.position.z += (targetCam.z - camera.position.z) * 0.05;

      // Real-time dynamic light responsiveness
      cyanLight.position.x = 3 + mousePos.current.x * 2.2;
      cyanLight.position.y = 4 + mousePos.current.y * 2.2;
      purpleLight.position.x = -3 - mousePos.current.x * 2.2;
      purpleLight.position.y = -2 - mousePos.current.y * 2.2;

      // Make camera look at model / scene center
      const currentLookAt = new THREE.Vector3(0, 0, 0);
      currentLookAt.lerp(lookAtTarget, 0.1);
      camera.lookAt(currentLookAt);

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(tick);
    };

    tick();

    // Store state tracking variable to rebuild model if modelType or page updates
    let prevModelType = modelType;
    let prevPage = currentPage;

    const checkUpdateInterval = setInterval(() => {
      const state = stateRef.current;
      if (state.modelType !== prevModelType || state.currentPage !== prevPage) {
        prevModelType = state.modelType;
        prevPage = state.currentPage;
        rebuildModel(state.modelType, state.currentPage);
      }
    }, 100);

    // --- CLEANUP ---
    return () => {
      cancelAnimationFrame(animFrameId);
      clearInterval(checkUpdateInterval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (containerRef.current && renderer.domElement.parentNode) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
      gridHelper.dispose();
      scene.clear();
    };
  }, [selectedProductId, currentPage]); // Force rebuild when product changes or page changes directly

  // Drag interaction to orbit the model on Product Detail page
  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentPage !== 'detail') return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || currentPage !== 'detail') return;
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    dragStart.current = { x: e.clientX, y: e.clientY };

    modelRotation.current.y += deltaX * 0.01;
    modelRotation.current.x += deltaY * 0.01;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="webgl-container"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      style={{ cursor: currentPage === 'detail' ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
    />
  );
};
