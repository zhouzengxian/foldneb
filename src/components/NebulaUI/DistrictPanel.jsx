import { useState } from 'react';
import useNebulaStore from '../../store/useNebulaStore.js';
import { tier1Agents, districts } from '../../data/gameData.js';

export default function DistrictPanel({ visible }) {
  const setDistrictFilter = useNebulaStore((s) => s.setDistrictFilter);
  const focusAgent = useNebulaStore((s) => s.focusAgent);
  const selectAgent = useNebulaStore((s) => s.selectAgent);
  const selectedAgent = useNebulaStore((s) => s.selectedAgent);

  const [selectedDistrict, setSelectedDistrict] = useState(null);

  if (!visible) return null;

  return (
    <>
      <div style={{ marginTop: 8, background: 'rgba(10,8,20,0.85)', border: '1px solid rgba(136,153,204,0.25)', borderRadius: 10, backdropFilter: 'blur(12px)', display: 'flex', flexWrap: 'wrap', gap: 5, padding: 10 }}>
        {districts.map((d) => {
          const cnt = tier1Agents.filter((a) => a.district === d.id).length;
          return (
            <div key={d.id} onClick={() => { const nid = selectedDistrict === d.id ? null : d.id; setSelectedDistrict(nid); setDistrictFilter(nid); }} style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', color: '#d0d8e8', background: selectedDistrict === d.id ? `${d.color}30` : 'rgba(136,153,204,0.08)', border: `1px solid ${selectedDistrict === d.id ? d.color + '80' : 'transparent'}`, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5 }} onMouseEnter={(e) => e.currentTarget.style.background = `${d.color}28`} onMouseLeave={(e) => { if (selectedDistrict !== d.id) e.currentTarget.style.background = 'rgba(136,153,204,0.08)'; }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
              {d.name}
              <span style={{ fontSize: 9, opacity: 0.4 }}>{cnt}</span>
            </div>
          );
        })}
      </div>

      {selectedDistrict && (
        <div style={{ marginTop: 6, padding: 8, background: 'rgba(10,8,20,0.85)', border: '1px solid rgba(136,153,204,0.25)', borderRadius: 10, backdropFilter: 'blur(12px)', maxHeight: 200, overflowY: 'auto', maxWidth: 320 }}>
          {tier1Agents.filter((a) => a.district === selectedDistrict).map((a) => (
            <div key={a.id} onClick={() => { focusAgent(a.id); selectAgent(a.id); }} style={{ padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c0cde0', borderRadius: 4, background: selectedAgent === a.id ? `${a.color}15` : 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = `${a.color}12`} onMouseLeave={(e) => { if (selectedAgent !== a.id) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 13 }}>{a.emoji}</span>
              <span style={{ color: a.color, fontWeight: 600 }}>{a.name}</span>
              <span style={{ opacity: 0.4, fontSize: 10, marginLeft: 'auto' }}>{a.title}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
