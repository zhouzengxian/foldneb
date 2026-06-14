import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { tier1Agents } from '../data/gameData';

// 弹性回弹曲线：t∈[0,1] → 0→1.15→1.0（节点出生动画）
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// '#RRGGBB' + alpha(0~1) → '#RRGGBBAA'
function withAlpha(hex, alpha) {
  const a = Math.max(0, Math.min(255, Math.round(alpha * 255)));
  return hex + a.toString(16).padStart(2, '0');
}

/**
 * DeliberationGraph — 推演过程实时图谱
 * Canvas 2D，推演面板右侧展示
 * - 顶部：用户圆形节点 + 问题域标签
 * - 分层：每轮一个区域，内含该轮 Agent 节点 + 洞察结论
 * - 连线：用户 ↔ Agent（金色脉动）、Agent ↔ Agent（冲突红/共识绿/洞见蓝）
 * - 星空背景 + 分区卡片 + 实时动画
 */
const BASE_H = 420;
const ROUND_H = 140;
const INSIGHT_H = 26;

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
const STAR_COUNT = 90;
let stars = null; // 惰性初始化

export default function DeliberationGraph({ session, phase, onSelectNode, selectedNode, maxW = 480 }) {
  const canvasRef = useRef();
  const posRef = useRef({});
  const edgeDataRef = useRef([]);
  const frameRef = useRef(0);
  const hoverRef = useRef(null);
  const dragNodeRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const selectedNodeRef = useRef(selectedNode);
  selectedNodeRef.current = selectedNode;
  const [cursor, setCursor] = useState('default');

  const W = maxW;
  const rounds = session?.rounds || [];
  const insights = session?.insights || [];
  const H = Math.max(300, BASE_H + rounds.length * ROUND_H + insights.filter(i => i.type).length * 8);

  // ★ 推演过程中 rounds/insights 增长时，同步 Canvas bitmap 尺寸，防止 CSS height
  //    被 React 更新但 bitmap 没跟上 → 浏览器拉伸导致字体变形
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
  }, [H]);

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
    // ★ 同时设置 CSS 尺寸，防止 Canvas bitmap 与 CSS 尺寸不匹配导致文字变形
    canvas.style.width = W + 'px';
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

    // ─── 布局：上半区=推演脉络文字卡片，下半区=图谱关系（所有节点+连线）───
    const ROUND_START_Y = 85;
    const ROUND_GAP = 130; // 纯文字卡片高度

    // 图谱关系区域（力导向 2D 布局，节点可在区域内自由游走）
    const GRAPH_LABEL_Y = ROUND_START_Y + rounds.length * ROUND_GAP + 40;
    const GRAPH_CARD_TOP = GRAPH_LABEL_Y - 6;
    const GRAPH_CARD_H = 240; // ★ 加高，给 2D 布局足够空间
    const GRAPH_AREA_TOP = GRAPH_CARD_TOP + 30;
    const GRAPH_AREA_H = GRAPH_CARD_H - 40;
    const GRAPH_AREA_W = W - 40;

    // 所有节点（包括用户）散布在 2D 区域内（圆形分布，避免重叠）
    const sortedAgents = [...agentIds].sort();
    const allNodeIds = ['user', ...sortedAgents];
    const cx = 20 + GRAPH_AREA_W / 2;
    const cy = GRAPH_AREA_TOP + GRAPH_AREA_H / 2;
    const radius = Math.min(GRAPH_AREA_W, GRAPH_AREA_H) * 0.35;

    const targets = {};
    allNodeIds.forEach((id, ci) => {
      const angle = (ci / allNodeIds.length) * Math.PI * 2 - Math.PI / 2;
      targets[id] = {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        pinned: false, // ★ 全部不固定，可自由移动
        bornDelay: ci * 180,
      };
    });

    // 初始化 / 更新物理位置
    const posMap = {};
    Object.entries(targets).forEach(([id, t]) => {
      if (!posRef.current[id]) {
        posRef.current[id] = {
          x: t.pinned ? t.x : W / 2 + (Math.random() - 0.5) * 200,
          y: t.pinned ? t.y : H - 30 - Math.random() * 40,
          vx: 0, vy: 0, pinned: t.pinned,
          targetX: t.x, targetY: t.y,
          scale: 0, targetScale: 1,
          bornAt: Date.now() + (t.bornDelay || 0), // ★ 按轮次延迟出生
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
          (ins.text || '').slice(0, 16)
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

      // ── 力导向（常驻运行，模拟 Obsidian 知识图谱的动态游走）──
      const ids = Object.keys(posMap);
      const dragNode = getDragNode();
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = posMap[ids[i]], b = posMap[ids[j]];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          const rep = 2200 / (dist * dist); // ★ 增强排斥力，让节点散开
          if (!a.pinned && a !== dragNode) { a.vx += (dx / dist) * rep * 0.12; a.vy += (dy / dist) * rep * 0.12; }
          if (!b.pinned && b !== dragNode) { b.vx -= (dx / dist) * rep * 0.12; b.vy -= (dy / dist) * rep * 0.12; }
        }
      }

      // 连线引力（连接的节点互相吸引，形成聚类）
      edgeDataRef.current.forEach(e => {
        const fp = posMap[e.from], tp = posMap[e.to];
        if (!fp || !tp) return;
        const dx = tp.x - fp.x, dy = tp.y - fp.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        const targetLen = 120; // 期望连线长度
        const force = (dist - targetLen) * 0.008;
        const fx = (dx / dist) * force, fy = (dy / dist) * force;
        if (!fp.pinned && fp !== dragNode) { fp.vx += fx; fp.vy += fy; }
        if (!tp.pinned && tp !== dragNode) { tp.vx -= fx; tp.vy -= fy; }
      });

      ids.forEach(id => {
        const n = posMap[id];
        if (n.pinned || n === dragNode) return;
        // 中心引力（防止节点飞出卡片）
        n.vx += (cx - n.x) * 0.002;
        n.vy += (cy - n.y) * 0.002;
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;
        // 约束在卡片区域内
        const pad = 18;
        n.x = Math.max(20 + pad, Math.min(20 + GRAPH_AREA_W - pad, n.x));
        n.y = Math.max(GRAPH_AREA_TOP + pad, Math.min(GRAPH_AREA_TOP + GRAPH_AREA_H - pad, n.y));
      });

      // ── 缩放：新节点用 easeOutBack 弹性出生动画（0→1.15→1.0）──
      const nowScale = Date.now();
      ids.forEach(id => {
        const n = posMap[id];
        if (n.bornAt) {
          const dt = (nowScale - n.bornAt) / 600; // 600ms 出生动画
          if (dt >= 1) {
            n.scale = 1;
            n.bornAt = null;
          } else {
            n.scale = Math.max(0, easeOutBack(Math.max(0, dt)));
          }
        } else {
          n.scale += (n.targetScale - n.scale) * 0.15;
        }
      });

      // ── 各轮次的区域卡片 ──
      rounds.forEach((r, ri) => {
        const rTop = ROUND_START_Y + ri * ROUND_GAP;
        const rH = 106; // 纯文字卡片，紧凑

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
          const goal = r.goal.length > 32 ? r.goal.slice(0, 32) + '…' : r.goal;
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

      // ── 图谱关系卡片（独立区域，只含节点和连线，不和文字重叠）──
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.strokeStyle = 'rgba(200,180,255,0.15)';
      ctx.lineWidth = 1.2;
      roundRect(ctx, 12, GRAPH_CARD_TOP, W - 24, GRAPH_CARD_H, 10);
      ctx.fill();
      ctx.stroke();

      // 卡片标题
      ctx.fillStyle = '#aab';
      ctx.font = 'bold 11px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📊 图谱关系', W / 2, GRAPH_LABEL_Y + 8);
      ctx.textAlign = 'start';

      // 分隔线
      ctx.strokeStyle = 'rgba(255,215,0,0.08)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(22, GRAPH_LABEL_Y + 16);
      ctx.lineTo(W - 22, GRAPH_LABEL_Y + 16);
      ctx.stroke();

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

        // 流动粒子（所有连线都有，connection 类型更淡更小）
        if (grow > 0.3) {
          const isConn = e.type === 'connection';
          const particleT = ((frame * (isConn ? 0.02 : 0.03)) % 1 + 0.5) % 1;
          const px = fp.x + dx * particleT;
          const py = fp.y + dy * particleT;
          const pGrow = grow < 1 ? Math.min(particleT, grow) : particleT;
          if (pGrow < grow && pGrow > 0) {
            ctx.globalAlpha = isConn ? 0.5 : 1;
            const pr = isConn ? 1.3 : 2;
            ctx.fillStyle = edgeColor;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fill();
            // 光晕
            ctx.globalAlpha = isConn ? 0.25 : 0.5;
            ctx.beginPath();
            ctx.arc(px, py, pr * 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
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
        const isHover = hoverRef.current === id;
        const isSelected = selectedNodeRef.current === id;
        const popScale = isHover ? 1.25 : (isSelected ? 1.15 : 1);
        const r = baseR * (p.scale || 1) * popScale;

        // 出生光环（bornAt 期间向外扩散）
        if (p.bornAt) {
          const ringT = Math.min((Date.now() - p.bornAt) / 800, 1);
          const ringR = baseR + ringT * 22;
          ctx.strokeStyle = withAlpha(color, (1 - ringT) * 0.8);
          ctx.lineWidth = 2 * (1 - ringT);
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, ringR), 0, Math.PI * 2);
          ctx.stroke();
        }

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
        ctx.strokeStyle = isUser ? COL.user : withAlpha(color, 0.4);
        ctx.lineWidth = isUser ? 2.5 : 1.5;
        ctx.stroke();

        // hover / selected 高亮外圈
        if (isHover || isSelected) {
          ctx.strokeStyle = isSelected ? COL.titleGold : '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

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
        const insY = GRAPH_CARD_TOP + GRAPH_CARD_H + 20;
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
          ctx.fillText(insText.length > 32 ? insText.slice(0, 32) + '…' : insText, 34, iy);
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

    // ─── 命中检测 + 事件绑定 ───
    // 用于 tick 闭包引用当前拖动节点（提前定义，确保 hoisting 安全）
    const getDragNode = () => dragNodeRef.current;

    function hitTest(mx, my) {
      const hitIds = Object.keys(posMap);
      for (let i = hitIds.length - 1; i >= 0; i--) {
        const id = hitIds[i];
        const p = posMap[id];
        const isUser = id === 'user';
        const baseR = isUser ? 12 : 8;
        const r = baseR * (p.scale || 1);
        const dx = mx - p.x, dy = my - p.y;
        if (dx * dx + dy * dy <= (r + 5) * (r + 5)) return id;
      }
      return null;
    }
    function handleClick(e) {
      // ★ 如果刚刚是拖动结束，不触发 click 选择
      if (dragNodeRef.current) { dragNodeRef.current = null; return; }
      const rect = canvas.getBoundingClientRect();
      const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (hit && onSelectNode) onSelectNode(hit);
    }
    function handleDown(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const hit = hitTest(mx, my);
      if (hit) {
        const p = posMap[hit];
        if (p) {
          dragNodeRef.current = p;
          dragOffsetRef.current = { x: mx - p.x, y: my - p.y };
          setCursor('grabbing');
        }
      }
    }
    function handleMove(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      if (dragNodeRef.current) {
        // ★ 拖动节点
        dragNodeRef.current.x = mx - dragOffsetRef.current.x;
        dragNodeRef.current.y = my - dragOffsetRef.current.y;
        dragNodeRef.current.vx = 0;
        dragNodeRef.current.vy = 0;
      } else {
        const hit = hitTest(mx, my);
        hoverRef.current = hit;
        setCursor(hit ? 'grab' : 'default');
      }
    }
    function handleUp() {
      if (dragNodeRef.current) {
        setCursor('grab');
        // 延迟清除，让 handleClick 知道刚拖动过
        setTimeout(() => { dragNodeRef.current = null; }, 50);
      }
    }
    function handleLeave() {
      hoverRef.current = null;
      dragNodeRef.current = null;
      setCursor('default');
    }
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleUp);
    canvas.addEventListener('mouseleave', handleLeave);

    // 用于 tick 闭包引用当前拖动节点
    // （已提前在命中检测区定义）

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleUp);
      canvas.removeEventListener('mouseleave', handleLeave);
      edgeDataRef.current = [];
    };
  // ★ 响应 rounds/insights 增长：initDeliberation 后 addDeliberationRounds 才填充
  //   rounds，必须重跑 effect 让 tick 闭包拿到最新布局与边数据
  }, [session?.id, session?.rounds?.length, session?.insights?.length]);

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
        style={{ width: W, height: H, display: 'block', cursor }}
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
