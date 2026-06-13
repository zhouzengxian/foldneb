import useNebulaStore from '../store/useNebulaStore';
import { agents, getAgent } from '../data/agents';
import { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

export default function ConnectionDetail() {
  const selectedConnection = useNebulaStore(s => s.selectedConnection);
  const deselectConnection = useNebulaStore(s => s.deselectConnection);
  const selectAgent = useNebulaStore(s => s.selectAgent);
  const setFocusAgentId = useNebulaStore(s => s.setFocusAgentId);
  const memories = useNebulaStore(s => s.memories);

  if (!selectedConnection) return null;

  const fromA = agents.find(a => a.id === selectedConnection.from);
  const toA = agents.find(a => a.id === selectedConnection.to);
  const memKey = [selectedConnection.from, selectedConnection.to].sort().join('::');
  const mem = memories[memKey];
  const latestRelation = selectedConnection.label || mem?.relations?.[mem.relations.length - 1]?.label || '知识关联';

  const handleGoTo = (agentId) => {
    selectAgent(agentId);
    setFocusAgentId(agentId);
    deselectConnection();
  };

  return (
    <div style={overlay} onClick={deselectConnection}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#FFD700', letterSpacing: 1 }}>✦ 知识连线</span>
          <button onClick={deselectConnection} style={closeBtn}>✕</button>
        </div>

        {/* 关系标签 */}
        <div style={{ textAlign:'center', padding: '8px 16px', background: 'rgba(255,215,0,0.08)', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#FFD700', marginBottom: 16 }}>
          {latestRelation}
        </div>

        {/* 两端 Agent 卡片 */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
          <AgentCard agent={fromA} onClick={() => handleGoTo(fromA?.id)} />
          <div style={{ color: '#556', fontSize: 20 }}>⟷</div>
          <AgentCard agent={toA} onClick={() => handleGoTo(toA?.id)} />
        </div>

        {/* 记忆互动次数 */}
        {mem && (
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#667' }}>
            已产生 {mem.interactionCount} 次思想连接
          </div>
        )}
      </div>
    </div>
  );
}

function AgentCard({ agent, onClick }) {
  if (!agent) return null;
  return (
    <div onClick={onClick} style={{
      cursor: 'pointer', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 12,
      border: `1px solid ${agent.color}30`, textAlign: 'center', minWidth: 120, transition: 'all 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = agent.color}
    onMouseLeave={e => e.currentTarget.style.borderColor = agent.color + '30'}
    >
      <div style={{ fontSize: 28 }}>{agent.emoji}</div>
      <div style={{ fontSize: 14, fontWeight: 600, fontFamily:'"Noto Serif SC",serif', marginTop: 4 }}>{agent.name}</div>
      <div style={{ fontSize: 10, color: '#889', marginTop: 2 }}>{agent.title.split('·')[0]}</div>
    </div>
  );
}

const overlay = { position:'fixed', inset:0, zIndex:40, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.4)' };
const panel = { background:'rgba(8,8,28,0.95)', backdropFilter:'blur(24px)', borderRadius:16, border:'1px solid rgba(255,255,255,0.1)', padding:'20px 24px', maxWidth:400, width:'90%', boxShadow:'0 8px 48px rgba(0,0,0,0.5)' };
const closeBtn = { background:'rgba(255,255,255,0.06)', border:'none', color:'#999', cursor:'pointer', fontSize:16, width:32, height:32, borderRadius:8 };
