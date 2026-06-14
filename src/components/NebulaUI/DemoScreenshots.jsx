// 星河巡游 HTML 模拟截图（朋友圈 / 决策推演 / 时间折叠）
// 由 DemoOverlay 按 demoShow* 状态显隐

const cardBase = {
  pointerEvents: 'none',
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
};

// ===== 截图1：思想者朋友圈 =====
export function PhoneMock() {
  return (
    <div style={{ ...cardBase, right: '8%', animation: 'phoneFlash 4.5s ease-in-out forwards' }}>
      <div style={{
        width: 256, borderRadius: 26, padding: 10,
        background: 'linear-gradient(160deg,#1a1a2e,#0d0d1a)',
        border: '2px solid rgba(255,215,0,0.25)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 50px rgba(255,215,0,0.12)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 4px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize:18 }}>💫</span>
          <span style={{ fontSize:14, fontWeight:700, color:'#FFD700', letterSpacing:'0.05em' }}>思想者圈</span>
        </div>
        <FeedItem avatar="🚀" name="马斯克" time="3分钟前" color="#ff8855"
          text="今天的火星日落，是蓝色的。🔴" likes="128"
          replyWho="庄子" replyText="天地有大美而不言。" />
        <FeedItem avatar="🌿" name="老子" time="昨天" color="#66ddaa"
          text="上善若水。今天在公司试了试，很有用。" likes="96"
          replyWho="孙子" replyText="兵形象水，避高趋下。" />
      </div>
    </div>
  );
}

function FeedItem({ avatar, name, time, color, text, likes, replyWho, replyText }) {
  return (
    <div style={{ padding:'10px 4px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
        <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,${color},rgba(0,0,0,0.4))`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{avatar}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', gap:6, alignItems:'baseline' }}>
            <span style={{ fontSize:12, fontWeight:700, color }}>{name}</span>
            <span style={{ fontSize:9, color:'#556' }}>{time}</span>
          </div>
          <div style={{ fontSize:11, color:'#c8d0e0', lineHeight:1.5, marginTop:3 }}>{text}</div>
          <div style={{ display:'flex', gap:10, marginTop:5, fontSize:9, color:'#667' }}>
            <span>♥ {likes}</span><span>💬 评论</span>
          </div>
          <div style={{ marginTop:5, padding:'5px 7px', borderRadius:6, background:'rgba(255,255,255,0.03)', fontSize:9.5, color:'#8899bb' }}>
            <b style={{ color }}>{replyWho}</b>：{replyText}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== 截图2：决策推演圆桌 =====
export function DeliberationMock() {
  return (
    <div style={{ ...cardBase, left:'50%', transform:'translate(-50%,-50%)', animation:'phoneFlash 5.5s ease-in-out forwards' }}>
      <div style={{
        width:470, borderRadius:18, padding:18,
        background:'rgba(8,10,28,0.92)', backdropFilter:'blur(20px)',
        border:'1px solid rgba(100,180,255,0.3)',
        boxShadow:'0 20px 60px rgba(0,0,0,0.7), 0 0 50px rgba(100,180,255,0.12)',
      }}>
        <div style={{ textAlign:'center', marginBottom:14 }}>
          <div style={{ fontSize:11, color:'#667', letterSpacing:'0.2em' }}>决策推演 · 圆桌辩论</div>
          <div style={{ fontSize:15, fontWeight:700, color:'#e8f0ff', marginTop:4 }}>要不要 all in 这个方向？</div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <RoundCol avatar="🦉" name="塔勒布" color="#aa88ff" lines={['警惕黑天鹅','保留 optionality']} />
          <RoundCol avatar="⚔️" name="孙子" color="#ff8855" lines={['先胜后求战','算清赢面']} />
          <RoundCol avatar="⚡" name="马斯克" color="#66ccff" lines={['第一性原理','物理极限在哪']} />
        </div>
        <div style={{ marginTop:14, padding:'10px 14px', borderRadius:10, background:'linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,140,66,0.08))', border:'1px solid rgba(255,215,0,0.3)' }}>
          <div style={{ fontSize:10, color:'#FFD700', letterSpacing:'0.15em', marginBottom:3 }}>综合结论</div>
          <div style={{ fontSize:12, color:'#e8f0ff', lineHeight:1.5 }}>小步快跑，单点验证，随时可退</div>
        </div>
      </div>
    </div>
  );
}

function RoundCol({ avatar, name, color, lines }) {
  return (
    <div style={{ flex:1, padding:8, borderRadius:10, background:'rgba(255,255,255,0.02)', border:`1px solid ${color}33` }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7 }}>
        <div style={{ width:24, height:24, borderRadius:'50%', background:`linear-gradient(135deg,${color},rgba(0,0,0,0.4))`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>{avatar}</div>
        <span style={{ fontSize:11, fontWeight:700, color }}>{name}</span>
      </div>
      {lines.map((t,i)=>(
        <div key={i} style={{ fontSize:10, color:'#c8d0e0', lineHeight:1.5, marginBottom:3, padding:'3px 6px', borderRadius:5, background:'rgba(255,255,255,0.03)' }}>{t}</div>
      ))}
    </div>
  );
}

// ===== 截图3：时间折叠推演 =====
export function TemporalMock() {
  return (
    <div style={{ ...cardBase, left:'50%', transform:'translate(-50%,-50%)', animation:'phoneFlash 5.5s ease-in-out forwards' }}>
      <div style={{
        width:450, borderRadius:18, padding:18,
        background:'rgba(8,10,28,0.92)', backdropFilter:'blur(20px)',
        border:'1px solid rgba(180,130,255,0.3)',
        boxShadow:'0 20px 60px rgba(0,0,0,0.7), 0 0 50px rgba(180,130,255,0.15)',
      }}>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:11, color:'#667', letterSpacing:'0.2em' }}>时间折叠推演</div>
          <div style={{ fontSize:15, fontWeight:700, color:'#e8f0ff', marginTop:4 }}>和 5 年后的自己聊天</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          <Node emoji="🧑" label="现在的你" sub="要不要换赛道？" border="rgba(150,170,220,0.4)" />
          <div style={{ flex:1, textAlign:'center' }}>
            <div style={{ height:2, background:'linear-gradient(90deg,rgba(150,170,220,0.3),rgba(180,130,255,0.6))', borderRadius:1 }} />
            <div style={{ fontSize:10, color:'#b482ff', marginTop:4, letterSpacing:'0.1em' }}>+5 年 →</div>
          </div>
          <Node emoji="🌟" label="5 年后的你" border="rgba(180,130,255,0.6)" glow />
        </div>
        <div style={{ marginTop:16, padding:'12px 14px', borderRadius:10, background:'linear-gradient(135deg,rgba(180,130,255,0.1),rgba(120,80,200,0.06))', border:'1px solid rgba(180,130,255,0.3)' }}>
          <div style={{ fontSize:10, color:'#b482ff', letterSpacing:'0.15em', marginBottom:4 }}>来自 5 年后的建议</div>
          <div style={{ fontSize:12, color:'#e8f0ff', lineHeight:1.55 }}>别纠结沉没成本。你当时不敢放手的事，才是唯一值得做的。</div>
        </div>
        <div style={{ display:'flex', gap:6, marginTop:12 }}>
          <PathTag label="A 稳守" /><PathTag label="B 转型" highlight /><PathTag label="C 双轨" />
        </div>
      </div>
    </div>
  );
}

function Node({ emoji, label, sub, border, glow }) {
  return (
    <div style={{ textAlign:'center', flexShrink:0 }}>
      <div style={{
        width:52, height:52, borderRadius:'50%', margin:'0 auto',
        background:'linear-gradient(135deg,#3a3a5a,#1a1a2e)', border:`2px solid ${border}`,
        boxShadow: glow ? '0 0 24px rgba(180,130,255,0.3)' : 'none',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
      }}>{emoji}</div>
      <div style={{ fontSize:11, color: glow ? '#b482ff' : '#8899bb', marginTop:5 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:'#a8b4cc', marginTop:2, maxWidth:90 }}>{sub}</div>}
    </div>
  );
}

function PathTag({ label, highlight }) {
  return (
    <div style={{
      flex:1, textAlign:'center', padding:'5px 0', borderRadius:6, fontSize:10,
      background: highlight ? 'rgba(180,130,255,0.15)' : 'rgba(255,255,255,0.03)',
      border: highlight ? '1px solid rgba(180,130,255,0.5)' : '1px solid rgba(255,255,255,0.06)',
      color: highlight ? '#b482ff' : '#667', fontWeight: highlight ? 700 : 400,
    }}>{label}</div>
  );
}
