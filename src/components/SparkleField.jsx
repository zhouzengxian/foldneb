import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Agent周围环绕粒子
export function AgentSparkles({ agent, getPhysPos, count = 12 }) {
  const pointsRef = useRef();
  const groupRef = useRef();
  const phaseRef = useRef(Math.random() * Math.PI * 2);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.4;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = 0.1 + Math.random() * 0.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    // 位置跟随力导向
    if (groupRef.current && getPhysPos) {
      const [px, py, pz] = getPhysPos(agent.id);
      if (!isNaN(px)) groupRef.current.position.set(px, py, pz);
    }
    const arr = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + state.clock.elapsedTime * (0.5 + i * 0.15) + phaseRef.current;
      const radius = 0.5 + Math.sin(state.clock.elapsedTime * 1.5 + i * 0.7) * 0.15;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = 0.15 + Math.sin(state.clock.elapsedTime * 2 + i * 1.3) * 0.3;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2 + phaseRef.current) * 0.2;
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.04} color={agent.color} transparent opacity={0.5} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}

// 默认导出
export default AgentSparkles;

// 连接线上流动光点
export function FlowDots({ points: linePoints, color, count = 5 }) {
  const dotsRef = useRef();
  const phaseRef = useRef(Math.random());

  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...linePoints[0]),
      new THREE.Vector3(...linePoints[1]),
      new THREE.Vector3(...linePoints[2]),
    );
  }, [linePoints]);

  const dotPositions = useMemo(() => {
    return new Float32Array(count * 3);
  }, [count]);

  useFrame((state) => {
    if (!dotsRef.current) return;
    const arr = dotsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const t = ((state.clock.elapsedTime * 0.3 + i / count + phaseRef.current) % 1);
      const pt = curve.getPoint(t);
      arr[i * 3] = pt.x;
      arr[i * 3 + 1] = pt.y + 0.05;
      arr[i * 3 + 2] = pt.z;
    }
    dotsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={dotsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={dotPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color={color}
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 改进的星空背景
export function StarField({ count = 500 }) {
  const starsRef = useRef();

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 15 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      pos[i * 3] = Math.cos(theta) * Math.cos(phi) * r;
      pos[i * 3 + 1] = 5 + Math.sin(phi) * r;
      pos[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * r;
      siz[i] = Math.random() * 2 + 0.5;
    }
    return { positions: pos, sizes: siz };
  }, [count]);

  useFrame((state) => {
    if (!starsRef.current) return;
    starsRef.current.material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#c9a96e"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
