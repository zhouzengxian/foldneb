import { useEffect, useRef, useState } from 'react';
import useNebulaStore from '../store/useNebulaStore';
import { agents } from '../data/agents';

const A_COLOR = {};
agents.forEach(a => { A_COLOR[a.id] = a.color; });
A_COLOR['user'] = '#FFD700';

const PW = 240, PH = 300;
const CX = 120, CY = 160;

export default function MemoryGraph() {
  const canvasRef = useRef();
  const memories = useNebulaStore(s => s.memories);
  const [collapsed, setCollapsed] = useState(true);
  const memList = Object.values(memories);
  const memCount = memList.length;

  // 收集节点
  const nodeSet = new Set();
  memList.forEach(m => { nodeSet.add(m.from); nodeSet.add(m.to); });
  const nodes = Array.from(nodeSet);

  useEffect(() => {
    if (collapsed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = PW * dpr;
    canvas.height = PH * dpr;
    ctx.scale(dpr, dpr);

    let frame = 0;
    let animId;

    // 节点位置
    const pos = {};
    nodes.forEach((id, i) => {
      if (id === 'user') {
        pos[id] = { x: CX, y: CY, vx: 0, vy: 0, pinned: true };
      } else {
        const angle = (i / Math.max(nodes.length - 1, 1)) * Math.PI * 2 - Math.PI / 2;
        const r = 50 + Math.random() * 30;
        pos[id] = { x: CX + Math.cos(angle) * r, y: CY + Math.sin(angle) * r, vx: 0, vy: 0, pinned: false };
      }
    });

    function tick() {
      frame++;
      // 力导向
      const ids = Object.keys(pos);
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = pos[ids[i]], b = pos[ids[j]];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          const rep = 250 / (dist * dist);
          if (!a.pinned) { a.vx += (dx / dist) * rep * 0.3; a.vy += (dy / dist) * rep * 0.3; }
          if (!b.pinned) { b.vx -= (dx / dist) * rep * 0.3; b.vy -= (dy / dist) * rep * 0.3; }
        }
      }
      // 弹簧
      memList.forEach(m => {
        const f = m.from === 'user' ? { x: CX, y: CY } : pos[m.from];
        const t = m.to === 'user' ? { x: CX, y: CY } : pos[m.to];
        if (!f || !t) return;
        const dx = t.x - f.x, dy = t.y - f.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const force = (dist - 60) * 0.03;
        if (m.from !== 'user' && !pos[m.from]?.pinned) { pos[m.from].vx += (dx / dist) * force; pos[m.from].vy += (dy / dist) * force; }
        if (m.to !== 'user' && !pos[m.to]?.pinned) { pos[m.to].vx -= (dx / dist) * force; pos[m.to].vy -= (dy / dist) * force; }
      });
      // 更新
      ids.forEach(id => {
        const n = pos[id];
        if (n.pinned) return;
        n.vx += (CX - n.x) * 0.002; n.vy += (CY - n.y) * 0.002;
        n.vx *= 0.9; n.vy *= 0.9;
        n.vx = Math.max(-3, Math.min(3, n.vx));
        n.vy = Math.max(-3, Math.min(3, n.vy));
        n.x += n.vx; n.y += n.vy;
      });

      ctx.clearRect(0, 0, PW, PH);
      ctx.fillStyle = '#060618';
      ctx.fillRect(0, 0, PW, PH);

      // 网格
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < PW; gx += 30) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, PH); ctx.stroke(); }
      for (let gy = 0; gy < PH; gy += 30) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(PW, gy); ctx.stroke(); }

      // 边
      memList.forEach(m => {
        const f = m.from === 'user' ? { x: CX, y: CY } : pos[m.from];
        const t = m.to === 'user' ? { x: CX, y: CY } : pos[m.to];
        if (!f || !t) return;
        const alpha = Math.min(0.3 + (m.interactionCount - 1) * 0.1, 1.0);
        const lw = 1 + (m.interactionCount - 1) * 0.4;
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = `rgba(255,215,0,${alpha * 0.2})`;
        ctx.lineWidth = lw + 3; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = `rgba(255,215,0,${alpha})`;
        ctx.lineWidth = lw; ctx.stroke();

        const label = m.relations[m.relations.length - 1]?.label || '';
        if (label) {
          const mx = (f.x + t.x) / 2, my = (f.y + t.y) / 2;
          ctx.font = '8px "PingFang SC","Microsoft YaHei",sans-serif';
          const tw = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(mx - tw / 2 - 3, my - 6, tw + 6, 12);
          ctx.fillStyle = '#FFD700';
          ctx.fillText(label, mx - tw / 2, my + 3);
        }
      });

      // 节点
      nodes.forEach(id => {
        const p = id === 'user' ? { x: CX, y: CY } : pos[id];
        if (!p) return;
        const col = A_COLOR[id] || '#889';
        const pulse = id === 'user' ? 1 + Math.sin(frame * 0.05) * 0.15 : 1;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12 * pulse);
        g.addColorStop(0, col + '88'); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 12 * pulse, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff2'; ctx.lineWidth = 0.8; ctx.stroke();
        if (id === 'user') { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5; ctx.stroke(); }

        const a = agents.find(x => x.id === id);
        const nm = id === 'user' ? '我' : a?.name || id;
        ctx.font = '9px "PingFang SC","Microsoft YaHei",sans-serif';
        ctx.fillStyle = '#ccd';
        const mw = ctx.measureText(nm).width;
        ctx.fillText(nm, p.x - mw / 2, p.y - 14);
      });

      ctx.font = 'bold 10px "PingFang SC",sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('记忆晶体图谱', 8, 18);
      ctx.font = '8px "PingFang SC",sans-serif';
      ctx.fillStyle = '#667';
      ctx.fillText(`${memCount}晶体·${nodes.length}节点`, 8, 32);

      animId = requestAnimationFrame(tick);
    }
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [collapsed, memCount, nodes.length, memList]);

  if (collapsed) {
    return (
      <div onClick={() => setCollapsed(false)} style={{
        position:'fixed', bottom:8, left:8, zIndex:35,
        background:'rgba(0,0,0,0.8)', border:'1px solid rgba(255,215,0,0.25)',
        borderRadius:8, padding:'8px 12px', cursor:'pointer',
        color:'#FFD700', fontSize:12, fontFamily:'inherit',
      }}>
        📊 记忆 {memCount > 0 ? `(${memCount})` : ''}
      </div>
    );
  }

  return (
    <div style={{
      position:'fixed', bottom:60, left:8, zIndex:35,
      background:'rgba(6,6,18,0.93)', border:'1px solid rgba(255,215,0,0.2)',
      borderRadius:12, overflow:'hidden',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 8px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ color:'#FFD700', fontSize:10, fontWeight:700 }}>📊 记忆晶体推演</span>
        <button onClick={() => setCollapsed(true)} style={{ background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:14 }}>×</button>
      </div>
      <canvas ref={canvasRef} style={{ width:PW, height:PH }} />
    </div>
  );
}
