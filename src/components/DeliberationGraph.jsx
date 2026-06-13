import { useEffect, useRef } from 'react';
import { tier1Agents } from '../data/gameData';

/**
 * DeliberationGraph — 推演过程实时图谱
 * Canvas 2D 力导向图，推演面板右侧展示
 * 用户节点固定顶部中央，参演Agent按轮次从上到下分层
 * 连线颜色：冲突红/共识绿/洞见蓝/普通金
 */

const W = 280, H = 400;
const CX = W / 2;
const USER_Y = 28;
const ROUND_START_Y = 80;
const ROUND_GAP = 90;

const COLORS = {
  user: '#FFD700',
  conflict: '#FF4466',
  consensus: '#44DD88',
  insight: '#44AAFF',
  connection: 'rgba(255,215,0,0.45)',
};

const agentColorMap = {};
tier1Agents.forEach(a => { agentColorMap[a.id] = a.color; });
agentColorMap.user = COLORS.user;
agentColorMap.mochi = '#B8A0FF';

export default function DeliberationGraph({ session, phase }) {
  const canvasRef = useRef();
  const posRef = useRef({});
  const edgeDataRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let frame = 0;
    let animId;

    const agentIds = session?.agents?.map(a => a.id) || [];
    const rounds = session?.rounds || [];

    // 节点目标位置
    const targets = {};
    targets.user = { x: CX, y: USER_Y, pinned: true };

    const placed = new Set();
    rounds.forEach((r, ri) => {
      const ids = (r.agentIds || []).filter(id => agentIds.includes(id));
      ids.forEach((id, ci) => {
        placed.add(id);
        targets[id] = {
          x: CX - (ids.length - 1) * 42 + ci * 84,
          y: ROUND_START_Y + ri * ROUND_GAP + 8,
          pinned: false,
        };
      });
    });
    agentIds.forEach(id => {
      if (!placed.has(id)) {
        targets[id] = {
          x: CX + (Math.random() - 0.5) * 140,
          y: ROUND_START_Y + rounds.length * ROUND_GAP + 24,
          pinned: false,
        };
      }
    });

    // 初始化/更新物理位置
    const posMap = {};
    Object.entries(targets).forEach(([id, t]) => {
      if (!posRef.current[id]) {
        posRef.current[id] = {
          x: t.pinned ? t.x : CX + (Math.random() - 0.5) * 180,
          y: t.pinned ? t.y : H - 30 - Math.random() * 50,
          vx: 0, vy: 0, pinned: t.pinned,
          targetX: t.x, targetY: t.y,
        };
      } else {
        posRef.current[id].targetX = t.x;
        posRef.current[id].targetY = t.y;
        posRef.current[id].pinned = t.pinned;
      }
      posMap[id] = posRef.current[id];
    });

    // 边数据
    const insights = session?.insights || [];
    agentIds.forEach(id => {
      updateEdge(`user::${id}::connection`, 'user', id, 'connection', '');
    });
    insights.forEach(ins => {
      const ags = ins.agents || [];
      if (ags.length >= 2 && posMap[ags[0]] && posMap[ags[1]]) {
        updateEdge(
          `${ags[0]}::${ags[1]}::${ins.type}`,
          ags[0], ags[1],
          ins.type || 'insight',
          (ins.text || '').slice(0, 12)
        );
      }
    });

    function updateEdge(key, from, to, type, text) {
      const existing = edgeDataRef.current.find(e => e.key === key);
      if (existing) {
        existing.type = type;
        existing.text = text;
      } else {
        edgeDataRef.current.push({
          key, from, to, type, text,
          progress: type === 'connection' ? 1 : 0,
          bornAt: Date.now(),
        });
      }
    }

    function tick() {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // 背景
      ctx.fillStyle = 'rgba(6,6,18,0.6)';
      ctx.fillRect(0, 0, W, H);

      // 网格
      ctx.strokeStyle = 'rgba(255,255,255,0.015)';
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

      // 力导向（前80帧收敛）
      const ids = Object.keys(posMap);
      if (frame < 80) {
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            const a = posMap[ids[i]], b = posMap[ids[j]];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            const rep = 600 / (dist * dist);
            if (!a.pinned) { a.vx += (dx / dist) * rep * 0.15; a.vy += (dy / dist) * rep * 0.15; }
            if (!b.pinned) { b.vx -= (dx / dist) * rep * 0.15; b.vy -= (dy / dist) * rep * 0.15; }
          }
        }
        ids.forEach(id => {
          const n = posMap[id];
          if (n.pinned) return;
          n.vx += (n.targetX - n.x) * 0.06;
          n.vy += (n.targetY - n.y) * 0.06;
          n.vx *= 0.85;
          n.vy *= 0.85;
          n.vx = Math.max(-2, Math.min(2, n.vx));
          n.vy = Math.max(-2, Math.min(2, n.vy));
          n.x += n.vx;
          n.y += n.vy;
        });
      }

      // 更新边进度
      const now = Date.now();
      edgeDataRef.current.forEach(e => {
        if (e.progress < 1) {
          e.progress = Math.min((now - e.bornAt) / 2000, 1);
        }
      });

      // 绘制边
      edgeDataRef.current.forEach(e => {
        const fp = posMap[e.from], tp = posMap[e.to];
        if (!fp || !tp) return;
        const dx = tp.x - fp.x, dy = tp.y - fp.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const grow = Math.min(e.progress, 1);
        const ex = fp.x + (dx / dist) * dist * grow;
        const ey = fp.y + (dy / dist) * dist * grow;

        let color, w;
        switch (e.type) {
          case 'conflict':  color = COLORS.conflict; w = 2; break;
          case 'consensus': color = COLORS.consensus; w = 2; break;
          case 'insight':   color = COLORS.insight; w = 1.8; break;
          default:          color = COLORS.connection; w = 1.2;
        }

        // 辉光
        ctx.beginPath(); ctx.moveTo(fp.x, fp.y); ctx.lineTo(ex, ey);
        ctx.strokeStyle = color.replace(')', ',0.15)').replace('rgb', 'rgba');
        ctx.lineWidth = w + 3; ctx.stroke();

        // 主线
        ctx.beginPath(); ctx.moveTo(fp.x, fp.y); ctx.lineTo(ex, ey);
        ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();

        // 标签
        if (e.text && grow > 0.85 && e.type !== 'connection') {
          const mx = fp.x + (dx / dist) * dist * 0.55;
          const my = fp.y + (dy / dist) * dist * 0.55;
          ctx.font = '8px "PingFang SC","Microsoft YaHei",sans-serif';
          const tw = ctx.measureText(e.text).width;
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(mx - tw / 2 - 3, my - 6, tw + 6, 12);
          ctx.fillStyle = color;
          ctx.fillText(e.text, mx - tw / 2, my + 3);
        }
      });

      // 轮次标记线
      rounds.forEach((r, ri) => {
        const y = ROUND_START_Y - 18 + ri * ROUND_GAP;
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.setLineDash([4, 16]);
        ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 30, y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#556';
        ctx.font = '9px "PingFang SC",sans-serif';
        ctx.fillText(`第${ri + 1}轮`, 30, y - 4);
      });

      // 绘制节点
      ids.forEach(id => {
        const p = posMap[id];
        const color = agentColorMap[id] || '#8888cc';
        const isUser = id === 'user';
        const r = isUser ? 9 : 7;

        const pulse = isUser ? 1 + Math.sin(frame * 0.04) * 0.12 : 1;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.5 * pulse);
        glow.addColorStop(0, color + '66');
        glow.addColorStop(0.6, color + '11');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.5 * pulse, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 1; ctx.stroke();
        if (isUser) { ctx.strokeStyle = COLORS.user; ctx.lineWidth = 2; ctx.stroke(); }

        const agent = tier1Agents.find(a => a.id === id);
        const name = isUser ? '我' : (agent?.name || id);
        ctx.font = `${isUser ? 'bold ' : ''}10px "PingFang SC","Microsoft YaHei",sans-serif`;
        ctx.fillStyle = isUser ? '#FFD700' : '#aab';
        const nm = ctx.measureText(name);
        ctx.fillText(name, p.x - nm.width / 2, p.y - r - 8);
      });

      // 标题
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 10px "PingFang SC",sans-serif';
      ctx.fillText('推演脉络', 10, 14);

      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [session?.id]);

  return (
    <div style={{
      background: 'rgba(6,6,18,0.5)',
      borderRadius: '10px',
      border: '1px solid rgba(255,215,0,0.12)',
      overflow: 'hidden',
    }}>
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, display: 'block' }}
      />
    </div>
  );
}
