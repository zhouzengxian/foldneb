import React, { Suspense, useState, useEffect } from 'react';
import NebulaScene from './components/NebulaScene.jsx';
import NebulaUI from './components/NebulaUI.jsx';
import PhoneApp from './components/PhoneApp.jsx';
import DeliberationUI from './components/DeliberationUI.jsx';
import OnboardingGuide from './components/OnboardingGuide.jsx';
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

export default function App() {
  const onboardingDone = useNebulaStore((s) => s.onboardingDone);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <LoadingScreen />
      <Suspense fallback={null}>
        <NebulaScene />
      </Suspense>
      <NebulaUI />
      <PhoneApp />
      <DeliberationUI />
      {!onboardingDone && <OnboardingGuide />}
    </div>
  );
}
