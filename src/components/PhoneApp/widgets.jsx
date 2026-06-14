import useNebulaStore from '../../store/useNebulaStore';

/** 底部 Tab 项 */
export function TabItem({ label, active, onClick }) {
  return (
    <div onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        cursor: 'pointer', userSelect: 'none',
        color: active ? '#1d1d1f' : '#8e8e93',
        fontSize: 9, fontWeight: active ? 600 : 400,
        transition: 'color 0.15s',
        fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
      }}
    >
      <span style={{ fontSize: 16, opacity: active ? 1 : 0.5 }}>●</span>
      {label}
    </div>
  );
}

/** VIP 标识符（接入大模型的核心 Agent 专属） */
export function VipBadge({ size = 12 }) {
  return (
    <span title="AI · 已接入大模型" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      marginLeft: 2, verticalAlign: 'middle', lineHeight: 1,
      userSelect: 'none',
      animation: 'fnStarTwinkle 2.4s ease-in-out infinite',
      background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
      WebkitBackgroundClip: 'text', backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontSize: size, fontWeight: 900,
      filter: 'drop-shadow(0 0 2px rgba(255,180,0,0.55))',
    }}>
      ★
    </span>
  );
}

/** 朋友圈模式切换（demo / api） */
export function ModeToggle({ mode, onChange }) {
  const segStyle = (active) => ({
    flex: 1, textAlign: 'center', padding: '5px 0', fontSize: 10, fontWeight: 600,
    color: active ? '#fff' : '#8e8e93', cursor: 'pointer', userSelect: 'none',
    transition: 'color 0.2s',
    fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
  });
  return (
    <div style={{
      display: 'flex', margin: '8px 12px 2px',
      background: '#e5e5ea', borderRadius: 7, padding: 2,
    }}>
      <div
        onClick={() => onChange('demo')}
        style={{
          ...segStyle(mode === 'demo'),
          borderRadius: 5,
          background: mode === 'demo' ? 'linear-gradient(135deg,#5ac8fa,#007aff)' : 'transparent',
        }}>
        Demo 演示
      </div>
      <div
        onClick={() => onChange('api')}
        style={{
          ...segStyle(mode === 'api'),
          borderRadius: 5,
          background: mode === 'api' ? 'linear-gradient(135deg,#FFD700,#FF8C00)' : 'transparent',
        }}>
        ✦ AI 对话
      </div>
    </div>
  );
}

/** 登录提示 */
export function LoginPrompt() {
  const setPhoneScreen = useNebulaStore((s) => s.setPhoneScreen);
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
      <div style={{
        fontSize: 12, color: '#8e8e93', marginBottom: 16,
        fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
      }}>
        注册后查看思想星河朋友圈
      </div>
      <button onClick={() => setPhoneScreen('profile')}
        style={{
          background: '#07C160', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 28px', fontSize: 12,
          cursor: 'pointer', fontWeight: 600,
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>
        去注册
      </button>
    </div>
  );
}

/** 空朋友圈状态 */
export function EmptyMoments() {
  const setPhoneScreen = useNebulaStore((s) => s.setPhoneScreen);
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
      <div style={{
        fontSize: 12, color: '#8e8e93', lineHeight: 1.6, marginBottom: 16,
        fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
      }}>
        还没有添加星河好友<br />快去加几个 Agent 吧！
      </div>
      <button onClick={() => setPhoneScreen('contacts')}
        style={{
          background: '#07C160', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 28px', fontSize: 12,
          cursor: 'pointer', fontWeight: 600,
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>
        去添加好友
      </button>
    </div>
  );
}
