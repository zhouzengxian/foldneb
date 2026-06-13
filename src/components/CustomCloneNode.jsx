import React from 'react';
import AgentNode from './AgentNode.jsx';
import useNebulaStore from '../store/useNebulaStore.js';
import { getCustomCloneAgent } from '../data/gameData.js';

/**
 * 自定义分身 Agent 节点（custom_clone）
 *
 * - 物理节点已在 useForceGraph 中硬编码（id='custom_clone'），跟随 user
 * - 这里负责：响应 store.customClone 变化，构造 agent 对象，复用 AgentNode 渲染
 * - 若用户未创建分身（customClone === null）→ 不渲染
 */
export default function CustomCloneNode({ getPhysPos, forceGraph }) {
  const customClone = useNebulaStore((s) => s.customClone);
  const selectedAgent = useNebulaStore((s) => s.selectedAgent);
  const hoveredAgentId = useNebulaStore((s) => s.hoveredAgentId);
  const selectAgent = useNebulaStore((s) => s.selectAgent);
  const setHoveredAgent = useNebulaStore((s) => s.setHoveredAgent);
  const focusAgent = useNebulaStore((s) => s.focusAgent);
  const showDialogueBubble = useNebulaStore((s) => s.showDialogueBubble);

  if (!customClone) return null;

  const agent = getCustomCloneAgent();
  if (!agent) return null;

  return (
    <AgentNode
      agent={agent}
      getPhysPos={getPhysPos}
      isSelected={selectedAgent === 'custom_clone'}
      isHovered={hoveredAgentId === 'custom_clone'}
      isDemoHighlight={false}
      onSelect={(id) => {
        selectAgent(id);
        focusAgent(id);
        showDialogueBubble(id);
      }}
      onHover={setHoveredAgent}
      forceGraph={forceGraph}
    />
  );
}
