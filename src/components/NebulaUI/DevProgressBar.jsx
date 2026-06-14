import { useState } from 'react';

export default function DevProgressBar({ onLaunchStarTour, onLaunchFounderDemo, onLaunchStudentDemo }) {
  const [open, setOpen] = useState(false);

  const cards = [
    {
      key: 'startour',
      emoji: '🌌',
      title: '星河巡游',
      tagline: '3D 飞行导览 · 8 段语音旁白',
      desc: '镜头自动漫游星河，认识 13 个星系与思想者，5 分钟看懂全貌',
      accent: '#FFD700',
      onLaunch: onLaunchStarTour,
    },
    {
      key: 'founder',
      emoji: '💼',
      title: '创业者推演',
      tagline: '马斯克 + 黄仁勋 + 塔勒布 · 3 轮辩论',
      desc: '自动预填 SaaS 增长停滞案例，多 Agent 横向推演 → 时间折叠验证',
      accent: '#FFD700',
      onLaunch: onLaunchFounderDemo,
    },
    {
      key: 'student',
      emoji: '🎓',
      title: '学生探索',
      tagline: '庄子 → 尼采连线 · 知识内化',
      desc: '聚焦庄子星体，看金色连线直通尼采，一键跳转 Obsidian 原文',
      accent: '#7DF9FF',
      onLaunch: onLaunchStudentDemo,
    },
  ];

  const handleLaunch = (card) => {
    setOpen(false);
    setTimeout(() => card.onLaunch(), 100);
  };

  return (
    <>
      <div className="dev-progress-bar" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        <div className="dot-track">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className={`dot${i < 10 ? ' on' : ''}${i === 9 ? ' head' : ''}`}
            />
          ))}
        </div>
        <div><span className="dev-label" style={{ color: '#ffd700' }}>播放</span><span className="pixel-text" style={{ fontSize: 14, lineHeight: 1.4, verticalAlign: 'middle' }}>demo</span></div>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'auto',
            background: 'rgba(2,2,16,0.72)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(8,8,28,0.96)', backdropFilter: 'blur(24px)',
              borderRadius: 20, border: '1px solid rgba(255,215,0,0.12)',
              padding: '28px 24px', maxWidth: 640, width: '90%',
              boxShadow: '0 16px 80px rgba(0,0,0,0.6), 0 0 40px rgba(255,215,0,0.06)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.25em', color: 'rgba(255,215,0,0.5)', fontFamily: 'system-ui', marginBottom: 6 }}>
                选择演示场景
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: '"Noto Serif SC",serif' }}>
                从哪个视角体验 FoldNeb？
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cards.map((c) => (
                <div
                  key={c.key}
                  onClick={() => handleLaunch(c)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid rgba(255,255,255,0.06)`,
                    borderRadius: 12,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${c.accent}14`;
                    e.currentTarget.style.borderColor = `${c.accent}44`;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ fontSize: 30, flexShrink: 0 }}>{c.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: '"Noto Serif SC",serif', marginBottom: 2 }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: 11, color: c.accent, fontFamily: 'system-ui', marginBottom: 3 }}>
                      {c.tagline}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(180,190,210,0.55)', fontFamily: 'system-ui', lineHeight: 1.5 }}>
                      {c.desc}
                    </div>
                  </div>
                  <div style={{
                    color: c.accent, fontSize: 16, flexShrink: 0, opacity: 0.5,
                  }}>→</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  padding: '6px 18px', borderRadius: 8,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#556', fontSize: 11, cursor: 'pointer',
                  fontFamily: 'system-ui', letterSpacing: '0.1em',
                }}
              >
                跳过 · 自由探索
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
