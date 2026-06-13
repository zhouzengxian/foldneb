import React, { useEffect, useState, useCallback } from 'react';
import useNebulaStore from '../store/useNebulaStore.js';
import { getAgentById } from '../data/gameData.js';
import { processDialogue } from '../utils/memoryCrystal.js';

/**
 * 对话气泡组件（出现在 Agent 节点上方）
 */
function DialogueBubble3D() {
  const dialogueBubble = useNebulaStore((s) => s.dialogueBubble);
  const hideDialogueBubble = useNebulaStore((s) => s.hideDialogueBubble);

  // Always respect the store's state
  const bubbleRef = React.useRef();

  // This is a 2D overlay anchored via CSS, not a 3D component
  // We'll handle positioning through the parent UI
  return null;
}

/**
 * 对话触发器面板（2D UI）
 * 用户点击 Agent 间对话按钮后触发
 */
export default function DialoguePanel() {
  const selectedAgent = useNebulaStore((s) => s.selectedAgent);
  const dialogueBubble = useNebulaStore((s) => s.dialogueBubble);
  const showDialogueBubble = useNebulaStore((s) => s.showDialogueBubble);
  const hideDialogueBubble = useNebulaStore((s) => s.hideDialogueBubble);
  const addMemory = useNebulaStore((s) => s.addMemory);
  const userFriends = useNebulaStore((s) => s.friends);
  const addFriend = useNebulaStore((s) => s.addFriend);

  const [showPanel, setShowPanel] = useState(false);
  const [targetAgents, setTargetAgents] = useState([]);
  const [dialogueLog, setDialogueLog] = useState([]);

  const agent = selectedAgent ? getAgentById(selectedAgent) : null;

  // 获取可对话的朋友列表
  useEffect(() => {
    if (agent) {
      const friendsList = (userFriends || []).filter((id) => id !== agent.id);
      setTargetAgents(friendsList);
    }
  }, [agent, userFriends]);

  // 发起对话
  const startDialogue = useCallback((targetId) => {
    if (!selectedAgent) return;

    const target = getAgentById(targetId);
    if (!target) return;

    // 处理对话 → 自动提取记忆晶体
    const result = processDialogue(selectedAgent, targetId);

    // 显示对话气泡
    showDialogueBubble(targetId, result.text);

    // 添加到对话日志
    setDialogueLog((prev) => [
      ...prev,
      {
        id: Date.now(),
        from: agent.name,
        to: target.name,
        text: result.text,
        relationLabel: result.relationLabel,
        isNew: result.isNew,
      },
    ]);

    // 3s 后自动隐藏
    setTimeout(() => hideDialogueBubble(), 3000);
  }, [selectedAgent, agent]);

  if (!agent) return null;

  return (
    <div>
      {/* 对话触发按钮 */}
      <div
        style={{
          marginTop: 12,
          padding: '14px',
          background: 'rgba(255,215,0,0.05)',
          borderRadius: 12,
          border: '1px solid rgba(255,215,0,0.15)',
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#FFD700',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>💬</span> 思想对话
        </div>

        {/* 可对话对象 */}
        {(userFriends || []).length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(userFriends || [])
              .filter((id) => id !== selectedAgent)
              .map((id) => {
                const friend = getAgentById(id);
                if (!friend) return null;
                return (
                  <button
                    key={id}
                    onClick={() => startDialogue(id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: `${friend.color}22`,
                      border: `1px solid ${friend.color}44`,
                      color: friend.color,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s',
                    }}
                  >
                    {friend.emoji} {friend.name}
                  </button>
                );
              })}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#667788' }}>
            添加朋友后可以开始对话
          </div>
        )}
      </div>

      {/* 对话气泡展示 */}
      {dialogueBubble && (
        <div
          style={{
            marginTop: 8,
            padding: '10px 14px',
            background: 'rgba(255,215,0,0.1)',
            borderRadius: 10,
            border: '1px solid rgba(255,215,0,0.25)',
            fontSize: 13,
            color: '#FFEECC',
            lineHeight: 1.5,
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <span style={{ color: '#FFD700', fontWeight: 600 }}>
            {agent.emoji} {agent.name}：
          </span>
          {dialogueBubble.text}
        </div>
      )}

      {/* 对话记录 */}
      {dialogueLog.length > 0 && (
        <div
          style={{
            marginTop: 12,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
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
            最近对话
          </div>
          {dialogueLog
            .slice(-5)
            .reverse()
            .map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  marginBottom: 6,
                  fontSize: 12,
                  color: '#aabbcc',
                  borderLeft: `3px solid ${log.isNew ? '#FFD700' : '#8866aa'}44`,
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: '#e8f0ff' }}>{log.from}</span>
                  <span style={{ margin: '0 6px', opacity: 0.4 }}>→</span>
                  <span style={{ color: '#e8f0ff' }}>{log.to}</span>
                </div>
                <div>{log.text}</div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 10,
                    color: log.isNew ? '#FFD700' : '#887799',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {log.isNew && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#FFD700',
                      }}
                    />
                  )}
                  {log.isNew ? '✨ 新记忆晶体' : '💎'} {log.relationLabel}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
