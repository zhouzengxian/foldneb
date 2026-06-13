import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 卫星环绕粒子
 * 12 颗微光粒子：公转 + 半径/高度正弦波动，同主色 AdditiveBlending
 */
export default function AgentSatellites({ agent }) {
  const groupRef = useRef();
  const count = 12;

  // 12 颗卫星的初始参数
  const satellites = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      orbitRadius: 0.6 + Math.random() * 0.3,     // 轨道半径
      speed: 0.3 + Math.random() * 0.6,           // 公转速度
      phase: (i / count) * Math.PI * 2,           // 初始相位
      heightAmp: 0.05 + Math.random() * 0.15,     // 高度波动幅度
      heightFreq: 0.8 + Math.random() * 0.4,      // 高度波动频率
      size: 0.015 + Math.random() * 0.03,         // 粒子大小
    }));
  }, []);

  const particlesRef = useRef([]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();

      particlesRef.current.forEach((mesh, i) => {
        if (!mesh) return;
        const s = satellites[i];
        const angle = s.phase + t * s.speed;
        const x = Math.cos(angle) * s.orbitRadius;
        const z = Math.sin(angle) * s.orbitRadius;
        const y = Math.sin(t * s.heightFreq + s.phase) * s.heightAmp;
        mesh.position.set(x, y, z);
      });
    }
  });

  return (
    <group ref={groupRef} position={agent.position}>
      {satellites.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => (particlesRef.current[i] = el)}
        >
          <sphereGeometry args={[s.size, 6, 6]} />
          <meshBasicMaterial
            color={agent.color}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}
