import { create } from 'zustand';
import { tier1Agents, getAgentById } from '../data/gameData.js';

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
  demoHighlight: null,

  // ========== UI 状态 ==========
  panelOpen: false,
  districtFilter: null,
  searchQuery: '',
  dialogueBubble: null,
  memoryGraphOpen: false,

  // ========== Actions: 3D 交互 ==========
  selectAgent: (id) => set({ selectedAgent: id, panelOpen: true }),
  deselectAgent: () => set({ selectedAgent: null, panelOpen: false }),
  focusAgent: (id) => {
    const agent = getAgentById(id);
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

  getMemoryBetween: (a, b) => {
    const pairKey = makePairKey(a, b);
    return get().memories[pairKey] || null;
  },

  getMemoriesByAgent: (agentId) => {
    const { memories } = get();
    return Object.values(memories).filter(
      (m) => m.from === agentId || m.to === agentId
    );
  },

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
  setDemoHighlight: (id) => set({ demoHighlight: id }),

  // ========== Actions: UI ==========
  setDistrictFilter: (id) => set({ districtFilter: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  showDialogueBubble: (agentId, text) => set({ dialogueBubble: { agentId, text } }),
  hideDialogueBubble: () => set({ dialogueBubble: null }),
  toggleMemoryGraph: () => set((s) => ({ memoryGraphOpen: !s.memoryGraphOpen })),
}));

export default useNebulaStore;
