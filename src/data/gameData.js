/**
 * FoldNeb 折叠星云 — 核心数据
 * 4 星系 × 5 位 Agent = 20 位初始思想者
 */

export const GALAXIES = [
  {
    id: 'ai_frontier',
    name: '科技前沿',
    nameEn: 'AI Frontier',
    color: '#4488FF',
    position: [6, 0.5, 0],
    description: '人工智能与科技变革的探索者们',
  },
  {
    id: 'thought_source',
    name: '思想源流',
    nameEn: 'Thought Source',
    color: '#8866CC',
    position: [0, 0.5, 6],
    description: '东西方智慧的深层源流',
  },
  {
    id: 'strategy_game',
    name: '战略博弈',
    nameEn: 'Strategy Game',
    color: '#D4A520',
    position: [-6, 0.5, 0],
    description: '商业与人生的战略大师',
  },
  {
    id: 'solopreneur',
    name: '一人公司',
    nameEn: 'Solopreneur',
    color: '#44BB88',
    position: [0, 0.5, -6],
    description: '独立创造者的自由之路',
  },
];

export const AGENTS = [
  // ========== 科技前沿 (ai_frontier) ==========
  {
    id: 'jensen_huang',
    name: '黄仁勋',
    title: 'GPU教父',
    emoji: '🚀',
    galaxy: 'ai_frontier',
    color: '#3377EE',
    tier: 1,
    position: [6.5, 0.8, 0.4],
    satellites: ['加速计算', 'CUDA生态', 'AI基础设施'],
    description: 'NVIDIA CEO，GPU帝国缔造者。用30年将一块游戏显卡变成AI时代的算力引擎。',
    quotes: [
      '要么你为食物奔跑，要么你成为食物。',
      '我们不是在预测未来，我们是在发明未来。',
    ],
    tags: ['GPU', 'AI计算', '芯片'],
  },
  {
    id: 'elon_musk',
    name: '埃隆·马斯克',
    title: '火星梦想家',
    emoji: '🪐',
    galaxy: 'ai_frontier',
    color: '#5599FF',
    tier: 1,
    position: [6.8, -0.3, -0.3],
    satellites: ['SpaceX', 'xAI', '第一性原理'],
    description: 'SpaceX/Tesla/xAI 创始人，用第一性原理撕开每一个行业的口子。',
    quotes: [
      '当一件事足够重要，即使胜算渺茫你也要去做。',
      '如果事情没有失败，说明你不够创新。',
    ],
    tags: ['航天', '电动车', 'AI'],
  },
  {
    id: 'sam_altman',
    name: 'Sam Altman',
    title: 'AI布道者',
    emoji: '🤖',
    galaxy: 'ai_frontier',
    color: '#4477DD',
    tier: 1,
    position: [5.5, 1.2, 0.8],
    satellites: ['OpenAI', 'ChatGPT', 'AGI路线图'],
    description: 'OpenAI CEO，将大语言模型推向十亿用户的人。VC出身，深谙叙事的力量。',
    quotes: [
      '你必须对自己非常诚实，知道什么时候该坚持，什么时候该放弃。',
    ],
    tags: ['LLM', 'AGI', '创业'],
  },
  {
    id: 'feifei_li',
    name: '李飞飞',
    title: 'AI视觉之母',
    emoji: '👁️',
    galaxy: 'ai_frontier',
    color: '#5588DD',
    tier: 2,
    position: [6.2, -0.8, 1.0],
    satellites: ['ImageNet', '计算机视觉', '以人为本AI'],
    description: '斯坦福教授，ImageNet缔造者。让机器学会"看"世界的人。',
    quotes: [
      'AI的终极目标不是取代人类，而是增强人类。',
    ],
    tags: ['视觉', '数据集', '学术界'],
  },
  {
    id: 'andrew_ng',
    name: '吴恩达',
    title: 'AI教育家',
    emoji: '📖',
    galaxy: 'ai_frontier',
    color: '#3366CC',
    tier: 2,
    position: [5.8, 0.3, -1.0],
    satellites: ['Coursera', 'DeepLearning', 'AI普及'],
    description: '前百度/谷歌大脑负责人，AI教育布道第一人。让数百万人学会了机器学习。',
    quotes: [
      'AI是新的电力，它将改变每一个行业。',
    ],
    tags: ['教育', 'ML', '平台'],
  },

  // ========== 思想源流 (thought_source) ==========
  {
    id: 'kevin_kelly',
    name: '凯文·凯利',
    title: '科技先知',
    emoji: '🔮',
    galaxy: 'thought_source',
    color: '#9966CC',
    tier: 1,
    position: [0.5, 0.5, 6.5],
    satellites: ['失控', '必然', '科技趋势'],
    description: '《连线》创始主编，用生物学思维理解技术演化。预言了去中心化、AI和共享经济。',
    quotes: [
      '未来已来，只是分布不均。',
      '技术是生命的第七界。',
    ],
    tags: ['未来学', '复杂系统', '技术哲学'],
  },
  {
    id: 'nassim_taleb',
    name: '塔勒布',
    title: '黑天鹅猎人',
    emoji: '🦢',
    galaxy: 'thought_source',
    color: '#7744BB',
    tier: 1,
    position: [-0.3, 0.8, 6.8],
    satellites: ['反脆弱', '黑天鹅', '杠铃策略'],
    description: '《黑天鹅》《反脆弱》作者，用数学和哲学重塑了人们对风险的理解。',
    quotes: [
      '反脆弱：在混乱和波动中变得更强。',
      '不要做那个预测下雨的人，而是建造方舟。',
    ],
    tags: ['概率论', '风险管理', '哲学'],
  },
  {
    id: 'daniel_kahneman',
    name: '丹尼尔·卡尼曼',
    title: '行为经济学之父',
    emoji: '🧠',
    galaxy: 'thought_source',
    color: '#8855CC',
    tier: 1,
    position: [0.8, -0.3, 5.8],
    satellites: ['思考快与慢', '前景理论', '认知偏差'],
    description: '诺贝尔经济学奖得主，揭示了人类决策中的系统性偏见。',
    quotes: [
      '我们对自己的无知视而不见，而且视而不见得如此彻底。',
    ],
    tags: ['心理学', '决策', '偏见'],
  },
  {
    id: 'laozi',
    name: '老子',
    title: '道法自然',
    emoji: '☯️',
    galaxy: 'thought_source',
    color: '#6655AA',
    tier: 1,
    position: [-0.8, 1.2, 5.5],
    satellites: ['道德经', '无为', '上善若水'],
    description: '道家创始人，《道德经》81章道尽宇宙运行的根本法则。',
    quotes: [
      '上善若水，水善利万物而不争。',
      '道生一，一生二，二生三，三生万物。',
    ],
    tags: ['道家', '东方哲学', '智慧'],
  },
  {
    id: 'wang_yangming',
    name: '王阳明',
    title: '知行合一',
    emoji: '🌸',
    galaxy: 'thought_source',
    color: '#7766BB',
    tier: 2,
    position: [0.2, -1.0, 6.2],
    satellites: ['心即理', '致良知', '事上磨练'],
    description: '明代心学大师，"知行合一"影响日本明治维新，也是现代行动哲学的东方原型。',
    quotes: [
      '知是行之始，行是知之成。',
      '破山中贼易，破心中贼难。',
    ],
    tags: ['心学', '行动哲学', '儒家'],
  },

  // ========== 战略博弈 (strategy_game) ==========
  {
    id: 'sunzi',
    name: '孙子',
    title: '兵圣',
    emoji: '⚔️',
    galaxy: 'strategy_game',
    color: '#CCAA44',
    tier: 1,
    position: [-6.5, 0.5, 0.5],
    satellites: ['孙子兵法', '知己知彼', '不战而胜'],
    description: '《孙子兵法》作者，2500年前的军事智慧至今依然是商业竞争的最高哲学。',
    quotes: [
      '知己知彼，百战不殆。',
      '上兵伐谋，其次伐交，其次伐兵，其下攻城。',
    ],
    tags: ['军事', '竞争', '领导力'],
  },
  {
    id: 'peter_thiel',
    name: '彼得·蒂尔',
    title: '逆势思考者',
    emoji: '💡',
    galaxy: 'strategy_game',
    color: '#DDBB55',
    tier: 1,
    position: [-6.2, 0.8, -0.3],
    satellites: ['从0到1', '垄断', '逆向思维'],
    description: 'PayPal联合创始人，《从0到1》作者。教你如何找到别人看不见的秘密。',
    quotes: [
      '竞争是给失败者准备的。',
      '你有什么别人不相信但你认为对的看法？',
    ],
    tags: ['创业', '垄断', '思考框架'],
  },
  {
    id: 'charlie_munger',
    name: '查理·芒格',
    title: '多元思维模型',
    emoji: '🧩',
    galaxy: 'strategy_game',
    color: '#BB9944',
    tier: 1,
    position: [-5.8, -0.3, 0.8],
    satellites: ['心智模型', '逆向思维', '能力圈'],
    description: '巴菲特搭档，用100多个思维模型构建了一张无所不包的人类误判心理学之网。',
    quotes: [
      '反过来想，总是反过来想。',
      '得到你想要的东西的最好方法，是让自己配得上它。',
    ],
    tags: ['投资', '心理学', '智慧'],
  },
  {
    id: 'su_shimin',
    name: '苏世民',
    title: '黑石之王',
    emoji: '🏰',
    galaxy: 'strategy_game',
    color: '#CC9933',
    tier: 2,
    position: [-6.8, 1.0, 0.2],
    satellites: ['黑石集团', '25条原则', '宏图大略'],
    description: '黑石集团联合创始人，私募股权之王。从零打造了全球最大的另类资产管理公司。',
    quotes: [
      '做大事和做小事的难度是一样的，所以选择做大事。',
    ],
    tags: ['投资', '领导力', '规模'],
  },
  {
    id: 'naval_ravikant',
    name: 'Naval Ravikant',
    title: '财富自由哲学家',
    emoji: '💰',
    galaxy: 'strategy_game',
    color: '#DDAA33',
    tier: 1,
    position: [-6.0, -0.8, -0.8],
    satellites: ['Angellist', '纳瓦尔宝典', '杠杆理论'],
    description: 'AngelList创始人，硅谷最通透的思想者之一。用140字把财富与幸福讲得比谁都清楚。',
    quotes: [
      '用头脑赚钱，而不是用时间。',
      '幸福是一种选择，也是一种技能。',
    ],
    tags: ['投资', '哲学', '致富'],
  },

  // ========== 一人公司 (solopreneur) ==========
  {
    id: 'paul_graham',
    name: 'Paul Graham',
    title: '黑客与画家',
    emoji: '🎨',
    galaxy: 'solopreneur',
    color: '#44AA77',
    tier: 1,
    position: [0.5, 0.6, -6.5],
    satellites: ['YC', '做不可规模化的事', 'Lisp'],
    description: 'Y Combinator 创始人，硅谷教父级人物。用一篇篇散文定义了现代创业精神。',
    quotes: [
      '做不可规模化的事。',
      '最好的创业想法往往看起来像坏主意。',
    ],
    tags: ['创业', '写作', 'YC'],
  },
  {
    id: 'pieter_levels',
    name: 'Pieter Levels',
    title: '数字游民教主',
    emoji: '✈️',
    galaxy: 'solopreneur',
    color: '#55BB88',
    tier: 1,
    position: [-0.3, 0.2, -6.8],
    satellites: ['NomadList', '12个月12个创业', '独立开发'],
    description: '12个月做了12个产品，年收入超200万美元的独立开发者。数字游民运动的标志。',
    quotes: [
      'Just ship it. 发布比完美重要。',
      '你是你自己的公司，不要等任何人给你许可。',
    ],
    tags: ['独立开发', '远程', '极简创业'],
  },
  {
    id: 'dan_koe',
    name: 'Dan Koe',
    title: '现代文艺复兴人',
    emoji: '✍️',
    galaxy: 'solopreneur',
    color: '#44CC99',
    tier: 2,
    position: [0.8, -0.5, -6.2],
    satellites: ['一人商业', '写作变现', '创作者经济'],
    description: '把写推特变成百万美元生意的一人公司标杆。用哲学+设计+写作的三位一体改变创作者经济。',
    quotes: [
      '如果你能用文字改变一个人的思想，你就能用文字改变一千个人。',
    ],
    tags: ['创作者', '教育', '个人品牌'],
  },
  {
    id: 'david_perell',
    name: 'David Perell',
    title: '写作学校创始人',
    emoji: '📝',
    galaxy: 'solopreneur',
    color: '#338866',
    tier: 2,
    position: [-0.8, 1.0, -5.8],
    satellites: ['Write of Passage', '在线写作', '知识管理'],
    description: 'Write of Passage 写作学校创始人，教会了数千人用互联网写作建立个人垄断。',
    quotes: [
      '互联网奖励那些在网上思考的人。',
    ],
    tags: ['写作', '教育', '社区'],
  },
  {
    id: 'marc_andreessen',
    name: '马克·安德森',
    title: '软件吞噬世界',
    emoji: '🌐',
    galaxy: 'solopreneur',
    color: '#33AA77',
    tier: 1,
    position: [0.0, -0.8, -6.0],
    satellites: ['a16z', '网景', '软件哲学'],
    description: '网景浏览器创造者，a16z联合创始人。说出"软件正在吞噬世界"的那个男人。',
    quotes: [
      '软件正在吞噬世界。',
      '乐观主义者创造未来。',
    ],
    tags: ['投资', '软件', '未来'],
  },
];

/**
 * 初始连线关系（基于已知的师承、合作、影响关系）
 * 每条线对应一个 pairKey，用于记忆晶体生长
 */
export const INITIAL_CONNECTIONS = [
  // 科技前沿内部
  { from: 'jensen_huang', to: 'feifei_li', label: 'GPU驱动视觉革命' },
  { from: 'jensen_huang', to: 'andrew_ng', label: 'GPU算力赋能ML教育' },
  { from: 'sam_altman', to: 'elon_musk', label: 'OpenAI始创同盟' },
  { from: 'feifei_li', to: 'andrew_ng', label: '斯坦福AI学派' },

  // 思想源流内部
  { from: 'kevin_kelly', to: 'nassim_taleb', label: '复杂系统视角' },
  { from: 'kevin_kelly', to: 'laozi', label: '道法自然与科技演化' },
  { from: 'daniel_kahneman', to: 'nassim_taleb', label: '认知偏差与黑天鹅' },
  { from: 'laozi', to: 'wang_yangming', label: '东方智慧传承' },
  { from: 'wang_yangming', to: 'nassim_taleb', label: '反脆弱东方原型' },

  // 战略博弈内部
  { from: 'sunzi', to: 'charlie_munger', label: '兵法与投资心法' },
  { from: 'peter_thiel', to: 'charlie_munger', label: '逆向思维同盟' },
  { from: 'naval_ravikant', to: 'charlie_munger', label: '智慧投资哲学' },
  { from: 'peter_thiel', to: 'naval_ravikant', label: '硅谷思维模型' },
  { from: 'sunzi', to: 'su_shimin', label: '谋略与商业实战' },

  // 一人公司内部
  { from: 'paul_graham', to: 'pieter_levels', label: '独立精神传承' },
  { from: 'pieter_levels', to: 'dan_koe', label: '一人商业进化论' },
  { from: 'dan_koe', to: 'david_perell', label: '写作商业双螺旋' },
  { from: 'paul_graham', to: 'marc_andreessen', label: '硅谷创业教父' },

  // 跨星系连线
  { from: 'kevin_kelly', to: 'marc_andreessen', label: '科技未来预言' },
  { from: 'nassim_taleb', to: 'naval_ravikant', label: '风险与财富' },
  { from: 'elon_musk', to: 'peter_thiel', label: 'PayPal黑帮' },
  { from: 'sunzi', to: 'paul_graham', label: '创业兵法' },
  { from: 'sam_altman', to: 'paul_graham', label: 'YC掌门传承' },
  { from: 'laozi', to: 'naval_ravikant', label: '东方智慧x硅谷哲学' },
  { from: 'jensen_huang', to: 'peter_thiel', label: '芯片地缘政治' },
];

/**
 * 获取 Agent 完整信息
 */
export function getAgent(id) {
  return AGENTS.find((a) => a.id === id);
}

/**
 * 获取星系信息
 */
export function getGalaxy(id) {
  return GALAXIES.find((g) => g.id === id);
}

/**
 * 按星系分组 Agent
 */
export function getAgentsByGalaxy() {
  const groups = {};
  GALAXIES.forEach((g) => {
    groups[g.id] = AGENTS.filter((a) => a.galaxy === g.id);
  });
  return groups;
}
