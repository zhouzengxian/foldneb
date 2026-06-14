import React, { useEffect, useState } from 'react';
import useNebulaStore from '../store/useNebulaStore.js';
import { tier1Agents, districts, getAgentById } from '../data/gameData.js';
import { tryOpenObsidianWithFallback } from '../utils/obsidianLink.js';
import DialoguePanel from './DialoguePanel.jsx';
import CloneCreator from './CloneCreator.jsx';
import CustomCloneChat from './CustomCloneChat.jsx';
import {
  generateBusinessAnalysis,
  renderMarkdown,
  isApiConfigured,
  getApiConfig,
  saveApiConfig,
} from '../utils/analysisApi.js';
import {
  getSkills,
  getActiveSkill,
  addSkill,
  updateSkill,
  deleteSkill,
  resetBuiltinSkill,
  setActiveSkillId as persistActiveSkill,
  skillToMarkdown,
} from '../utils/analysisPrompt.js';

export default function NebulaUI() {
  const selectedAgent = useNebulaStore((s) => s.selectedAgent);
  const panelOpen = useNebulaStore((s) => s.panelOpen);
  const searchQuery = useNebulaStore((s) => s.searchQuery);
  const districtFilter = useNebulaStore((s) => s.districtFilter);
  const focusAgent = useNebulaStore((s) => s.focusAgent);
  const deselectAgent = useNebulaStore((s) => s.deselectAgent);
  const selectAgent = useNebulaStore((s) => s.selectAgent);
  const setSearchQuery = useNebulaStore((s) => s.setSearchQuery);
  const setDistrictFilter = useNebulaStore((s) => s.setDistrictFilter);
  const memories = useNebulaStore((s) => s.memories);
  const userFriends = useNebulaStore((s) => s.friends);
  const addFriend = useNebulaStore((s) => s.addFriend);
  const removeFriend = useNebulaStore((s) => s.removeFriend);

  const [searchResults, setSearchResults] = useState([]);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [obsidianHint, setObsidianHint] = useState(''); // 'trying' | 'success' | 'fallback'
  const [showDistrictPanel, setShowDistrictPanel] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

  // ===== 右侧「近期深度分析」栏状态 =====
  // analysisByAgent: { [agentId]: { markdown, date, trigger, source } }  source: 'preset'|'generated'
  const [analysisByAgent, setAnalysisByAgent] = useState({});
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [apiConfigForm, setApiConfigForm] = useState(getApiConfig());

  // ===== Skill 管理状态 =====
  const [activeSkill, setActiveSkillState] = useState(getActiveSkill());
  const [skillManagerOpen, setSkillManagerOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null); // 正在编辑的 skill 副本（null=列表态）
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const runDemo = useNebulaStore((s) => s.runDemo);
  const demoActive = useNebulaStore((s) => s.demoActive);
  const demoSubtitle = useNebulaStore((s) => s.demoSubtitle);
  const demoPhase = useNebulaStore((s) => s.demoPhase);
  const narrationEnabled = useNebulaStore((s) => s.narrationEnabled);
  const toggleNarration = useNebulaStore((s) => s.toggleNarration);
  const demoShowPhone = useNebulaStore((s) => s.demoShowPhone);
  const demoShowDeliberation = useNebulaStore((s) => s.demoShowDeliberation);
  const takeScreenshot = useNebulaStore((s) => s.takeScreenshot);
  const screenshotReady = useNebulaStore((s) => s.screenshotReady);
  // 自定义分身
  const customClone = useNebulaStore((s) => s.customClone);
  const openCloneCreator = useNebulaStore((s) => s.openCloneCreator);

  // 搜索过滤
  useEffect(() => {
    if (searchQuery.length >= 1) {
      const q = searchQuery.toLowerCase();
      const results = tier1Agents.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.tags?.some((t) => t.toLowerCase().includes(q))
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const agent = selectedAgent ? getAgentById(selectedAgent) : null;

  // 记忆数量
  const memoryCount = selectedAgent
    ? Object.values(memories).filter(
        (m) => m.from === selectedAgent || m.to === selectedAgent
      ).length
    : 0;

  // 同坊区 Agent
  const sameDistrictAgents = agent
    ? tier1Agents.filter((a) => a.district === agent.district && a.id !== agent.id)
    : [];

  // 记忆统计
  const totalMemories = Object.keys(memories).length;

  /**
   * 打开网页档案 Modal（评委友好：保证有反馈，不依赖本地 Obsidian）
   */
  const handleOpenArchive = () => {
    if (!agent) return;
    setObsidianHint('');
    setArchiveModalOpen(true);
  };

  /**
   * 在档案 Modal 内尝试 Obsidian 跳转（异步检测，失败降级提示）
   */
  const handleTryObsidian = () => {
    if (!agent) return;
    setObsidianHint('trying');
    tryOpenObsidianWithFallback(agent, {
      onSuccess: () => {
        setObsidianHint('success');
        setTimeout(() => setObsidianHint(''), 3000);
      },
      onFallback: () => {
        setObsidianHint('fallback');
        // 保留剪贴板兜底
        try { navigator.clipboard.writeText(
          `obsidian://open?vault=${encodeURIComponent('AI一人公司')}&file=${encodeURIComponent(agent.name)}`
        ); } catch {}
      },
    });
  };

  /**
   * 一键生成「商业动态逻辑深度分析」
   * 调用大模型，流式回填到右侧栏
   */
  const handleGenerateAnalysis = async () => {
    if (!agent || analysisLoading) return;
    if (!isApiConfigured()) {
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

  /** 保存 API 配置 */
  const handleSaveApiConfig = () => {
    saveApiConfig(apiConfigForm);
    setShowApiConfig(false);
    setAnalysisError('');
  };

  // ===== Skill 管理操作 =====

  /** 切换激活 skill */
  const handleSelectSkill = (id) => {
    persistActiveSkill(id);
    const s = getSkills().find((x) => x.id === id);
    if (s) setActiveSkillState(s);
  };

  /** 保存编辑中的 skill */
  const handleSaveSkillEdit = () => {
    if (!editingSkill?.name?.trim()) return;
    updateSkill(editingSkill.id, {
      name: editingSkill.name.trim(),
      emoji: editingSkill.emoji?.trim() || '⚡',
      description: editingSkill.description,
      prompt: editingSkill.prompt,
    });
    setEditingSkill(null);
    setIsCreatingSkill(false);
    setActiveSkillState(getActiveSkill());
  };

  /** 新建 skill */
  const handleCreateSkill = () => {
    const s = addSkill({
      name: '新建 Skill',
      emoji: '⚡',
      description: '',
      prompt:
        '你是……（在此编写大模型 system prompt）\n\n## 分析对象\n- 姓名：{{agent.name}}\n- 身份：{{agent.title}}\n- 简介：{{agent.description}}\n\n## 任务\n（描述你希望大模型做什么）\n',
    });
    persistActiveSkill(s.id);
    setActiveSkillState(s);
    setEditingSkill({ ...s });
    setIsCreatingSkill(true);
  };

  /** 删除 skill（内置不可删） */
  const handleDeleteSkill = (id) => {
    const skill = getSkills().find((s) => s.id === id);
    if (skill?.builtin) return;
    if (!window.confirm('确定删除这个 Skill？此操作不可撤销。')) return;
    deleteSkill(id);
    setActiveSkillState(getActiveSkill());
  };

  /** 恢复内置 skill 到原始版本 */
  const handleResetBuiltin = () => {
    if (!window.confirm('恢复内置 Skill 到原始版本？当前对该 Skill 的编辑将被覆盖。')) return;
    resetBuiltinSkill();
    setEditingSkill(null);
    setActiveSkillState(getActiveSkill());
  };

  /** 导出 skill 为 md（下载文件 + 复制到剪贴板，供 Obsidian 本地留痕） */
  const handleExportSkill = (skill) => {
    const md = skillToMarkdown(skill);
    try { navigator.clipboard.writeText(md); } catch {}
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(skill.name || 'skill').replace(/[<>:"/\\|?*]/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Skill 管理面板里的小按钮统一样式
  const miniBtn = {
    padding: '3px 8px', borderRadius: 5, fontSize: 9.5, cursor: 'pointer',
    fontFamily: 'inherit', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(136,153,204,0.2)', color: '#a8b8d0',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
      {/* ========== 顶部开发进度条（像素字 + 点状进度） ========== */}
      <div className="dev-progress-bar">
        <div className="dot-track">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className={`dot${i < 8 ? ' on' : ''}${i === 7 ? ' head' : ''}`}
            />
          ))}
        </div>
        <div className="dev-label">开发进度</div>
        <div className="pixel-text">80%</div>
      </div>
      {/* ========== 左上 Logo + 工具栏 ========== */}
      <div style={{ position: 'absolute', top: 56, left: 24, pointerEvents: 'auto', zIndex: 20, maxWidth: 500 }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{
            fontSize: 20, fontWeight: 700, color: '#FFD700', letterSpacing: '0.12em',
            textShadow: '0 0 24px rgba(255,215,0,0.4), 0 2px 4px rgba(0,0,0,0.6)',
          }}>FoldNeb 折叠星云</div>
          <div style={{ fontSize: 10, color: 'rgba(136,153,204,0.5)', letterSpacing: '0.15em', marginTop: 3 }}>
            125位思想者 · 13个星系
          </div>
          <div style={{ width: 140, height: 1, background: 'linear-gradient(90deg, rgba(255,215,0,0.4), transparent)', marginTop: 6 }} />
        </div>
        {!demoActive && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {runDemo && (
              <button onClick={runDemo} style={{
                padding: '7px 16px', borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.08))',
                border: '1px solid rgba(255,215,0,0.4)', backdropFilter: 'blur(8px)',
                color: '#FFD700', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: '0.05em', transition: 'all 0.2s',
              }}>✨ 星河巡游</button>
            )}
            <button onClick={openCloneCreator} style={{
              padding: '7px 14px', borderRadius: 8,
              background: customClone
                ? 'linear-gradient(135deg, rgba(125,249,255,0.22), rgba(125,249,255,0.08))'
                : 'linear-gradient(135deg, rgba(125,249,255,0.12), rgba(125,249,255,0.04))',
              border: '1px solid ' + (customClone ? 'rgba(125,249,255,0.5)' : 'rgba(125,249,255,0.3)'),
              backdropFilter: 'blur(8px)',
              color: '#7DF9FF', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.05em', transition: 'all 0.2s',
              boxShadow: customClone ? '0 0 12px rgba(125,249,255,0.2)' : 'none',
            }}>{customClone ? `🪐 ${customClone.avatar} ${customClone.name}` : '🪐 创建分身'}</button>
            <button onClick={takeScreenshot} style={{
              padding: '7px 12px', borderRadius: 8,
              background: screenshotReady ? 'rgba(100,255,180,0.15)' : 'rgba(80,80,90,0.12)',
              border: '1px solid ' + (screenshotReady ? 'rgba(100,255,180,0.4)' : 'rgba(120,120,140,0.2)'),
              backdropFilter: 'blur(8px)',
              color: screenshotReady ? '#88ffbb' : 'rgba(150,150,160,0.6)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
            }}>{screenshotReady ? '✅ 已保存' : '📸 截图'}</button>
            <button onClick={toggleNarration} title={narrationEnabled ? '关闭语音旁白' : '开启语音旁白'} style={{
              padding: '7px 12px', borderRadius: 8,
              background: narrationEnabled ? 'rgba(100,180,255,0.12)' : 'rgba(80,80,90,0.15)',
              border: '1px solid ' + (narrationEnabled ? 'rgba(100,180,255,0.35)' : 'rgba(120,120,130,0.25)'),
              backdropFilter: 'blur(8px)',
              color: narrationEnabled ? '#88c8ff' : 'rgba(150,150,160,0.6)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
            }}>{narrationEnabled ? '🔊 旁白' : '🔇 旁白'}</button>
            <button onClick={() => { setShowDistrictPanel(!showDistrictPanel); if (showDistrictPanel) setSelectedDistrict(null); }} style={{
              padding: '7px 14px', borderRadius: 8,
              background: showDistrictPanel ? 'linear-gradient(135deg, rgba(136,153,204,0.35), rgba(136,153,204,0.2))' : 'linear-gradient(135deg, rgba(136,153,204,0.15), rgba(136,153,204,0.05))',
              border: '1px solid rgba(136,153,204,0.4)', backdropFilter: 'blur(8px)',
              color: '#c0cde0', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}>🗂️ 十三星系</button>
            <div style={{ position: 'relative' }}>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索思想者..." style={{
                width: 150, padding: '7px 12px 7px 34px', borderRadius: 8,
                border: '1px solid rgba(136,153,204,0.3)', background: 'rgba(10,8,20,0.7)', backdropFilter: 'blur(8px)',
                color: '#e8f0ff', fontSize: 12, outline: 'none', fontFamily: 'inherit',
              }} />
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, opacity: 0.4 }} viewBox="0 0 24 24" fill="none" stroke="#e8f0ff" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              {searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'rgba(10,8,20,0.95)', backdropFilter: 'blur(12px)', borderRadius: 8, border: '1px solid rgba(136,153,204,0.3)', overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
                  {searchResults.slice(0, 12).map((a) => (
                    <div key={a.id} onClick={() => { focusAgent(a.id); selectAgent(a.id); setSearchQuery(''); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: '#d0d8e8', borderBottom: '1px solid rgba(255,255,255,0.04)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(136,153,204,0.15)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <span style={{ fontSize: 14 }}>{a.emoji}</span>
                      <span style={{ color: a.color }}>{a.name}</span>
                      <span style={{ opacity: 0.5, fontSize: 10, marginLeft: 'auto' }}>{a.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span style={{ fontSize: 10, color: 'rgba(136,153,204,0.3)' }}>单击星体 · 拖拽旋转</span>
          </div>
        )}
        {showDistrictPanel && !demoActive && (
          <div style={{ marginTop: 8, background: 'rgba(10,8,20,0.85)', border: '1px solid rgba(136,153,204,0.25)', borderRadius: 10, backdropFilter: 'blur(12px)', display: 'flex', flexWrap: 'wrap', gap: 5, padding: 10 }}>
            {districts.map((d) => {
              const cnt = tier1Agents.filter((a) => a.district === d.id).length;
              return (
                <div key={d.id} onClick={() => { const nid = selectedDistrict === d.id ? null : d.id; setSelectedDistrict(nid); setDistrictFilter(nid); }} style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', color: '#d0d8e8', background: selectedDistrict === d.id ? `${d.color}30` : 'rgba(136,153,204,0.08)', border: `1px solid ${selectedDistrict === d.id ? d.color + '80' : 'transparent'}`, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5 }} onMouseEnter={(e) => e.currentTarget.style.background = `${d.color}28`} onMouseLeave={(e) => { if (selectedDistrict !== d.id) e.currentTarget.style.background = 'rgba(136,153,204,0.08)'; }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                  {d.name}
                  <span style={{ fontSize: 9, opacity: 0.4 }}>{cnt}</span>
                </div>
              );
            })}
          </div>
        )}
        {selectedDistrict && showDistrictPanel && !demoActive && (
          <div style={{ marginTop: 6, padding: 8, background: 'rgba(10,8,20,0.85)', border: '1px solid rgba(136,153,204,0.25)', borderRadius: 10, backdropFilter: 'blur(12px)', maxHeight: 200, overflowY: 'auto', maxWidth: 320 }}>
            {tier1Agents.filter((a) => a.district === selectedDistrict).map((a) => (
              <div key={a.id} onClick={() => { focusAgent(a.id); selectAgent(a.id); }} style={{ padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c0cde0', borderRadius: 4, background: selectedAgent === a.id ? `${a.color}15` : 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = `${a.color}12`} onMouseLeave={(e) => { if (selectedAgent !== a.id) e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ fontSize: 13 }}>{a.emoji}</span>
                <span style={{ color: a.color, fontWeight: 600 }}>{a.name}</span>
                <span style={{ opacity: 0.4, fontSize: 10, marginLeft: 'auto' }}>{a.title}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 10, color: 'rgba(136,153,204,0.35)' }}>
          <span>✦ {tier1Agents.length}位思想者</span>
          <span>✦ 关注 {userFriends.length}</span>
          {totalMemories > 0 && <span>✦ 记忆 {totalMemories}</span>}
        </div>

        {/* ========== 调试面板 ========== */}
        {debugPanelOpen && !demoActive && (
          <div style={{ marginTop: 10, background: 'rgba(10,8,20,0.92)', border: '1px solid rgba(255,100,100,0.3)', borderRadius: 12, backdropFilter: 'blur(16px)', padding: 16, maxWidth: 500 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FF6B6B', marginBottom: 10 }}>🔧 调试工具</div>

            {/* 批量取消关注 */}
            <button
              onClick={() => {
                // 批量取消所有关注，并同步清理 localStorage
                const allFriends = [...useNebulaStore.getState().friends];
                allFriends.forEach(id => useNebulaStore.getState().removeFriend(id));
                // 强制清空 friends
                localStorage.setItem('foldneb_friends', '[]');
                // 手动清理 memories 中的"关注"关系
                const mems = useNebulaStore.getState().memories;
                const cleaned = {};
                let changed = false;
                for (const [pk, m] of Object.entries(mems)) {
                  if (m.from === 'user' || m.to === 'user') {
                    const remaining = m.relations.filter(r => r.label !== '关注');
                    if (remaining.length === 0) {
                      changed = true;
                      continue; // 跳过，即删除
                    }
                    if (remaining.length !== m.relations.length) {
                      changed = true;
                      cleaned[pk] = { ...m, relations: remaining, interactionCount: remaining.length };
                    } else {
                      cleaned[pk] = m;
                    }
                  } else {
                    cleaned[pk] = m;
                  }
                }
                if (changed) {
                  localStorage.setItem('foldneb_memories', JSON.stringify(cleaned));
                }
                // 刷新页面使 Zustand 重新加载清理后的数据
                window.location.reload();
              }}
              style={{
                padding: '10px 20px', borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(255,80,80,0.3), rgba(255,80,80,0.1))',
                border: '1px solid rgba(255,80,80,0.5)',
                color: '#FF6B6B', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: '0.05em', transition: 'all 0.2s',
                width: '100%', marginBottom: 12,
              }}
            >🗑️ 强制清空所有关注 & 清理金色连线残留</button>

            {/* 当前状态 */}
            <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 12 }}>
              <p style={{ margin: '4px 0' }}>📊 friends 数组: <strong style={{ color: '#FFD700' }}>{useNebulaStore.getState().friends.join(', ') || '(空)'}</strong></p>
              <p style={{ margin: '4px 0' }}>📊 memories 条目: <strong style={{ color: '#FFD700' }}>{totalMemories} 条</strong></p>
              <p style={{ margin: '4px 0' }}>
                📊 含"关注"的 memories:
                <strong style={{ color: '#FF6B6B' }}>
                  {Object.values(useNebulaStore.getState().memories)
                    .filter(m => m.relations?.some(r => r.label === '关注')).length} 条
                </strong>
              </p>
            </div>

            {/* 重新关注 */}
            <div style={{ fontSize: 12, color: '#8899bb', marginBottom: 6 }}>🔄 重新关注（测试）：</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tier1Agents.slice(0, 8).map(a => (
                <button
                  key={a.id}
                  onClick={() => addFriend(a.id)}
                  style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: 'rgba(136,153,204,0.12)',
                    border: '1px solid rgba(136,153,204,0.25)',
                    color: '#c0d8ff', fontSize: 11, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                >{a.emoji} {a.name}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========== Agent 详情面板 ========== */}
      {panelOpen && agent && (
        <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', width: 380, background: 'rgba(5,5,32,0.92)', backdropFilter: 'blur(24px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', padding: '16px 18px', pointerEvents: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', color: '#e8f0ff', maxHeight: '88vh', overflowY: 'auto', fontSize: 12, lineHeight: 1.6 }}>
          <button onClick={deselectAgent} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer', fontSize: 18, padding: 2, lineHeight: 1 }}>✕</button>

          {/* Agent 头像 + 基本信息 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `radial-gradient(circle, ${agent.color}44, ${agent.color}11)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: `2px solid ${agent.color}55`, flexShrink: 0 }}>{agent.emoji}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{agent.name}</div>
              <div style={{ fontSize: 11, color: agent.color, opacity: 0.85 }}>{agent.title}</div>
              <div style={{ fontSize: 10, color: '#7788aa', marginTop: 2 }}>
                {agent.isCustom
                  ? '专属分身 · 锚定在你身旁'
                  : `${districts.find(d => d.id === agent.district)?.name || agent.district} · ${agent.tier === 1 ? 'Tier-1 明星' : `Tier-${agent.tier}`}`}
              </div>
            </div>
          </div>

          {/* 描述 */}
          <p style={{ fontSize: 12, lineHeight: 1.7, color: '#99aabb', marginBottom: 10, margin: 0 }}>{agent.description}</p>

          {/* 高光标签 */}
          {agent.highlights && agent.highlights.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: '#FFD700', opacity: 0.6, marginBottom: 4, letterSpacing: '0.05em' }}>关键成就</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {agent.highlights.map((h, i) => (
                  <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: `${agent.color}15`, color: `${agent.color}cc`, border: `1px solid ${agent.color}25` }}>{h}</span>
                ))}
              </div>
            </div>
          )}

          {/* 标签 */}
          {agent.tags && agent.tags.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {agent.tags.map((t, i) => (
                  <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', color: '#8899aa', border: '1px solid rgba(255,255,255,0.06)' }}>#{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* 卫星标签 */}
          {agent.satellites && agent.satellites.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: '#7788aa', opacity: 0.5, marginBottom: 3 }}>关联概念</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {agent.satellites.map((s, i) => (
                  <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: `${agent.color}10`, color: `${agent.color}aa` }}>{s.label}</span>
                ))}
              </div>
            </div>
          )}

          {/* 分隔线 */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />

          {/* 语录 */}
          {agent.dialogue && (
            <div style={{ fontSize: 11.5, color: '#bbccdd', fontStyle: 'italic', padding: '8px 12px', background: 'rgba(255,255,255,0.025)', borderRadius: 8, borderLeft: `3px solid ${agent.color}44`, lineHeight: 1.75, marginBottom: 10 }}>
              "{agent.dialogue}"
            </div>
          )}

          {/* 查看完整档案按钮（自定义分身不显示） */}
          {selectedAgent !== 'custom_clone' && (
            <button onClick={handleOpenArchive} style={{
              width: '100%', padding: '8px', borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(99,85,188,0.18), rgba(99,85,188,0.08))',
              border: '1px solid rgba(99,85,188,0.35)',
              color: '#a890e0', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em',
              transition: 'all 0.2s',
            }}>
              {agent.bio ? '📖 查看深度档案' : '📄 查看完整档案'}
            </button>
          )}

          {/* 自定义分身：编辑入口 */}
          {selectedAgent === 'custom_clone' && (
            <button
              onClick={() => useNebulaStore.getState().openCloneCreator()}
              style={{
                width: '100%', padding: '7px', borderRadius: 8,
                background: 'rgba(125,249,255,0.1)', border: '1px solid rgba(125,249,255,0.3)',
                color: '#7DF9FF', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                marginBottom: 8,
              }}
            >
              ✏️ 编辑分身设置
            </button>
          )}

          {/* 关注/取消关注 / 自定义分身聊天 */}
          {selectedAgent === 'custom_clone' ? (
            <CustomCloneChat />
          ) : (
            <div style={{ marginBottom: 8 }}>
              {userFriends.includes(selectedAgent) ? (
                <button onClick={() => removeFriend(selectedAgent)} style={{ width: '100%', padding: '7px', borderRadius: 8, background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)', color: '#ff8888', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>❌ 取消关注</button>
              ) : (
                <button onClick={() => addFriend(selectedAgent)} style={{ width: '100%', padding: '7px', borderRadius: 8, background: `${agent.color}18`, border: `1px solid ${agent.color}35`, color: agent.color, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>⭐ 关注 {agent.name}</button>
              )}
            </div>
          )}

          {/* 对话面板（仅关注后可见，自定义分身除外） */}
          {selectedAgent !== 'custom_clone' && userFriends.includes(selectedAgent) && <DialoguePanel />}

          {/* 记忆统计 */}
          <div style={{ padding: '10px 12px', background: 'rgba(255,215,0,0.04)', borderRadius: 10, border: '1px solid rgba(255,215,0,0.08)', marginTop: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: '#FFD700', opacity: 0.6, marginBottom: 2 }}>折叠记忆</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#FFD700' }}>{memoryCount}
              <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.5, marginLeft: 4 }}>条记忆晶体</span>
            </div>
          </div>

          {/* 同坊区其他 Agent */}
          {sameDistrictAgents.length > 0 && (
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFD700', marginBottom: 6, opacity: 0.5 }}>同坊区</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {sameDistrictAgents.slice(0, 16).map((a) => (
                  <button key={a.id} onClick={() => { focusAgent(a.id); selectAgent(a.id); }} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#99aabb', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>{a.emoji} {a.name}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== 网页档案 Modal（评委友好，不依赖本地 Obsidian） ========== */}
      {archiveModalOpen && agent && (
        <div
          onClick={() => setArchiveModalOpen(false)}
          className="archive-modal-overlay"
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'auto',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="archive-modal-card"
            style={{
              maxHeight: '90vh', overflowY: 'auto',
              background: 'linear-gradient(180deg, rgba(15,12,40,0.98), rgba(8,6,24,0.98))',
              borderRadius: 18, border: `1px solid ${agent.color}33`,
              boxShadow: `0 20px 80px rgba(0,0,0,0.6), 0 0 60px ${agent.color}15`,
              color: '#e8f0ff', position: 'relative',
              fontFamily: 'inherit',
            }}
          >
            {/* 关闭按钮 */}
            <button onClick={() => setArchiveModalOpen(false)} style={{
              position: 'absolute', top: 14, right: 16,
              background: 'none', border: 'none', color: '#8899bb',
              cursor: 'pointer', fontSize: 22, padding: 2, lineHeight: 1,
            }}>✕</button>

            {/* 顶部说明条 */}
            <div style={{
              fontSize: 10, color: '#7788aa', letterSpacing: '0.1em',
              marginBottom: 14, opacity: 0.7,
            }}>
              📄 思想者档案 · 在线预览 · 完整 Obsidian 联动需本地运行
            </div>

            {/* 头像 + 标题 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: `radial-gradient(circle, ${agent.color}44, ${agent.color}11)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, border: `2px solid ${agent.color}66`, flexShrink: 0,
                boxShadow: `0 0 24px ${agent.color}33`,
              }}>{agent.emoji}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{agent.name}</div>
                <div style={{ fontSize: 13, color: agent.color, marginTop: 4 }}>{agent.title}</div>
                <div style={{ fontSize: 11, color: '#7788aa', marginTop: 3 }}>
                  {districts.find(d => d.id === agent.district)?.name || agent.district} · {agent.tier === 1 ? 'Tier-1 智慧星河' : `Tier-${agent.tier} 精英星团`}
                </div>
              </div>
            </div>

            {/* ===== 两栏布局容器：左=基础资料 / 右=近期深度分析 ===== */}
            <div className="archive-two-col">
            {/* ===== 左栏：基础资料 ===== */}
            <div className="archive-left-col">

            {/* 一句话简介（原有 description 字段） */}
            {agent.description && (
              <div style={{
                marginBottom: 18, padding: '12px 14px',
                background: `${agent.color}10`, borderRadius: 10,
                borderLeft: `3px solid ${agent.color}88`,
              }}>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: '#bbccdd', margin: 0 }}>{agent.description}</p>
              </div>
            )}

            {/* ===== 完整传记（深度档案：bio，多段落）===== */}
            {agent.bio && agent.bio.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: 11, color: agent.color, marginBottom: 10,
                  letterSpacing: '0.15em', fontWeight: 600, opacity: 0.9,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ width: 3, height: 12, background: agent.color, borderRadius: 2 }} />
                  完整传记 · BIOGRAPHY
                </div>
                {agent.bio.map((p, i) => (
                  <p key={i} style={{
                    fontSize: 12.5, lineHeight: 1.85, color: '#c5d0e0', margin: '0 0 10px 0',
                    textIndent: '1.8em',
                  }}>{p}</p>
                ))}
              </div>
            )}

            {/* ===== 人生时间轴（深度档案：timeline） ===== */}
            {agent.timeline && agent.timeline.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: 11, color: agent.color, marginBottom: 12,
                  letterSpacing: '0.15em', fontWeight: 600, opacity: 0.9,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ width: 3, height: 12, background: agent.color, borderRadius: 2 }} />
                  人生里程碑 · TIMELINE
                </div>
                <div style={{ position: 'relative', paddingLeft: 16 }}>
                  {/* 垂直线 */}
                  <div style={{
                    position: 'absolute', left: 5, top: 4, bottom: 4,
                    width: 1, background: `${agent.color}33`,
                  }} />
                  {agent.timeline.map((item, i) => (
                    <div key={i} style={{ position: 'relative', marginBottom: 10 }}>
                      {/* 节点圆 */}
                      <div style={{
                        position: 'absolute', left: -16, top: 4,
                        width: 9, height: 9, borderRadius: '50%',
                        background: agent.color, boxShadow: `0 0 8px ${agent.color}88`,
                      }} />
                      <div style={{ fontSize: 11, color: agent.color, fontWeight: 600, marginBottom: 2 }}>
                        {item.year}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#b8c4d8', lineHeight: 1.6 }}>{item.event}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== 核心思想/方法论（深度档案：philosophy） ===== */}
            {agent.philosophy && agent.philosophy.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: 11, color: agent.color, marginBottom: 12,
                  letterSpacing: '0.15em', fontWeight: 600, opacity: 0.9,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ width: 3, height: 12, background: agent.color, borderRadius: 2 }} />
                  核心思想 · PHILOSOPHY
                </div>
                {agent.philosophy.map((ph, i) => (
                  <div key={i} style={{
                    marginBottom: 10, padding: '12px 14px',
                    background: 'rgba(255,255,255,0.025)', borderRadius: 10,
                    border: `1px solid ${agent.color}1a`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e8f0ff', marginBottom: 5 }}>
                      {i + 1}. {ph.title}
                    </div>
                    <div style={{ fontSize: 11.5, lineHeight: 1.75, color: '#aabbcc' }}>{ph.text}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ===== 多条经典语录（深度档案：quotes，替代原 dialogue 单条） ===== */}
            {agent.quotes && agent.quotes.length > 0 ? (
              <div style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: 11, color: agent.color, marginBottom: 12,
                  letterSpacing: '0.15em', fontWeight: 600, opacity: 0.9,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ width: 3, height: 12, background: agent.color, borderRadius: 2 }} />
                  经典语录 · QUOTES
                </div>
                {agent.quotes.map((q, i) => (
                  <div key={i} style={{
                    marginBottom: 8, padding: '11px 14px',
                    background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                    borderLeft: `3px solid ${agent.color}88`,
                  }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.8, color: '#d8e2f0', fontStyle: 'italic' }}>
                      "{q.text}"
                    </div>
                    {q.context && (
                      <div style={{ fontSize: 10, color: '#7788aa', marginTop: 6, lineHeight: 1.5 }}>
                        —— {q.context}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : agent.dialogue ? (
              /* 普通档案 fallback：单条 dialogue */
              <div style={{
                marginBottom: 18, padding: '14px 16px',
                background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                borderLeft: `3px solid ${agent.color}88`,
              }}>
                <div style={{ fontSize: 10, color: '#FFD700', opacity: 0.6, marginBottom: 6, letterSpacing: '0.1em' }}>经典语录</div>
                <div style={{ fontSize: 13, lineHeight: 1.85, color: '#d0dae8', fontStyle: 'italic' }}>
                  "{agent.dialogue}"
                </div>
              </div>
            ) : null}

            {/* ===== 代表作/产品（深度档案：works） ===== */}
            {agent.works && agent.works.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: 11, color: agent.color, marginBottom: 12,
                  letterSpacing: '0.15em', fontWeight: 600, opacity: 0.9,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ width: 3, height: 12, background: agent.color, borderRadius: 2 }} />
                  代表作与产品 · WORKS
                </div>
                {agent.works.map((w, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 12, marginBottom: 8, padding: '10px 12px',
                    background: 'rgba(255,255,255,0.02)', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{
                      flexShrink: 0, fontSize: 10, padding: '3px 8px',
                      borderRadius: 6, background: `${agent.color}1a`,
                      color: agent.color, fontWeight: 600, height: 'fit-content',
                    }}>{w.year}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: '#e0e8f5', fontWeight: 500, marginBottom: 3 }}>
                        {w.name} <span style={{ fontSize: 10, color: '#7788aa', fontWeight: 400 }}>· {w.type}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#99aabb', lineHeight: 1.6 }}>{w.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ===== 影响与启示（深度档案：legacy） ===== */}
            {agent.legacy && (
              <div style={{
                marginBottom: 18, padding: '16px 18px',
                background: `linear-gradient(135deg, ${agent.color}12, ${agent.color}05)`,
                borderRadius: 14, border: `1px solid ${agent.color}25`,
              }}>
                <div style={{
                  fontSize: 11, color: agent.color, marginBottom: 10,
                  letterSpacing: '0.15em', fontWeight: 600, opacity: 0.9,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ width: 3, height: 12, background: agent.color, borderRadius: 2 }} />
                  影响与启示 · LEGACY
                </div>
                <p style={{ fontSize: 12.5, lineHeight: 1.85, color: '#cad4e2', margin: 0 }}>{agent.legacy}</p>
              </div>
            )}

            {/* 关键成就（原有 highlights 字段） */}
            {agent.highlights && agent.highlights.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: '#FFD700', opacity: 0.6, marginBottom: 6, letterSpacing: '0.1em' }}>关键成就</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {agent.highlights.map((h, i) => (
                    <span key={i} style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 8,
                      background: `${agent.color}18`, color: `${agent.color}dd`,
                      border: `1px solid ${agent.color}33`,
                    }}>{h}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 关联概念 */}
            {agent.satellites && agent.satellites.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: '#FFD700', opacity: 0.6, marginBottom: 6, letterSpacing: '0.1em' }}>关联概念</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {agent.satellites.map((s, i) => (
                    <span key={i} style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 8,
                      background: `${agent.color}12`, color: `${agent.color}bb`,
                    }}>{s.label}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 标签 */}
            {agent.tags && agent.tags.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {agent.tags.map((t, i) => (
                    <span key={i} style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.04)', color: '#8899aa',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>#{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 分隔 */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 0 16px' }} />

            {/* Obsidian 路径信息（精简版） */}
            <div style={{
              padding: '12px 14px', marginBottom: 14,
              background: 'rgba(99,85,188,0.06)', borderRadius: 10,
              border: '1px solid rgba(99,85,188,0.14)',
              fontSize: 10, color: '#7788aa', lineHeight: 1.7,
            }}>
              <div style={{ color: '#8866CC', marginBottom: 6, letterSpacing: '0.05em', fontSize: 10 }}>📂 Obsidian 知识库路径</div>
              <div style={{ color: '#99aabb', fontSize: 10, wordBreak: 'break-all' }}>
                AI一人公司 / 11-黑客松大赛 / 折叠星云agent数据库 / {agent.tier === 2 ? '2_精英星团' : '1_智慧星河'} / {districts.find(d => d.id === agent.district)?.name || agent.district} / {agent.name}.md
              </div>
            </div>

            {/* Obsidian 跳转按钮 + 状态提示 */}
            <button onClick={handleTryObsidian} style={{
              width: '100%', padding: '10px', borderRadius: 10,
              background: obsidianHint === 'success'
                ? 'linear-gradient(135deg, rgba(100,200,120,0.2), rgba(100,200,120,0.08))'
                : 'linear-gradient(135deg, rgba(99,85,188,0.18), rgba(99,85,188,0.08))',
              border: '1px solid ' + (obsidianHint === 'success' ? 'rgba(100,200,120,0.4)' : 'rgba(99,85,188,0.35)'),
              color: obsidianHint === 'success' ? '#88ddaa' : '#a890e0',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
              transition: 'all 0.2s',
            }}>
              {obsidianHint === 'trying' ? '⏳ 正在尝试打开 Obsidian...' :
               obsidianHint === 'success' ? '✅ 已打开 Obsidian' :
               obsidianHint === 'fallback' ? '📓 未检测到 Obsidian（在线环境正常）' :
               '📓 在 Obsidian 中打开（本地用户）'}
            </button>

            {/* fallback 提示 */}
            {obsidianHint === 'fallback' && (
              <div style={{
                marginTop: 10, padding: '10px 12px',
                background: 'rgba(255,200,100,0.06)', borderRadius: 8,
                border: '1px solid rgba(255,200,100,0.15)',
                fontSize: 10.5, color: '#e8c890', lineHeight: 1.7,
              }}>
                💡 这是因为您当前是<b>在线 Demo 环境</b>，浏览器无法直接唤起本地 Obsidian。<br/>
                完整体验：clone 仓库 → 本地运行 → 安装 Obsidian → 导入「AI一人公司」vault。<br/>
                URI 已复制到剪贴板，可在本地浏览器地址栏粘贴试用。
              </div>
            )}
            </div>{/* /左栏 */}

            {/* ===== 右栏：近期深度分析 ===== */}
            <aside className="archive-right-col">
              <div style={{
                fontSize: 11, color: '#88ddaa', marginBottom: 10,
                letterSpacing: '0.15em', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
                justifyContent: 'space-between',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 3, height: 12, background: '#88ddaa', borderRadius: 2 }} />
                  {activeSkill.emoji} {activeSkill.name}
                </span>
                <button
                  onClick={() => { setSkillManagerOpen(!skillManagerOpen); setEditingSkill(null); }}
                  style={{
                    background: 'transparent', border: '1px solid rgba(136,221,170,0.25)',
                    color: '#88ddaa', fontSize: 9.5, padding: '2px 8px', borderRadius: 10,
                    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em',
                  }}
                  title="管理 / 编辑 / 新增 Skill（大模型指令模板）"
                >
                  Skill 库 {skillManagerOpen ? '▲' : '▼'}
                </button>
              </div>

              {/* ===== Skill 管理面板 ===== */}
              {skillManagerOpen && (
                <div style={{
                  marginBottom: 12, padding: 10, borderRadius: 10,
                  background: 'rgba(136,221,170,0.04)',
                  border: '1px solid rgba(136,221,170,0.18)',
                }}>
                  {editingSkill ? (
                    /* ---- 编辑态 ---- */
                    <div>
                      <div style={{ fontSize: 9.5, color: '#88ddaa', marginBottom: 8, letterSpacing: '0.05em' }}>
                        ✎ 编辑 Skill 指令模板
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input
                          value={editingSkill.emoji}
                          onChange={(e) => setEditingSkill({ ...editingSkill, emoji: e.target.value })}
                          placeholder="🦐"
                          style={{ width: 50, padding: '6px', textAlign: 'center', borderRadius: 6,
                            background: 'rgba(10,8,20,0.7)', border: '1px solid rgba(136,153,204,0.3)',
                            color: '#e8f0ff', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                        />
                        <input
                          value={editingSkill.name}
                          onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                          placeholder="Skill 名称"
                          style={{ flex: 1, padding: '6px 8px', borderRadius: 6,
                            background: 'rgba(10,8,20,0.7)', border: '1px solid rgba(136,153,204,0.3)',
                            color: '#e8f0ff', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                        />
                      </div>
                      <input
                        value={editingSkill.description}
                        onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })}
                        placeholder="一句话描述这个 Skill 做什么"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, marginBottom: 8, boxSizing: 'border-box',
                          background: 'rgba(10,8,20,0.7)', border: '1px solid rgba(136,153,204,0.3)',
                          color: '#e8f0ff', fontSize: 11, fontFamily: 'inherit', outline: 'none' }}
                      />
                      <div style={{ fontSize: 9, color: '#7788aa', marginBottom: 4, lineHeight: 1.6 }}>
                        Prompt 模板 · 占位符（生成时自动替换为当前人物）：
                        <code style={{ color: '#88ddaa' }}>{'{'}{`{agent.name}`}{'}'}</code>{' '}
                        <code style={{ color: '#88ddaa' }}>{'{'}{`{agent.title}`}{'}'}</code>{' '}
                        <code style={{ color: '#88ddaa' }}>{'{'}{`{agent.description}`}{'}'}</code>{' '}
                        <code style={{ color: '#88ddaa' }}>{'{'}{`{agent.philosophy}`}{'}'}</code>
                      </div>
                      <textarea
                        value={editingSkill.prompt}
                        onChange={(e) => setEditingSkill({ ...editingSkill, prompt: e.target.value })}
                        spellCheck={false}
                        style={{ width: '100%', minHeight: 240, padding: '8px', borderRadius: 6, marginBottom: 8, boxSizing: 'border-box',
                          background: 'rgba(10,8,20,0.85)', border: '1px solid rgba(136,153,204,0.3)',
                          color: '#c5d0e0', fontSize: 10.5, fontFamily: 'Consolas, "Cascadia Code", monospace', outline: 'none',
                          lineHeight: 1.6, resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={handleSaveSkillEdit} style={{ flex: 1, padding: '7px', borderRadius: 6,
                          background: 'rgba(136,221,170,0.2)', border: '1px solid rgba(136,221,170,0.4)',
                          color: '#88ddaa', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                          ✓ 保存 Skill
                        </button>
                        <button onClick={() => { setEditingSkill(null); setIsCreatingSkill(false); }} style={{ padding: '7px 14px', borderRadius: 6,
                          background: 'transparent', border: '1px solid rgba(136,153,204,0.3)',
                          color: '#8899bb', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ---- 列表态 ---- */
                    <div>
                      {getSkills().map((s) => (
                        <div key={s.id} style={{
                          padding: '8px', marginBottom: 6, borderRadius: 8,
                          background: s.id === activeSkill.id ? 'rgba(136,221,170,0.1)' : 'rgba(255,255,255,0.02)',
                          border: '1px solid ' + (s.id === activeSkill.id ? 'rgba(136,221,170,0.4)' : 'rgba(255,255,255,0.05)'),
                        }}>
                          <div style={{ fontSize: 11, color: '#e8f0ff', fontWeight: 600, marginBottom: 3 }}>
                            {s.emoji} {s.name}
                            {s.id === activeSkill.id && <span style={{ fontSize: 8.5, color: '#88ddaa', marginLeft: 6 }}>● 当前</span>}
                            {s.builtin && <span style={{ fontSize: 8.5, color: '#7788aa', marginLeft: 4 }}>· 内置</span>}
                            {s.builtin_edited && <span style={{ fontSize: 8.5, color: '#ffaa66', marginLeft: 4 }}>· 已编辑</span>}
                          </div>
                          {s.description && <div style={{ fontSize: 9.5, color: '#8899bb', lineHeight: 1.5, marginBottom: 5 }}>{s.description}</div>}
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {s.id !== activeSkill.id && (
                              <button onClick={() => handleSelectSkill(s.id)} style={miniBtn}>设为当前</button>
                            )}
                            <button onClick={() => setEditingSkill({ ...s })} style={miniBtn}>✎ 编辑</button>
                            <button onClick={() => handleExportSkill(s)} style={miniBtn} title="导出为 md 文件 + 复制（供 Obsidian 本地留痕）">⬇ 导出 md</button>
                            {!s.builtin && (
                              <button onClick={() => handleDeleteSkill(s.id)} style={{ ...miniBtn, color: '#ff9999' }}>✕ 删除</button>
                            )}
                          </div>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button onClick={handleCreateSkill} style={{ flex: 1, padding: '7px', borderRadius: 6,
                          background: 'rgba(136,221,170,0.12)', border: '1px dashed rgba(136,221,170,0.35)',
                          color: '#88ddaa', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                          ＋ 新建 Skill
                        </button>
                        <button onClick={handleResetBuiltin} style={{ padding: '7px 10px', borderRadius: 6,
                          background: 'transparent', border: '1px solid rgba(136,153,204,0.25)',
                          color: '#8899bb', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}
                          title="恢复内置情报虾 Skill 到原始版本">
                          ↺ 重置内置
                        </button>
                      </div>
                      <div style={{ fontSize: 8.5, color: '#6677aa', marginTop: 8, lineHeight: 1.6 }}>
                        Skill = 大模型 system prompt 模板。编辑/新增后点「一键生成」即用新指令。所有数据存本地浏览器，可导出 md 留痕。
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  color: isApiConfigured() ? '#88ddaa' : '#ffaa66',
                  fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
                  opacity: 0.7,
                }}
              >
                {isApiConfigured() ? `⚙️ ${getApiConfig().model}` : '⚙️ 配置大模型 API（未配置）'}
              </button>

              {/* API 配置表单 */}
              {showApiConfig && (
                <div style={{
                  padding: 12, marginBottom: 12,
                  background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                  border: '1px solid rgba(136,221,170,0.15)',
                  fontSize: 11,
                }}>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', color: '#8899bb', marginBottom: 3 }}>API Base URL</label>
                    <input
                      type="text" value={apiConfigForm.baseURL}
                      onChange={(e) => setApiConfigForm({ ...apiConfigForm, baseURL: e.target.value })}
                      placeholder="https://api.openai.com/v1"
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6,
                        background: 'rgba(10,8,20,0.7)', border: '1px solid rgba(136,153,204,0.3)',
                        color: '#e8f0ff', fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', color: '#8899bb', marginBottom: 3 }}>API Key</label>
                    <input
                      type="password" value={apiConfigForm.apiKey}
                      onChange={(e) => setApiConfigForm({ ...apiConfigForm, apiKey: e.target.value })}
                      placeholder="sk-..."
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6,
                        background: 'rgba(10,8,20,0.7)', border: '1px solid rgba(136,153,204,0.3)',
                        color: '#e8f0ff', fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', color: '#8899bb', marginBottom: 3 }}>Model</label>
                    <input
                      type="text" value={apiConfigForm.model}
                      onChange={(e) => setApiConfigForm({ ...apiConfigForm, model: e.target.value })}
                      placeholder="gpt-4o / glm-4 / deepseek-chat ..."
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6,
                        background: 'rgba(10,8,20,0.7)', border: '1px solid rgba(136,153,204,0.3)',
                        color: '#e8f0ff', fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button onClick={handleSaveApiConfig} style={{
                    width: '100%', padding: '7px', borderRadius: 6,
                    background: 'rgba(136,221,170,0.15)', border: '1px solid rgba(136,221,170,0.35)',
                    color: '#88ddaa', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                  }}>✓ 保存配置</button>
                  <div style={{ fontSize: 9.5, color: '#7788aa', marginTop: 6, lineHeight: 1.5 }}>
                    支持 OpenAI 兼容接口（GLM / DeepSeek / Kimi / 通义等）。Key 仅存于本地浏览器。
                  </div>
                </div>
              )}

              {/* 错误提示 */}
              {analysisError && (
                <div style={{
                  padding: '8px 10px', marginBottom: 10, borderRadius: 8,
                  background: 'rgba(255,120,120,0.08)', border: '1px solid rgba(255,120,120,0.2)',
                  fontSize: 10.5, color: '#ff9999', lineHeight: 1.6,
                }}>⚠️ {analysisError}</div>
              )}

              {/* 分析内容渲染 */}
              {(() => {
                const cached = analysisByAgent[agent.id];
                const preset = agent.recentAnalysis;
                const data = cached || (preset ? {
                  markdown: preset.markdown,
                  date: preset.date,
                  trigger: preset.trigger,
                  source: 'preset',
                } : null);

                if (analysisLoading && !cached) {
                  return (
                    <div style={{ textAlign: 'center', padding: 40, color: '#7788aa', fontSize: 11 }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
                      大模型正在生成深度分析…
                    </div>
                  );
                }

                if (!data) {
                  return (
                    <div style={{
                      padding: 24, textAlign: 'center', borderRadius: 10,
                      background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(136,153,204,0.2)',
                      color: '#8899bb', fontSize: 11, lineHeight: 1.8,
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 8 }}>📊</div>
                      暂无近期深度分析<br/>
                      点击上方按钮，接入大模型一键生成
                    </div>
                  );
                }

                return (
                  <>
                    {/* 元信息条 */}
                    <div style={{
                      fontSize: 9.5, color: '#7788aa', marginBottom: 8, lineHeight: 1.6,
                      padding: '6px 8px', background: 'rgba(136,221,170,0.04)', borderRadius: 6,
                      borderLeft: '2px solid rgba(136,221,170,0.3)',
                    }}>
                      {data.date && <div>📅 {data.date}</div>}
                      {data.trigger && <div style={{ marginTop: 2 }}>🎯 {data.trigger}</div>}
                      <div style={{ marginTop: 2, opacity: 0.6 }}>
                        {data.source === 'preset' ? '📋 预置样本分析' :
                         data.source === 'generating' ? '⏳ 生成中…' :
                         '✨ AI 实时生成'}
                      </div>
                    </div>
                    {/* Markdown 渲染 */}
                    <div
                      className="analysis-md-body"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(data.markdown) }}
                    />
                  </>
                );
              })()}
            </aside>
            </div>{/* /两栏容器 */}
          </div>
        </div>
      )}

      {/* ========== Demo 旁白字幕 + 进度条 ========== */}
      {demoActive && (
        <>
          {/* 底部旁白字幕 */}
          {demoSubtitle && (
            <div style={{
              position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
              maxWidth: 720, textAlign: 'center', pointerEvents: 'none',
              padding: '12px 32px',
              background: 'rgba(5,5,20,0.6)',
              backdropFilter: 'blur(12px)',
              borderRadius: 12,
              borderTop: '1px solid rgba(255,215,0,0.15)',
              animation: 'fadeInUp 0.6s ease-out',
            }}>
              <div style={{
                fontSize: 16, lineHeight: 1.8, color: '#e8f0ff',
                textShadow: '0 0 20px rgba(100,150,255,0.3), 0 2px 4px rgba(0,0,0,0.8)',
                letterSpacing: '0.04em',
              }}>
                {demoSubtitle}
              </div>
            </div>
          )}

          {/* 顶部进度指示器 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'rgba(255,215,0,0.1)',
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #FFD700, #FFAA44, #FFD700)',
              boxShadow: '0 0 8px rgba(255,215,0,0.6)',
              animation: 'demoProgress 45s linear forwards',
            }} />
          </div>

          {/* Phase 5: Logo 收尾大字幕 */}
          {demoPhase === 5 && (
            <div style={{
              position: 'absolute', top: '38%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center', pointerEvents: 'none',
              animation: 'logoFadeIn 2s ease-out forwards',
            }}>
              <div style={{
                fontSize: 42, fontWeight: 800, color: '#FFD700',
                letterSpacing: '0.15em',
                textShadow: '0 0 40px rgba(255,215,0,0.5), 0 0 80px rgba(255,215,0,0.2), 0 4px 12px rgba(0,0,0,0.8)',
              }}>
                FoldNeb 折叠星云
              </div>
              <div style={{
                fontSize: 14, color: 'rgba(200,210,230,0.7)',
                letterSpacing: '0.3em', marginTop: 12,
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              }}>
                为思考者建造会生长的思想星河
              </div>
            </div>
          )}

          {/* Demo 朋友圈闪现提示 */}
          {demoShowPhone && (
            <div style={{
              position: 'absolute', top: '20%', right: '15%',
              pointerEvents: 'none',
              animation: 'phoneFlash 1.8s ease-in-out forwards',
            }}>
              <div style={{
                textAlign: 'center',
                padding: '20px 30px',
                background: 'rgba(5,5,20,0.85)',
                backdropFilter: 'blur(16px)',
                borderRadius: 16,
                border: '2px solid rgba(255,215,0,0.3)',
                boxShadow: '0 0 40px rgba(255,215,0,0.15)',
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📱</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD700', letterSpacing: '0.05em' }}>
                  思想者朋友圈
                </div>
                <div style={{ fontSize: 11, color: '#8899bb', marginTop: 4 }}>
                  点赞 · 评论 · 自动回复
                </div>
              </div>
            </div>
          )}

          {/* Demo 决策推演闪现提示 */}
          {demoShowDeliberation && (
            <div style={{
              position: 'absolute', top: '20%', left: '15%',
              pointerEvents: 'none',
              animation: 'phoneFlash 1.8s ease-in-out forwards',
            }}>
              <div style={{
                textAlign: 'center',
                padding: '20px 30px',
                background: 'rgba(5,5,20,0.85)',
                backdropFilter: 'blur(16px)',
                borderRadius: 16,
                border: '2px solid rgba(100,180,255,0.3)',
                boxShadow: '0 0 40px rgba(100,180,255,0.15)',
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🧠</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#88bbff', letterSpacing: '0.05em' }}>
                  多Agent决策推演
                </div>
                <div style={{ fontSize: 11, color: '#8899bb', marginTop: 4 }}>
                  智囊团 · 多轮辩论 · 结构化报告
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {/* 右上角调试按钮 */}
      <button
        onClick={() => setDebugPanelOpen(!debugPanelOpen)}
        title="调试工具"
        style={{
          position: 'fixed', top: 24, right: 24, zIndex: 30,
          pointerEvents: 'auto',
          background: 'rgba(136,153,204,0.12)',
          border: '1px solid rgba(136,153,204,0.25)',
          borderRadius: '10px', padding: '8px 14px', cursor: 'pointer',
          color: '#c0d8ff', fontSize: '13px', fontFamily: 'system-ui',
          fontWeight: 600, letterSpacing: '0.5px',
          boxShadow: '0 0 20px rgba(136,153,204,0.08)',
        }}
      >🔧 调试</button>

      {/* ========== 自定义分身 Agent 创建/编辑表单 ========== */}
      <CloneCreator />
    </div>
  );
}
