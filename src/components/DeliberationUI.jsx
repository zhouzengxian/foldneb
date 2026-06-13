import { useState, useCallback, useRef, useEffect } from 'react';
import useNebulaStore from '../store/useNebulaStore';
import {
  analyzeProblem, planRounds, getAgentResponse, getAgentResponsesBatch,
  extractInsights, generateReport, getAgentInfo,
  setDeliberationProvider, getDeliberationProvider,
} from '../utils/deliberationEngine';
import { MODEL_PROVIDERS, hasValidKey, saveUserCreds, getUserCreds, getProviderModels, getLastApiError, getCorsProxyUrl, setCorsProxyUrl, getRequestPreview, testApiConnection } from '../utils/modelConfig';
import DeliberationGraph from './DeliberationGraph';
import DeliberationHistory from './DeliberationHistory';
import DEMOS from '../utils/deliberationDemos';
import { generateReportImage, downloadReportImage } from '../utils/reportImage';

// 预设典型问题（一人公司创始人场景）
const PRESET_PROBLEMS = [
  { icon: '🧪', label: '产品留存', text: '产品MVP已上线3个月，有200个试用用户但真正留下来用的不到20%。我该坚持打磨现有功能还是根据反馈做一个更大的改动？' },
  { icon: '💰', label: '定价策略', text: '我是一个独立开发者，产品功能不错但月收入停留在$500。该涨价服务付费客户，还是走免费+广告模式扩大用户量？' },
  { icon: '🎯', label: '方向选择', text: '身兼数职的一人公司，同时在做三件事：接外包养现金流、做SaaS产品、经营自媒体内容。精力分散什么都没做好，该怎么取舍？' },
  { icon: '🔄', label: '获客渠道', text: '我的知识付费产品内容质量很好，但流量全依赖小红书算法推荐。一旦停更就没人来。该All in自媒体还是建立自己的邮件列表/私域？' },
  { icon: '⚡', label: 'AI冲击', text: '我做的是语言翻译工具，最近GPT-4的翻译质量已经接近我的产品水平。我应该转型做AI辅助工作流还是深耕细分垂直领域做差异化？' },
];

// ============================================================
// 推演 UI - 创始人决策推演主界面
// ============================================================

const PHASES = {
  idle:       { label: '开始推演',  icon: '⚡' },
  analyzing:  { label: '分析问题…', icon: '🔍' },
  planning:   { label: '召集思想者…', icon: '📋' },
  deliberating: { label: '推演进行中…', icon: '💬' },
  reporting:  { label: '生成报告…', icon: '📊' },
  complete:   { label: '推演完成',  icon: '✨' },
};

export default function DeliberationUI() {
  const {
    deliberationOpen, deliberationPhase, deliberationSession,
    openDeliberation, closeDeliberation, setDeliberationPhase,
    initDeliberation, addDeliberationRounds, addDeliberationDialogue,
    completeDeliberationRound, addDeliberationInsight, setDeliberationReport,
    archiveDeliberation, userProfile, addMemory: storeAddMemory,
    deliberationHistory, deliberationHistoryView,
    openDeliberationHistoryView, closeDeliberationHistoryView,
  } = useNebulaStore();

  const [problem, setProblem] = useState('');
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [mode, setMode] = useState('api'); // 'api' | 'demo'
  const [modelProvider, setModelProviderLocal] = useState(() => getDeliberationProvider());
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCorsConfig, setShowCorsConfig] = useState(false);
  const [corsProxyInput, setCorsProxyInput] = useState(() => getCorsProxyUrl());
  const [wasCancelled, setWasCancelled] = useState(false);
  const [showReqPreview, setShowReqPreview] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [credsTick, setCredsTick] = useState(0); // 保存后刷新预览
  const abortRef = useRef(false);
  const demoRunningRef = useRef(false);
  const modeRef = useRef('api');
  const runDemoRef = useRef(null);

  // ===== 打字机效果 =====
  const [typedTexts, setTypedTexts] = useState({});
  const typeTimers = useRef({});

  // 批量打字机：chunk 方式，每 30ms 输出一批字符，总时长约 targetMs
  const typeText = useCallback(async (key, fullText, targetMs = 800) => {
    if (!fullText) return;
    if (typeTimers.current[key]) clearInterval(typeTimers.current[key]);
    const TICK = 30; // 30ms 一个 tick
    const totalTicks = Math.max(1, Math.ceil(targetMs / TICK));
    const chunkSize = Math.max(1, Math.ceil(fullText.length / totalTicks));
    let pos = 0;
    setTypedTexts(prev => ({ ...prev, [key]: '' }));
    await new Promise(resolve => {
      typeTimers.current[key] = setInterval(() => {
        pos = Math.min(pos + chunkSize, fullText.length);
        setTypedTexts(prev => ({ ...prev, [key]: fullText.slice(0, pos) }));
        if (pos >= fullText.length) {
          clearInterval(typeTimers.current[key]);
          delete typeTimers.current[key];
          resolve();
        }
      }, TICK);
    });
  }, []);

  // 清理打字状态（组件卸载或重置时）
  const clearTyping = useCallback(() => {
    Object.values(typeTimers.current).forEach(t => clearInterval(t));
    typeTimers.current = {};
    setTypedTexts({});
  }, []);

  // 切换模型时同步到引擎，缺少 key 则弹出配置
  const handleModelChange = (id) => {
    setModelProviderLocal(id);
    setDeliberationProvider(id);
    if (!hasValidKey(id)) {
      const ex = getUserCreds(id);
      setApiKeyInput(ex?.apiKey || '');
      setModelInput(ex?.model || getProviderModels(id)[0] || '');
      setShowApiSettings(true);
    } else {
      setShowApiSettings(false);
    }
  };

  // 保存凭据
  const handleSaveCreds = () => {
    if (!apiKeyInput.trim() || !modelInput.trim()) return;
    saveUserCreds(modelProvider, apiKeyInput.trim(), modelInput.trim());
    setDeliberationProvider(modelProvider);
    setCredsTick(t => t + 1);
    setTestResult(null);
    setShowApiSettings(false);
  };

  // 测试连接
  const handleTestConnection = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    // 先确保最新输入已保存
    if (apiKeyInput.trim() && modelInput.trim()) {
      saveUserCreds(modelProvider, apiKeyInput.trim(), modelInput.trim());
    }
    const result = await testApiConnection(modelProvider);
    setTestResult(result);
    setTesting(false);
  }, [apiKeyInput, modelInput, modelProvider]);

  // 同步 mode 到 ref（避免 startDeliberation 闭包过期）
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // 重置
  useEffect(() => {
    if (deliberationPhase === 'idle') {
      setProblem('');
      setError(null);
      setLogs([]);
      clearTyping();
      abortRef.current = false;
    }
  }, [deliberationPhase, clearTyping]);

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev, { text: msg, type, time: Date.now() }]);
  }, []);

  // ========== 主流程 ==========
  const startDeliberation = useCallback(async () => {
    if (!problem.trim() || deliberationPhase !== 'idle') return;

    // Demo 模式：直接播放预置推演
    if (modeRef.current === 'demo' && runDemoRef.current) {
      await runDemoRef.current();
      return;
    }

    abortRef.current = false;
    setError(null);
    setLogs([]);
    clearTyping();

    // API 模式预检查
    if (modeRef.current === 'api' && !hasValidKey(modelProvider)) {
      const p = MODEL_PROVIDERS.find(x => x.id === modelProvider);
      setError(`请先配置 ${p?.name || modelProvider} 的 API Key。点击顶部 ⚙️ 按钮或切换 🎬 Demo 模式。`);
      return;
    }

    setDeliberationPhase('analyzing');
    addLog('🔍 墨池正在分析你的问题…');

    // Step 1: 分析问题
    const analysis = await analyzeProblem(problem.trim());
    if (abortRef.current) return;
    if (!analysis || !analysis.agents || analysis.agents.length < 2) {
      const apiErr = getLastApiError();
      const msg = apiErr || '问题分析失败，请尝试更具体地描述你的困境';
      setError(msg);
      addLog(`❌ ${msg}`, 'error');
      setDeliberationPhase('idle');
      return;
    }
    initDeliberation(problem.trim(), analysis);
    addLog(`定位到「${analysis.domain}」领域`);
    addLog(`召集 ${analysis.agents.length} 位思想者：${analysis.agents.map(a => getAgentInfo(a.id)?.name || a.id).join('、')}`);

    setDeliberationPhase('planning');

    // Step 2: 规划轮次
    const rounds = await planRounds(problem.trim(), analysis.domain, analysis.agents.map(a => a.id));
    if (abortRef.current) return;
    if (!rounds || rounds.length === 0) {
      const apiErr = getLastApiError();
      const msg = apiErr || '推演规划失败';
      setError(msg);
      addLog(`❌ ${msg}`, 'error');
      setDeliberationPhase('idle');
      return;
    }
    addDeliberationRounds(rounds);
    addLog(`规划 ${rounds.length} 轮推演：${rounds.map(r => r.theme).join(' → ')}`);

    setDeliberationPhase('deliberating');

    const allInsights = [];
    const sessionRounds = [];

    // Step 3: 逐轮推演
    for (let ri = 0; ri < rounds.length; ri++) {
      if (abortRef.current) return;
      const round = rounds[ri];
      addLog(`\n--- 第${ri+1}轮：${round.theme} ---`);

      // 并发限制获取本轮所有Agent回应（限2并发+失败重试，防止API限流）
      const previousInsights = allInsights.slice(-3).map(i => i.text).join('; ');
      const responses = await getAgentResponsesBatch(round.agentIds, {
        problem: problem.trim(),
        theme: round.theme,
        goal: round.goal,
        roundIndex: ri,
        previousInsights,
      }, { concurrency: 2, retries: 1, delayMs: 500 });
      if (abortRef.current) return;

      // 存入 store + 逐字打出
      const dialogues = [];
      let failCount = 0;
      for (const resp of responses) {
        if (abortRef.current) return;
        if (resp && resp.text) {
          const key = `${ri}-${resp.agentId}`;
          // ★ 先置空，再添加对话 → 卡片出现时是空白的
          setTypedTexts(prev => ({ ...prev, [key]: '' }));
          dialogues.push(resp);
          addDeliberationDialogue(ri, resp);
          await typeText(key, resp.text, 1500);
          addLog(`  ${resp.agentName || resp.agentId}: ${resp.text.slice(0, 60)}…`);
          // 记忆提取
          const relationLabel = round.theme.slice(0, 6);
          storeAddMemory('user', resp.agentId, `${relationLabel}推演`, Date.now(), 'deliberation');
        } else {
          failCount++;
          const agentName = resp?.agentName || resp?.agentId || 'Unknown';
          addLog(`  ⚠ ${agentName}: API 回应失败`, 'error');
        }
      }
      if (failCount > 0 && failCount === responses.length) {
        const apiErr = getLastApiError();
        addLog(`  ❌ 本轮全部 Agent 回应失败: ${apiErr || '网络请求异常，请检查网络或切换模型'}`, 'error');
      }

      // 提取洞察
      if (dialogues.length > 0) {
        const insights = await extractInsights(dialogues, round.theme);
        if (insights.length > 0) {
          insights.forEach(ins => {
            allInsights.push(ins);
            addDeliberationInsight(ins);
            const icon = ins.type === 'conflict' ? '⚡' : ins.type === 'consensus' ? '✨' : '💡';
            addLog(`${icon} ${ins.text}`);
          });
        }
      }

      completeDeliberationRound(ri);
      sessionRounds.push({ ...round, dialogues });
    }

    // Step 4: 生成报告
    setDeliberationPhase('reporting');
    addLog('\n📊 墨池正在整合推演结果…');

    const report = await generateReport(
      problem.trim(), analysis.domain, sessionRounds, allInsights
    );
    if (abortRef.current) return;

    setDeliberationReport(report || {
      coreFinding: '推演已完成',
      keyInsights: allInsights.slice(0, 3).map(i => i.text),
      actionableAdvice: '请回顾推演过程，选择最适合的路径',
      reframedProblem: problem.slice(0, 25),
      followUpQuestions: [],
    });

    addLog('✨ 推演完成！');
  }, [problem, deliberationPhase, modeRef]); // modeRef 是稳定 ref

  // 导出报告图片
  const handleExportReport = useCallback(async () => {
    const session = deliberationSession;
    if (!session?.report) return;
    setExporting(true);
    try {
      const blob = await generateReportImage(session);
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadReportImage(blob, `FoldNeb-推演-${dateStr}.png`);
    } catch (err) {
      console.error('导出失败:', err);
    }
    setExporting(false);
  }, [deliberationSession]);

  const cancelDeliberation = useCallback(() => {
    abortRef.current = true;
    demoRunningRef.current = false;
    archiveDeliberation();
    setWasCancelled(true);
    setDeliberationPhase('idle');
  }, [archiveDeliberation]);

  // 开启新推演：先存档，再重置
  const handleNewDeliberation = useCallback(() => {
    archiveDeliberation();
    setWasCancelled(false);
    closeDeliberation();
    setTimeout(() => openDeliberation(), 80);
  }, [archiveDeliberation, closeDeliberation, openDeliberation]);

  // ========== Demo 播放 ==========
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  runDemoRef.current = async () => {
    const demoProblem = problem.trim();
    const demo = DEMOS[demoProblem];
    if (!demo) { setError('该问题暂无演示数据'); return; }

    abortRef.current = false;
    demoRunningRef.current = true;
    setError(null);
    setLogs([]);

    // Phase 1: 分析
    setDeliberationPhase('analyzing');
    addLog('🔍 墨池正在分析你的问题…');
    await sleep(200);
    if (abortRef.current) return;
    initDeliberation(demoProblem, demo.analysis);
    addLog(`定位到「${demo.analysis.domain}」领域`);
    addLog(`召集 ${demo.analysis.agents.length} 位思想者：${demo.analysis.agents.map(a => getAgentInfo(a.id)?.name || a.id).join('、')}`);
    await sleep(150);
    if (abortRef.current) return;

    // Phase 2: 规划（只传结构，不带对话内容）
    setDeliberationPhase('planning');
    await sleep(100);
    if (abortRef.current) return;
    addDeliberationRounds(demo.rounds.map(r => ({
      theme: r.theme, goal: r.goal, agentIds: r.agentIds,
    })));
    addLog(`规划 ${demo.rounds.length} 轮推演：${demo.rounds.map(r => r.theme).join(' → ')}`);
    await sleep(100);
    if (abortRef.current) return;

    // Phase 3: 逐轮推演
    setDeliberationPhase('deliberating');
    const allInsights = [];

    for (let ri = 0; ri < demo.rounds.length; ri++) {
      if (abortRef.current) return;
      const round = demo.rounds[ri];
      addLog(`\n--- 第${ri+1}轮：${round.theme} ---`);

      for (const d of round.dialogues) {
        if (abortRef.current) return;
        const key = `${ri}-${d.agentId}`;
        // Demo：打字机 ~800ms 打完一句
        setTypedTexts(prev => ({ ...prev, [key]: '' }));
        addDeliberationDialogue(ri, d);
        await typeText(key, d.text, 800);
        addLog(`  ${d.agentName || d.agentId}: ${d.text.slice(0, 60)}…`);
      }

      if (round.insights && round.insights.length > 0) {
        round.insights.forEach(ins => {
          allInsights.push(ins);
          addDeliberationInsight(ins);
          const icon = ins.type === 'conflict' ? '⚡' : ins.type === 'consensus' ? '✨' : '💡';
          addLog(`${icon} ${ins.text}`);
        });
      }
      completeDeliberationRound(ri);
      await sleep(150);
    }

    // Phase 4: 报告
    setDeliberationPhase('reporting');
    addLog('\n📊 墨池正在整合推演结果…');
    await sleep(300);
    if (abortRef.current) return;
    setDeliberationReport(demo.report);
    addLog('✨ 推演完成！');
    demoRunningRef.current = false;
  };

  // ========== 历史面板 ==========
  if (showHistory && !deliberationHistoryView) {
    return <DeliberationHistory onClose={() => setShowHistory(false)} />;
  }
  if (deliberationHistoryView) {
    return <DeliberationHistory />;
  }

  // ========== 渲染 ==========
  if (!deliberationOpen) {
    // 触发按钮
    return (
      <button
        onClick={openDeliberation}
        title="决策推演"
        style={{
          position: 'fixed', bottom: 8, right: 8, zIndex: 30,
          background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,180,0,0.15))',
          border: '1px solid rgba(255,215,0,0.35)',
          borderRadius: '10px', padding: '8px 14px', cursor: 'pointer',
          color: '#FFD700', fontSize: '13px', fontFamily: 'system-ui',
          fontWeight: 600, letterSpacing: '0.5px',
          boxShadow: '0 0 20px rgba(255,215,0,0.08)',
        }}
      >
        ⚡ 决策推演
      </button>
    );
  }

  const phaseInfo = PHASES[deliberationPhase] || PHASES.idle;
  const session = deliberationSession;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(4,4,16,0.5)', backdropFilter: 'blur(4px)',
    }}>
      {/* 面板 */}
      <div style={{
        width: '90vw', maxWidth: 800, maxHeight: '88vh',
        background: 'rgba(10,10,26,0.96)',
        border: '1px solid rgba(255,215,0,0.2)',
        borderRadius: '16px', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 0 60px rgba(255,215,0,0.06), 0 4px 40px rgba(0,0,0,0.5)',
      }}>
        {/* 顶栏 */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,215,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '18px' }}>{phaseInfo.icon}</span>
            <span style={{ color: '#FFD700', fontWeight: 700, fontSize: '15px', fontFamily: 'system-ui' }}>
              FoldNeb 决策推演
            </span>
            <span style={{
              color: '#889', fontSize: '11px', fontFamily: 'system-ui',
              background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px',
            }}>
              {phaseInfo.label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* 模式切换 */}
            {deliberationPhase === 'idle' && (
              <div style={{
                display: 'flex', borderRadius: '8px', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px',
              }}>
                <button
                  onClick={() => setMode('api')}
                  style={{
                    padding: '4px 10px', border: 'none', cursor: 'pointer',
                    background: mode === 'api' ? 'rgba(68,136,255,0.2)' : 'rgba(255,255,255,0.04)',
                    color: mode === 'api' ? '#8cf' : '#889',
                    fontFamily: 'system-ui', fontWeight: mode === 'api' ? 600 : 400,
                    transition: 'all 0.2s',
                  }}
                >🌐 API</button>
                <button
                  onClick={() => setMode('demo')}
                  style={{
                    padding: '4px 10px', border: 'none', cursor: 'pointer',
                    background: mode === 'demo' ? 'rgba(72,196,128,0.2)' : 'rgba(255,255,255,0.04)',
                    color: mode === 'demo' ? '#8e8' : '#889',
                    fontFamily: 'system-ui', fontWeight: mode === 'demo' ? 600 : 400,
                    transition: 'all 0.2s',
                  }}
                >🎬 Demo</button>
              </div>
            )}
            {/* 模型选择器（仅 API 模式） */}
            {deliberationPhase === 'idle' && mode === 'api' && (
              <select
                value={modelProvider}
                onChange={e => handleModelChange(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px', padding: '4px 8px',
                  color: '#ccc', fontSize: '11px', fontFamily: 'system-ui',
                  outline: 'none', cursor: 'pointer', minWidth: '150px',
                }}
              >
                {MODEL_PROVIDERS.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#1a1a2e', color: '#ddd' }}>
                    {p.icon} {p.name} {hasValidKey(p.id) ? '' : ' (需配置)'}
                  </option>
                ))}
              </select>
            )}

            {/* API 配置按钮 */}
            {deliberationPhase === 'idle' && mode === 'api' && (
              <button
                onClick={() => {
                  const ex = getUserCreds(modelProvider);
                  setApiKeyInput(ex?.apiKey || '');
                  setModelInput(ex?.model || getProviderModels(modelProvider)[0] || '');
                  setShowApiSettings(!showApiSettings);
                }}
                title="配置 API Key"
                style={{
                  background: showApiSettings ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${showApiSettings ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '6px', padding: '4px 8px',
                  color: showApiSettings ? '#FFD700' : '#889',
                  cursor: 'pointer', fontSize: '13px',
                  transition: 'all 0.2s',
                }}
              >⚙️</button>
            )}
            {!hasValidKey(modelProvider) && mode === 'api' && deliberationPhase === 'idle' && (
              <span style={{ color: '#e66', fontSize: '10px', fontFamily: 'system-ui' }}>
                ⚠ 需配置 Key
              </span>
            )}
            {/* 历史按钮（idle 时显示） */}
            {deliberationPhase === 'idle' && deliberationHistory.length > 0 && (
              <button onClick={() => setShowHistory(true)} style={btnStyle('#8899cc')}>
                📁 历史 ({deliberationHistory.length})
              </button>
            )}
            {deliberationPhase === 'complete' && (
              <>
                <button onClick={handleNewDeliberation} style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.25), rgba(255,180,0,0.18))',
                  border: '1px solid rgba(255,215,0,0.45)',
                  borderRadius: '6px', padding: '4px 12px', cursor: 'pointer',
                  color: '#FFD700', fontSize: '12px', fontFamily: 'system-ui', fontWeight: 600,
                }}>
                  🔄 新推演
                </button>
                <button onClick={handleExportReport} disabled={exporting} style={btnStyle('#FFD700')}>
                  {exporting ? '⏳' : '📷'} 导出图片
                </button>
                <button onClick={archiveDeliberation} style={btnStyle('#4A8')}>
                  📁 存档
                </button>
              </>
            )}
            {(deliberationPhase === 'deliberating' || deliberationPhase === 'analyzing' || deliberationPhase === 'planning') && (
              <button onClick={cancelDeliberation} style={btnStyle('#A44')}>
                ✕ 取消
              </button>
            )}
            <button onClick={closeDeliberation} style={btnStyle('#666')}>
              ✕
            </button>
          </div>
        </div>

        {/* 主体内容 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', gap: 20 }}>
          {/* 左侧：推演内容 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 输入区 */}
            {deliberationPhase === 'idle' && (
              <div style={{ padding: '10px 0' }}>
                {/* API 配置表单 */}
                {showApiSettings && mode === 'api' && (
                  <div style={{
                    padding: '14px 16px', marginBottom: 14,
                    background: 'rgba(255,215,0,0.04)',
                    border: '1px solid rgba(255,215,0,0.2)',
                    borderRadius: '10px',
                  }}>
                    <div style={{
                      color: '#FFD700', fontSize: '12px', fontWeight: 600,
                      fontFamily: 'system-ui', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      🔑 配置 {MODEL_PROVIDERS.find(p => p.id === modelProvider)?.name} 的 API
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{
                          color: '#889', fontSize: '11px', fontFamily: 'system-ui',
                          minWidth: '60px', flexShrink: 0,
                        }}>API Key</label>
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={e => setApiKeyInput(e.target.value)}
                          placeholder="sk-xxxxx..."
                          style={{
                            flex: 1, background: 'rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '6px', padding: '6px 10px',
                            color: '#ddd', fontSize: '12px', fontFamily: 'monospace',
                            outline: 'none',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{
                          color: '#889', fontSize: '11px', fontFamily: 'system-ui',
                          minWidth: '60px', flexShrink: 0,
                        }}>Model</label>
                        <select
                          value={modelInput}
                          onChange={e => setModelInput(e.target.value)}
                          style={{
                            flex: 1, background: 'rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '6px', padding: '6px 10px',
                            color: '#ddd', fontSize: '12px', fontFamily: 'system-ui',
                            outline: 'none', cursor: 'pointer',
                          }}
                        >
                          {getProviderModels(modelProvider).map(m => (
                            <option key={m} value={m} style={{ background: '#1a1a2e', color: '#ddd' }}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            saveUserCreds(modelProvider, '', '');
                            setApiKeyInput('');
                            setShowApiSettings(false);
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px', padding: '5px 14px',
                            color: '#889', fontSize: '11px', cursor: 'pointer',
                            fontFamily: 'system-ui',
                          }}
                        >清除</button>
                        <button
                          onClick={handleSaveCreds}
                          disabled={!apiKeyInput.trim() || !modelInput.trim()}
                          style={{
                            background: (apiKeyInput.trim() && modelInput.trim())
                              ? 'linear-gradient(135deg, rgba(255,215,0,0.25), rgba(255,180,0,0.2))'
                              : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${(apiKeyInput.trim() && modelInput.trim()) ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '6px', padding: '5px 14px',
                            color: (apiKeyInput.trim() && modelInput.trim()) ? '#FFD700' : '#555',
                            fontSize: '11px', fontWeight: 600, cursor: (apiKeyInput.trim() && modelInput.trim()) ? 'pointer' : 'default',
                            fontFamily: 'system-ui',
                          }}
                        >💾 保存</button>
                      </div>
                    </div>

                    {/* ===== 请求 JSON 预览 + 测试连接 ===== */}
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <button
                          onClick={() => setShowReqPreview(s => !s)}
                          style={{
                            background: 'rgba(100,180,255,0.1)', border: '1px solid rgba(100,180,255,0.2)',
                            borderRadius: '6px', padding: '4px 10px', color: '#8cf',
                            fontSize: '11px', cursor: 'pointer', fontFamily: 'system-ui',
                          }}
                        >📋 {showReqPreview ? '隐藏' : '查看'}请求 JSON</button>
                        <button
                          onClick={handleTestConnection}
                          disabled={testing || !apiKeyInput.trim()}
                          style={{
                            background: (testing || !apiKeyInput.trim())
                              ? 'rgba(255,255,255,0.04)'
                              : 'rgba(72,196,128,0.15)',
                            border: `1px solid ${(testing || !apiKeyInput.trim()) ? 'rgba(255,255,255,0.08)' : 'rgba(72,196,128,0.3)'}`,
                            borderRadius: '6px', padding: '4px 12px',
                            color: (testing || !apiKeyInput.trim()) ? '#555' : '#8e8',
                            fontSize: '11px', cursor: (testing || !apiKeyInput.trim()) ? 'default' : 'pointer',
                            fontFamily: 'system-ui', fontWeight: 600,
                          }}
                        >{testing ? '⏳ 测试中…' : '🔌 测试连接'}</button>
                        <span style={{ color: '#667', fontSize: '10px' }}>
                          (测试前会自动保存当前 Key)
                        </span>
                      </div>

                      {/* 请求预览 */}
                      {showReqPreview && (() => {
                        const preview = getRequestPreview(modelProvider);
                        const fullReq = {
                          method: preview.method,
                          url: preview.originUrl,
                          targetUrl: preview.targetUrl,
                          proxy: preview.proxy,
                          headers: preview.headers,
                          body: preview.body,
                        };
                        return (
                          <pre style={{
                            background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '10px 12px',
                            fontSize: '10.5px', fontFamily: '"Cascadia Code","Consolas",monospace',
                            color: '#9d9', overflow: 'auto', maxHeight: 300,
                            border: '1px solid rgba(100,180,255,0.1)', lineHeight: 1.5,
                            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                          }}>
                            {JSON.stringify(fullReq, null, 2)}
                          </pre>
                        );
                      })()}

                      {/* 测试结果 */}
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
                              <div style={{ color: '#aaa' }}>
                                回复：{testResult.content}
                              </div>
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
                )}
                {/* CORS 代理配置 */}
                {mode === 'api' && (
                  <div style={{
                    padding: '8px 10px', marginBottom: 14,
                    background: 'rgba(100,150,255,0.04)',
                    border: '1px solid rgba(100,150,255,0.12)',
                    borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: '11px', fontFamily: 'system-ui',
                  }}>
                    <span style={{ color: '#889', flexShrink: 0, cursor: 'pointer' }}
                      onClick={() => setShowCorsConfig(!showCorsConfig)}
                    >🌐 代理 {showCorsConfig ? '▲' : '▼'}</span>
                    {corsProxyInput ? (
                      <span style={{
                        color: '#4A8', fontWeight: 600, fontSize: '10px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }} title={corsProxyInput}>
                        ✓ 已启用 ({corsProxyInput.slice(0, 30)}...)
                      </span>
                    ) : (
                      <span style={{ color: '#e66', fontSize: '10px' }}>⚠ 直连（可能被 CORS 拦截）</span>
                    )}
                    {showCorsConfig && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                        <input
                          value={corsProxyInput}
                          onChange={e => setCorsProxyInput(e.target.value)}
                          placeholder="https://corsproxy.io/?"
                          style={{
                            flex: 1, background: 'rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '4px', padding: '4px 6px',
                            color: '#ddd', fontSize: '10px', fontFamily: 'monospace',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => { setCorsProxyUrl(corsProxyInput); setShowCorsConfig(false); }}
                          style={{
                            background: 'rgba(72,196,128,0.2)', border: '1px solid rgba(72,196,128,0.3)',
                            borderRadius: '4px', padding: '4px 8px', color: '#8e8',
                            fontSize: '10px', cursor: 'pointer', fontFamily: 'system-ui',
                          }}
                        >保存</button>
                      </div>
                    )}
                  </div>
                )}
                {wasCancelled ? (
                  <div style={{
                    padding: '24px 16px', textAlign: 'center',
                    background: 'rgba(255,100,100,0.04)', border: '1px solid rgba(255,100,100,0.15)',
                    borderRadius: '12px', marginBottom: 16,
                  }}>
                    <div style={{ color: '#e88', fontSize: '14px', fontFamily: 'system-ui', marginBottom: 6 }}>
                      ✕ 推演已取消，已自动存档
                    </div>
                    <button
                      onClick={() => {
                        setWasCancelled(false);
                        setProblem('');
                        setError(null);
                        setLogs([]);
                        clearTyping();
                      }}
                      style={{
                        marginTop: 10, padding: '10px 36px',
                        background: 'linear-gradient(135deg, rgba(255,215,0,0.22), rgba(255,180,0,0.15))',
                        border: '1px solid rgba(255,215,0,0.4)',
                        borderRadius: '10px', cursor: 'pointer',
                        color: '#FFD700', fontSize: '14px', fontFamily: 'system-ui',
                        fontWeight: 600,
                      }}
                    >
                      🔄 开启新推演
                    </button>
                  </div>
                ) : (
                  <>
                    <p style={{ color: '#ccd', fontSize: '13px', fontFamily: 'system-ui', margin: '0 0 16px' }}>
                      告诉我你正在面临什么决策困境。墨池会召集星云中的思想者，帮你从多个维度推演。
                    </p>
                    <textarea
                      value={problem}
                      onChange={e => setProblem(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) startDeliberation(); }}
                      placeholder="例如：产品已有1000个付费用户但增长停滞，该深挖存量还是拓新市场？"
                      style={{
                        width: '100%', minHeight: 100, resize: 'vertical',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,215,0,0.15)',
                        borderRadius: '10px', padding: '14px',
                        color: '#e0e0f0', fontSize: '14px', fontFamily: 'system-ui',
                        outline: 'none', lineHeight: 1.6,
                      }}
                    />
                    {error && (
                      <div style={{
                        color: '#f66', fontSize: '13px', margin: '10px 0', padding: '10px 14px',
                        background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,80,80,0.25)',
                        borderRadius: '8px', fontFamily: 'system-ui', lineHeight: 1.5,
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                      }}>
                        <span style={{ flexShrink: 0 }}>⚠️</span>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 2 }}>API 调用失败</div>
                          <div style={{ fontSize: '12px', color: '#e88' }}>{error}</div>
                          <div style={{ fontSize: '11px', color: '#a88', marginTop: 6 }}>
                            💡 建议：① 切换到「🎬 Demo」模式查看演示 &nbsp; ② 检查 API Key 是否正确 &nbsp; ③ 切换其他模型试试
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 预设典型问题 */}
                    <div style={{ marginTop: 14 }}>
                      <div style={{ color: '#667', fontSize: '11px', fontFamily: 'system-ui', marginBottom: 8 }}>
                        💡 一人公司典型场景（点击快速填入）：
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {PRESET_PROBLEMS.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setProblem(p.text);
                              setError(null);
                            }}
                            title={p.text}
                            style={{
                              background: problem === p.text
                                ? 'rgba(255,215,0,0.18)'
                                : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${problem === p.text ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                              borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
                              color: problem === p.text ? '#FFD700' : '#aab',
                              fontSize: '12px', fontFamily: 'system-ui',
                              transition: 'all 0.2s', maxWidth: '100%', overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => {
                              if (problem !== p.text) {
                                e.currentTarget.style.borderColor = 'rgba(255,215,0,0.3)';
                                e.currentTarget.style.background = 'rgba(255,215,0,0.08)';
                                e.currentTarget.style.color = '#ddc';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (problem !== p.text) {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                e.currentTarget.style.color = '#aab';
                              }
                            }}
                            onDoubleClick={() => setProblem('')}
                          >
                            <span style={{ marginRight: 4 }}>{p.icon}</span>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <button
                        onClick={startDeliberation}
                        disabled={!problem.trim()}
                        style={{
                          padding: '10px 28px',
                          background: problem.trim()
                            ? (mode === 'demo' ? 'linear-gradient(135deg, rgba(72,196,128,0.25), rgba(72,180,128,0.2))' : 'linear-gradient(135deg, rgba(255,215,0,0.25), rgba(255,180,0,0.2))')
                            : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${problem.trim() ? (mode === 'demo' ? 'rgba(72,196,128,0.4)' : 'rgba(255,215,0,0.4)') : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '10px', cursor: problem.trim() ? 'pointer' : 'default',
                          color: problem.trim() ? (mode === 'demo' ? '#8e8' : '#FFD700') : '#555',
                          fontWeight: 600, fontSize: '14px', fontFamily: 'system-ui',
                        }}
                      >
                        {mode === 'demo' ? '🎬 播放演示' : '⚡ 开始推演'}
                      </button>
                      <span style={{ color: '#555', fontSize: '11px', fontFamily: 'system-ui' }}>Ctrl+Enter 快捷发送</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 问题展示 */}
            {session && (
              <div style={{
                padding: '12px 16px', marginBottom: 16,
                background: 'rgba(255,215,0,0.06)', borderLeft: '3px solid rgba(255,215,0,0.4)',
                borderRadius: '0 8px 8px 0',
              }}>
                <div style={{ color: '#889', fontSize: '10px', fontFamily: 'system-ui', marginBottom: 4 }}>
                  推演问题
                </div>
                <div style={{ color: '#e8e0d0', fontSize: '14px', fontFamily: 'system-ui', fontWeight: 500 }}>
                  {session.problem}
                </div>
                {session.domain && (
                  <div style={{ color: '#FFD700', fontSize: '11px', marginTop: 4, fontFamily: 'system-ui' }}>
                    域：{session.domain}
                  </div>
                )}
              </div>
            )}

            {/* 推演轮次 */}
            {session?.rounds?.map((round, ri) => (
              <div key={ri} style={{
                marginBottom: 16, padding: '14px 16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                  color: '#FFD700', fontSize: '13px', fontWeight: 600, fontFamily: 'system-ui',
                }}>
                  <span style={{
                    background: 'rgba(255,215,0,0.15)', padding: '2px 8px',
                    borderRadius: '8px', fontSize: '11px',
                  }}>
                    第{ri + 1}轮
                  </span>
                  {round.theme}
                  <span style={{
                    color: round.status === 'done' ? '#4A8' : '#889',
                    fontSize: '10px', marginLeft: 'auto',
                  }}>
                    {round.status === 'done' ? '✓' : round.status === 'active' ? '…' : ''}
                  </span>
                </div>

                {/* Agent 对话 */}
                {round.dialogues?.map((d, di) => {
                  const key = `${ri}-${d.agentId}`;
                  const typed = typedTexts[key];
                  const isTyping = typed !== undefined && typed !== d.text;
                  return (
                    <div key={di} style={{
                      marginBottom: 8, padding: '10px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '8px', borderLeft: '2px solid rgba(255,215,0,0.2)',
                    }}>
                      <div style={{ color: '#FFD700', fontSize: '11px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 4 }}>
                        {d.agentName || d.agentId}
                        {isTyping && <span style={{ color: '#FFD700', fontSize: '10px', marginLeft: 6, opacity: 0.7 }}>▸ 输入中...</span>}
                      </div>
                      <div style={{ color: '#ccc', fontSize: '13px', fontFamily: 'system-ui', lineHeight: 1.6 }}>
                        {typed !== undefined ? typed : d.text}
                        {isTyping && <span style={{ animation: 'blink 0.8s step-end infinite', color: '#FFD700', fontWeight: 300 }}>|</span>}
                      </div>
                    </div>
                  );
                })}

                {round.status === 'pending' && (
                  <div style={{ color: '#556', fontSize: '12px', fontFamily: 'system-ui', fontStyle: 'italic' }}>
                    等待推演…
                  </div>
                )}
              </div>
            ))}

            {/* 报告 */}
            {deliberationPhase === 'complete' && session?.report && (
              <div style={{
                padding: '16px', marginTop: 8,
                background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,180,0,0.05))',
                border: '1px solid rgba(255,215,0,0.3)', borderRadius: '12px',
              }}>
                <div style={{ color: '#FFD700', fontSize: '15px', fontWeight: 700, fontFamily: 'system-ui', marginBottom: 14 }}>
                  📋 推演报告
                </div>

                {/* 重新框定 */}
                <ReportSection icon="🔄" label="重新框定" color="#E8D080">
                  {session.report.reframedProblem}
                </ReportSection>

                {/* 核心发现 */}
                <ReportSection icon="💡" label="核心发现" color="#FFD700">
                  {session.report.coreFinding}
                </ReportSection>

                {/* 关键洞察 */}
                {session.report.keyInsights?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#aaa', fontSize: '11px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 6 }}>
                      🔑 关键洞察
                    </div>
                    {session.report.keyInsights.map((ins, i) => (
                      <div key={i} style={{
                        color: '#ccd', fontSize: '12px', fontFamily: 'system-ui',
                        padding: '4px 0', paddingLeft: 12, borderLeft: '2px solid rgba(255,215,0,0.2)',
                        marginBottom: 4,
                      }}>
                        {ins}
                      </div>
                    ))}
                  </div>
                )}

                {/* 可执行建议 */}
                <ReportSection icon="🎯" label="行动建议" color="#80E8A0">
                  {session.report.actionableAdvice}
                </ReportSection>

                {/* 后续可追问 */}
                {session.report.followUpQuestions?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ color: '#aaa', fontSize: '11px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 6 }}>
                      🤔 你可能还想问
                    </div>
                    {session.report.followUpQuestions.map((q, i) => (
                      <div key={i} style={{
                        color: '#99b', fontSize: '12px', fontFamily: 'system-ui',
                        padding: '6px 10px', marginBottom: 4,
                        background: 'rgba(255,255,255,0.03)', borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                        onClick={() => {
                          setProblem(q);
                          archiveDeliberation();
                          setTimeout(() => {
                            useNebulaStore.getState().openDeliberation();
                            setProblem(q);
                          }, 100);
                        }}
                      >
                        → {q}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 开启新推演 */}
            {deliberationPhase === 'complete' && (
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <button
                  onClick={handleNewDeliberation}
                  style={{
                    padding: '10px 36px',
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.22), rgba(255,180,0,0.15))',
                    border: '1px solid rgba(255,215,0,0.4)',
                    borderRadius: '10px', cursor: 'pointer',
                    color: '#FFD700', fontSize: '14px', fontFamily: 'system-ui',
                    fontWeight: 600, letterSpacing: '1px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,215,0,0.35), rgba(255,180,0,0.25))';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(255,215,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,215,0,0.22), rgba(255,180,0,0.15))';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  🔄 开启新推演
                </button>
              </div>
            )}

            {/* 实时日志 */}
            {logs.length > 0 && deliberationPhase !== 'complete' && (
              <div style={{
                marginTop: 12, padding: '10px 14px',
                background: 'rgba(0,0,0,0.3)', borderRadius: '8px',
                maxHeight: 160, overflow: 'auto',
                fontFamily: '"Cascadia Code",monospace', fontSize: '11px',
              }}>
                {logs.map((log, i) => (
                  <div key={i} style={{
                    color: log.type === 'error' ? '#f66' : '#889',
                    padding: '2px 0', lineHeight: 1.5,
                  }}>
                    {log.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：推演图谱 */}
          {session && (
            <div style={{ width: 280, flexShrink: 0 }}>
              <DeliberationGraph session={session} phase={deliberationPhase} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== 小组件 ==========
function ReportSection({ icon, label, color, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: '#aaa', fontSize: '11px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 4 }}>
        {icon} {label}
      </div>
      <div style={{
        color: color || '#ccd', fontSize: '13px', fontFamily: 'system-ui',
        lineHeight: 1.6, padding: '6px 10px',
        background: 'rgba(255,255,255,0.03)', borderRadius: '6px',
      }}>
        {children}
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}33`,
    borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
    color: color, fontSize: '12px', fontFamily: 'system-ui',
  };
}
