import { create } from 'zustand';
import { tier1Agents, getAgentById } from '../data/gameData.js';
import { getTodayPosts, getAutoReply } from '../data/agentMoments.js';

function makePairKey(a, b) {
  return [a, b].sort().join('::');
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(`foldneb_${key}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(`foldneb_${key}`, JSON.stringify(data));
  } catch {}
}

const useNebulaStore = create((set, get) => ({
  // ========================================
  // 3D 交互
  // ========================================
  selectedAgent: null,
  focusAgentId: null,
  hoveredAgentId: null,
  cameraTarget: [0, 0, 0],
  autoRotate: true,
  dialogueVisible: false,
  dialogueText: '',
  bubblePosition: null,
  contextMenu: null,
  selectedConnection: null,

  // ========================================
  // 记忆系统
  // ========================================
  memories: loadFromStorage('memories', {}),

  // ========================================
  // 朋友圈系统
  // ========================================
  phoneOpen: false,
  phoneScreen: 'moments',
  userProfile: loadFromStorage('profile', { name: '探索者', avatar: '🌟' }),
  friends: loadFromStorage('friends', []),
  likes: loadFromStorage('likes', {}),
  replies: loadFromStorage('replies', {}),

  // ========================================
  // 决策推演系统
  // ========================================
  deliberationOpen: false,
  deliberationPhase: 'idle',
  deliberationSession: null,
  deliberationHistory: loadFromStorage('deliberationHistory', []),
  deliberationHistoryView: null,

  // ========================================
  // Demo 系统
  // ========================================
  demoActive: false,
  demoHighlight: null,

  // ========================================
  // 新手引导
  // ========================================
  onboardingDone: loadFromStorage('onboardingDone', false),

  // ========================================
  // UI 状态
  // ========================================
  panelOpen: false,
  districtFilter: null,
  searchQuery: '',
  dialogueBubble: null,
  memoryGraphOpen: false,

  // ========================================
  // Actions: 3D 交互
  // ========================================
  selectAgent: (id) => set({ selectedAgent: id, panelOpen: true }),
  deselectAgent: () => set({ selectedAgent: null, panelOpen: false }),
  focusAgent: (id) => {
    const agent = getAgentById(id);
    if (agent) {
      set({ focusAgentId: id, cameraTarget: agent.position, autoRotate: false });
    }
  },
  clearFocus: () => set({ focusAgentId: null, autoRotate: true }),
  setHoveredAgent: (id) => set({ hoveredAgentId: id }),
  setCameraTarget: (pos) => set({ cameraTarget: pos }),
  setDialogueVisible: (v) => set({ dialogueVisible: v }),
  setDialogueText: (t) => set({ dialogueText: t }),
  setBubblePosition: (pos) => set({ bubblePosition: pos }),
  setContextMenu: (menu) => set({ contextMenu: menu }),
  setSelectedConnection: (conn) => set({ selectedConnection: conn }),

  // ========================================
  // Actions: 记忆系统
  // ========================================
  addMemory: (from, to, label, timestamp, source = '对话') => {
    const pairKey = makePairKey(from, to);
    const { memories } = get();
    const now = timestamp || Date.now();
    const existing = memories[pairKey];
    const newMemories = { ...memories };

    if (existing) {
      newMemories[pairKey] = {
        ...existing,
        relations: [...existing.relations, { label, timestamp: now, source }],
        interactionCount: existing.interactionCount + 1,
        lastActivatedAt: now,
      };
    } else {
      newMemories[pairKey] = {
        from, to,
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

  getMemoryBetween: (a, b) => get().memories[makePairKey(a, b)] || null,

  getMemoriesByAgent: (agentId) =>
    Object.values(get().memories).filter(m => m.from === agentId || m.to === agentId),

  // ========================================
  // Actions: 朋友圈
  // ========================================
  togglePhone: () => set(s => ({ phoneOpen: !s.phoneOpen })),
  openPhone: (screen = 'moments') => set({ phoneOpen: true, phoneScreen: screen }),
  closePhone: () => set({ phoneOpen: false }),

  loginUser: (name, avatar) => {
    const profile = { name, avatar };
    set({ userProfile: profile });
    saveToStorage('profile', profile);
  },
  logoutUser: () => {
    set({ userProfile: null });
    saveToStorage('profile', null);
  },

  addFriend: (id) => {
    const { friends } = get();
    if (friends.includes(id)) return;
    const newFriends = [...friends, id];
    set({ friends: newFriends });
    saveToStorage('friends', newFriends);
    // 社交 → 记忆晶体
    get().addMemory('user', id, '关注', Date.now(), 'social');
  },
  removeFriend: (id) => {
    const newFriends = get().friends.filter(f => f !== id);
    set({ friends: newFriends });
    saveToStorage('friends', newFriends);
  },
  isFriend: (id) => get().friends.includes(id),

  toggleLike: (agentId, postIndex) => {
    const key = `${agentId}|${postIndex}`;
    const { likes, friends } = get();
    const newLikes = { ...likes };
    if (newLikes[key]) {
      delete newLikes[key];
    } else {
      newLikes[key] = true;
      if (!friends.includes(agentId)) get().addFriend(agentId);
      get().addMemory('user', agentId, '认同', Date.now(), 'social');
    }
    set({ likes: newLikes });
    saveToStorage('likes', newLikes);
  },
  isLiked: (agentId, postIndex) => !!get().likes[`${agentId}|${postIndex}`],

  addReply: (agentId, postIndex, text, userName = '我') => {
    const key = `${agentId}|${postIndex}`;
    const { replies } = get();
    const newReplies = { ...replies };
    const list = newReplies[key] ? [...newReplies[key]] : [];
    list.push({ id: Date.now(), text, time: Date.now(), user: userName });
    newReplies[key] = list;
    set({ replies: newReplies });
    saveToStorage('replies', newReplies);

    // 自动回复
    const autoReply = getAutoReply(agentId, text);
    if (autoReply) {
      setTimeout(() => {
        const r = get().replies;
        const rList = r[key] ? [...r[key]] : [];
        rList.push({ id: Date.now() + 1, text: autoReply, time: Date.now(), user: 'auto' });
        set({ replies: { ...r, [key]: rList } });
        saveToStorage('replies', { ...r, [key]: rList });
      }, 1500);
    }

    const relationMap = {
      '赞同': '思想共鸣', '认同': '思想共鸣', '同意': '思想共鸣',
      '反对': '思想辩论', '不同意': '思想辩论',
      '学习了': '知识延伸', '受教': '知识延伸',
      '补充': '认知扩展', '启发': '思想影响',
    };
    let relationLabel = '社交';
    for (const [kw, label] of Object.entries(relationMap)) {
      if (text.includes(kw)) { relationLabel = label; break; }
    }
    get().addMemory('user', agentId, relationLabel, Date.now(), 'social');
  },

  deleteReply: (agentId, postIndex, replyId) => {
    const key = `${agentId}|${postIndex}`;
    const { replies } = get();
    const newReplies = { ...replies };
    newReplies[key] = (newReplies[key] || []).filter(r => r.id !== replyId);
    if (newReplies[key].length === 0) delete newReplies[key];
    set({ replies: newReplies });
    saveToStorage('replies', newReplies);
  },

  getMomentsFeed: () => {
    const { friends, likes } = get();
    const allPosts = [];
    friends.forEach(fid => {
      const posts = getTodayPosts(fid);
      if (!posts) return;
      posts.forEach((post, idx) => {
        allPosts.push({
          ...post,
          agentId: fid,
          postIndex: idx,
          liked: !!likes[`${fid}|${idx}`],
        });
      });
    });
    allPosts.sort((a, b) => b.time.localeCompare(a.time));
    return allPosts;
  },

  // ========================================
  // Actions: 决策推演
  // ========================================
  openDeliberation: () => set({ deliberationOpen: true }),
  closeDeliberation: () => set({ deliberationOpen: false, deliberationPhase: 'idle' }),
  setDeliberationPhase: (phase) => set({ deliberationPhase: phase }),
  setDeliberationSession: (session) => set({ deliberationSession: session }),

  initDeliberation: (session) =>
    set({ deliberationSession: session, deliberationPhase: 'analyzing', deliberationOpen: true }),

  addDeliberationRounds: (rounds) =>
    set((s) => ({
      deliberationSession: s.deliberationSession
        ? { ...s.deliberationSession, rounds }
        : null,
    })),

  addDeliberationDialogue: (roundIdx, dialogue) =>
    set((s) => {
      if (!s.deliberationSession) return {};
      const rounds = [...s.deliberationSession.rounds];
      if (rounds[roundIdx]) {
        rounds[roundIdx] = {
          ...rounds[roundIdx],
          dialogues: [...(rounds[roundIdx].dialogues || []), dialogue],
        };
      }
      return { deliberationSession: { ...s.deliberationSession, rounds } };
    }),

  completeDeliberationRound: (roundIdx) =>
    set((s) => {
      if (!s.deliberationSession) return {};
      const rounds = [...s.deliberationSession.rounds];
      if (rounds[roundIdx]) {
        rounds[roundIdx] = { ...rounds[roundIdx], status: 'done' };
      }
      return { deliberationSession: { ...s.deliberationSession, rounds } };
    }),

  addDeliberationInsight: (insight) =>
    set((s) => {
      if (!s.deliberationSession) return {};
      return {
        deliberationSession: {
          ...s.deliberationSession,
          insights: [...(s.deliberationSession.insights || []), insight],
        },
      };
    }),

  setDeliberationReport: (report) =>
    set((s) => {
      if (!s.deliberationSession) return {};
      return {
        deliberationSession: { ...s.deliberationSession, report },
        deliberationPhase: 'complete',
      };
    }),

  archiveDeliberation: () => {
    const { deliberationSession, deliberationHistory } = get();
    if (!deliberationSession) return;
    const newHistory = [
      { ...deliberationSession, archivedAt: Date.now() },
      ...deliberationHistory,
    ];
    set({ deliberationHistory: newHistory, deliberationSession: null, deliberationPhase: 'idle' });
    saveToStorage('deliberationHistory', newHistory);
  },

  deleteDeliberation: (id) => {
    const newHistory = get().deliberationHistory.filter(h => h.id !== id);
    set({ deliberationHistory: newHistory });
    saveToStorage('deliberationHistory', newHistory);
  },

  clearDeliberationHistory: () => {
    set({ deliberationHistory: [], deliberationHistoryView: null });
    saveToStorage('deliberationHistory', []);
  },

  setDeliberationHistoryView: (view) => set({ deliberationHistoryView: view }),
  openDeliberationHistoryView: (view) => set({ deliberationHistoryView: view, deliberationOpen: true }),
  closeDeliberationHistoryView: () => set({ deliberationHistoryView: null }),

  // ========================================
  // PhoneApp 兼容
  // ========================================
  setPhoneScreen: (screen) => set({ phoneScreen: screen }),

  // ========================================
  // Actions: Demo
  // ========================================
  setDemoActive: (v) => set({ demoActive: v }),
  setDemoHighlight: (id) => set({ demoHighlight: id }),

  // ========================================
  // Actions: UI
  // ========================================
  setDistrictFilter: (id) => set({ districtFilter: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  showDialogueBubble: (agentId, text) => set({ dialogueBubble: { agentId, text } }),
  hideDialogueBubble: () => set({ dialogueBubble: null }),
  toggleMemoryGraph: () => set(s => ({ memoryGraphOpen: !s.memoryGraphOpen })),

  // ========================================
  // 兼容别名
  // ========================================
  get userProfileAlias() {
    return get().userProfile;
  },
}));

export default useNebulaStore;
