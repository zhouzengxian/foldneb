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
  const [expandedDistrict, setExpandedDistrict] = useState(null);

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
      {/* ========== 左上 Logo ========== */}
      <div style={{ position: 'absolute', top: 20, left: 24, pointerEvents: 'auto' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD700', letterSpacing: '0.08em' }}>
          FoldNeb 折叠星云
        </div>
        <div style={{ fontSize: 11, color: '#8899bb', opacity: 0.6, marginTop: 2 }}>
          125位思想者 · 13个星系 · 会生长的知识星河
        </div>
      </div>

      {/* ========== 左侧 13 星系面板 ========== */}
      <div style={{ position: 'absolute', top: 100, left: 24, width: 200, maxHeight: 'calc(100vh - 130px)', overflowY: 'auto', pointerEvents: 'auto', background: 'rgba(5,5,32,0.6)', backdropFilter: 'blur(16px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '12px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#FFD700', padding: '0 14px 10px', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
          <span>🌌 十三星系</span>
          <span style={{ opacity: 0.5, fontSize: 11 }}>{userFriends.length}/125</span>
        </div>
        {districts.map((d) => {
          const isExpanded = expandedDistrict === d.id;
          const districtAgents = tier1Agents.filter((a) => a.district === d.id);
          return (
            <div key={d.id}>
              <button
                onClick={() => {
                  setExpandedDistrict(isExpanded ? null : d.id);
                  setDistrictFilter(districtFilter === d.id ? null : d.id);
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', border: 'none',
                  background: isExpanded || districtFilter === d.id
                    ? `${d.color}28`
                    : `${d.color}12`,
                  borderLeft: (isExpanded || districtFilter === d.id) ? `3px solid ${d.color}` : `3px solid ${d.color}60`,
                  color: isExpanded || districtFilter === d.id ? d.color : `${d.color}cc`,
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  transition: 'all 0.2s', fontWeight: isExpanded ? 600 : 400,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${d.color}28`; e.currentTarget.style.color = d.color; }}
                onMouseLeave={(e) => { if (!isExpanded && districtFilter !== d.id) { e.currentTarget.style.background = `${d.color}12`; e.currentTarget.style.color = `${d.color}cc`; } }}
              >
                <span style={{ fontSize: 10, opacity: 0.6, width: 16, textAlign: 'center' }}>
                  {isExpanded ? '▼' : '▶'}
                </span>
                <span style={{ flex: 1 }}>{d.name}</span>
                <span style={{ fontSize: 10, opacity: 0.5 }}>{districtAgents.length}</span>
              </button>
              {isExpanded && (
                <div style={{ padding: '4px 0 4px 0' }}>
                  {districtAgents.map((a) => (
                    <button key={a.id}
                      onClick={() => { focusAgent(a.id); selectAgent(a.id); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 14px 5px 32px', border: 'none',
                        background: selectedAgent === a.id ? `${a.color}1a` : 'transparent',
                        borderLeft: selectedAgent === a.id ? `2px solid ${a.color}` : '2px solid transparent',
                        color: selectedAgent === a.id ? a.color : '#aabbcc',
                        fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `${a.color}10`; e.currentTarget.style.color = a.color; }}
                      onMouseLeave={(e) => { if (selectedAgent !== a.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aabbcc'; } }}
                    >
                      <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{a.emoji}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ margin: '8px 14px 0', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10, color: '#8899aa', marginBottom: 2 }}>星河记忆总量</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFD700' }}>{totalMemories}</div>
        </div>
      </div>

      {/* ========== 顶部搜索栏 ========== */}
      <div style={{ position: 'absolute', top: 22, left: 250, right: 24, pointerEvents: 'auto' }}>
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索思想者..." style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(5,5,32,0.75)', backdropFilter: 'blur(16px)', color: '#e8f0ff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, opacity: 0.4 }} viewBox="0 0 24 24" fill="none" stroke="#e8f0ff" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, background: 'rgba(5,5,32,0.9)', backdropFilter: 'blur(20px)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
              {searchResults.slice(0, 12).map((a) => (
                <div key={a.id} onClick={() => { focusAgent(a.id); selectAgent(a.id); setSearchQuery(''); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', color: '#e8f0ff', fontSize: 14, borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,215,0,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: 18 }}>{a.emoji}</span>
                  <span>{a.name}</span>
                  <span style={{ color: a.color, opacity: 0.7, fontSize: 12 }}>{a.title}</span>
                </div>
              ))}
            </div>
          )}
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
