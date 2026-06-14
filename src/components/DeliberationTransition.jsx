import { useEffect, useState } from 'react';

/**
 * 决策推演 → 时间折叠 转场动画（V4.8）
 * 主题：横向多维视角 → 纵向时间线
 * 时长固定 1 秒，紧凑过渡。纯 CSS 3D，不碰 Three.js。
 *
 * 视觉：横向多条光线扇形展开 → 旋转收束为纵向 → 中心光球爆发淡出
 *       字幕一闪「横览万象 · 纵观时光」
 */
const DURATION = 1000;

const LINE_COLORS = ['#7CFFB2', '#FFD700', '#B07CFF', '#FFB347', '#5BC8FF'];

const KEYFRAMES = `
@keyframes dt-hline {
  0%   { transform: scaleX(0); opacity: 0; }
  30%  { transform: scaleX(1); opacity: 1; }
  60%  { transform: scaleX(1) rotate(90deg); opacity: 0.9; }
  100% { transform: scaleX(0.2) rotate(90deg); opacity: 0; }
}
@keyframes dt-burst {
  0%, 55% { transform: scale(0); opacity: 0; }
  72%     { transform: scale(1.3); opacity: 1; }
  100%    { transform: scale(3); opacity: 0; }
}
@keyframes dt-caption {
  0%, 45% { opacity: 0; transform: translateY(8px); }
  60%     { opacity: 1; transform: translateY(0); }
  85%     { opacity: 1; }
  100%    { opacity: 0; }
}
@keyframes dt-rgflare {
  0%   { opacity: 0; }
  40%  { opacity: 1; }
  100% { opacity: 0; }
}
`;

export default function DeliberationTransition() {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFading(true), DURATION - 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'radial-gradient(circle at center, #0c0a2a 0%, #02020c 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: fading ? 0 : 1, transition: 'opacity 0.2s ease-out',
      }}>
        <div style={{ position: 'relative', width: 0, height: 0 }}>
          {/* 横向光线（5 条扇形展开）→ 旋转收束为纵向 */}
          {LINE_COLORS.map((color, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: -200, top: -1,
              width: 400, height: 2,
              transformOrigin: 'center',
              transform: `rotate(${(i - 2) * 18}deg)`,
            }}>
              <div style={{
                width: '100%', height: '100%',
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                boxShadow: `0 0 12px ${color}`,
                animation: `dt-hline ${DURATION}ms cubic-bezier(0.4,0,0.2,1) forwards`,
                animationDelay: (i * 40) + 'ms',
              }} />
            </div>
          ))}
          {/* 中心爆发光球（横向收束成纵向后炸开） */}
          <div style={{
            position: 'absolute', left: -40, top: -40, width: 80, height: 80, borderRadius: '50%',
            background: 'radial-gradient(circle, #fff 0%, #FFD700 40%, transparent 70%)',
            boxShadow: '0 0 60px #FFD700, 0 0 120px rgba(180,120,255,0.5)',
            animation: `dt-burst ${DURATION}ms ease-out forwards`,
            animationDelay: '500ms',
          }} />
          {/* 字幕 */}
          <div style={{
            position: 'fixed', top: '58%', left: 0, right: 0, textAlign: 'center',
            color: '#FFD700', fontFamily: '"Noto Serif SC",serif', fontWeight: 600,
            fontSize: 22, letterSpacing: '0.25em',
            textShadow: '0 0 20px rgba(255,215,0,0.6)',
            animation: `dt-caption ${DURATION}ms ease-out forwards`,
            animationDelay: '400ms',
          }}>
            横览万象 · 纵观时光
          </div>
          {/* 径向光晕底 */}
          <div style={{
            position: 'fixed', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(circle at center, rgba(255,215,0,0.08) 0%, transparent 50%)',
            animation: `dt-rgflare ${DURATION}ms ease-in-out forwards`,
          }} />
        </div>
      </div>
    </>
  );
}
