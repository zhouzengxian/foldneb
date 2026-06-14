import React, { Suspense, useState, useEffect } from 'react';
import NebulaScene from './components/NebulaScene.jsx';
import NebulaUI from './components/NebulaUI.jsx';
import PhoneApp from './components/PhoneApp.jsx';
import DeliberationUI from './components/DeliberationUI.jsx';
import TemporalDeliberation from './components/TemporalDeliberation.jsx';
import OnboardingGuide from './components/OnboardingGuide.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import useNebulaStore from './store/useNebulaStore.js';

function LoadingScreen() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className={`nebula-loading ${phase === 3 ? 'hidden' : ''}`}>
      <div className="nebula-loading-particles" />
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{
          fontSize: 28, fontWeight: 800, color: '#FFD700',
          letterSpacing: '0.18em', fontFamily: '"Noto Serif SC", serif',
          opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.8s',
          textShadow: '0 0 40px rgba(255,215,0,0.5), 0 0 80px rgba(255,215,0,0.2)',
        }}>
          FoldNeb 折叠星云
        </div>
        <div style={{
          fontSize: 13, color: 'rgba(200,210,230,0.6)',
          letterSpacing: '0.25em', marginTop: 12,
          opacity: phase >= 2 ? 1 : 0, transition: 'opacity 0.8s',
        }}>
          思想星河 · 正在折叠中
        </div>
        <div style={{
          marginTop: 20, display: 'flex', gap: 6, justifyContent: 'center',
          opacity: phase >= 2 ? 1 : 0, transition: 'opacity 0.6s',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#FFD700',
              animation: `loadingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== 移动端提示 ==========
// 移动端可正常演示，仅在顶部叠加一条可关闭的提示，
// 引导用户切换桌面端获得完整流畅体验。
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => checkMobile());
  useEffect(() => {
    const onResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

function checkMobile() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const uaMobile = /Android|iPhone|iPod|iPad|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const smallScreen = window.innerWidth < 768;
  const touchOnly = navigator.maxTouchPoints > 1 && !window.matchMedia('(pointer: fine)').matches;
  return uaMobile || (smallScreen && touchOnly);
}

function MobileBanner() {
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '8px 36px',
      background: 'linear-gradient(90deg, rgba(20,16,8,0.92), rgba(40,30,10,0.92), rgba(20,16,8,0.92))',
      borderBottom: '1px solid rgba(255,215,0,0.3)',
      backdropFilter: 'blur(6px)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      fontSize: 12.5, color: '#FFD700', letterSpacing: '0.05em',
      textAlign: 'center',
    }}>
      <span>📱 完整流畅体验请使用电脑端</span>
      <button
        onClick={() => setClosed(true)}
        aria-label="关闭提示"
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: 'rgba(255,215,0,0.6)',
          fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function App() {
  const onboardingDone = useNebulaStore((s) => s.onboardingDone);
  const isMobile = useIsMobile();

  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        {isMobile && <MobileBanner />}
        <LoadingScreen />
        <Suspense fallback={null}>
          <NebulaScene />
        </Suspense>
        <NebulaUI />
        <PhoneApp />
        <DeliberationUI />
        <TemporalDeliberation />
        {!onboardingDone && <OnboardingGuide />}
      </div>
    </ErrorBoundary>
  );
}
