import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GALAXIES } from '../data/gameData.js';

/**
 * 星系粒子雾气氛
 * 每个星系上方 500 个同色极淡粒子，营造星系氛围
 */
export default function GalaxyAtmosphere() {
  const groupRef = useRef();

  // 为每个星系生成 500 个粒子
  const galaxyParticles = useMemo(() => {
    return GALAXIES.map((galaxy) => {
      const count = 500;
      const positions = new Float32Array(count * 3);
      const galaxyColor = new THREE.Color(galaxy.color);

      for (let i = 0; i < count; i++) {
        // 在星系位置周围 3-8 单位范围内球壳分布
        const offsetRadius = 2 + Math.random() * 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] =
          galaxy.position[0] + offsetRadius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] =
          galaxy.position[1] + offsetRadius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] =
          galaxy.position[2] + offsetRadius * Math.cos(phi);
      }

      return {
        id: galaxy.id,
        positions,
        color: galaxyColor,
        center: galaxy.position,
      };
    });
  }, []);

  // 缓慢旋转 + 波动
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.children.forEach((child, i) => {
        if (child) {
          child.rotation.y += 0.002;
          // 呼吸效果
          child.material.opacity = 0.06 + Math.sin(t * 0.5 + i) * 0.02;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {galaxyParticles.map((g) => (
        <points key={g.id}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={500}
              array={g.positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.15}
            color={g.color}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            opacity={0.08}
            sizeAttenuation
          />
        </points>
      ))}
    </group>
  );
}
