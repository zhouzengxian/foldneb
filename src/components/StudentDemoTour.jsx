/**
 * 学生探索 Demo · 引导式分步演示（V4.8 重写）
 *
 * 演示完整链路：聚焦庄子 → 打开深度档案 → 展示逍遥哲思炼金蝶 🦋 生成的哲思情报
 * 自动切换 active skill 到 philosophy-butterfly，让右栏按钮显示正确的 skill 名。
 *
 * 自管 step 状态；每步自动推进，也可手动「下一步」/「跳过」。
 */
import { useState, useEffect, useRef } from 'react';
import useNebulaStore from '../store/useNebulaStore';
import { setActiveSkillId } from '../utils/analysisPrompt.js';

const STEP_MS = 6000; // 每步自动停留时长

const STEPS = [
  {
    title: '🎓 学生探索 Demo',
    subtitle:
      '学《逍遥游》时，星云如何帮你内化知识？跟着 3 步看懂——' +
      '聚焦思想者 → 打开深度档案 → 看 AI 炼金术生成哲思情报。',
    action: (api) => {
      // 启动时切到炼金蝶 skill，让右栏按钮显示正确
      try { setActiveSkillId('philosophy-butterfly'); } catch (e) { /* localStorage 不可用时静默 */ }
      // 相机飞向庄子 + 弹出详情卡
      api.focusAgent('zhuangzi');
      api.selectAgent('zhuangzi');
    },
  },
  {
    title: '🦋 聚焦「庄子」',
    subtitle:
      '相机已锁定庄子——《逍遥游》《齐物论》的逍遥哲人。' +
      '接下来打开他的深度档案，看他的生平、思想、寓言和代表作。',
    action: (api) => {
      // 确保庄子处于选中态
      api.selectAgent('zhuangzi');
    },
  },
  {
    title: '📂 打开深度档案',
    subtitle:
      '点击详情卡的「查看完整档案」→ 弹出左右双栏档案页：' +
      '左栏是生平时间线 + 核心思想 + 名言代表作，右栏是大模型情报工坊。',
    action: (api) => {
      api.openArchive();
    },
  },
  {
    title: '🔮 逍遥哲思炼金蝶 🦋 生成的哲思情报',
    subtitle:
      '右栏已预置「逍遥哲思炼金蝶」用四层炼金框架（寓言溯源→哲思解构→当代映射→心智解放）' +
      '为庄子生成的深度情报——这就是 FoldNeb 把古典哲学变成可用工具的方式 ✨',
    action: () => {},
  },
];

export default function StudentDemoTour({ onClose, onOpenArchive }) {
  const [step, setStep] = useState(0);
  const focusAgent = useNebulaStore((s) => s.focusAgent);
  const selectAgent = useNebulaStore((s) => s.selectAgent);
  const timerRef = useRef(null);

  const api = { focusAgent, selectAgent, openArchive: () => onOpenArchive?.() };

  // 每进入一步：执行该步动作 + 启动自动推进计时（最后一步不自动推进）
  useEffect(() => {
    const cur = STEPS[step];
    if (cur?.action) {
      try { cur.action(api); } catch (e) { /* 忽略，不阻断 tour */ }
    }
    if (step < STEPS.length - 1) {
      timerRef.current = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else onClose?.();
  };
  const skip = () => onClose?.();

  const cur = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 210, pointerEvents: 'none',
    }}>
      {/* 顶部进度条 */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(125,249,255,0.1)' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, #7DF9FF, #48C8FF)',
          boxShadow: '0 0 8px rgba(125,249,255,0.6)',
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* 底部旁白卡 */}
      <div style={{
        position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)',
        maxWidth: 680, width: '90%', pointerEvents: 'auto',
        padding: '18px 24px',
        background: 'rgba(5,8,24,0.82)', backdropFilter: 'blur(16px)',
        borderRadius: 16,
        border: '1px solid rgba(125,249,255,0.28)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.5), 0 0 24px rgba(125,249,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 16, fontWeight: 700, color: '#7DF9FF',
              fontFamily: '"Noto Serif SC",serif', marginBottom: 6,
              textShadow: '0 0 16px rgba(125,249,255,0.25)',
            }}>{cur.title}</div>
            <div style={{
              fontSize: 13.5, lineHeight: 1.75, color: '#d0e0f0',
              fontFamily: 'system-ui',
            }}>{cur.subtitle}</div>
          </div>
        </div>

        {/* 步骤点 + 按钮 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {STEPS.map((_, i) => (
              <span key={i} style={{
                width: i === step ? 22 : 7, height: 7, borderRadius: 4,
                background: i === step ? '#7DF9FF' : 'rgba(255,255,255,0.18)',
                transition: 'all 0.3s',
                boxShadow: i === step ? '0 0 8px rgba(125,249,255,0.5)' : 'none',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={skip} style={ghostBtn}>跳过</button>
            <button onClick={next} style={solidBtn}>
              {step < STEPS.length - 1 ? '下一步 →' : '完成 ✨'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ghostBtn = {
  padding: '6px 16px', borderRadius: 8,
  background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
  color: '#778', fontSize: 12, cursor: 'pointer', fontFamily: 'system-ui',
};
const solidBtn = {
  padding: '6px 18px', borderRadius: 8,
  background: 'linear-gradient(135deg, rgba(125,249,255,0.25), rgba(72,200,255,0.18))',
  border: '1px solid rgba(125,249,255,0.45)',
  color: '#7DF9FF', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'system-ui', letterSpacing: '0.05em',
};
