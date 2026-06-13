import { useState } from 'react';
import useNebulaStore from '../store/useNebulaStore';

const COLORS = ['#4488FF', '#FF6D00', '#FFD700', '#64FFDA', '#FF5252', '#B388FF', '#1DE9B6', '#FFAB40'];
const EMOJIS = ['🚀','💡','⚡','🌟','🔥','🌈','🦊','🐉'];

export default function UserAvatar() {
  const userProfile = useNebulaStore(s => s.userProfile);
  const setUserProfile = useNebulaStore(s => s.setUserProfile);
  const [show, setShow] = useState(!userProfile);

  const [name, setName] = useState(userProfile?.name || '');
  const [color, setColor] = useState(userProfile?.color || COLORS[0]);
  const [emoji, setEmoji] = useState(userProfile?.emoji || EMOJIS[0]);

  const handleCreate = () => {
    if (!name.trim()) return;
    setUserProfile({ id: 'user', name: name.trim(), color, emoji, createdAt: Date.now() });
    setShow(false);
  };

  // 已创建，显示入口按钮
  if (userProfile && !show) {
    return (
      <div style={{ position:'fixed', top:16, right:16, zIndex:35 }}>
        <div onClick={() => setShow(true)} style={{
          display:'flex', alignItems:'center', gap:8, cursor:'pointer',
          background:'rgba(8,8,28,0.8)', backdropFilter:'blur(12px)',
          borderRadius:10, padding:'6px 12px', border:'1px solid rgba(255,255,255,0.1)',
          transition:'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = userProfile.color}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        >
          <span style={{ fontSize:16 }}>{userProfile.emoji}</span>
          <span style={{ color:'#fff', fontSize:12, fontWeight:600 }}>{userProfile.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay} onClick={() => userProfile && setShow(false)}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>
          {emoji}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily:'"Noto Serif SC",serif', color:'#fff', textAlign:'center', marginBottom: 6 }}>
          创建你的思想分身
        </div>
        <div style={{ fontSize: 12, color: '#889', textAlign: 'center', marginBottom: 20 }}>
          在FoldNeb星河中，你将作为一个节点存在<br />与其他思想者对话、碰撞、生长
        </div>

        <label style={labelStyle}>你的名字</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="创始人、一人公司..." style={inputS} />

        <label style={labelStyle}>颜色</label>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
          {COLORS.map(c => (
            <div key={c} onClick={() => setColor(c)} style={{
              width:28, height:28, borderRadius:8, background:c, cursor:'pointer',
              border: color===c ? '2px solid #fff' : '2px solid transparent',
              transform: color===c ? 'scale(1.15)' : 'scale(1)',
              transition:'all 0.15s',
            }} />
          ))}
        </div>

        <label style={labelStyle}>Icon</label>
        <div style={{ display:'flex', gap:6, marginBottom:24 }}>
          {EMOJIS.map(e => (
            <div key={e} onClick={() => setEmoji(e)} style={{
              fontSize:20, cursor:'pointer', padding:'4px 8px', borderRadius:8,
              background: emoji===e ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition:'all 0.15s',
            }}>{e}</div>
          ))}
        </div>

        <button onClick={handleCreate} disabled={!name.trim()} style={createBtn}>
          进入星河 ✦
        </button>
      </div>
    </div>
  );
}

const overlay = { position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(2,2,16,0.85)', backdropFilter:'blur(12px)' };
const panel = { background:'rgba(8,8,28,0.95)', backdropFilter:'blur(24px)', borderRadius:20, border:'1px solid rgba(255,255,255,0.1)', padding:'32px', maxWidth:380, width:'90%', boxShadow:'0 16px 80px rgba(0,0,0,0.6)' };
const labelStyle = { display:'block', fontSize:11, color:'#889', marginBottom:6, fontWeight:600, letterSpacing:1 };
const inputS = { width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', fontSize:14, outline:'none', marginBottom:16, fontFamily:'inherit' };
const createBtn = { width:'100%', padding:'12px 0', borderRadius:12, border:'none', background:'linear-gradient(135deg, #FFD700, #FF8C42)', color:'#000', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit' };
