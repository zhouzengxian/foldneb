import { useEffect, useRef } from 'react';
import { tier1Agents } from '../data/gameData';

/**
 * DeliberationGraph — 推演过程实时图谱
 * Canvas 2D，推演面板右侧展示
 * - 顶部：用户圆形节点 + 问题域标签
 * - 分层：每轮一个区域，内含该轮 Agent 节点 + 洞察结论
 * - 连线：用户 ↔ Agent（金色脉动）、Agent ↔ Agent（冲突红/共识绿/洞见蓝）
 * - 星空背景 + 分区卡片 + 实时动画
 */

const W = 280;
// 动态高度：根据轮数 + 洞察数自适应
const BASE_H = 300;
const ROUND_H = 130;
const INSIGHT_H = 20;

// 颜色体系
const COL = {
  bg: '#08081a',
  user: '#FFD700',
  conflict: '#FF5577',
  consensus: '#4FE88A',
  insight: '#55AAFF',
  connection: 'rgba(255,215,0,0.5)',
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.06)',
  line: 'rgba(255,255,255,0.05)',
  text: '#aab',
  textDim: '#556',
  titleGold: '#FFD700',
  mochi: '#C8A8FF',
};

// 预计算 Agent 颜色映射
const agentColorMap = {};
tier1Agents.forEach(a => { agentColorMap[a.id] = a.color || '#8899cc'; });
agentColorMap.user = COL.user;
agentColorMap.mochi = COL.mochi;

// 星空粒子配置
const STAR_COUNT = 60;
let stars = null; // 惰性初始化

export default function DeliberationGraph({ session, phase }) {
  const canvasRef = useRef();
  const posRef = useRef({});
  const edgeDataRef = useRef([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const agentIds = session?.agents?.map(a => a.id) || [];
    const rounds = session?.rounds || [];
    const insights = session?.insights || [];

    // 动态计算高度
    let H = BASE_H + rounds.length * ROUND_H + insights.filter(i => i.type).length * 8;
    H = Math.max(H, 300);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    // 懒初始化星空
    if (!stars) {
      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.025,
      }));
    }

    let frame = 0;
    let animId;

    // ─── 布局计算 ───
    const USER_Y = 38;
    const ROUND_START_Y = 75;
    const ROUND_GAP = ROUND_H;

    // 节点目标位置
    const targets = {};
    targets.user = { x: W / 2, y: USER_Y, pinned: true };

    const placed = new Set();
    rounds.forEach((r, ri) => {
      const ids = (r.agentIds || []).filter(id => agentIds.includes(id));
      const baseY = ROUND_START_Y + ri * ROUND_GAP + 25;
      ids.forEach((id, ci) => {
        placed.add(id);
        const count = ids.length;
        const spacing = Math.min(60, 200 / Math.max(count, 1));
        targets[id] = {
          x: W / 2 - (count - 1) * spacing / 2 + ci * spacing,
          y: baseY,
          pinned: false,
        };
      });
    });
    agentIds.forEach(id => {
      if (!placed.has(id)) {
        targets[id] = {
          x: W / 2 + (Math.random() - 0.5) * 120,
          y: ROUND_START_Y + rounds.length * ROUND_GAP + 20,
          pinned: false,
        };
      }
    });

    // 初始化 / 更新物理位置
    const posMap = {};
    Object.entries(targets).forEach(([id, t]) => {
      if (!posRef.current[id]) {
        posRef.current[id] = {
          x: t.pinned ? t.x : W / 2 + (Math.random() - 0.5) * 160,
          y: t.pinned ? t.y : H - 30 - Math.random() * 40,
          vx: 0, vy: 0, pinned: t.pinned,
          targetX: t.x, targetY: t.y,
          scale: 1, targetScale: 1,
        };
      } else {
        posRef.current[id].targetX = t.x;
        posRef.current[id].targetY = t.y;
        posRef.current[id].pinned = t.pinned;
      }
      posRef.current[id].targetScale = 1;
      posMap[id] = posRef.current[id];
    });

    // ─── 边数据 ───
    // 用户到所有 Agent 的基础连线
    agentIds.forEach(id => {
      addEdge(`user::${id}::connection`, 'user', id, 'connection', '');
    });

    // 洞察连线：Agent ↔ Agent
    insights.forEach(ins => {
      const ags = ins.agents || [];
      if (ags.length >= 2 && posMap[ags[0]] && posMap[ags[1]]) {
        addEdge(
          `${ags[0]}::${ags[1]}::${ins.type}`,
          ags[0], ags[1],
          ins.type || 'insight',
          (ins.text || '').slice(0, 14)
        );
      }
    });

    function addEdge(key, from, to, type, text) {
      const existing = edgeDataRef.current.find(e => e.key === key);
      if (existing) {
        existing.type = type;
        existing.text = text || existing.text;
      } else {
        edgeDataRef.current.push({
          key, from, to, type, text,
          progress: type === 'connection' ? 1 : 0,
          bornAt: Date.now(),
        });
      }
    }

    // ─── 渲染循环 ───
    function tick() {
      frame++;
      frameRef.current = frame;
      ctx.clearRect(0, 0, W, H);

      // ── 背景 ──
      ctx.fillStyle = COL.bg;
      ctx.fillRect(0, 0, W, H);

      // 星空
      stars.forEach(s => {
        s.twinkle += s.speed;
        const alpha = 0.15 + Math.sin(s.twinkle) * 0.15;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 顶部渐变标题区
      const titleGrad = ctx.createLinearGradient(0, 0, 0, 60);
      titleGrad.addColorStop(0, 'rgba(10,10,28,0.6)');
      titleGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = titleGrad;
      ctx.fillRect(0, 0, W, 60);

      // ── 力导向（前 70 帧收敛）──
      const ids = Object.keys(posMap);
      if (frame < 70) {
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            const a = posMap[ids[i]], b = posMap[ids[j]];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            const rep = 500 / (dist * dist);
            if (!a.pinned) { a.vx += (dx / dist) * rep * 0.12; a.vy += (dy / dist) * rep * 0.12; }
            if (!b.pinned) { b.vx -= (dx / dist) * rep * 0.12; b.vy -= (dy / dist) * rep * 0.12; }
          }
        }
        ids.forEach(id => {
          const n = posMap[id];
          if (n.pinned) return;
          n.vx += (n.targetX - n.x) * 0.05;
          n.vy += (n.targetY - n.y) * 0.05;
          n.vx *= 0.82;
          n.vy *= 0.82;
          n.vx = Math.max(-2, Math.min(2, n.vx));
          n.vy = Math.max(-2, Math.min(2, n.vy));
          n.x += n.vx;
          n.y += n.vy;
        });
      }

      // 缩放插值
      ids.forEach(id => {
        const n = posMap[id];
        n.scale += (n.targetScale - n.scale) * 0.1;
      });

      // ── 各轮次的区域卡片 ──
      rounds.forEach((r, ri) => {
        const rTop = ROUND_START_Y + ri * ROUND_GAP;
        const rH = 108;

        // 半透明背景卡片
        ctx.fillStyle = COL.card;
        ctx.strokeStyle = COL.cardBorder;
        ctx.lineWidth = 1;
        roundRect(ctx, 12, rTop - 4, W - 24, rH, 8);
        ctx.fill();
        ctx.stroke();

        // 轮次编号徽章
        const badgeX = 22, badgeY = rTop + 12;
        ctx.fillStyle = 'rgba(255,215,0,0.15)';
        ctx.beginPath();
        ctx.arc(badgeX + 14, badgeY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COL.titleGold;
        ctx.font = 'bold 11px "PingFang SC","Microsoft YaHei",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`R${ri + 1}`, badgeX + 14, badgeY + 4);
        ctx.textAlign = 'start';

        // 轮次主题文字
        ctx.fillStyle = COL.titleGold;
        ctx.font = 'bold 11px "PingFang SC","Microsoft YaHei",sans-serif';
        const themeText = r.theme || `第${ri + 1}轮`;
        ctx.fillText(themeText, badgeX + 34, rTop + 14);

        // 目标说明
        if (r.goal) {
          ctx.fillStyle = COL.textDim;
          ctx.font = '9px "PingFang SC",sans-serif';
          const goal = r.goal.length > 22 ? r.goal.slice(0, 22) + '…' : r.goal;
          ctx.fillText(goal, badgeX + 34, rTop + 30);
        }

        // 底部状态条
        const isDone = r.status === 'done';
        const isActive = r.status === 'active';
        ctx.strokeStyle = isDone ? COL.consensus : isActive ? COL.titleGold : 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(22, rTop + rH - 8);
        ctx.lineTo(W - 22, rTop + rH - 8);
        ctx.stroke();

        if (isDone) {
          ctx.fillStyle = COL.consensus;
          ctx.font = '9px "PingFang SC",sans-serif';
          ctx.fillText('✓ 已完成', W - 72, rTop + rH - 14);
        } else if (isActive) {
          ctx.fillStyle = COL.titleGold;
          ctx.font = '9px "PingFang SC",sans-serif';
          const pulse = Math.sin(frame * 0.06) * 0.3 + 0.7;
          ctx.globalAlpha = pulse;
          ctx.fillText('● 进行中', W - 60, rTop + rH - 14);
          ctx.globalAlpha = 1;
        }
      });

      // ── 更新边进度 ──
      const now = Date.now();
      edgeDataRef.current.forEach(e => {
        if (e.progress < 1) {
          e.progress = Math.min((now - e.bornAt) / 1800, 1);
        }
      });

      // ── 绘制边 ──
      edgeDataRef.current.forEach(e => {
        const fp = posMap[e.from], tp = posMap[e.to];
        if (!fp || !tp) return;
        const dx = tp.x - fp.x, dy = tp.y - fp.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const grow = Math.min(e.progress, 1);
        const mx = fp.x + dx * grow, my = fp.y + dy * grow;

        let edgeColor, edgeWidth;
        switch (e.type) {
          case 'conflict':
            edgeColor = COL.conflict;
            edgeWidth = 2.5;
            break;
          case 'consensus':
            edgeColor = COL.consensus;
            edgeWidth = 2.5;
            break;
          case 'insight':
            edgeColor = COL.insight;
            edgeWidth = 2;
            break;
          default:
            edgeColor = COL.connection;
            edgeWidth = 1.2;
        }

        // 辉光层
        ctx.beginPath();
        ctx.moveTo(fp.x, fp.y);
        ctx.lineTo(mx, my);
        ctx.strokeStyle = edgeColor + '33';
        ctx.lineWidth = edgeWidth + 4;
        ctx.stroke();

        // 主线
        ctx.beginPath();
        ctx.moveTo(fp.x, fp.y);
        ctx.lineTo(mx, my);
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = edgeWidth;
        ctx.stroke();

        // 流动粒子（仅洞见连线显示）
        if (e.type !== 'connection' && grow > 0.3) {
          const particleT = ((frame * 0.03) % 1 + 0.5) % 1;
          const px = fp.x + dx * particleT;
          const py = fp.y + dy * particleT;
          const pGrow = grow < 1 ? Math.min(particleT, grow) : particleT;
          if (pGrow < grow && pGrow > 0) {
            ctx.fillStyle = edgeColor;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
            // 光晕
            ctx.fillStyle = edgeColor + '66';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 连线标签
        if (e.text && grow > 0.8) {
          const lx = fp.x + dx * 0.48;
          const ly = fp.y + dy * 0.48 - 6;
          ctx.font = '7.5px "PingFang SC",sans-serif';
          const tw = ctx.measureText(e.text).width;
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          roundRect(ctx, lx - tw / 2 - 4, ly - 6, tw + 8, 14, 3);
          ctx.fill();
          ctx.fillStyle = edgeColor;
          ctx.textAlign = 'center';
          ctx.fillText(e.text, lx, ly + 4);
          ctx.textAlign = 'start';
        }
      });

      // ── 绘制节点 ──
      ids.forEach(id => {
        const p = posMap[id];
        const color = agentColorMap[id] || '#8888cc';
        const isUser = id === 'user';
        const baseR = isUser ? 12 : 8;
        const r = baseR * (p.scale || 1);

        // 光晕
        const glowR = isUser ? r * 3 : r * 2.2;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        glow.addColorStop(0, color + '55');
        glow.addColorStop(0.5, color + '15');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // 主体圆
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        // 边框
        ctx.strokeStyle = isUser ? COL.user : color + '66';
        ctx.lineWidth = isUser ? 2.5 : 1.5;
        ctx.stroke();

        // 用户额外光环
        if (isUser) {
          const outerPulse = 1 + Math.sin(frame * 0.05) * 0.18;
          ctx.strokeStyle = COL.user + '44';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 1.6 * outerPulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 名字
        const agent = tier1Agents.find(a => a.id === id);
        const name = isUser ? '我' : (agent?.name || id);
        ctx.font = `${isUser ? 'bold ' : ''}10px "PingFang SC","Microsoft YaHei",sans-serif`;
        ctx.fillStyle = isUser ? COL.user : '#ccd';
        const nm = ctx.measureText(name);
        ctx.textAlign = 'center';
        ctx.fillText(name, p.x, p.y - r - 8);
        ctx.textAlign = 'start';

        // 简写标识符（小标签）
        if (!isUser && agent) {
          const initials = agent.name.slice(0, 2);
          ctx.font = 'bold 7px "PingFang SC",sans-serif';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.fillText(initials, p.x, p.y + 3);
          ctx.textAlign = 'start';
        }
      });

      // ── 洞察区域 ──
      if (insights.length > 0) {
        const insY = ROUND_START_Y + rounds.length * ROUND_GAP + 14;
        ctx.fillStyle = COL.card;
        ctx.strokeStyle = 'rgba(100,170,255,0.12)';
        roundRect(ctx, 12, insY, W - 24, Math.min(insights.length * 20 + 20, 100), 8);
        ctx.fill();
        ctx.stroke();

        // 洞察标题
        ctx.fillStyle = COL.insight;
        ctx.font = 'bold 10px "PingFang SC",sans-serif';
        ctx.fillText('💡 关键洞察', 22, insY + 16);

        insights.forEach((ins, ii) => {
          if (ii >= 4) return;
          const iy = insY + 32 + ii * 18;
          const icon = ins.type === 'conflict' ? '⚡' : ins.type === 'consensus' ? '✨' : '▪';
          const iconColor = ins.type === 'conflict' ? COL.conflict : ins.type === 'consensus' ? COL.consensus : COL.insight;
          ctx.fillStyle = iconColor;
          ctx.font = '8px "PingFang SC",sans-serif';
          ctx.fillText(icon, 22, iy);
          ctx.fillStyle = '#bcc';
          ctx.font = '9px "PingFang SC",sans-serif';
          const insText = ins.text || '';
          ctx.fillText(insText.length > 28 ? insText.slice(0, 28) + '…' : insText, 34, iy);
        });
      }

      // ── 顶部标题 ──
      ctx.fillStyle = COL.titleGold;
      ctx.font = 'bold 11px "PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('◈ 推演脉络', W / 2, 18);
      ctx.textAlign = 'start';

      // 阶段状态标签
      if (phase) {
        const phaseLabels = {
          analyzing: ['🔍', '分析中'],
          planning: ['📋', '规划中'],
          deliberating: ['💬', '推演中'],
          reporting: ['📊', '生成报告'],
          complete: ['✨', '已完成'],
        };
        const [ic, lb] = phaseLabels[phase] || ['', phase];
        ctx.font = '9px "PingFang SC",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#889';
        ctx.fillText(`${ic} ${lb}`, W / 2, 34);
        ctx.textAlign = 'start';
      }

      // ── 分隔线 ──
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 48);
      ctx.lineTo(W - 20, 48);
      ctx.stroke();

      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      edgeDataRef.current = [];
    };
  }, [session?.id]);

  // 动态高度以适应 canvas
  const rounds = session?.rounds || [];
  const insights = session?.insights || [];
  const H = Math.max(300, BASE_H + rounds.length * ROUND_H + insights.filter(i => i.type).length * 8);

  return (
    <div style={{
      background: 'rgba(6,6,18,0.5)',
      borderRadius: '10px',
      border: '1px solid rgba(255,215,0,0.12)',
      overflow: 'hidden',
      position: 'sticky',
      top: 16,
    }}>
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, display: 'block' }}
      />
    </div>
  );
}

// 辅助函数：圆角矩形
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
