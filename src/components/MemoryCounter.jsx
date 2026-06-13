import { useEffect, useRef, useState } from 'react';
import useNebulaStore from '../store/useNebulaStore';

export default function MemoryCounter() {
  const memories = useNebulaStore(s => s.memories);
  const count = Object.keys(memories).length;
  const prev = useRef(count);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (count > prev.current) { setPulse(true); setTimeout(() => setPulse(false), 800); }
    prev.current = count;
  }, [count]);

  if (count === 0) return null;

  const latest = Object.values(memories).sort((a, b) => b.lastActivatedAt - a.lastActivatedAt)[0];
  const label = latest?.relations?.[latest.relations.length - 1]?.label || '';

  return (
    <div style={{ position:'fixed', bottom:60, right:8, zIndex:35, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
      <div style={{
        background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', borderRadius:12,
        padding:'10px 16px', border:`1px solid ${pulse?'#FFD700':'rgba(255,215,0,0.25)'}`,
        transition:'all 0.3s', transform:pulse?'scale(1.05)':'scale(1)',
        boxShadow:pulse?'0 0 24px rgba(255,215,0,0.3)':'none',
      }}>
        <div style={{ fontSize:10, color:'#889', letterSpacing:'0.1em' }}>折叠记忆</div>
        <div style={{ fontSize:28, fontWeight:700, color:'#FFD700', lineHeight:1.2 }}>{count}</div>
      </div>
      {label && pulse && (
        <div style={{
          background:'rgba(255,215,0,0.1)', borderRadius:8, padding:'6px 12px',
          border:'1px solid rgba(255,215,0,0.2)', fontSize:12, color:'#FFD700',
          maxWidth:200, animation:'slideIn 0.4s ease-out',
        }}>
          <div style={{ fontSize:9, opacity:0.6, marginBottom:2 }}>✦ 新晶体</div>
          {label}
        </div>
      )}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
