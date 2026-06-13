import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AGENTS, getAgent } from '../data/gameData.js';

/**
 * 计算两点之间的曲线控制点（中点上拱，模拟弧形连线）
 */
function getCurvePoints(fromPos, toPos, arcHeight = 0.3) {
  const from = new THREE.Vector3(...fromPos);
  const to = new THREE.Vector3(...toPos);
  const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

  // 中点向上偏移
  mid.y += arcHeight;

  const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
  return curve.getPoints(32);
}

/**
 * 静态知识线
 * 双层圆柱：主线 r=0.01 + 辉光线 r=0.03
 * 颜色跟随 from Agent
 */
function StaticLink({ from, to, fromColor }) {
  const curvePoints = useMemo(() => {
    const fromAgent = getAgent(from);
    const toAgent = getAgent(to);
    if (!fromAgent || !toAgent) return [];
    return getCurvePoints(fromAgent.position, toAgent.position, 0.3);
  }, [from, to]);

  if (curvePoints.length === 0) return null;

  const curve = new THREE.CatmullRomCurve3(curvePoints);

  return (
    <group>
      {/* 辉光线 (粗) */}
      <mesh>
        <tubeGeometry args={[curve, 32, 0.03, 8, false]} />
        <meshBasicMaterial
          color={fromColor || '#4488FF'}
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 主线 (细) */}
      <mesh>
        <tubeGeometry args={[curve, 32, 0.01, 8, false]} />
        <meshBasicMaterial
          color={fromColor || '#4488FF'}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>

      {/* 碰撞体（不可见，用于点击交互） */}
      <mesh>
        <tubeGeometry args={[curve, 16, 0.15, 6, false]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * 折叠记忆金线
 * #FFD700 金色 + 外层 #FFAA00 琥珀辉光
 * 线宽随互动次数增长
 * 2.5s easeOutCubic 从零生长
 */
function MemoryGoldenLine({ from, to, interactionCount = 0, memoryId }) {
  const groupRef = useRef();
  const progressRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  const curvePoints = useMemo(() => {
    const fromAgent = getAgent(from);
    const toAgent = getAgent(to);
    if (!fromAgent || !toAgent) return [];
    return getCurvePoints(fromAgent.position, toAgent.position, 0.5);
  }, [from, to]);

  // 线宽随互动次数增长
  const baseWidth = 0.015 + Math.min(interactionCount * 0.005, 0.03);

  useFrame(() => {
    if (groupRef.current) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      // 2.5s easeOutCubic
      const t = Math.min(elapsed / 2.5, 1);
      progressRef.current = 1 - Math.pow(1 - t, 3);

      // 脉动效果
      const pulse = 1 + Math.sin(elapsed * 3) * 0.05;
      groupRef.current.children.forEach((child) => {
        if (child.material && child.material.uniforms) {
          child.material.uniforms.progress.value = progressRef.current;
        }
      });

      // 整体缩放（脉动）
      groupRef.current.scale.setScalar(pulse);
    }
  });

  if (curvePoints.length === 0) return null;

  const curve = new THREE.CatmullRomCurve3(curvePoints);

  return (
    <group ref={groupRef} name={`memory-line-${memoryId}`}>
      {/* 琥珀外层辉光 */}
      <mesh>
        <tubeGeometry args={[curve, 32, baseWidth * 2.5, 8, false]} />
        <meshBasicMaterial
          color="#FFAA00"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 金色主线 */}
      <mesh>
        <tubeGeometry args={[curve, 40, baseWidth, 8, false]} />
        <meshBasicMaterial
          color="#FFD700"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 碰撞体 */}
      <mesh>
        <tubeGeometry args={[curve, 16, 0.15, 6, false]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * 连线系统主组件
 */
export default function ConnectionLines({ connections = [] }) {
  // 分离静态知识线和记忆金线
  const staticLinks = useMemo(() => {
    return connections.filter((c) => !c.interactionCount || c.interactionCount === 0);
  }, [connections]);

  const memoryLinks = useMemo(() => {
    return connections.filter((c) => c.interactionCount && c.interactionCount > 0);
  }, [connections]);

  return (
    <group>
      {/* 静态知识线 */}
      {staticLinks.map((conn) => {
        const fromAgent = getAgent(conn.from);
        return (
          <StaticLink
            key={`static-${conn.from}-${conn.to}`}
            from={conn.from}
            to={conn.to}
            fromColor={fromAgent?.color}
          />
        );
      })}

      {/* 折叠记忆金线 */}
      {memoryLinks.map((conn) => (
        <MemoryGoldenLine
          key={`memory-${conn.from}-${conn.to}`}
          from={conn.from}
          to={conn.to}
          interactionCount={conn.interactionCount || 1}
          memoryId={`${conn.from}-${conn.to}`}
        />
      ))}
    </group>
  );
}
