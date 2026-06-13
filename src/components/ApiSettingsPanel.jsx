import { useState, useEffect, useCallback } from 'react';
import {
  MODEL_PROVIDERS, hasValidKey, saveUserCreds, getUserCreds,
  getProviderModels, getCorsProxyUrl, setCorsProxyUrl,
  getRequestPreview, testApiConnection,
} from '../utils/modelConfig';

// 共享 API 设置面板：决策推演 / 时间折叠 都用同一份 UI
// props: provider(当前模型 id), onSaved(保存后回调, 可选)
export default function ApiSettingsPanel({ provider, onSaved }) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showCors, setShowCors] = useState(false);
  const [corsUrl, setCorsUrl] = useState(() => getCorsProxyUrl());

  // provider 叇换时同步本地输入框
  useEffect(() => {
    const ex = getUserCreds(provider);
    setApiKey(ex?.apiKey || '');
    setModel(ex?.model || getProviderModels(provider)[0] || '');
    setTestResult(null);
    setShowPreview(false);
  }, [provider]);

  const fireSaved = () => onSaved && onSaved(provider);

  const handleSave = () => {
    if (!apiKey.trim() || !model.trim()) return;
    saveUserCreds(provider, apiKey.trim(), model.trim());
    setTestResult(null);
    fireSaved();
  };

  const handleClear = () => {
    saveUserCreds(provider, '', '');
    setApiKey('');
    fireSaved();
  };

  const handleTest = useCallback(async () => {
    setTesting(true); setTestResult(null);
    // 测试前先保存（确保测试用的是最新 Key），但不触发 onSaved 关闭面板
    if (apiKey.trim() && model.trim()) {
      saveUserCreds(provider, apiKey.trim(), model.trim());
    }
    setTestResult(await testApiConnection(provider));
    setTesting(false);
  }, [apiKey, model, provider]);

  const name = MODEL_PROVIDERS.find(p => p.id === provider)?.name || provider;
  const models = getProviderModels(provider);
  const canSave = apiKey.trim() && model.trim();
  const canTest = apiKey.trim() && !testing;
  const labelStyle = { color: '#889', fontSize: '11px', fontFamily: 'system-ui', minWidth: '60px', flexShrink: 0 };
  const inputStyle = {
    flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '6px', padding: '6px 10px', color: '#ddd', fontSize: '12px', outline: 'none',
  };
  const btnBase = { borderRadius: '6px', padding: '5px 14px', fontSize: '11px', fontFamily: 'system-ui', cursor: 'pointer' };

  return (
    <>
      <div style={{
        padding: '14px 16px', marginBottom: 14,
        background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '10px',
      }}>
        <div style={{
          color: '#FFD700', fontSize: '12px', fontWeight: 600, fontFamily: 'system-ui',
          marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          🔑 配置 {name} 的 API
          {hasValidKey(provider) && (
            <span style={{ color: '#8e8', fontSize: '10px', fontWeight: 400,
              background: 'rgba(72,196,128,0.12)', padding: '1px 6px', borderRadius: '4px' }}>已配置</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={labelStyle}>API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="sk-xxxxx..." style={{ ...inputStyle, fontFamily: 'monospace' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={labelStyle}>Model</label>
            <select value={model} onChange={e => setModel(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              {models.map(m => (
                <option key={m} value={m} style={{ background: '#1a1a2e', color: '#ddd' }}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={handleClear}
              style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#889' }}
            >清除</button>
            <button onClick={handleSave} disabled={!canSave}
              style={{
                ...btnBase,
                background: canSave ? 'linear-gradient(135deg, rgba(255,215,0,0.25), rgba(255,180,0,0.2))' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${canSave ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: canSave ? '#FFD700' : '#555', fontWeight: 600, cursor: canSave ? 'pointer' : 'default',
              }}
            >💾 保存</button>
          </div>
        </div>

        {/* 请求 JSON 预览 + 测试连接 */}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setShowPreview(s => !s)}
              style={{ ...btnBase, background: 'rgba(100,180,255,0.1)', border: '1px solid rgba(100,180,255,0.2)', color: '#8cf' }}
            >📋 {showPreview ? '隐藏' : '查看'}请求 JSON</button>
            <button onClick={handleTest} disabled={!canTest}
              style={{
                ...btnBase, fontWeight: 600,
                background: canTest ? 'rgba(72,196,128,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${canTest ? 'rgba(72,196,128,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: canTest ? '#8e8' : '#555', cursor: canTest ? 'pointer' : 'default',
              }}
            >{testing ? '⏳ 测试中…' : '🔌 测试连接'}</button>
            <span style={{ color: '#667', fontSize: '10px' }}>(测试前会自动保存当前 Key)</span>
          </div>

          {showPreview && (() => {
            const p = getRequestPreview(provider);
            const fullReq = { method: p.method, url: p.originUrl, targetUrl: p.targetUrl, proxy: p.proxy, headers: p.headers, body: p.body };
            return (
              <pre style={{
                background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '10px 12px',
                fontSize: '10.5px', fontFamily: '"Cascadia Code","Consolas",monospace',
                color: '#9d9', overflow: 'auto', maxHeight: 300,
                border: '1px solid rgba(100,180,255,0.1)', lineHeight: 1.5,
                whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              }}>{JSON.stringify(fullReq, null, 2)}</pre>
            );
          })()}

          {testResult && (
            <div style={{
              marginTop: 8, padding: '10px 12px', borderRadius: '8px',
              background: testResult.ok ? 'rgba(72,196,128,0.08)' : 'rgba(255,80,80,0.08)',
              border: `1px solid ${testResult.ok ? 'rgba(72,196,128,0.25)' : 'rgba(255,80,80,0.25)'}`,
              fontSize: '11px', fontFamily: 'system-ui', lineHeight: 1.6,
            }}>
              {testResult.ok ? (
                <>
                  <div style={{ color: '#8e8', fontWeight: 600, marginBottom: 4 }}>
                    ✅ 连接成功 (HTTP {testResult.status})
                  </div>
                  <div style={{ color: '#aaa' }}>回复：{testResult.content}</div>
                  {testResult.raw && testResult.content === '(无法解析响应)' && (
                    <details style={{ marginTop: 6 }}>
                      <summary style={{ color: '#e88', fontSize: '10px', cursor: 'pointer' }}>
                        ⚠ 无法解析，点击查看原始响应
                      </summary>
                      <pre style={{
                        background: 'rgba(0,0,0,0.5)', marginTop: 4, padding: '8px',
                        fontSize: '10px', fontFamily: 'monospace', color: '#9d9',
                        borderRadius: '4px', overflow: 'auto', maxHeight: 200,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                      }}>{testResult.raw}</pre>
                    </details>
                  )}
                </>
              ) : (
                <>
                  <div style={{ color: '#f88', fontWeight: 600, marginBottom: 4 }}>
                    ❌ 连接失败 {testResult.status > 0 ? `(HTTP ${testResult.status})` : ''}
                  </div>
                  {testResult.url && (
                    <div style={{ color: '#779', fontSize: '10px', marginBottom: 4, wordBreak: 'break-all' }}>
                      请求地址：{testResult.url.slice(0, 120)}
                    </div>
                  )}
                  <div style={{ color: '#e99', fontSize: '10.5px', fontFamily: '"Cascadia Code",monospace', wordBreak: 'break-all' }}>
                    {testResult.error}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CORS 代理 */}
      <div style={{
        padding: '8px 10px', marginBottom: 14,
        background: 'rgba(100,150,255,0.04)', border: '1px solid rgba(100,150,255,0.12)',
        borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 8,
        fontSize: '11px', fontFamily: 'system-ui',
      }}>
        <span style={{ color: '#889', flexShrink: 0, cursor: 'pointer' }}
          onClick={() => setShowCors(!showCors)}
        >🌐 代理 {showCors ? '▲' : '▼'}</span>
        {corsUrl ? (
          <span style={{ color: '#4A8', fontWeight: 600, fontSize: '10px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={corsUrl}>
            ✓ 已启用 ({corsUrl.slice(0, 30)}...)
          </span>
        ) : (
          <span style={{ color: '#e66', fontSize: '10px' }}>⚠ 直连（可能被 CORS 拦截）</span>
        )}
        {showCors && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            <input value={corsUrl} onChange={e => setCorsUrl(e.target.value)}
              placeholder="https://corsproxy.io/?"
              style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '4px', padding: '4px 6px', color: '#ddd', fontSize: '10px',
                fontFamily: 'monospace', outline: 'none' }}
            />
            <button onClick={() => { setCorsProxyUrl(corsUrl); setShowCors(false); }}
              style={{ background: 'rgba(72,196,128,0.2)', border: '1px solid rgba(72,196,128,0.3)',
                borderRadius: '4px', padding: '4px 8px', color: '#8e8',
                fontSize: '10px', cursor: 'pointer', fontFamily: 'system-ui' }}
            >保存</button>
          </div>
        )}
      </div>
    </>
  );
}
