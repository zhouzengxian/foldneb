/**
 * FoldNeb — 多模型配置（同 wen-agent-city 验证过的方案）
 */
export const MODEL_PROVIDERS = [
  {
    id: 'zhipu', name: '智谱', icon: '🌀', color: '#4A6CF7',
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
    id: 'mimo', name: 'MiMo', icon: '⚡', color: '#FF8C42',
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

const DEFAULT_PROVIDER_ID = 'zhipu';

// localStorage
const STORAGE_KEY = 'foldneb_model_creds';

function loadCreds() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
function saveCreds(c) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch {} }

export function getUserCreds(pid) { return loadCreds()[pid] || null; }
export function saveUserCreds(pid, apiKey, model) {
  const all = loadCreds(); all[pid] = { apiKey, model }; saveCreds(all);
}
export function getProviderById(id) {
  return MODEL_PROVIDERS.find(p => p.id === id) || MODEL_PROVIDERS.find(p => p.id === DEFAULT_PROVIDER_ID);
}
export function getEffectiveConfig(pid) {
  const base = getProviderById(pid);
  const user = getUserCreds(pid);
  return { url: base.url, apiKey: user?.apiKey || base.apiKey || '', model: user?.model || base.models[0] || '', name: base.name };
}
export function hasValidKey(pid) {
  const c = getEffectiveConfig(pid); return c.apiKey && c.apiKey.length > 10;
}
export function getProviderModels(pid) { return getProviderById(pid).models || []; }

export async function callLLM(pid, systemPrompt, userPrompt, opts = {}) {
  const cfg = getEffectiveConfig(pid);
  if (!cfg.apiKey || cfg.apiKey.length < 10) { console.error(`[${pid}] 无API Key`); return null; }

  const { temperature = 0.7, maxTokens = 800, timeoutMs = 20000 } = opts;
  const ctrl = new AbortController();
  const tmr = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const isOpenAI = !cfg.url.includes('minimax.chat');
    let body;

    if (isOpenAI) {
      body = JSON.stringify({
        model: cfg.model,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature, max_tokens: maxTokens,
      });
    } else {
      body = JSON.stringify({
        model: cfg.model,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature, max_tokens: maxTokens,
        reply_constraints: { sender_type: 'BOT', sender_name: '助手' },
      });
    }

    const r = await fetch(cfg.url, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.apiKey}` },
      body,
    });
    clearTimeout(tmr);
    if (!r.ok) { console.error(`[${cfg.name}] ${r.status}`); return null; }
    const d = await r.json();
    if (isOpenAI) return d.choices?.[0]?.message?.content || '';
    return d.choices?.[0]?.messages?.[0]?.text || d.reply || '';
  } catch (e) {
    clearTimeout(tmr);
    if (e.name !== 'AbortError') console.error(`[${cfg.name}]`, e.message);
    return null;
  }
}
