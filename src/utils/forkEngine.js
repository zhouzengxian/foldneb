/**
 * ForkEngine — 分叉对比引擎
 * 对多条替代决策路径分别跑时间折叠，对比各路径的终局评分
 * 90% 复用 temporalEngine（generateFutureSelves / writeLetterToPast / buildAnchorMatrix）
 */
import {
  generateFutureSelves, writeLetterToPast, buildAnchorMatrix,
  getFallbackSelves, getFallbackLetter, getFallbackCrossReview, getFallbackMatrix,
} from './temporalEngine';

/** 对一条替代路径跑完整时间折叠 */
export async function exploreFork(altLabel, baseProfile) {
  const profile = { ...baseProfile, keyDecision: altLabel };
  const selves = await generateFutureSelves(profile);
  const letters = [];
  for (const self of selves) {
    letters.push(await writeLetterToPast(self, profile));
  }
  const matrix = await buildAnchorMatrix(letters, [], profile);
  return { label: altLabel, selves, letters, matrix };
}

/**
 * 批量对比多条路径
 * @returns {Array<{ label, matrix, score, rank, selves, letters }>}
 */
export async function compareForks(baseProfile, alternatives) {
  const results = await Promise.all(
    alternatives.map(alt => exploreFork(alt, baseProfile))
  );
  // 计算每条路径的终局评分
  const scored = results.map(r => ({
    ...r,
    score: computeTimelineScore(r.matrix),
  }));
  // 按评分降序排列
  scored.sort((a, b) => b.score - a.score);
  scored.forEach((r, i) => { r.rank = i + 1; });
  return scored;
}

/** 基于锚点矩阵计算终局评分（0-100 归一化） */
export function computeTimelineScore(matrix) {
  if (!matrix?.anchors?.length) return 40; // 默认中间

  let total = 0;
  matrix.anchors.forEach(a => {
    const c = a.confidence || 0.5;
    switch (a.verdict) {
      case 'do':       total += 90 * c + 20; break;  // 该做 = 正面
      case 'longterm': total += 70 * c + 10; break;  // 长期主义 = 偏正面
      case 'beware':   total += 40 * c;      break;  // 警惕 = 中性偏低
      case 'avoid':    total += 10 * c - 10; break;  // 该避开 = 负面
    }
    // 一致性强（多时间点同意）加分
    const consensus = a.endorsers.length - a.dissenters.length;
    total += Math.min(consensus * 5, 15);
  });

  return Math.max(0, Math.min(100, Math.round(total / matrix.anchors.length)));
}

/**
 * 对比报告：提炼关键差异
 * @returns {{ summary: string, rankings: Array, topPath: object, gaps: Array }}
 */
export function generateCompareReport(scored) {
  if (scored.length < 2) return { summary: '需要至少 2 条路径对比', rankings: scored };
  const best = scored[0];
  const worst = scored[scored.length - 1];

  // 找出最佳路径的独特优势
  const bestDoCount = best.matrix?.anchors?.filter(a => a.verdict === 'do' || a.verdict === 'longterm').length || 0;
  const worstAvoidCount = worst.matrix?.anchors?.filter(a => a.verdict === 'avoid').length || 0;

  const summary = `最佳路径「${best.label}」终局评分 ${best.score}，${bestDoCount} 个正向锚点；最差路径「${worst.label}」${worst.score}，${worstAvoidCount} 个应避开的判断。差距来源于${scored.length > 2 ? '对风险的跨时间评估' : '对长期价值 vs 短期代价的不同共识'}。`;

  // 横向对比矩阵（每个锚点在各路径上的表现差异）
  const gaps = [];
  if (best.matrix?.anchors) {
    best.matrix.anchors.forEach((ba, i) => {
      const worstA = worst.matrix?.anchors?.[i];
      if (worstA && ba.verdict !== worstA.verdict) {
        gaps.push({
          decision: ba.decision,
          bestVerdict: ba.verdict,
          worstVerdict: worstA.verdict,
        });
      }
    });
  }

  return { summary, rankings: scored, gaps };
}

// ====== Demo 模式：用 fallback 数据模拟分叉对比 ======
// 每条路径随机微调人格态度，产生有差异的评分配置
const DEMO_STANCE_POOL = [['支持', '反对'], ['支持', '看淡'], ['反对', '重新框定'], ['支持', '看淡', '重新框定']];

/** Demo 版分叉对比：使用 fallback 引擎 + 每条路径随机化人格态度 */
export async function demoCompareForks(baseProfile, alternatives) {
  const forks = alternatives.map((alt) => {
    // 每条路径用不同的人格态度分配（随机 shuffle），产生评分差异
    const stancePool = DEMO_STANCE_POOL[Math.floor(Math.random() * DEMO_STANCE_POOL.length)];
    const selves = getFallbackSelves({ ...baseProfile, keyDecision: alt }).map((s, i) => ({
      ...s,
      stance: stancePool[i % stancePool.length] || s.stance,
      _demo: true,
    }));
    const letters = selves.map(self => getFallbackLetter(self, { ...baseProfile, keyDecision: alt }));
    const crossReviews = [
      getFallbackCrossReview(selves[0], selves[3]),
      getFallbackCrossReview(selves[3], selves[0]),
      getFallbackCrossReview(selves[1], selves[2]),
    ];
    const matrix = getFallbackMatrix(letters);
    const score = computeTimelineScore({ ...matrix, _demo: true });
    return { label: alt, selves, letters, crossReviews, matrix, score, _demo: true };
  });

  forks.sort((a, b) => b.score - a.score);
  forks.forEach((f, i) => { f.rank = i + 1; });
  return forks;
}

/** Demo 版对比报告 */
export function demoGenerateCompareReport(scored) {
  const report = generateCompareReport(scored);
  report._demo = true;
  return report;
}
