/**
 * CausalTrace — 因果回溯引擎
 * 纯计算模块（无 LLM 调用）：基于已生成的 selves/letters/crossReviews/matrix，
 * 反向追溯每个锚点判断的因果链："为什么这个时间点给出这个判断"
 */

/**
 * 对单个锚点做因果回溯
 * @returns {{ decision, endorsement: Array<{self, letterExcerpt, evidence}>, dissent: Array<{self, letterExcerpt, evidence}>, verdictReasoning, crossComments: Array }}
 */
export function traceAnchor(anchor, selves, letters, crossReviews = []) {
  // 赞同者的因果链
  const endorsement = (anchor.endorsers || []).map(selfId => {
    const self = selves.find(s => s.id === selfId);
    const letter = letters.find(l => l.from === selfId);
    return {
      self: self || { id: selfId, label: selfId },
      stance: self?.stance || '未知',
      evidence: buildEvidence(self, letter),
      letterExcerpt: letter?.content?.slice(0, 120) || '',
      mindset: self?.mindset || '',
    };
  });

  // 反对者的因果链
  const dissent = (anchor.dissenters || []).map(selfId => {
    const self = selves.find(s => s.id === selfId);
    const letter = letters.find(l => l.from === selfId);
    return {
      self: self || { id: selfId, label: selfId },
      stance: self?.stance || '未知',
      evidence: buildEvidence(self, letter),
      letterExcerpt: letter?.content?.slice(0, 120) || '',
      mindset: self?.mindset || '',
    };
  });

  // 相关的跨时间互评
  const crossComments = crossReviews.filter(r => {
    const related = [anchor.endorsers, anchor.dissenters].flat();
    return related.includes(r.from) || related.includes(r.to);
  }).map(r => {
    const fromSelf = selves.find(s => s.id === r.from);
    const toSelf = selves.find(s => s.id === r.to);
    return {
      from: fromSelf?.label || r.fromLabel,
      to: toSelf?.label || r.toLabel,
      agreement: r.agreement,
      text: r.comment?.slice(0, 100) || '',
    };
  });

  return {
    decision: anchor.decision,
    verdict: anchor.verdict,
    reasoning: anchor.reasoning,
    confidence: anchor.confidence,
    endorsement,
    dissent,
    crossComments,
    summary: buildCausalSummary(anchor, endorsement, dissent),
  };
}

/**
 * 批量回溯所有锚点
 */
export function traceAllAnchors(matrix, selves, letters, crossReviews) {
  if (!matrix?.anchors) return [];
  return matrix.anchors.map(a => traceAnchor(a, selves, letters, crossReviews));
}

// 构建单个自我对判断的证据
function buildEvidence(self, letter) {
  const items = [];
  if (self?.keyEvents?.length) {
    items.push(`关键经历：${self.keyEvents.join(' → ')}`);
  }
  if (self?.mood) {
    items.push(`心境：${self.mood}`);
  }
  if (self?.tone) {
    items.push(`语气：${self.tone}`);
  }
  if (letter?.sentiment) {
    items.push(`对决策的态度：${letter.sentiment}`);
  }
  return items;
}

// 生成锚点的因果总结
function buildCausalSummary(anchor, endorsement, dissent) {
  const parts = [];
  const total = endorsement.length + dissent.length;

  if (endorsement.length > 0) {
    const names = endorsement.map(e => e.self?.label?.replace('后的我', '') || '');
    const events = endorsement.flatMap(e => e.self?.keyEvents || []);
    parts.push(`${names.join('·')} 支持${anchor.decision}（经历了"${events.slice(0, 2).join('，')}"等事件）`);
  }
  if (dissent.length > 0) {
    const names = dissent.map(e => e.self?.label?.replace('后的我', '') || '');
    const events = dissent.flatMap(e => e.self?.keyEvents || []);
    parts.push(`${names.join('·')} 反对（经历了"${events.slice(0, 2).join('，')}"等不同事件）`);
  }
  if (total > 0) {
    // 计算共识度
    const consensus = endorsement.length - dissent.length;
    if (consensus > 0) parts.push(`共识度 +${consensus}（近端时间点更多支持）`);
    else if (consensus < 0) parts.push(`共识度 ${consensus}（远端时间点更多反对）`);
    else parts.push('支持与反对持平，意见分化');
  }
  return parts.join('；');
}

/**
 * 对比两个锚点的因果链差异（用于分叉对比场景）
 */
export function compareAnchorTraces(traceA, traceB) {
  if (!traceA || !traceB) return null;
  return {
    decision: traceA.decision,
    verdictA: traceA.verdict,
    verdictB: traceB.verdict,
    keyDifferences: {
      endorsementA: traceA.endorsement.map(e => e.self?.label),
      endorsementB: traceB.endorsement.map(e => e.self?.label),
      dissentA: traceA.dissent.map(e => e.self?.label),
      dissentB: traceB.dissent.map(e => e.self?.label),
    },
    summary: `A路径「${traceA.verdict}」— ${traceA.endorsement.length}支持/${traceA.dissent.length}反对；B路径「${traceB.verdict}」— ${traceB.endorsement.length}支持/${traceB.dissent.length}反对`,
  };
}
