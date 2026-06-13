import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';

export default function DistrictGround({ district }) {
  const ringRef = useRef();
  const lanternRef = useRef();

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.material.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 1.5 + district.position[0]) * 0.08;
    }
    if (lanternRef.current) {
      lanternRef.current.material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2 + district.position[2]) * 0.2;
    }
  });

  return (
    <group>
      {/* 坊区地面色块 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[district.position[0], -0.58, district.position[2]]}>
        <circleGeometry args={[district.radius, 48]} />
        <meshStandardMaterial color={district.color} transparent opacity={0.18} depthWrite={false} />
      </mesh>

      {/* 坊区边界环 */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[district.position[0], -0.575, district.position[2]]}>
        <ringGeometry args={[district.radius - 0.1, district.radius, 64]} />
        <meshBasicMaterial color={district.lanternColor} transparent opacity={0.3} side={2} depthWrite={false} />
      </mesh>

      {/* 坊区中心装饰 - 小台基 */}
      <mesh position={[district.position[0], -0.3, district.position[2]]}>
        <cylinderGeometry args={[0.35, 0.45, 0.2, 16]} />
        <meshStandardMaterial color="#2a2a3a" emissive={district.color} emissiveIntensity={0.15} />
      </mesh>

      {/* 牌坊 - 双柱 */}
      <PillarPair
        position={[district.position[0], 0, district.position[2]]}
        color={district.lanternColor}
        districtColor={district.color}
      />

      {/* 坊区名牌 */}
      <Billboard position={[district.position[0], 1.3, district.position[2]]}>
        <Text
          fontSize={0.15}
          color={district.lanternColor}
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

function PillarPair({ position, color, districtColor }) {
  const lanternRef = useRef();

  return (
    <group position={position}>
      {/* 左柱 */}
      <Pillar offset={[-0.25, 0, 0]} />
      {/* 右柱 */}
      <Pillar offset={[0.25, 0, 0]} />
      {/* 横梁 */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.7, 0.04, 0.08]} />
        <meshStandardMaterial color="#4a3a2a" />
      </mesh>
      {/* 斗拱装饰 */}
      <mesh position={[0, 0.57, 0]}>
        <boxGeometry args={[0.8, 0.02, 0.1]} />
        <meshStandardMaterial color="#5a4a3a" emissive={districtColor} emissiveIntensity={0.2} />
      </mesh>
      {/* 灯笼 */}
      <mesh ref={lanternRef} position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} scale={[1, 1.4, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* 灯笼光晕 */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Pillar({ offset }) {
  return (
    <group position={offset}>
      {/* 柱基 */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.1, 8]} />
        <meshStandardMaterial color="#3a3a2a" />
      </mesh>
      {/* 柱身 */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.6, 8]} />
        <meshStandardMaterial color="#5a3a2a" />
      </mesh>
      {/* 柱头 */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.06, 0.04, 0.06, 8]} />
        <meshStandardMaterial color="#4a3a2a" />
      </mesh>
    </group>
  );
}
