// 时间折叠子组件：表单、运行视图、信件卡片、共用 helpers
import { useState, useRef } from 'react';
import { callLLMWithProvider } from '../utils/modelConfig';
import { getTemporalProvider } from '../utils/temporalEngine';

export const btn = (color) => ({
  background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}55`,
  borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
  color, fontSize: '12px', fontFamily: 'system-ui', transition: 'all 0.2s',
});

export const SENTIMENT_META = {
  support: { label: '鼓励去做', icon: '🚀', color: '#66BB6A' },
  warn:    { label: '警示风险', icon: '⚠️', color: '#EF5350' },
  reframe: { label: '重新框定', icon: '🔄', color: '#42A5F5' },
  letgo:   { label: '劝你放下', icon: '🍃', color: '#AB47BC' },
};

export const VERDICT_META = {
  do:       { label: '该做',     icon: '✅', color: '#66BB6A' },
  beware:   { label: '警惕短视', icon: '⚠️', color: '#FF9800' },
  longterm: { label: '长期主义', icon: '🌱', color: '#42A5F5' },
  avoid:    { label: '该避开',   icon: '🚫', color: '#EF5350' },
};

export function SectionTitle({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px' }}>
      <span style={{ fontSize: '15px' }}>{icon}</span>
      <span style={{ color: '#ccd', fontSize: '13px', fontWeight: 700, fontFamily: 'system-ui', letterSpacing: '0.03em' }}>{text}</span>
    </div>
  );
}

export function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <label style={{ display: 'block', marginBottom: 4, color: '#99aabb', fontSize: '11px', fontFamily: 'system-ui' }}>{label}</label>
      {children}
    </div>
  );
}

// ============== idle 表单 ==============
export function IdleForm({ profile, updateField, error, onStart, onPreset, hasKey, presets, demoMode }) {
  const fs = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px', padding: '10px 12px', color: '#ddd', fontSize: '13px',
    fontFamily: 'system-ui', outline: 'none', width: '100%', resize: 'vertical',
  };
  const missingRequired = !profile.currentSituation.trim() || !profile.keyDecision.trim();
  const disabled = missingRequired || !hasKey;
  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ padding: '12px 16px', marginBottom: 16, background: 'rgba(68,136,255,0.06)',
        border: '1px solid rgba(68,136,255,0.2)', borderRadius: '10px', fontSize: '12.5px',
        color: '#aaccee', lineHeight: 1.7, fontFamily: 'system-ui' }}>
        ⏳ <b style={{ color: '#8cf' }}>时间折叠</b>不是请别人出主意，而是让 <b>1年/3年/5年/10年后
        的你</b> 回看现在的纠结。他们会基于你的处境，写出截然不同的判断，甚至彼此反驳。
        最后收束成「时间锚点矩阵」——告诉你哪些选择经得起时间的检验。
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ color: '#889', fontSize: '12px', alignSelf: 'center' }}>示例：</span>
        {presets.map((p, i) => (
          <button key={i} onClick={() => onPreset(p)} style={btn('#8cf')}>{p.icon} {p.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="🏷️ 你的称呼（可选）">
          <input style={fs} value={profile.name} onChange={e => updateField('name', e.target.value)} placeholder="探索者" />
        </Field>
        <Field label="🎯 你的目标 / 想达到的状态">
          <input style={fs} value={profile.goal} onChange={e => updateField('goal', e.target.value)} placeholder="3年内……" />
        </Field>
        <Field label="📍 现状（必填）" full>
          <textarea rows={2} style={fs} value={profile.currentSituation} onChange={e => updateField('currentSituation', e.target.value)} placeholder="你现在处于什么处境？" />
        </Field>
        <Field label="😰 最大的担忧 / 害怕" full>
          <textarea rows={2} style={fs} value={profile.biggestFear} onChange={e => updateField('biggestFear', e.target.value)} placeholder="你最怕发生的事是什么？" />
        </Field>
        <Field label="⚖️ 当下纠结的关键决策（必填）" full>
          <textarea rows={2} style={fs} value={profile.keyDecision} onChange={e => updateField('keyDecision', e.target.value)} placeholder="你正在纠结要不要做的那个选择是什么？" />
        </Field>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(239,83,80,0.1)',
          border: '1px solid rgba(239,83,80,0.3)', borderRadius: '8px',
          color: '#f99', fontSize: '12px', fontFamily: 'system-ui' }}>⚠ {error}</div>
      )}

      <button onClick={onStart} disabled={disabled} style={{
        marginTop: 18, width: '100%', padding: '12px',
        background: demoMode
          ? 'linear-gradient(135deg, rgba(72,196,128,0.25), rgba(72,180,128,0.18))'
          : 'linear-gradient(135deg, rgba(255,215,0,0.25), rgba(255,180,0,0.18))',
        border: `1px solid ${demoMode ? 'rgba(72,196,128,0.45)' : 'rgba(255,215,0,0.45)'}`,
        borderRadius: '10px',
        color: demoMode ? '#8e8' : '#FFD700', fontSize: '14px', fontFamily: 'system-ui', fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
      }}>{demoMode ? '🎬 播放演示' : '⏳ 开始时间折叠'}</button>
      {!hasKey && !demoMode && (
        <div style={{ marginTop: 8, textAlign: 'center', color: '#889', fontSize: '11px', fontFamily: 'system-ui' }}>
          💡 当前模型未配置 Key，请先在「决策推演」面板的 ⚙️ 配置 API（两者共享密钥）
        </div>
      )}
    </div>
  );
}

// ============== 运行中视图 ==============
const PHASE_LABELS = {
  generating: '生成未来的自我', writing: '书写跨时空来信',
  reviewing: '未来版本互评', anchoring: '收束时间锚点',
};

export function RunningView({ logs, phase, session }) {
  return (
    <div>
      <div style={{ padding: '12px 16px', marginBottom: 16, background: 'rgba(255,215,0,0.04)',
        border: '1px solid rgba(255,215,0,0.2)', borderRadius: '10px', fontSize: '12px',
        color: '#ccbb88', fontFamily: 'system-ui', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ animation: 'spin 2s linear infinite', display: 'inline-block' }}>🌀</span>
        正在折叠时间线… {PHASE_LABELS[phase]}
      </div>
      <div style={{ padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
        {logs.map((l, i) => (
          <div key={i} style={{ fontSize: '12px', fontFamily: 'system-ui', padding: '3px 0',
            color: l.type === 'success' ? '#8e8' : l.type === 'warn' ? '#e99' : '#aab' }}>{l.text}</div>
        ))}
      </div>
      {session?.letters?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {session.letters.map((letter, i) => (
            <LetterCard key={i} letter={letter} self={session.selves?.find(s => s.id === letter.from)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============== 信件卡片（含追问对话） ==============
export function LetterCard({ letter, self }) {
  const sm = SENTIMENT_META[letter.sentiment] || SENTIMENT_META.reframe;
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');
    setMessages(m => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const system = `你是「${letter.fromLabel}」——${self?.years || letter.fromYears}年后的我。
人格状态：心境=${self?.mood || ''}；已经历=${(self?.keyEvents || []).join('；')}；心智=${self?.mindset || ''}；语气=${self?.tone || ''}。
请以这个未来身份回答"现在的自己"的提问。保持人格一致，具体而非泛泛，150字内。`;
      const reply = await callLLMWithProvider(getTemporalProvider(), system, text, { temperature: 0.85, maxTokens: 300, timeoutMs: 15000 });
      setMessages(m => [...m, { role: 'future', text: reply || '……（沉默）' }]);
    } catch {
      setMessages(m => [...m, { role: 'future', text: '连接中断，稍后再问吧。' }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div style={{ padding: '16px', borderRadius: '12px',
      background: `linear-gradient(135deg, ${letter.color}11, rgba(20,20,40,0.4))`,
      border: `1px solid ${letter.color}44`, animation: 'fadeIn 0.4s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: letter.color, display: 'inline-block' }} />
          <span style={{ color: letter.color, fontWeight: 700, fontSize: '13px', fontFamily: 'system-ui' }}>{letter.fromLabel}</span>
          <span style={{ color: '#667', fontSize: '10px', fontFamily: 'system-ui' }}>→ 给现在的你</span>
        </div>
        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
          background: `${sm.color}22`, color: sm.color, fontFamily: 'system-ui' }}>{sm.icon} {sm.label}</span>
      </div>
      <div style={{ color: '#eee', fontSize: '14px', fontWeight: 600, marginBottom: 6, fontFamily: '"Noto Serif SC", serif' }}>
        《{letter.title}》
      </div>
      <div style={{ color: '#ccd', fontSize: '13px', lineHeight: 1.75, fontFamily: '"Noto Serif SC", serif', whiteSpace: 'pre-wrap' }}>
        {letter.content}
      </div>
      {self?.mindset && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '11px', color: '#778', fontFamily: 'system-ui', fontStyle: 'italic' }}>{self.mindset}</div>
      )}

      {/* 追问按钮 */}
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => { setShowChat(!showChat); setTimeout(() => inputRef.current?.focus(), 50); }}
          style={{
            background: showChat ? `${letter.color}22` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${showChat ? letter.color : 'rgba(255,255,255,0.1)'}55`,
            borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
            color: showChat ? letter.color : '#889', fontSize: '12px', fontFamily: 'system-ui',
            transition: 'all 0.2s',
          }}>
          💬 {showChat ? '收起' : `追问${letter.fromLabel.replace('后的我', '')}`}
        </button>

        {/* 内联聊天面板 */}
        {showChat && (
          <div style={{
            marginTop: 10, borderRadius: '10px', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)',
          }}>
            {/* 消息区 */}
            <div style={{ padding: '10px 12px', maxHeight: 180, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.length === 0 && (
                <div style={{ color: '#667', fontSize: '11px', fontFamily: 'system-ui', textAlign: 'center' }}>
                  追问这个时间点的自己——TA 会基于已经历的事回答你
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%', padding: '6px 10px', borderRadius: '10px',
                  background: m.role === 'user' ? 'rgba(68,136,255,0.15)' : `${letter.color}15`,
                  border: `1px solid ${m.role === 'user' ? 'rgba(68,136,255,0.3)' : letter.color}33`,
                  fontSize: '12px', lineHeight: 1.55, fontFamily: 'system-ui',
                  color: m.role === 'user' ? '#aaccee' : '#ccd',
                }}>
                  {m.role === 'future' && (
                    <span style={{ fontSize: '10px', color: letter.color, display: 'block', marginBottom: 2 }}>{letter.fromLabel}</span>
                  )}
                  {m.text}
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', padding: '6px 10px', color: '#889', fontSize: '12px', fontFamily: 'system-ui' }}>
                  正在回应…
                </div>
              )}
            </div>

            {/* 输入区 */}
            <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <input ref={inputRef} value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKey} placeholder="追问这个未来的自己…"
                disabled={loading}
                style={{
                  flex: 1, padding: '8px 12px', border: 'none', outline: 'none',
                  background: 'rgba(255,255,255,0.03)', color: '#ddd', fontSize: '12px', fontFamily: 'system-ui',
                }} />
              <button onClick={handleSend} disabled={loading || !chatInput.trim()}
                style={{
                  padding: '8px 14px', border: 'none', cursor: loading ? 'wait' : 'pointer',
                  background: loading ? 'rgba(255,255,255,0.03)' : `${letter.color}33`,
                  color: loading ? '#667' : letter.color, fontSize: '13px',
                  opacity: loading || !chatInput.trim() ? 0.5 : 1,
                }}>➤</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============== 跨时间互评卡片 ==============
export function CrossReviewCard({ review, selves }) {
  const reviewer = selves?.find(s => s.id === review.from);
  const target = selves?.find(s => s.id === review.to);
  const icon = review.agreement === 'agree' ? '🤝 同意' : review.agreement === 'disagree' ? '⚡ 反对' : '🔁 部分';
  return (
    <div style={{ padding: '12px 14px', borderRadius: '10px',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: '12px', fontFamily: 'system-ui' }}>
        <span style={{ color: reviewer?.color || '#ccc', fontWeight: 600 }}>{review.fromLabel}</span>
        <span style={{ color: '#667' }}>评价</span>
        <span style={{ color: target?.color || '#ccc', fontWeight: 600 }}>{review.toLabel}</span>
        <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.06)', color: '#aac', fontSize: '10px' }}>{icon}</span>
      </div>
      <div style={{ color: '#ccd', fontSize: '13px', lineHeight: 1.7, fontFamily: '"Noto Serif SC", serif' }}>{review.comment}</div>
    </div>
  );
}

// ============== 锚点卡片 ==============
export function AnchorCard({ anchor, selves, onClick, expanded, trace }) {
  const vm = VERDICT_META[anchor.verdict] || VERDICT_META.beware;
  const label = (id) => selves?.find(s => s.id === id)?.label?.replace('后的我', '') || '';
  return (
    <div>
      <div onClick={onClick} style={{ padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
        background: `linear-gradient(135deg, ${vm.color}10, rgba(20,20,40,0.3))`,
        border: `1px solid ${expanded ? vm.color : vm.color}${expanded ? '88' : '44'}`,
        transition: 'border-color 0.2s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ color: '#eee', fontSize: '14px', fontWeight: 600, fontFamily: 'system-ui' }}>{anchor.decision}</div>
          <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontFamily: 'system-ui',
            background: `${vm.color}22`, color: vm.color }}>{vm.icon} {vm.label}</span>
        </div>
        <div style={{ color: '#bbc', fontSize: '12px', lineHeight: 1.6, fontFamily: 'system-ui', marginBottom: 8 }}>{anchor.reasoning}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontFamily: 'system-ui' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {anchor.endorsers.length > 0 && <span style={{ color: '#8e8' }}>👍 {anchor.endorsers.map(label).join('·')}</span>}
            {anchor.dissenters.length > 0 && <span style={{ color: '#e99' }}>👎 {anchor.dissenters.map(label).join('·')}</span>}
          </div>
          <span style={{ color: '#778' }}>一致性 {Math.round((anchor.confidence || 0) * 100)}%</span>
        </div>
        {onClick && <div style={{ marginTop: 6, textAlign: 'center', fontSize: '10px', color: '#556', fontFamily: 'system-ui' }}>
          {expanded ? '▲ 收起因果链' : '▼ 展开因果回溯'}
        </div>}
      </div>
      {expanded && trace && <CausalTracePanel trace={trace} />}
    </div>
  );
}

// ============== 因果回溯面板 ==============
export function CausalTracePanel({ trace }) {
  if (!trace) return null;
  return (
    <div style={{ marginTop: -1, padding: '14px 16px',
      background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)',
      borderTop: 'none', borderRadius: '0 0 10px 10px', animation: 'fadeIn 0.3s' }}>
      <div style={{ color: '#aac', fontSize: '11px', fontFamily: 'system-ui', marginBottom: 10, fontWeight: 600 }}>
        🔗 因果回溯 · {trace.summary}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* 赞同者 */}
        {trace.endorsement?.length > 0 && (
          <div>
            <div style={{ color: '#8e8', fontSize: '10px', fontFamily: 'system-ui', marginBottom: 6 }}>👍 支持方</div>
            {trace.endorsement.map((e, i) => (
              <div key={i} style={{ marginBottom: 8, padding: '8px 10px', borderRadius: '6px',
                background: 'rgba(102,187,106,0.06)', border: '1px solid rgba(102,187,106,0.12)' }}>
                <div style={{ color: '#8e8', fontSize: '11px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 4 }}>
                  {e.self?.label} · {e.stance}
                </div>
                {e.evidence?.map((v, j) => (
                  <div key={j} style={{ color: '#aac', fontSize: '10px', fontFamily: 'system-ui', lineHeight: 1.5, marginBottom: 2 }}>{v}</div>
                ))}
                {e.letterExcerpt && (
                  <div style={{ marginTop: 4, color: '#889', fontSize: '10px', fontFamily: '"Noto Serif SC", serif', fontStyle: 'italic', lineHeight: 1.4 }}>
                    "…{e.letterExcerpt}…"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {/* 反对者 */}
        {trace.dissent?.length > 0 && (
          <div>
            <div style={{ color: '#e99', fontSize: '10px', fontFamily: 'system-ui', marginBottom: 6 }}>👎 反对方</div>
            {trace.dissent.map((e, i) => (
              <div key={i} style={{ marginBottom: 8, padding: '8px 10px', borderRadius: '6px',
                background: 'rgba(239,83,80,0.06)', border: '1px solid rgba(239,83,80,0.12)' }}>
                <div style={{ color: '#e99', fontSize: '11px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 4 }}>
                  {e.self?.label} · {e.stance}
                </div>
                {e.evidence?.map((v, j) => (
                  <div key={j} style={{ color: '#ebb', fontSize: '10px', fontFamily: 'system-ui', lineHeight: 1.5, marginBottom: 2 }}>{v}</div>
                ))}
                {e.letterExcerpt && (
                  <div style={{ marginTop: 4, color: '#889', fontSize: '10px', fontFamily: '"Noto Serif SC", serif', fontStyle: 'italic', lineHeight: 1.4 }}>
                    "…{e.letterExcerpt}…"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* 相关互评 */}
      {trace.crossComments?.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ color: '#aac', fontSize: '10px', fontFamily: 'system-ui', marginBottom: 4 }}>💬 相关互评</div>
          {trace.crossComments.map((c, i) => (
            <div key={i} style={{ color: '#889', fontSize: '10px', fontFamily: 'system-ui', lineHeight: 1.4, marginBottom: 2 }}>
              <span style={{ color: c.agreement === 'agree' ? '#8e8' : c.agreement === 'disagree' ? '#e99' : '#889' }}>
                {c.agreement === 'agree' ? '🤝' : c.agreement === 'disagree' ? '⚡' : '🔁'}
              </span> {c.from} → {c.to}：{c.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
