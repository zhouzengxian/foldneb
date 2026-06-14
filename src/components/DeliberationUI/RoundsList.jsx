// 推演轮次列表：每轮的主题/状态 + Agent 对话卡片（含打字机效果）
// Props:
//   session     - 推演 session 对象（含 rounds 数组）
//   typedTexts  - 打字机当前文本映射，key = `${ri}-${agentId}`
export default function RoundsList({ session, typedTexts }) {
  if (!session?.rounds) return null;

  return session.rounds.map((round, ri) => (
    <div key={ri} style={{
      marginBottom: 16, padding: '14px 16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '10px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        color: '#FFD700', fontSize: '13px', fontWeight: 600, fontFamily: 'system-ui',
      }}>
        <span style={{
          background: 'rgba(255,215,0,0.15)', padding: '2px 8px',
          borderRadius: '8px', fontSize: '11px',
        }}>
          第{ri + 1}轮
        </span>
        {round.theme}
        <span style={{
          color: round.status === 'done' ? '#4A8' : '#889',
          fontSize: '10px', marginLeft: 'auto',
        }}>
          {round.status === 'done' ? '✓' : round.status === 'active' ? '…' : ''}
        </span>
      </div>

      {/* Agent 对话 */}
      {round.dialogues?.map((d, di) => {
        const key = `${ri}-${d.agentId}`;
        const typed = typedTexts[key];
        const isTyping = typed !== undefined && typed !== d.text;
        return (
          <div key={di} style={{
            marginBottom: 8, padding: '10px 12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px', borderLeft: '2px solid rgba(255,215,0,0.2)',
          }}>
            <div style={{ color: '#FFD700', fontSize: '11px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 4 }}>
              {d.agentName || d.agentId}
              {isTyping && <span style={{ color: '#FFD700', fontSize: '10px', marginLeft: 6, opacity: 0.7 }}>▸ 输入中...</span>}
            </div>
            <div style={{ color: '#ccc', fontSize: '13px', fontFamily: 'system-ui', lineHeight: 1.6 }}>
              {typed !== undefined ? typed : d.text}
              {isTyping && <span style={{ animation: 'blink 0.8s step-end infinite', color: '#FFD700', fontWeight: 300 }}>|</span>}
            </div>
          </div>
        );
      })}

      {round.status === 'pending' && (
        <div style={{ color: '#556', fontSize: '12px', fontFamily: 'system-ui', fontStyle: 'italic' }}>
          等待推演…
        </div>
      )}
    </div>
  ));
}
