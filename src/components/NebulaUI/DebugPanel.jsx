import useNebulaStore from '../../store/useNebulaStore.js';
import { tier1Agents } from '../../data/gameData.js';

/**
 * 调试面板（V4.9 起改为受控组件）
 * 由父组件传入 `open` / `onClose`，不再自渲染触发按钮。
 * 触发入口已迁移到右上角「🚧 开发中」文件夹（DevFolder.jsx）。
 */
export default function DebugPanel({ totalMemories, open, onClose }) {
  const addFriend = useNebulaStore((s) => s.addFriend);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', top: 70, right: 24, width: 420,
      background: 'rgba(10,8,20,0.92)', border: '1px solid rgba(255,100,100,0.3)',
      borderRadius: 12, backdropFilter: 'blur(16px)', padding: 16,
      pointerEvents: 'auto', zIndex: 31,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#FF6B6B', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🔧 调试工具</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8899bb', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1 }}>✕</button>
      </div>

      {/* 批量取消关注 */}
      <button
        onClick={() => {
          const allFriends = [...useNebulaStore.getState().friends];
          allFriends.forEach(id => useNebulaStore.getState().removeFriend(id));
          localStorage.setItem('foldneb_friends', '[]');
          const mems = useNebulaStore.getState().memories;
          const cleaned = {};
          let changed = false;
          for (const [pk, m] of Object.entries(mems)) {
            if (m.from === 'user' || m.to === 'user') {
              const remaining = m.relations.filter(r => r.label !== '关注');
              if (remaining.length === 0) {
                changed = true;
                continue;
              }
              if (remaining.length !== m.relations.length) {
                changed = true;
                cleaned[pk] = { ...m, relations: remaining, interactionCount: remaining.length };
              } else {
                cleaned[pk] = m;
              }
            } else {
              cleaned[pk] = m;
            }
          }
          if (changed) {
            localStorage.setItem('foldneb_memories', JSON.stringify(cleaned));
          }
          window.location.reload();
        }}
        style={{
          padding: '10px 20px', borderRadius: 8,
          background: 'linear-gradient(135deg, rgba(255,80,80,0.3), rgba(255,80,80,0.1))',
          border: '1px solid rgba(255,80,80,0.5)',
          color: '#FF6B6B', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', letterSpacing: '0.05em', transition: 'all 0.2s',
          width: '100%', marginBottom: 12,
        }}
      >🗑️ 强制清空所有关注 & 清理金色连线残留</button>

      {/* 当前状态 */}
      <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 12 }}>
        <p style={{ margin: '4px 0' }}>📊 friends 数组: <strong style={{ color: '#FFD700' }}>{useNebulaStore.getState().friends.join(', ') || '(空)'}</strong></p>
        <p style={{ margin: '4px 0' }}>📊 memories 条目: <strong style={{ color: '#FFD700' }}>{totalMemories} 条</strong></p>
        <p style={{ margin: '4px 0' }}>
          📊 含"关注"的 memories:
          <strong style={{ color: '#FF6B6B' }}>
            {Object.values(useNebulaStore.getState().memories)
              .filter(m => m.relations?.some(r => r.label === '关注')).length} 条
          </strong>
        </p>
      </div>

      {/* 重新关注 */}
      <div style={{ fontSize: 12, color: '#8899bb', marginBottom: 6 }}>🔄 重新关注（测试）：</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tier1Agents.slice(0, 8).map(a => (
          <button
            key={a.id}
            onClick={() => addFriend(a.id)}
            style={{
              padding: '4px 10px', borderRadius: 6,
              background: 'rgba(136,153,204,0.12)',
              border: '1px solid rgba(136,153,204,0.25)',
              color: '#c0d8ff', fontSize: 11, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          >{a.emoji} {a.name}</button>
        ))}
      </div>
    </div>
  );
}
