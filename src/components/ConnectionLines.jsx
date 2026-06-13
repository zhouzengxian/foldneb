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

        return (
          <React.Fragment key={`conn-${conn.from}-${conn.to}-${idx}`}>
            {hasMemory ? (
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
 */
function ForceTube({ from, to, getPos, radius, color, opacity, blending }) {
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

  // 每帧更新位置
  React.useEffect(() => {
    if (!getPos) return;
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
    }, 16);

    return () => clearInterval(interval);
  }, [from, to, getPos]);

  return <mesh ref={tubeRef} geometry={geo} material={mat} />;
}
