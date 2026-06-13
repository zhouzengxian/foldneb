import { useRef, useEffect, useState } from 'react';

/**
 * TimelineGraph — 时间轴可视化
 * Y 轴锁定时间顺序（10年在顶 → 现在在底），X 轴力导向游走
 * 显示 4 个未来的自我 + 现在的你，连线表示跨时间互评（agree=绿/disagree=红/partial=灰）
 */
const SENTIMENT_COLOR = {
  support: '#66BB6A', warn: '#EF5350', reframe: '#42A5F5', letgo: '#AB47BC',
};
const REVIEW_COLOR = { agree: '#66BB6A', disagree: '#EF5350', partial: '#888899' };

export default function TimelineGraph({ selves, letters, crossReviews = [] }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const posRef = useRef({}); // { nodeId: { x, y, vx, vy } }
  const [hovered, setHovered] = useState(null);
  const [size, setSize] = useState({ w: 600, h: 300 });
  const animRef = useRef(null);

  // 构建"现在"节点 + 4 个未来自我节点
  const nodes = [
    { id: 'present', label: '现在的你', years: 0, color: '#FFFFFF', sentiment: null },
    ...(selves || []).map(s => {
      const letter = (letters || []).find(l => l.from === s.id);
      return {
        id: s.id, label: s.label, years: s.years, color: s.color,
        sentiment: letter?.sentiment || null, letter,
      };
    }),
  ];

  // Y 层：现在=底部，时间越长越靠上
  const yLayer = (years, h) => {
    const maxYears = 10;
    // 现在在 h-30，10年在 30，线性插值
    const top = 30, bottom = h - 30;
    return bottom - (years / maxYears) * (bottom - top);
  };

  // 初始化位置
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth, h = 300;
    setSize({ w, h });
    const cx = w / 2;
    nodes.forEach((n, i) => {
      posRef.current[n.id] = {
        x: cx + (i % 2 === 0 ? -1 : 1) * (20 + i * 8) * (n.id === 'present' ? 0 : 1),
        y: yLayer(n.years, h),
        vx: 0, vy: 0,
      };
    });
  }, [selves, letters]);

  // 力导向动画（X 轴游走，Y 锁定）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth, h = 300;
      if (canvas.width !== w * dpr) {
        canvas.width = w * dpr; canvas.height = h * dpr;
        canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      return { w, h };
    }

    const TICK = () => {
      const dim = resize();
      if (!dim) { animRef.current = requestAnimationFrame(TICK); return; }
      const { w, h } = dim;
      const cx = w / 2;
      const pos = posRef.current;

      // 力导向：节点间 X 方向排斥 + 中心引力（Y 不变）
      const ids = nodes.map(n => n.id);
      ids.forEach(a => {
        const pa = pos[a]; if (!pa) return;
        ids.forEach(b => {
          if (a === b) return;
          const pb = pos[b]; if (!pb) return;
          const dx = pa.x - pb.x;
          const dist = Math.max(Math.abs(dx), 1);
          if (dist < 90) { // X 方向排斥
            pa.vx += (dx / dist) * (90 - dist) * 0.02;
          }
        });
        // 中心引力（拉向中线）
        pa.vx += (cx - pa.x) * 0.008;
        // 阻尼
        pa.vx *= 0.85;
        pa.x += pa.vx;
        // 边界
        pa.x = Math.max(40, Math.min(w - 40, pa.x));
        // Y 锁定（不参与力）
        pa.y = yLayer(nodes.find(n => n.id === a)?.years || 0, h);
      });

      // 渲染
      ctx.clearRect(0, 0, w, h);

      // 背景时间轴竖线
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(cx, 20); ctx.lineTo(cx, h - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // 时间标签（左侧）
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'left';
      [{ y: 30, t: '10年后' }, { y: (30 + (h - 60) * 0.4), t: '5年' }, { y: (30 + (h - 60) * 0.7), t: '3年' }, { y: h - 30, t: '现在' }]
        .forEach(l => { ctx.fillText(l.t, 6, l.y + 3); });

      // 互评连线（弧线）
      (crossReviews || []).forEach(r => {
        const pf = pos[r.from], pt = pos[r.to];
        if (!pf || !pt) return;
        const color = REVIEW_COLOR[r.agreement] || REVIEW_COLOR.partial;
        ctx.strokeStyle = color + '88';
        ctx.lineWidth = r.agreement === 'disagree' ? 2 : 1.5;
        ctx.setLineDash(r.agreement === 'agree' ? [] : [4, 3]);
        ctx.beginPath();
        const midX = (pf.x + pt.x) / 2 + (r.agreement === 'disagree' ? 30 : -30);
        const midY = (pf.y + pt.y) / 2;
        ctx.moveTo(pf.x, pf.y);
        ctx.quadraticCurveTo(midX, midY, pt.x, pt.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 节点
      nodes.forEach(n => {
        const p = pos[n.id]; if (!p) return;
        const isHover = hovered === n.id;
        const r = isHover ? 9 : 7;
        const color = n.sentiment ? SENTIMENT_COLOR[n.sentiment] : n.color;

        // 外发光
        ctx.shadowColor = color; ctx.shadowBlur = isHover ? 16 : 8;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // 标签
        ctx.fillStyle = isHover ? '#fff' : 'rgba(220,225,240,0.8)';
        ctx.font = isHover ? 'bold 11px system-ui' : '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, p.x, p.y - r - 6);
      });

      animRef.current = requestAnimationFrame(TICK);
    };

    animRef.current = requestAnimationFrame(TICK);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [selves, letters, crossReviews, hovered]);

  // hover 检测
  const handleMove = (e) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let hit = null;
    nodes.forEach(n => {
      const p = posRef.current[n.id]; if (!p) return;
      if (Math.hypot(mx - p.x, my - p.y) < 14) hit = n.id;
    });
    setHovered(hit);
  };

  const hoveredNode = nodes.find(n => n.id === hovered);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMove}
        onMouseLeave={() => setHovered(null)}
        style={{ display: 'block', width: '100%', height: 300, cursor: hovered ? 'pointer' : 'default' }}
      />
      {/* hover 信件提示 */}
      {hoveredNode?.letter && (
        <div style={{
          position: 'absolute', top: 8, right: 8, maxWidth: 220, padding: '10px 12px',
          background: 'rgba(10,10,26,0.95)', border: `1px solid ${hoveredNode.color}66`,
          borderRadius: '8px', fontSize: '11px', color: '#ccd', fontFamily: 'system-ui',
          pointerEvents: 'none', animation: 'fadeIn 0.2s',
        }}>
          <div style={{ color: hoveredNode.color, fontWeight: 700, marginBottom: 4 }}>《{hoveredNode.letter.title}》</div>
          <div style={{ lineHeight: 1.5, opacity: 0.85 }}>{hoveredNode.letter.content.slice(0, 80)}…</div>
        </div>
      )}
      {/* 图例 */}
      <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap', fontSize: '10px', fontFamily: 'system-ui' }}>
        <span style={{ color: '#8e8' }}>── 同意</span>
        <span style={{ color: '#e99' }}>── 反对</span>
        <span style={{ color: '#889' }}>⋯⋯ 部分</span>
      </div>
    </div>
  );
}
