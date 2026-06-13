import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * GrowingLine — 单条折叠记忆连线（纯 3D，无 DOM）
 * 
 * 精确性保证：
 * - 使用 getPos(id) 获取实时物理位置（与 ForceLine 同源）
 * - 生长动画 2.5s（easeOutCubic）
 * - opacity / lineWidth 由 interactionCount 推导
 */
export default function GrowingLine({ memory, getPos, bornAt }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    const startTime = bornAt || Date.now();
    let raf;
    function tick() {
      const t = Math.min((Date.now() - startTime) / 2500, 1);
      setAnimProgress(1 - Math.pow(1 - t, 3)); // easeOutCubic
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [bornAt]);

  useFrame(() => {
    if (!getPos) return;

    const [fx, fy, fz] = getPos(memory.from) || [0, 0, 0];
    const [tx, ty, tz] = getPos(memory.to) || [0, 0, 0];

    const mx = (fx + tx) / 2;
    const my = (fy + ty) / 2;
    const mz = (fz + tz) / 2;
    const dx = tx - fx, dy = ty - fy, dz = tz - fz;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.001) return;

    const ic = memory.interactionCount || 1;
    const targetOpacity = Math.min(0.25 + (ic - 1) * 0.1, 1.0);
    const lineWidth = 0.01 + (ic - 1) * 0.003;
    const grow = animProgress;

    if (meshRef.current) {
      meshRef.current.position.set(mx, my, mz);
      meshRef.current.scale.set(lineWidth * 1.5, len * grow, lineWidth * 1.5);
      meshRef.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(dx, dy, dz).normalize()
      );
      meshRef.current.material.opacity = targetOpacity * grow;
    }

    if (glowRef.current) {
      glowRef.current.position.copy(meshRef.current.position);
      glowRef.current.scale.set(lineWidth * 4, len * grow, lineWidth * 4);
      glowRef.current.quaternion.copy(meshRef.current.quaternion);
      glowRef.current.material.opacity = targetOpacity * 0.25 * grow;
    }
  });

  return (
    <group>
      {/* 主线 — 金色折叠记忆连线 */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* 辉光外层 */}
      <mesh ref={glowRef}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshBasicMaterial color="#FFAA00" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
