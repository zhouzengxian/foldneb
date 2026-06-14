// ============================================================
// 商业动态逻辑深度分析 · 大模型调用 + Markdown 渲染
// ============================================================
// API 配置复用 modelConfig.js 的 Provider 机制（与决策推演共享）
// ============================================================

import { getEffectiveConfig, getCorsProxyUrl, DEFAULT_PROVIDER_ID } from './modelConfig.js';

const ARCHIVE_PROVIDER_KEY = 'foldneb_archive_provider';

/** 档案使用的 provider（默认智谱，与决策推演共享密钥） */
export function getArchiveProvider() {
  try {
    return localStorage.getItem(ARCHIVE_PROVIDER_KEY) || DEFAULT_PROVIDER_ID;
  } catch {
    return DEFAULT_PROVIDER_ID;
  }
}

/** 设置档案使用的 provider */
export function setArchiveProvider(providerId) {
  try { localStorage.setItem(ARCHIVE_PROVIDER_KEY, providerId); } catch {}
}

/**
 * 调用大模型生成「商业动态逻辑深度分析」
 * @param {Object} agent - gameData 思想者对象
 * @param {Function} onChunk - 可选，流式回调（收到增量文本时触发）
 * @returns {Promise<string>} 完整 markdown 报告
 */
export async function generateBusinessAnalysis(agent, onChunk) {
  const { buildAnalysisPrompt } = await import('./analysisPrompt.js');
  const provider = getArchiveProvider();
  const cfg = getEffectiveConfig(provider);

  if (!cfg.apiKey?.trim()) {
    throw new Error('NO_API_KEY');
  }

  const systemPrompt = buildAnalysisPrompt(agent);

  // CORS 代理（与决策推演共用同一逻辑）
  const proxy = getCorsProxyUrl();
  const originUrl = `${cfg.url.replace(/\/+$/, '')}/chat/completions`;
  const requestUrl = proxy ? `${proxy}${encodeURIComponent(originUrl)}` : originUrl;

  const body = {
    model: cfg.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请现在为 ${agent.name} 生成最新的商业动态逻辑深度分析报告。` },
    ],
    temperature: 0.7,
    stream: !!onChunk,
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${cfg.apiKey}`,
  };
  // corsproxy.io 需要把 Authorization token 放进 X-Requested-Headers 避免被代理丢弃
  if (proxy && proxy.includes('corsproxy.io')) {
    headers['X-Requested-Headers'] = JSON.stringify({ Authorization: `Bearer ${cfg.apiKey}` });
  }

  const resp = await fetch(requestUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`API ${resp.status}: ${txt.slice(0, 200) || resp.statusText}`);
  }

  // 流式
  if (onChunk && resp.body) {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) {
            full += delta;
            onChunk(full);
          }
        } catch { /* 忽略不完整 JSON */ }
      }
    }
    return full;
  }

  // 非流式
  const json = await resp.json();
  return json.choices?.[0]?.message?.content || '';
}

// ============================================================
// 轻量 Markdown → HTML 渲染（不引入依赖）
// 支持：标题 / 段落 / 引用 / 列表 / 表格 / 粗体 / 行内代码 / 代码块 / 分割线
// ============================================================
export function renderMarkdown(md) {
  if (!md) return '';
  // 先转义 HTML
  let s = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const lines = s.split('\n');
  const out = [];
  let i = 0;
  let inCode = false;
  let codeBuf = [];
  let inTable = false;
  let tableRows = [];
  let inUl = false;
  let ulBuf = [];

  const flushUl = () => {
    if (inUl) {
      out.push(`<ul>${ulBuf.join('')}</ul>`);
      ulBuf = [];
      inUl = false;
    }
  };
  const flushTable = () => {
    if (inTable && tableRows.length >= 2) {
      // 第一行表头，第二行分隔符（忽略），其余为数据行
      const header = parseRow(tableRows[0]);
      const body = tableRows.slice(2).map(parseRow);
      let html = '<table><thead><tr>';
      header.forEach((c) => { html += `<th>${c}</th>`; });
      html += '</tr></thead><tbody>';
      body.forEach((row) => {
        html += '<tr>';
        row.forEach((c) => { html += `<td>${c}</td>`; });
        html += '</tr>';
      });
      html += '</tbody></table>';
      out.push(html);
    }
    tableRows = [];
    inTable = false;
  };

  function parseRow(r) {
    return r.replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
  }

  while (i < lines.length) {
    const line = lines[i];

    // 代码块
    if (line.trim().startsWith('```')) {
      if (!inCode) {
        flushUl(); flushTable();
        inCode = true; codeBuf = [];
      } else {
        out.push(`<pre><code>${codeBuf.join('\n')}</code></pre>`);
        inCode = false; codeBuf = [];
      }
      i++; continue;
    }
    if (inCode) { codeBuf.push(line); i++; continue; }

    // 表格（连续的 | 开头行）
    if (line.trim().startsWith('|')) {
      flushUl();
      inTable = true;
      tableRows.push(line.trim());
      i++; continue;
    } else if (inTable) {
      flushTable();
    }

    // 分割线
    if (/^---+\s*$/.test(line.trim())) {
      flushUl();
      out.push('<hr/>');
      i++; continue;
    }

    // 标题
    const hm = line.match(/^(#{1,4})\s+(.*)$/);
    if (hm) {
      flushUl();
      const level = hm[1].length + 2; // # → h3, ## → h4 ...
      out.push(`<h${level}>${inline(hm[2])}</h${level}>`);
      i++; continue;
    }

    // 引用块
    if (line.trim().startsWith('>')) {
      flushUl();
      const buf = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        buf.push(inline(lines[i].trim().replace(/^>\s?/, '')));
        i++;
      }
      out.push(`<blockquote>${buf.join('<br/>')}</blockquote>`);
      continue;
    }

    // 无序列表
    if (/^[-*]\s+/.test(line.trim())) {
      inUl = true;
      ulBuf.push(`<li>${inline(line.trim().replace(/^[-*]\s+/, ''))}</li>`);
      i++; continue;
    } else if (inUl) {
      flushUl();
    }

    // 空行
    if (line.trim() === '') {
      i++; continue;
    }

    // 普通段落
    out.push(`<p>${inline(line)}</p>`);
    i++;
  }

  // 收尾
  if (inCode) out.push(`<pre><code>${codeBuf.join('\n')}</code></pre>`);
  flushUl();
  flushTable();

  return out.join('\n');
}

/** 行内格式：粗体 / 行内代码 / 删除线 */
function inline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>');
}
