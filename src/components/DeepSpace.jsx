import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 深空星色调色板（14色）
 */
const STAR_PALETTE = [
  '#FFD700', // 金
  '#4488FF', // 蓝
  '#FF6699', // 粉
  '#44DDCC', // 青
  '#AA66FF', // 紫
  '#FFFFFF', // 白
  '#88CCFF', // 冰蓝
  '#FF88AA', // 玫瑰
  '#66EE88', // 绿
  '#FFAA44', // 橙
  '#CC88FF', // 淡紫
  '#FFEECC', // 暖白
  '#66AADD', // 天蓝
  '#FF8844', // 赤金
];

/**
 * 深空星空粒子系统
 * - 2500 颗多彩深空星，半径 12-67 球壳分布，缓慢旋转
 * - 500 颗宇宙尘埃，#0a0a2a 极暗蓝，半径 6-24 扁平分布
 */
export default function DeepSpace() {
  const starsRef = useRef();
  const dustRef = useRef();

  // 2500 颗深空星
  const stars = useMemo(() => {
    const count = 2500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // 球壳分布：半径 12-67
      const radius = 12 + Math.random() * 55;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // 随机颜色
      const color = new THREE.Color(STAR_PALETTE[Math.floor(Math.random() * STAR_PALETTE.length)]);
      // 随机微调亮度
      const brightness = 0.3 + Math.random() * 0.7;
      colors[i * 3] = color.r * brightness;
      colors[i * 3 + 1] = color.g * brightness;
      colors[i * 3 + 2] = color.b * brightness;

      // 大小：远处更小
      const dist = Math.sqrt(
        positions[i * 3] ** 2 +
        positions[i * 3 + 1] ** 2 +
        positions[i * 3 + 2] ** 2
      );
      sizes[i] = (0.02 + Math.random() * 0.08) * (1 - dist / 80);
    }

    return { positions, colors, sizes };
  }, []);

  // 500 颗宇宙尘埃
  const dust = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const dustColor = new THREE.Color('#0a0a2a');

    for (let i = 0; i < count; i++) {
      // 扁平分布（Y轴压缩）
      const r = 8 + Math.random() * 32;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = r * Math.sin(theta);

      colors[i * 3] = dustColor.r;
      colors[i * 3 + 1] = dustColor.g;
      colors[i * 3 + 2] = dustColor.b;

      sizes[i] = 0.03 + Math.random() * 0.06;
    }

    return { positions, colors, sizes };
  }, []);

  // 整体缓慢旋转
  useFrame((_, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.008;
      starsRef.current.rotation.x += delta * 0.002;
    }
    if (dustRef.current) {
      dustRef.current.rotation.y += delta * 0.012;
    }
  });

  return (
    <group>
      {/* 深空星 */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2500}
            array={stars.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={2500}
            array={stars.colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={2500}
            array={stars.sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          vertexColors
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.85}
          sizeAttenuation
        />
      </points>

      {/* 宇宙尘埃 */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={500}
            array={dust.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={500}
            array={dust.colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={500}
            array={dust.sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.35}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
