import useNebulaStore from '../store/useNebulaStore';

const HIGHLIGHT_COLOR = '#FFD700';

const STEPS = [
  {
    title: '欢迎来到折叠星云 ✨',
    desc: '这里是思想者的星河宇宙。20位来自东西方的思考者在此汇聚，每个发光节点都是一位思想Agent。',
    position: 'center',
  },
  {
    title: '探索星河 🌌',
    desc: '拖拽旋转浏览星空，滚轮缩放。点击任意发光节点查看思想者详情，开始对话。',
    position: 'bottom',
  },
  {
    title: '思想碰撞 ⚡',
    desc: '点击"思想碰撞"让两位思想者自动对话。每次对话都会自动提取记忆晶体，在星河中生长金色连线。',
    position: 'bottom',
  },
  {
    title: '记忆永不重置 💎',
    desc: '你的每次对话、每次互动都会被记录为记忆晶体。金色连线越粗，代表思想连接越深邃。',
    position: 'bottom',
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

  return (
    <div style={overlay}>
      <div style={card}>
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

        <div style={{ fontSize: 24, fontWeight: 700, fontFamily:'"Noto Serif SC",serif', color:'#fff', textAlign:'center', marginBottom: 10 }}>
          {step.title}
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.8, color: '#BCC8E0', textAlign:'center', marginBottom: 24 }}>
          {step.desc}
        </p>

        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          {onboardingStep > 0 && (
            <button onClick={prevOnboardingStep} style={secondaryBtn}>上一步</button>
          )}
          <button onClick={isLast ? completeOnboarding : nextOnboardingStep} style={primaryBtn}>
            {isLast ? '进入星河 ✦' : '继续'}
          </button>
          <button onClick={skipOnboarding} style={skipBtn}>跳过</button>
        </div>
      </div>
    </div>
  );
}

const overlay = { position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(2,2,16,0.75)', backdropFilter:'blur(8px)' };
const card = { background:'rgba(8,8,28,0.95)', backdropFilter:'blur(24px)', borderRadius:20, border:'1px solid rgba(255,255,255,0.1)', padding:'36px', maxWidth:420, width:'90%', boxShadow:'0 16px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,215,0,0.05)' };
const primaryBtn = { padding:'10px 28px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#FFD700,#FF8C42)', color:'#000', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' };
const secondaryBtn = { padding:'10px 20px', borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#ccc', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' };
const skipBtn = { padding:'10px 20px', borderRadius:10, border:'none', background:'transparent', color:'#667', fontSize:13, cursor:'pointer', fontFamily:'inherit' };
