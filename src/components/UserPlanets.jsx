/**
 * 用户知识星球 3D 节点（V4.5）
 * - 灰白月球质感：不发光、程序化坑洞纹理、依靠场景自然光照
 * - 环绕 user 节点轨道分布，缓慢公转 + 自转
 * - 每个月球带名称标签
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import useNebulaStore from '../store/useNebulaStore';

// ============ 程序化月球纹理（灰白底 + 暗斑坑洞） ============
function createMoonTexture(seed = 0) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // 基础淡黄白底（暖色调，保留漫反射立体感）
  const baseGrad = ctx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, '#efe6c8');
  baseGrad.addColorStop(0.5, '#ddd0a8');
  baseGrad.addColorStop(1, '#c4b488');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // 伪随机数（带 seed）
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  // 大块暗色月海（maria）
  for (let i = 0; i < 6; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 40 + rand() * 80;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(90,90,100,${0.35 + rand() * 0.2})`);
    grad.addColorStop(0.6, 'rgba(140,140,150,0.15)');
    grad.addColorStop(1, 'rgba(140,140,150,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 中等陨石坑（带高光边）
  for (let i = 0; i < 24; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 6 + rand() * 18;
    // 暗坑底
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    grad.addColorStop(0, 'rgba(70,70,80,0.55)');
    grad.addColorStop(0.7, 'rgba(120,120,130,0.2)');
    grad.addColorStop(1, 'rgba(160,160,170,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // 高光边
    ctx.strokeStyle = `rgba(220,220,230,${0.2 + rand() * 0.2})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.95, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 小陨石坑（点缀）
  for (let i = 0; i < 60; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1.5 + rand() * 4;
    ctx.fillStyle = `rgba(80,80,90,${0.3 + rand() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// ============ 单个月球节点 ============
// 公转速度：内圈快、外圈慢（开普勒感）。公式与 calcMoonWorldPos 保持一致。
function moonOrbitSpeed(index) {
  return 0.09 - (index % 3) * 0.014;
}
function moonOrbitRadius(index) {
  return 3.5 + (index % 3) * 0.6;
}

function MoonNode({ planet, index, getPhysPos, onSelect, isFocused }) {
  const groupRef = useRef();
  const moonRef = useRef();
  const ringRef = useRef();
  const orbitRadius = moonOrbitRadius(index);
  // 每个 planet 缓存自己的纹理（按 id 哈希做 seed）
  const texture = useMemo(() => {
    const seed = planet.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return createMoonTexture(seed);
  }, [planet.id]);

  // 初始相位（来自 planet.orbitAngle，运行时随时间公转）
  const baseAngle = planet.orbitAngle ?? (index * Math.PI * 2 / 6);
  const orbitSpeed = moonOrbitSpeed(index);

  useFrame((state) => {
    if (!groupRef.current || !moonRef.current) return;
    const [px, py, pz] = getPhysPos('user');
    if (isNaN(px)) return;

    // 月球在 user 周围的位置（动态公转，轨道平面与探索者中心同高 y=py，确保围绕中心而非浮在上方）
    const angle = baseAngle + state.clock.elapsedTime * orbitSpeed;
    const x = px + Math.cos(angle) * orbitRadius;
    const z = pz + Math.sin(angle) * orbitRadius;
    const y = py;
    groupRef.current.position.set(x, y, z);

    // 自转
    moonRef.current.rotation.y += 0.0015;

    // 聚焦光环脉动
    if (ringRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.08;
      ringRef.current.scale.setScalar(pulse);
      ringRef.current.rotation.z += 0.01;
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect && onSelect(planet);
      }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* 月球本体：淡黄漫反射底色 + 低强度暖色自发光保证最低可见度（场景光不足时仍能看到立体球面） */}
      <mesh ref={moonRef} castShadow receiveShadow>
        <sphereGeometry args={[0.45, 48, 48]} />
        <meshStandardMaterial
          map={texture}
          color={isFocused ? '#fff6d8' : '#e6d4a0'}
          roughness={0.92}
          metalness={0.0}
          emissive={isFocused ? '#ffd98a' : '#7a6234'}
          emissiveIntensity={isFocused ? 0.55 : 0.12}
        />
      </mesh>

      {/* 聚焦时显示脉动光环，便于在星空中一眼锁定 */}
      {isFocused && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 0.7, 48]} />
          <meshBasicMaterial color="#cfe2ff" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 名字标签 */}
      <Billboard position={[0, 0.75, 0]}>
        <Text
          fontSize={0.16}
          color="#e8e8f0"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.025}
          outlineColor="#000000"
        >
          {planet.emoji} {planet.name}
        </Text>
        <Text
          position={[0, -0.22, 0]}
          fontSize={0.085}
          color="#8a8a98"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          知识星球 · {planet.postCount || 0} 篇
        </Text>
      </Billboard>
    </group>
  );
}

// ============ 月球群（读 store 的 userPlanets） ============
// 共享：计算某颗月球在世界坐标的位置（供 CameraController 聚焦用）
// 公式必须与 MoonNode::useFrame 完全一致，否则聚焦时相机会对不上月球
export function calcMoonWorldPos(getPos, userPlanets, planetId, time = 0) {
  const index = userPlanets.findIndex((p) => p.id === planetId);
  if (index < 0) return null;
  const planet = userPlanets[index];
  const [px, py, pz] = getPos('user');
  if (isNaN(px)) return null;
  const orbitRadius = moonOrbitRadius(index);
  const baseAngle = planet.orbitAngle ?? (index * Math.PI * 2 / 6);
  const angle = baseAngle + time * moonOrbitSpeed(index);
  const x = px + Math.cos(angle) * orbitRadius;
  const z = pz + Math.sin(angle) * orbitRadius;
  const y = py;
  return [x, y, z];
}

// ============ 轨道环（跟随分身，半透明圆环） ============
function OrbitRings({ userPlanets, getPhysPos }) {
  const groupRef = useRef();
  // 按 orbitRadius 去重，避免重叠星球画多条重合轨道
  const radii = useMemo(() => {
    const set = new Set();
    userPlanets.forEach((_, i) => set.add(moonOrbitRadius(i)));
    return [...set];
  }, [userPlanets]);

  useFrame(() => {
    if (!groupRef.current) return;
    const [px, py, pz] = getPhysPos('user');
    if (isNaN(px)) return;
    // 轨道平面与月球一致（y = py，与探索者同高）
    groupRef.current.position.set(px, py, pz);
  });

  return (
    <group ref={groupRef}>
      {radii.map((r) => (
        <mesh key={r} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.02, r + 0.02, 160]} />
          <meshBasicMaterial color="#9fb8d8" transparent opacity={0.16} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

export default function UserPlanets({ getPhysPos }) {
  const userPlanets = useNebulaStore((s) => s.userPlanets);
  const planetPosts = useNebulaStore((s) => s.planetPosts);
  const setCurrentPlanet = useNebulaStore((s) => s.setCurrentPlanet);
  const openPhone = useNebulaStore((s) => s.openPhone);
  const focusPlanetId = useNebulaStore((s) => s.focusPlanetId);

  const handleSelect = (planet) => {
    setCurrentPlanet(planet.id);
    openPhone('planet');
  };

  if (!userPlanets || userPlanets.length === 0) return null;

  return (
    <>
      <OrbitRings userPlanets={userPlanets} getPhysPos={getPhysPos} />
      {userPlanets.map((planet, i) => (
        <MoonNode
          key={planet.id}
          planet={{ ...planet, postCount: (planetPosts[planet.id] || []).length }}
          index={i}
          getPhysPos={getPhysPos}
          onSelect={handleSelect}
          isFocused={focusPlanetId === planet.id}
        />
      ))}
    </>
  );
}
