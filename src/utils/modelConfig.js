/**
 * 大模型提供商配置 — 统一管理 API 端点、模型、密钥
 * 支持用户自定义 API Key + Model，持久化到 localStorage
 */

export const MODEL_PROVIDERS = [
  {
    id: 'zhipu', name: '智谱 Coding Plan', icon: '🌀', color: '#4A6CF7',
    url: 'https://open.bigmodel.cn/api/coding/paas/v4/chat/completions',
    models: ['glm-4.7', 'glm-4.6v', 'glm-5.1'],
    apiKey: '627824cea92f4732a22d97ed05e8d8dc.sjbv17PHukQQas4O',
  },
  {
    id: 'deepseek', name: 'DeepSeek', icon: '🐋', color: '#4D6BFE',
    url: 'https://api.deepseek.com/v1/chat/completions',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    apiKey: '',
  },
  {
    id: 'kimi', name: 'Kimi', icon: '🌙', color: '#8B5CF6',
    url: 'https://api.moonshot.cn/v1/chat/completions',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    apiKey: '',
  },
  {
    id: 'mimo', name: '小米 MiMo', icon: '⚡', color: '#FF8C42',
    url: 'https://api.xiaomimomo.com/v1/chat/completions',
    models: ['mimo-v2-flash'],
    apiKey: 'sk-kzq0ujb0gyyfq6dch8oz9pknar3ep9qemfl6p9mxrh4wnhfy',
  },
  {
    id: 'minimax', name: 'MiniMax', icon: '🌟', color: '#F59E0B',
    url: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    models: ['abab6.5s-chat', 'abab7-chat-preview'],
    apiKey: '',
  },
];

export const DEFAULT_PROVIDER_ID = 'zhipu';

// ===== localStorage 持久化 =====
const STORAGE_KEY = 'foldneb_model_creds';

function loadCreds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

function saveCreds(creds) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(creds)); } catch {}
}

/**
 * 获取用户对指定 provider 的自定义凭据
 * 返回 { apiKey, model } 或 null
 */
export function getUserCreds(providerId) {
  const all = loadCreds();
  return all[providerId] || null;
}

/**
 * 保存用户凭据
 */
export function saveUserCreds(providerId, apiKey, model) {
  const all = loadCreds();
  all[providerId] = { apiKey, model };
  saveCreds(all);
}

/**
 * 删除用户凭据
 */
export function deleteUserCreds(providerId) {
  const all = loadCreds();
  delete all[providerId];
  saveCreds(all);
}

/**
 * 获取 provider 的有效配置（默认 + 用户覆盖）
 */
/** 根据 providerId 获取配置 */
export function getProviderById(id) {
  return MODEL_PROVIDERS.find(p => p.id === id) || MODEL_PROVIDERS.find(p => p.id === DEFAULT_PROVIDER_ID);
}

export function getEffectiveConfig(providerId) {
  const base = MODEL_PROVIDERS.find(p => p.id === providerId);
  if (!base) base = MODEL_PROVIDERS.find(p => p.id === DEFAULT_PROVIDER_ID);
  const user = getUserCreds(providerId);
  return {
    url: base.url,
    apiKey: user?.apiKey || base.apiKey || '',
    model: user?.model || base.models?.[0] || '',
    name: base.name,
  };
}

/**
 * 检查 provider 是否有可用密钥
 */
export function hasValidKey(providerId) {
  const cfg = getEffectiveConfig(providerId);
  return cfg.apiKey && cfg.apiKey.length > 10 && !cfg.apiKey.includes('your-key');
}

// ===== LLM 调用 =====
export function getProviderModels(providerId) {
  const base = MODEL_PROVIDERS.find(p => p.id === providerId);
  return base?.models || [];
}

export async function callLLMWithProvider(providerId, systemPrompt, userPrompt, options = {}) {
  const cfg = getEffectiveConfig(providerId);
  if (!cfg.apiKey || cfg.apiKey.length < 10) {
    console.error(`[${providerId}] 未设置 API Key`);
    return null;
  }

  const { temperature = 0.7, maxTokens = 800, timeoutMs = 20000 } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isOpenAIFormat = !cfg.url.includes('minimax.chat');

    let body;
    if (isOpenAIFormat) {
      body = JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature, max_tokens: maxTokens,
      });
    } else {
      body = JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature, max_tokens: maxTokens,
        reply_constraints: { sender_type: 'BOT', sender_name: '助手' },
      });
    }

    const r = await fetch(cfg.url, {
      method: 'POST', signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`,
      },
      body,
    });

    clearTimeout(timeout);

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.error(`[${cfg.name}] API ${r.status}:`, errText.slice(0, 200));
      return null;
    }

    const d = await r.json();
    if (isOpenAIFormat) {
      return d.choices?.[0]?.message?.content || '';
    } else {
      return d.choices?.[0]?.messages?.[0]?.text || d.reply || '';
    }
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') console.warn(`[${providerId}] LLM 超时`);
    else console.error(`[${providerId}] LLM 错误:`, e.message);
    return null;
  }
}

export default MODEL_PROVIDERS;
