import React, { useEffect, useState } from 'react';
import useNebulaStore from '../store/useNebulaStore.js';
import { tier1Agents, districts, getAgentById } from '../data/gameData.js';
import { openInObsidian } from '../utils/obsidianLink.js';
import DialoguePanel from './DialoguePanel.jsx';

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
  const [obsidianStatus, setObsidianStatus] = useState('');
  const [showDistrictPanel, setShowDistrictPanel] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const runDemo = useNebulaStore((s) => s.runDemo);
  const demoActive = useNebulaStore((s) => s.demoActive);

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
   * Obsidian 跳转
   */
  const handleOpenObsidian = () => {
    if (!agent) return;
    const result = openInObsidian(agent);
    if (result === 'copied') {
      setObsidianStatus('📋 已复制 Obsidian 链接到剪贴板');
    } else if (result) {
      setObsidianStatus('✅ 正在打开 Obsidian...');
    } else {
      setObsidianStatus('⚠️ 无法打开 Obsidian');
    }
    setTimeout(() => setObsidianStatus(''), 3000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
      {/* ========== 左上 Logo + 工具栏 ========== */}
      <div style={{ position: 'absolute', top: 24, left: 24, pointerEvents: 'auto', zIndex: 20, maxWidth: 500 }}>
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
                {districts.find(d => d.id === agent.district)?.name || agent.district} · {agent.tier === 1 ? 'Tier-1 明星' : `Tier-${agent.tier}`}
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

          {/* Obsidian 跳转按钮 */}
          <button onClick={handleOpenObsidian} style={{
            width: '100%', padding: '7px', borderRadius: 8,
            background: 'rgba(99,85,188,0.12)', border: '1px solid rgba(99,85,188,0.25)',
            color: '#8866CC', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
            marginBottom: 8,
          }}>
            📓 在 Obsidian 中打开档案
          </button>
          {obsidianStatus && (
            <div style={{ fontSize: 10, color: '#FFD700', textAlign: 'center', marginBottom: 6 }}>{obsidianStatus}</div>
          )}

          {/* 关注/取消关注 */}
          <div style={{ marginBottom: 8 }}>
            {userFriends.includes(selectedAgent) ? (
              <button onClick={() => removeFriend(selectedAgent)} style={{ width: '100%', padding: '7px', borderRadius: 8, background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)', color: '#ff8888', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>❌ 取消关注</button>
            ) : (
              <button onClick={() => addFriend(selectedAgent)} style={{ width: '100%', padding: '7px', borderRadius: 8, background: `${agent.color}18`, border: `1px solid ${agent.color}35`, color: agent.color, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>⭐ 关注 {agent.name}</button>
            )}
          </div>

          {/* 对话面板（仅关注后可见） */}
          {userFriends.includes(selectedAgent) && <DialoguePanel />}

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
    </div>
  );
}
