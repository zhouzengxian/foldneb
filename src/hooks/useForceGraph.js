import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * v2 力导向引擎 — 分层物理
 * Tier 1-2: 完整物理（锚定力 + 排斥力 + 弹簧力）
 * Tier 3: 仅锚定力 + 弱向心力（不参与O(n²)排斥和弹簧计算）
 * 
 * 性能：1000 Agent时 O(n²) 从 ~500K 对 降到 ~ 24K 对 (220²)
 */
export function useForceGraph(agents, connections, districts, options = {}) {
  const {
    repulsion = 10,
    springForce = 0.015,
    centerForce = 0.012,
    districtAnchor = 0.05,
    smoothSpeed = 0.05,
  } = options;

  const physicsRef = useRef({});
  const dragRef = useRef(null);

  // 分层索引：Tier-1/2参与完整物理，Tier-3只做锚定
  const fullPhysicsIds = useMemo(() => agents.filter(a => a.tier <= 2).map(a => a.id), []);
  const t3Ids = useMemo(() => agents.filter(a => a.tier === 3).map(a => a.id), []);

  // 每个Agent对应的坊区锚点
  const anchors = useMemo(() => {
    const map = {};
    agents.forEach(a => {
      const d = districts.find(dd => dd.id === a.district);
      map[a.id] = d ? [d.position[0], 0, d.position[2]] : [a.position[0], 0, a.position[2]];
    });
    return map;
  }, []);

  // 初始化物理状态
  if (Object.keys(physicsRef.current).length === 0) {
    agents.forEach(a => {
      physicsRef.current[a.id] = {
        x: a.position[0], y: a.position[1] || 0, z: a.position[2],
        vx: 0, vy: 0, vz: 0,
        pinned: false,
        displayX: a.position[0], displayY: a.position[1] || 0, displayZ: a.position[2],
        tier: a.tier || 3,
      };
    });
    // 用户分身节点 — 固定在原点
    physicsRef.current['user'] = {
      x: 0, y: 0.3, z: 0,
      vx: 0, vy: 0, vz: 0,
      pinned: true,
      displayX: 0, displayY: 0.3, displayZ: 0,
      tier: 0,
    };
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta * 60, 2);
    const nodes = physicsRef.current;

    // ==== 速度衰减（全部Agent） ====
    fullPhysicsIds.forEach(id => {
      const n = nodes[id];
      if (n.pinned) { n.vx=0; n.vy=0; n.vz=0; return; }
      n.vx *= 0.96; n.vy *= 0.96; n.vz *= 0.96;
    });
    t3Ids.forEach(id => {
      const n = nodes[id];
      n.vx *= 0.92; n.vy *= 0.92; n.vz *= 0.92;
    });

    // ==== 锚定力（全部Agent） ====
    const allIds = [...fullPhysicsIds, ...t3Ids];
    allIds.forEach(id => {
      const n = nodes[id];
      if (n.pinned) return;
      const [ax, ay, az] = anchors[id] || [0, 0, 0];
      const isT3 = n.tier === 3;
      const anchorStr = isT3 ? districtAnchor * 0.6 : districtAnchor;
      const centerStr = isT3 ? centerForce * 0.5 : centerForce;
      n.vx += (ax - n.x) * anchorStr * dt;
      n.vy += (ay - n.y) * anchorStr * 0.25 * dt;
      n.vz += (az - n.z) * anchorStr * dt;
      n.vx += -n.x * centerStr * dt;
      n.vz += -n.z * centerStr * dt;
      n.vy += -n.y * centerStr * 0.15 * dt;
    });

    // ==== 排斥力（仅Tier 1-2之间） ====
    // Tier-3被Tier-1/2排斥但不主动排斥他人
    const fpCount = fullPhysicsIds.length;
    for (let i = 0; i < fpCount; i++) {
      for (let j = i + 1; j < fpCount; j++) {
        const a = nodes[fullPhysicsIds[i]], b = nodes[fullPhysicsIds[j]];
        applyRepulsion(a, b, repulsion, dt);
      }
    }

    // ==== 边弹簧力（仅参与连线的节点，都是Tier-1） ====
    connections.forEach(conn => {
      const a = nodes[conn.from], b = nodes[conn.to];
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.001;
      const targetDist = 1.5; // 紧凑布局
      const displace = dist - targetDist;
      const f = springForce * displace;
      if (!a.pinned) { a.vx += (dx/dist)*f*dt; a.vy += (dy/dist)*f*dt; a.vz += (dz/dist)*f*dt; }
      if (!b.pinned) { b.vx -= (dx/dist)*f*dt; b.vy -= (dy/dist)*f*dt; b.vz -= (dz/dist)*f*dt; }
    });

    // ==== 限速 + 位置更新 + 平滑显示 ====
    allIds.forEach(id => {
      const n = nodes[id];
      if (n.pinned) return;
      const spd = Math.sqrt(n.vx*n.vx + n.vy*n.vy + n.vz*n.vz);
      const maxSpd = n.tier <= 2 ? 0.12 : 0.06;
      if (spd > maxSpd) {
        n.vx = (n.vx/spd)*maxSpd;
        n.vy = (n.vy/spd)*maxSpd;
        n.vz = (n.vz/spd)*maxSpd;
      }
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      n.z += n.vz * dt;
      // 平滑显示
      const sm = n.tier <= 2 ? smoothSpeed : smoothSpeed * 1.5;
      n.displayX += (n.x - n.displayX) * sm;
      n.displayY += (n.y - n.displayY) * sm;
      n.displayZ += (n.z - n.displayZ) * sm;
    });
  });

  function applyRepulsion(a, b, repForce, dt) {
    const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    const distSq = dx*dx + dy*dy + dz*dz + 0.3;
    const dist = Math.sqrt(distSq);
    const f = repForce / distSq;
    if (!a.pinned) { a.vx += (dx/dist)*f*dt; a.vy += (dy/dist)*f*dt; a.vz += (dz/dist)*f*dt; }
    if (!b.pinned) { b.vx -= (dx/dist)*f*dt; b.vy -= (dy/dist)*f*dt; b.vz -= (dz/dist)*f*dt; }
  }

  const getPos = (id) => {
    const n = physicsRef.current[id];
    return n ? [n.displayX, n.displayY, n.displayZ] : [0,0,0];
  };

  const startDrag = (id) => {
    const n = physicsRef.current[id];
    if (n) { n.pinned=true; n.vx=n.vy=n.vz=0; dragRef.current=id; }
  };

  const moveDrag = (id, wp) => {
    if (dragRef.current !== id) return;
    const n = physicsRef.current[id];
    if (n) { n.x=n.displayX=wp.x; n.y=n.displayY=wp.y; n.z=n.displayZ=wp.z; }
  };

  const endDrag = () => {
    const id = dragRef.current;
    if (id && physicsRef.current[id]) physicsRef.current[id].pinned = false;
    dragRef.current = null;
  };

  const isDragging = () => !!dragRef.current;

  return { getPos, startDrag, moveDrag, endDrag, isDragging, fullPhysicsIds, t3Ids };
}
