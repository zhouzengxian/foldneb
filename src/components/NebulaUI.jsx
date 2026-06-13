import React, { useEffect, useState } from 'react';
import useNebulaStore from '../store/useNebulaStore.js';
import { tier1Agents, districts, getAgentById } from '../data/gameData.js';
import { getObsidianUri, openInObsidian } from '../utils/obsidianLink.js';
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
  const userFriends = useNebulaStore((s) => s.userFriends);
  const addFriend = useNebulaStore((s) => s.addFriend);
  const removeFriend = useNebulaStore((s) => s.removeFriend);

  const [searchResults, setSearchResults] = useState([]);
  const [obsidianStatus, setObsidianStatus] = useState('');

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

  // 朋友列表
  const friendsData = userFriends.map((id) => getAgentById(id)).filter(Boolean);
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

      {/* ========== 左侧朋友列表 ========== */}
      <div style={{ position: 'absolute', top: 110, left: 24, width: 200, pointerEvents: 'auto', background: 'rgba(5,5,32,0.6)', backdropFilter: 'blur(16px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#FFD700', marginBottom: 12, letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
          <span>🌟 分身·思想朋友</span>
          <span style={{ opacity: 0.5, fontSize: 11 }}>{userFriends.length}/125</span>
        </div>
        {friendsData.length === 0 ? (
          <div style={{ fontSize: 12, color: '#556677', lineHeight: 1.6 }}>
            点击星空中闪烁的
            <br />
            思想者节点，
            <br />
            关注他们成为朋友
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {friendsData.slice(0, 8).map((f) => (
              <button key={f.id} onClick={() => focusAgent(f.id)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10,
                background: selectedAgent === f.id ? `${f.color}22` : 'rgba(255,255,255,0.03)',
                border: selectedAgent === f.id ? `1px solid ${f.color}44` : '1px solid transparent',
                color: selectedAgent === f.id ? f.color : '#aabbcc', fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 16 }}>{f.emoji}</span>
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        )}
        <div style={{ marginTop: 14, padding: '10px', background: 'rgba(255,215,0,0.05)', borderRadius: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10, color: '#8899aa', marginBottom: 2 }}>星河记忆总量</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD700' }}>{totalMemories}</div>
        </div>
      </div>

      {/* ========== 顶部搜索栏 ========== */}
      <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 320 }}>
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

        {/* 13 坊区筛选 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {districts.map((d) => (
            <button key={d.id} onClick={() => setDistrictFilter(districtFilter === d.id ? null : d.id)} style={{
              padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
              background: districtFilter === d.id ? `${d.color}33` : 'rgba(5,5,32,0.6)',
              backdropFilter: 'blur(12px)', color: districtFilter === d.id ? d.color : '#8899bb',
              fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}>
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* ========== Agent 详情面板 ========== */}
      {panelOpen && agent && (
        <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', width: 340, background: 'rgba(5,5,32,0.85)', backdropFilter: 'blur(24px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', padding: 24, pointerEvents: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', color: '#e8f0ff', maxHeight: '80vh', overflowY: 'auto' }}>
          <button onClick={deselectAgent} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer', fontSize: 20, padding: 4 }}>✕</button>

          {/* Agent 头像 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `radial-gradient(circle, ${agent.color}44, ${agent.color}11)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, border: `2px solid ${agent.color}66` }}>{agent.emoji}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{agent.name}</div>
              <div style={{ fontSize: 13, color: agent.color, opacity: 0.85 }}>{agent.title}</div>
            </div>
          </div>

          <p style={{ fontSize: 14, lineHeight: 1.7, color: '#aabbcc', marginBottom: 18 }}>{agent.description}</p>

          {/* 语录 */}
          {agent.dialogue && (
            <div style={{ fontSize: 13, color: '#ccddee', fontStyle: 'italic', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 16, borderLeft: `3px solid ${agent.color}44`, lineHeight: 1.7 }}>
              "{agent.dialogue}"
            </div>
          )}

          {/* Obsidian 跳转按钮 */}
          <button onClick={handleOpenObsidian} style={{
            width: '100%', padding: '10px', borderRadius: 10,
            background: 'rgba(99,85,188,0.15)', border: '1px solid rgba(99,85,188,0.3)',
            color: '#8866CC', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            marginBottom: 12,
          }}>
            📓 在 Obsidian 中打开档案
          </button>
          {obsidianStatus && (
            <div style={{ fontSize: 11, color: '#FFD700', textAlign: 'center', marginBottom: 10 }}>{obsidianStatus}</div>
          )}

          {/* 关注/取消关注 */}
          <div style={{ marginBottom: 12 }}>
            {userFriends.includes(selectedAgent) ? (
              <button onClick={() => removeFriend(selectedAgent)} style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.25)', color: '#ff8888', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>❌ 取消关注</button>
            ) : (
              <button onClick={() => addFriend(selectedAgent)} style={{ width: '100%', padding: '10px', borderRadius: 10, background: `${agent.color}22`, border: `1px solid ${agent.color}44`, color: agent.color, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>⭐ 关注 {agent.name}</button>
            )}
          </div>

          {/* 对话面板（仅关注后可见） */}
          {userFriends.includes(selectedAgent) && <DialoguePanel />}

          {/* 记忆统计 */}
          <div style={{ padding: '14px 16px', background: 'rgba(255,215,0,0.05)', borderRadius: 12, border: '1px solid rgba(255,215,0,0.1)', marginTop: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#FFD700', opacity: 0.7, marginBottom: 4 }}>折叠记忆</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#FFD700' }}>{memoryCount}
              <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6, marginLeft: 6 }}>条记忆晶体</span>
            </div>
          </div>

          {/* 同坊区其他 Agent */}
          {sameDistrictAgents.length > 0 && (
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FFD700', marginBottom: 8, opacity: 0.7 }}>同坊区</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {sameDistrictAgents.slice(0, 12).map((a) => (
                  <button key={a.id} onClick={() => focusAgent(a.id)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#aabbcc', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{a.emoji} {a.name}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
