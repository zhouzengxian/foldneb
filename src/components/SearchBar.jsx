import { useState } from 'react';
import useNebulaStore from '../store/useNebulaStore';
import { agents } from '../data/agents';

export default function SearchBar() {
  const searchQuery = useNebulaStore(s => s.searchQuery);
  const setSearchQuery = useNebulaStore(s => s.setSearchQuery);
  const selectAgent = useNebulaStore(s => s.selectAgent);
  const setFocusAgentId = useNebulaStore(s => s.setFocusAgentId);
  const [open, setOpen] = useState(false);

  const results = searchQuery
    ? agents.filter(a =>
        a.name.includes(searchQuery) ||
        a.title.includes(searchQuery) ||
        a.galaxy.includes(searchQuery)
      )
    : [];

  const handleSelect = (id) => {
    selectAgent(id);
    setFocusAgentId(id);
    setSearchQuery('');
    setOpen(false);
  };

  return (
    <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 35, width: 280 }}>
      <input
        value={searchQuery}
        onChange={e => { setSearchQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="🔍 搜索思想者..."
        style={{
          width: '100%', padding: '10px 16px', borderRadius: 12,
          background: 'rgba(8,8,28,0.85)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
          fontSize: 13, outline: 'none', fontFamily: 'inherit',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      />
      {open && results.length > 0 && (
        <div style={{
          marginTop: 6, background: 'rgba(8,8,28,0.93)', backdropFilter: 'blur(20px)',
          borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: 220, overflowY: 'auto', padding: 6,
        }}>
          {results.map(a => (
            <div key={a.id} onClick={() => handleSelect(a.id)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
              cursor:'pointer', borderRadius:8, fontSize:13,
              transition:'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 18 }}>{a.emoji}</span>
              <div>
                <span style={{ color: '#fff', fontWeight: 600 }}>{a.name}</span>
                <span style={{ color: '#889', marginLeft: 8, fontSize: 11 }}>{a.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
