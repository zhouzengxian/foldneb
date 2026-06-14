import useNebulaStore from '../../store/useNebulaStore.js';

export default function DemoOverlay() {
  const demoActive = useNebulaStore((s) => s.demoActive);
  const demoSubtitle = useNebulaStore((s) => s.demoSubtitle);
  const demoPhase = useNebulaStore((s) => s.demoPhase);
  const demoShowPhone = useNebulaStore((s) => s.demoShowPhone);
  const demoShowDeliberation = useNebulaStore((s) => s.demoShowDeliberation);
  const stopDemo = useNebulaStore((s) => s.stopDemo);

  if (!demoActive) return null;

  return (
    <>
      {/* 跳过巡游按钮 */}
      <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 100 }}>
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
          animation: 'demoProgress 45s linear forwards',
        }} />
      </div>

      {/* Phase 5: Logo 收尾大字幕 */}
      {demoPhase === 5 && (
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
            为思考者建造会生长的思想星河
          </div>
        </div>
      )}

      {/* Demo 朋友圈闪现提示 */}
      {demoShowPhone && (
        <div style={{
          position: 'absolute', top: '20%', right: '15%',
          pointerEvents: 'none',
          animation: 'phoneFlash 1.8s ease-in-out forwards',
        }}>
          <div style={{
            textAlign: 'center',
            padding: '20px 30px',
            background: 'rgba(5,5,20,0.85)',
            backdropFilter: 'blur(16px)',
            borderRadius: 16,
            border: '2px solid rgba(255,215,0,0.3)',
            boxShadow: '0 0 40px rgba(255,215,0,0.15)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📱</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD700', letterSpacing: '0.05em' }}>
              思想者朋友圈
            </div>
            <div style={{ fontSize: 11, color: '#8899bb', marginTop: 4 }}>
              点赞 · 评论 · 自动回复
            </div>
          </div>
        </div>
      )}

      {/* Demo 决策推演闪现提示 */}
      {demoShowDeliberation && (
        <div style={{
          position: 'absolute', top: '20%', left: '15%',
          pointerEvents: 'none',
          animation: 'phoneFlash 1.8s ease-in-out forwards',
        }}>
          <div style={{
            textAlign: 'center',
            padding: '20px 30px',
            background: 'rgba(5,5,20,0.85)',
            backdropFilter: 'blur(16px)',
            borderRadius: 16,
            border: '2px solid rgba(100,180,255,0.3)',
            boxShadow: '0 0 40px rgba(100,180,255,0.15)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🧠</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#88bbff', letterSpacing: '0.05em' }}>
              多Agent决策推演
            </div>
            <div style={{ fontSize: 11, color: '#8899bb', marginTop: 4 }}>
              智囊团 · 多轮辩论 · 结构化报告
            </div>
          </div>
        </div>
      )}
    </>
  );
}
