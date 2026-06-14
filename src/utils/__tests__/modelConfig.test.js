import { describe, it, expect, beforeEach } from 'vitest';
import {
  MODEL_PROVIDERS,
  DEFAULT_PROVIDER_ID,
  getProviderById,
  hasValidKey,
  getEffectiveConfig,
  LLMUnavailableError,
} from '../modelConfig.js';

describe('modelConfig —— 大模型提供商配置', () => {
  it('应有 5 家预置 provider', () => {
    expect(MODEL_PROVIDERS.length).toBeGreaterThanOrEqual(5);
    const ids = MODEL_PROVIDERS.map((p) => p.id);
    expect(ids).toContain('zhipu');
    expect(ids).toContain('deepseek');
    expect(ids).toContain('kimi');
    expect(ids).toContain('minimax');
  });

  it('每个 provider 必须含 url / models / name', () => {
    MODEL_PROVIDERS.forEach((p) => {
      expect(p.url).toBeTruthy();
      expect(p.url).toMatch(/^https?:\/\//);
      expect(Array.isArray(p.models)).toBe(true);
      expect(p.models.length).toBeGreaterThan(0);
      expect(p.name).toBeTruthy();
    });
  });

  it('默认 provider 应为 zhipu（GLM）', () => {
    expect(DEFAULT_PROVIDER_ID).toBe('zhipu');
  });
});

describe('modelConfig.getProviderById —— provider 查询', () => {
  it('有效 id 返回对应 provider', () => {
    const p = getProviderById('deepseek');
    expect(p.id).toBe('deepseek');
    expect(p.name).toBe('DeepSeek');
  });

  it('无效 id 应 fallback 到默认 provider（zhipu），而非 undefined', () => {
    const p = getProviderById('this_provider_does_not_exist');
    expect(p).toBeDefined();
    expect(p.id).toBe(DEFAULT_PROVIDER_ID);
  });
});

describe('modelConfig.hasValidKey —— 密钥校验', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('未保存凭据的 provider（默认 apiKey 为空）应返回 falsy', () => {
    // 注：源码用 && 链返回 falsy 值（如 ''），UI 用 if 判断不受影响
    expect(hasValidKey('deepseek')).toBeFalsy();
    expect(hasValidKey('kimi')).toBeFalsy();
  });

  it('保存过短 key (<10 字符) 应返回 falsy', () => {
    localStorage.setItem('foldneb_model_creds', JSON.stringify({
      deepseek: { apiKey: 'short', model: 'deepseek-chat' },
    }));
    expect(hasValidKey('deepseek')).toBeFalsy();
  });

  it('保存过占位 key（含 "your-key"）应返回 falsy', () => {
    localStorage.setItem('foldneb_model_creds', JSON.stringify({
      kimi: { apiKey: 'your-key-1234567890', model: 'moonshot-v1-8k' },
    }));
    expect(hasValidKey('kimi')).toBeFalsy();
  });
});

describe('modelConfig.getEffectiveConfig —— 有效配置合成', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('未覆盖时返回 provider 默认 model', () => {
    const cfg = getEffectiveConfig('deepseek');
    expect(cfg.model).toBe('deepseek-chat');
    expect(cfg.name).toBe('DeepSeek');
  });

  it('用户保存的 model 在可用列表中时应被采用', () => {
    localStorage.setItem('foldneb_model_creds', JSON.stringify({
      deepseek: { apiKey: 'sk-xxx', model: 'deepseek-reasoner' },
    }));
    const cfg = getEffectiveConfig('deepseek');
    expect(cfg.model).toBe('deepseek-reasoner');
  });

  it('用户保存的 model 已不在可用列表时，应回退到 provider 默认 model（防止 404）', () => {
    localStorage.setItem('foldneb_model_creds', JSON.stringify({
      deepseek: { apiKey: 'sk-xxx', model: 'deepseek-removed-old-model' },
    }));
    const cfg = getEffectiveConfig('deepseek');
    expect(cfg.model).toBe('deepseek-chat'); // 回退到默认第一个
  });
});

describe('modelConfig.LLMUnavailableError', () => {
  it('应是 Error 子类，name 标识明确', () => {
    const e = new LLMUnavailableError('超时');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('LLMUnavailableError');
    expect(e.message).toBe('超时');
  });

  it('无 message 时应有兜底文案', () => {
    const e = new LLMUnavailableError();
    expect(e.message).toBeTruthy();
  });
});
