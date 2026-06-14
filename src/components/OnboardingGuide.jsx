import useNebulaStore from '../store/useNebulaStore';

const HIGHLIGHT_COLOR = '#FFD700';

const STEPS = [
  {
    title: '欢迎来到折叠星云 ✨',
    desc: '这里是思想者的星河宇宙。125位来自东西方的思考者在此汇聚，每个发光节点都是一位思想Agent——从黄仁勋到王阳明，从马斯克到老子。',
    position: 'center',
  },
  {
    title: '探索星河 🌌',
    desc: '拖拽旋转浏览星空，滚轮缩放。13个星系（坊区）让思想者自然聚集——AI前沿、认知决策、思想源流……单击任一星体查看详情。',
    position: 'bottom',
  },
  {
    title: '思想碰撞 ⚡',
    desc: '关注感兴趣的思想者后即可对话。每次对话自动提取"记忆晶体"，在星河中生长金色连线——思想连接可视化。',
    position: 'bottom',
  },
  {
    title: '思想者朋友圈 📱',
    desc: '受关注的思想者会发布"朋友圈"，你可以点赞、评论，还会收到AI自动回复。社交化的知识互动体验。',
    position: 'bottom',
  },
  {
    title: '多Agent决策推演 🧠',
    desc: '邀请多位思想者组成"智囊团"，围绕你的问题展开多轮辩论，自动生成结构化决策报告。',
    position: 'bottom',
  },
  {
    title: '🌱 开垦你的知识星图市场',
    desc: '不只是星河——点「📱星球」开垦专属知识星球，每颗星球都在 3D 星空中化作环绕你的月球。点进星球看「💎知识资产价值」雷达图：产出、AI协作、深度、频率、广度，知识资产可视化生长。这是 AI 时代知识交易平台的雏形。',
    position: 'bottom',
  },
  {
    title: '记忆永不重置 💎',
    desc: '你的每次互动都被永久记录。金色连线越粗越亮，代表思想连接越深邃。星河因你而持续生长。',
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
