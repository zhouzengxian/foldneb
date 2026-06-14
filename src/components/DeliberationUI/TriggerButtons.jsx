import useNebulaStore from '../../store/useNebulaStore';

// 决策推演面板未打开时，右下角的触发按钮组（时间折叠 + 决策推演）
export default function TriggerButtons() {
  const openTemporal = useNebulaStore(s => s.openTemporal);
  const openDeliberation = useNebulaStore(s => s.openDeliberation);
  const isSmall = typeof window !== 'undefined' && window.innerWidth < 600;

  return (
    <div style={{
      position: 'fixed', bottom: isSmall ? 4 : 8, right: isSmall ? 4 : 8, zIndex: 30,
      display: 'flex', gap: isSmall ? 4 : 8,
    }}>
      <button
        onClick={openDeliberation}
        title="决策推演"
        style={{
          background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,180,0,0.15))',
          border: '1px solid rgba(255,215,0,0.35)',
          borderRadius: isSmall ? '8px' : '10px', padding: isSmall ? '5px 9px' : '8px 14px', cursor: 'pointer',
          color: '#FFD700', fontSize: isSmall ? '11px' : '13px', fontFamily: 'system-ui',
          fontWeight: 600, letterSpacing: '0.5px',
          boxShadow: '0 0 20px rgba(255,215,0,0.08)',
        }}
      >
        ⚡ 决策推演
      </button>
      <button
        onClick={openTemporal}
        title="时间折叠 · 与未来的自己对话"
        style={{
          background: 'linear-gradient(135deg, rgba(68,136,255,0.2), rgba(68,100,255,0.15))',
          border: '1px solid rgba(68,136,255,0.4)',
          borderRadius: isSmall ? '8px' : '10px', padding: isSmall ? '5px 9px' : '8px 14px', cursor: 'pointer',
          color: '#8cf', fontSize: isSmall ? '11px' : '13px', fontFamily: 'system-ui',
          fontWeight: 600, letterSpacing: '0.5px',
          boxShadow: '0 0 20px rgba(68,136,255,0.1)',
        }}
      >
        ⏳ 时间折叠
      </button>
    </div>
  );
}
