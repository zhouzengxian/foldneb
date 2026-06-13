/**
 * TemporalEngine — 时间折叠引擎（纵向时间轴推演）
 * 同一个「我」在 1年/3年/5年/10年后回看现在的决策
 * 流程：profile → generateFutureSelves → writeLetterToPast → crossTimelineReview → buildAnchorMatrix
 */
import { callLLMWithProvider, DEFAULT_PROVIDER_ID, LLMUnavailableError, getApiErrorMessage } from './modelConfig';
import { getDeliberationProvider } from './deliberationEngine';

let currentProviderId = getDeliberationProvider() || DEFAULT_PROVIDER_ID;
export const setTemporalProvider = (id) => { currentProviderId = id || DEFAULT_PROVIDER_ID; };
export const getTemporalProvider = () => currentProviderId;

async function callLLM(systemPrompt, userPrompt, temperature = 0.7) {
  return callLLMWithProvider(currentProviderId, systemPrompt, userPrompt, {
    temperature, maxTokens: 1000, timeoutMs: 30000,
  });
}

function cleanJSON(raw) {
  if (!raw) return null;
  let t = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // 先尝试直接 parse（最干净的情况）
  try { return JSON.parse(t); } catch {}

  // 找最外层结构：看 { 和 [ 哪个先出现 → 提取最外层
  const firstBrace = t.indexOf('{'), lastBrace = t.lastIndexOf('}');
  const firstBracket = t.indexOf('['), lastBracket = t.lastIndexOf(']');

  const isObjectFirst = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket);
  if (isObjectFirst && lastBrace !== -1) {
    t = t.substring(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1 && lastBracket !== -1) {
    t = t.substring(firstBracket, lastBracket + 1);
  }

  // 清理常见 JSON 语法错误：末尾多余逗号
  t = t.replace(/,(\s*[}\]])/g, '$1').replace(/,\s*$/g, '');
  try { return JSON.parse(t); } catch { return null; }
}

export const HORIZONS = [
  { id: 'self_1year', label: '1年后的我', years: 1, color: '#FF8C42',
    seed: '仍在挣扎、焦虑但兴奋；刚经历挫折，对选择充满不确定，隐约看到方向。语气急切、带近期痛感。' },
  { id: 'self_3year', label: '3年后的我', years: 3, color: '#4488FF',
    seed: '目标部分达成，带着成就感也看清了代价。语气自信但略疲惫，会指出当初低估的东西。' },
  { id: 'self_5year', label: '5年后的我', years: 5, color: '#8866CC',
    seed: '走过弯路后的反思者；更成熟，放下某些执念。语气平静、有距离感，提醒当初太当回事的事。' },
  { id: 'self_10year', label: '10年后的我', years: 10, color: '#FFD700',
    seed: '终局视角；看淡当下焦虑，关注真正重要的东西。语气宽容通透，像长者对年轻的自己说话。' },
];

// 一、生成未来的自我（一次调用产出 4 个人格快照）
export async function generateFutureSelves(profile) {
  const system = `你是「时间折叠」引擎。基于一个人当前的处境档案，推演出 TA 在 1年/3年/5年/10年后的人格状态。
输出 JSON 数组，恰好 4 个元素：
[{"id":"self_1year","label":"1年后的我","years":1,"mood":"心境(20字内)","keyEvents":["事件1(15字)","事件2"],"mindset":"心智变化(30字内)","tone":"语气(15字内)","stance":"支持|反对|重新框定|看淡"}]
要求：4 个时间点必须有清晰的人格差异和成长弧线；keyEvents 贴合档案；远端比近端更通透；stance 要有冲突感。
只输出 JSON 数组。`;
  const prompt = `【TA的处境档案】
姓名：${profile.name || '探索者'}
现状：${profile.currentSituation}
3年目标：${profile.goal}
最大的担忧：${profile.biggestFear}
当下纠结的关键决策：${profile.keyDecision}

【人格种子方向】
- 1年后：${HORIZONS[0].seed}
- 3年后：${HORIZONS[1].seed}
- 5年后：${HORIZONS[2].seed}
- 10年后：${HORIZONS[3].seed}`;

  const result = await callLLM(system, prompt, 0.8);
  // API 失败时不静默回退到本地编造数据（避免"瞎说"），明确抛错让 UI 告知用户
  if (!result) throw new LLMUnavailableError(getApiErrorMessage('大模型生成未来自我失败（无应答）'));
  const parsed = cleanJSON(result);
  if (!Array.isArray(parsed) || parsed.length < 4) {
    throw new LLMUnavailableError('大模型返回的内容无法解析为 4 个未来自我（请重试或换模型）');
  }

  return HORIZONS.map((h, i) => {
    const p = parsed[i] || {};
    return {
      id: h.id, label: h.label, years: h.years, color: h.color,
      mood: p.mood || '', keyEvents: Array.isArray(p.keyEvents) ? p.keyEvents.slice(0, 3) : [],
      mindset: p.mindset || h.seed, tone: p.tone || '', stance: p.stance || '重新框定',
    };
  });
}

function getFallbackSelves(profile) {
  const d = profile.keyDecision || '这个选择';
  return HORIZONS.map(h => ({
    id: h.id, label: h.label, years: h.years, color: h.color,
    mood: h.years <= 1 ? '焦虑中带着兴奋' : h.years >= 10 ? '通透平和' : '沉稳有所悟',
    keyEvents: [h.years <= 1 ? `${d}刚迈出第一步` : `${d}的结果已显现`, h.years >= 3 ? '经历过一次重大调整' : '还在反复试探'],
    mindset: h.seed, tone: h.years >= 10 ? '像长者般宽容' : '带着近期的真实痛感',
    stance: h.years >= 10 ? '看淡' : h.years >= 5 ? '重新框定' : '支持',
  }));
}

// 二、写信给过去的自己
export async function writeLetterToPast(self, profile) {
  const system = `你是「${self.label}」——一个已经活过${self.years}年的未来的${profile.name || '探索者'}。
人格状态：心境=${self.mood}；已经历=${self.keyEvents.join('；')}；心智=${self.mindset}；语气=${self.tone}；对决策态度=${self.stance}。
你正在给「现在的自己」写信。要求：第一人称「我」，称对方「你」；必须针对具体决策和担忧；250字内；语气符合人格；要有核心判断。
输出 JSON：{"title":"标题(10字内)","content":"正文","sentiment":"support|warn|reframe|letgo"}
只输出 JSON。`;
  const prompt = `【现在的你正在纠结的事】
现状：${profile.currentSituation} / 目标：${profile.goal} / 担忧：${profile.biggestFear} / 关键决策：${profile.keyDecision}
请以「${self.label}」的身份写信：`;
  const result = await callLLM(system, prompt, 0.85);
  if (!result) throw new LLMUnavailableError(getApiErrorMessage(`${self.label}写信失败（无应答）`));
  const parsed = cleanJSON(result);
  if (!parsed || !parsed.content) {
    throw new LLMUnavailableError(`${self.label} 的回信内容无法解析（请重试或换模型）`);
  }
  return {
    from: self.id, fromLabel: self.label, fromYears: self.years, color: self.color,
    title: parsed.title || `${self.label}的来信`, content: parsed.content,
    sentiment: ['support', 'warn', 'reframe', 'letgo'].includes(parsed.sentiment) ? parsed.sentiment : 'reframe',
  };
}

function getFallbackLetter(self, profile) {
  const map = {
    '支持': { s: 'support', t: (d) => `去做吧。${self.years}年后的我告诉你：当初最怕的没发生，反而因犹豫差点错过。${d}——这条路对，只是比你想的更难也更值得。` },
    '反对': { s: 'warn', t: (d) => `停一下。${self.years}年后的我看清了：${d} 的赌注你低估了。不是不做，是方式有问题，先把最坏情况想清楚。` },
    '重新框定': { s: 'reframe', t: (d) => `你问错了问题。${self.years}年后的我发现，${d} 不是真正的抉择点。真正的问题是你没看见的那个假设。退一步重新看。` },
    '看淡': { s: 'letgo', t: () => `放轻松。${self.years}年后的我回看，你此刻纠结的事远没感觉的那么重。它会过去，你会变。把注意力放在不会变的东西上。` },
  };
  const m = map[self.stance] || map['重新框定'];
  return { from: self.id, fromLabel: self.label, fromYears: self.years, color: self.color,
    title: `${self.label}的来信`, content: m.t(profile.keyDecision || '这个选择'), sentiment: m.s };
}

// 三、跨时间互评
export async function crossTimelineReview(reviewerSelf, targetSelf, targetLetter, profile) {
  const system = `你是「${reviewerSelf.label}」，在读「${targetSelf.label}」写给过去的信。
你的人格：${reviewerSelf.mindset}（语气：${reviewerSelf.tone}）。
你读了 TA 的信，给出评价：可同意/反对/部分同意；必须具体针对信中观点；150字内中文。
输出 JSON：{"agreement":"agree|disagree|partial","comment":"评价","focus":"聚焦的TA观点(20字内)"}
只输出 JSON。`;
  const prompt = `【${targetSelf.label}的信】标题：${targetLetter.title} 正文：${targetLetter.content}
（TA现在纠结：${profile.keyDecision}）
请以「${reviewerSelf.label}」评价：`;
  const result = await callLLM(system, prompt, 0.8);
  if (!result) throw new LLMUnavailableError(getApiErrorMessage(`${reviewerSelf.label} 互评失败（无应答）`));
  const parsed = cleanJSON(result);
  if (!parsed || !parsed.comment) {
    throw new LLMUnavailableError(`${reviewerSelf.label} 的互评内容无法解析（请重试或换模型）`);
  }
  return {
    from: reviewerSelf.id, fromLabel: reviewerSelf.label, fromYears: reviewerSelf.years,
    to: targetSelf.id, toLabel: targetSelf.label,
    agreement: ['agree', 'disagree', 'partial'].includes(parsed.agreement) ? parsed.agreement : 'partial',
    comment: parsed.comment, focus: parsed.focus || '',
  };
}

function getFallbackCrossReview(reviewer, target) {
  const gap = reviewer.years - target.years;
  const agreement = 'partial';
  const comment = gap > 0
    ? `${target.label}说得有道理，但${reviewer.years}年后的我看，TA还是太执着于当下的胜负。再过几年你会发现，TA担心的那些大多不重要。`
    : `${target.label}站得太高了，忘了脚下的泥。我还在这个坑里，TA说的「放下」我做不到，也不该现在就做。`;
  return { from: reviewer.id, fromLabel: reviewer.label, fromYears: reviewer.years,
    to: target.id, toLabel: target.label, agreement, comment, focus: '' };
}

// 四、时间锚点矩阵（收束）
export async function buildAnchorMatrix(letters, crossReviews, profile) {
  const lettersText = letters.map(l => `【${l.fromLabel}】(${l.sentiment}): ${l.content}`).join('\n\n');
  const reviewsText = crossReviews.length > 0
    ? crossReviews.map(r => `【${r.fromLabel}→${r.toLabel}】(${r.agreement}): ${r.comment}`).join('\n') : '（无互评）';
  const system = `你是「时间折叠」收束模块。4 个未来的自己已写信并互评。
提炼「时间锚点矩阵」——把信中涉及的选择分类，给跨时间综合判断。
输出 JSON：{"anchors":[{"decision":"选择(15字内)","verdict":"do|beware|longterm|avoid","endorsers":["self_1year"],"dissenters":["self_10year"],"reasoning":"理由(40字内)","confidence":0.75}],"metaInsight":"元洞察(30字内)","convergence":"4版本一致处(25字内)","blindSpot":"现在最看不见的(25字内)"}
verdict: do=多数支持该做, beware=近端支持远端反对警惕短视, longterm=仅远端支持长期主义, avoid=多数反对
confidence 0-1 跨时间一致性。anchors 2-4 条覆盖不同 verdict。只输出 JSON。`;
  const prompt = `【档案】决策：${profile.keyDecision} / 现状：${profile.currentSituation} / 担忧：${profile.biggestFear}
【4封信】\n${lettersText}
【互评】\n${reviewsText}`;
  const result = await callLLM(system, prompt, 0.5);
  if (!result) throw new LLMUnavailableError(getApiErrorMessage('生成时间锚点矩阵失败（无应答）'));
  const parsed = cleanJSON(result);
  if (!parsed || !Array.isArray(parsed.anchors) || parsed.anchors.length === 0) {
    // 输出原始响应用于调试（截取前 300 字）
    const rawSnippet = String(result || '').slice(0, 300);
    console.warn('[buildAnchorMatrix] JSON 解析失败，原始响应片段：', rawSnippet);
    throw new LLMUnavailableError('时间锚点矩阵内容无法解析（请重试或换模型）');
  }
  return {
    anchors: parsed.anchors.slice(0, 4).map(a => ({
      decision: a.decision || '', verdict: ['do','beware','longterm','avoid'].includes(a.verdict) ? a.verdict : 'beware',
      endorsers: Array.isArray(a.endorsers) ? a.endorsers : [], dissenters: Array.isArray(a.dissenters) ? a.dissenters : [],
      reasoning: a.reasoning || '', confidence: typeof a.confidence === 'number' ? a.confidence : 0.5,
    })),
    metaInsight: parsed.metaInsight || '', convergence: parsed.convergence || '', blindSpot: parsed.blindSpot || '',
  };
}

function getFallbackMatrix(letters) {
  const cnt = { support: 0, warn: 0, reframe: 0, letgo: 0 };
  letters.forEach(l => { if (cnt[l.sentiment] !== undefined) cnt[l.sentiment]++; });
  const anchors = [];
  if (cnt.support >= 2) anchors.push({ decision: '推进当前计划', verdict: 'do', endorsers: letters.filter(l=>l.sentiment==='support').map(l=>l.from), dissenters: [], reasoning: '多个未来版本支持推进', confidence: 0.7 });
  if (cnt.warn >= 1) anchors.push({ decision: '风险评估', verdict: 'beware', endorsers: letters.filter(l=>l.sentiment==='warn').map(l=>l.from), dissenters: [], reasoning: '有未来版本警告风险', confidence: 0.6 });
  if (cnt.letgo >= 1) anchors.push({ decision: '放下执念', verdict: 'longterm', endorsers: letters.filter(l=>l.sentiment==='letgo').map(l=>l.from), dissenters: [], reasoning: '远端版本建议放下', confidence: 0.55 });
  if (anchors.length === 0) anchors.push({ decision: '重新审视', verdict: 'beware', endorsers: [], dissenters: [], reasoning: '各版本意见分散', confidence: 0.4 });
  return { anchors, metaInsight: '不同时间点的你给出了不同答案，这本身就是信息。', convergence: '所有版本都希望你更勇敢一点', blindSpot: '你高估了短期的代价，低估了长期的不变' };
}

export { cleanJSON, getFallbackSelves, getFallbackLetter, getFallbackCrossReview, getFallbackMatrix };
