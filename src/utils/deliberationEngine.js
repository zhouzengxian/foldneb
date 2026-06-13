/**
 * DeliberationEngine — 决策推演引擎
 * 创始人遇到商业卡点 → 墨池规划流程 → 召集Agent → 多轮推演 → 图谱报告
 */

import { tier1Agents } from '../data/gameData';
import { resolveAgentId } from './memoryCrystal';
import { callLLMWithProvider, DEFAULT_PROVIDER_ID, getProviderById, LLMUnavailableError, getApiErrorMessage } from './modelConfig';

// ============================================================
// 当前使用的模型（由 UI 设置）
// ============================================================
let currentProviderId = DEFAULT_PROVIDER_ID;

export function setDeliberationProvider(providerId) {
  currentProviderId = providerId || DEFAULT_PROVIDER_ID;
}

export function getDeliberationProvider() {
  return currentProviderId;
}

// ============================================================
// Agent 专长域 (供 engine 选择候选Agent)
// ============================================================
const AGENT_EXPERTISE = {
  // 思想源流
  'zhuangzi':          { domains: ['重新框定','破局','边缘视角','认知突破'], priority: 9 },
  'wangyangming':      { domains: ['创始人内观','价值判断','决策锚点','知行合一'], priority: 9 },
  'deleuze':           { domains: ['非二元思维','组织生态','复杂系统','块茎结构'], priority: 8 },
  'foucault':          { domains: ['权力结构','话语分析','组织政治'], priority: 7 },
  'huineng':           { domains: ['直觉判断','破除执念','简化决策'], priority: 6 },
  'nietzsche':         { domains: ['意志力','价值重估','突破束缚'], priority: 7 },
  'laozi':             { domains: ['顺势而为','以柔克刚','无为而治'], priority: 7 },
  'marcus_aurelius':   { domains: ['内在控制','情绪管理','斯多葛'], priority: 6 },
  // AI前沿
  'jensen_huang':      { domains: ['技术战略','长期投入','耐心资本','硬件生态'], priority: 9 },
  'sam_altman':        { domains: ['AI战略','融资','产品发布','技术趋势'], priority: 8 },
  'dario_amodei':      { domains: ['AI安全','技术伦理','负责任创新'], priority: 6 },
  'feifei_li':         { domains: ['AI应用','人本AI','技术人文'], priority: 6 },
  'elon_musk':         { domains: ['第一性原理','激进创新','跨行业颠覆'], priority: 8 },
  'demis_hassabis':    { domains: ['AI科研','AGI路线','科学突破'], priority: 8 },
  'geoffrey_hinton':   { domains: ['深度学习','技术范式','AI风险'], priority: 7 },
  'andrew_ng':         { domains: ['AI教育','技术普及','产品落地'], priority: 7 },
  // 认知与决策
  'kahneman':          { domains: ['认知偏差','决策心理学','系统思维'], priority: 8 },
  'charlie_munger':    { domains: ['多元模型','逆向思维','长期价值'], priority: 9 },
  'nassim_taleb':      { domains: ['风险管理','反脆弱','不确定性','非对称博弈'], priority: 9 },
  'annie_duke':        { domains: ['贝叶斯决策','概率思维','结果vs过程'], priority: 7 },
  'herbert_simon':     { domains: ['有限理性','满意决策','组织行为'], priority: 7 },
  // 战略与博弈
  'sunzi':             { domains: ['竞争战略','知己知彼','以智取胜'], priority: 9 },
  'michael_porter':    { domains: ['竞争分析','行业定位','价值链'], priority: 8 },
  'clayton_christensen':{ domains: ['颠覆创新','市场切入','替代策略'], priority: 8 },
  'peter_thiel':       { domains: ['垄断战略','逆向思维','从0到1'], priority: 8 },
  'john_boyd':         { domains: ['快速迭代','OODA循环','敏捷决策'], priority: 7 },
  'schumpeter':        { domains: ['创造性破坏','产业周期','企业家精神'], priority: 8 },
  // 资本与周期
  'naval_ravikant':    { domains: ['财富杠杆','长期主义','独立思考'], priority: 8 },
  'ray_dalio':         { domains: ['宏观周期','原则思维','系统化决策'], priority: 8 },
  'shen_nanpeng':      { domains: ['中国赛道','投资时机','创始人判断'], priority: 8 },
  'marc_andreessen':   { domains: ['技术投资','平台战略','软件吞噬世界'], priority: 7 },
  // 复杂系统
  'kevin_kelly':       { domains: ['技术趋势','网络效应','自组织'], priority: 7 },
  'geoffrey_west':     { domains: ['规模法则','组织增长','数量预判'], priority: 7 },
  'donella_meadows':   { domains: ['系统杠杆','增长边界','可持续发展'], priority: 8 },
  // 网络与平台
  'tim_berners_lee':   { domains: ['开放协议','去中心化','信息自由'], priority: 6 },
  'reid_hoffman':      { domains: ['网络效应','规模化','平台策略'], priority: 7 },
  'benedict_evans':    { domains: ['技术趋势','平台分析','行业报告'], priority: 6 },
  // 产品与设计
  'dieter_rams':       { domains: ['设计原则','产品简洁','系统性思考'], priority: 7 },
  'don_norman':        { domains: ['用户体验','设计思维','人因工程'], priority: 7 },
  'zhang_xiaolong':    { domains: ['产品哲学','极简主义','用户价值','社交网络'], priority: 8 },
  // 中国当代
  'lei_jun':           { domains: ['极致性价比','供应链创新','品牌策略'], priority: 8 },
  'zhang_yiming':      { domains: ['算法驱动','全球化','内容平台'], priority: 8 },
  'wang_xing':         { domains: ['无限游戏','本地生活','持久竞争'], priority: 7 },
  // AI叙事场
  'lex_fridman':       { domains: ['思想对话','跨界连接','深度理解'], priority: 6 },
  // 跨界之眼
  'kafka':             { domains: ['荒诞视角','系统荒谬','个体困境'], priority: 6 },
  'harari':            { domains: ['大历史视角','人类叙事','科技社会'], priority: 7 },
  'stewart_brand':     { domains: ['长时段思维','技术社会','知识系统'], priority: 6 },
  // 知识枢纽
  'paul_graham':       { domains: ['创业决策','PMF','增长','创始人模式'], priority: 8 },
  'peter_diamandis':   { domains: ['指数思维','科技乐观','大规模问题'], priority: 7 },
  // 草根力量
  'dan_koe':           { domains: ['一人公司','内容创业','个人品牌'], priority: 6 },
  'pieter_levels':     { domains: ['独立开发','快速验证','精益创业'], priority: 7 },
  'sahil_lavingia':    { domains: ['独立创业','小而美','长期坚持'], priority: 6 },
  // 墨池
  'mochi':             { domains: ['整合推演','流程规划','综合判断'], priority: 10 },
};

// 获取 Agent 完整信息
function getAgentInfo(id) {
  if (id === 'user') return { name: '创始人', title: '决策者', perspective: '你面临一个艰难的商业选择，需要多维度视角来重新框定问题' };
  if (id === 'mochi') return { name: '墨池', title: '推演主持人', perspective: '整合不同思想者的视角，帮创始人看清问题的全貌' };
  const a = tier1Agents.find(x => x.id === id);
  if (!a) return null;
  return {
    name: a.name,
    title: a.title,
    perspective: a.description || `${a.name}的智慧`,
    dialogue: a.dialogue,
    highlights: a.highlights,
    tags: a.tags,
  };
}

// ============================================================
// LLM 调用封装
// ============================================================
async function callLLM(systemPrompt, userPrompt, temperature = 0.7) {
  return callLLMWithProvider(currentProviderId, systemPrompt, userPrompt, {
    temperature, maxTokens: 800, timeoutMs: 20000,
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

// ============================================================
// 一、问题分析 → 匹配Agent
// ============================================================
export async function analyzeProblem(problem) {
  const system = `你是墨池，一个决策推演主持人。分析创始人提出的商业问题，输出JSON：{"domain":"问题核心域(5字内)","dimensions":["维度1","维度2","维度3"],"suggestedAgents":[{"id":"agentId","why":"为什么选这个Agent(20字内)"}]}
从以下候选Agent中选择4-6位:{${Object.keys(AGENT_EXPERTISE).filter(k=>k!=='mochi').join(',')}}
只输出JSON，不要其他文字。`;

  const result = await callLLM(system, `创始人问题：${problem}`, 0.3);
  // API 失败时不静默回退到本地 Agent 组合（避免"瞎说"），抛错让 UI 告知用户
  if (!result) throw new LLMUnavailableError(getApiErrorMessage('问题分析失败（无应答）'));
  
  const parsed = cleanJSON(result);
  if (!parsed || !parsed.suggestedAgents) {
    throw new LLMUnavailableError('问题分析返回内容无法解析（请重试或换模型）');
  }

  // 验证 Agent ID
  const validAgents = parsed.suggestedAgents
    .filter(a => a.id && AGENT_EXPERTISE[a.id] && a.id !== 'mochi')
    .slice(0, 6);

  if (validAgents.length < 2) {
    throw new LLMUnavailableError('AI 选出的 Agent 全部无效（模型可能未遵循输出约定，请换模型重试）');
  }

  return {
    domain: parsed.domain || '商业决策',
    dimensions: parsed.dimensions || [],
    agents: validAgents,
  };
}

// 降级方案：基于关键词的兜底Agent组合
function getFallbackPlan(problem) {
  const lower = problem.toLowerCase();
  const defaults = {
    agents: [
      { id: 'wangyangming', why: '创始人需要内在锚点' },
      { id: 'zhuangzi', why: '重新框定问题' },
      { id: 'nassim_taleb', why: '反脆弱与风险管理' },
      { id: 'paul_graham', why: '创始人模式与增长' },
    ],
    domain: '商业决策',
    dimensions: ['内在判断', '风险应对', '增长策略'],
  };

  // 技术偏好
  if (/技术|infra|架构|代码|平台|SaaS/i.test(lower)) {
    defaults.agents.splice(2, 0, { id: 'jensen_huang', why: '技术长期主义' });
  }
  // 融资/市场偏好
  if (/融资|投资人|钱|市场|用户|增长|变现/i.test(lower)) {
    defaults.agents.splice(2, 0, { id: 'sam_altman', why: '融资与增长策略' });
  }
  // 产品偏好
  if (/产品|设计|用户|体验/i.test(lower)) {
    defaults.agents.push({ id: 'zhang_xiaolong', why: '产品哲学' });
  }
  // 组织偏好
  if (/团队|人|组织|管理|文化/i.test(lower)) {
    defaults.agents.push({ id: 'deleuze', why: '组织生态思维' });
  }

  return defaults;
}

// ============================================================
// 二、规划推演轮次
// ============================================================
export async function planRounds(problem, domain, agentIds) {
  const agentsInfo = agentIds.map(id => {
    const info = getAgentInfo(id);
    const exp = AGENT_EXPERTISE[id];
    return `${info?.name || id}(${exp?.style || '思想者'}): ${exp?.domains?.join(',') || '综合视角'}`;
  }).join('\n');

  const system = `你是墨池。为以下Agent规划3-4轮推演流程。每轮有一个"主题"和"参与Agent"(2-3位)。
输出JSON：[{"round":1,"theme":"本论主题(8字内)","agentIds":["id1","id2"],"goal":"本论要回答的问题(15字内)"}]
推演从"框定问题"→"纵深挑战"→"破框重新框定"→"综合"的结构。
只输出JSON数组。`;

  const prompt = `问题：${problem}\n核心域：${domain}\n参演Agent：\n${agentsInfo}`;
  const result = await callLLM(system, prompt, 0.4);
  if (!result) throw new LLMUnavailableError(getApiErrorMessage('推演规划失败（无应答）'));

  const parsed = cleanJSON(result);
  if (!Array.isArray(parsed) || parsed.length < 2) {
    throw new LLMUnavailableError('推演轮次规划无法解析（请重试或换模型）');
  }

  // 过滤每轮中的无效Agent
  return parsed.map((r, i) => ({
    round: i + 1,
    theme: r.theme || `第${i+1}轮`,
    agentIds: (r.agentIds || []).filter(id => AGENT_EXPERTISE[id]).slice(0, 3),
    goal: r.goal || '深入分析',
  })).filter(r => r.agentIds.length > 0);
}

function getFallbackRounds(agentIds) {
  if (agentIds.length <= 2) {
    return [{ round: 1, theme: '全方位分析', agentIds, goal: '从各自视角框定问题' }];
  }
  const half = Math.ceil(agentIds.length / 2);
  return [
    { round: 1, theme: '框定问题', agentIds: agentIds.slice(0, half), goal: '从各自视角框定问题' },
    { round: 2, theme: '纵深推演', agentIds: agentIds.slice(half), goal: '从不同维度深入挑战' },
    { round: 3, theme: '综合破框', agentIds: agentIds.slice(0, 2), goal: '重新框定得出结论' },
  ];
}

// ============================================================
// 三、获取Agent推演回应
// ============================================================

/** 并发限制 + 自动重试：防止 API 限流导致部分 Agent 沉默 */
export async function getAgentResponsesBatch(agentIds, context, {
  concurrency = 2,
  retries = 1,
  delayMs = 500,
} = {}) {
  const results = [];
  const queue = [...agentIds];

  async function worker() {
    while (queue.length > 0) {
      const agentId = queue.shift();
      if (!agentId) break;

      let resp = null;
      for (let attempt = 0; attempt <= retries; attempt++) {
        if (attempt > 0) {
          // 重试前等待递增时间
          await new Promise(r => setTimeout(r, attempt * 800));
        }
        resp = await getAgentResponse(agentId, context);
        // 真正的失败：无 text 或显式 failed 标记（不再依赖"沉默"字符串猜测）
        const isSilent = !resp?.text || resp?.failed;
        if (resp && !isSilent) break;
      }
      results.push(resp || { agentId, text: '', agentName: getAgentInfo(agentId)?.name || agentId });
    }
  }

  // 启动 concurrency 个 worker
  const workers = Array(Math.min(concurrency, queue.length))
    .fill(null)
    .map(() => worker());
  await Promise.all(workers);

  // 按原始顺序排列结果
  const ordered = agentIds.map(id => results.find(r => r.agentId === id)).filter(Boolean);
  return ordered;
}

export async function getAgentResponse(agentId, context) {
  const info = getAgentInfo(agentId);
  if (!info) return { agentId, text: '（暂无回应）' };

  const exp = AGENT_EXPERTISE[agentId];
  const styleHint = exp ? `领域专长: ${exp.domains.join('、')}` : '';
  const highlights = info.highlights ? `代表作/成就: ${info.highlights.join('; ')}` : '';
  const tags = info.tags ? `思想标签: ${info.tags.join('、')}` : '';

  const system = `你是${info.name}，${info.title}。${info.perspective}
${styleHint}
${highlights}
${tags}

你正在参加一场创始人决策推演。请以${info.name}的思想体系和语气风格，对以下问题给出你的视角。
要求：
- 必须基于你的思想体系（不是泛泛而谈）
- 具体、有针对性，就像你真的在对这位创始人说话
- 200字以内，中文
- 保持你的风格和语气`;

  const prompt = `【推演上下文】
${context.theme ? `本轮主题：${context.theme}` : ''}
${context.goal ? `要回答的问题：${context.goal}` : ''}
创始人的问题：${context.problem}

${context.previousInsights ? `前轮已有的洞察：${context.previousInsights}` : ''}
${context.roundIndex > 0 ? `这是第${context.roundIndex + 1}轮，请在前轮基础上深化或挑战已有观点。` : '这是第1轮，请首先给出你的核心判断。'}

请以${info.name}的身份回应：`;

  const text = await callLLM(system, prompt, 0.75);
  // API 失败：标记失败并附上真实错误原因（不再伪装成"沉默"占位文本）
  if (!text) {
    return {
      agentId, text: '', failed: true, agentName: info.name,
      error: getApiErrorMessage(`${info.name} 无应答`),
    };
  }
  return { agentId, text, agentName: info.name };
}

// ============================================================
// 四、提取推演洞察（冲突/共识/关键点）
// ============================================================
export async function extractInsights(dialogues, theme) {
  const dialogText = dialogues
    .map(d => `${d.agentName || d.agentId}: ${d.text}`)
    .join('\n\n');

  const system = `你是推演记录员。从以下对话中提取洞察，输出JSON数组：
[{"type":"conflict|consensus|insight","agents":["AgentA","AgentB"],"text":"洞察描述(20字内)","significance":"为什么重要(15字内)"}]
规则：
- type: conflict=两人观点冲突, consensus=达成共识, insight=关键新视角
- 最多提取3条，宁可少不要强行凑
只输出JSON数组。`;

  const result = await callLLM(system, `【${theme}】\n${dialogText}`, 0.3);
  if (!result) return [];
  const parsed = cleanJSON(result);
  return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
}

// ============================================================
// 五、生成Zep风格推演报告
// ============================================================
export async function generateReport(problem, domain, rounds, allInsights) {
  const roundSummaries = rounds.map(r => {
    const dialogues = r.dialogues || [];
    const summary = dialogues.map(d => `- ${d.agentName || d.agentId}: ${(d.text || '').slice(0, 80)}...`).join('\n');
    return `## ${r.theme}\n${summary}`;
  }).join('\n\n');

  const insightsText = allInsights.map((ins, i) => 
    `[${ins.type === 'conflict' ? '⚡冲突' : ins.type === 'consensus' ? '✨共识' : '💡洞见'}] ${ins.text}`
  ).join('\n');

  const system = `你是墨池，正在为创始人撰写决策推演报告。基于推演过程，生成一份结构化综合报告。

输出JSON：
{
  "coreFinding": "核心发现(一句话,30字内)",
  "keyInsights": ["洞察1","洞察2","洞察3"],
  "actionableAdvice": "可执行的综合建议(80字内)",
  "reframedProblem": "重新框定后的问题(25字内)",
  "followUpQuestions": ["后续可追问的问题1","问题2"]
}
只输出JSON。`;

  const prompt = `【原始问题】${problem}
【问题域】${domain}
【推演过程摘要】
${roundSummaries}
【关键洞察】
${insightsText}`;

  const result = await callLLM(system, prompt, 0.5);
  if (!result) throw new LLMUnavailableError(getApiErrorMessage('报告生成失败（无应答）'));

  const parsed = cleanJSON(result);
  if (!parsed || !parsed.coreFinding) {
    throw new LLMUnavailableError('推演报告无法解析（请重试或换模型）');
  }
  return parsed;
}

function getFallbackReport(problem, domain, rounds, allInsights) {
  const insightTexts = allInsights.map(i => i.text).slice(0, 3);
  const agentNames = new Set();
  rounds.forEach(r => (r.dialogues || []).forEach(d => agentNames.add(d.agentName)));

  return {
    coreFinding: `${[...agentNames].slice(0,2).join('和')}提供了不同视角，帮助你重新审视"${problem.slice(0, 20)}"`,
    keyInsights: insightTexts.length > 0 ? insightTexts : ['多角度审视你的问题', '退一步看全局'],
    actionableAdvice: '综合各思想家视角，建议你先明确问题的边界和假设，再分步验证',
    reframedProblem: `${domain}视角下的决策`,
    followUpQuestions: ['如果从完全相反的角度看这个问题呢？', '最坏情况是什么？你能承受吗？'],
  };
}

// ============================================================
// 六、导出工具函数
// ============================================================
export { getAgentInfo, AGENT_EXPERTISE };
