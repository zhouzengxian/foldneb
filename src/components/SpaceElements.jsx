import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { connections } from '../data/gameData';

// 基于连线数计算每个英雄的"影响力"（1-10）
export function useInfluenceMap() {
  return useMemo(() => {
    const map = {};
    connections.forEach(c => {
      map[c.from] = (map[c.from] || 0) + 1;
      map[c.to] = (map[c.to] || 0) + 1;
    });
    Object.keys(map).forEach(id => {
      map[id] = Math.min(10, Math.max(2, Math.round(map[id] * 1.3)));
    });
    return map;
  }, []);
}

// ========== Tier-3 繁星背景（InstancedMesh） ==========
export function Tier3Starfield({ agents, getPhysPos }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const t3Agents = useMemo(() => agents.filter(a => a.tier === 3), []);

  const geo = useMemo(() => new THREE.SphereGeometry(0.05, 4, 4), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#aaccff', transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }), []);

  useFrame((state) => {
    if (!meshRef.current || !getPhysPos) return;
    for (let i = 0; i < t3Agents.length; i++) {
      const [px, py, pz] = getPhysPos(t3Agents[i].id);
      if (isNaN(px)) continue;
      dummy.position.set(px, py, pz);
      dummy.scale.setScalar(0.6 + Math.sin(i * 0.7 + state.clock.elapsedTime * 1.5) * 0.3);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    mat.opacity = 0.45 + Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
  });

  if (t3Agents.length === 0) return null;
  return <instancedMesh ref={meshRef} args={[geo, mat, t3Agents.length]} />;
}

// ========== Tier-2 精英Agent可见星点（InstancedMesh） ==========
export function Tier2Starfield({ agents, getPhysPos }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const t2Agents = useMemo(() => agents.filter(a => a.tier === 2), []);

  const geo = useMemo(() => new THREE.SphereGeometry(0.09, 6, 6), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ddeeff', transparent: true, opacity: 0.7,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }), []);

  useFrame((state) => {
    if (!meshRef.current || !getPhysPos) return;
    for (let i = 0; i < t2Agents.length; i++) {
      const [px, py, pz] = getPhysPos(t2Agents[i].id);
      if (isNaN(px)) continue;
      dummy.position.set(px, py, pz);
      dummy.scale.setScalar(0.8 + Math.sin(i * 1.3 + state.clock.elapsedTime * 2) * 0.25);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    mat.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  if (t2Agents.length === 0) return null;
  return <instancedMesh ref={meshRef} args={[geo, mat, t2Agents.length]} />;
}

// ========== 深空星空 ==========
export function DeepSpaceStars({ count = 2500 }) {
  const starsRef = useRef();

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      '#c9a96e', '#8ab4f8', '#f8c8dc', '#a8d8ea', '#ffeeb8',
      '#d4a6ff', '#ffffff', '#8aeeff', '#ffa8c8', '#c8ffa8',
      '#ffe8a0', '#a0d8ff', '#ffccaa', '#aaffcc',
    ];
    for (let i = 0; i < count; i++) {
      const r = 12 + Math.random() * 55;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.6 + 4;
      pos[i * 3 + 2] = Math.cos(phi) * r;
      const pc = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
      col[i * 3] = pc.r; col[i * 3 + 1] = pc.g; col[i * 3 + 2] = pc.b;
    }
    return { positions: pos, colors: col };
  }, [count]);

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
      starsRef.current.material.opacity = 0.7 + Math.sin(state.clock.elapsedTime * 0.12) * 0.08;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.055} vertexColors transparent opacity={0.7} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export function CosmicDust() {
  const dustRef = useRef();
  const count = 500;
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 6 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      p[i * 3] = Math.sin(phi) * Math.cos(theta) * r * 1.2;
      p[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.5;
      p[i * 3 + 2] = Math.cos(phi) * r * 1.2;
    }
    return p;
  }, []);

  useFrame((state) => {
    if (dustRef.current) {
      dustRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      dustRef.current.material.opacity = 0.07 + Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
    }
  });

  return (
    <points ref={dustRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.7} color="#0a0a2a" transparent opacity={0.07} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ========== 坊区氛围 ==========
export function DistrictAmbient({ district }) {
  const groupRef = useRef();
  const ptsRef = useRef();
  const radius = district.radius || 4;

  const data = useMemo(() => {
    const count = 500;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color(district.color);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.2 + Math.random() * 1.6);
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.5;
      pos[i * 3 + 2] = Math.cos(phi) * r;
      const fade = Math.random() * 0.5;
      col[i * 3] = c.r * 0.18 * (1 - fade);
      col[i * 3 + 1] = c.g * 0.18 * (1 - fade);
      col[i * 3 + 2] = c.b * 0.18 * (1 - fade);
    }
    return { positions: pos, colors: col, count };
  }, [district.color, radius]);

  const [cx, , cz] = district.position;

  useFrame((state) => {
    if (ptsRef.current) {
      ptsRef.current.material.opacity = 0.08 + Math.sin(state.clock.elapsedTime * 0.4 + cx) * 0.015;
    }
  });

  return (
    <group ref={groupRef} position={[cx, 0, cz]}>
      <points ref={ptsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={data.count} array={data.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={data.count} array={data.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.07} vertexColors transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}

// ========== 英雄星云（根据influence缩放） ==========
export function AgentNebula({ agent, getPhysPos, influence = 5 }) {
  const groupRef = useRef();
  const coreRef = useRef();
  const midRef = useRef();
  const glowRef = useRef();

  const color = agent.color || '#ffffff';
  const scale = 0.6 + (influence / 10) * 1.0;

  const coreData = useMemo(() => generateNebulaShell(color, 700, 0.5 * scale, 2.5 * scale, 0.75, 0.05 * scale), [color, scale]);
  const midData = useMemo(() => generateNebulaShell(color, 500, 1.5 * scale, 4.0 * scale, 0.4, 0.035 * scale), [color, scale]);
  const glowData = useMemo(() => generateNebulaShell(color, 300, 3.0 * scale, 6.0 * scale, 0.2, 0.045 * scale), [color, scale]);

  useFrame((state) => {
    if (!getPhysPos || !groupRef.current) return;
    const [px, py, pz] = getPhysPos(agent.id);
    groupRef.current.position.set(px, py, pz);
    groupRef.current.rotation.y += 0.001;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.04;

    const t = state.clock.elapsedTime;
    if (coreRef.current) coreRef.current.material.opacity = 0.3 + Math.sin(t * 1.2 + agent.id.charCodeAt(0)) * 0.06;
    if (midRef.current) midRef.current.material.opacity = 0.15 + Math.sin(t * 0.8 + agent.id.charCodeAt(2)) * 0.04;
    if (glowRef.current) glowRef.current.material.opacity = 0.08 + Math.sin(t * 0.5) * 0.03;
  });

  if (!agent || agent.tier > 1) return null;

  return (
    <group ref={groupRef}>
      <points ref={coreRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={coreData.count} array={coreData.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={coreData.count} array={coreData.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={coreData.particleSize} vertexColors transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <points ref={midRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={midData.count} array={midData.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={midData.count} array={midData.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={midData.particleSize} vertexColors transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <points ref={glowRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={glowData.count} array={glowData.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={glowData.count} array={glowData.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={glowData.particleSize} vertexColors transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}

function generateNebulaShell(colorHex, count, minR, maxR, brightness, particleSize) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const c = new THREE.Color(colorHex);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = minR + Math.random() * (maxR - minR);
    const edgeFade = (radius - minR) / Math.max(maxR - minR, 0.01);

    pos[i * 3] = Math.sin(phi) * Math.cos(theta) * radius * 1.05;
    pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.75;
    pos[i * 3 + 2] = Math.cos(phi) * radius * 1.05;

    const spiralFade = 1 - edgeFade;
    const spiralAngle = radius * 1.8 + Math.atan2(pos[i * 3 + 2], pos[i * 3]) * 0.15;
    pos[i * 3] += Math.cos(spiralAngle) * spiralFade * 0.08 * maxR;
    pos[i * 3 + 2] += Math.sin(spiralAngle) * spiralFade * 0.08 * maxR;

    const r = c.r * brightness * (1 - edgeFade * 0.5) + 0.2 * (1 - edgeFade);
    const g = c.g * brightness * (1 - edgeFade * 0.5) + 0.1 * (1 - edgeFade);
    const b = c.b * brightness * (1 - edgeFade * 0.5) + 0.03 * (1 - edgeFade);
    col[i * 3] = Math.min(r, 1);
    col[i * 3 + 1] = Math.min(g, 1);
    col[i * 3 + 2] = Math.min(b, 1);
  }

  return { positions: pos, colors: col, count, particleSize };
}
