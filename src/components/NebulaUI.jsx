import { useEffect, useState } from 'react';
import useNebulaStore from '../store/useNebulaStore.js';
import { tier1Agents, getAgentById } from '../data/gameData.js';
import CloneCreator from './CloneCreator.jsx';
import ScenarioDemos from './ScenarioDemos.jsx';
import StudentDemoTour from './StudentDemoTour.jsx';
// 拆分出去的子组件
import DevProgressBar from './NebulaUI/DevProgressBar.jsx';
import DemoOverlay from './NebulaUI/DemoOverlay.jsx';
import DebugPanel from './NebulaUI/DebugPanel.jsx';
import DevFolder from './NebulaUI/DevFolder.jsx';
import DistrictPanel from './NebulaUI/DistrictPanel.jsx';
import AgentPanel from './NebulaUI/AgentPanel.jsx';
import ArchiveModal from './NebulaUI/ArchiveModal.jsx';

export default function NebulaUI() {
  const selectedAgent = useNebulaStore((s) => s.selectedAgent);
  const searchQuery = useNebulaStore((s) => s.searchQuery);
  const focusAgent = useNebulaStore((s) => s.focusAgent);
  const selectAgent = useNebulaStore((s) => s.selectAgent);
  const setSearchQuery = useNebulaStore((s) => s.setSearchQuery);
  const memories = useNebulaStore((s) => s.memories);
  const userFriends = useNebulaStore((s) => s.friends);

  const [searchResults, setSearchResults] = useState([]);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [showDistrictPanel, setShowDistrictPanel] = useState(false);
  const [scenarioDemosOpen, setScenarioDemosOpen] = useState(false);
  const [studentTourActive, setStudentTourActive] = useState(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const runDemo = useNebulaStore((s) => s.runDemo);
  const stopDemo = useNebulaStore((s) => s.stopDemo);
  const openDeliberationWithPrefill = useNebulaStore((s) => s.openDeliberationWithPrefill);
  const demoActive = useNebulaStore((s) => s.demoActive);
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



  // 记忆统计
  const totalMemories = Object.keys(memories).length;

  /** 打开网页档案 Modal */
  const handleOpenArchive = () => {
    if (!agent) return;
    setArchiveModalOpen(true);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 55, pointerEvents: 'none' }}>
      {/* ========== 顶部开发进度条（像素字 + 点状进度） ========== */}
      <DevProgressBar
        onLaunchStarTour={runDemo}
        onLaunchFounderDemo={() => {
          if (demoActive && stopDemo) stopDemo();
          const P6 = '我的B2B SaaS产品过去6个月增长停滞，月新增从20%跌到3%，老客户留存还行但获客成本翻倍。是该加大销售投入抢存量市场，还是改产品定位寻找新市场？';
          openDeliberationWithPrefill(P6, { autoChain: true });
        }}
        onLaunchStudentDemo={() => {
          if (demoActive && stopDemo) stopDemo();
          setStudentTourActive(true);
        }}
      />
      {/* ========== 左上 Logo + 工具栏 ========== */}
      <div className="nebula-top-toolbar" style={{ position: 'absolute', top: 56, left: 24, pointerEvents: 'auto', zIndex: 20, maxWidth: 500 }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{
            fontSize: 20, fontWeight: 700, color: '#FFD700', letterSpacing: '0.12em',
            textShadow: '0 0 24px rgba(255,215,0,0.4), 0 2px 4px rgba(0,0,0,0.6)',
          }}>FoldNeb 折叠星云</div>
          <div style={{ fontSize: 10, color: 'rgba(136,153,204,0.5)', letterSpacing: '0.15em', marginTop: 3 }}>
            13个星系 · 1000+位思想者 · 83亿个人生 · 1万亿个灵魂
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
            <button onClick={() => setShowDistrictPanel(!showDistrictPanel)} style={{
              padding: '7px 14px', borderRadius: 8,
              background: showDistrictPanel ? 'linear-gradient(135deg, rgba(136,153,204,0.35), rgba(136,153,204,0.2))' : 'linear-gradient(135deg, rgba(136,153,204,0.15), rgba(136,153,204,0.05))',
              border: '1px solid rgba(136,153,204,0.4)', backdropFilter: 'blur(8px)',
              color: '#c0cde0', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}>🗂️ 十三星系</button>
            <span style={{ fontSize: 10, color: 'rgba(136,153,204,0.3)' }}>单击星体 · 拖拽旋转</span>
          </div>
        )}
        <DistrictPanel visible={showDistrictPanel && !demoActive} />
        <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 10, color: 'rgba(136,153,204,0.35)' }}>
          <span>✦ {tier1Agents.length}位思想者</span>
          <span>✦ 关注 {userFriends.length}</span>
          {totalMemories > 0 && <span>✦ 记忆 {totalMemories}</span>}
        </div>
      </div>

      {/* ========== Agent 详情面板 ========== */}
      <AgentPanel onOpenArchive={handleOpenArchive} />

      {/* ========== 网页档案 Modal（拆分到 NebulaUI/ArchiveModal.jsx） ========== */}
      {archiveModalOpen && agent && (
        <ArchiveModal agent={agent} onClose={() => setArchiveModalOpen(false)} />
      )}

      {/* ========== Demo 旁白字幕 + 进度条 ========== */}
      <DemoOverlay />
      {/* 右上角「🚧 开发中」文件夹（旁白 / 截图 / 场景 Demo / 调试）+ 受控调试面板 */}
      <DevFolder
        onOpenScenarioDemos={() => setScenarioDemosOpen(true)}
        onOpenDebug={() => setDebugPanelOpen(true)}
      />
      <DebugPanel
        totalMemories={totalMemories}
        open={debugPanelOpen}
        onClose={() => setDebugPanelOpen(false)}
      />

      {/* ========== 自定义分身 Agent 创建/编辑表单 ========== */}
      <CloneCreator />

      {/* ========== 场景 Demo 启动面板（V4.7）========== */}
      {scenarioDemosOpen && (
        <ScenarioDemos
          onClose={() => setScenarioDemosOpen(false)}
          onLaunchStudent={() => setStudentTourActive(true)}
        />
      )}

      {/* ========== 学生探索 引导式分步 Demo（V4.7 修复）========== */}
      {studentTourActive && (
        <StudentDemoTour
          onClose={() => setStudentTourActive(false)}
          onOpenArchive={() => setArchiveModalOpen(true)}
        />
      )}
    </div>
  );
}
