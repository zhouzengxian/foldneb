import React, { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AGENTS, getAgent } from '../data/gameData.js';
import useNebulaStore from '../store/useNebulaStore.js';
import { processDialogue } from '../utils/memoryCrystal.js';
import gsap from 'gsap';

// ============================================
// 金色脉冲球体（说话者周围）
// ============================================
function PulseSphere({ position }) {
  const meshRef = useRef();
  const ringRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      const scale = 1 + Math.sin(t * 3) * 0.2;
      meshRef.current.scale.setScalar(scale);
      meshRef.current.material.opacity = 0.15 + Math.sin(t * 3) * 0.05;
    }
    if (ringRef.current) {
      const ringScale = 1.2 + Math.sin(t * 2) * 0.3;
      ringRef.current.scale.setScalar(ringScale);
      ringRef.current.material.opacity = 0.1 + Math.sin(t * 2) * 0.05;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial
          color="#ffcc44"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[1.45, 1.65, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          side={THREE.DoubleSide}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ============================================
// 2000 颗聚合粒子（8色调色板，扩散→聚合）
// ============================================
function AggregationParticles({ targetPos, active }) {
  const pointsRef = useRef();
  const count = 2000;

  const palette = [
    '#FFD700', '#FFAA44', '#4488FF', '#FF6699',
    '#44DDCC', '#AA66FF', '#FF8844', '#66BB88',
  ];

  const scatteredPos = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 5 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  const targetPositions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = targetPos[0] + r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = targetPos[1] + r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = targetPos[2] + r * Math.cos(phi);
    }
    return pos;
  }, [targetPos]);

  const colors = useMemo(() => {
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const c = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return cols;
  }, []);

  const currentPositions = useMemo(() => new Float32Array(count * 3), []);

  const tRef = useRef(0);
  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    if (active) {
      tRef.current = Math.min(tRef.current + delta * 0.4, 1);
    } else {
      tRef.current = Math.max(tRef.current - delta * 0.8, 0);
    }

    const t = 1 - Math.pow(1 - tRef.current, 3);
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    for (let i = 0; i < count; i++) {
      currentPositions[i * 3] = scatteredPos[i * 3] + (targetPositions[i * 3] - scatteredPos[i * 3]) * t;
      currentPositions[i * 3 + 1] = scatteredPos[i * 3 + 1] + (targetPositions[i * 3 + 1] - scatteredPos[i * 3 + 1]) * t;
      currentPositions[i * 3 + 2] = scatteredPos[i * 3 + 2] + (targetPositions[i * 3 + 2] - scatteredPos[i * 3 + 2]) * t;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={currentPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

// ============================================
// 60 颗蝴蝶尾迹粒子
// ============================================
function ButterflyTrail({ active }) {
  const groupRef = useRef();
  const count = 60;

  useFrame(({ clock }) => {
    if (!groupRef.current || !active) return;
    const t = clock.getElapsedTime();

    const radius = 4 + Math.sin(t * 0.3) * 2;
    const centerX = Math.sin(t * 0.2) * 5;
    const centerZ = Math.cos(t * 0.2) * 5;
    const centerY = 2 + t * 0.3;

    const children = groupRef.current.children;
    for (let i = 0; i < children.length && i < count; i++) {
      const lag = i * 0.05;
      const tt = t - lag;
      const r = radius + Math.sin(tt * 2) * 1;
      const x = centerX + Math.cos(tt * 1.5) * r;
      const z = centerZ + Math.sin(tt * 1.5) * r * 0.7;
      const y = centerY + Math.sin(tt * 3) * 1.5 - lag * 3;

      children[i].position.set(x, y, z);
      children[i].material.opacity = 1 - i / count;
      children[i].scale.setScalar(1 - i / count * 0.8);
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.06, 4, 4]} />
          <meshBasicMaterial
            color="#c9a96e"
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// Demo 效果集成组件（纯 3D 特效）
// ============================================
export default function DemoEffects() {
  const demoHighlight = useNebulaStore((s) => s.demoHighlight);
  const agent = demoHighlight ? getAgent(demoHighlight) : null;
  const butterflyActive = demoHighlight !== null;

  return (
    <group>
      {demoHighlight && agent && (
        <>
          <PulseSphere position={agent.position} />
          <AggregationParticles targetPos={agent.position} active={!!demoHighlight} />
        </>
      )}
      <ButterflyTrail active={butterflyActive} />
    </group>
  );
}

// ============================================
// GSAP 镜头飞行 Hook（导出供外部使用）
// ============================================
export function useDemoFlight() {
  const { camera } = useThree();
  const demoActive = useNebulaStore((s) => s.demoActive);
  const setDemoActive = useNebulaStore((s) => s.setDemoActive);
  const setDemoHighlight = useNebulaStore((s) => s.setDemoHighlight);
  const selectAgent = useNebulaStore((s) => s.selectAgent);
  const focusAgent = useNebulaStore((s) => s.focusAgent);

  const runDemo = useCallback(() => {
    if (demoActive) return;
    setDemoActive(true);

    const demoAgents = AGENTS.slice(0, 6);
    const originPos = camera.position.clone();

    const tl = gsap.timeline({
      onComplete: () => {
        setDemoActive(false);
        setDemoHighlight(null);
      },
    });

    demoAgents.forEach((agent, idx) => {
      const targetPos = new THREE.Vector3(
        agent.position[0] + 2,
        agent.position[1] + 1.5,
        agent.position[2] + 3
      );

      tl.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.5,
        ease: 'power2.inOut',
        onStart: () => {
          setDemoHighlight(agent.id);
          focusAgent(agent.id);
          selectAgent(agent.id);
        },
      });

      tl.to({}, { duration: 1.2 });

      if (idx < demoAgents.length - 1) {
        const next = demoAgents[idx + 1];
        processDialogue(agent.id, next.id);
      }
    });

    tl.to(camera.position, {
      x: originPos.x,
      y: originPos.y,
      z: originPos.z,
      duration: 2,
      ease: 'power3.inOut',
      onStart: () => {
        setDemoHighlight(null);
      },
    });
  }, [demoActive, camera]);

  return { runDemo, demoActive };
}
