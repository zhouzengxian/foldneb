import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import useNebulaStore from '../store/useNebulaStore';
import {
  generateFutureSelves, writeLetterToPast, crossTimelineReview, buildAnchorMatrix,
  setTemporalProvider, getTemporalProvider,
  getFallbackSelves, getFallbackLetter, getFallbackCrossReview, getFallbackMatrix,
} from '../utils/temporalEngine';
import { compareForks, generateCompareReport, demoCompareForks, demoGenerateCompareReport } from '../utils/forkEngine';
import { traceAllAnchors } from '../utils/causalTrace';
import { MODEL_PROVIDERS, hasValidKey } from '../utils/modelConfig';
import ApiSettingsPanel from './ApiSettingsPanel';
import {
  IdleForm, RunningView, LetterCard, CrossReviewCard, AnchorCard,
  SectionTitle, btn,
} from './TemporalSubViews';
import TimelineGraph from './TimelineGraph';

const PHASES = {
  idle:       { label: '准备折叠',     icon: '⏳' },
  generating: { label: '生成未来的我…', icon: '🌀' },
  writing:    { label: '书写跨时空来信…', icon: '✉️' },
  reviewing:  { label: '未来版本互评…', icon: '💬' },
  anchoring:  { label: '收束时间锚点…', icon: '🧭' },
  complete:   { label: '折叠完成',     icon: '✨' },
  partialComplete: { label: '锚点未收束', icon: '⚠️' },
};

const PRESET_PROFILES = [
  { icon: '🚀', label: '辞职创业', profile: {
    currentSituation: '在大厂做产品经理5年，存了一笔钱，想辞职做自己的AI产品，但怕失去稳定收入。',
    goal: '3年内做出月入5万的独立产品，实现职业自由',
    biggestFear: '一年后钱烧光了什么都没做出来，简历也空了，回不去大厂',
    keyDecision: '现在裸辞全力做产品，还是边上班边业余做？',
  }},
  { icon: '💭', label: '人生方向', profile: {
    currentSituation: '30岁，做着一份不讨厌也不热爱的工作，感觉人生在原地打转。',
    goal: '找到一个愿意为之投入十年的方向',
    biggestFear: '到40岁还在迷茫，一辈子就这样过去了',
    keyDecision: '该不该放下现在的安稳，去探索一个完全未知但可能更有意义的方向？',
  }},
];

export default function TemporalDeliberation() {
  const {
    temporalOpen, temporalPhase, temporalSession,
    closeTemporal, setTemporalPhase, patchTemporalSession, setTemporalSession,
    temporalPrefill, clearTemporalPrefill,
  } = useNebulaStore();

  const [profile, setProfile] = useState({ name: '', currentSituation: '', goal: '', biggestFear: '', keyDecision: '' });
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [mode, setMode] = useState('api'); // 'api' | 'demo'
  const [modelProvider, setModelProviderLocal] = useState(() => getTemporalProvider());
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [credsTick, setCredsTick] = useState(0); // 保存后刷新 hasValidKey 缓存判断
  const abortRef = useRef(false);
  const modeRef = useRef('api');

  // 吸收从决策推演带入的预填 profile（横纵联动）
  // 仅在 idle 状态下吸收一次，吸收后立刻清空 store 的 prefill，避免重复
  const [prefillSource, setPrefillSource] = useState(null);
  useEffect(() => {
    if (temporalOpen && temporalPhase === 'idle' && temporalPrefill) {
      setProfile({
        name: temporalPrefill.name || '',
        currentSituation: temporalPrefill.currentSituation || '',
        goal: temporalPrefill.goal || '',
        biggestFear: temporalPrefill.biggestFear || '',
        keyDecision: temporalPrefill.keyDecision || '',
      });
      setPrefillSource(temporalPrefill._source || null);
      clearTemporalPrefill();
    }
  }, [temporalOpen, temporalPhase, temporalPrefill, clearTemporalPrefill]);

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev, { text: msg, type, time: Date.now() }]);
  }, []);

  const updateField = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const handleModelChange = (id) => {
    setModelProviderLocal(id); setTemporalProvider(id);
    setShowApiSettings(!hasValidKey(id));
  };
  // 凭据保存后：刷新本地缓存，Key 已配置则关闭面板
  const handleCredsSaved = () => {
    setCredsTick(t => t + 1);
    if (hasValidKey(modelProvider)) setShowApiSettings(false);
  };
  const handlePreset = (p) => setProfile({ ...p.profile, name: profile.name });

  // ========== 主流程 ==========
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const startTemporal = useCallback(async () => {
    if (!profile.currentSituation.trim() || !profile.keyDecision.trim()) {
      setError('请至少填写"现状"和"关键决策"'); return;
    }
    // Demo 模式不需要 API Key
    if (modeRef.current !== 'demo' && !hasValidKey(modelProvider)) {
      setError('当前模型未配置 API Key，请点击顶部 ⚙️ 按钮配置（或切换 🎬 Demo 模式）'); return;
    }
    setError(null); setLogs([]); abortRef.current = false;
    setTemporalProvider(modelProvider);

    const session = { profile, selves: [], letters: [], crossReviews: [], matrix: null };
    patchTemporalSession(session);

    // ===== Demo 模式：直接用 fallback 函数 + 打字延迟 =====
    if (modeRef.current === 'demo') {
      try {
        // Phase 1
        setTemporalPhase('generating');
        addLog('🎬 演示模式 · 正在生成 4 个未来的你…');
        await sleep(300); if (abortRef.current) return;
        const selves = getFallbackSelves(profile);
        session.selves = selves; patchTemporalSession({ selves });
        selves.forEach(s => addLog(`  ✓ ${s.label}：${s.mood}`, 'success'));

        // Phase 2
        setTemporalPhase('writing');
        const letters = [];
        for (const self of selves) {
          if (abortRef.current) return;
          addLog(`✉️ ${self.label} 正在给现在的你写信…`);
          await sleep(200); if (abortRef.current) return;
          const letter = getFallbackLetter(self, profile);
          letters.push(letter);
          session.letters = [...letters]; patchTemporalSession({ letters });
          addLog(`  📨 《${letter.title}》`, 'success');
        }

        // Phase 3
        setTemporalPhase('reviewing');
        const crossReviews = [];
        const pairs = [
          [selves[0], selves[3]], [selves[3], selves[0]], [selves[1], selves[2]],
        ];
        for (const [reviewer, target] of pairs) {
          if (abortRef.current) return;
          addLog(`💬 ${reviewer.label} 评价 ${target.label}…`);
          await sleep(150); if (abortRef.current) return;
          const review = getFallbackCrossReview(reviewer, target);
          crossReviews.push(review);
          session.crossReviews = [...crossReviews]; patchTemporalSession({ crossReviews });
          addLog(`  ${review.agreement === 'agree' ? '🤝' : review.agreement === 'disagree' ? '⚡' : '🔁'} ${review.focus || (review.agreement + '评价')}`, 'success');
        }

        // Phase 4
        setTemporalPhase('anchoring');
        addLog('🧭 正在收束时间锚点矩阵…');
        await sleep(200); if (abortRef.current) return;
        const matrix = getFallbackMatrix(letters);
        session.matrix = matrix; patchTemporalSession({ matrix });
        addLog(`✨ 折叠完成：${matrix.anchors.length} 个锚点（演示数据）`, 'success');
        setTemporalPhase('complete');
      } catch (e) {
        console.error('时间折叠失败', e);
        const reason = e?.message || '未知错误';
        setError(`折叠中断：${reason}`);
        setTemporalPhase('idle');
      }
      return;
    }

    // ===== API 模式 =====
    try {
      // Phase 1: 生成未来的自我
      setTemporalPhase('generating');
      addLog('🌀 正在生成 4 个未来的你（1/3/5/10年后）…');
      const selves = await generateFutureSelves(profile);
      if (abortRef.current) return;
      session.selves = selves; patchTemporalSession({ selves });
      selves.forEach(s => addLog(`  ✓ ${s.label}：${s.mood}`, 'success'));

      // Phase 2: 写信（逐个，便于观察）
      setTemporalPhase('writing');
      const letters = [];
      for (const self of selves) {
        if (abortRef.current) return;
        addLog(`✉️ ${self.label} 正在给现在的你写信…`);
        const letter = await writeLetterToPast(self, profile);
        if (abortRef.current) return;
        letters.push(letter);
        session.letters = [...letters]; patchTemporalSession({ letters });
        addLog(`  📨 《${letter.title}》`, 'success');
        await sleep(200);
      }

      // Phase 3: 跨时间互评
      setTemporalPhase('reviewing');
      const crossReviews = [];
      const pairs = [
        [selves[0], selves[3], letters[3]],
        [selves[3], selves[0], letters[0]],
        [selves[1], selves[2], letters[2]],
      ];
      for (const [reviewer, target, targetLetter] of pairs) {
        if (abortRef.current) return;
        addLog(`💬 ${reviewer.label} 评价 ${target.label}…`);
        const review = await crossTimelineReview(reviewer, target, targetLetter, profile);
        if (abortRef.current) return;
        crossReviews.push(review);
        session.crossReviews = [...crossReviews]; patchTemporalSession({ crossReviews });
        addLog(`  ${review.agreement === 'agree' ? '🤝' : review.agreement === 'disagree' ? '⚡' : '🔁'} ${review.focus || ''}`, 'success');
        await sleep(150);
      }

      // Phase 4: 收束锚点矩阵
      setTemporalPhase('anchoring');
      addLog('🧭 正在收束时间锚点矩阵…');
      const matrix = await buildAnchorMatrix(letters, crossReviews, profile);
      if (abortRef.current) return;
      session.matrix = matrix; patchTemporalSession({ matrix });
      addLog(`✨ 折叠完成：${matrix.anchors.length} 个锚点`, 'success');
      setTemporalPhase('complete');
    } catch (e) {
      console.error('时间折叠失败', e);
      const reason = e?.name === 'LLMUnavailableError'
        ? e.message
        : (e?.message || '未知错误');
      setError(`折叠中断：${reason}`);
      addLog(`❌ ${reason}`, 'error');
      // ★ 不切回 idle：保留已生成的 selves/letters/crossReviews 供用户查看
      setTemporalPhase('partialComplete');
    }
  }, [profile, modelProvider, addLog, patchTemporalSession, setTemporalPhase]);

  const cancelTemporal = useCallback(() => {
    abortRef.current = true; setTemporalPhase('idle');
    addLog('✕ 已取消', 'warn');
  }, [addLog, setTemporalPhase]);

  // ★ 仅重试第 4 步（锚点收束），前 3 步已生成的内容保留
  const retryAnchoring = useCallback(async () => {
    const session = useNebulaStore.getState().temporalSession;
    if (!session || !session.letters || !session.profile) return;
    setError(null); abortRef.current = false;
    setTemporalPhase('anchoring');
    addLog('🧭 正在重新收束时间锚点矩阵…（仅重试第 4 步）');
    try {
      const matrix = await buildAnchorMatrix(session.letters, session.crossReviews || [], session.profile);
      if (abortRef.current) return;
      patchTemporalSession({ matrix });
      addLog(`✨ 折叠完成：${matrix.anchors.length} 个锚点`, 'success');
      setTemporalPhase('complete');
    } catch (e) {
      console.error('锚点重试失败', e);
      const reason = e?.name === 'LLMUnavailableError'
        ? e.message
        : (e?.message || '未知错误');
      setError(`锚点收束重试失败：${reason}`);
      addLog(`❌ ${reason}`, 'error');
      setTemporalPhase('partialComplete'); // 仍然保留前 3 步结果
    }
  }, [addLog, patchTemporalSession, setTemporalPhase]);

  const handleNew = useCallback(() => {
    setTemporalPhase('idle'); setTemporalSession(null);
    setLogs([]); setError(null); abortRef.current = false;
    setPrefillSource(null);
  }, [setTemporalPhase, setTemporalSession]);

  const switchMode = (m) => { setMode(m); modeRef.current = m; };

  if (!temporalOpen) return null;

  const phaseInfo = PHASES[temporalPhase] || PHASES.idle;
  const session = temporalSession;
  const running = ['generating', 'writing', 'reviewing', 'anchoring'].includes(temporalPhase);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(4,4,16,0.5)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '95vw', maxWidth: 1080, maxHeight: '90vh',
        background: 'rgba(10,10,26,0.96)', border: '1px solid rgba(255,215,0,0.2)',
        borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 0 60px rgba(255,215,0,0.06), 0 4px 40px rgba(0,0,0,0.5)',
      }}>
        {/* 顶栏 */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,215,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '18px' }}>⏳</span>
            <span style={{ color: '#FFD700', fontWeight: 700, fontSize: '15px', fontFamily: 'system-ui' }}>
              时间折叠 · 与未来的自己对话
            </span>
            <span style={{ color: '#889', fontSize: '11px', fontFamily: 'system-ui',
              background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>{phaseInfo.label}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Demo / API 切换 */}
            {temporalPhase === 'idle' && (
              <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
                <button
                  onClick={() => switchMode('api')}
                  style={{
                    padding: '4px 10px', border: 'none', cursor: 'pointer',
                    background: mode === 'api' ? 'rgba(100,180,255,0.2)' : 'rgba(255,255,255,0.03)',
                    color: mode === 'api' ? '#acd' : '#667',
                    fontFamily: 'system-ui', fontWeight: mode === 'api' ? 600 : 400, fontSize: '11px',
                    transition: 'all 0.2s',
                  }}
                >🌐 API</button>
                <button
                  onClick={() => switchMode('demo')}
                  style={{
                    padding: '4px 10px', border: 'none', cursor: 'pointer',
                    background: mode === 'demo' ? 'rgba(72,196,128,0.2)' : 'rgba(255,255,255,0.03)',
                    color: mode === 'demo' ? '#8e8' : '#667',
                    fontFamily: 'system-ui', fontWeight: mode === 'demo' ? 600 : 400, fontSize: '11px',
                    transition: 'all 0.2s',
                  }}
                >🎬 Demo</button>
              </div>
            )}
            {temporalPhase === 'idle' && mode === 'api' && (
              <select value={modelProvider} onChange={e => handleModelChange(e.target.value)} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px', padding: '4px 8px', color: '#ccc', fontSize: '11px',
                fontFamily: 'system-ui', outline: 'none', cursor: 'pointer', minWidth: '150px',
              }}>
                {MODEL_PROVIDERS.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#1a1a2e', color: '#ddd' }}>
                    {p.icon} {p.name} {hasValidKey(p.id) ? '' : ' (需配置)'}
                  </option>
                ))}
              </select>
            )}
            {/* API 配置按钮 */}
            {temporalPhase === 'idle' && mode === 'api' && (
              <button
                onClick={() => setShowApiSettings(!showApiSettings)}
                title="配置 API Key"
                style={{
                  background: showApiSettings ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${showApiSettings ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '6px', padding: '4px 8px',
                  color: showApiSettings ? '#FFD700' : '#889',
                  cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s',
                }}
              >⚙️</button>
            )}
            {temporalPhase === 'idle' && mode === 'api' && !hasValidKey(modelProvider) && (
              <span style={{ color: '#e66', fontSize: '10px', fontFamily: 'system-ui' }}>
                ⚠ 需配置 Key
              </span>
            )}
            {running && <button onClick={cancelTemporal} style={btn('#A44')}>✕ 取消</button>}
            {temporalPhase === 'complete' && <button onClick={handleNew} style={btn('#FFD700')}>🔄 重新折叠</button>}
            {temporalPhase === 'partialComplete' && <button onClick={retryAnchoring} style={btn('#FFD700')}>🔄 重试锚点收束</button>}
            {temporalPhase === 'partialComplete' && <button onClick={handleNew} style={btn('#888')}>🔄 重新折叠</button>}
            <button onClick={closeTemporal} style={btn('#666')}>✕</button>
          </div>
        </div>

        {/* 主体 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {temporalPhase === 'idle' && (
            <>
              {prefillSource === 'deliberation' && (
                <div style={{
                  padding: '10px 14px', marginBottom: 12, borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(68,136,255,0.1), rgba(68,100,255,0.05))',
                  border: '1px solid rgba(68,136,255,0.3)',
                  color: '#9bb8ff', fontSize: '12px', fontFamily: 'system-ui', lineHeight: 1.6,
                }}>
                  🔗 已从本次<span style={{ color: '#FFD700' }}>决策推演</span>带入上下文：
                  核心发现 → 现状，行动建议 → 目标，争议洞察 → 担忧，重新框定 → 决策。
                  可直接「开始折叠」，也可手动调整。
                </div>
              )}
              {mode === 'demo' && (
                <div style={{
                  padding: '10px 14px', marginBottom: 12, borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(72,196,128,0.08), rgba(72,180,128,0.04))',
                  border: '1px solid rgba(72,196,128,0.25)',
                  color: '#8e8', fontSize: '12px', fontFamily: 'system-ui', lineHeight: 1.6,
                }}>
                  🎬 <span style={{ fontWeight: 600 }}>演示模式</span> — 使用预置的假数据快速展示时间折叠流程。
                  切换到 <span style={{ color: '#acd', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => switchMode('api')}>🌐 API 模式</span> 使用真实大模型。
                </div>
              )}
              {/* API 配置面板（与决策推演共用同一组件） */}
              {showApiSettings && mode === 'api' && (
                <ApiSettingsPanel provider={modelProvider} onSaved={handleCredsSaved} />
              )}
              <IdleForm profile={profile} updateField={updateField} error={error}
                onStart={startTemporal} onPreset={handlePreset}
                hasKey={mode === 'demo' || hasValidKey(modelProvider)} presets={PRESET_PROFILES}
                demoMode={mode === 'demo'} />
            </>
          )}
          {running && <RunningView logs={logs} phase={temporalPhase} session={session} />}
          {temporalPhase === 'complete' && session && <CompleteView session={session} mode={mode} />}
          {temporalPhase === 'partialComplete' && session && (
            <>
              {error && (
                <div style={{
                  padding: '12px 16px', marginBottom: 16, borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(239,83,80,0.12), rgba(239,83,80,0.06))',
                  border: '1px solid rgba(239,83,80,0.35)',
                  color: '#ff9999', fontSize: '12.5px', fontFamily: 'system-ui', lineHeight: 1.6,
                }}>
                  ⚠ <b>锚点收束失败</b>：{error}
                  <div style={{ marginTop: 6, color: '#ccbb88' }}>
                    前 3 步（未来自我画像 / 信件 / 跨时间互评）已成功生成，可在下方查看。
                    请点击右上角 🔄 <b>重试锚点收束</b>（仅重试第 4 步，不会覆盖已有内容）。
                  </div>
                </div>
              )}
              <CompleteView session={session} mode={mode} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============== complete 完整结果 ==============
function CompleteView({ session, mode }) {
  const { matrix, selves, letters, crossReviews } = session;
  const [selectedAnchor, setSelectedAnchor] = useState(null);
  const traces = useMemo(() => traceAllAnchors(matrix, selves, letters, crossReviews),
    [matrix, selves, letters, crossReviews]);
  return (
    <div>
      {/* Demo 模式标记 */}
      {mode === 'demo' && (
        <div style={{
          padding: '10px 14px', marginBottom: 14, borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(72,196,128,0.08), rgba(72,180,128,0.04))',
          border: '1px solid rgba(72,196,128,0.25)',
          color: '#8e8', fontSize: '12px', fontFamily: 'system-ui',
        }}>
          🎬 <span style={{ fontWeight: 600 }}>演示数据</span> — 本页所有内容均为预置假数据，不代表真实 LLM 分析结果。
        </div>
      )}
      {/* 元洞察 */}
      {matrix && (
        <div style={{ padding: '16px 18px', marginBottom: 16,
          background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,180,0,0.05))',
          border: '1px solid rgba(255,215,0,0.3)', borderRadius: '12px' }}>
          <div style={{ color: '#FFD700', fontSize: '12px', fontFamily: 'system-ui', marginBottom: 6, letterSpacing: '0.05em' }}>
            ✨ 跨越时间的元洞察
          </div>
          <div style={{ color: '#fff', fontSize: '16px', fontFamily: '"Noto Serif SC", serif', lineHeight: 1.6 }}>
            {matrix.metaInsight}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            {matrix.convergence && <div style={{ fontSize: '12px', color: '#8e8', fontFamily: 'system-ui' }}>🤝 罕见一致：{matrix.convergence}</div>}
            {matrix.blindSpot && <div style={{ fontSize: '12px', color: '#e99', fontFamily: 'system-ui' }}>👁️ 你的盲点：{matrix.blindSpot}</div>}
          </div>
        </div>
      )}

      {/* 时间轴可视化 */}
      {selves?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionTitle icon="🕰️" text="时间轴 · 未来的你与现在的你" />
          <div style={{
            padding: '8px 12px', background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
          }}>
            <TimelineGraph selves={selves} letters={letters} crossReviews={crossReviews} />
          </div>
        </div>
      )}

      {/* 信件列表 */}
      <div style={{ marginBottom: 16 }}>
        <SectionTitle icon="✉️" text="来自未来的四封信" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {letters?.map((letter, i) => (
            <LetterCard key={i} letter={letter} self={selves?.find(s => s.id === letter.from)} />
          ))}
        </div>
      </div>

      {/* 跨时间互评 */}
      {crossReviews?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionTitle icon="💬" text="未来版本之间的对话" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {crossReviews.map((r, i) => <CrossReviewCard key={i} review={r} selves={selves} />)}
          </div>
        </div>
      )}

      {/* 锚点矩阵 */}
      {matrix?.anchors?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionTitle icon="🧭" text="时间锚点矩阵" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {matrix.anchors.map((a, i) => {
              const isExpanded = selectedAnchor === i;
              return (
                <AnchorCard key={i} anchor={a} selves={selves}
                  onClick={() => setSelectedAnchor(isExpanded ? null : i)}
                  expanded={isExpanded}
                  trace={isExpanded ? traces[i] : null} />
              );
            })}
          </div>
        </div>
      )}

      {/* 分叉对比 */}
      {session.profile && (
        <ForkCompareSection profile={session.profile} mode={mode} />
      )}
    </div>
  );
}

// ============== 分叉对比区块 ==============
function ForkCompareSection({ profile, mode }) {
  const [expanded, setExpanded] = useState(false);
  const [altInput, setAltInput] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleCompare = async () => {
    const alts = altInput.split(/[,，\n]/).map(s => s.trim()).filter(Boolean);
    if (alts.length < 1) { setError('请至少输入一条替代路径'); return; }
    // Demo 模式不检查 API Key
    if (mode !== 'demo' && !hasValidKey(getTemporalProvider())) {
      setError('未配置 API Key，请切换到 🎬 Demo 模式查看演示'); return;
    }
    setError(null); setLoading(true);
    try {
      if (mode === 'demo') {
        const scored = await demoCompareForks(profile, alts);
        setResults(scored);
        setReport(demoGenerateCompareReport(scored));
      } else {
        const scored = await compareForks(profile, alts);
        setResults(scored);
        setReport(generateCompareReport(scored));
      }
    } catch (e) {
      // API 模式下 compareForks 可能抛 LLMUnavailableError，用其真实信息（超时/无应答等）
      const reason = e?.name === 'LLMUnavailableError' ? e.message : (e?.message || '对比失败');
      setError(reason);
    }
    setLoading(false);
  };

  const barColor = (score) => score >= 70 ? '#66BB6A' : score >= 45 ? '#FF9800' : '#EF5350';
  const barWidth = (score) => Math.max(4, score) + '%';

  return (
    <div style={{ marginTop: 4 }}>
      <button onClick={() => setExpanded(!expanded)} style={{
        width: '100%', padding: '12px', borderRadius: '10px', cursor: 'pointer',
        background: expanded ? 'rgba(255,140,0,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${expanded ? 'rgba(255,140,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
        color: expanded ? '#ffa' : '#889', fontSize: '13px', fontFamily: 'system-ui',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.2s',
      }}>
        🔄 分叉对比 · {expanded ? '收起' : '如果选了不同的路，终局会怎样？'}
      </button>

      {expanded && (
        <div style={{ marginTop: 12, padding: '16px', borderRadius: '10px',
          background: 'rgba(255,140,0,0.04)', border: '1px solid rgba(255,140,0,0.15)' }}>
          <div style={{ color: '#aac', fontSize: '12px', fontFamily: 'system-ui', marginBottom: 10 }}>
            输入 2-4 条替代路径（用逗号或换行分隔），每条路径将独立跑一次时间折叠，对比终局评分
          </div>
          <textarea value={altInput} onChange={e => setAltInput(e.target.value)}
            rows={3} placeholder={'继续上班，边做边看\n辞职创业但不做AI\n完全换一个行业'}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#ddd', fontSize: '13px', fontFamily: 'system-ui', outline: 'none', resize: 'vertical',
            }} />
          {error && <div style={{ marginTop: 8, color: '#e99', fontSize: '11px', fontFamily: 'system-ui' }}>⚠ {error}</div>}
          <button onClick={handleCompare} disabled={loading || !altInput.trim()}
            style={{
              marginTop: 12, width: '100%', padding: '10px', borderRadius: '8px', cursor: loading ? 'wait' : 'pointer',
              background: 'linear-gradient(90deg, rgba(255,140,0,0.25), rgba(255,100,0,0.18))',
              border: '1px solid rgba(255,140,0,0.4)', color: '#ffa', fontSize: '13px',
              fontFamily: 'system-ui', fontWeight: 600, opacity: loading || !altInput.trim() ? 0.5 : 1,
            }}>
            {loading ? '⏳ 正在并行折叠各条路径…' : '🔄 开始分叉对比'}
          </button>

          {/* 结果面板 */}
          {results && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ color: '#ffa', fontSize: '13px', fontWeight: 600, fontFamily: 'system-ui' }}>
                  📊 分叉对比结果 · {results.length} 条路径
                </span>
                {mode === 'demo' && (
                  <span style={{ color: '#8e8', fontSize: '10px', fontFamily: 'system-ui',
                    background: 'rgba(72,196,128,0.12)', padding: '2px 8px', borderRadius: '4px',
                    border: '1px solid rgba(72,196,128,0.25)' }}>🎬 演示</span>
                )}
              </div>

              {/* 排行榜 */}
              {results.map((r, i) => (
                <div key={i} style={{
                  padding: '12px 14px', marginBottom: 8, borderRadius: '10px',
                  background: i === 0 ? 'rgba(255,140,0,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${i === 0 ? 'rgba(255,140,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: i === 0 ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: i === 0 ? '#FFD700' : '#889', fontSize: '11px', fontWeight: 700, fontFamily: 'system-ui',
                      }}>{i + 1}</span>
                      <span style={{ color: i === 0 ? '#ffa' : '#ccd', fontSize: '13px', fontWeight: i === 0 ? 700 : 500, fontFamily: 'system-ui' }}>{r.label}</span>
                    </div>
                    <span style={{ color: barColor(r.score), fontSize: '14px', fontWeight: 700, fontFamily: 'system-ui' }}>{r.score}分</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: barColor(r.score), width: barWidth(r.score), transition: 'width 0.5s ease-out' }} />
                  </div>
                  <div style={{ marginTop: 6, fontSize: '10px', color: '#667', fontFamily: 'system-ui', display: 'flex', gap: 14 }}>
                    <span>✅ {r.matrix?.anchors?.filter(a => a.verdict === 'do').length || 0}该做</span>
                    <span>🌱 {r.matrix?.anchors?.filter(a => a.verdict === 'longterm').length || 0}长期主义</span>
                    <span>⚠️ {r.matrix?.anchors?.filter(a => a.verdict === 'beware').length || 0}警惕</span>
                    <span>🚫 {r.matrix?.anchors?.filter(a => a.verdict === 'avoid').length || 0}避开</span>
                  </div>
                </div>
              ))}

              {/* 报告摘要 */}
              {report && (
                <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: '10px',
                  background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)' }}>
                  <div style={{ color: '#FFD700', fontSize: '11px', fontFamily: 'system-ui', marginBottom: 4 }}>📋 对比洞察</div>
                  <div style={{ color: '#ccd', fontSize: '12px', lineHeight: 1.7, fontFamily: '"Noto Serif SC", serif' }}>{report.summary}</div>
                  {report.gaps?.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: '11px', color: '#aac', fontFamily: 'system-ui', lineHeight: 1.6 }}>
                      {report.gaps.map((g, i) => (
                        <div key={i}>⚡ 「{g.decision}」— 最佳「{g.bestVerdict}」vs 最差「{g.worstVerdict}」</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
