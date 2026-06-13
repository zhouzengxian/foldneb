import { useEffect, useRef, useState } from 'react';
import useNebulaStore from '../store/useNebulaStore';
import { agents } from '../data/agents';

const A_COLOR = {};
agents.forEach(a => { A_COLOR[a.id] = a.color; });
A_COLOR['user'] = '#FFD700';

// 关系类型 → 颜色（kg-visualizer 风格多色方案）
const RELATION_COLORS = {
  '关注': '#42A5F5',       // 蓝
  '认同': '#66BB6A',       // 绿
  '赞同': '#66BB6A',       // 绿
  '思想共鸣': '#AB47BC',   // 紫
  '思想影响': '#AB47BC',   // 紫
  '思想辩论': '#EF5350',   // 红
  '反对': '#EF5350',       // 红
  '知识延伸': '#26C6DA',   // 青
  '认知扩展': '#26C6DA',   // 青
  '社交': '#FFA726',       // 橙
};

function relationColor(label) {
  return RELATION_COLORS[label] || '#FFD700';
}

// '#RRGGBB' + alpha(0~1) → rgba 字符串
function withAlpha(hex, alpha) {
  const a = Math.max(0, Math.min(1, alpha));
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const PW = 240, PH = 300;
const CX = 120, CY = 160;

export default function MemoryGraph() {
  const canvasRef = useRef();
  const memories = useNebulaStore(s => s.memories);
  const [collapsed, setCollapsed] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const hoverRef = useRef(null);
  const selectedRef = useRef(null);
  selectedRef.current = selectedNode;
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

      // 边（根据关系类型上色）
      memList.forEach(m => {
        const f = m.from === 'user' ? { x: CX, y: CY } : pos[m.from];
        const t = m.to === 'user' ? { x: CX, y: CY } : pos[m.to];
        if (!f || !t) return;
        const label = m.relations[m.relations.length - 1]?.label || '';
        const rCol = relationColor(label);
        const isHL = hoverRef.current && (m.from === hoverRef.current || m.to === hoverRef.current ||
                    selectedRef.current && (m.from === selectedRef.current || m.to === selectedRef.current));
        const alpha = Math.min(0.3 + (m.interactionCount - 1) * 0.1, 1.0);
        const lw = 1 + (m.interactionCount - 1) * 0.4;
        ctx.globalAlpha = hoverRef.current && !isHL ? 0.15 : 1;
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = withAlpha(rCol, alpha * 0.2);
        ctx.lineWidth = lw + 3; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = withAlpha(rCol, alpha);
        ctx.lineWidth = isHL ? lw + 1 : lw; ctx.stroke();
        ctx.globalAlpha = 1;

        if (label && (!hoverRef.current || isHL)) {
          const mx = (f.x + t.x) / 2, my = (f.y + t.y) / 2;
          ctx.font = '8px "PingFang SC","Microsoft YaHei",sans-serif';
          const tw = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillRect(mx - tw / 2 - 3, my - 6, tw + 6, 12);
          ctx.fillStyle = rCol;
          ctx.fillText(label, mx - tw / 2, my + 3);
        }
      });

      // 节点（kg-visualizer 风格：无边描 + 柔和阴影 + hover/selected 高亮）
      nodes.forEach(id => {
        const p = id === 'user' ? { x: CX, y: CY } : pos[id];
        if (!p) return;
        const col = A_COLOR[id] || '#889';
        const pulse = id === 'user' ? 1 + Math.sin(frame * 0.05) * 0.15 : 1;
        const isHover = hoverRef.current === id;
        const isSel = selectedRef.current === id;
        const baseR = id === 'user' ? 7 : 6;
        const r = baseR * pulse * (isHover ? 1.35 : (isSel ? 1.2 : 1));
        const dim = hoverRef.current && !isHover && !(memList.some(m =>
          (m.from === hoverRef.current && m.to === id) || (m.to === hoverRef.current && m.from === id)
        ));

        // 柔和外发光（替代边描）
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.2);
        g.addColorStop(0, withAlpha(col, dim ? 0.2 : 0.55));
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2); ctx.fill();

        // 主体（无边描）
        ctx.fillStyle = dim ? withAlpha(col, 0.4) : col;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();

        // hover / selected 高亮外圈
        if (isHover || isSel) {
          ctx.strokeStyle = isSel ? '#FFD700' : '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(p.x, p.y, r + 3, 0, Math.PI * 2); ctx.stroke();
        }

        const a = agents.find(x => x.id === id);
        const nm = id === 'user' ? '我' : a?.name || id;
        ctx.font = '9px "PingFang SC","Microsoft YaHei",sans-serif';
        ctx.fillStyle = dim ? '#445' : '#ccd';
        const mw = ctx.measureText(nm).width;
        ctx.fillText(nm, p.x - mw / 2, p.y - r - 6);
      });

      ctx.font = 'bold 10px "PingFang SC",sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('记忆晶体图谱', 8, 18);
      ctx.font = '8px "PingFang SC",sans-serif';
      ctx.fillStyle = '#667';
      ctx.fillText(`${memCount}晶体·${nodes.length}节点`, 8, 32);

      animId = requestAnimationFrame(tick);
    }
    // ─── 命中检测 + 事件 ───
    function hitTest(mx, my) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const id = nodes[i];
        const p = id === 'user' ? { x: CX, y: CY } : pos[id];
        if (!p) continue;
        const baseR = id === 'user' ? 7 : 6;
        const dx = mx - p.x, dy = my - p.y;
        if (dx * dx + dy * dy <= (baseR + 4) * (baseR + 4)) return id;
      }
      return null;
    }
    function handleMove(e) {
      const rect = canvas.getBoundingClientRect();
      hoverRef.current = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      canvas.style.cursor = hoverRef.current ? 'pointer' : 'default';
    }
    function handleClick(e) {
      const rect = canvas.getBoundingClientRect();
      const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      setSelectedNode(hit === selectedRef.current ? null : hit);
    }
    function handleLeave() { hoverRef.current = null; canvas.style.cursor = 'default'; }
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mouseleave', handleLeave);

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mouseleave', handleLeave);
    };
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
      {/* 选中节点的关系详情 */}
      {selectedNode && (() => {
        const agent = agents.find(a => a.id === selectedNode);
        const nm = selectedNode === 'user' ? '我' : agent?.name || selectedNode;
        const col = A_COLOR[selectedNode] || '#889';
        const rels = memList.filter(m => m.from === selectedNode || m.to === selectedNode);
        return (
          <div style={{ padding:'6px 8px', borderTop:'1px solid rgba(255,255,255,0.06)', maxHeight:90, overflow:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <span style={{ color:col, fontSize:10, fontWeight:700 }}>{nm} · {rels.length}条关系</span>
              <button onClick={() => setSelectedNode(null)} style={{ background:'none', border:'none', color:'#556', cursor:'pointer', fontSize:11 }}>×</button>
            </div>
            {rels.map((m, i) => {
              const other = m.from === selectedNode ? m.to : m.from;
              const oa = agents.find(a => a.id === other);
              const onm = other === 'user' ? '我' : oa?.name || other;
              const label = m.relations[m.relations.length-1]?.label || '';
              const rc = relationColor(label);
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, fontFamily:'system-ui', marginBottom:2 }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:rc, flexShrink:0 }} />
                  <span style={{ color:'#aab' }}>{onm}</span>
                  <span style={{ color:rc, fontWeight:600 }}>{label}</span>
                  <span style={{ color:'#556' }}>×{m.interactionCount}</span>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
