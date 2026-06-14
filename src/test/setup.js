// Vitest 全局 setup —— 为 node 环境补齐浏览器全局对象
// 项目里 modelConfig.js / useNebulaStore.js 模块加载时即访问 localStorage / window
// 这里做最小化 stub，保证纯函数可被 import 测试

const _store = new Map();

globalThis.localStorage = {
  getItem: (key) => (_store.has(key) ? _store.get(key) : null),
  setItem: (key, value) => { _store.set(key, String(value)); },
  removeItem: (key) => { _store.delete(key); },
  clear: () => { _store.clear(); },
};

// modelConfig.detectShouldUseProxy 会访问 window.location.hostname
globalThis.window = globalThis.window || {};
globalThis.window.location = { hostname: 'localhost' };
