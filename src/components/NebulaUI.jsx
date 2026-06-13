import React, { useEffect, useState } from 'react';
import useNebulaStore from '../store/useNebulaStore.js';
import { AGENTS, getAgent, GALAXIES } from '../data/gameData.js';
import DialoguePanel from './DialoguePanel.jsx';

/**
 * 2D UI 层
 * 搜索 + 星系筛选 + Agent 详情面板
 */
export default function NebulaUI() {
  const selectedAgent = useNebulaStore((s) => s.selectedAgent);
  const panelOpen = useNebulaStore((s) => s.panelOpen);
  const searchQuery = useNebulaStore((s) => s.searchQuery);
  const galaxyFilter = useNebulaStore((s) => s.galaxyFilter);
  const focusAgent = useNebulaStore((s) => s.focusAgent);
  const deselectAgent = useNebulaStore((s) => s.deselectAgent);
  const setSearchQuery = useNebulaStore((s) => s.setSearchQuery);
  const setGalaxyFilter = useNebulaStore((s) => s.setGalaxyFilter);
  const memories = useNebulaStore((s) => s.memories);
  const userFriends = useNebulaStore((s) => s.userFriends);
  const addFriend = useNebulaStore((s) => s.addFriend);
  const removeFriend = useNebulaStore((s) => s.removeFriend);

  const [searchResults, setSearchResults] = useState([]);

  // 搜索过滤
  useEffect(() => {
    if (searchQuery.length >= 1) {
      const q = searchQuery.toLowerCase();
      const results = AGENTS.filter(
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

  const agent = selectedAgent ? getAgent(selectedAgent) : null;

  // 获取当前 Agent 的记忆数量
  const memoryCount = selectedAgent
    ? Object.values(memories).filter(
        (m) => m.from === selectedAgent || m.to === selectedAgent
      ).length
    : 0;

  // 获取当前 Agent 所在星系的其他 Agent
  const sameGalaxyAgents = agent
    ? AGENTS.filter((a) => a.galaxy === agent.galaxy && a.id !== agent.id)
    : [];

  // 朋友列表数据
  const friendsData = userFriends.map((id) => getAgent(id)).filter(Boolean);
  // 所有关注者的记忆总数
  const totalMemories = Object.keys(memories).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {/* ========== 左上 Logo ========== */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 24,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD700', letterSpacing: '0.08em' }}>
          FoldNeb 折叠星云
        </div>
        <div style={{ fontSize: 11, color: '#8899bb', opacity: 0.6, marginTop: 2 }}>
          为思考者建造会生长的思想星河
        </div>
      </div>

      {/* ========== 左侧朋友列表 ========== */}
      <div
        style={{
          position: 'absolute',
          top: 110,
          left: 24,
          width: 200,
          pointerEvents: 'auto',
          background: 'rgba(5,5,32,0.6)',
          backdropFilter: 'blur(16px)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#FFD700',
            marginBottom: 12,
            letterSpacing: '0.05em',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>🌟 分身 · 思想朋友</span>
          <span style={{ opacity: 0.5, fontSize: 11 }}>
            {userFriends.length}/20
          </span>
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
              <button
                key={f.id}
                onClick={() => focusAgent(f.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: selectedAgent === f.id ? `${f.color}22` : 'rgba(255,255,255,0.03)',
                  border: selectedAgent === f.id
                    ? `1px solid ${f.color}44`
                    : '1px solid transparent',
                  color: selectedAgent === f.id ? f.color : '#aabbcc',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 16 }}>{f.emoji}</span>
                <span>{f.name}</span>
              </button>
            ))}
            {friendsData.length > 8 && (
              <div style={{ fontSize: 11, color: '#556677', textAlign: 'center', padding: 4 }}>
                +{friendsData.length - 8} 更多...
              </div>
            )}
          </div>
        )}

        {/* 总记忆统计 */}
        <div
          style={{
            marginTop: 14,
            padding: '10px',
            background: 'rgba(255,215,0,0.05)',
            borderRadius: 8,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ fontSize: 10, color: '#8899aa', marginBottom: 2 }}>
            星河记忆总量
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD700' }}>
            {totalMemories}
          </div>
        </div>
      </div>

      {/* ========== 顶部搜索栏 ========== */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'auto',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        {/* 搜索框 */}
        <div
          style={{
            position: 'relative',
            width: 320,
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索思想者..."
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(5,5,32,0.75)',
              backdropFilter: 'blur(16px)',
              color: '#e8f0ff',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <svg
            style={{
              position: 'absolute',
              left: 13,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 18,
              height: 18,
              opacity: 0.4,
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#e8f0ff"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          {/* 搜索结果下拉 */}
          {searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 6,
                background: 'rgba(5,5,32,0.9)',
                backdropFilter: 'blur(20px)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                maxHeight: 280,
                overflowY: 'auto',
              }}
            >
              {searchResults.map((a) => (
                <div
                  key={a.id}
                  onClick={() => {
                    focusAgent(a.id);
                    setSearchQuery('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    color: '#e8f0ff',
                    fontSize: 14,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(255,215,0,0.08)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <span style={{ fontSize: 18 }}>{a.emoji}</span>
                  <span>{a.name}</span>
                  <span style={{ color: a.color, opacity: 0.7, fontSize: 12 }}>
                    {a.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 星系筛选按钮 */}
        {GALAXIES.map((g) => (
          <button
            key={g.id}
            onClick={() =>
              setGalaxyFilter(galaxyFilter === g.id ? null : g.id)
            }
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background:
                galaxyFilter === g.id
                  ? `${g.color}33`
                  : 'rgba(5,5,32,0.6)',
              backdropFilter: 'blur(12px)',
              color: galaxyFilter === g.id ? g.color : '#8899bb',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* ========== Agent 详情面板 ========== */}
      {panelOpen && agent && (
        <div
          style={{
            position: 'absolute',
            right: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 340,
            background: 'rgba(5,5,32,0.85)',
            backdropFilter: 'blur(24px)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 24,
            pointerEvents: 'auto',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            color: '#e8f0ff',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          {/* 关闭按钮 */}
          <button
            onClick={deselectAgent}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'none',
              border: 'none',
              color: '#8899bb',
              cursor: 'pointer',
              fontSize: 20,
              padding: 4,
            }}
          >
            ✕
          </button>

          {/* Agent 头像区 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: `radial-gradient(circle, ${agent.color}44, ${agent.color}11)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                border: `2px solid ${agent.color}66`,
              }}
            >
              {agent.emoji}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
                {agent.name}
              </div>
              <div style={{ fontSize: 13, color: agent.color, opacity: 0.85 }}>
                {agent.title}
              </div>
            </div>
          </div>

          {/* 简介 */}
          <p style={{ fontSize: 14, lineHeight: 1.7, color: '#aabbcc', marginBottom: 18 }}>
            {agent.description}
          </p>

          {/* 语录 */}
          {agent.quotes?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#FFD700',
                  marginBottom: 8,
                  opacity: 0.7,
                }}
              >
                经典语录
              </div>
              {agent.quotes.map((q, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    color: '#ccddee',
                    fontStyle: 'italic',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    marginBottom: 6,
                    borderLeft: `3px solid ${agent.color}44`,
                  }}
                >
                  "{q}"
                </div>
              ))}
            </div>
          )}

          {/* 标签 */}
          {agent.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {agent.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: `${agent.color}22`,
                    color: agent.color,
                    fontSize: 12,
                    border: `1px solid ${agent.color}33`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 卫星标签 */}
          {agent.satellites?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#FFD700',
                  marginBottom: 8,
                  opacity: 0.7,
                }}
              >
                关键概念
              </div>
              {agent.satellites.map((s, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    color: '#99aabb',
                    padding: '4px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: agent.color,
                      opacity: 0.5,
                      display: 'inline-block',
                    }}
                  />
                  {s}
                </div>
              ))}
            </div>
          )}

          {/* 关注/取消关注 */}
          <div style={{ marginBottom: 12 }}>
            {userFriends.includes(selectedAgent) ? (
              <button
                onClick={() => removeFriend(selectedAgent)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 10,
                  background: 'rgba(255,100,100,0.1)',
                  border: '1px solid rgba(255,100,100,0.25)',
                  color: '#ff8888',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ❌ 取消关注
              </button>
            ) : (
              <button
                onClick={() => addFriend(selectedAgent)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 10,
                  background: `${agent.color}22`,
                  border: `1px solid ${agent.color}44`,
                  color: agent.color,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ⭐ 关注 {agent.name}
              </button>
            )}
          </div>

          {/* 对话面板（仅关注后可见） */}
          {userFriends.includes(selectedAgent) && <DialoguePanel />}

          {/* 记忆统计 */}
          <div
            style={{
              padding: '14px 16px',
              background: 'rgba(255,215,0,0.05)',
              borderRadius: 12,
              border: '1px solid rgba(255,215,0,0.1)',
              marginTop: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 12, color: '#FFD700', opacity: 0.7, marginBottom: 4 }}>
              折叠记忆
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#FFD700' }}>
              {memoryCount}
              <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6, marginLeft: 6 }}>
                条记忆晶体
              </span>
            </div>
          </div>

          {/* 同星系其他 Agent */}
          {sameGalaxyAgents.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#FFD700',
                  marginBottom: 8,
                  opacity: 0.7,
                }}
              >
                同星系
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {sameGalaxyAgents.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => focusAgent(a.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#aabbcc',
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {a.emoji} {a.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
