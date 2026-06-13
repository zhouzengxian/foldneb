import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';

/**
 * 星系星云地面 — 由颜色颗粒组成的模糊星云替代明显圆圈
 */
export default function DistrictGround({ district }) {
  const particleRef = useRef();
  const coreRef = useRef();
  const midRef = useRef();
  const outerRef = useRef();

  const radius = district.radius || 4;
  const [cx, , cz] = district.position;
  const color = district.color;
  const lanternColor = district.lanternColor;

  // 三层星云粒子：核心层 + 中间层 + 外层
  const { coreData, midData, outerData } = useMemo(() => {
    const c = new THREE.Color(color);

    const genShell = (count, minR, maxR, brightness, pSize) => {
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const r = minR + Math.random() * (maxR - minR);
        // 扁平化分布（星云是扁平的）
        const heightSpread = (maxR - minR) * 0.2;
        pos[i * 3] = Math.cos(theta) * r + (Math.random() - 0.5) * 0.3;
        pos[i * 3 + 1] = (Math.random() - 0.5) * heightSpread;
        pos[i * 3 + 2] = Math.sin(theta) * r + (Math.random() - 0.5) * 0.3;

        // 从中心到边缘渐暗
        const edgeFade = (r - minR) / Math.max(maxR - minR, 0.01);
        // 随机色偏（同色系微变）
        const hueShift = (Math.random() - 0.5) * 0.15;
        col[i * 3] = Math.min(1, c.r * brightness * (1 - edgeFade * 0.6) + hueShift);
        col[i * 3 + 1] = Math.min(1, c.g * brightness * (1 - edgeFade * 0.6) + hueShift * 0.5);
        col[i * 3 + 2] = Math.min(1, c.b * brightness * (1 - edgeFade * 0.6) + hueShift * 0.3);
      }
      return { positions: pos, colors: col, count, particleSize: pSize };
    };

    return {
      coreData: genShell(400, 0.2, radius * 0.5, 0.6, 0.12),
      midData: genShell(600, radius * 0.3, radius * 0.8, 0.35, 0.09),
      outerData: genShell(500, radius * 0.6, radius * 1.1, 0.15, 0.07),
    };
  }, [color, radius]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // 三层不同速度旋转
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.02;
      coreRef.current.material.opacity = 0.5 + Math.sin(t * 0.6 + cx) * 0.08;
    }
    if (midRef.current) {
      midRef.current.rotation.y = -t * 0.015;
      midRef.current.material.opacity = 0.3 + Math.sin(t * 0.4 + cz) * 0.06;
    }
    if (outerRef.current) {
      outerRef.current.rotation.y = t * 0.008;
      outerRef.current.material.opacity = 0.15 + Math.sin(t * 0.3 + cx + cz) * 0.04;
    }
  });

  return (
    <group position={[cx, 0, cz]}>
      {/* 核心层 — 最亮最密 */}
      <points ref={coreRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={coreData.count} array={coreData.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={coreData.count} array={coreData.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={coreData.particleSize}
          vertexColors
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {/* 中间层 */}
      <points ref={midRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={midData.count} array={midData.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={midData.count} array={midData.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={midData.particleSize}
          vertexColors
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {/* 外层 — 最淡最散 */}
      <points ref={outerRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={outerData.count} array={outerData.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={outerData.count} array={outerData.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={outerData.particleSize}
          vertexColors
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {/* 坊区名牌 */}
      <Billboard position={[0, 1.3, 0]}>
        <Text
          fontSize={0.15}
          color={lanternColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#0a0a1a"
          fontStyle="bold"
        >
          {district.name}
        </Text>
      </Billboard>
    </group>
  );
}
