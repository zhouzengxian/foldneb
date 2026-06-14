import React, { useState, useEffect } from 'react';
import useNebulaStore from '../store/useNebulaStore.js';
import {
  getImaCreds,
  saveImaCreds,
  clearImaCreds,
  hasImaCreds,
  testImaConnection,
} from '../utils/imaClient.js';
import { hasValidKey, getUnifiedProvider } from '../utils/modelConfig.js';
import ApiSettingsPanel from './ApiSettingsPanel.jsx';

/**
 * 自定义分身 Agent 创建/编辑表单
 *
 * 触发：通过 store.cloneCreatorOpen 状态控制显隐
 * 表单字段：名字 / 头像 emoji / 一句话人设(bio) / 性格风格(style) / 回复模式
 *
 * 业务约束：每个用户仅 1 个分身（customClone 单对象）
 * - 未创建 → 「创建分身」
 * - 已创建 → 「编辑分身」+ 「删除分身」
 */
export default function CloneCreator() {
  const open = useNebulaStore((s) => s.cloneCreatorOpen);
  const setOpen = useNebulaStore((s) => s.setCloneCreatorOpen);
  const customClone = useNebulaStore((s) => s.customClone);
  const createCustomClone = useNebulaStore((s) => s.createCustomClone);
  const updateCustomClone = useNebulaStore((s) => s.updateCustomClone);
  const removeCustomClone = useNebulaStore((s) => s.removeCustomClone);
  const selectAgent = useNebulaStore((s) => s.selectAgent);
  const focusAgent = useNebulaStore((s) => s.focusAgent);

  const isEdit = !!customClone;

  const [form, setForm] = useState({
    name: '',
    avatar: '🪐',
    bio: '',
    style: '',
    replyMode: 'template',
  });

  // ima 知识库配置（独立于 form，因为它是全局凭据而非分身属性）
  const [imaForm, setImaForm] = useState({ clientId: '', apiKey: '', kbIds: '' });
  const [imaTesting, setImaTesting] = useState(false);
  const [imaTestResult, setImaTestResult] = useState(null);
  const [showApiConfig, setShowApiConfig] = useState(false);

  // 打开时同步已有数据
  useEffect(() => {
    if (open && customClone) {
      setForm({
        name: customClone.name || '',
        avatar: customClone.avatar || '🪐',
        bio: customClone.bio || '',
        style: customClone.style || '',
        replyMode: customClone.replyMode || 'template',
      });
    } else if (open && !customClone) {
      setForm({ name: '', avatar: '🪐', bio: '', style: '', replyMode: 'template' });
    }
    // 同步 ima 凭据
    if (open) {
      const c = getImaCreds();
      setImaForm({
        clientId: c.clientId || '',
        apiKey: c.apiKey || '',
        kbIds: (c.kbIds || []).join(','),
      });
      setImaTestResult(null);
    }
  }, [open, customClone]);

  // 测试 ima 连接
  const handleTestIma = async () => {
    if (!imaForm.clientId || !imaForm.apiKey) {
      setImaTestResult({ ok: false, error: '请先填入 clientId 和 apiKey' });
      return;
    }
    // 临时保存再测试
    saveImaCreds(
      imaForm.clientId.trim(),
      imaForm.apiKey.trim(),
      imaForm.kbIds ? imaForm.kbIds.split(',').map(s => s.trim()).filter(Boolean) : []
    );
    setImaTesting(true);
    setImaTestResult(null);
    try {
      const result = await testImaConnection();
      setImaTestResult(result);
    } catch (e) {
      setImaTestResult({ ok: false, error: e.message });
    } finally {
      setImaTesting(false);
    }
  };

  // 保存时同步 ima 凭据
  const persistImaCreds = () => {
    if (imaForm.clientId && imaForm.apiKey) {
      saveImaCreds(
        imaForm.clientId.trim(),
        imaForm.apiKey.trim(),
        imaForm.kbIds ? imaForm.kbIds.split(',').map(s => s.trim()).filter(Boolean) : []
      );
    }
  };

  if (!open) return null;

  const handleSave = () => {
    if (!form.name.trim()) {
      alert('请给分身起个名字');
      return;
    }
    // 保存 ima 凭据（若填了）
    persistImaCreds();
    if (isEdit) {
      updateCustomClone(form);
    } else {
      createCustomClone(form);
    }
    setOpen(false);
    // 选中并聚焦新创建/更新的分身
    setTimeout(() => {
      selectAgent('custom_clone');
      focusAgent('custom_clone');
    }, 100);
  };

  const handleDelete = () => {
    if (!confirm('确定要删除这个分身吗？相关记忆也会一并清除。')) return;
    removeCustomClone();
    setOpen(false);
  };

  const handleClose = () => setOpen(false);

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    background: 'rgba(125,249,255,0.06)',
    border: '1px solid rgba(125,249,255,0.25)',
    borderRadius: 8,
    color: '#e8f4ff',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
  };

  const labelStyle = {
    fontSize: 11,
    color: 'rgba(168,255,245,0.7)',
    letterSpacing: '0.08em',
    marginBottom: 5,
    display: 'block',
  };

  const replyModes = [
    { id: 'template', name: '模板模式', desc: '零配置，关键词匹配兜底' },
    { id: 'llm', name: 'AI 模式', desc: '调用大模型，基于人设回答（需配 API Key）' },
    { id: 'knowledge', name: '知识库模式', desc: '检索 ima 知识库 + 大模型生成（阶段三）' },
  ];

  // 预设模板（一键填入，方便 demo）
  const presetTemplates = [
    {
      label: '星海探索者',
      avatar: '🪐',
      name: '星海探索者',
      bio: '探索者的思想分身，擅长跨界思考',
      style: '深邃、好奇、善于反思，喜欢追问本质，常用比喻和反问引导对方思考',
      replyMode: 'template',
    },
    {
      label: '智慧导师',
      avatar: '🧙',
      name: '智慧导师',
      bio: '耐心的引路人，博学且循循善诱',
      style: '耐心、温暖、博学，擅长把复杂问题拆解成小步骤，多用类比讲道理',
      replyMode: 'template',
    },
    {
      label: '灵感缪斯',
      avatar: '🎨',
      name: '灵感缪斯',
      bio: '点燃创意的灵感精灵',
      style: '奔放、诗意、发散，爱用画面感的语言，鼓励跳跃联想和自由表达',
      replyMode: 'template',
    },
    {
      label: '理性助手',
      avatar: '🤖',
      name: '理性助手',
      bio: '冷静的数据驱动分析官',
      style: '严谨、简洁、结构化，喜欢用要点列表和数字说话，绝不说废话',
      replyMode: 'template',
    },
  ];

  const applyTemplate = (tpl) => {
    setForm({
      name: tpl.name,
      avatar: tpl.avatar,
      bio: tpl.bio,
      style: tpl.style,
      replyMode: tpl.replyMode,
    });
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        pointerEvents: 'auto',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440,
          maxWidth: '92vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(160deg, rgba(20,28,48,0.96), rgba(12,18,36,0.96))',
          border: '1px solid rgba(125,249,255,0.3)',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(125,249,255,0.08)',
          fontFamily: 'inherit',
          color: '#e8f0ff',
        }}
      >
        {/* 标题 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#7DF9FF', letterSpacing: '0.05em' }}>
              {isEdit ? '✏️ 编辑你的分身' : '🪐 创建你的分身'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(168,255,245,0.5)', marginTop: 3 }}>
              专属 Agent · 锚定在你的星体旁 · 青白归属线连接
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent', border: 'none', color: 'rgba(200,210,230,0.6)',
              fontSize: 22, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* 预设模板（一键填入，方便 demo） */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>预设模板 · 一键填入</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {presetTemplates.map((tpl) => {
              const active = form.name === tpl.name && form.avatar === tpl.avatar;
              return (
                <button
                  key={tpl.label}
                  onClick={() => applyTemplate(tpl)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    background: active
                      ? 'rgba(125,249,255,0.16)'
                      : 'rgba(125,249,255,0.04)',
                    border: `1px solid ${
                      active ? 'rgba(125,249,255,0.55)' : 'rgba(125,249,255,0.15)'
                    }`,
                    color: '#e8f4ff',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = 'rgba(125,249,255,0.09)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = 'rgba(125,249,255,0.04)';
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{tpl.avatar}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#cfe8ff' }}>
                    {tpl.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 头像 + 名字 横排 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: '0 0 80px' }}>
            <label style={labelStyle}>头像</label>
            <input
              type="text"
              value={form.avatar}
              onChange={(e) => setForm({ ...form, avatar: e.target.value.slice(0, 4) })}
              style={{ ...inputStyle, textAlign: 'center', fontSize: 24, padding: '6px 8px' }}
              placeholder="🪐"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>名字 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.slice(0, 20) })}
              style={inputStyle}
              placeholder="给你的分身起个名字"
              autoFocus
            />
          </div>
        </div>

        {/* 一句话人设 */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>一句话人设</label>
          <input
            type="text"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value.slice(0, 60) })}
            style={inputStyle}
            placeholder="比如：探索者的思想分身，擅长跨界思考"
          />
        </div>

        {/* 性格风格 */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>性格风格</label>
          <textarea
            value={form.style}
            onChange={(e) => setForm({ ...form, style: e.target.value.slice(0, 120) })}
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical', lineHeight: 1.5 }}
            placeholder="比如：深邃、好奇、善于反思，喜欢追问本质"
          />
        </div>

        {/* 回复模式 */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>回复模式</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {replyModes.map((m) => (
              <label
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background:
                    form.replyMode === m.id
                      ? 'rgba(125,249,255,0.12)'
                      : 'rgba(125,249,255,0.03)',
                  border: `1px solid ${
                    form.replyMode === m.id ? 'rgba(125,249,255,0.5)' : 'rgba(125,249,255,0.12)'
                  }`,
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="radio"
                  name="replyMode"
                  checked={form.replyMode === m.id}
                  onChange={() => setForm({ ...form, replyMode: m.id })}
                  style={{ marginTop: 2, accentColor: '#7DF9FF' }}
                />
                <div>
                  <div style={{ fontSize: 13, color: '#e8f4ff', fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(168,200,230,0.6)', marginTop: 2 }}>
                    {m.desc}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* API 配置（AI 模式 / 知识库模式，复用决策推演同一面板） */}
        {(form.replyMode === 'llm' || form.replyMode === 'knowledge') && !hasValidKey(getUnifiedProvider()) && (
          <div
            style={{
              marginBottom: 20,
              padding: 14,
              background: 'rgba(255,215,0,0.05)',
              borderRadius: 10,
              border: '1px solid rgba(255,215,0,0.2)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#FFD700', marginBottom: 4 }}>
              ⚙️ API Key 未配置
            </div>
            <div style={{ fontSize: 10, color: 'rgba(200,180,140,0.65)', marginBottom: 10, lineHeight: 1.5 }}>
              AI 模式需要配置大模型 API Key。与决策推演共享同一份凭据，配一次全平台可用。
            </div>
            <button
              onClick={() => setShowApiConfig(!showApiConfig)}
              style={{
                padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,180,0,0.1))',
                border: '1px solid rgba(255,215,0,0.35)',
                color: '#FFD700', fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
              }}
            >
              {showApiConfig ? '收起配置' : '⚙️ 配置 API Key'}
            </button>
            {showApiConfig && (
              <div style={{ marginTop: 10 }}>
                <ApiSettingsPanel provider={getUnifiedProvider()} onSaved={() => setShowApiConfig(false)} />
              </div>
            )}
          </div>
        )}

        {/* ima 知识库配置（仅 knowledge 模式显示） */}
        {form.replyMode === 'knowledge' && (
          <div
            style={{
              marginBottom: 20,
              padding: 14,
              background: 'rgba(125,249,255,0.04)',
              borderRadius: 10,
              border: '1px solid rgba(125,249,255,0.18)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7DF9FF', marginBottom: 4 }}>
              📚 腾讯 ima 知识库
            </div>
            <div style={{ fontSize: 10, color: 'rgba(168,200,230,0.55)', marginBottom: 12, lineHeight: 1.5 }}>
              在 ima.qq.com 创建知识库并上传资料，再到开发者后台获取 Client ID / API Key。
              对话时会先检索知识库，再让大模型基于资料回答。
            </div>

            <label style={labelStyle}>Client ID</label>
            <input
              type="text"
              value={imaForm.clientId}
              onChange={(e) => setImaForm({ ...imaForm, clientId: e.target.value })}
              style={{ ...inputStyle, marginBottom: 10, fontFamily: 'monospace', fontSize: 12 }}
              placeholder="ima-openapi-clientid"
            />

            <label style={labelStyle}>API Key</label>
            <input
              type="password"
              value={imaForm.apiKey}
              onChange={(e) => setImaForm({ ...imaForm, apiKey: e.target.value })}
              style={{ ...inputStyle, marginBottom: 10, fontFamily: 'monospace', fontSize: 12 }}
              placeholder="ima-openapi-apikey"
            />

            <label style={labelStyle}>知识库 ID（可选，逗号分隔，留空搜全部）</label>
            <input
              type="text"
              value={imaForm.kbIds}
              onChange={(e) => setImaForm({ ...imaForm, kbIds: e.target.value })}
              style={{ ...inputStyle, marginBottom: 12, fontFamily: 'monospace', fontSize: 12 }}
              placeholder="kb_xxx,kb_yyy"
            />

            <button
              onClick={handleTestIma}
              disabled={imaTesting}
              style={{
                padding: '7px 14px', borderRadius: 6, cursor: imaTesting ? 'wait' : 'pointer',
                background: 'rgba(125,249,255,0.1)',
                border: '1px solid rgba(125,249,255,0.3)',
                color: '#7DF9FF', fontSize: 11, fontWeight: 600,
                fontFamily: 'inherit', opacity: imaTesting ? 0.5 : 1,
              }}
            >
              {imaTesting ? '⏳ 测试中…' : '🔌 测试连接'}
            </button>

            {imaTestResult && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  background: imaTestResult.ok ? 'rgba(100,255,180,0.08)' : 'rgba(255,100,100,0.08)',
                  border: `1px solid ${imaTestResult.ok ? 'rgba(100,255,180,0.3)' : 'rgba(255,100,100,0.3)'}`,
                  color: imaTestResult.ok ? '#88ffbb' : '#ff8888',
                }}
              >
                {imaTestResult.ok
                  ? `✅ 连接成功${imaTestResult.count != null ? `，检索到 ${imaTestResult.count} 条结果` : ''}${
                      imaTestResult.sample?.title ? `（示例：${imaTestResult.sample.title}）` : ''
                    }`
                  : `❌ ${imaTestResult.error}`}
              </div>
            )}
          </div>
        )}

        {/* 按钮区 */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {isEdit && (
            <button
              onClick={handleDelete}
              style={{
                padding: '9px 16px', borderRadius: 8,
                background: 'rgba(255,80,80,0.1)',
                border: '1px solid rgba(255,80,80,0.3)',
                color: '#ff8080', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                marginRight: 'auto',
              }}
            >
              🗑️ 删除分身
            </button>
          )}
          <button
            onClick={handleClose}
            style={{
              padding: '9px 18px', borderRadius: 8,
              background: 'rgba(136,153,204,0.1)',
              border: '1px solid rgba(136,153,204,0.25)',
              color: '#c8d0e0', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '9px 20px', borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(125,249,255,0.25), rgba(125,249,255,0.1))',
              border: '1px solid rgba(125,249,255,0.5)',
              color: '#7DF9FF', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 0 16px rgba(125,249,255,0.2)',
            }}
          >
            {isEdit ? '💾 保存' : '✨ 创建分身'}
          </button>
        </div>
      </div>
    </div>
  );
}
