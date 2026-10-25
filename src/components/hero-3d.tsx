'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { MessageSquare, Video, Calendar, Sparkles, Hash } from 'lucide-react';

export function Hero3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x6366f1, 4, 50);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x8b5cf6, 3, 50);
    pointLight2.position.set(-10, -10, 5);
    scene.add(pointLight2);

    // Central Floating 3D Geometric Ring / Icosahedron
    const geometry = new THREE.IcosahedronGeometry(4.2, 1);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x4f46e5,
      emissive: 0x312e81,
      wireframe: true,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1,
      transparent: true,
      opacity: 0.45,
    });
    const mainMesh = new THREE.Mesh(geometry, material);
    scene.add(mainMesh);

    // Inner glowing sphere
    const innerGeo = new THREE.SphereGeometry(2.4, 32, 32);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x4338ca,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.2,
      wireframe: false,
      transparent: true,
      opacity: 0.25,
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerSphere);

    // Floating Particles Constellation
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 35;
      positions[i + 1] = (Math.random() - 0.5) * 25;
      positions[i + 2] = (Math.random() - 0.5) * 20;

      // Subtle gradient colors
      colors[i] = 0.4 + Math.random() * 0.3;     // R
      colors[i + 1] = 0.4 + Math.random() * 0.4; // G
      colors[i + 2] = 0.9 + Math.random() * 0.1; // B
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse movement parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = currentMount.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / currentMount.clientWidth - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / currentMount.clientHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Resize handler
    const onResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };

    window.addEventListener('resize', onResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation
      targetX += (mouseX * 2.5 - targetX) * 0.05;
      targetY += (-mouseY * 2.5 - targetY) * 0.05;

      camera.position.x = targetX;
      camera.position.y = targetY;
      camera.lookAt(scene.position);

      // Rotate objects
      mainMesh.rotation.x = elapsedTime * 0.15;
      mainMesh.rotation.y = elapsedTime * 0.2;
      innerSphere.rotation.y = -elapsedTime * 0.1;
      particles.rotation.y = elapsedTime * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[520px] md:h-[620px] flex items-center justify-center overflow-hidden">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Floating 3D Depth Card 1: Channel Chat */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute top-12 left-4 md:left-16 z-10 glass-panel rounded-2xl p-4 shadow-2xl border border-white/10 dark:border-white/10 max-w-[280px] pointer-events-auto transform -rotate-2 hover:rotate-0 transition-transform duration-300"
      >
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-indigo-400">
          <Hash className="w-3.5 h-3.5" />
          <span>#development</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shadow">
            SC
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-medium text-slate-200">Sarah Chen</span>
              <span className="text-[10px] text-slate-400">10:42 AM</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Zero-lag WebSockets deployed! Check the reactions.
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                🚀 4
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                🔥 3
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating 3D Depth Card 2: Live Video Call */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="absolute top-20 right-4 md:right-16 z-10 glass-panel rounded-2xl p-4 shadow-2xl border border-white/10 dark:border-white/10 max-w-[260px] pointer-events-auto transform rotate-3 hover:rotate-0 transition-transform duration-300"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Design Sync</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Now (4 joined)
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="h-16 rounded-lg bg-slate-800/80 border border-white/5 flex items-center justify-center relative overflow-hidden">
            <span className="text-xs font-medium text-slate-300">Alex R.</span>
            <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="h-16 rounded-lg bg-slate-800/80 border border-white/5 flex items-center justify-center relative overflow-hidden">
            <span className="text-xs font-medium text-slate-300">Marcus B.</span>
            <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        </div>
      </motion.div>

      {/* Floating 3D Depth Card 3: Digital Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute bottom-8 right-8 md:right-32 z-10 glass-panel rounded-2xl p-3.5 shadow-2xl border border-white/10 dark:border-white/10 max-w-[240px] pointer-events-auto transform -rotate-1 hover:rotate-0 transition-transform duration-300 hidden sm:block"
      >
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-slate-200">Today&apos;s Agenda</span>
        </div>
        <div className="space-y-1.5">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200">
            <div className="font-medium">Sprint Q4 Launch Sync</div>
            <div className="text-[10px] text-purple-300/70">3:00 PM • Video Room Alpha</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
