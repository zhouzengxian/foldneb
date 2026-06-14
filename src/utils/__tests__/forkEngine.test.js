import { describe, it, expect } from 'vitest';
import {
  computeTimelineScore,
  generateCompareReport,
} from '../forkEngine.js';

// 构造一个 anchor：verdict / confidence / 共识度可控
function makeAnchor(verdict, confidence = 0.8, endorsers = 2, dissenters = 0) {
  return { verdict, confidence, endorsers: new Array(endorsers), dissenters: new Array(dissenters), decision: '测试决策' };
}
function makeMatrix(anchors) { return { anchors }; }

describe('forkEngine.computeTimelineScore —— 多路径终局评分（0-100）', () => {
  it('空 matrix 应返回中性默认分 40', () => {
    expect(computeTimelineScore(null)).toBe(40);
    expect(computeTimelineScore({})).toBe(40);
    expect(computeTimelineScore({ anchors: [] })).toBe(40);
  });

  it('全是正向 do verdict 应得高分', () => {
    const m = makeMatrix([makeAnchor('do', 0.9, 4, 0), makeAnchor('do', 0.8, 3, 0)]);
    const score = computeTimelineScore(m);
    expect(score).toBeGreaterThan(80);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('全是 avoid verdict 应得低分', () => {
    const m = makeMatrix([makeAnchor('avoid', 0.9, 0, 4), makeAnchor('avoid', 0.8, 0, 3)]);
    const score = computeTimelineScore(m);
    expect(score).toBeLessThan(20);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('评分应被归一化到 [0, 100] 区间', () => {
    // 极端：极高 confidence + 极多 endorsers
    const m = makeMatrix([makeAnchor('do', 1, 100, 0)]);
    expect(computeTimelineScore(m)).toBeLessThanOrEqual(100);
    // 极端：极多 dissenters + avoid
    const m2 = makeMatrix([makeAnchor('avoid', 1, 0, 100)]);
    expect(computeTimelineScore(m2)).toBeGreaterThanOrEqual(0);
  });

  it('do 评分应高于 longterm，longterm 高于 beware，beware 高于 avoid', () => {
    const doScore = computeTimelineScore(makeMatrix([makeAnchor('do', 0.5, 0, 0)]));
    const ltScore = computeTimelineScore(makeMatrix([makeAnchor('longterm', 0.5, 0, 0)]));
    const bwScore = computeTimelineScore(makeMatrix([makeAnchor('beware', 0.5, 0, 0)]));
    const avScore = computeTimelineScore(makeMatrix([makeAnchor('avoid', 0.5, 0, 0)]));
    expect(doScore).toBeGreaterThan(ltScore);
    expect(ltScore).toBeGreaterThan(bwScore);
    expect(bwScore).toBeGreaterThan(avScore);
  });
});

describe('forkEngine.generateCompareReport —— 多路径差异报告', () => {
  it('路径数 < 2 时应返回提示性 summary', () => {
    const r = generateCompareReport([]);
    expect(r.summary).toContain('至少 2 条');
    expect(r.rankings).toEqual([]);

    const r2 = generateCompareReport([{ label: 'A', score: 80, matrix: makeMatrix([]) }]);
    expect(r2.summary).toContain('至少 2 条');
  });

  it('应按 score 降序找出 best 与 worst', () => {
    const scored = [
      { label: '路径A', score: 80, matrix: makeMatrix([makeAnchor('do')]) },
      { label: '路径B', score: 30, matrix: makeMatrix([makeAnchor('avoid')]) },
    ];
    const r = generateCompareReport(scored);
    expect(r.summary).toContain('路径A');
    expect(r.summary).toContain('80');
    expect(r.summary).toContain('路径B');
    expect(r.summary).toContain('30');
  });

  it('应能识别 best 与 worst 在同一锚点上的 verdict 差异，输出 gaps', () => {
    const scored = [
      {
        label: 'best', score: 85,
        matrix: makeMatrix([makeAnchor('do'), makeAnchor('longterm')]),
      },
      {
        label: 'worst', score: 25,
        matrix: makeMatrix([makeAnchor('avoid'), makeAnchor('longterm')]),
      },
    ];
    const r = generateCompareReport(scored);
    expect(r.gaps).toHaveLength(1); // 只有第 1 个锚点 do vs avoid 不同
    expect(r.gaps[0].bestVerdict).toBe('do');
    expect(r.gaps[0].worstVerdict).toBe('avoid');
  });
});
