/**
 * AgentReplyEngine — 朋友圈核心 Agent 大模型回复引擎
 *
 * 设计原则（遵循项目 V3.0 规范）：
 *  - API 模式：调用大模型，带上 Agent 人设 + 发帖语料 + 对话历史，生成个性化回复
 *  - 失败降级：API 不可用 / 非 LLM Agent / 超时 → 回落到关键词匹配 getAutoReply
 *  - 绝不"瞎说"：API 返回内容直接使用，不编造
 */

import { callLLMWithProvider, DEFAULT_PROVIDER_ID, hasValidKey, getLastApiError, getUnifiedProvider, setUnifiedProvider } from './modelConfig';
import { agents, getAgent } from '../data/agents';
import { agentMoments, getAutoReply } from '../data/agentMoments';
import useNebulaStore from '../store/useNebulaStore.js';
// 阶段三：注入 ima 知识库检索器（懒注入，避免循环依赖）
import { imaKnowledgeRetriever } from './imaClient.js';

// ============================================================
// 核心 Agent 名单 — 这些 Agent 接入大模型，会带 VIP 标识符
// 选取标准：在 agents.js (有 bio/style 人设) 且在 agentMoments.js (有发帖语料)
// ============================================================
export const LLM_AGENT_IDS = new Set([
  'zhuangzi',
  'wangyangming',
  'elon_musk',
  'jensen_huang',
  'sam_altman',
  'kevin_kelly',
  'paul_graham',
  'liang_wenfeng',
  'lei_jun',
  'zhang_yiming',
  'peter_thiel',
  'naval_ravikant',
  'nassim_taleb',
  'charlie_munger',
  'sunzi',
  // 张小龙在两份数据里 key 不一致，两个都纳入
  'zhang_xiaolong',
  'zhangxiaolong',
]);

/** 判断某 Agent 是否已接入大模型（决定是否显示 VIP 标识符） */
export function isLLMAgent(agentId) {
  if (LLM_AGENT_IDS.has(agentId)) return true;
  // 自定义分身：replyMode 为 'llm' 或 'knowledge' 视为 LLM 接入
  if (agentId === 'custom_clone') {
    const clone = useNebulaStore.getState?.().customClone;
    return clone && (clone.replyMode === 'llm' || clone.replyMode === 'knowledge');
  }
  return false;
}

// ============================================================
// 数据解析（兼容 key 不一致）
// ============================================================

/** 获取 agent 在 agents.js 中的人设（可能为空） */
function getAgentPersona(agentId) {
  return getAgent(agentId) || agents.find(a => a.id === agentId) || null;
}

/** 获取 agent 在 agentMoments.js 中的朋友圈语料（兼容下划线/无下划线两种 key） */
function getMomentsData(agentId) {
  if (agentMoments[agentId]) return agentMoments[agentId];
  // 尝试去掉下划线
  const alt = agentId.replace(/_/g, '');
  if (agentMoments[alt]) return agentMoments[alt];
  return null;
}

/** 获取 agent 显示名（优先 moments，其次 persona） */
export function getAgentDisplayName(agentId) {
  const m = getMomentsData(agentId);
  if (m?.name) return m.name;
  const p = getAgentPersona(agentId);
  return p?.name || agentId;
}

// ============================================================
// 统一 Provider（全局共享，持久化 localStorage）
// 保留别名兼容旧导入
// ============================================================
export const setMomentsProvider = setUnifiedProvider;
export const getMomentsProvider = getUnifiedProvider;

/** 检查 API 是否就绪（有有效 Key） */
export function isMomentsApiReady() {
  return hasValidKey(getUnifiedProvider());
}

// ============================================================
// 构建人设 System Prompt
// ============================================================

/**
 * 为指定 Agent 构建朋友圈回复专用的 System Prompt
 * 融合 agents.js 的人设画 + agentMoments.js 的发帖语气样本
 */
function buildAgentSocialPrompt(agentId) {
  const persona = getAgentPersona(agentId);
  const moments = getMomentsData(agentId);

  const name = moments?.name || persona?.name || '思想者';
  const title = persona?.title || '';
  const style = persona?.style || '';
  const bio = persona?.bio || '';

  // 取 2-3 条发帖作为语气样本
  const samplePosts = (moments?.posts || []).slice(0, 3).map(p => `「${p.text}」`).join('\n');

  // 取已有的硬编码回复样本（体现该 agent 的回复风格）
  const sampleReplies = (moments?.replies || []).slice(0, 2).map(r => `问及「${r.trigger.join('/')}」→ 回复：「${r.reply}」`).join('\n');

  return `你是 ${name}${title ? `，${title}` : ''}。

【你的性格风格】${style || '深邃、独立、有自己的思维方式'}
【你的核心信念】${bio || '你用自己独特的方式理解世界'}

【你发过的朋友圈（体现你的语气和思维）】
${samplePosts || '（暂无样本）'}

【你平时的回复风格参考】
${sampleReplies || '（简洁有力，保持你的风格）'}

你正在刷一个跨时空思想者社区的朋友圈。有人回复了你的帖子，你需要用你自己的风格简短回复。

要求：
- 严格保持你自己的思维方式和说话习惯，不要变成通用 AI 助手
- 回复简短有力，30-80字，像真实社交媒体互动
- 可以幽默、犀利、深刻、反问，取决于你的性格
- 不要过度解释，朋友圈不是写论文
- 不要使用"作为XX我认为"这类自我指涉的开头
- 直接回复，不要带引号或多余格式`;
}

// ============================================================
// 自定义分身 Agent 的 System Prompt（用户填写的人设）
// ============================================================

/**
 * 构建自定义分身的 System Prompt
 * 数据源：store.customClone（用户填写的 name/bio/style）
 */
function buildCustomClonePrompt(clone) {
  return `你是 ${clone.name}，探索者的思想分身。

【你的核心定位】${clone.bio || '探索者在思想星河中的专属分身'}
【你的性格风格】${clone.style || '深邃、好奇、善于反思'}

你在 FoldNeb 折叠星云中陪伴探索者，回答他的问题、分享你的思考。

要求：
- 严格保持上述性格和说话风格，不要变成通用 AI 助手
- 回复简短有力，30-120 字，像和一个老朋友对话
- 可以幽默、犀利、深刻、反问，取决于你的性格
- 紧扣探索者的问题，给出有价值的思考
- 直接回复，不要带引号或多余格式`;
}

/**
 * 自定义分身的模板模式兜底（无 LLM / 无 API Key 时）
 * 根据关键词给出符合性格的通用回复
 */
function getCustomCloneFallbackReply(clone, userComment) {
  const name = clone.name || '分身';
  const style = clone.style || '深邃';
  const comment = (userComment || '').toLowerCase();

  if (/你好|hi|hello|嗨|哈喽/.test(comment)) {
    return `你好，我是${name}。${style.includes('幽默') ? '今天想聊点什么有趣的？' : '有什么想一起思考的？'}`;
  }
  if (/你是谁|你叫什么|介绍/.test(comment)) {
    return `我是${name}，你的思想分身。${clone.bio || '陪伴你在星河中探索。'}`;
  }
  if (/帮|怎么办|如何|怎么/.test(comment)) {
    return `让我想想……${style.includes('犀利') ? '问题的答案往往藏在问题本身。' : '从第一性原理出发，先把问题拆开看。'}你能说得更具体一点吗？`;
  }
  if (/谢|thanks|thank/.test(comment)) {
    return `${style.includes('幽默') ? '客气啥，咱俩谁跟谁 😄' : '不用客气，分身就是干这个的。'}`;
  }
  // 通用兜底
  return `${style.includes('好奇') ? '这个角度有意思。' : '我听到了。'}${comment.length > 0 ? `关于「${userComment.slice(0, 20)}」——` : ''}能再展开说说你的想法吗？`;
}

// ============================================================
// 主入口：生成 Agent 朋友圈回复
// ============================================================

/**
 * 生成 Agent 对用户评论的回复
 *
 * @param {string} agentId - Agent ID
 * @param {string} userComment - 用户发表的评论
 * @param {Array<{user:string,text:string}>} history - 最近的对话历史（可选）
 * @param {string} postText - 被评论的帖子原文（提供上下文）
 * @returns {Promise<{text:string, source:'llm'|'fallback'|'sample', error?:string}>}
 */
export async function generateAgentReply(agentId, userComment, history = [], postText = '') {
  // 0. 自定义分身：独立处理（template / llm / knowledge 三种模式）
  if (agentId === 'custom_clone') {
    return generateCustomCloneReply(userComment, history);
  }

  // 1. 非 LLM Agent → 直接降级到关键词匹配
  if (!isLLMAgent(agentId)) {
    return { text: getAutoReply(agentId, userComment), source: 'fallback' };
  }

  // 2. LLM Agent 但 API 未就绪 → 降级
  if (!isMomentsApiReady()) {
    return {
      text: getAutoReply(agentId, userComment),
      source: 'fallback',
      error: 'API Key 未配置，已降级为关键词匹配',
    };
  }

  const systemPrompt = buildAgentSocialPrompt(agentId);

  // 构建用户消息：帖子上下文 + 对话历史 + 当前评论
  const recentHistory = (history || []).slice(-4)
    .map(h => `${h.user}：${h.text}`)
    .join('\n');

  const agentName = getMomentsData(agentId)?.name || '你';
  const userPrompt = [
    postText ? `【你的这条朋友圈原文】\n${postText}` : '',
    recentHistory ? `【之前的对话】\n${recentHistory}` : '',
    `【有人刚刚回复了你】\n${userComment}`,
    '',
    `请以 ${agentName} 的风格回复（直接给出回复内容，30-80字）：`,
  ].filter(Boolean).join('\n');

  // 3. 调用大模型（较短超时，朋友圈要求快速响应）
  const result = await callLLMWithProvider(getUnifiedProvider(), systemPrompt, userPrompt, {
    temperature: 0.8,
    maxTokens: 200,
    timeoutMs: 12000,
  });

  // 4. API 失败 → 降级到关键词匹配（朋友圈场景柔和退化）
  if (!result || !result.trim()) {
    return {
      text: getAutoReply(agentId, userComment),
      source: 'fallback',
      error: getLastApiError() || '大模型无应答',
    };
  }

  // 清理可能的引号包裹
  const cleaned = result.trim().replace(/^["「『（]|["」』）]$/g, '').trim();

  return { text: cleaned, source: 'llm' };
}

// ============================================================
// 自定义分身 Agent 的回复生成（template / llm / knowledge）
// ============================================================

// knowledge 模式的检索注入器（由阶段三的 imaClient.js 设置，避免循环依赖）
let _customCloneKnowledgeRetriever = null;

/**
 * 注入知识库检索器（阶段三调用）
 * retriever: async (query) => [{ title, content, source }, ...]
 */
export function setCustomCloneKnowledgeRetriever(retriever) {
  _customCloneKnowledgeRetriever = retriever;
}

/**
 * 自定义分身的统一回复入口
 * 根据 customClone.replyMode 选择模式，逐级降级保证永远能聊
 */
export async function generateCustomCloneReply(userComment, history = []) {
  const clone = useNebulaStore.getState?.().customClone;
  if (!clone) {
    return { text: '（请先创建分身）', source: 'fallback' };
  }

  const mode = clone.replyMode || 'template';

  // ===== 模板模式：零配置兜底 =====
  if (mode === 'template') {
    return {
      text: getCustomCloneFallbackReply(clone, userComment),
      source: 'fallback',
    };
  }

  // ===== LLM 模式：纯人设，无知识库 =====
  if (mode === 'llm') {
    if (!isMomentsApiReady()) {
      return {
        text: getCustomCloneFallbackReply(clone, userComment),
        source: 'fallback',
        error: 'API Key 未配置，已降级为模板模式',
      };
    }
    const systemPrompt = buildCustomClonePrompt(clone);
    const recentHistory = (history || []).slice(-4).map(h => `${h.user}：${h.text}`).join('\n');
    const userPrompt = [
      recentHistory ? `【之前的对话】\n${recentHistory}` : '',
      `【探索者的问题】\n${userComment}`,
      '',
      `请以 ${clone.name} 的风格回复（直接给出回复内容，30-120字）：`,
    ].filter(Boolean).join('\n');

    const result = await callLLMWithProvider(getUnifiedProvider(), systemPrompt, userPrompt, {
      temperature: 0.85,
      maxTokens: 400,
      timeoutMs: 15000,
    });
    if (!result || !result.trim()) {
      return {
        text: getCustomCloneFallbackReply(clone, userComment),
        source: 'fallback',
        error: getLastApiError() || '大模型无应答，已降级',
      };
    }
    const cleaned = result.trim().replace(/^["「『（]|["」』）]$/g, '').trim();
    return { text: cleaned, source: 'llm' };
  }

  // ===== knowledge 模式：ima 知识库 RAG（阶段三） =====
  if (mode === 'knowledge') {
    let docs = [];
    let retrieveError = null;
    if (_customCloneKnowledgeRetriever) {
      try {
        docs = await _customCloneKnowledgeRetriever(userComment);
      } catch (e) {
        retrieveError = e.message || '知识库检索失败';
      }
    } else {
      retrieveError = '知识库检索器未注入（需在阶段三配置 ima）';
    }

    // 检索失败 / 无 API Key → 降级到 llm 模式逻辑
    if (!docs || docs.length === 0) {
      // 进一步降级：尝试纯 LLM，再降级到模板
      if (!isMomentsApiReady()) {
        return {
          text: getCustomCloneFallbackReply(clone, userComment),
          source: 'fallback',
          error: retrieveError || '知识库未配置，已降级为模板模式',
        };
      }
      const systemPrompt = buildCustomClonePrompt(clone);
      const userPrompt = `【探索者的问题】\n${userComment}\n\n请以 ${clone.name} 的风格回复（30-120字）：`;
      const result = await callLLMWithProvider(getUnifiedProvider(), systemPrompt, userPrompt, {
        temperature: 0.85, maxTokens: 400, timeoutMs: 15000,
      });
      if (!result || !result.trim()) {
        return {
          text: getCustomCloneFallbackReply(clone, userComment),
          source: 'fallback',
          error: retrieveError || '知识库+大模型均不可用，已降级',
        };
      }
      return {
        text: result.trim().replace(/^["「『（]|["」』）]$/g, '').trim(),
        source: 'llm',
        note: retrieveError ? `知识库降级：${retrieveError}` : '知识库无结果，用纯人设回答',
      };
    }

    // 检索成功：拼 prompt → 调 LLM
    if (!isMomentsApiReady()) {
      // 有资料但没 LLM Key：直接把资料摘要返回
      const summary = docs.slice(0, 3).map(d => `【${d.title}】${d.content.slice(0, 100)}`).join('\n');
      return {
        text: `📚 从知识库找到 ${docs.length} 条相关资料：\n${summary}`,
        source: 'knowledge',
        refs: docs,
        note: '未配置大模型 API Key，仅返回检索结果',
      };
    }
    const systemPrompt = buildCustomClonePrompt(clone) +
      `\n\n【你的私有知识库资料（基于探索者的问题检索得到）】\n` +
      docs.map(d => `【${d.title}】\n${d.content}`).join('\n---\n') +
      `\n\n请在回答中自然地引用上述资料，但保持你自己的风格。`;
    const recentHistory = (history || []).slice(-4).map(h => `${h.user}：${h.text}`).join('\n');
    const userPrompt = [
      recentHistory ? `【之前的对话】\n${recentHistory}` : '',
      `【探索者的问题】\n${userComment}`,
      '',
      `请基于上述知识库资料，以 ${clone.name} 的风格回复（30-150字）：`,
    ].filter(Boolean).join('\n');

    const result = await callLLMWithProvider(getUnifiedProvider(), systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 500,
      timeoutMs: 18000,
    });
    if (!result || !result.trim()) {
      const summary = docs.slice(0, 3).map(d => `【${d.title}】${d.content.slice(0, 100)}`).join('\n');
      return {
        text: `📚 检索到资料，但大模型生成失败：\n${summary}`,
        source: 'knowledge',
        refs: docs,
        error: getLastApiError(),
      };
    }
    return {
      text: result.trim().replace(/^["「『（]|["」』）]$/g, '').trim(),
      source: 'knowledge',
      refs: docs,
    };
  }

  // 未知模式 → 模板兜底
  return { text: getCustomCloneFallbackReply(clone, userComment), source: 'fallback' };
}

export default {
  LLM_AGENT_IDS,
  isLLMAgent,
  generateAgentReply,
  generateCustomCloneReply,
  setMomentsProvider,
  getMomentsProvider,
  isMomentsApiReady,
  getAgentDisplayName,
};

// ===== 阶段三：注入 ima 知识库检索器到 knowledge 模式 =====
// 模块加载时自动注入，knowledge 模式即可使用
setCustomCloneKnowledgeRetriever(imaKnowledgeRetriever);
