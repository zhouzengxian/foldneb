import { create } from 'zustand';
import { AGENTS, INITIAL_CONNECTIONS, getAgent } from '../data/gameData.js';

/**
 * 生成 pairKey（两个 Agent ID 排序后拼接，保证无向唯一）
 */
function makePairKey(a, b) {
  return [a, b].sort().join('::');
}

/**
 * 从 localStorage 恢复状态
 */
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(`foldneb_${key}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

/**
 * 持久化到 localStorage
 */
function saveToStorage(key, data) {
  try {
    localStorage.setItem(`foldneb_${key}`, JSON.stringify(data));
  } catch {}
}

const useNebulaStore = create((set, get) => ({
  // ========== 3D 交互 ==========
  selectedAgent: null,
  focusAgentId: null,
  hoveredAgentId: null,
  cameraTarget: [0, 0, 0],
  autoRotate: true,

  // ========== 记忆系统 ==========
  memories: loadFromStorage('memories', {}),

  // ========== 用户分身 ==========
  userProfile: loadFromStorage('profile', {
    id: 'user_avatar',
    name: '探索者',
    title: '思想星河漫游者',
    avatar: '🌟',
    createdAt: Date.now(),
  }),
  userFriends: loadFromStorage('friends', []),

  // ========== Demo 系统 ==========
  demoActive: false,
  demoPhase: null,
  demoProgress: 0,
  demoHighlight: null,
  demoButterflyPos: null,

  // ========== UI 状态 ==========
  panelOpen: false,
  galaxyFilter: null,
  searchQuery: '',
  dialogueBubble: null,
  memoryGraphOpen: false,

  // ========== Actions: 3D 交互 ==========
  selectAgent: (id) => set({ selectedAgent: id, panelOpen: true }),
  deselectAgent: () => set({ selectedAgent: null, panelOpen: false }),
  focusAgent: (id) => {
    const agent = getAgent(id);
    if (agent) {
      set({
        focusAgentId: id,
        cameraTarget: agent.position,
        autoRotate: false,
      });
    }
  },
  clearFocus: () => set({ focusAgentId: null, autoRotate: true }),
  setHoveredAgent: (id) => set({ hoveredAgentId: id }),
  setCameraTarget: (pos) => set({ cameraTarget: pos }),

  // ========== Actions: 记忆系统 ==========
  /**
   * 添加一段折叠记忆
   * @param {string} from - Agent A ID
   * @param {string} to - Agent B ID
   * @param {string} label - 关系标签
   * @param {string} source - 来源（对话 / 社交 / etc）
   */
  addMemory: (from, to, label, source = '对话') => {
    const pairKey = makePairKey(from, to);
    const { memories } = get();
    const now = Date.now();
    const existing = memories[pairKey];

    const newMemories = { ...memories };
    if (existing) {
      newMemories[pairKey] = {
        ...existing,
        relations: [
          ...existing.relations,
          { label, timestamp: now, source },
        ],
        interactionCount: existing.interactionCount + 1,
        lastActivatedAt: now,
      };
    } else {
      newMemories[pairKey] = {
        from,
        to,
        relations: [{ label, timestamp: now, source }],
        interactionCount: 1,
        firstDiscoveredAt: now,
        lastActivatedAt: now,
      };
    }

    set({ memories: newMemories });
    saveToStorage('memories', newMemories);
    return pairKey;
  },

  /**
   * 获取两个 Agent 之间的记忆
   */
  getMemoryBetween: (a, b) => {
    const pairKey = makePairKey(a, b);
    return get().memories[pairKey] || null;
  },

  /**
   * 获取某 Agent 的所有记忆
   */
  getMemoriesByAgent: (agentId) => {
    const { memories } = get();
    return Object.values(memories).filter(
      (m) => m.from === agentId || m.to === agentId
    );
  },

  /**
   * 获取动态连线（所有有记忆 + 初始连线的合集）
   */
  getDynamicConnections: () => {
    const { memories } = get();
    const connections = [...INITIAL_CONNECTIONS];

    Object.values(memories).forEach((mem) => {
      const pairKey = makePairKey(mem.from, mem.to);
      const exists = connections.find(
        (c) => makePairKey(c.from, c.to) === pairKey
      );
      if (!exists) {
        connections.push({
          from: mem.from,
          to: mem.to,
          label: mem.relations[mem.relations.length - 1]?.label || '新增记忆',
          interactionCount: mem.interactionCount,
        });
      }
    });

    return connections;
  },

  // ========== Actions: 对话系统 ==========
  showDialogueBubble: (agentId, text) =>
    set({ dialogueBubble: { agentId, text } }),
  hideDialogueBubble: () => set({ dialogueBubble: null }),

  // ========== Actions: 用户分身 ==========
  addFriend: (agentId) => {
    const { userFriends } = get();
    if (!userFriends.includes(agentId)) {
      const newFriends = [...userFriends, agentId];
      set({ userFriends: newFriends });
      saveToStorage('friends', newFriends);
    }
  },
  removeFriend: (agentId) => {
    const newFriends = get().userFriends.filter((f) => f !== agentId);
    set({ userFriends: newFriends });
    saveToStorage('friends', newFriends);
  },

  // ========== Actions: Demo ==========
  setDemoActive: (v) => set({ demoActive: v }),
  setDemoProgress: (p) => set({ demoProgress: p }),
  setDemoHighlight: (id) => set({ demoHighlight: id }),
  setDemoButterflyPos: (pos) => set({ demoButterflyPos: pos }),

  // ========== Actions: UI ==========
  setGalaxyFilter: (id) => set({ galaxyFilter: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleMemoryGraph: () => set((s) => ({ memoryGraphOpen: !s.memoryGraphOpen })),

  // ========== 初始化记忆 ==========
  initBaseMemories: () => {
    const { memories } = get();
    if (Object.keys(memories).length === 0 && INITIAL_CONNECTIONS.length > 0) {
      const newMemories = {};
      INITIAL_CONNECTIONS.forEach((conn) => {
        const pairKey = makePairKey(conn.from, conn.to);
        newMemories[pairKey] = {
          from: conn.from,
          to: conn.to,
          relations: [{ label: conn.label, timestamp: Date.now(), source: '初始化' }],
          interactionCount: 0,
          firstDiscoveredAt: Date.now(),
          lastActivatedAt: Date.now(),
        };
      });
      set({ memories: newMemories });
      saveToStorage('memories', newMemories);
    }
  },
}));

export default useNebulaStore;
