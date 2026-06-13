import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getAgentById } from '../data/gameData.js';

/**
 * 静态知识线 + 动态记忆金线
 * 使用力导向实时位置
 */
export default function ConnectionLines({ connections, getPos, memories = {} }) {
  return (
    <group>
      {connections.map((conn, idx) => {
        const fromAgent = getAgentById(conn.from);
        const toAgent = getAgentById(conn.to);
        if (!fromAgent || !toAgent) return null;

        const hasMemory = conn.interactionCount && conn.interactionCount > 0;
        const isOwnership = conn.isOwnership || (conn.from === 'user' && conn.to === 'custom_clone');

        return (
          <React.Fragment key={`conn-${conn.from}-${conn.to}-${idx}`}>
            {isOwnership ? (
              <OwnerLine conn={conn} getPos={getPos} />
            ) : hasMemory ? (
              <MemoryLine conn={conn} fromAgent={fromAgent} getPos={getPos} />
            ) : (
              <StaticLine conn={conn} fromAgent={fromAgent} getPos={getPos} />
            )}
          </React.Fragment>
        );
      })}
    </group>
  );
}

/**
 * 静态知识线
 */
function StaticLine({ conn, fromAgent, getPos }) {
  return (
    <group>
      <ForceTube
        from={conn.from}
        to={conn.to}
        getPos={getPos}
        radius={0.01}
        color={fromAgent.color || '#4488FF'}
        opacity={0.25}
      />
      <ForceTube
        from={conn.from}
        to={conn.to}
        getPos={getPos}
        radius={0.03}
        color={fromAgent.color || '#4488FF'}
        opacity={0.06}
        blending={THREE.AdditiveBlending}
      />
      {/* 碰撞体 */}
      <ForceTube
        from={conn.from}
        to={conn.to}
        getPos={getPos}
        radius={0.15}
        color="#000000"
        opacity={0}
      />
    </group>
  );
}

/**
 * 归属粗线 OwnerLine — 用户与自定义分身之间的专属连接
 * 青白色 (#7DF9FF)、线宽约为 MemoryLine 的 3 倍、带呼吸脉冲
 */
function OwnerLine({ conn, getPos }) {
  return (
    <group>
      {/* 外层柔光 */}
      <ForceTube
        from={conn.from}
        to={conn.to}
        getPos={getPos}
        radius={0.12}
        color="#7DF9FF"
        opacity={0.18}
        blending={THREE.AdditiveBlending}
        pulse
      />
      {/* 中层 */}
      <ForceTube
        from={conn.from}
        to={conn.to}
        getPos={getPos}
        radius={0.05}
        color="#A8FFF5"
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        pulse
        pulseDelay={0.5}
      />
      {/* 核心亮线 */}
      <ForceTube
        from={conn.from}
        to={conn.to}
        getPos={getPos}
        radius={0.02}
        color="#FFFFFF"
        opacity={0.95}
        blending={THREE.AdditiveBlending}
      />
      {/* 碰撞体 */}
      <ForceTube
        from={conn.from}
        to={conn.to}
        getPos={getPos}
        radius={0.15}
        color="#000000"
        opacity={0}
      />
    </group>
  );
}

/**
 * 折叠记忆金线
 */
function MemoryLine({ conn, fromAgent, getPos }) {
  const interactionCount = conn.interactionCount || 1;
  const baseWidth = 0.015 + Math.min(interactionCount * 0.005, 0.03);
  const memOpacity = 0.25 + (interactionCount - 1) * 0.1;

  return (
    <group>
      <ForceTube
        from={conn.from}
        to={conn.to}
        getPos={getPos}
        radius={baseWidth * 2.5}
        color="#FFAA00"
        opacity={memOpacity * 0.3}
        blending={THREE.AdditiveBlending}
      />
      <ForceTube
        from={conn.from}
        to={conn.to}
        getPos={getPos}
        radius={baseWidth}
        color="#FFD700"
        opacity={memOpacity}
        blending={THREE.AdditiveBlending}
      />
      <ForceTube
        from={conn.from}
        to={conn.to}
        getPos={getPos}
        radius={0.15}
        color="#000000"
        opacity={0}
      />
    </group>
  );
}

/**
 * 力导向实时管状连线
 * pulse: 启用呼吸脉冲（opacity 周期性变化）
 */
function ForceTube({ from, to, getPos, radius, color, opacity, blending, pulse, pulseDelay }) {
  const tubeRef = React.useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geo = useMemo(() => new THREE.CylinderGeometry(radius, radius, 1, 8), [radius]);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: blending || THREE.NormalBlending,
      }),
    [color, opacity, blending]
  );
  const baseOpacity = opacity;
  const delay = pulseDelay || 0;

  // 每帧更新位置 + 脉冲
  React.useEffect(() => {
    if (!getPos) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (!tubeRef.current) return;
      const p1 = getPos(from);
      const p2 = getPos(to);
      if (!p1 || !p2 || isNaN(p1[0]) || isNaN(p2[0])) return;

      const mid = new THREE.Vector3(
        (p1[0] + p2[0]) / 2,
        (p1[1] + p2[1]) / 2,
        (p1[2] + p2[2]) / 2
      );
      const dir = new THREE.Vector3(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]);
      const len = dir.length();
      const up = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());

      tubeRef.current.position.copy(mid);
      tubeRef.current.quaternion.copy(quat);
      tubeRef.current.scale.set(1, len, 1);

      // 呼吸脉冲（sine 波，周期 1.6s）
      if (pulse && baseOpacity != null) {
        const t = (Date.now() - startTime) / 1000 + delay;
        const breathe = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * Math.PI / 0.8));
        tubeRef.current.material.opacity = baseOpacity * breathe;
      }
    }, 16);

    return () => clearInterval(interval);
  }, [from, to, getPos, pulse, baseOpacity, delay]);

  return <mesh ref={tubeRef} geometry={geo} material={mat} />;
}
