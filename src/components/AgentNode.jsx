import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Canvas 绘制 128×128 星体径向渐变纹理
 * 外层辉光 + 核心亮斑 + 四向十字光芒（模拟星光衍射）
 */
function createStarTexture(colorHex) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2;

  const baseColor = new THREE.Color(colorHex);

  // 外层辉光
  const outerGlow = ctx.createRadialGradient(cx, cy, maxR * 0.35, cx, cy, maxR);
  outerGlow.addColorStop(0, `rgba(${Math.floor(baseColor.r * 255)},${Math.floor(baseColor.g * 255)},${Math.floor(baseColor.b * 255)},0.9)`);
  outerGlow.addColorStop(0.3, `rgba(${Math.floor(baseColor.r * 255)},${Math.floor(baseColor.g * 255)},${Math.floor(baseColor.b * 255)},0.5)`);
  outerGlow.addColorStop(0.6, `rgba(${Math.floor(baseColor.r * 128)},${Math.floor(baseColor.g * 128)},${Math.floor(baseColor.b * 128)},0.15)`);
  outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = outerGlow;
  ctx.fillRect(0, 0, size, size);

  // 核心亮斑
  const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.2);
  coreGlow.addColorStop(0, 'rgba(255,255,255,1)');
  coreGlow.addColorStop(0.1, 'rgba(255,255,255,0.9)');
  coreGlow.addColorStop(0.3, `rgba(${Math.floor(baseColor.r * 255)},${Math.floor(baseColor.g * 255)},${Math.floor(baseColor.b * 255)},0.7)`);
  coreGlow.addColorStop(0.6, `rgba(${Math.floor(baseColor.r * 128)},${Math.floor(baseColor.g * 128)},${Math.floor(baseColor.b * 128)},0.2)`);
  coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = coreGlow;
  ctx.fillRect(0, 0, size, size);

  // 四向十字光芒
  ctx.globalCompositeOperation = 'lighter';
  const lightColor = `rgba(255,255,255,0.6)`;
  ctx.strokeStyle = lightColor;

  // 水平光芒
  const hGrad = ctx.createLinearGradient(0, cy, size, cy);
  hGrad.addColorStop(0, 'rgba(255,255,255,0)');
  hGrad.addColorStop(0.35, 'rgba(255,255,255,0.5)');
  hGrad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
  hGrad.addColorStop(0.65, 'rgba(255,255,255,0.5)');
  hGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hGrad;
  ctx.fillRect(cx - maxR * 0.7, cy - 1.5, maxR * 1.4, 3);

  // 垂直光芒
  const vGrad = ctx.createLinearGradient(0, 0, 0, size);
  vGrad.addColorStop(0, 'rgba(255,255,255,0)');
  vGrad.addColorStop(0.35, 'rgba(255,255,255,0.5)');
  vGrad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
  vGrad.addColorStop(0.65, 'rgba(255,255,255,0.5)');
  vGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = vGrad;
  ctx.fillRect(cx - 1.5, cy - maxR * 0.7, 3, maxR * 1.4);

  ctx.globalCompositeOperation = 'source-over';

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Agent 节点（Tier-1）
 * 多层结构（从内到外）：
 * - 彩色环 (r=0.35-0.42, AdditiveBlending)
 * - 底层柔光 (1.2x Billboard 纹理)
 * - 金色外环 (r=0.55-0.62)
 * - 名字/头衔 Billboard
 */
export default function AgentNode({ agent, isSelected, isHovered, onSelect, onHover }) {
  const groupRef = useRef();
  const glowRingRef = useRef();

  const starTexture = useMemo(() => createStarTexture(agent.color), [agent.color]);

  // 连线计数（根据 tier 映射影响力等级）
  const influenceLevel = useMemo(() => {
    // Tier-1 默认高级别，后续根据实际连线动态调整
    return agent.tier === 1 ? 6 : 4;
  }, [agent.tier]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      // 呼吸效果
      const breathe = 1 + Math.sin(t * 1.5 + agent.position[0]) * 0.03;
      groupRef.current.scale.setScalar(isSelected ? breathe * 1.3 : breathe);
      groupRef.current.rotation.y += 0.003;
    }
    // 金色外环脉动
    if (glowRingRef.current) {
      const wave = (Math.sin(clock.getElapsedTime() * 2) + 1) / 2;
      glowRingRef.current.material.opacity = 0.15 + wave * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={agent.position}>
      {/* 点击热区 */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(agent.id);
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          onHover?.(agent.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          onHover?.(null);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* 底层柔光 Billboard */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh>
          <planeGeometry args={[1.6, 1.6]} />
          <meshBasicMaterial
            map={starTexture}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Billboard>

      {/* 彩色内环 */}
      <mesh>
        <ringGeometry args={[0.35, 0.42, 64]} />
        <meshBasicMaterial
          color={agent.color}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* 金色外环 */}
      <mesh ref={glowRingRef}>
        <ringGeometry args={[0.55, 0.62, 64]} />
        <meshBasicMaterial
          color="#FFD700"
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* 选中时金色光晕 */}
      {isSelected && (
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <mesh>
            <planeGeometry args={[2.5, 2.5]} />
            <meshBasicMaterial
              color="#FFD700"
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
        </Billboard>
      )}

      {/* 名字标签 */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false} position={[0, -0.9, 0]}>
        <Text
          fontSize={0.22}
          color="#e8f0ff"
          anchorX="center"
          anchorY="top"
          outlineWidth={0.03}
          outlineColor="#000000"
          font="/fonts/NotoSansSC-Regular.ttf"
          characters={isHovered ? '正' : ''}
        >
          {`${agent.emoji} ${agent.name}`}
        </Text>
      </Billboard>

      {/* 头衔标签 */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false} position={[0, -1.2, 0]}>
        <Text
          fontSize={0.15}
          color={agent.color}
          anchorX="center"
          anchorY="top"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {agent.title}
        </Text>
      </Billboard>
    </group>
  );
}
