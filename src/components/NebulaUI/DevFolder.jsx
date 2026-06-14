import { useState, useEffect, useRef } from 'react';
import useNebulaStore from '../../store/useNebulaStore.js';

/**
 * 左下角「开发者工具」下拉文件夹（V4.9）
 * 收纳尚未完善的功能入口：旁白 / 截图 / 场景 Demo / 调试
 * 平常只显示一个小三角，hover 展开「开发者工具」文字，点击展开菜单（向上弹出）。
 * 点击外部自动收起。
 */
export default function DevFolder({ onOpenScenarioDemos, onOpenDebug }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const narrationEnabled = useNebulaStore((s) => s.narrationEnabled);
  const toggleNarration = useNebulaStore((s) => s.toggleNarration);
  const takeScreenshot = useNebulaStore((s) => s.takeScreenshot);
  const screenshotReady = useNebulaStore((s) => s.screenshotReady);
  // 巡游演示期间隐藏，避免分散注意力
  // 注意：return 必须放在所有 hooks 之后，否则违反 React Hooks 规则导致崩溃
  const demoActive = useNebulaStore((s) => s.demoActive);

  const wrapRef = useRef(null);

  // 点击外部收起
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // 截图「已保存」反馈 1.6s 后复位
  useEffect(() => {
    if (!screenshotReady) return;
    const t = setTimeout(() => setOpen(false), 1600);
    return () => clearTimeout(t);
  }, [screenshotReady]);

  if (demoActive) return null;

  const itemStyle = {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', textAlign: 'left',
    padding: '8px 12px', borderRadius: 8, marginBottom: 4,
    background: 'rgba(136,153,204,0.08)',
    border: '1px solid rgba(136,153,204,0.15)',
    color: '#c0d0e8', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s',
  };

  return (
    <div ref={wrapRef} style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 30, pointerEvents: 'auto' }}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="开发者工具"
        style={{
          display: 'flex', alignItems: 'center',
          background: open
            ? 'rgba(255,180,80,0.22)'
            : (hovered ? 'rgba(255,180,80,0.16)' : 'rgba(255,180,80,0.06)'),
          border: '1px solid rgba(255,180,80,0.3)',
          borderRadius: '10px', padding: '8px 12px', cursor: 'pointer',
          color: '#ffc878', fontSize: 13, fontFamily: 'system-ui',
          fontWeight: 600, letterSpacing: '0.5px',
          boxShadow: (hovered || open) ? '0 0 20px rgba(255,180,80,0.15)' : 'none',
          overflow: 'hidden', whiteSpace: 'nowrap',
          transition: 'all 0.25s ease',
        }}
      >
        <span style={{ flexShrink: 0, fontSize: 11 }}>{open ? '▾' : '▴'}</span>
        <span style={{
          maxWidth: (hovered || open) ? 120 : 0,
          opacity: (hovered || open) ? 1 : 0,
          marginLeft: (hovered || open) ? 6 : 0,
          overflow: 'hidden', transition: 'all 0.25s ease',
        }}>开发者工具</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, marginBottom: 8, width: 210,
          background: 'rgba(10,8,20,0.94)', border: '1px solid rgba(255,180,80,0.22)',
          borderRadius: 12, backdropFilter: 'blur(16px)', padding: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,180,80,0.55)', padding: '4px 8px 8px', letterSpacing: '0.12em' }}>
            🔧 更多功能
          </div>

          <button
            onClick={toggleNarration}
            title={narrationEnabled ? '关闭语音旁白' : '开启语音旁白'}
            style={{
              ...itemStyle,
              color: narrationEnabled ? '#88c8ff' : '#9098a8',
              background: narrationEnabled ? 'rgba(100,180,255,0.1)' : itemStyle.background,
              borderColor: narrationEnabled ? 'rgba(100,180,255,0.3)' : 'rgba(136,153,204,0.15)',
            }}
          >
            <span>{narrationEnabled ? '🔊' : '🔇'}</span>
            <span>旁白 {narrationEnabled ? '（开）' : '（关）'}</span>
          </button>

          <button
            onClick={takeScreenshot}
            style={{
              ...itemStyle,
              color: screenshotReady ? '#88ffbb' : '#9098a8',
              background: screenshotReady ? 'rgba(100,255,180,0.1)' : itemStyle.background,
              borderColor: screenshotReady ? 'rgba(100,255,180,0.3)' : 'rgba(136,153,204,0.15)',
            }}
          >
            <span>{screenshotReady ? '✅' : '📸'}</span>
            <span>{screenshotReady ? '已保存' : '截图'}</span>
          </button>

          <button
            onClick={() => { setOpen(false); onOpenScenarioDemos?.(); }}
            style={itemStyle}
          >
            <span>🎬</span>
            <span>场景 Demo</span>
          </button>

          <button
            onClick={() => { setOpen(false); onOpenDebug?.(); }}
            style={{ ...itemStyle, marginBottom: 0, color: '#FF6B6B', borderColor: 'rgba(255,100,100,0.22)' }}
          >
            <span>🔧</span>
            <span>调试</span>
          </button>
        </div>
      )}
    </div>
  );
}
