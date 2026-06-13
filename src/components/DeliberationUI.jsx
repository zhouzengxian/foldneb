import { useState, useCallback, useRef, useEffect } from 'react';
import useNebulaStore from '../store/useNebulaStore';
import {
  analyzeProblem, planRounds, getAgentResponse, getAgentResponsesBatch,
  extractInsights, generateReport, getAgentInfo,
  setDeliberationProvider, getDeliberationProvider,
} from '../utils/deliberationEngine';
import { MODEL_PROVIDERS, hasValidKey, getUserCreds, getProviderModels, getLastApiError } from '../utils/modelConfig';
import ApiSettingsPanel from './ApiSettingsPanel';
import DeliberationGraph from './DeliberationGraph';
import DeliberationHistory from './DeliberationHistory';
import DEMOS from '../utils/deliberationDemos';
import { generateReportImage, downloadReportImage } from '../utils/reportImage';
import { tier1Agents } from '../data/gameData';

// 预设典型问题（一人公司创始人场景）
const PRESET_PROBLEMS = [
  { icon: '🧪', label: '产品留存', text: '产品MVP已上线3个月，有200个试用用户但真正留下来用的不到20%。我该坚持打磨现有功能还是根据反馈做一个更大的改动？' },
  { icon: '💰', label: '定价策略', text: '我是一个独立开发者，产品功能不错但月收入停留在$500。该涨价服务付费客户，还是走免费+广告模式扩大用户量？' },
  { icon: '🎯', label: '方向选择', text: '身兼数职的一人公司，同时在做三件事：接外包养现金流、做SaaS产品、经营自媒体内容。精力分散什么都没做好，该怎么取舍？' },
  { icon: '🔄', label: '获客渠道', text: '我的知识付费产品内容质量很好，但流量全依赖小红书算法推荐。一旦停更就没人来。该All in自媒体还是建立自己的邮件列表/私域？' },
  { icon: '⚡', label: 'AI冲击', text: '我做的是语言翻译工具，最近GPT-4的翻译质量已经接近我的产品水平。我应该转型做AI辅助工作流还是深耕细分垂直领域做差异化？' },
];

// ============================================================
// 从横向「决策推演」结果提炼纵向「时间折叠」profile
// 横向已经多视角看透问题，纵向带这份结论去问"未来怎么看"
// ============================================================
function buildTemporalPrefillFromDeliberation(session, userName = '') {
  if (!session) return null;
  const report = session.report || {};
  const insights = report.keyInsights || session.insights || [];

  // 从洞察中找冲突类（横向指出风险/争议）
  const conflicts = insights.filter(i => i?.type === 'conflict').map(i => i.text);
  // 从洞察中找共识/机会类（横向给出的方向）
  const consensus = insights.filter(i => i?.type === 'consensus' || i?.type === 'insight').map(i => i.text);

  const currentSituation =
    report.coreFinding?.trim() ||
    session.problem?.trim() ||
    '';
  const goal =
    report.actionableAdvice?.trim() ||
    (consensus.length ? consensus.join('；') : '') ||
    '';
  const biggestFear =
    (conflicts.length ? conflicts.join('；') : '') ||
    report.reframedProblem?.trim() ||
    '';
  const keyDecision =
    report.reframedProblem?.trim() ||
    session.problem?.trim() ||
    '';

  return {
    name: userName || '',
    currentSituation,
    goal,
    biggestFear,
    keyDecision,
    _source: 'deliberation', // 标记来源，便于 UI 展示"基于本次推演"
  };
}

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
    openTemporal, openTemporalWithPrefill,
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
  const [wasCancelled, setWasCancelled] = useState(false);
  const [credsTick, setCredsTick] = useState(0); // 保存后刷新预览
  const [selectedNode, setSelectedNode] = useState(null); // 图谱选中的节点
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

  // 切换模型：同步到引擎；缺少 key 自动弹出配置面板
  const handleModelChange = (id) => {
    setModelProviderLocal(id);
    setDeliberationProvider(id);
    setShowApiSettings(!hasValidKey(id));
  };

  // ApiSettingsPanel 保存回调：刷新本地缓存，关闭面板
  const handleCredsSaved = () => {
    setCredsTick(t => t + 1);
    if (hasValidKey(modelProvider)) setShowApiSettings(false);
  };

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

    // 主流程外层 try/catch：捕获引擎抛出的 LLMUnavailableError（超时/无应答/解析失败）等，
    // 不让大模型失败的本地兜底数据被当成 AI 回复显示给用户（避免"瞎说"）
    try {

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
      let firstFailureReason = '';
      for (const resp of responses) {
        if (abortRef.current) return;
        if (resp && resp.text && !resp.failed) {
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
          const reason = resp?.error || '无应答';
          if (!firstFailureReason) firstFailureReason = reason;
          addLog(`  ⚠ ${agentName}: 大模型无应答（${reason}）`, 'error');
        }
      }
      if (failCount > 0 && failCount === responses.length) {
        // 本轮所有 Agent 都失败 → 中断推演，明确告知
        const msg = `本轮全部 Agent 大模型无应答：${firstFailureReason || getLastApiError() || '网络请求异常'}`;
        setError(msg);
        addLog(`❌ ${msg}`, 'error');
        setDeliberationPhase('idle');
        return;
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

    // 报告生成失败：不再用本地兜底假数据，明确告知用户（避免"瞎说"）
    if (!report) {
      const apiErr = getLastApiError();
      const msg = apiErr || '推演报告生成失败（大模型无应答）';
      setError(msg);
      addLog(`❌ ${msg}`, 'error');
      setDeliberationPhase('idle');
      return;
    }
    setDeliberationReport(report);

    addLog('✨ 推演完成！');

    } catch (e) {
      if (abortRef.current) return;          // 用户主动取消，不报错
      if (e?.name === 'AbortError') return;  // fetch 取消
      const reason = e?.name === 'LLMUnavailableError'
        ? e.message
        : (e?.message || '推演中断（未知错误）');
      setError(reason);
      addLog(`❌ ${reason}`, 'error');
      setDeliberationPhase('idle');
    }
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

  // 把本次横向推演结果带入纵向时间折叠（剩余 10%：横纵联动入口）
  const handleLaunchTemporal = useCallback(() => {
    const prefill = buildTemporalPrefillFromDeliberation(deliberationSession, userProfile?.name);
    // 关闭决策推演面板，打开时间折叠面板并预填
    closeDeliberation();
    setTimeout(() => openTemporalWithPrefill(prefill), 80);
  }, [deliberationSession, userProfile, closeDeliberation, openTemporalWithPrefill]);

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
    // 触发按钮组（决策推演 + 时间折叠）
    return (
      <div style={{
        position: 'fixed', bottom: 8, right: 8, zIndex: 30,
        display: 'flex', gap: 8,
      }}>
        <button
          onClick={openTemporal}
          title="时间折叠 · 与未来的自己对话"
          style={{
            background: 'linear-gradient(135deg, rgba(68,136,255,0.2), rgba(68,100,255,0.15))',
            border: '1px solid rgba(68,136,255,0.4)',
            borderRadius: '10px', padding: '8px 14px', cursor: 'pointer',
            color: '#8cf', fontSize: '13px', fontFamily: 'system-ui',
            fontWeight: 600, letterSpacing: '0.5px',
            boxShadow: '0 0 20px rgba(68,136,255,0.1)',
          }}
        >
          ⏳ 时间折叠
        </button>
        <button
          onClick={openDeliberation}
          title="决策推演"
          style={{
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
      </div>
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
        width: '95vw', maxWidth: 1100, maxHeight: '88vh',
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
                onClick={() => setShowApiSettings(!showApiSettings)}
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
                <button
                  onClick={handleLaunchTemporal}
                  title="用本次推演的结论去问未来的自己"
                  style={{
                    background: 'linear-gradient(135deg, rgba(68,136,255,0.22), rgba(68,100,255,0.15))',
                    border: '1px solid rgba(68,136,255,0.45)',
                    borderRadius: '6px', padding: '4px 12px', cursor: 'pointer',
                    color: '#9bb8ff', fontSize: '12px', fontFamily: 'system-ui', fontWeight: 600,
                  }}
                >
                  ⏳ 带入时间折叠
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
                {/* API 配置面板（共享组件，时间折叠复用同一份） */}
                {showApiSettings && mode === 'api' && (
                  <ApiSettingsPanel provider={modelProvider} onSaved={handleCredsSaved} />
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

            {/* 开启新推演 + 带入时间折叠（横纵联动） */}
            {deliberationPhase === 'complete' && (
              <div style={{ marginTop: 12, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleNewDeliberation}
                  style={{
                    padding: '10px 28px',
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
                <button
                  onClick={handleLaunchTemporal}
                  title="用本次推演的结论启动时间折叠"
                  style={{
                    padding: '10px 28px',
                    background: 'linear-gradient(135deg, rgba(68,136,255,0.22), rgba(68,100,255,0.15))',
                    border: '1px solid rgba(68,136,255,0.45)',
                    borderRadius: '10px', cursor: 'pointer',
                    color: '#9bb8ff', fontSize: '14px', fontFamily: 'system-ui',
                    fontWeight: 600, letterSpacing: '1px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(68,136,255,0.38), rgba(68,100,255,0.28))';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(68,136,255,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(68,136,255,0.22), rgba(68,100,255,0.15))';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  ⏳ 带入时间折叠
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

          {/* 右侧：推演图谱 + 节点详情 */}
          {session && (
            <div style={{ width: 480, flexShrink: 0 }}>
              <DeliberationGraph
                session={session}
                phase={deliberationPhase}
                onSelectNode={setSelectedNode}
                selectedNode={selectedNode}
              />
              {/* 节点详情面板 */}
              {selectedNode && (() => {
                if (selectedNode === 'user') {
                  return (
                    <div style={nodePanelStyle}>
                      <div style={nodePanelHeadStyle}>
                        <span style={{ color: '#FFD700', fontSize: '12px', fontWeight: 700 }}>🌟 提问者</span>
                        <button onClick={() => setSelectedNode(null)} style={closeBtnStyle}>×</button>
                      </div>
                      <div style={{ color: '#ccd', fontSize: '12px', fontFamily: 'system-ui', lineHeight: 1.6 }}>
                        {session.problem}
                      </div>
                    </div>
                  );
                }
                const agent = tier1Agents.find(a => a.id === selectedNode);
                if (!agent) return null;
                const utterances = [];
                (session.rounds || []).forEach((r, ri) => {
                  (r.dialogues || []).forEach(d => {
                    if (d.agentId === selectedNode) {
                      utterances.push({ round: ri + 1, text: d.text, theme: r.theme });
                    }
                  });
                });
                return (
                  <div style={nodePanelStyle}>
                    <div style={{ ...nodePanelHeadStyle, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8, marginBottom: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: agent.color, display: 'inline-block' }} />
                        <span style={{ color: agent.color || '#ccd', fontSize: '12px', fontWeight: 700 }}>{agent.name}</span>
                      </span>
                      <button onClick={() => setSelectedNode(null)} style={closeBtnStyle}>×</button>
                    </div>
                    {agent.title && (
                      <div style={{ color: '#889', fontSize: '10px', fontFamily: 'system-ui', marginBottom: 8 }}>
                        {agent.title}
                      </div>
                    )}
                    {utterances.length === 0 ? (
                      <div style={{ color: '#556', fontSize: '11px', fontFamily: 'system-ui', fontStyle: 'italic' }}>
                        等待发言…
                      </div>
                    ) : (
                      <div style={{ maxHeight: 200, overflow: 'auto' }}>
                        {utterances.map((u, i) => (
                          <div key={i} style={{
                            marginBottom: 8, padding: '8px 10px',
                            background: 'rgba(255,255,255,0.03)', borderRadius: '6px',
                            borderLeft: `2px solid ${agent.color}55`,
                          }}>
                            <div style={{ color: '#667', fontSize: '9px', fontFamily: 'system-ui', marginBottom: 3 }}>
                              R{u.round} · {u.theme}
                            </div>
                            <div style={{ color: '#ccc', fontSize: '11.5px', fontFamily: 'system-ui', lineHeight: 1.55 }}>
                              {u.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
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

// 节点详情面板样式
const nodePanelStyle = {
  marginTop: 10,
  padding: '10px 12px',
  background: 'rgba(6,6,18,0.6)',
  border: '1px solid rgba(255,215,0,0.12)',
  borderRadius: '10px',
};

const nodePanelHeadStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const closeBtnStyle = {
  background: 'none', border: 'none', color: '#666',
  cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1,
};
