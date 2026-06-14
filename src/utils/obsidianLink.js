// Obsidian URI 工具
// 用于构造从星图跳转到 Obsidian vault 中对应 Agent 档案的链接

// Obsidian 主 vault 名称
const VAULT_NAME = 'AI一人公司';
// agent 数据库在 vault 内的相对路径前缀
const DB_PREFIX = '11-黑客松大赛/折叠星云agent数据库';

// district ID → 坊区文件夹名（与 Obsidian vault 目录结构同构）
const DISTRICT_FOLDERS = {
  ai_frontier:          '1-AI前沿',
  cognition_decision:   '2-认知决策',
  strategy_game:        '3-战略博弈',
  capital_cycle:        '4-资本周期',
  complex_systems:      '5-复杂系统',
  network_platform:     '6-网络与平台',
  product_design:       '7-产品与设计',
  china_contemporary:   '8-中国当代',
  thought_source:       '9-思想源流',
  ai_narrative:         '10-AI叙事场',
  cross_domain:         '11-跨界之眼',
  knowledge_hub:        '12-知识枢纽',
  grassroots_power:     '13-草根力量',
};

/**
 * 根据 Agent 对象构造 Obsidian 跳转 URI
 * @param {Object} agent - Agent 对象（需含 name, district, tier 字段）
 * @returns {string|null} obsidian:// URI 或 null
 */
export function getObsidianUri(agent) {
  if (!agent || !agent.name || !agent.district) return null;

  const folderName = DISTRICT_FOLDERS[agent.district];
  if (!folderName) {
    console.warn('[ObsidianLink] 未找到坊区映射:', agent.district);
    return null;
  }

  let filePath;
  if (agent.tier === 2) {
    filePath = `${DB_PREFIX}/2_精英星团/${folderName}/_旧版遗珍/${sanitizeFileName(agent.name)}.md`;
  } else {
    filePath = `${DB_PREFIX}/1_智慧星河/${folderName}/${sanitizeFileName(agent.name)}.md`;
  }

  // 使用 vault 参数 + vault 内完整相对路径
  const uri = `obsidian://open?vault=${encodeURIComponent(VAULT_NAME)}&file=${encodeURIComponent(filePath)}`;
  console.log('[ObsidianLink] URI:', uri);
  return uri;
}

/**
 * 跳转到 Obsidian
 * @param {Object} agent
 * @returns {true|'copied'|false}
 */
export function openInObsidian(agent) {
  const uri = getObsidianUri(agent);
  if (!uri) return false;

  // 方案1: window.open（浏览器对协议跳转支持最好）
  try {
    const w = window.open(uri, '_blank');
    if (w) {
      // 延迟关闭空窗口（部分浏览器会打开空白页）
      setTimeout(() => { try { w.close(); } catch {} }, 500);
      return true;
    }
  } catch {}

  // 方案2: location.href
  try {
    window.location.href = uri;
    return true;
  } catch {}

  // 方案3: 创建隐藏 a 标签点击
  try {
    const a = document.createElement('a');
    a.href = uri;
    a.target = '_blank';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {}

  // fallback: 复制到剪贴板
  try {
    navigator.clipboard.writeText(uri);
    return 'copied';
  } catch {
    return false;
  }
}

/** 文件名安全化 */
function sanitizeFileName(name) {
  return name.replace(/[<>:"/\\|?*]/g, '-').trim();
}

/**
 * 异步尝试打开 Obsidian，通过 visibilitychange 判定是否真的切换到了 Obsidian app。
 * 用于在线 Demo 环境：评委若没装 Obsidian，1.5s 内不会发生页面隐藏 → 触发 fallback。
 *
 * @param {Object} agent
 * @param {Object} handlers - { onSuccess(), onFallback() }
 *   onSuccess: 检测到页面被隐藏（说明 Obsidian 真的打开了）
 *   onFallback: 1.5s 内页面仍可见（说明没装 Obsidian 或被浏览器拦截）
 */
export function tryOpenObsidianWithFallback(agent, { onSuccess, onFallback } = {}) {
  const uri = getObsidianUri(agent);
  if (!uri) {
    onFallback?.();
    return;
  }

  let resolved = false;
  const TIMEOUT_MS = 1500;

  const cleanup = () => {
    document.removeEventListener('visibilitychange', onVisChange);
  };

  const onVisChange = () => {
    // 页面被隐藏 = 外部 app（Obsidian）成功接管
    if (document.hidden && !resolved) {
      resolved = true;
      cleanup();
      onSuccess?.();
    }
  };

  document.addEventListener('visibilitychange', onVisChange);

  // 触发协议跳转（用 location.href 更隐蔽，不会开空白窗口）
  try {
    window.location.href = uri;
  } catch {
    cleanup();
    onFallback?.();
    return;
  }

  // 超时未切换 → 判定 Obsidian 不存在
  setTimeout(() => {
    if (!resolved) {
      cleanup();
      onFallback?.();
    }
  }, TIMEOUT_MS);
}

export { DISTRICT_FOLDERS, VAULT_NAME };
