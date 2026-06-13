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

// ===== CORS 代理配置 =====
// 浏览器直接请求外部 API 会触发 CORS 拦截（尤其在 GitHub Pages 静态托管下）
// 可选代理：
//   'https://corsproxy.io/?'       — 免费，支持 POST + Header 转发
//   'https://api.allorigins.win/raw?url=' — 备用（仅 GET）
// 设为空字符串 '' 则直连（本地开发通常没问题）
let _corsProxyUrl = '';

/** 自动检测：非 localhost 环境下默认启用代理 */
function detectShouldUseProxy() {
  try {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) return false;
    return true;
  } catch { return false; }
}

export function getCorsProxyUrl() {
  // 从 localStorage 读取用户设置，其次用默认值
  try {
    const saved = localStorage.getItem('foldneb_cors_proxy');
    if (saved !== null) return saved; // 用户明确设置过
  } catch {}
  return detectShouldUseProxy() ? 'https://corsproxy.io/?' : '';
}

export function setCorsProxyUrl(url) {
  try { localStorage.setItem('foldneb_cors_proxy', url || ''); } catch {}
  _corsProxyUrl = url || '';
}

// 初始化
_corsProxyUrl = getCorsProxyUrl();

/** 获取最近的 API 错误信息 */
let _lastApiError = null;
export function getLastApiError() { return _lastApiError; }
export function clearLastApiError() { _lastApiError = null; }

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
    _lastApiError = `[${cfg.name}] 未设置 API Key，请在设置中配置`;
    console.error(_lastApiError);
    return null;
  }

  const { temperature = 0.7, maxTokens = 800, timeoutMs = 30000 } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // 决定实际请求 URL（是否走代理）
  const proxy = _corsProxyUrl || getCorsProxyUrl();
  const targetUrl = proxy ? proxy + encodeURIComponent(cfg.url) : cfg.url;

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

    const r = await fetch(targetUrl, {
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
      _lastApiError = `[${cfg.name}] HTTP ${r.status}: ${errText.slice(0, 150)}`;
      console.error(_lastApiError);
      return null;
    }

    const d = await r.json();
    _lastApiError = null;
    if (isOpenAIFormat) {
      return d.choices?.[0]?.message?.content || '';
    } else {
      return d.choices?.[0]?.messages?.[0]?.text || d.reply || '';
    }
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      _lastApiError = `[${cfg.name}] 请求超时 (${timeoutMs/1000}s)，请检查网络或尝试切换模型`;
    } else if (e.message === 'Failed to fetch') {
      _lastApiError = `[${cfg.name}] 网络请求被浏览器拦截（CORS 跨域限制）。${proxy ? '代理已开启但仍失败，请尝试切换代理地址。' : '请开启 CORS 代理以绕过跨域限制。'}`;
    } else {
      _lastApiError = `[${cfg.name}] 网络错误: ${e.message}`;
    }
    console.error(_lastApiError);
    return null;
  }
}

export default MODEL_PROVIDERS;
