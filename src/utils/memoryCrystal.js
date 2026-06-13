/**
 * 折叠记忆晶体提取引擎
 *
 * 三种精度：
 * - CRYSTAL: LLM 提取精确三元组（预留 API 接口）
 * - FRAGMENT: 关键词快速匹配（当前实现）
 * - DUST: 截断降级（前15字摘要）
 *
 * 核心规则：
 * 1. 每条对话自动触发记忆提取
 * 2. 新记忆 = 新金色连线（自动在 3D 星河生长）
 * 3. 已有记忆 = 连线增粗/变亮
 * 4. 记忆永不重置（持久化在 localStorage）
 */

import useNebulaStore from '../store/useNebulaStore.js';

/**
 * 关系关键词映射表
 * 用于从对话中自动提取关系标签
 */
const RELATION_PATTERNS = [
  // 思想影响 / 传承
  { keywords: ['影响', '启发', '启发于', '受到.*影响', '学习了'], label: '思想影响' },
  { keywords: ['致敬', '传承', '继承了', '延续'], label: '思想传承' },

  // 合作 / 共创
  { keywords: ['合作', '共识', '联盟', '共同', '一起', '联手'], label: '合作关系' },
  { keywords: ['创立', '创建', '创办', '搭建', '构建'], label: '共同创立' },

  // 辩论 / 对立
  { keywords: ['反对', '不同意', '争论', '辩论', '挑战', '质疑', '但是'], label: '思想辩论' },
  { keywords: ['不同', '区别', '对比', '对照', '相反'], label: '观点差异' },

  // 共鸣 / 印证
  { keywords: ['认同', '同意', '果然', '正是', '共鸣', '说到我心里'], label: '思想共鸣' },
  { keywords: ['印证', '证实', '如你所说', '没错', '确实'], label: '相互印证' },

  // 补充 / 扩展
  { keywords: ['补充', '扩展', '延伸', '进一步', '更深'], label: '知识延伸' },
  { keywords: ['还有', '另外', '不仅', '而且', '此外'], label: '认知扩展' },

  // 连接 / 关联（跨领域）
  { keywords: ['连接', '关联', '跨界', '交叉', '融合', '打通'], label: '跨界连接' },
  { keywords: ['和.*有关', '类似于', '相当于', '好比'], label: '概念类比' },
];

/**
 * 从对话文本中提取关系标签
 */
function extractRelationLabel(dialogueText) {
  for (const pattern of RELATION_PATTERNS) {
    for (const kw of pattern.keywords) {
      const regex = new RegExp(kw, 'i');
      if (regex.test(dialogueText)) {
        return pattern.label;
      }
    }
  }
  return '思想对话'; // 默认标签
}

/**
 * 生成对话（模板驱动，后续接 LLM API）
 *
 * @param {string} agentId - 说话 Agent
 * @param {string} targetId - 目标 Agent（可选）
 * @param {string} topic - 话题
 * @returns {object} { text, relationLabel }
 */
export function generateDialogue(agentId, targetId, topic = '') {
  const templates = [
    `你对${topic || '这个方向'}的核心洞察是什么？`,
    `我一直在思考${topic || '这个问题'}，你的看法影响了我很多。`,
    `${topic || '这个领域'}的未来，你觉得最大的变数是什么？`,
    `我想请教你关于${topic || '创造力'}的底层逻辑——到底是什么在驱动突破？`,
    `关于${topic || '不确定性'}，你的方法论和我有强烈的共鸣。`,
    `我最近重新读了你的思想，有了全新的理解。`,
    `${topic || '我们'}的共同点比差异更大——都相信底层原理的力量。`,
    `我发现${topic || '你的理论'}和我之前的假设形成了完美的印证。`,
  ];

  const text = templates[Math.floor(Math.random() * templates.length)];
  const relationLabel = extractRelationLabel(text);

  return { text, relationLabel };
}

/**
 * 处理一次 Agent 间对话
 * 自动提取记忆晶体，返回晶体信息
 *
 * @param {string} fromId - 说话者
 * @param {string} toId - 倾听者
 * @param {string} topic - 话题（可选）
 * @returns {object} { memoryId, relationLabel, isNew, text }
 */
export function processDialogue(fromId, toId, topic = '') {
  const store = useNebulaStore.getState();

  // 生成对话内容
  const { text, relationLabel } = generateDialogue(fromId, toId, topic);

  // 提取记忆晶体
  const memoryId = store.addMemory(fromId, toId, relationLabel, '对话');

  // 检查是否新记忆
  const existingMemories = store.getMemoryBetween(fromId, toId);
  const isNew = existingMemories?.relations?.length <= 1;

  return {
    memoryId,
    relationLabel,
    isNew,
    text,
  };
}

/**
 * 模拟一轮多人对话（循环20位Agent随机配对对话）
 *
 * @returns {Promise<Array>} 对话记录
 */
export async function simulateConversationRound() {
  const store = useNebulaStore.getState();
  const { AGENTS } = await import('../data/gameData.js');

  const results = [];
  const shuffled = [...AGENTS].sort(() => Math.random() - 0.5);

  // 随机配对对话（10对）
  for (let i = 0; i < shuffled.length - 1; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1];
    const topic = a.tags?.[0] || b.tags?.[0] || '';

    const result = processDialogue(a.id, b.id, topic);
    results.push({
      ...result,
      from: a.name,
      to: b.name,
    });
  }

  return results;
}

/**
 * 将记忆数据导出为可视化格式
 */
export function getMemoryGraph() {
  const store = useNebulaStore.getState();
  const { memories } = store;

  return Object.entries(memories).map(([pairKey, mem]) => ({
    pairKey,
    source: mem.from,
    target: mem.to,
    relations: mem.relations,
    interactionCount: mem.interactionCount,
    lastActivatedAt: mem.lastActivatedAt,
  }));
}

export default {
  generateDialogue,
  processDialogue,
  simulateConversationRound,
  getMemoryGraph,
};
