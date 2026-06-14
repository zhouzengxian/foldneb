import { useEffect, useRef } from 'react';
import useNebulaStore from '../../store/useNebulaStore.js';
import { createDemoMusic } from '../../utils/demoMusic.js';
import { PhoneMock, DeliberationMock, TemporalMock } from './DemoScreenshots.jsx';

export default function DemoOverlay() {
  const demoActive = useNebulaStore((s) => s.demoActive);
  const demoSubtitle = useNebulaStore((s) => s.demoSubtitle);
  const demoPhase = useNebulaStore((s) => s.demoPhase);
  const demoShowPhone = useNebulaStore((s) => s.demoShowPhone);
  const demoShowDeliberation = useNebulaStore((s) => s.demoShowDeliberation);
  const demoShowTemporal = useNebulaStore((s) => s.demoShowTemporal);
  const stopDemo = useNebulaStore((s) => s.stopDemo);

  // ── 电子配乐：巡游启动时播放，结束时停止 ──
  const musicRef = useRef(null);
  useEffect(() => {
    if (!demoActive) return;
    const music = createDemoMusic();
    musicRef.current = music;
    return () => {
      music?.stop();
      musicRef.current = null;
    };
  }, [demoActive]);

  if (!demoActive) return null;

  return (
    <>
      {/* 跳过巡游按钮 —— 必须 pointerEvents:'auto'，父容器 NebulaUI 是 'none' */}
      <div style={{ position: 'absolute', top: 20, left: 24, zIndex: 200, pointerEvents: 'auto' }}>
        <button
          onClick={() => stopDemo?.()}
          style={{
            padding: '8px 18px',
            background: 'rgba(5,5,20,0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,215,0,0.25)',
            borderRadius: 20,
            color: '#c8d0e0',
            fontSize: 13,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,215,0,0.15)';
            e.currentTarget.style.color = '#FFD700';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(5,5,20,0.6)';
            e.currentTarget.style.color = '#c8d0e0';
          }}
        >
          跳过巡游 ✕
        </button>
      </div>
      {/* 底部旁白字幕 */}
      {demoSubtitle && (
        <div style={{
          position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          maxWidth: 720, textAlign: 'center', pointerEvents: 'none',
          padding: '12px 32px',
          background: 'rgba(5,5,20,0.6)',
          backdropFilter: 'blur(12px)',
          borderRadius: 12,
          borderTop: '1px solid rgba(255,215,0,0.15)',
          animation: 'fadeInUp 0.6s ease-out',
        }}>
          <div style={{
            fontSize: 16, lineHeight: 1.8, color: '#e8f0ff',
            textShadow: '0 0 20px rgba(100,150,255,0.3), 0 2px 4px rgba(0,0,0,0.8)',
            letterSpacing: '0.04em',
          }}>
            {demoSubtitle}
          </div>
        </div>
      )}

      {/* 顶部进度指示器 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'rgba(255,215,0,0.1)',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #FFD700, #FFAA44, #FFD700)',
          boxShadow: '0 0 8px rgba(255,215,0,0.6)',
          animation: 'demoProgress 60s linear forwards',
        }} />
      </div>

      {/* Phase 8: Logo 收尾大字幕 */}
      {demoPhase === 8 && (
        <div style={{
          position: 'absolute', top: '38%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none',
          animation: 'logoFadeIn 2s ease-out forwards',
        }}>
          <div style={{
            fontSize: 42, fontWeight: 800, color: '#FFD700',
            letterSpacing: '0.15em',
            textShadow: '0 0 40px rgba(255,215,0,0.5), 0 0 80px rgba(255,215,0,0.2), 0 4px 12px rgba(0,0,0,0.8)',
          }}>
            FoldNeb 折叠星云
          </div>
          <div style={{
            fontSize: 14, color: 'rgba(200,210,230,0.7)',
            letterSpacing: '0.3em', marginTop: 12,
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}>
            思想家推演引擎 · 会动态生长的星河
          </div>
        </div>
      )}

      {/* 截图1：思想者朋友圈（HTML 模拟手机 feed）*/}
      {demoShowPhone && <PhoneMock />}

      {/* 截图2：决策推演圆桌（HTML 模拟辩论面板）*/}
      {demoShowDeliberation && <DeliberationMock />}

      {/* 截图3：时间折叠推演（HTML 模拟时间轴 + 分叉）*/}
      {demoShowTemporal && <TemporalMock />}
    </>
  );
}
