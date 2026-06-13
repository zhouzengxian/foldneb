import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import useNebulaStore from '../store/useNebulaStore.js';

/**
 * Canvas 绘制 128×128 星体径向渐变纹理
 */
function createStarTexture(colorHex) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2, cy = size / 2, maxR = size / 2;

  const baseColor = new THREE.Color(colorHex);

  // 外层辉光
  const outerGlow = ctx.createRadialGradient(cx, cy, maxR * 0.35, cx, cy, maxR);
  outerGlow.addColorStop(0, `rgba(${Math.floor(baseColor.r*255)},${Math.floor(baseColor.g*255)},${Math.floor(baseColor.b*255)},0.9)`);
  outerGlow.addColorStop(0.3, `rgba(${Math.floor(baseColor.r*255)},${Math.floor(baseColor.g*255)},${Math.floor(baseColor.b*255)},0.5)`);
  outerGlow.addColorStop(0.6, `rgba(${Math.floor(baseColor.r*128)},${Math.floor(baseColor.g*128)},${Math.floor(baseColor.b*128)},0.15)`);
  outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = outerGlow;
  ctx.fillRect(0, 0, size, size);

  // 核心亮斑
  const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.2);
  coreGlow.addColorStop(0, 'rgba(255,255,255,1)');
  coreGlow.addColorStop(0.1, 'rgba(255,255,255,0.9)');
  coreGlow.addColorStop(0.3, `rgba(${Math.floor(baseColor.r*255)},${Math.floor(baseColor.g*255)},${Math.floor(baseColor.b*255)},0.7)`);
  coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = coreGlow;
  ctx.fillRect(0, 0, size, size);

  // 四向十字光芒
  ctx.globalCompositeOperation = 'lighter';
  const hGrad = ctx.createLinearGradient(0, cy, size, cy);
  hGrad.addColorStop(0, 'rgba(255,255,255,0)');
  hGrad.addColorStop(0.35, 'rgba(255,255,255,0.5)');
  hGrad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
  hGrad.addColorStop(0.65, 'rgba(255,255,255,0.5)');
  hGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hGrad;
  ctx.fillRect(cx - maxR * 0.7, cy - 1.5, maxR * 1.4, 3);

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
 * Agent 节点（Tier-1 英雄）
 * 支持力导向物理位置 + Canvas纹理 + 光环 + 拖拽
 */
export default function AgentNode({ agent, getPhysPos, isSelected, isHovered, isDemoHighlight, onSelect, onHover, forceGraph }) {
  const groupRef = useRef();
  const starMeshRef = useRef();
  const glowMeshRef = useRef();
  const ringRef = useRef();
  const selectedRingRef = useRef();

  const starTexture = useMemo(() => createStarTexture(agent.color), [agent.color]);

  // 拖拽状态
  const draggingRef = useRef(false);
  const dragStartRef = useRef([0, 0]);
  const { camera } = useThree();
  const setDraggingNode = useNebulaStore((s) => s.setDraggingNode);
  // 相机面向平面：拖拽时随节点位置重建，体感像 2D 平面拖拽
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);

  // 动画目标值
  const targetScale = useRef(1);
  const targetRingScale = useRef(1);
  const targetRingOpacity = useRef(0.3);
  const targetGlowOpacity = useRef(0.2);

  useFrame((state) => {
    if (!groupRef.current) return;

    // 位置跟随力导向物理
    if (getPhysPos) {
      const [px, py, pz] = getPhysPos(agent.id);
      if (!isNaN(px)) {
        groupRef.current.position.set(px, py, pz);
      }
    }

    const t = state.clock.elapsedTime;

    // 动画 lerp
    const lerp = 0.12;
    if (starMeshRef.current) {
      const s = starMeshRef.current.scale;
      s.setScalar(s.x + (targetScale.current - s.x) * lerp);
    }
    if (ringRef.current) {
      const s = ringRef.current.scale;
      s.setScalar(s.x + (targetRingScale.current - s.x) * lerp);
      ringRef.current.material.opacity += (targetRingOpacity.current - ringRef.current.material.opacity) * lerp;
      ringRef.current.rotation.z += 0.005;
    }
    if (glowMeshRef.current) {
      glowMeshRef.current.material.opacity += (targetGlowOpacity.current - glowMeshRef.current.material.opacity) * lerp;
    }
    if (selectedRingRef.current) {
      selectedRingRef.current.rotation.z += 0.008;
      selectedRingRef.current.material.opacity = 0.15 + Math.sin(t * 2) * 0.08;
      selectedRingRef.current.scale.setScalar(1 + Math.sin(t * 2.5) * 0.06);
    }

    // DemoS 高亮脉冲
    if (isDemoHighlight) {
      if (glowMeshRef.current) glowMeshRef.current.material.opacity = 0.5;
    }
  });

  // ========== 拖拽交互（Obsidian 图谱式）==========
  // pointerdown 在节点上触发 → 锁定相机 + pin 节点 + 注册全局监听
  // pointermove 在 window 上 → 计算面向相机的平面投影，节点跟手
  // pointerup 在 window 上 → 释放 pin + 解锁相机
  // 临时向量（避免每帧 new）
  const tmpHit = useRef(new THREE.Vector3());

  const handlePointerDown = (e) => {
    e.stopPropagation();
    dragStartRef.current = [e.clientX, e.clientY];
    draggingRef.current = false;

    if (forceGraph) {
      forceGraph.startDrag(agent.id);
      // 以节点当前位置 + 相机朝向建立拖拽平面
      const [px, py, pz] = getPhysPos(agent.id);
      const nodePos = new THREE.Vector3(px, py, pz);
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir).normalize();
      // 法线朝向相机（与 camDir 反向），平面经过节点
      dragPlane.setFromNormalAndCoplanarPoint(camDir.negate(), nodePos);
      // 同步 store → CameraController 禁用 OrbitControls
      setDraggingNode(agent.id);
    }
  };

  // 全局 move/up：用 useEffect 注册到 window，确保指针移出节点后仍能继续
  useEffect(() => {
    const onMove = (e) => {
      if (!forceGraph || !forceGraph.isDragging()) return;
      // 判断是否真的开始拖拽（位移超过阈值）
      const dx = e.clientX - dragStartRef.current[0];
      const dy = e.clientY - dragStartRef.current[1];
      if (Math.hypot(dx, dy) > 3) draggingRef.current = true;

      // NDC → 射线 → 投影到面向相机的拖拽平面
      ndc.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(dragPlane, tmpHit.current)) {
        forceGraph.moveDrag(agent.id, tmpHit.current);
      }
    };

    const onUp = () => {
      if (!forceGraph || !forceGraph.isDragging()) return;
      forceGraph.endDrag();
      setDraggingNode(null);
      // 未发生位移 → 视为点击（选中 agent）
      if (!draggingRef.current) {
        onSelect?.(agent.id);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [agent.id, camera, dragPlane, forceGraph, ndc, raycaster, onSelect, setDraggingNode]);

  // 选中 > hover > 默认 三级效果
  if (isSelected) {
    targetScale.current = 1.35;
    targetRingScale.current = 1.8;
    targetRingOpacity.current = 0.9;
    targetGlowOpacity.current = 0.65;
  } else if (isHovered) {
    targetScale.current = 1.3;
    targetRingScale.current = 1.5;
    targetRingOpacity.current = 0.7;
    targetGlowOpacity.current = 0.5;
  } else {
    targetScale.current = 1;
    targetRingScale.current = 1;
    targetRingOpacity.current = 0.3;
    targetGlowOpacity.current = 0.2;
  }

  return (
    <group ref={groupRef}>
      {/* 选中金色外环 */}
      {isSelected && (
        <mesh ref={selectedRingRef} rotation={[Math.PI / 2, 0, 0]}>
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
      )}

      {/* 底层柔光 Billboard */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh ref={glowMeshRef}>
          <planeGeometry args={[1.6, 1.6]} />
          <meshBasicMaterial
            map={starTexture}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Billboard>

      {/* 星体本体 Billboard */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh ref={starMeshRef}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshBasicMaterial
            map={starTexture}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Billboard>

      {/* 彩色内环 */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.42, 64]} />
        <meshBasicMaterial
          color={agent.color}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* 隐形碰撞体 — 只处理 down/hover；move/up 由 window 全局监听接管 */}
      <mesh
        onPointerDown={handlePointerDown}
        onPointerEnter={() => {
          onHover?.(agent.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          onHover?.(null);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 名字 + 头衔标签（参考 wen-agent-city 的 Billboard + Text 方案） */}
      <Billboard position={[0, 0.85, 0]}>
        <Text fontSize={0.14} color="#e8f0ff" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000000">
          {agent.emoji} {agent.name}
        </Text>
        <Text position={[0, -0.22, 0]} fontSize={0.105} color={agent.color} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000000">
          {agent.title}
        </Text>
      </Billboard>
    </group>
  );
}
