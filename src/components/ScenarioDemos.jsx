/**
 * 场景 Demo 启动面板（V4.7）
 * 给评委一键入口演示两种典型用例：
 *   1. 💼 创业者推演：自动填充 P6 问题 + 进入决策推演 Demo 模式
 *   2. 🎓 学生探索：聚焦庄子 → 看金色连线到尼采 → 跳 Obsidian
 * 零额外 API 调用，纯本地演示。
 */
import { useState } from 'react';
import useNebulaStore from '../store/useNebulaStore';

// P6 问题文本必须与 deliberationDemos.js 中的 key 完全一致
const P6_PROBLEM = '我的B2B SaaS产品过去6个月增长停滞，月新增从20%跌到3%，老客户留存还行但获客成本翻倍。是该加大销售投入抢存量市场，还是改产品定位寻找新市场？';

export default function ScenarioDemos({ onClose, onLaunchStudent }) {
  const [hovered, setHovered] = useState(null);
  const openDeliberationWithPrefill = useNebulaStore((s) => s.openDeliberationWithPrefill);

  // Demo A：创业者推演 —— 关闭本面板 → 打开决策推演并预填 P6 → DeliberationUI 自动切 Demo 模式启动
  // autoChain=true 让推演播完后自动衔接时间折叠（用 TimeTunnel 动画过渡）
  const launchFounderDemo = () => {
    onClose?.();
    setTimeout(() => {
      openDeliberationWithPrefill(P6_PROBLEM, { autoChain: true });
    }, 120);
  };

  // Demo B：学生探索 —— 关闭面板 → 启动引导式分步 tour（聚焦庄子→看连线→档案跳 Obsidian）
  const launchStudentDemo = () => {
    onClose?.();
    setTimeout(() => {
      onLaunchStudent?.();
    }, 120);
  };

  const cards = [
    {
      key: 'founder',
      emoji: '💼',
      title: '创业者推演 Demo',
      tagline: '马斯克 + 黄仁勋 + 塔勒布 · 3 轮推演',
      scene: 'SaaS 增长停滞',
      bullets: [
        '3 位思想者 3 轮辩论：诊断 → 抉择 → 反脆弱执行',
        '终局报告含杠铃策略 + 11 周执行节奏',
        '一键带入 ⏳ 时间折叠，让未来验证当下',
      ],
      audience: '评委中的企业界 / 投资人',
      cta: '开始推演',
      onLaunch: launchFounderDemo,
      accent: '#FFD700',
    },
    {
      key: 'student',
      emoji: '🎓',
      title: '学生探索 Demo',
      tagline: '庄子 → 尼采连线 · 知识内化演示',
      scene: '学《逍遥游》',
      bullets: [
        '相机自动聚焦「庄子」星体 + 弹详情卡',
        '看金色连线「超人 vs 逍遥」直通尼采',
        '详情卡支持一键跳转 Obsidian 原文笔记',
      ],
      audience: '评委中的教育界 / 知识工作者',
      cta: '聚焦庄子',
      onLaunch: launchStudentDemo,
      accent: '#7DF9FF',
    },
  ];

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        {/* 标题区 */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{
            fontSize: 11, letterSpacing: '0.25em', color: 'rgba(255,215,0,0.55)',
            fontFamily: 'system-ui', marginBottom: 6,
          }}>FOLDNEB · 场景定位</div>
          <div style={{
            fontSize: 22, fontWeight: 700, fontFamily: '"Noto Serif SC",serif',
            color: '#fff', textShadow: '0 0 20px rgba(255,215,0,0.25)',
          }}>这个产品到底用来干什么？</div>
          <div style={{ fontSize: 12, color: '#8899bb', marginTop: 8, fontFamily: 'system-ui' }}>
            两种典型用户场景，一键直达核心功能演示
          </div>
        </div>

        {/* 双场景卡片 */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
          {cards.map((c) => (
            <div
              key={c.key}
              onMouseEnter={() => setHovered(c.key)}
              onMouseLeave={() => setHovered(null)}
              onClick={c.onLaunch}
              style={{
                flex: 1, cursor: 'pointer',
                padding: '18px 16px',
                background: hovered === c.key
                  ? `linear-gradient(135deg, ${c.accent}22, ${c.accent}08)`
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${hovered === c.key ? c.accent + '55' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 14,
                transition: 'all 0.25s',
                transform: hovered === c.key ? 'translateY(-2px)' : 'none',
                boxShadow: hovered === c.key ? `0 8px 32px ${c.accent}20` : 'none',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{c.emoji}</div>
              <div style={{
                fontSize: 15, fontWeight: 700, color: '#fff',
                fontFamily: '"Noto Serif SC",serif', marginBottom: 4,
              }}>{c.title}</div>
              <div style={{
                fontSize: 11, color: c.accent, fontFamily: 'system-ui',
                marginBottom: 10, letterSpacing: '0.05em',
              }}>{c.tagline}</div>

              <div style={{
                fontSize: 11, color: '#99aabb', fontFamily: 'system-ui',
                lineHeight: 1.7, marginBottom: 12,
              }}>
                {c.bullets.map((b, i) => (
                  <div key={i} style={{ marginBottom: 3 }}>· {b}</div>
                ))}
              </div>

              <div style={{
                fontSize: 10, color: '#668', fontFamily: 'system-ui',
                borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8,
                marginBottom: 12,
              }}>👥 {c.audience}</div>

              <div style={{
                textAlign: 'center', padding: '7px 0',
                background: `linear-gradient(135deg, ${c.accent}, ${c.accent}cc)`,
                color: '#000', fontWeight: 700, fontSize: 12,
                borderRadius: 8, fontFamily: 'system-ui', letterSpacing: '0.1em',
              }}>{c.cta} →</div>
            </div>
          ))}
        </div>

        {/* 底部关闭提示 */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={onClose} style={{
            padding: '6px 18px', borderRadius: 8,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            color: '#667', fontSize: 11, cursor: 'pointer',
            fontFamily: 'system-ui', letterSpacing: '0.1em',
          }}>跳过 · 自由探索</button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, zIndex: 220,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(2,2,16,0.78)', backdropFilter: 'blur(10px)',
  pointerEvents: 'auto',
};
const card = {
  background: 'rgba(8,8,28,0.96)', backdropFilter: 'blur(24px)',
  borderRadius: 20, border: '1px solid rgba(255,215,0,0.12)',
  padding: '32px 28px', maxWidth: 580, width: '90%',
  boxShadow: '0 16px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,215,0,0.05)',
};
