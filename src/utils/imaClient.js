/**
 * imaClient — 腾讯 ima 知识库 OpenAPI 封装
 *
 * ima 只提供「检索」接口，不提供「对话」接口。
 * 所以 RAG 的 R（检索）由 ima 做，G（生成）由现有 LLM 做。
 *
 * 鉴权：双 Header
 *   ima-openapi-clientid: <client_id>
 *   ima-openapi-apikey:   <api_key>
 *
 * 端点：https://ima.qq.com/openapi/wiki/v1/search_knowledge_base
 *
 * 数据流：
 *   searchImaKnowledge(query) → [{ title, content, source }] → 注入到 agentReplyEngine 的 knowledge 模式
 *
 * 复用项目的 CORS 代理机制（modelConfig.getCorsProxyUrl）
 */

import { getCorsProxyUrl } from './modelConfig.js';

// ===== 凭据管理（localStorage） =====
const IMA_CREDS_KEY = 'foldneb_ima_creds';

export function getImaCreds() {
  try {
    return JSON.parse(localStorage.getItem(IMA_CREDS_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveImaCreds(clientId, apiKey, kbIds = []) {
  const creds = { clientId, apiKey, kbIds };
  localStorage.setItem(IMA_CREDS_KEY, JSON.stringify(creds));
  return creds;
}

export function clearImaCreds() {
  localStorage.removeItem(IMA_CREDS_KEY);
}

export function hasImaCreds() {
  const c = getImaCreds();
  return !!(c.clientId && c.apiKey && c.clientId.length > 4 && c.apiKey.length > 8);
}

// ===== 检索接口 =====

const IMA_SEARCH_URL = 'https://ima.qq.com/openapi/wiki/v1/search_knowledge_base';

/**
 * 搜索用户的知识库
 *
 * @param {string} query - 搜索关键词/问题
 * @param {object} opts - { limit?: number, kbIds?: string[] }
 * @returns {Promise<Array<{title:string, content:string, source:string}>>}
 * @throws {Error} 凭据缺失 / 网络 / API 错误
 */
export async function searchImaKnowledge(query, opts = {}) {
  const { limit = 5 } = opts;
  const creds = getImaCreds();
  if (!creds.clientId || !creds.apiKey) {
    throw new Error('ima 凭据未配置（clientId / apiKey）');
  }

  // 决定实际请求 URL（走 CORS 代理）
  const proxy = getCorsProxyUrl();
  const targetUrl = proxy ? proxy + encodeURIComponent(IMA_SEARCH_URL) : IMA_SEARCH_URL;

  const body = JSON.stringify({
    query,
    cursor: '',
    limit,
    ...(creds.kbIds && creds.kbIds.length > 0 ? { knowledge_base_ids: creds.kbIds } : {}),
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const r = await fetch(targetUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'ima-openapi-clientid': creds.clientId,
        'ima-openapi-apikey': creds.apiKey,
      },
      body,
    });

    clearTimeout(timeout);

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      throw new Error(`ima HTTP ${r.status}: ${errText.slice(0, 200)}`);
    }

    const data = await r.json();
    // ima 返回结构兼容处理（字段名可能为 wiki_list / results / items）
    const list = data.wiki_list || data.results || data.items || data.data || [];
    if (!Array.isArray(list)) return [];

    return list.map((item, idx) => ({
      title: item.title || item.name || `资料 ${idx + 1}`,
      content: item.content || item.summary || item.text || item.snippet || '',
      source: item.source || item.url || item.doc_name || 'ima 知识库',
    })).filter(d => d.content); // 过滤空内容
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      throw new Error('ima 检索超时 (12s)');
    }
    if (e.message === 'Failed to fetch') {
      throw new Error(`ima 网络请求被拦截（CORS）。${proxy ? '代理已开启但仍失败，请尝试切换代理。' : '请开启 CORS 代理。'}`);
    }
    throw e;
  }
}

/**
 * 测试 ima 连接（用最小关键词检索一次）
 * @returns {Promise<{ok:boolean, count?:number, error?:string, sample?:any}>}
 */
export async function testImaConnection() {
  if (!hasImaCreds()) {
    return { ok: false, error: 'ima 凭据未配置（clientId / apiKey）' };
  }
  try {
    const docs = await searchImaKnowledge('测试', { limit: 1 });
    return {
      ok: true,
      count: docs.length,
      sample: docs[0] ? { title: docs[0].title } : null,
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * 适配 agentReplyEngine 的检索器签名
 * retriever(query) → [{ title, content, source }]
 */
export async function imaKnowledgeRetriever(query) {
  return searchImaKnowledge(query, { limit: 5 });
}

export default {
  getImaCreds,
  saveImaCreds,
  clearImaCreds,
  hasImaCreds,
  searchImaKnowledge,
  testImaConnection,
  imaKnowledgeRetriever,
};
