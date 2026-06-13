import useNebulaStore from '../store/useNebulaStore';
import { agents, getGalaxy } from '../data/agents';

const panelStyle = {
  position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
  zIndex: 50, maxWidth: 480, width: '90%',
  background: 'rgba(8,8,24,0.92)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
  padding: '20px 24px', color: '#fff',
  boxShadow: '0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
  animation: 'slideUp 0.3s ease-out',
};

export default function AgentDetail() {
  const selectedAgent = useNebulaStore(s => s.selectedAgent);
  const deselectAgent = useNebulaStore(s => s.deselectAgent);
  const openDialogue = useNebulaStore(s => s.openDialogue);
  const getMemoriesByAgent = useNebulaStore(s => s.getMemoriesByAgent);

  if (!selectedAgent) return null;
  const agent = agents.find(a => a.id === selectedAgent);
  if (!agent) return null;

  const galaxy = getGalaxy(agent.galaxy);
  const memories = getMemoriesByAgent(agent.id);

  return (
    <div style={panelStyle} onClick={e => e.stopPropagation()}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 36 }}>{agent.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: '"Noto Serif SC",serif' }}>
            {agent.name}
          </div>
          <div style={{ fontSize: 12, color: agent.glowColor, marginTop: 2 }}>
            {agent.title}
          </div>
        </div>
        <button onClick={deselectAgent} style={closeBtn}>
          ✕
        </button>
      </div>

      {/* 星系标签 */}
      {galaxy && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: galaxy.color + '20', border: `1px solid ${galaxy.color}40`, borderRadius: 8, padding: '3px 10px', fontSize: 11, marginBottom: 12 }}>
          {galaxy.emoji} {galaxy.name}
        </div>
      )}

      {/* Bio */}
      <p style={{ fontSize: 13, lineHeight: 1.7, color: '#BCC8E0', margin: '12px 0' }}>
        {agent.bio}
      </p>

      {/* 思想风格 */}
      <div style={{ fontSize: 11, color: '#889', marginBottom: 16 }}>
        思维风格：{agent.style}
      </div>

      {/* 记忆统计 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, padding: '10px 14px', background: 'rgba(255,215,0,0.06)', borderRadius: 10, border: '1px solid rgba(255,215,0,0.12)' }}>
        <div style={statItem}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#FFD700' }}>{memories.length}</span>
          <span style={{ fontSize: 10, color: '#889' }}>记忆晶体</span>
        </div>
        <div style={statItem}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#64FFDA' }}>{agent.bio.length}</span>
          <span style={{ fontSize: 10, color: '#889' }}>思想深度</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => openDialogue(agent.id, 'user-agent')} style={actionBtn('#4488FF')}>
          💬 发起对话
        </button>
        <button onClick={() => {
          // 触发 Agent-Agent 对话
          const others = agents.filter(a => a.id !== agent.id && a.galaxy !== agent.galaxy);
          if (others.length > 0) {
            const random = others[Math.floor(Math.random() * others.length)];
            openDialogue(random.id, 'agent-agent');
          }
        }} style={actionBtn('#FF8C42')}>
          🤝 思想碰撞
        </button>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  );
}

const closeBtn = {
  background: 'rgba(255,255,255,0.08)', border: 'none', color: '#999', cursor: 'pointer',
  fontSize: 16, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const statItem = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 };
const actionBtn = (color) => ({
  flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${color}40`,
  background: color + '18', color, cursor: 'pointer', fontSize: 13, fontWeight: 600,
  fontFamily: 'inherit', transition: 'all 0.2s',
});
