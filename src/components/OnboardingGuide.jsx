import useNebulaStore from '../store/useNebulaStore';

const HIGHLIGHT_COLOR = '#FFD700';

const STEPS = [
  {
    title: '你的 3D 思考舱 ✨',
    desc: 'FoldNeb 是你与 1000+ 位人类最优秀头脑对话的 3D 思考舱。\n\n🧠 做决策时 → 让马斯克、塔勒布、孙子帮你推演 3 轮，比任何单一 AI 更可靠\n\n⏳ 迷茫时 → 问你 5 年后的自己，用时间透视看清真正重要的东西\n\n🌌 学习时 → 在 1000+ 位思想者星云中发现「庄子也会赞同德勒兹」——知识内化不是记忆，是连线',
    position: 'center',
  },
  {
    title: '🌌 宇宙沙盘：拖拽你的星空',
    desc: '👆 试着操作：\n• 拖拽 → 旋转星图\n• 滚轮 → 缩放\n• 右键 → 平移\n\n13 个星系（坊区）让思想者自然聚集——AI 前沿、认知决策、思想源流……',
    position: 'bottom',
  },
  {
    title: '👆 单击任一星星',
    desc: '点击星体 → 弹出思想者详情 → 关注 TA → 即可对话。\n每次对话自动提取「记忆晶体」，在星河中生长金色连线——思想连接可视化。',
    position: 'bottom',
  },
  {
    title: '📱 思想者朋友圈',
    desc: '受关注的思想者会发布「朋友圈」，你可以点赞、评论，还会收到 AI 自动回复。社交化的知识互动体验。',
    position: 'bottom',
  },
  {
    title: '🧠 ↘️ 右下角「决策推演」',
    desc: '点右下角「决策推演」按钮 → 输入你的难题 → 邀请多位思想者组成智囊团 → 多轮辩论 → 自动生成结构化决策报告。',
    position: 'bottom',
  },
  {
    title: '⏳ ↘️ 右下角「时间折叠」',
    desc: '点右下角「时间折叠」→ 看看 5 年后的你给现在的建议。用时间透视，看清当下真正重要的东西。',
    position: 'bottom',
  },
  {
    title: '🌱 开垦你的知识星图市场',
    desc: '不只是星河——点「📱星球」开垦专属知识星球，每颗星球都在 3D 星空中化作环绕你的月球。点进星球看「💎知识资产价值」雷达图：产出、AI协作、深度、频率、广度，知识资产可视化生长。这是 AI 时代知识交易平台的雏形。',
    position: 'bottom',
  },
  {
    title: '💎 记忆永不重置',
    desc: '你的每次互动都被永久记录。金色连线越粗越亮，代表思想连接越深邃。星河因你而持续生长。\n\n✦ 准备好了吗？进入星河。',
    position: 'center',
  },
];

export default function OnboardingGuide() {
  const onboardingStep = useNebulaStore(s => s.onboardingStep);
  const nextOnboardingStep = useNebulaStore(s => s.nextOnboardingStep);
  const prevOnboardingStep = useNebulaStore(s => s.prevOnboardingStep);
  const completeOnboarding = useNebulaStore(s => s.completeOnboarding);
  const skipOnboarding = useNebulaStore(s => s.skipOnboarding);

  const step = STEPS[onboardingStep] || STEPS[0];
  const isLast = onboardingStep === STEPS.length - 1;
  const isBottom = step.position === 'bottom';
  const isSmall = typeof window !== 'undefined' && window.innerWidth < 600;

  const overlayStyle = {
    ...overlay,
    alignItems: isBottom ? 'flex-end' : 'center',
  };

  const cardStyle = {
    ...(isSmall ? cardSmall : card),
    marginBottom: isBottom ? (isSmall ? 24 : 36) : 0,
    position: 'relative',
  };

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        {/* 贴底步骤：顶部向上箭头，视觉指向星空/对应 UI */}
        {isBottom && <div style={arrowUp} />}

        {/* 步骤指示器 */}
        <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:16 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === onboardingStep ? 20 : 6, height: 6, borderRadius: 3,
              background: i === onboardingStep ? HIGHLIGHT_COLOR : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <div style={{ fontSize: isSmall ? 18 : 24, fontWeight: 700, fontFamily:'"Noto Serif SC",serif', color:'#fff', textAlign:'center', marginBottom: isSmall ? 6 : 10 }}>
          {step.title}
        </div>
        <p style={{ fontSize: isSmall ? 11 : 13, lineHeight: 1.7, color: '#BCC8E0', textAlign:'center', marginBottom: isSmall ? 14 : 24, whiteSpace: 'pre-line' }}>
          {step.desc}
        </p>

        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          {onboardingStep > 0 && (
            <button onClick={prevOnboardingStep} style={isSmall ? secondaryBtnSmall : secondaryBtn}>上一步</button>
          )}
          <button onClick={isLast ? completeOnboarding : nextOnboardingStep} style={isSmall ? primaryBtnSmall : primaryBtn}>
            {isLast ? '进入星河 ✦' : '知道了'}
          </button>
          <button onClick={skipOnboarding} style={isSmall ? skipBtnSmall : skipBtn}>跳过</button>
        </div>
      </div>
    </div>
  );
}

const overlay = { position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(2,2,16,0.75)', backdropFilter:'blur(8px)' };
const cardSmall = { background:'rgba(8,8,28,0.95)', backdropFilter:'blur(24px)', borderRadius:16, border:'1px solid rgba(255,255,255,0.1)', padding:'18px 14px', maxWidth:340, width:'92%', boxShadow:'0 16px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,215,0,0.05)' };
const card = { background:'rgba(8,8,28,0.95)', backdropFilter:'blur(24px)', borderRadius:20, border:'1px solid rgba(255,255,255,0.1)', padding:'36px', maxWidth:420, width:'90%', boxShadow:'0 16px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,215,0,0.05)' };
const arrowUp = { position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'10px solid transparent', borderRight:'10px solid transparent', borderBottom:'10px solid rgba(8,8,28,0.95)' };
const primaryBtn = { padding:'10px 28px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#FFD700,#FF8C42)', color:'#000', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' };
const primaryBtnSmall = { padding:'8px 20px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#FFD700,#FF8C42)', color:'#000', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' };
const secondaryBtn = { padding:'10px 20px', borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#ccc', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' };
const secondaryBtnSmall = { padding:'8px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#ccc', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit' };
const skipBtn = { padding:'10px 20px', borderRadius:10, border:'none', background:'transparent', color:'#667', fontSize:13, cursor:'pointer', fontFamily:'inherit' };
const skipBtnSmall = { padding:'8px 14px', borderRadius:8, border:'none', background:'transparent', color:'#667', fontSize:12, cursor:'pointer', fontFamily:'inherit' };
