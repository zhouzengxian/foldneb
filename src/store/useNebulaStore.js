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

// ========================================
// 初始默认预设（全新用户 / 一键初始化后生效）
// ========================================
// 默认分身：灵感缪斯（用户可在「创建分身」里随时修改）
const DEFAULT_CUSTOM_CLONE = {
  name: '灵感缪斯',
  avatar: '🎨',
  bio: '点燃创意的灵感精灵',
  style: '奔放、诗意、发散，爱用画面感的语言，鼓励跳跃联想和自由表达',
  replyMode: 'template',
  imaConfig: null,
};

// 默认知识灵感月球：灵感月球（用户可改名 / 删除 / 新增）
const DEFAULT_USER_PLANETS = [
  {
    id: 'planet_default_inspire',
    name: '灵感月球',
    description: '收藏你的灵感与思考',
    emoji: '🌙',
    color: '#e6d4a0',
    createdAt: '2026-06-14T00:00:00.000Z',
    orbitAngle: 0,
  },
];

/**
 * 自愈清理：移除 memories 中的"孤儿关注"关系
 * 即 user↔agent 间的 label==='关注' 记录，但该 agent 已不在 friends 列表中。
 * 防止历史残留（旧版本 removeFriend 未清理 memories）导致金色连线不消失。
 */
function sanitizeMemories(memories, friends) {
  const cleaned = {};
  let changed = false;
  for (const [pairKey, mem] of Object.entries(memories)) {
    const isUserPair = mem.from === 'user' || mem.to === 'user';
    if (!isUserPair) {
      cleaned[pairKey] = mem;
      continue;
    }
    const otherId = mem.from === 'user' ? mem.to : mem.from;
    const remaining = mem.relations.filter((r) => {
      if (r.label !== '关注') return true;
      return friends.includes(otherId);
    });
    if (remaining.length === mem.relations.length) {
      cleaned[pairKey] = mem;
    } else {
      changed = true;
      if (remaining.length > 0) {
        cleaned[pairKey] = {
          ...mem,
          relations: remaining,
          interactionCount: remaining.length,
        };
      }
      // remaining 为 0 → 整条删除（不放入 cleaned）
    }
  }
  return { cleaned, changed };
}

// 初始加载：先读 friends，再用它清洗 memories，保证启动时数据自洽
const _initialFriends = loadFromStorage('friends', []);
const _rawMemories = loadFromStorage('memories', {});
let _initialMemories;

// 核弹清理：如果没有任何关注好友，清空所有 memories（包括 demo/推演残留）
if (_initialFriends.length === 0 && Object.keys(_rawMemories).length > 0) {
  _initialMemories = {};
  // 同步清空 localStorage
  try { localStorage.removeItem('foldneb_memories'); } catch {}
  // 也顺手清理其他历史数据
  try { localStorage.removeItem('foldneb_likes'); } catch {}
  try { localStorage.removeItem('foldneb_replies'); } catch {}
} else {
  const sanitized = sanitizeMemories(_rawMemories, _initialFriends);
  if (sanitized.changed) {
    saveToStorage('memories', sanitized.cleaned);
  }
  _initialMemories = sanitized.cleaned;
}

const useNebulaStore = create((set, get) => ({
  // ========================================
  // 3D 交互
  // ========================================
  selectedAgent: null,
  focusAgentId: null,
  focusPlanetId: null, // V4.5：定位知识星球月球
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
  memories: _initialMemories,

  // ========================================
  // 朋友圈系统
  // ========================================
  phoneOpen: false,
  phoneScreen: 'moments',
  userProfile: loadFromStorage('profile', { name: '探索者', avatar: '🌟' }),
  friends: _initialFriends,
  likes: loadFromStorage('likes', {}),
  replies: loadFromStorage('replies', {}),
  // 朋友圈模式：'demo'（关键词匹配）/ 'api'（大模型回复）
  momentsMode: loadFromStorage('momentsMode', 'demo'),
  // 用户自己发布的朋友圈动态（最新置顶）
  // [{ id, text, image, time: 'HH:MM', createdAt: ISO }]
  userPosts: loadFromStorage('userPosts', []),
  // agent 对用户帖子的点赞/评论：{ [postId]: [{ type:'like'|'comment', agentId, agentName, text?, time: 'HH:MM' }] }
  userReactions: loadFromStorage('userReactions', {}),
  // 朋友圈当前查看的对象：null（主页）| { kind:'agent', id } | { kind:'me' }
  momentsViewer: null,

  // ========================================
  // 知识星球系统（V4.5）
  // ========================================
  // 用户创建的星球（灰白月球天体，环绕 user 节点）
  // [{ id, name, description, emoji, color, createdAt, orbitAngle }]
  userPlanets: loadFromStorage('userPlanets', DEFAULT_USER_PLANETS),
  // 星球内容流：{ [planetId]: [{ id, text, source:'manual'|'agent', authorName, authorAvatar, time, createdAt }] }
  planetPosts: loadFromStorage('planetPosts', {}),
  // 当前正在查看的星球 ID（null = 列表页）
  currentPlanetId: null,

  // ========================================
  // 决策推演系统
  // ========================================
  deliberationOpen: false,
  deliberationPhase: 'idle',
  deliberationPrefill: null, // 场景 Demo 入口预填的问题文本（被 DeliberationUI 吸收后清空）
  deliberationSession: null,
  deliberationHistory: loadFromStorage('deliberationHistory', []),
  deliberationHistoryView: null,
  deliberationAutoChain: false, // 场景 Demo：推演播完后自动衔接时间折叠

  // ========================================
  // 时间折叠系统（纵向时间轴推演）
  // ========================================
  temporalOpen: false,
  temporalPhase: 'idle', // idle|generating|writing|reviewing|anchoring|complete
  temporalSession: null, // { profile, selves, letters, crossReviews, matrix }
  temporalPrefill: null, // 从决策推演带入的预填 profile（被 TemporalDeliberation 吸收后清空）
  temporalAutoStart: false, // 场景 Demo：收到 prefill 后自动开始折叠（不需手动点）
  temporalHistory: loadFromStorage('temporalHistory', []),
  temporalHistoryView: null,

  // ========================================
  // 自定义分身 Agent（custom_clone）
  // ========================================
  // 单个对象（业务限制：每用户仅 1 个）
  // { name, avatar(emoji), bio, style, replyMode: 'template'|'llm'|'knowledge', imaConfig?: {clientId, apiKey} }
  customClone: loadFromStorage('customClone', DEFAULT_CUSTOM_CLONE),
  // 创建/编辑表单显隐
  cloneCreatorOpen: false,

  // ========================================
  // Demo 系统
  // ========================================
  demoActive: false,
  demoHighlight: null,
  demoSubtitle: '',
  demoPhase: 0,
  narrationEnabled: true,
  runDemo: null,
  stopDemo: null,
  demoShowPhone: false,
  demoShowDeliberation: false,
  demoShowTemporal: false,

  // ========================================
  // 新手引导
  // ========================================
  onboardingDone: loadFromStorage('onboardingDone', false),
  onboardingStep: 0,

  // ========================================
  // UI 状态
  // ========================================
  panelOpen: false,
  districtFilter: null,
  searchQuery: '',
  dialogueBubble: null,
  memoryGraphOpen: false,
  screenshotReady: false,
  draggingNode: null, // 当前拖拽中的 agentId，用于禁用 OrbitControls

  // ========================================
  // Actions: 3D 交互
  // ========================================
  setDraggingNode: (id) => set({ draggingNode: id }),
  selectAgent: (id) => set({ selectedAgent: id, panelOpen: true }),
  deselectAgent: () => set({ selectedAgent: null, panelOpen: false, dialogueBubble: null }),
  focusAgent: (id) => {
    const agent = getAgentById(id);
    if (agent) {
      set({ focusAgentId: id, cameraTarget: agent.position, autoRotate: false });
    }
  },
  clearFocus: () => set({ focusAgentId: null, autoRotate: true }),
  // V4.5：定位/聚焦某颗知识星球月球，让相机飞过去
  focusPlanet: (planetId) => set({ focusPlanetId: planetId, autoRotate: false }),
  clearFocusPlanet: () => set({ focusPlanetId: null, autoRotate: true }),
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
  // 朋友圈模式切换：'demo'（关键词匹配）/ 'api'（大模型回复）
  setMomentsMode: (mode) => {
    set({ momentsMode: mode });
    saveToStorage('momentsMode', mode);
  },

  loginUser: (name, avatar, bio) => {
    const profile = { name, avatar, bio: bio || '' };
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

    // 同步清理 memories 中的"关注"关系，避免金色连线残留
    // 若反复关注/取关过，relations 里可能含多条"关注"，需全部移除
    const pairKey = makePairKey('user', id);
    const { memories } = get();
    const mem = memories[pairKey];
    if (mem) {
      const remaining = mem.relations.filter(r => r.label !== '关注');
      const newMemories = { ...memories };
      if (remaining.length === 0) {
        // 该 agent 与 user 之间只剩"关注"关系 → 整条 memory 删除，连线消失
        delete newMemories[pairKey];
      } else {
        // 还有其他关系（如"认同"/"思想共鸣"）→ 保留，但修正 interactionCount
        newMemories[pairKey] = {
          ...mem,
          relations: remaining,
          interactionCount: remaining.length,
        };
      }
      set({ memories: newMemories });
      saveToStorage('memories', newMemories);
    }
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

  addReply: (agentId, postIndex, text, userName = '我', opts = {}) => {
    const key = `${agentId}|${postIndex}`;
    const { replies } = get();
    const newReplies = { ...replies };
    const list = newReplies[key] ? [...newReplies[key]] : [];
    list.push({ id: Date.now(), text, time: Date.now(), user: userName });
    newReplies[key] = list;
    set({ replies: newReplies });
    saveToStorage('replies', newReplies);

    // 自动回复：仅在 demo 模式（或未显式禁用）时由 store 触发
    // api 模式下由 UI 层（PhoneApp）调用大模型统一处理，避免双重回复
    if (!opts.skipAutoReply) {
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
  // 用户朋友圈发布 + agent 自动反应
  // ========================================
  addUserPost: (text, image = '') => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const post = {
      id: 'up_' + Date.now(),
      text: text.trim(),
      image,
      time: `${hh}:${mm}`,
      createdAt: now.toISOString(),
    };
    const userPosts = [post, ...get().userPosts];
    set({ userPosts });
    saveToStorage('userPosts', userPosts);
    return post;
  },

  deleteUserPost: (postId) => {
    const userPosts = get().userPosts.filter(p => p.id !== postId);
    set({ userPosts });
    saveToStorage('userPosts', userPosts);
    // 顺手清掉对应 reactions
    const userReactions = { ...get().userReactions };
    delete userReactions[postId];
    set({ userReactions });
    saveToStorage('userReactions', userReactions);
  },

  // agent 给用户帖子点赞/评论（内置模拟，不走 API）
  addUserReaction: (postId, reaction) => {
    const userReactions = { ...get().userReactions };
    const list = userReactions[postId] ? [...userReactions[postId]] : [];
    list.push({ ...reaction, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) });
    userReactions[postId] = list;
    set({ userReactions });
    saveToStorage('userReactions', userReactions);
  },

  // 用户给自己帖子删除某条 agent reaction
  deleteUserReaction: (postId, idx) => {
    const userReactions = { ...get().userReactions };
    if (!userReactions[postId]) return;
    userReactions[postId] = userReactions[postId].filter((_, i) => i !== idx);
    if (userReactions[postId].length === 0) delete userReactions[postId];
    set({ userReactions });
    saveToStorage('userReactions', userReactions);
  },

  // 切换朋友圈查看对象
  setMomentsViewer: (viewer) => set({ momentsViewer: viewer }),

  // ========================================
  // 知识星球系统 Actions（V4.5）
  // ========================================
  createPlanet: ({ name, description = '', emoji = '🌑', color = '#b8b8c0' }) => {
    const id = 'planet_' + Date.now();
    const now = new Date();
    const planet = {
      id,
      name: name.trim(),
      description: description.trim(),
      emoji,
      color,
      createdAt: now.toISOString(),
      // 轨道角度：基于已有星球数量均匀分布
      orbitAngle: get().userPlanets.length * (Math.PI * 2 / 6),
    };
    const userPlanets = [...get().userPlanets, planet];
    set({ userPlanets });
    saveToStorage('userPlanets', userPlanets);
    return planet;
  },

  deletePlanet: (planetId) => {
    const userPlanets = get().userPlanets.filter(p => p.id !== planetId);
    set({ userPlanets });
    saveToStorage('userPlanets', userPlanets);
    // 级联清理内容
    const planetPosts = { ...get().planetPosts };
    delete planetPosts[planetId];
    set({ planetPosts });
    saveToStorage('planetPosts', planetPosts);
    if (get().currentPlanetId === planetId) set({ currentPlanetId: null });
  },

  setCurrentPlanet: (planetId) => set({ currentPlanetId: planetId }),

  addPlanetPost: (planetId, text, source = 'manual', authorName = null, authorAvatar = null) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const userProfile = get().userProfile;
    const post = {
      id: 'pp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      text: text.trim(),
      source, // 'manual' | 'agent'
      authorName: authorName || userProfile?.name || '星主',
      authorAvatar: authorAvatar || userProfile?.avatar || '🌟',
      time: `${hh}:${mm}`,
      createdAt: now.toISOString(),
    };
    const planetPosts = { ...get().planetPosts };
    const list = planetPosts[planetId] ? [post, ...planetPosts[planetId]] : [post];
    planetPosts[planetId] = list;
    set({ planetPosts });
    saveToStorage('planetPosts', planetPosts);
    return post;
  },

  deletePlanetPost: (planetId, postId) => {
    const planetPosts = { ...get().planetPosts };
    if (!planetPosts[planetId]) return;
    planetPosts[planetId] = planetPosts[planetId].filter(p => p.id !== postId);
    if (planetPosts[planetId].length === 0) delete planetPosts[planetId];
    set({ planetPosts });
    saveToStorage('planetPosts', planetPosts);
  },



  // ========================================
  // Actions: 决策推演
  // ========================================
  openDeliberation: () => set({ deliberationOpen: true }),
  // 场景 Demo 入口：打开决策推演面板并预填问题文本（自动切 Demo 模式）
  // autoChain=true 表示推演播完后自动衔接时间折叠（创业者 Demo 用）
  openDeliberationWithPrefill: (text, { autoChain = false } = {}) => set({
    deliberationOpen: true,
    deliberationPhase: 'idle',
    deliberationSession: null,
    deliberationPrefill: text || null,
    deliberationAutoChain: !!autoChain,
  }),
  clearDeliberationAutoChain: () => set({ deliberationAutoChain: false }),
  clearDeliberationPrefill: () => set({ deliberationPrefill: null }),
  closeDeliberation: () => set({ deliberationOpen: false, deliberationPhase: 'idle' }),
  setDeliberationPhase: (phase) => set({ deliberationPhase: phase }),
  setDeliberationSession: (session) => set({ deliberationSession: session }),

  initDeliberation: (problem, analysis) =>
    set({ deliberationSession: { problem, ...analysis }, deliberationPhase: 'analyzing', deliberationOpen: true }),

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
  // Actions: 时间折叠
  // ========================================
  openTemporal: () => set({ temporalOpen: true }),
  // 从决策推演带 profile 进入时间折叠：重置 session + 写入预填 + 打开面板
  // autoStart=true 表示收到 prefill 后自动开始折叠（场景 Demo 用）
  openTemporalWithPrefill: (prefill, { autoStart = false } = {}) => set({
    temporalOpen: true,
    temporalPhase: 'idle',
    temporalSession: null,
    temporalPrefill: prefill || null,
    temporalAutoStart: !!autoStart,
  }),
  clearTemporalAutoStart: () => set({ temporalAutoStart: false }),
  clearTemporalPrefill: () => set({ temporalPrefill: null }),
  closeTemporal: () => set({ temporalOpen: false, temporalPhase: 'idle', temporalSession: null, temporalPrefill: null }),
  setTemporalPhase: (phase) => set({ temporalPhase: phase }),
  setTemporalSession: (session) => set({ temporalSession: session }),
  patchTemporalSession: (patch) =>
    set((s) => ({ temporalSession: { ...(s.temporalSession || {}), ...patch } })),

  // 时间折叠历史记录
  archiveTemporal: () => {
    const { temporalSession, temporalHistory } = get();
    if (!temporalSession) return;
    const newHistory = [
      { ...temporalSession, id: `t_${Date.now()}`, archivedAt: Date.now() },
      ...temporalHistory,
    ];
    set({ temporalHistory: newHistory, temporalSession: null, temporalPhase: 'idle' });
    saveToStorage('temporalHistory', newHistory);
  },
  deleteTemporal: (id) => {
    const newHistory = get().temporalHistory.filter(h => h.id !== id);
    set({ temporalHistory: newHistory });
    saveToStorage('temporalHistory', newHistory);
  },
  clearTemporalHistory: () => {
    set({ temporalHistory: [], temporalHistoryView: null });
    saveToStorage('temporalHistory', []);
  },
  openTemporalHistoryView: (view) => set({ temporalHistoryView: view, temporalOpen: true }),
  closeTemporalHistoryView: () => set({ temporalHistoryView: null }),

  // ========================================
  // Actions: 自定义分身 Agent
  // ========================================
  setCloneCreatorOpen: (v) => set({ cloneCreatorOpen: v }),
  openCloneCreator: () => set({ cloneCreatorOpen: true }),
  closeCloneCreator: () => set({ cloneCreatorOpen: false }),
  /**
   * 创建专属分身（仅允许 1 个，重复创建会覆盖）
   * config: { name, avatar, bio, style, replyMode, imaConfig? }
   */
  createCustomClone: (config) => {
    const clone = {
      name: config.name?.trim() || '我的分身',
      avatar: config.avatar || '🪐',
      bio: config.bio?.trim() || '探索者的思想分身',
      style: config.style?.trim() || '深邃、好奇、善于反思',
      replyMode: config.replyMode || 'template',
      imaConfig: config.imaConfig || null,
      createdAt: Date.now(),
    };
    set({ customClone: clone });
    saveToStorage('customClone', clone);
    // 建立归属关系（用 ownership source 标记，OwnerLine 专用）
    get().addMemory('user', 'custom_clone', '我的分身', Date.now(), 'ownership');
    return clone;
  },

  updateCustomClone: (patch) => {
    const cur = get().customClone;
    if (!cur) return;
    const next = { ...cur, ...patch };
    set({ customClone: next });
    saveToStorage('customClone', next);
  },

  removeCustomClone: () => {
    set({ customClone: null });
    saveToStorage('customClone', null);
    // 清理归属关系 memory（user ↔ custom_clone）
    const pairKey = makePairKey('user', 'custom_clone');
    const { memories } = get();
    if (memories[pairKey]) {
      const newMemories = { ...memories };
      delete newMemories[pairKey];
      set({ memories: newMemories });
      saveToStorage('memories', newMemories);
    }
  },

  /** 切换分身回复模式：'template' | 'llm' | 'knowledge' */
  setCloneReplyMode: (mode) => {
    const cur = get().customClone;
    if (!cur) return;
    const next = { ...cur, replyMode: mode };
    set({ customClone: next });
    saveToStorage('customClone', next);
  },

  /** 保存 ima 知识库凭据 */
  setCloneImaConfig: (imaConfig) => {
    const cur = get().customClone;
    if (!cur) return;
    const next = { ...cur, imaConfig };
    set({ customClone: next });
    saveToStorage('customClone', next);
  },

  // ========================================
  // PhoneApp 兼容
  // ========================================
  setPhoneScreen: (screen) => set({ phoneScreen: screen }),

  // ========================================
  // Actions: Demo
  // ========================================
  setDemoActive: (v) => set({ demoActive: v }),
  setDemoHighlight: (id) => set({ demoHighlight: id }),
  setDemoSubtitle: (text) => set({ demoSubtitle: text }),
  setDemoPhase: (phase) => set({ demoPhase: phase }),
  toggleNarration: () => set((s) => ({ narrationEnabled: !s.narrationEnabled })),
  setDemoShowPhone: (v) => set({ demoShowPhone: v }),
  setDemoShowDeliberation: (v) => set({ demoShowDeliberation: v }),
  setDemoShowTemporal: (v) => set({ demoShowTemporal: v }),

  // ========================================
  // Actions: 新手引导
  // ========================================
  nextOnboardingStep: () => set((s) => ({ onboardingStep: s.onboardingStep + 1 })),
  prevOnboardingStep: () => set((s) => ({ onboardingStep: Math.max(0, s.onboardingStep - 1) })),
  completeOnboarding: () => {
    set({ onboardingDone: true, onboardingStep: 0 });
    saveToStorage('onboardingDone', true);
  },
  skipOnboarding: () => {
    set({ onboardingDone: true, onboardingStep: 0 });
    saveToStorage('onboardingDone', true);
  },
  resetOnboarding: () => {
    set({ onboardingDone: false, onboardingStep: 0 });
    saveToStorage('onboardingDone', false);
  },

  // ========================================
  // Actions: 截图
  // ========================================
  setScreenshotReady: (v) => set({ screenshotReady: v }),
  takeScreenshot: () => {
    try {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `FoldNeb_折叠星云_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      set({ screenshotReady: true });
      setTimeout(() => set({ screenshotReady: false }), 2000);
    } catch (e) {
      console.warn('截图失败:', e);
    }
  },

  // ========================================
  // Actions: 一键初始化
  // ========================================
  // 清空所有 foldneb_* 用户数据（朋友圈/关注/记忆/星球/分身/推演历史/新手引导等），
  // 回到最开始的全新状态，然后刷新页面让所有初始加载逻辑重新跑一遍。
  resetAll: () => {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('foldneb_'));
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {}
    window.location.reload();
  },

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
