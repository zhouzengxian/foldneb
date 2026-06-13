import React, { Suspense, useState, useEffect } from 'react';
import NebulaScene from './components/NebulaScene.jsx';
import NebulaUI from './components/NebulaUI.jsx';
import PhoneApp from './components/PhoneApp.jsx';
import DeliberationUI from './components/DeliberationUI.jsx';

function LoadingScreen() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`nebula-loading ${hidden ? 'hidden' : ''}`}>
      <div className="nebula-loading-text">折叠星云 · 思想星河</div>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <LoadingScreen />
      <Suspense fallback={null}>
        <NebulaScene />
      </Suspense>
      <NebulaUI />
      <PhoneApp />
      <DeliberationUI />
    </div>
  );
}
