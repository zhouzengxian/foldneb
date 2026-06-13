import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * DeepSpaceStarfield — 深邃星空粒子背景
 * 8000 颗粒子，闪烁呼吸效果，多层深度
 */
export default function Starfield() {
  const meshRef = useRef();
  const count = 8000;

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // 球形分布，多层
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 25 + Math.random() * 80;
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
      pos[i * 3 + 2] = Math.cos(phi) * radius;

      // 颜色：白/蓝/金 渐变
      const colorType = Math.random();
      if (colorType < 0.6) {
        col[i * 3] = 0.7 + Math.random() * 0.3;
        col[i * 3 + 1] = 0.8 + Math.random() * 0.2;
        col[i * 3 + 2] = 0.9 + Math.random() * 0.1;
      } else if (colorType < 0.85) {
        col[i * 3] = 0.3 + Math.random() * 0.3;
        col[i * 3 + 1] = 0.5 + Math.random() * 0.3;
        col[i * 3 + 2] = 0.8 + Math.random() * 0.2;
      } else {
        col[i * 3] = 0.9 + Math.random() * 0.1;
        col[i * 3 + 1] = 0.7 + Math.random() * 0.2;
        col[i * 3 + 2] = 0.3 + Math.random() * 0.2;
      }

      siz[i] = 0.01 + Math.random() * 0.08;
    }
    return { positions: pos, colors: col, sizes: siz };
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.015;
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.008) * 0.02;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * NebulaCloud — 星系星云粒子环
 */
export function NebulaCloud({ color, radius, opacity = 0.15, count = 600 }) {
  const meshRef = useRef();

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const baseColor = new THREE.Color(color);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = radius * (0.3 + Math.random() * 0.7);
      const y = (Math.random() - 0.5) * 1.5;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * r;

      const c = baseColor.clone().multiplyScalar(0.3 + Math.random() * 0.7);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, [color, radius]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.05;
      meshRef.current.material.opacity = opacity + Math.sin(clock.getElapsedTime() * 0.7) * 0.05;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
