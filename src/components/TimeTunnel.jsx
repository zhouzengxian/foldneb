import { useEffect, useState } from 'react';

/**
 * 时间线隧道动画（V4.7 视觉叙事增强）
 * 全屏覆盖：CSS 3D 螺旋隧道 + 4 个光门（1/3/5/10年）依次冲过
 * duration 后自动淡出。纯前端，不碰 Three.js 相机。
 *
 * 用途：
 *   - 时间折叠 generating 阶段（默认 4000ms）
 *   - 决策推演 → 时间折叠 转场过渡（外部传较短 duration，如 2000ms）
 *
 * 注：光门 delay 会按 duration/4000 比例自动缩放。
 */
const BASE_DURATION = 4000;

const GATES_BASE = [
  { year: '1年后',  emoji: '🌱', desc: '破土的你',   color: '#7CFFB2', delay: 300 },
  { year: '3年后',  emoji: '🔥', desc: '淬炼的你',   color: '#FFB347', delay: 1300 },
  { year: '5年后',  emoji: '👑', desc: '从容的你',   color: '#FFD700', delay: 2300 },
  { year: '10年后', emoji: '🌌', desc: '通透的你',   color: '#B07CFF', delay: 3200 },
];

// ====== 内联 style 对象 ======
function ringStyle(i) {
  return {
    position: 'absolute',
    width: 500, height: 500, left: -250, top: -250,
    borderRadius: '50%',
    border: '2px solid rgba(255,215,0,0.35)',
    boxShadow: '0 0 20px rgba(255,180,0,0.2), inset 0 0 20px rgba(180,120,255,0.15)',
    animation: 'tunnelMove 2s linear infinite',
    animationDelay: (-i * 0.2) + 's',
  };
}

const gateWrapStyle = {
  position: 'absolute', left: -110, top: -110,
  width: 220, height: 220,
  opacity: 0,
  animation: 'gateFly 1s ease-out forwards',
};

const gateRingBase = {
  width: '100%', height: '100%', borderRadius: '50%',
  border: '3px solid',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  background: 'rgba(8,8,28,0.4)',
};

const gateEmojiStyle = { fontSize: 52, lineHeight: 1, marginBottom: 6, textShadow: '0 0 20px currentColor' };

const gateYearStyle = { fontSize: 18, fontWeight: 700, fontFamily: '"Noto Serif SC",serif', marginBottom: 4 };

const gateDescStyle = { fontSize: 11, color: '#99a', fontFamily: 'system-ui' };

const centerFlashStyle = {
  position: 'absolute', left: -8, top: -8, width: 16, height: 16, borderRadius: '50%',
  background: '#fff', boxShadow: '0 0 60px #fff, 0 0 120px #FFD700',
  animation: 'flashPulse 1.2s ease-in-out infinite',
};

const KEYFRAMES = `
@keyframes tunnelMove {
  0%   { transform: translateZ(-1400px) scale(0.3); opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: translateZ(400px) scale(2.5); opacity: 0; }
}
@keyframes gateFly {
  0%   { transform: scale(0.15); opacity: 0; filter: blur(8px); }
  25%  { opacity: 1; filter: blur(0); }
  75%  { transform: scale(1.6); opacity: 1; filter: blur(0); }
  100% { transform: scale(4); opacity: 0; filter: blur(6px); }
}
@keyframes flashPulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50%      { transform: scale(1.8); opacity: 0.4; }
}
`;

export default function TimeTunnel({ duration = 4000 }) {
  const [fading, setFading] = useState(false);
  // 光门 delay 按 duration 比例缩放（默认 4000 时为原值）
  const scale = duration / BASE_DURATION;
  const gates = GATES_BASE.map(g => ({ ...g, delay: g.delay * scale }));

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), duration - 600);
    return () => clearTimeout(t1);
  }, [duration]);

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'radial-gradient(circle at center, #0a0a2e 0%, #020210 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: fading ? 0 : 1, transition: 'opacity 0.6s ease-out',
      }}>
        <div style={{ position: 'relative', width: 0, height: 0, transformStyle: 'preserve-3d', perspective: '600px' }}>
          {/* 螺旋隧道环：多层圆环从纵深向观察者涌出 */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={ringStyle(i)} />
          ))}
          {/* 4 个光门依次冲过 */}
          {gates.map((g) => (
            <div key={g.year} style={{ ...gateWrapStyle, animationDelay: g.delay + 'ms' }}>
              <div style={{ ...gateRingBase, borderColor: g.color, boxShadow: '0 0 40px ' + g.color + ', inset 0 0 30px ' + g.color }}>
                <div style={{ ...gateEmojiStyle, color: g.color }}>{g.emoji}</div>
                <div style={{ ...gateYearStyle, color: g.color }}>{g.year}</div>
                <div style={gateDescStyle}>{g.desc}</div>
              </div>
            </div>
          ))}
          {/* 中心穿越光点 */}
          <div style={centerFlashStyle} />
          {/* 底部字幕 */}
          <div style={{
            position: 'fixed', bottom: '12vh', left: 0, right: 0,
            textAlign: 'center', color: '#FFD700', fontSize: 15,
            fontFamily: '"Noto Serif SC",serif', fontWeight: 600,
            letterSpacing: '0.05em', textShadow: '0 0 20px rgba(255,215,0,0.5)',
          }}>
            <span style={{ fontSize: 28 }}>⏳</span> 正在穿越时间线，与未来的自己相遇…
          </div>
        </div>
      </div>
    </>
  );
}
