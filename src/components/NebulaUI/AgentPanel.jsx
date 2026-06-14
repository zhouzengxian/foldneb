import useNebulaStore from '../../store/useNebulaStore.js';
import { tier1Agents, districts, getAgentById } from '../../data/gameData.js';
import DialoguePanel from '../DialoguePanel.jsx';
import CustomCloneChat from '../CustomCloneChat.jsx';

export default function AgentPanel({ onOpenArchive }) {
  const panelOpen = useNebulaStore((s) => s.panelOpen);
  const selectedAgent = useNebulaStore((s) => s.selectedAgent);
  const deselectAgent = useNebulaStore((s) => s.deselectAgent);
  const focusAgent = useNebulaStore((s) => s.focusAgent);
  const selectAgent = useNebulaStore((s) => s.selectAgent);
  const memories = useNebulaStore((s) => s.memories);
  const userFriends = useNebulaStore((s) => s.friends);
  const addFriend = useNebulaStore((s) => s.addFriend);
  const removeFriend = useNebulaStore((s) => s.removeFriend);

  if (!panelOpen) return null;
  const agent = selectedAgent ? getAgentById(selectedAgent) : null;
  if (!agent) return null;

  const memoryCount = Object.values(memories).filter(
    (m) => m.from === selectedAgent || m.to === selectedAgent
  ).length;
  const sameDistrictAgents = tier1Agents.filter((a) => a.district === agent.district && a.id !== agent.id);

  const isSmall = typeof window !== 'undefined' && window.innerWidth < 600;

  return (
    <div style={{ position: 'absolute', right: isSmall ? 4 : 24, top: '50%', transform: 'translateY(-50%)', width: isSmall ? '96vw' : 380, maxWidth: isSmall ? '96vw' : 380, background: 'rgba(5,5,32,0.92)', backdropFilter: 'blur(24px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', padding: '16px 18px', pointerEvents: 'auto', zIndex: 55, boxShadow: '0 8px 40px rgba(0,0,0,0.5)', color: '#e8f0ff', maxHeight: '88vh', overflowY: 'auto', fontSize: 12, lineHeight: 1.6 }}>
      <button onClick={deselectAgent} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', color: '#ccd', cursor: 'pointer', fontSize: 20, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}>✕</button>

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
        <button onClick={onOpenArchive} style={{
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
  );
}
