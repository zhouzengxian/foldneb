import { tier1Agents } from '../../data/gameData';

// 节点详情面板样式
const nodePanelStyle = {
  marginTop: 10,
  padding: '10px 12px',
  background: 'rgba(6,6,18,0.6)',
  border: '1px solid rgba(255,215,0,0.12)',
  borderRadius: '10px',
};

const nodePanelHeadStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const closeBtnStyle = {
  background: 'none', border: 'none', color: '#666',
  cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1,
};

// 右侧节点详情面板：当 selectedNode 为 'user' 显示提问者，否则显示某 Agent 的本轮发言汇总
// Props:
//   session      - 推演 session 对象
//   selectedNode - 当前选中的节点 id（'user' 或 agentId）
//   onClose      - 关闭面板回调
export default function NodeDetailPanel({ session, selectedNode, onClose }) {
  if (!selectedNode) return null;

  if (selectedNode === 'user') {
    return (
      <div style={nodePanelStyle}>
        <div style={nodePanelHeadStyle}>
          <span style={{ color: '#FFD700', fontSize: '12px', fontWeight: 700 }}>🌟 提问者</span>
          <button onClick={onClose} style={closeBtnStyle}>×</button>
        </div>
        <div style={{ color: '#ccd', fontSize: '12px', fontFamily: 'system-ui', lineHeight: 1.6 }}>
          {session?.problem}
        </div>
      </div>
    );
  }

  const agent = tier1Agents.find(a => a.id === selectedNode);
  if (!agent) return null;

  // 收集该 Agent 在所有轮次的发言
  const utterances = [];
  (session?.rounds || []).forEach((r, ri) => {
    (r.dialogues || []).forEach(d => {
      if (d.agentId === selectedNode) {
        utterances.push({ round: ri + 1, text: d.text, theme: r.theme });
      }
    });
  });

  return (
    <div style={nodePanelStyle}>
      <div style={{ ...nodePanelHeadStyle, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8, marginBottom: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: agent.color, display: 'inline-block' }} />
          <span style={{ color: agent.color || '#ccd', fontSize: '12px', fontWeight: 700 }}>{agent.name}</span>
        </span>
        <button onClick={onClose} style={closeBtnStyle}>×</button>
      </div>
      {agent.title && (
        <div style={{ color: '#889', fontSize: '10px', fontFamily: 'system-ui', marginBottom: 8 }}>
          {agent.title}
        </div>
      )}
      {utterances.length === 0 ? (
        <div style={{ color: '#556', fontSize: '11px', fontFamily: 'system-ui', fontStyle: 'italic' }}>
          等待发言…
        </div>
      ) : (
        <div style={{ maxHeight: 200, overflow: 'auto' }}>
          {utterances.map((u, i) => (
            <div key={i} style={{
              marginBottom: 8, padding: '8px 10px',
              background: 'rgba(255,255,255,0.03)', borderRadius: '6px',
              borderLeft: `2px solid ${agent.color}55`,
            }}>
              <div style={{ color: '#667', fontSize: '9px', fontFamily: 'system-ui', marginBottom: 3 }}>
                R{u.round} · {u.theme}
              </div>
              <div style={{ color: '#ccc', fontSize: '11.5px', fontFamily: 'system-ui', lineHeight: 1.55 }}>
                {u.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
