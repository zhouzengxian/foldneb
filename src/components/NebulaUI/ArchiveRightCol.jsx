import { useState } from 'react';
import ApiSettingsPanel from '../ApiSettingsPanel.jsx';
import {
  generateBusinessAnalysis,
  getArchiveProvider,
  setArchiveProvider,
} from '../../utils/analysisApi.js';
import { hasValidKey, getEffectiveConfig, MODEL_PROVIDERS } from '../../utils/modelConfig.js';
import { getActiveSkill } from '../../utils/analysisPrompt.js';
import SkillManagerPanel from './SkillManagerPanel.jsx';
import AnalysisContent from './AnalysisContent.jsx';

/**
 * 档案 Modal 右栏：Skill 管理 + 一键生成 + API 配置 + 分析内容
 * Skill 管理委派给 SkillManagerPanel，分析生成状态自管理
 */
export default function ArchiveRightCol({ agent }) {
  const [analysisByAgent, setAnalysisByAgent] = useState({});
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [archiveProvider, setArchiveProviderState] = useState(getArchiveProvider());
  const [expandedHistory, setExpandedHistory] = useState({});
  const [activeSkill, setActiveSkill] = useState(getActiveSkill());

  const handleGenerateAnalysis = async () => {
    if (!agent || analysisLoading) return;
    if (!hasValidKey(archiveProvider)) {
      setAnalysisError('请先配置 API Key（点击右上方 ⚙️）');
      setShowApiConfig(true);
      return;
    }
    setAnalysisLoading(true);
    setAnalysisError('');
    try {
      const md = await generateBusinessAnalysis(agent, (full) => {
        setAnalysisByAgent((prev) => ({
          ...prev,
          [agent.id]: { markdown: full, date: '', trigger: '', source: 'generating' },
        }));
      });
      setAnalysisByAgent((prev) => ({
        ...prev,
        [agent.id]: {
          markdown: md,
          date: new Date().toISOString().slice(0, 10),
          trigger: 'AI 实时生成',
          source: 'generated',
        },
      }));
    } catch (e) {
      setAnalysisError(e.message === 'NO_API_KEY' ? '请先配置 API Key' : `生成失败：${e.message}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleCredsSaved = (pid) => {
    setArchiveProviderState(pid);
    setArchiveProvider(pid);
    if (hasValidKey(pid)) {
      setShowApiConfig(false);
      setAnalysisError('');
    }
  };

  const toggleHistory = (date) => {
    setExpandedHistory((prev) => {
      const cur = new Set(prev[agent.id] || []);
      if (cur.has(date)) cur.delete(date);
      else cur.add(date);
      return { ...prev, [agent.id]: cur };
    });
  };

  return (
    <aside className="archive-right-col">
      {/* Skill 管理（含顶部工具条） */}
      <SkillManagerPanel onActiveSkillChange={setActiveSkill} />

      {/* 一键生成按钮 */}
      <button
        onClick={handleGenerateAnalysis}
        disabled={analysisLoading}
        className="analysis-gen-btn"
        style={{
          width: '100%', padding: '10px', borderRadius: 10, marginBottom: 12,
          background: analysisLoading
            ? 'linear-gradient(135deg, rgba(136,221,170,0.1), rgba(136,221,170,0.05))'
            : 'linear-gradient(135deg, rgba(136,221,170,0.22), rgba(136,221,170,0.08))',
          border: '1px solid ' + (analysisLoading ? 'rgba(136,221,170,0.25)' : 'rgba(136,221,170,0.4)'),
          color: '#88ddaa', fontSize: 12, cursor: analysisLoading ? 'wait' : 'pointer',
          fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.05em',
          transition: 'all 0.2s', opacity: analysisLoading ? 0.7 : 1,
        }}
      >
        {analysisLoading ? '⏳ 正在生成分析报告…' : activeSkill.emoji + ' ' + activeSkill.name + ' · 一键生成'}
      </button>

      {/* API 配置入口 */}
      <button
        onClick={() => setShowApiConfig(!showApiConfig)}
        style={{
          width: '100%', padding: '5px', marginBottom: 10,
          background: 'transparent', border: 'none',
          color: hasValidKey(archiveProvider) ? '#88ddaa' : '#ffaa66',
          fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
          opacity: 0.7,
        }}
      >
        {(() => {
          if (hasValidKey(archiveProvider)) {
            const p = MODEL_PROVIDERS.find(x => x.id === archiveProvider);
            const cfg = getEffectiveConfig(archiveProvider);
            return `⚙️ ${p?.name || archiveProvider} · ${cfg.model}`;
          }
          return '⚙️ 配置大模型 API（与决策推演共享密钥）';
        })()}
      </button>

      {showApiConfig && (
        <ApiSettingsPanel provider={archiveProvider} onSaved={handleCredsSaved} />
      )}

      {analysisError && (
        <div style={{
          padding: '8px 10px', marginBottom: 10, borderRadius: 8,
          background: 'rgba(255,120,120,0.08)', border: '1px solid rgba(255,120,120,0.2)',
          fontSize: 10.5, color: '#ff9999', lineHeight: 1.6,
        }}>⚠️ {analysisError}</div>
      )}

      <AnalysisContent
        agent={agent}
        analysisByAgent={analysisByAgent}
        analysisLoading={analysisLoading}
        expandedHistory={expandedHistory}
        onToggleHistory={toggleHistory}
      />
    </aside>
  );
}
