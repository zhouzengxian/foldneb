import useNebulaStore from '../store/useNebulaStore';
import { PlanetListScreen, PlanetDetailScreen } from './PlanetExtras';
import { TabItem } from './PhoneApp/widgets';
import MomentsScreen from './PhoneApp/MomentsScreen';
import ContactsScreen from './PhoneApp/ContactsScreen';
import ProfileScreen from './PhoneApp/ProfileScreen';

// ====== iPhone 17 外观常量 ======
const PHONE = {
  w: 340,
  h: 660,
  radius: 32,
  frameColor: '#2c2c2e',
  bezel: 3,
};

// ====== 主容器 ======
export default function PhoneApp() {
  const phoneOpen = useNebulaStore((s) => s.phoneOpen);
  const phoneScreen = useNebulaStore((s) => s.phoneScreen);
  const togglePhone = useNebulaStore((s) => s.togglePhone);
  const closePhone = useNebulaStore((s) => s.closePhone);
  const setPhoneScreen = useNebulaStore((s) => s.setPhoneScreen);
  const currentPlanetId = useNebulaStore((s) => s.currentPlanetId);

  // 竖排收缩按钮
  if (!phoneOpen) {
    return (
      <div onClick={togglePhone}
        style={{
          position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 60, borderRadius: '14px 0 0 14px',
          padding: '16px 9px', cursor: 'pointer',
          background: 'linear-gradient(135deg, #3a3a3c, #1c1c1e)',
          boxShadow: '-3px 0 24px rgba(0,0,0,0.45)',
          writingMode: 'vertical-rl', letterSpacing: '0.35em',
          color: '#e5e5ea', fontSize: 13, fontWeight: 500,
          transition: 'all 0.3s ease', userSelect: 'none',
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.04)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          e.currentTarget.style.color = '#e5e5ea';
        }}
      >
        朋 友 圈
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)',
      zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* ==== iPhone 17 机身 ==== */}
      <div style={{
        width: PHONE.w, height: PHONE.h,
        borderRadius: PHONE.radius,
        background: `linear-gradient(160deg, #3a3a3c 0%, ${PHONE.frameColor} 30%, #1c1c1e 100%)`,
        padding: PHONE.bezel,
        boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
        position: 'relative',
      }}>
        {/* 屏幕区域 */}
        <div style={{
          width: '100%', height: '100%',
          borderRadius: PHONE.radius - 2,
          background: '#000',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Dynamic Island */}
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            width: 126, height: 22, borderRadius: 11,
            background: '#0a0a0a', zIndex: 99,
          }} />

          {/* 状态栏 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 42,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 32px 0', zIndex: 20,
            color: '#8e8e93', fontSize: 10, fontWeight: 600,
            fontFamily: 'SF Pro Display, system-ui, sans-serif',
          }}>
            <span>9:41</span>
            <span>📶 🔋</span>
          </div>

          {/* App 内容区 */}
          <div style={{
            position: 'absolute', top: 42, left: 0, right: 0, bottom: 52,
            background: '#f5f5f7',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* 顶部标题栏 */}
            <div style={{
              background: '#f5f5f7',
              padding: '10px 0 8px',
              display: 'flex', justifyContent: 'center',
              borderBottom: '0.5px solid rgba(0,0,0,0.06)',
            }}>
              <span style={{
                fontSize: 14, fontWeight: 600, color: '#1d1d1f',
                fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
              }}>
                {phoneScreen === 'moments' && '朋友圈'}
                {phoneScreen === 'contacts' && '通讯录'}
                {phoneScreen === 'planet' && '知识星球'}
                {phoneScreen === 'profile' && '我'}
              </span>
            </div>

            {/* 滚动内容 */}
            <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {phoneScreen === 'moments' && <MomentsScreen />}
              {phoneScreen === 'contacts' && <ContactsScreen />}
              {phoneScreen === 'planet' && (currentPlanetId ? <PlanetDetailScreen planetId={currentPlanetId} /> : <PlanetListScreen />)}
              {phoneScreen === 'profile' && <ProfileScreen />}
            </div>
          </div>

          {/* 底部 TabBar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 52,
            background: 'rgba(245,245,247,0.92)',
            backdropFilter: 'blur(20px)',
            borderTop: '0.5px solid rgba(0,0,0,0.08)',
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            paddingBottom: 2,
          }}>
            <TabItem label="朋友圈" active={phoneScreen === 'moments'} onClick={() => setPhoneScreen('moments')} />
            <TabItem label="通讯录" active={phoneScreen === 'contacts'} onClick={() => setPhoneScreen('contacts')} />
            <TabItem label="星球" active={phoneScreen === 'planet'} onClick={() => setPhoneScreen('planet')} />
            <TabItem label="我" active={phoneScreen === 'profile'} onClick={() => setPhoneScreen('profile')} />
          </div>
        </div>

        {/* 右上角关闭按钮 */}
        <div onClick={closePhone}
          title="收起朋友圈"
          style={{
            position: 'absolute', top: -11, right: -11, zIndex: 120,
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3a3a3c, #1c1c1e)',
            border: '0.5px solid rgba(255,255,255,0.25)',
            color: '#e5e5ea', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.45)', lineHeight: 1,
            transition: 'transform 0.15s, color 0.2s', userSelect: 'none',
            fontFamily: 'system-ui, sans-serif',
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.color = '#fff'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.color = '#e5e5ea'; }}
        >
          ✕
        </div>
      </div>
    </div>
  );
}
