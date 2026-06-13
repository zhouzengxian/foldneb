/**
 * reportImage.js — 推演报告精美分享图片生成器
 * 使用 Canvas 2D 渲染，导出为 PNG 下载
 */

const CARD_W = 800;
const CARD_H = 1280;
const PADDING = 48;
const INNER_W = CARD_W - PADDING * 2;

const COLORS = {
  bg: '#0a0a1a',
  bgGradTop: '#0d0d2b',
  bgGradBot: '#060612',
  gold: '#FFD700',
  goldLight: '#FFE55C',
  goldDark: '#B8960F',
  text: '#e8e0d0',
  textDim: '#8899aa',
  textMuted: '#556677',
  accent: '#8899cc',
  accentDim: '#445577',
  insight: '#44AAFF',
  advice: '#44DD88',
  finding: '#FFD700',
  reframe: '#DDA0DD',
  divider: 'rgba(255,215,0,0.15)',
  cardBg: 'rgba(255,255,255,0.03)',
};

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  const paragraphs = text.split('\n');
  for (const para of paragraphs) {
    if (para.length === 0) { lines.push(''); continue; }
    let line = '';
    for (const char of para) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
        lines.push(line);
        line = char;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawStar(ctx, cx, cy, outerR, innerR, points, color, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * 生成推演报告分享图片
 * @param {Object} report - 推演报告数据 { problem, domain, report: { reframedProblem, coreFinding, keyInsights, actionableAdvice }, agents, createdAt }
 * @returns {Promise<Blob>} PNG Blob
 */
export async function generateReportImage(report) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');

  const rpt = report.report || {};
  const keyInsights = rpt.keyInsights || [];
  const dateStr = new Date(report.archivedAt || report.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const agentNames = (report.agents || []).map(a => a.name || a.id).join(' · ');

  // ===== 1. 背景 =====
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bgGrad.addColorStop(0, COLORS.bgGradTop);
  bgGrad.addColorStop(0.5, COLORS.bg);
  bgGrad.addColorStop(1, COLORS.bgGradBot);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // 星空粒子背景
  for (let i = 0; i < 80; i++) {
    const sx = Math.random() * CARD_W;
    const sy = Math.random() * CARD_H;
    const sr = Math.random() * 1.2;
    ctx.fillStyle = `rgba(136,153,204,${0.1 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 底部渐变光晕
  const bottomGlow = ctx.createRadialGradient(CARD_W / 2, CARD_H - 100, 50, CARD_W / 2, CARD_H, 400);
  bottomGlow.addColorStop(0, 'rgba(255,215,0,0.08)');
  bottomGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = bottomGlow;
  ctx.fillRect(0, CARD_H * 0.6, CARD_W, CARD_H * 0.4);

  // 顶部装饰光晕
  const topGlow = ctx.createRadialGradient(CARD_W / 2, 120, 30, CARD_W / 2, 200, 300);
  topGlow.addColorStop(0, 'rgba(136,153,204,0.1)');
  topGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, CARD_W, 300);

  // ===== 2. 顶部标题区 =====
  // 小星星装饰
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, CARD_W / 2 - 180 + i * 90, 50, 6, 2, 5, COLORS.gold, 0.15 + i * 0.05);
  }

  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 22px "Noto Serif SC", "PingFang SC", "Microsoft YaHei", serif';
  ctx.textAlign = 'center';
  ctx.fillText('FoldNeb 折叠星云', CARD_W / 2, 92);

  ctx.fillStyle = COLORS.accentDim;
  ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('决策推演报告', CARD_W / 2, 114);

  // 日期标签
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '11px "PingFang SC", sans-serif';
  ctx.fillText(dateStr, CARD_W / 2, 136);

  // 标题分隔线 - 双线
  const sepY = 158;
  ctx.strokeStyle = COLORS.divider;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(PADDING + 40, sepY);
  ctx.lineTo(CARD_W - PADDING - 40, sepY);
  ctx.stroke();

  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 1;
  const sepLen = 80;
  ctx.beginPath();
  ctx.moveTo(CARD_W / 2 - sepLen, sepY + 3);
  ctx.lineTo(CARD_W / 2 + sepLen, sepY + 3);
  ctx.stroke();

  let y = 180;

  // ===== 3. 问题卡片 =====
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '11px "PingFang SC", sans-serif';
  ctx.fillText('🔍 推演问题', PADDING, y);
  y += 18;

  // 背景卡片
  const problemLines = wrapText(ctx, report.problem || '', INNER_W - 40);
  const problemCardH = problemLines.length * 22 + 30;
  drawRoundedRect(ctx, PADDING, y, INNER_W, problemCardH, 10);
  ctx.fillStyle = 'rgba(255,215,0,0.04)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,0,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = COLORS.text;
  ctx.font = '15px "PingFang SC", "Microsoft YaHei", sans-serif';
  problemLines.forEach((line, i) => {
    const fx = PADDING + 20;
    const fy = y + 24 + i * 22;
    // 简化：如果 line 太长则截断
    const displayLine = line.length > 60 ? line.slice(0, 60) + '…' : line;
    ctx.fillText(displayLine, fx, fy);
  });
  y += problemCardH + 8;

  // 领域标签
  if (report.domain) {
    const domainTag = report.domain;
    const tw = ctx.measureText(domainTag).width + 24;
    drawRoundedRect(ctx, PADDING + 12, y, tw, 22, 11);
    ctx.fillStyle = 'rgba(255,215,0,0.1)';
    ctx.fill();
    ctx.fillStyle = COLORS.gold;
    ctx.font = '11px "PingFang SC", sans-serif';
    ctx.fillText(domainTag, PADDING + 24, y + 15);
  }

  // Agent 列表
  if (agentNames) {
    const agentsX = PADDING + 12 + (report.domain ? ctx.measureText(report.domain).width + 40 : 0);
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '10px "PingFang SC", sans-serif';
    const displayNames = agentNames.length > 50 ? agentNames.slice(0, 50) + '…' : agentNames;
    ctx.fillText('思想者：' + displayNames, agentsX, y + 15);
  }
  y += 36;

  // ===== 4. 核心内容区 =====
  // 重新框定
  if (rpt.reframedProblem) {
    ctx.fillStyle = COLORS.reframe;
    ctx.font = 'bold 13px "PingFang SC", sans-serif';
    ctx.fillText('🔄 重新框定', PADDING, y);
    y += 20;

    const reframeLines = wrapText(ctx, rpt.reframedProblem, INNER_W - 40);
    const reframeH = reframeLines.length * 20 + 24;
    drawRoundedRect(ctx, PADDING, y, INNER_W, reframeH, 8);
    ctx.fillStyle = 'rgba(221,160,221,0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(221,160,221,0.15)';
    ctx.stroke();

    ctx.fillStyle = '#d8d0e8';
    ctx.font = '13px "PingFang SC", sans-serif';
    reframeLines.forEach((line, i) => {
      ctx.fillText(line, PADDING + 16, y + 20 + i * 20);
    });
    y += reframeH + 20;
  }

  // 核心发现
  if (rpt.coreFinding) {
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 13px "PingFang SC", sans-serif';
    ctx.fillText('💡 核心发现', PADDING, y);
    y += 20;

    const findingLines = wrapText(ctx, rpt.coreFinding, INNER_W - 40);
    const findH = findingLines.length * 20 + 24;
    drawRoundedRect(ctx, PADDING, y, INNER_W, findH, 8);
    ctx.fillStyle = 'rgba(255,215,0,0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 左边金色竖线
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(PADDING + 4, y + 6);
    ctx.lineTo(PADDING + 4, y + findH - 6);
    ctx.stroke();

    ctx.fillStyle = COLORS.text;
    ctx.font = '14px "PingFang SC", sans-serif';
    findingLines.forEach((line, i) => {
      ctx.fillText(line, PADDING + 20, y + 20 + i * 20);
    });
    y += findH + 20;
  }

  // 关键洞察
  if (keyInsights.length > 0) {
    ctx.fillStyle = COLORS.insight;
    ctx.font = 'bold 13px "PingFang SC", sans-serif';
    ctx.fillText('🔑 关键洞察', PADDING, y);
    y += 22;

    for (let i = 0; i < keyInsights.length; i++) {
      const ins = keyInsights[i];
      const insLines = wrapText(ctx, ins, INNER_W - 60);
      const insH = insLines.length * 19 + 20;

      // 检查是否超出卡片高度
      if (y + insH > CARD_H - 200) break;

      drawRoundedRect(ctx, PADDING + 8, y, INNER_W - 16, insH, 6);
      ctx.fillStyle = 'rgba(68,170,255,0.04)';
      ctx.fill();

      ctx.fillStyle = COLORS.insight;
      ctx.font = '10px "PingFang SC", sans-serif';
      ctx.fillText(`0${i + 1}`, PADDING + 18, y + 17);

      ctx.fillStyle = '#cce';
      ctx.font = '12px "PingFang SC", sans-serif';
      insLines.forEach((line, li) => {
        ctx.fillText(line, PADDING + 42, y + 17 + li * 19);
      });
      y += insH + 8;
    }
    y += 12;
  }

  // 行动建议
  if (rpt.actionableAdvice) {
    ctx.fillStyle = COLORS.advice;
    ctx.font = 'bold 13px "PingFang SC", sans-serif';
    ctx.fillText('🎯 行动建议', PADDING, y);
    y += 20;

    const adviceLines = wrapText(ctx, rpt.actionableAdvice, INNER_W - 40);
    const adviceH = adviceLines.length * 20 + 24;

    drawRoundedRect(ctx, PADDING, y, INNER_W, adviceH, 8);
    ctx.fillStyle = 'rgba(68,221,136,0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(68,221,136,0.2)';
    ctx.stroke();

    ctx.fillStyle = '#c8f0d8';
    ctx.font = '13px "PingFang SC", sans-serif';
    adviceLines.forEach((line, i) => {
      ctx.fillText(line, PADDING + 16, y + 20 + i * 20);
    });
    y += adviceH + 20;
  }

  // ===== 5. 底部 Footer =====
  const footerY = CARD_H - 80;
  ctx.strokeStyle = COLORS.divider;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(PADDING + 60, footerY);
  ctx.lineTo(CARD_W - PADDING - 60, footerY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '11px "PingFang SC", sans-serif';
  ctx.fillText('由 FoldNeb 折叠星云生成', CARD_W / 2, footerY + 22);
  ctx.fillText('让每一次思考，都不白费', CARD_W / 2, footerY + 40);

  // 底部小星
  drawStar(ctx, CARD_W / 2, footerY - 8, 8, 3, 5, COLORS.gold, 0.4);

  // ===== 6. 导出 =====
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png', 1.0);
  });
}

/**
 * 下载图片
 */
export function downloadReportImage(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `FoldNeb-推演报告-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
