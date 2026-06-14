import { describe, it, expect, vi } from 'vitest';

// mock 掉有运行时副作用的依赖 —— 被测的三个函数本身不依赖它们
vi.mock('../../store/useNebulaStore.js', () => ({
  default: { getState: () => ({ tier1Agents: [] }) },
}));
vi.mock('../deliberationEngine.js', () => ({ getDeliberationProvider: () => 'zhipu' }));
vi.mock('../modelConfig.js', () => ({ callLLMWithProvider: vi.fn() }));

import {
  resolveAgentId,
  cleanLLMResponse,
  extractRelationFromComment,
} from '../memoryCrystal.js';

describe('memoryCrystal.resolveAgentId —— Agent 别名解析', () => {
  it('精确匹配中文名', () => {
    expect(resolveAgentId('黄仁勋')).toBe('jensen_huang');
    expect(resolveAgentId('马斯克')).toBe('elon_musk');
    expect(resolveAgentId('庄子')).toBe('zhuangzi');
  });

  it('精确匹配英文名（大小写不敏感）', () => {
    expect(resolveAgentId('Elon Musk')).toBe('elon_musk');
    expect(resolveAgentId('elon musk')).toBe('elon_musk');
    expect(resolveAgentId('Jensen Huang')).toBe('jensen_huang');
  });

  it('包含匹配："庄子说" 应解析为 zhuangzi', () => {
    expect(resolveAgentId('庄子说')).toBe('zhuangzi');
    expect(resolveAgentId('马斯克的观点')).toBe('elon_musk');
  });

  it('绰号 / 别名也能命中', () => {
    expect(resolveAgentId('V神')).toBe('vitalik_buterin');
    expect(resolveAgentId('老黄')).toBe('jensen_huang');
    expect(resolveAgentId('KK')).toBe('kevin_kelly');
  });

  it('空值 / 非字符串 / 未知名 应返回 null（必须丢弃，不污染图谱）', () => {
    expect(resolveAgentId('')).toBeNull();
    expect(resolveAgentId(null)).toBeNull();
    expect(resolveAgentId(undefined)).toBeNull();
    expect(resolveAgentId(123)).toBeNull();
    expect(resolveAgentId('完全不存在的名字XYZ')).toBeNull();
  });
});

describe('memoryCrystal.cleanLLMResponse —— LLM 输出 JSON 清洗', () => {
  it('剥离 markdown ```json 代码块', () => {
    const raw = '```json\n[{"source":"黄仁勋","target":"马斯克","relation":"算力同盟"}]\n```';
    const r = cleanLLMResponse(raw);
    expect(r).toHaveLength(1);
    expect(r[0].source).toBe('黄仁勋');
  });

  it('纯 JSON 数组原样返回', () => {
    const raw = '[{"source":"A","target":"B","relation":"合作"}]';
    expect(cleanLLMResponse(raw)).toHaveLength(1);
  });

  it('修复尾部多余逗号', () => {
    const raw = '[{"source":"A","target":"B","relation":"R",},]';
    const r = cleanLLMResponse(raw);
    expect(r).toHaveLength(1);
  });

  it('LLM 输出包含解释文字也能提取 JSON', () => {
    const raw = '好的，这是分析结果：\n[{"source":"A","target":"B","relation":"R"}]\n以上是三元组。';
    expect(cleanLLMResponse(raw)).toHaveLength(1);
  });

  it('空输入 / 无法解析的文本 返回空数组', () => {
    expect(cleanLLMResponse('')).toEqual([]);
    expect(cleanLLMResponse(null)).toEqual([]);
    expect(cleanLLMResponse('这完全不是 JSON')).toEqual([]);
    expect(cleanLLMResponse('{not an array}')).toEqual([]);
  });
});

describe('memoryCrystal.extractRelationFromComment —— 关键词关系标签', () => {
  it('关键词命中应返回对应标签', () => {
    expect(extractRelationFromComment('AI 真的改变了世界')).toBe('AI认同');
    expect(extractRelationFromComment('知行合一，事上磨练')).toBe('心学共鸣');
    expect(extractRelationFromComment('CUDA 算力太强了')).toBe('技术认同');
  });

  it('空 / 过短评论应返回兜底 "互动"', () => {
    expect(extractRelationFromComment('')).toBe('互动');
    expect(extractRelationFromComment('a')).toBe('互动');
    expect(extractRelationFromComment(null)).toBe('互动');
  });

  it('无关键词命中时截取前 15 字作为标签', () => {
    const r = extractRelationFromComment('今天天气真好啊出门散步去了');
    expect(r).toBe('今天天气真好啊出门散步去了'.replace(/[@#\s]/g, '').slice(0, 15));
    expect(r.length).toBeLessThanOrEqual(15);
  });
});
