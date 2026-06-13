import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 影响力星云
 * 按连线数量映射 2-10 级
 * 三层粒子壳: 核心 700 + 中层 500 + 外层 300
 * 带螺旋旋臂扰动，缓慢旋转
 */
export default function InfluenceNebula({ agent, level = 5 }) {
  const groupRef = useRef();

  // 规范化 2-10 级别
  const normLevel = Math.max(2, Math.min(10, level));
  const radius = 0.8 + (normLevel / 10) * 1.2; // 0.96 - 2.0

  // 三层粒子壳
  const shells = useMemo(() => {
    const configs = [
      { count: 700, radiusOffset: 0, thickness: radius * 0.4 },
      { count: 500, radiusOffset: radius * 0.5, thickness: radius * 0.25 },
      { count: 300, radiusOffset: radius * 0.8, thickness: radius * 0.2 },
    ];

    return configs.map((cfg) => {
      const positions = new Float32Array(cfg.count * 3);
      const agentColor = new THREE.Color(agent.color);

      for (let i = 0; i < cfg.count; i++) {
        // 螺旋旋臂扰动
        const baseRadius = cfg.radiusOffset + Math.random() * cfg.thickness;
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);

        // 螺旋扰动
        const spiralOffset = (baseRadius / radius) * Math.PI * 4;
        const phiAdjusted = phi + spiralOffset + (theta - Math.PI / 2) * 0.5;

        positions[i * 3] = baseRadius * Math.sin(theta) * Math.cos(phiAdjusted);
        positions[i * 3 + 1] = baseRadius * Math.sin(theta) * Math.sin(phiAdjusted);
        positions[i * 3 + 2] = baseRadius * Math.cos(theta);
      }

      return {
        positions,
        color: agentColor,
        count: cfg.count,
      };
    });
  }, [agent.color, radius]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
      groupRef.current.rotation.x += delta * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={agent.position}>
      {shells.map((shell, idx) => (
        <points key={idx}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={shell.count}
              array={shell.positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.025 - idx * 0.005}
            color={shell.color}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            opacity={0.12 - idx * 0.03}
            sizeAttenuation
          />
        </points>
      ))}
    </group>
  );
}
