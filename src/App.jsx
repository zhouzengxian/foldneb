import React, { Suspense, useState, useEffect } from 'react';
import NebulaScene from './components/NebulaScene.jsx';
import NebulaUI from './components/NebulaUI.jsx';
import useNebulaStore from './store/useNebulaStore.js';

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
  const initBaseMemories = useNebulaStore((s) => s.initBaseMemories);

  useEffect(() => {
    initBaseMemories();
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <LoadingScreen />
      <Suspense fallback={null}>
        <NebulaScene />
      </Suspense>
      <NebulaUI />
    </div>
  );
}
