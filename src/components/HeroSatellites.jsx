import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * HeroSatellites — 每个Tier-1英雄周围的知识卫星
 * 
 * 小光点 + 标签 + 短线连接
 * 卫星位置 = 英雄实时位置 + 固定偏移
 * 标签使用 Canvas 纹理 Sprite，中文正常渲染
 */

// Canvas 纹理缓存（同一label只生成一次）
const textureCache = {};
function getLabelTexture(label, color) {
  const key = `${label}|${color}`;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 文字（比主星更小，淡色）
  ctx.font = 'bold 20px "PingFang SC","Microsoft YaHei","Noto Serif SC",sans-serif';
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6;
  ctx.fillText(label, 128, 32);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  textureCache[key] = tex;
  return tex;
}

export default function HeroSatellites({ agent, getPhysPos }) {
  if (!agent || agent.tier !== 1 || !agent.satellites?.length) return null;

  return (
    <group>
      {agent.satellites.map((sat, i) => (
        <SatelliteNode
          key={`${agent.id}-sat-${i}`}
          parentId={agent.id}
          sat={sat}
          getPos={getPhysPos}
          parentColor={agent.color}
        />
      ))}
    </group>
  );
}

function SatelliteNode({ parentId, sat, getPos, parentColor }) {
  const dotRef = useRef();
  const lineRef = useRef();
  const labelRef = useRef();
  const vp = useRef(new THREE.Vector3());

  // 标签纹理（缓存）
  const labelTex = useMemo(
    () => getLabelTexture(sat.label, parentColor),
    [sat.label, parentColor]
  );

  useFrame(() => {
    const [px, py, pz] = getPos(parentId) || [0, 0, 0];
    vp.current.set(px, py, pz);

    // 偏移放大 2.5x（数据层用小值，渲染层缩放）
    const K = 2.5;
    const sx = px + sat.offset[0] * K;
    const sy = py + sat.offset[1] * K;
    const sz = pz + sat.offset[2] * K;
    const sp = new THREE.Vector3(sx, sy, sz);

    // 卫星点
    if (dotRef.current) {
      dotRef.current.position.copy(sp);
      dotRef.current.material.opacity = 0.45;
    }

    // 细线：英雄 → 卫星
    if (lineRef.current) {
      const mid = new THREE.Vector3().addVectors(vp.current, sp).multiplyScalar(0.5);
      const dir = new THREE.Vector3().subVectors(sp, vp.current);
      const len = dir.length();
      if (len < 0.001) return;
      lineRef.current.position.copy(mid);
      lineRef.current.scale.set(1, len, 1);
      lineRef.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), dir.normalize()
      );
      lineRef.current.material.opacity = 0.15;
    }

    // 标签 Sprite（紧挨卫星右侧，字体更小）
    if (labelRef.current) {
      labelRef.current.position.set(sx + 0.35 * K, sy, sz);
      labelRef.current.material.opacity = 0.55;
    }
  });

  return (
    <group>
      {/* 连线：超细暗淡 */}
      <mesh ref={lineRef}>
        <cylinderGeometry args={[0.005, 0.005, 1, 6]} />
        <meshBasicMaterial color={parentColor} transparent opacity={0}
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* 卫星点 */}
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color={parentColor} transparent opacity={0}
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* 标签 Sprite */}
      <sprite ref={labelRef} scale={[1.2, 0.3, 1]}>
        <spriteMaterial map={labelTex} transparent opacity={0}
          depthWrite={false} depthTest={false} />
      </sprite>
    </group>
  );
}
