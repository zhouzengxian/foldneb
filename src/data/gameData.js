// ============================================================
// FoldNeb 折叠星云 v3 — 125 明星节点 · 13坊区
// 为思考者建造会生长的思想星河
// ============================================================

// 懒引用：函数体内才取 store 状态，避免顶层循环依赖（store 也 import 本模块）
import useNebulaStore from '../store/useNebulaStore.js';

// ==================== 工具函数 ====================
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function hexColor(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function lerpColor(c1, c2, t) {
  const r1 = parseInt(c1.slice(1,3), 16), g1 = parseInt(c1.slice(3,5), 16), b1 = parseInt(c1.slice(5,7), 16);
  const r2 = parseInt(c2.slice(1,3), 16), g2 = parseInt(c2.slice(3,5), 16), b2 = parseInt(c2.slice(5,7), 16);
  return hexColor(r1 + (r2-r1)*t, g1 + (g2-g1)*t, b1 + (b2-b1)*t);
}

// ==================== 13坊区定义 ====================
export const districts = [
  { id: 'ai_frontier',        name: 'AI前沿',     color: '#4488FF', position: [10.5, 0, 0],    radius: 4.5, lanternColor: '#80B8FF' },
  { id: 'cognition_decision', name: '认知与决策', color: '#FF8C42', position: [9.3, 0, 4.9],    radius: 4.0, lanternColor: '#FFB888' },
  { id: 'strategy_game',      name: '战略与博弈', color: '#CC4444', position: [6.0, 0, 8.6],    radius: 3.8, lanternColor: '#EE8888' },
  { id: 'capital_cycle',      name: '资本与周期', color: '#D4A520', position: [1.3, 0, 10.4],   radius: 3.8, lanternColor: '#E8C860' },
  { id: 'complex_systems',    name: '复杂系统',   color: '#44BB88', position: [-3.7, 0, 9.8],   radius: 3.8, lanternColor: '#80E8B8' },
  { id: 'network_platform',   name: '网络与平台', color: '#8866CC', position: [-7.9, 0, 7.0],   radius: 3.8, lanternColor: '#B8A0F0' },
  { id: 'product_design',     name: '产品与设计', color: '#FF66AA', position: [-10.2, 0, 2.5],  radius: 3.5, lanternColor: '#FFAACC' },
  { id: 'china_contemporary', name: '中国当代',   color: '#DD3333', position: [-10.2, 0, -2.5], radius: 4.5, lanternColor: '#EE6666' },
  { id: 'thought_source',     name: '思想源流',   color: '#99AACC', position: [-7.9, 0, -7.0],  radius: 4.0, lanternColor: '#CCD8EE' },
  { id: 'ai_narrative',       name: 'AI叙事场',   color: '#44AADD', position: [-3.7, 0, -9.8],  radius: 4.0, lanternColor: '#88D8F8' },
  { id: 'cross_domain',       name: '跨界之眼',   color: '#CC8844', position: [1.3, 0, -10.4],  radius: 3.2, lanternColor: '#EEB888' },
  { id: 'knowledge_hub',      name: '知识枢纽',   color: '#B8C5D6', position: [6.0, 0, -8.6],   radius: 3.2, lanternColor: '#D8E0F0' },
  { id: 'grassroots_power',   name: '草根力量',   color: '#66BB66', position: [9.3, 0, -4.9],   radius: 5.0, lanternColor: '#90EE90' },
];

const districtMap = {};
districts.forEach(d => { districtMap[d.id] = d; });

// 辅助：在坊区圆心附近散布位置
function scatterPos(cx, cz, r, i, n, hRange) {
  const angle = (i / n) * Math.PI * 2 + (i * 0.7);
  const dist = r * (0.25 + 0.6 * ((i % 5) / 5));
  const h = (Math.sin(i * 1.3) * (hRange || 0.8));
  return [cx + Math.cos(angle) * dist, h, cz + Math.sin(angle) * dist];
}

// ==================== Tier 1: 125 明星节点 ====================

// ===== 1. AI前沿 (12人) =====
const AI_FRONTIER = [
  {
    id: 'jensen_huang', name: '黄仁勋', title: 'GPU教父', emoji: '🚀',
    position: [11.2, 0.4, 0.5], district: 'ai_frontier', color: '#3377EE', tier: 1,
    description: 'NVIDIA CEO，用CUDA和算力堆出了整个AI时代的基础设施',
    dialogue: '我们不是在造芯片——是在造计算的新范式。GPU从游戏显卡变成了AI的引擎。十年CUDA，一朝AI爆发——不是运气，是耐心。',
    satellites: [{ label: 'CUDA', offset: [0.5, 0.25, 0.4] }, { label: 'DGX', offset: [-0.45, -0.2, 0.35] }, { label: 'GPU·算力', offset: [0.05, -0.3, 0.4] }],
    tags: ['GPU计算','AI基础设施','并行架构'],
    highlights: ['NVIDIA CEO','2006年all in CUDA','十年验证后AI爆发'],
    // ===== 深度档案 =====
    bio: [
      '黄仁勋（Jensen Huang），1963年生于中国台湾台北，9岁随家人移居美国。童年时期在肯塔基州一所浸信会教会学校寄宿，被分配打扫男生宿舍厕所——这段被他自己称为"最好的品格教育"的经历，塑造了他后来"做脏活累活也不抱怨"的工程师气质。',
      '1984年从俄勒冈州立大学电子工程系毕业后，他先在 AMD 和 LSI Logic 工作。1993年，30岁的他在一家 Denny\'s 早餐店里和两位合伙人 Chris Malachowsky、Curtis Priem 决定创办 NVIDIA。最初的目标很朴素——做 3D 游戏加速芯片。',
      '真正的转折点是 2006 年 CUDA 的发布。当时华尔街和竞争对手都在嘲笑：通用计算 GPU 是个伪命题，赚不到钱。但黄仁勋坚持每年烧钱投入 CUDA 生态长达十年，让 GPU 从"游戏外设"变成了"科学计算平台"。',
      '2012 年 AlexNet 横空出世，深度学习的三巨头（Hinton、LeCun、Bengio）第一次让世界意识到：原来神经网络跑在 GPU 上比 CPU 快 100 倍。这一年成了 AI 时代的元年，而 NVIDIA 已经为这个时代铺好了十年的铁轨。',
      '2023 年 ChatGPT 引爆生成式 AI，NVIDIA 市值从 5000 亿美元飙升至 3 万亿美元以上，黄仁勋成为地球上最被仰望的科技 CEO。但他反复强调："这不是运气——是十五年没有人愿意走的孤独之路。"'
    ],
    timeline: [
      { year: '1963', event: '出生于中国台湾台北' },
      { year: '1972', event: '9岁赴美，被送到肯塔基州教会寄宿学校，从洗碗工做起' },
      { year: '1984', event: '俄勒冈州立大学电子工程学士，毕业即加入 AMD' },
      { year: '1993', event: '30岁，在 Denny\'s 餐厅与合伙人创办 NVIDIA，任 CEO 至今' },
      { year: '1999', event: 'NVIDIA 上市，定义 GPU（Graphics Processing Unit）一词' },
      { year: '2006', event: '发布 CUDA——GPU 通用计算平台，被嘲笑十年后改变世界' },
      { year: '2012', event: 'AlexNet 用 NVIDIA GPU 拿下 ImageNet 冠军，深度学习时代开启' },
      { year: '2016', event: '亲手将全球首台 DGX-1 送到 OpenAI——封面写着「致 Elon 与 OpenAI」' },
      { year: '2023', event: 'ChatGPT 引爆生成式 AI，NVIDIA 成为全球市值最高的芯片公司' },
      { year: '2024', event: 'NVIDIA 市值突破 3 万亿美元，黄仁勋被誉为「AI 时代的卖水人」' }
    ],
    philosophy: [
      {
        title: '加速计算 = 反直觉的护城河',
        text: '所有人都追求"通用 CPU"的便利，但黄仁勋坚持：专用加速芯片 + 软件平台（CUDA）的组合，在算力饥渴的 AI 时代会赢。这是一条与"通用即正义"的硅谷主流完全相反的路。'
      },
      {
        title: '十年孤独期 = 真正的复利',
        text: 'CUDA 在 2006-2016 这十年几乎不赚钱、被华尔街看空。但黄仁勋把这段时期看作"挖护城河"——当 AI 浪潮来临，竞争对手才发现 CUDA 生态壁垒已经十年高。'
      },
      {
        title: '"买得越多省得越多"',
        text: 'NVIDIA 的口号"The more you buy, the more you save"。看似反直觉——但黄仁勋的逻辑是：买 GPU 不是消费，是降低单位算力成本。在大模型时代，延迟 = 钱，算力 = 钱。'
      },
      {
        title: '皮衣 = 个人品牌',
        text: '从 90 年代起他几乎每次公开亮相都穿黑色皮衣。这不是品味，是策略——让全世界一眼就认出他。在 GTC 大会上，皮衣已经成为 NVIDIA 的图腾。'
      }
    ],
    quotes: [
      { text: '我们不是在造芯片——是在造计算的新范式。', context: '2024 GTC 大会，回应记者「你们还做显卡吗」的提问' },
      { text: '运气就是在别人还没看懂的时候，你已经在挖护城河了——而且一挖就是十五年。', context: '回应「CUDA 成功靠运气」的质疑' },
      { text: '如果你不投资未来，你就没有未来。', context: '2023 财报会议，解释为何在 R&D 上持续加注' },
      { text: 'AGI 是一辆跑车，我们造的是高速公路。', context: '回应 Sam Altman 关于 AGI 即将到来的言论' },
      { text: '加速计算，就是降低人类探索的边际成本。', context: '2024 斯坦福商学院演讲' }
    ],
    works: [
      { name: 'NVIDIA GeForce 256', type: '产品', year: '1999', note: '世界上第一款 GPU，定义了「图形处理器」概念' },
      { name: 'CUDA 平台', type: '软件', year: '2006', note: '让 GPU 从图形加速器变成通用计算平台——AI 时代的基础' },
      { name: 'Tesla / Fermi 架构', type: '架构', year: '2006-2010', note: '为科学计算重新设计的 GPU 架构' },
      { name: 'DGX-1', type: '产品', year: '2016', note: '全球首款 AI 超算，首台送给了 OpenAI' },
      { name: 'Hopper H100 / Blackwell B200', type: '芯片', year: '2022-2024', note: '生成式 AI 时代的算力之王' },
      { name: ' Omniverse', type: '平台', year: '2021', note: '工业数字孪生与元宇宙仿真平台' }
    ],
    legacy: '黄仁勋的意义远超"AI 时代卖水人"。他用 30 年时间证明了一件事——在被所有人嘲笑的方向上坚持十年，是这个时代最稀缺的企业家品质。CUDA 的故事本质上是"长期主义"的活教材：当短期的财报数字告诉你这条路错的时候，长期的技术趋势告诉你这条路是对的。下一个十年，当 AI 渗透到每一行代码、每一个决策、每一次创造时，黄仁勋铺的这条「算力高速公路」将成为人类文明底层基础设施的一部分。',
    // ===== 动态情报时间线（最新在前，历史折叠展示） =====
    analysisHistory: [
      {
        date: '2026-06-14',
        trigger: 'Computex 2026 台北主题演讲，发布「特供版」H200-China 芯片并宣布物理 AI 平台 NIM Robotics',
        markdown: `# 📊 黄仁勋 动态分析

**日期：** 2026-06-14  
**身份：** NVIDIA 创始人兼 CEO · 算力时代的总架构师  
**触发事件：** 6月3日 Computex 2026 台北主题演讲，正式发布面向中国市场的 H200-China 定制芯片，同时宣布物理 AI 开发平台 NIM Robotics 全面开放

---

## 一句话本质

**黄仁勋用两个月时间把 4 月播客里的"应该竞争而不是拱手相让"从口号变成了产品——特供芯片稳住中国市场基本盘，物理 AI 叙事则把 NVIDIA 的天花板从"卖芯片"拉升到"定义一切智能体的运行时"。**

---

## 🔍 三层拆解

### 结构层：说了什么？

**核心表态（原文精选）：**

> "最好的芯片应该去竞争，而不是被锁在柜子里。H200-China 就是我的回答。"

> "下一个万亿美元市场不在数据中心——在物理世界。每一个工厂、每一台机器人、每一辆车都是一个需要被加速的计算节点。"

> "CUDA 不只是一个并行计算平台，它是物理世界的操作系统。"

| 编号 | 论点 | 潜在前提 |
| --- | --- | --- |
| 1 | 特供芯片是"竞争而非退让" | 性能阉割版仍优于国产替代，维持生态锁定 |
| 2 | 物理 AI 是下一个增长极 | 数据中心 AI 增长见顶预期下，需开辟新叙事 |
| 3 | CUDA = 物理世界的 OS | 软件平台比硬件更有粘性，开发者迁移成本是终极护城河 |
| 4 | 台湾供应链是不可替代的资产 | 地缘政治风险下，绑定台积电 = 绑定全球 |

---

### 逻辑层：为什么这么说？

**利益分析：**
- **直接利益**：H200-China 挽回因禁售流失的中国订单——4 月播客喊话已转化为具体产品，向市场证明"NVIDIA 没有放弃中国"
- **间接利益**：物理 AI 叙事将 NVIDIA 的 TAM（可触达市场）从数据中心扩展到制造业、机器人、自动驾驶，给投资者一个新的估值锚点
- **深层博弈**：用"特供芯片 + CUDA 生态"的组合拳，让中国 AI 开发者即使有华为昇腾可选，也自愿留在 NVIDIA 生态内——锁住开发者比锁住硬件更重要

**假设还原：** 硬件性能差距可以被国产芯片追上，但百万级开发者的 CUDA 使用习惯是 10 年都追不上的。只要开发者不迁移，NVIDIA 永远是默认选项。

**逻辑链条：** 禁售压力 → 推出特供版芯片 → 以"可接受性能 + 完整 CUDA 生态"留住中国开发者 → 国产芯片有硬件无生态 → NVIDIA 生态锁定延续

**信息不对称所在：**
- 公众看到的是"NVIDIA 向禁令低头出阉割版"
- 黄仁勋看到的是"用一颗特供芯片买下整个中国开发者社区 5 年的迁移犹豫"

**受众目标：** 三重受众——给中国政府/企业看（我没有走，我在竞争）；给美国政府看（我找到了合规路径）；给投资者看（物理 AI 打开新天花板）

---

### 未来层：然后呢？

**短期预判（1-3个月）：**
- H200-China 将在 Q3 开始向中国客户出货，首批客户包括阿里、腾讯、字节
- NIM Robotics 平台将吸引 Boston Dynamics、宇树科技等机器人公司接入
- 华为将加速昇腾 910C 的大规模部署作为回应，价格战可能打响

**中期格局（6-12个月）：**
- "物理 AI" 将取代 "大模型" 成为 2027 年最热赛道——工厂自动化、人形机器人、自动驾驶三线并进
- 中国市场形成"H200-China 做推理 + 昇腾做训练"的混合架构，NVIDIA 暂时守住推理存量
- 台积电 CoWoS 封装产能成为全行业瓶颈，黄仁勋可能亲自游说扩大先进封装投资

**长期影响（2-3年）：**
- NVIDIA 从"芯片公司"彻底转型为"AI 运行时平台公司"——CUDA 生态价值超越硬件销售
- 物理 AI 催生"机器人界的 CUDA Moment"，NVIDIA 有望成为人形机器人的底层标准
- 中美 AI 算力从"脱钩"走向"并行演化"——两条技术栈，一个 CUDA 接口

---

## 💡 可复用要点

### 商业判断
1. **「特供芯片不是妥协，是生态投资」**：当你无法用一种产品服务所有市场时，定制化产品不是降维，而是精准锁定——每颗特供芯片都是一张生态续费券。
2. **「叙事即估值」**：当核心市场增长见顶时，最快的估值拉升方式不是财报，而是定义一个新的 TAM。黄仁勋用"物理 AI"三个字，把 NVIDIA 的天花板抬高了一个数量级。
3. **「开发者惯性 > 硬件性能」**：在平台型业务中，让对手追上你的硬件不可怕，可怕的是对手追上了硬件但开发者不愿意迁移。

### 行动建议
1. **「在压力最大的时候出牌」**：黄仁勋在被美国政府限制、被中国客户质疑的双重压力下，反而加速推出特供产品——压力最大的窗口期，往往是对手最懈怠的时候。
2. **「永远准备下一个叙事」**：当一个增长故事（大模型）还在巅峰时，就开始铺下一个故事（物理 AI）——不要等天花板来了才找新方向。
3. **「锁定开发者就是锁定未来」**：无论你卖什么，先确保有一个让开发者离不开的平台层——它是你最深的护城河。

---

## 🎯 同频者视角
**核心能力圈：** 定义 AI 计算的底层架构（GPU + CUDA），让全球 AI 开发者无法绕开 NVIDIA
**下一个能力圈：** 定义物理世界智能体的运行时（NIM Robotics），让机器人和工厂也跑在 CUDA 上

---

*分析完成时间：2026-06-14 14:00*`,
      },
      {
        date: '2026-04-20',
        trigger: '4月16日接受 Dwarkesh Patel 播客访谈，就芯片禁售与中国市场发表强硬表态',
        markdown: `# 📊 黄仁勋 动态分析

**日期：** 2026-04-20  
**身份：** NVIDIA 创始人兼 CEO  
**触发事件：** 4月16日接受 Dwarkesh Patel 播客访谈，就芯片禁售与中国市场发表强硬表态

---

## 一句话本质

**AI 算力时代的"操作系统守门人"，正在用商业逻辑破解政治叙事，把芯片禁售变成一场关于"谁更需要谁"的压力测试。**

---

## 🔍 三层拆解

### 结构层：说了什么？

**核心表态（原文精选）：**

> "放弃中国市场的想法是失败者心态。"

> "如果 NVIDIA 的芯片更好，应该去竞争，而不是拱手相让。"

> "DeepSeek 第一天在华为芯片上发布的那一天，对我们国家来说是一个糟糕的结果。"

| 编号 | 论点 | 潜在前提 |
| --- | --- | --- |
| 1 | 中国并非没有算力 | 芯片 ≠ 算力，能源可弥补性能差距 |
| 2 | 禁售产生反效果 | 逼迫中国加速内部架构优化 |
| 3 | 开发者生态才是护城河 | 50% AI 开发者在华，放弃 = 放弃生态 |
| 4 | 竞争比防守更优 | NVIDIA 芯片更优越，市场竞争能获胜 |

---

### 逻辑层：为什么这么说？

**利益分析：**
- **直接利益**：为中国市场正当化——禁售持续，NVIDIA 失去的不只是订单，还有开发者生态
- **间接利益**：向美国政府施压，用"失败者心态"刺激决策者，暗示禁售会反向激励中国芯片产业
- **深层博弈**：重塑叙事框架，把"国家安全"问题转化为"商业竞争"问题

**假设还原：** 芯片是商品，不是武器。一旦芯片被武器化，美国芯片产业将失去最大的市场纵深，CUDA 生态将成为无源之水。

**逻辑链条：** 芯片被武器化 → 美国产业失去中国市场 → 中国加速芯片自研 → NVIDIA 失去市场却没阻止竞争

**信息不对称所在：**
- 公众看到的是"禁售保护美国"
- 黄仁勋看到的是"禁售正在训练竞争对手"

---

### 未来层：然后呢？

**短期预判（1-3个月）：**
- NVIDIA 将继续向美国政府游说，用商业数据说话
- 可能出现"特供版芯片"（性能阉割版）作为折中方案
- GTC Taipei（6月1日）将成为向亚太市场表态的关键舞台

**中期格局（6-12个月）：**
- 中国 AI 芯片（华为昇腾）将加速追赶，DeepSeek 模式反向激励国产化
- "能源算力"概念将被更多分析师讨论
- NVIDIA 护城河从"硬件性能"转向"软件生态 + 开发者惯性"

**长期影响（2-3年）：**
- AI 算力格局从"单极霸权"走向"双生态竞争"
- 黄仁勋真正目标是确保中国市场在 NVIDIA 生态内演进

---

## 💡 可复用要点

### 商业判断
- **"禁售悖论"**：技术封锁往往加速被封锁方的自主研发。判断禁令是否有效，看它是否在培养一个未来的竞争对手。
- **"生态锁定"比"性能领先"更持久**：CUDA 上百万开发者的使用习惯才是真正护城河。
- **"能源弥补芯片"思维**：算力竞争的下半场是能源竞争。

### 行动建议
- 面对政治正确压力时，用商业逻辑破解叙事。
- 建立"离开你也能活"的反向护城河。
- 关注政策的"非预期后果"。

---

*分析完成时间：2026-04-20 17:38*`,
      },
    ],
  },
  {
    id: 'elon_musk', name: 'Elon Musk', title: '第一性原理', emoji: '⚡',
    position: [10.0, 0.2, -0.6], district: 'ai_frontier', color: '#4488FF', tier: 1,
    description: 'Tesla/SpaceX/xAI，用物理第一性原理重新定义多个行业',
    dialogue: 'The first step is to establish that something is possible. Then probability will occur. 最好的流程是没有流程，最好的部门是没有部门。',
    satellites: [{ label: 'xAI', offset: [0.4, 0.2, 0.35] }, { label: 'Tesla·FSD', offset: [-0.35, -0.15, 0.3] }],
    tags: ['第一性原理','多领域颠覆','物理学思维'],
    highlights: ['PayPal Mafia','SpaceX 可回收火箭','Tesla 改写汽车业'],
    // ===== 深度档案 =====
    bio: [
      'Elon Musk（埃隆·马斯克），1971 年生于南非比勒陀利亚。父亲是工程师，母亲是营养师兼模特。童年时父母离婚，他跟随脾气暴戾的父亲生活，在学校被欺凌到住院——这段经历后来被他描述为"人生最黑暗的时期"。',
      '10 岁自学编程，12 岁写出游戏 Blastar 以 500 美元卖给杂志。17 岁离开南非，先到加拿大（拿到了加拿大国籍以躲避南非兵役），再转学美国宾夕法尼亚大学，读物理 + 经济学双学位。',
      '1995 年斯坦福博士入学两天后辍学，与弟弟 Kimbal 创办 Zip2，被康柏以 3.07 亿美元收购。1999 年创办 X.com（后来的 PayPal），2002 年被 eBay 以 15 亿美元收购——他个人拿到 1.65 亿美元，从此开启"用互联网赚的钱砸物理世界"的疯狂计划。',
      '同一年他创办 SpaceX，目标只有一个——让人类成为多行星物种。所有人都说他疯了：私人公司怎么可能跟 NASA 和波音竞争？22 年后，SpaceX 的可回收火箭把发射成本砍掉 90%，星链已覆盖全球，龙飞船成为美国宇航员往返国际空间站的唯一工具。',
      '2004 年他投资 650 万美元成为特斯拉最大股东，2008 年金融危机时几乎同时面临 Tesla、SpaceX 双破产，靠最后借来的钱扛了下来。今天 Tesla 是全球市值最高的车企，Model Y 是 2023 年全球最畅销车型。他同时管理着 6 家公司：Tesla、SpaceX、X（前 Twitter）、xAI、Neuralink、The Boring Company——他的工作时间表是按"5 分钟为单位"安排的。'
    ],
    timeline: [
      { year: '1971', event: '出生于南非比勒陀利亚' },
      { year: '1983', event: '12 岁写出游戏 Blastar，500 美元卖出第一段代码' },
      { year: '1995', event: '斯坦福博士入学 2 天后辍学，创办 Zip2' },
      { year: '1999', event: '创办 X.com，后合并为 PayPal' },
      { year: '2002', event: 'PayPal 被 eBay 15 亿美元收购，同年创办 SpaceX' },
      { year: '2004', event: '投资 Tesla 并成为董事长，开启电动车革命' },
      { year: '2008', event: 'Tesla 与 SpaceX 同时濒临破产，借钱艰难翻盘' },
      { year: '2015', event: '创办 OpenAI（后退出），同年 Neuralink 成立' },
      { year: '2018', event: '猎鹰重型火箭把他的红色特斯拉送入太空' },
      { year: '2020', event: 'SpaceX 龙飞船成为首个送宇航员上天的私人飞船' },
      { year: '2022', event: '440 亿美元收购 Twitter，改名 X' },
      { year: '2023', event: '创办 xAI，发布 Grok 大模型，对标 OpenAI' }
    ],
    philosophy: [
      {
        title: '第一性原理（First Principles）',
        text: '不要用类比思考，要从物理学的最基本公理重新推导。火箭为什么这么贵？因为传统航天用一次性设计。如果可回收，燃料成本只占 0.3%。从这个公理出发，SpaceX 把发射成本降低了 90%。'
      },
      {
        title: '物理学的极限就是商业的极限',
        text: '马斯克的所有决策都先问"物理上是否可行"。电动车能量密度、火箭回收、脑机接口——只要物理上不违反定律，工程问题就一定能解决。这跟传统商业的"市场调研驱动"完全相反。'
      },
      {
        title: '跨领域转移 + 极限时间管理',
        text: '他能在一天内切换 Tesla、SpaceX、X、xAI 四个公司，是因为他掌握了"工程师-CEO"双重身份——决策和实现高度耦合。每周工作 100+ 小时，按 5 分钟为单位排程。'
      },
      {
        title: '使命感 > 商业模式',
        text: '"让人类成为多行星物种"、"加速可持续能源转型"、"让 AI 安全"——这些使命不是为了融资，是他真的相信。他宁愿押上全部身家也要让使命成功，这是他能熬过 2008、2018 等多次破产边缘的根本原因。'
      }
    ],
    quotes: [
      { text: 'The first step is to establish that something is possible. Then probability will occur.', context: '关于第一性原理方法论的阐述' },
      { text: '当一件事足够重要时，即使胜算不大，你也要去做。', context: '解释为何创办 SpaceX' },
      { text: '我宁愿在火星上死去，只要不是撞击在表面上。', context: '关于人类移民火星的态度' },
      { text: '我工作到疯狂的程度，不是因为我必须——是因为我真心相信这些事情值得做。', context: '回应外界对他工作强度的质疑' },
      { text: '常青藤的学历没有意义，重要的是你解决了什么问题。', context: 'Tesla 招聘哲学' },
      { text: '最好的流程是没有流程，最好的部门是没有部门。', context: '管理哲学' }
    ],
    works: [
      { name: 'PayPal', type: '产品', year: '1999-2002', note: '改变在线支付，催生了"PayPal Mafia"——一个改变硅谷的人脉网络' },
      { name: 'SpaceX Falcon 9', type: '火箭', year: '2010', note: '全球首款实现可回收的轨道级火箭，把发射成本砍掉 90%' },
      { name: 'Tesla Model S / 3 / Y', type: '汽车', year: '2012-2020', note: '让电动车从"环保玩具"变成"性能之王"，Model Y 成为全球销冠' },
      { name: 'Starlink 星链', type: '网络', year: '2019', note: '6000+ 颗低轨卫星组成的全球互联网' },
      { name: 'Neuralink', type: '硬件', year: '2016', note: '脑机接口，已让瘫痪患者用意念控制电脑' },
      { name: 'xAI Grok', type: 'AI', year: '2023', note: '对标 ChatGPT 的大模型，强调"反政治正确"' }
    ],
    legacy: '马斯克的争议和成就一样多——但他用 30 年时间证明了一件事：当一个工程师型的 CEO 用第一性原理重新审视一个行业时，整个行业的成本结构、商业模式、甚至存在意义都会被重写。PayPal 重塑了支付，Tesla 重塑了汽车，SpaceX 重塑了航天，X 重塑了社交媒体，xAI 正在重塑 AI。他的方法论——「先问物理上可不可能，再问商业上值不值」——已经成为这个时代最具争议也最有效的创新范式。无论你爱他还是恨他，他都在按自己 22 岁就定下的目标推进：让人类成为多行星物种，让可持续能源取代化石燃料，让 AI 走向安全。这三件事，目前没有第二个人在同时做。'
  },
  {
    id: 'sam_altman', name: 'Sam Altman', title: 'OpenAI掌门', emoji: '🤖',
    position: [10.8, 0.1, -0.2], district: 'ai_frontier', color: '#2266DD', tier: 1,
    description: '从YC总裁到ChatGPT之父，改变了人类与智能的交互方式',
    dialogue: 'AGI is not a tool—it\'s a new species. We\'re creating a new form of intelligence. Not stronger computers, but entities that can understand, reason, and create.',
    satellites: [{ label: 'ChatGPT', offset: [0.45, 0.2, 0.35] }, { label: 'OpenAI', offset: [-0.4, -0.2, 0.4] }],
    tags: ['AGI','大语言模型','AI安全'],
  },
  {
    id: 'demis_hassabis', name: 'Demis Hassabis', title: 'AlphaFold之父', emoji: '🧬',
    position: [10.3, -0.1, 0.8], district: 'ai_frontier', color: '#5599FF', tier: 1,
    description: 'DeepMind创始人，AlphaGo/AlphaFold改变了生物学和AI的边界',
    dialogue: 'Intelligence is the most powerful tool humanity has. Solving intelligence means solving everything else. AGI is not the end—it\'s the beginning.',
  },
  {
    id: 'yann_lecun', name: 'Yann LeCun', title: '卷积网络之父', emoji: '👁️',
    position: [11.0, -0.2, -0.3], district: 'ai_frontier', color: '#3377FF', tier: 1,
    description: 'Meta AI首席科学家，CNN发明者，自监督学习倡导者',
    dialogue: 'A cat can learn about the world in ways no current AI can. We\'re missing something fundamental. LLMs are not the path to AGI—world models are.',
  },
  {
    id: 'dario_amodei', name: 'Dario Amodei', title: 'Claude缔造者', emoji: '🧠',
    position: [10.5, 0.3, 0.0], district: 'ai_frontier', color: '#4488FF', tier: 1,
    description: 'Anthropic CEO，从安全出发再造AI的逆向思考者',
    dialogue: 'We put safety first, then capability. Constitutional AI is not a technical choice—it\'s an ethical one. AI must learn to say no.',
  },
  {
    id: 'feifei_li', name: '李飞飞', title: 'ImageNet之母', emoji: '🌟',
    position: [9.8, 0.1, 0.4], district: 'ai_frontier', color: '#5599FF', tier: 1,
    description: '让计算机学会"看"的华人科学家，AI以人为本的倡导者',
    dialogue: '计算机视觉不只是让机器识别物体——它关乎机器如何理解人类的世界。AI的未来不是取代人，而是增强人。Human-centered AI。',
  },
  {
    id: 'li_kaifu', name: '李开复', title: 'AI创投教父', emoji: '💡',
    position: [10.6, 0.0, 1.1], district: 'ai_frontier', color: '#2266CC', tier: 1,
    description: '创新工场CEO，从微软亚洲研究院到AI投资，见证中国AI崛起',
    dialogue: 'AI不会取代人，但会用AI的人会取代不会用AI的人。未来十年，最大的机会不是造AI——是用AI重新发明每一个行业。',
  },
  {
    id: 'liang_wenfeng', name: '梁文锋', title: 'DeepSeek创始人', emoji: '🐋',
    position: [11.3, -0.1, -0.8], district: 'ai_frontier', color: '#1155DD', tier: 1,
    description: '幻方量化→DeepSeek，用极低成本做出顶级大模型，震惊硅谷',
    dialogue: '我们不需要跟OpenAI比烧钱。几百张卡也能做出世界级模型——关键在于架构创新，不是算力堆叠。DeepSeek证明了这件事。',
  },
  {
    id: 'andrej_karpathy', name: 'Andrej Karpathy', title: 'AI布道者', emoji: '📖',
    position: [9.5, 0.2, 0.0], district: 'ai_frontier', color: '#66AAFF', tier: 1,
    description: '前Tesla AI总监、OpenAI联合创始人，最好的AI教育家',
    dialogue: 'The best way to learn AI is to build it from scratch. Every line of code you write is a step toward understanding. LLMs are not magic—they\'re math.',
  },
  {
    id: 'geoffrey_hinton', name: 'Geoffrey Hinton', title: '深度学习之父', emoji: '🧪',
    position: [10.1, 0.3, -0.4], district: 'ai_frontier', color: '#4488EE', tier: 1,
    description: '图灵奖得主，反向传播算法和深度学习的奠基人',
    dialogue: 'I used to think we had 30-50 years before AGI. Now I think it might be much sooner. Digital intelligence is not like biological intelligence—it can share knowledge instantly.',
  },
  {
    id: 'andrew_ng', name: 'Andrew Ng', title: 'AI教育家', emoji: '🎓',
    position: [10.4, 0.0, -1.0], district: 'ai_frontier', color: '#5599EE', tier: 1,
    description: 'Coursera联合创始人、Google Brain发起者、AI民主化的旗手',
    dialogue: 'AI is the new electricity. Just as electricity transformed every industry, AI will do the same. My mission is to make AI education accessible to everyone.',
  },
];

// ===== 2. 认知与决策 (10人) =====
const COGNITION_DECISION = [
  {
    id: 'kahneman', name: '卡尼曼', title: '行为经济学之父', emoji: '🧠',
    position: [9.0, 0.2, 5.2], district: 'cognition_decision', color: '#EE7C32', tier: 1,
    description: '思考快与慢的作者，揭示了人类决策的系统性偏差',
    dialogue: '你的大脑有两个系统：系统1快速直觉，系统2缓慢理性。问题是——系统1太自信了，它以为自己用的是系统2。',
    satellites: [{ label: '快思慢想', offset: [0.45, 0.2, 0.35] }, { label: '前景理论', offset: [-0.4, -0.2, 0.4] }],
  },
  {
    id: 'charlie_munger', name: '芒格', title: '多元思维模型', emoji: '🧩',
    position: [9.5, 0.1, 4.6], district: 'cognition_decision', color: '#FF8C42', tier: 1,
    description: '伯克希尔副董事长，用100个思维模型来理解世界的投资大师',
    dialogue: '拿着锤子的人看什么都像钉子。你需要的不止一把锤子——你需要一个工具箱。心理学、物理学、生物学、历史——每个学科都给你一个看待问题的新角度。',
    satellites: [{ label: '穷查理宝典', offset: [0.5, 0.2, 0.4] }, { label: '多元模型', offset: [-0.4, -0.2, 0.35] }],
  },
  {
    id: 'nassim_taleb', name: '塔勒布', title: '黑天鹅之父', emoji: '🦢',
    position: [8.6, -0.1, 5.5], district: 'cognition_decision', color: '#DD6C22', tier: 1,
    description: '反脆弱——有些东西在混乱中变得更强大',
    dialogue: 'The Black Swan is not about predicting—it\'s about preparing. 风会熄灭蜡烛，却会让火越烧越旺。你要做火，不要做蜡烛。',
    satellites: [{ label: '黑天鹅', offset: [0.5, 0.2, 0.4] }, { label: '反脆弱', offset: [-0.4, -0.25, 0.35] }],
    tags: ['不确定性','风险哲学','概率思维'],
    highlights: ['《黑天鹅》定义极端事件','《反脆弱》：混乱中获益'],
  },
  {
    id: 'hofstadter', name: '侯世达', title: 'GEB作者', emoji: '🔄',
    position: [9.8, 0.0, 4.2], district: 'cognition_decision', color: '#EE8838', tier: 1,
    description: '哥德尔艾舍尔巴赫的奇书作者，探索意识和自指的边界',
    dialogue: 'I am a strange loop. 意识不是某种神秘的物质——它是符号系统在"回头看自己"时产生的幻觉。你之所以觉得"你"存在，是因为你的大脑正在模拟它自己。',
  },
  {
    id: 'steven_pinker', name: 'Steven Pinker', title: '认知科学家', emoji: '📊',
    position: [9.2, -0.2, 4.9], district: 'cognition_decision', color: '#FF7C32', tier: 1,
    description: '哈佛心理学教授，用数据和理性论证世界在变好',
    dialogue: 'We are living in the most peaceful, prosperous time in human history—but our news feeds tell us the opposite. Data beats anecdotes.',
  },
  {
    id: 'morgan_housel', name: 'Morgan Housel', title: '金钱心理学', emoji: '💰',
    position: [9.6, 0.1, 5.8], district: 'cognition_decision', color: '#CC6C22', tier: 1,
    description: '《金钱心理学》作者，用故事揭示理财背后的人性',
    dialogue: 'Financial success is not about what you know—it\'s about how you behave. Getting rich and staying rich are two completely different skills.',
  },
  {
    id: 'sam_harris', name: 'Sam Harris', title: '清醒思考', emoji: '🧘',
    position: [8.8, 0.2, 4.5], district: 'cognition_decision', color: '#FF9944', tier: 1,
    description: '神经科学家与冥想倡导者，理性与灵性的桥梁',
    dialogue: 'The self is an illusion. But it\'s a very useful illusion. The question is not whether to think—it\'s whether you\'re aware that you\'re thinking.',
  },
  {
    id: 'annie_duke', name: '安妮·杜克', title: '决策扑克手', emoji: '🃏',
    position: [9.3, -0.1, 5.0], district: 'cognition_decision', color: '#FF8844', tier: 1,
    description: '从世界扑克冠军到决策科学专家，用贝叶斯思维做决策',
    dialogue: 'A good decision can have a bad outcome. A bad decision can have a good outcome. Judge the process, not the result. That\'s the only thing you control.',
  },
  {
    id: 'herbert_simon', name: '赫伯特·西蒙', title: '有限理性', emoji: '🏆',
    position: [8.5, 0.0, 5.3], district: 'cognition_decision', color: '#EE7733', tier: 1,
    description: '诺贝尔经济学奖与图灵奖双料得主，有限理性与人工智能先驱',
    dialogue: 'You cannot be "fully rational"—you don\'t have infinite time or information. So you satisfice: you find a solution that\'s "good enough", not perfect. That\'s not a flaw—that\'s being human.',
  },
  {
    id: 'cialdini', name: '西奥迪尼', title: '影响力之父', emoji: '🎯',
    position: [8.9, 0.1, 4.3], district: 'cognition_decision', color: '#FF8040', tier: 1,
    description: '影响力六大原则的发现者，揭示了说服的科学',
    dialogue: '影响力不是操纵——是理解人类决策的捷径。互惠、承诺一致、社会认同、喜好、权威、稀缺——这六条原则在你没意识到的时候已经在影响你。',
  },
];

// ===== 3. 战略与博弈 (8人) =====
const STRATEGY_GAME = [
  {
    id: 'sunzi', name: '孙子', title: '兵法圣哲', emoji: '⚔️',
    position: [6.4, 0.2, 8.9], district: 'strategy_game', color: '#BB3333', tier: 1,
    description: '《孙子兵法》——2500年后仍是全球商学院的必读教材',
    dialogue: '兵者，诡道也。故能而示之不能，用而示之不用。知己知彼，百战不殆。知天知地，胜乃可全。',
    satellites: [{ label: '孙子兵法', offset: [0.5, 0.2, 0.4] }, { label: '知己知彼', offset: [-0.4, -0.2, 0.35] }],
  },
  {
    id: 'michael_porter', name: '迈克尔·波特', title: '竞争战略之父', emoji: '📈',
    position: [5.6, 0.1, 8.3], district: 'strategy_game', color: '#CC4444', tier: 1,
    description: '五力模型与价值链分析的创造者，定义了现代企业战略',
    dialogue: 'Strategy is about choosing what NOT to do. If there is no trade-off, there is no strategy. The essence of strategy is choosing a unique position.',
  },
  {
    id: 'clayton_christensen', name: '克里斯坦森', title: '颠覆式创新', emoji: '💥',
    position: [6.0, -0.1, 8.6], district: 'strategy_game', color: '#DD3333', tier: 1,
    description: '《创新者的窘境》作者，解释了为什么大公司会被小公司颠覆',
    dialogue: 'Good management was the most powerful reason they failed. They did everything right—listened to customers, invested in the best technology—and still lost.',
  },
  {
    id: 'peter_thiel', name: 'Peter Thiel', title: '从0到1', emoji: '🔮',
    position: [5.8, 0.0, 9.1], district: 'strategy_game', color: '#AA2222', tier: 1,
    description: 'PayPal黑帮教父，用逆向思维做投资和创业',
    dialogue: 'What important truth do very few people agree with you on? If your answer is something everyone believes, you\'re not thinking hard enough.',
  },
  {
    id: 'thomas_schelling', name: '托马斯·谢林', title: '博弈论大师', emoji: '🎮',
    position: [6.3, -0.2, 8.1], district: 'strategy_game', color: '#CC3333', tier: 1,
    description: '诺贝尔经济学奖得主，用博弈论解释冲突与合作',
    dialogue: 'The power to constrain an adversary may depend on the power to bind oneself. Sometimes the strongest move is to limit your own options.',
  },
  {
    id: 'john_boyd', name: 'John Boyd', title: 'OODA循环', emoji: '🔄',
    position: [5.5, 0.2, 8.8], district: 'strategy_game', color: '#BB4444', tier: 1,
    description: '战斗机飞行员出身的战略思想家，OODA循环的创造者',
    dialogue: 'Observe, Orient, Decide, Act—then do it again faster than your opponent. Speed of iteration beats perfection. The one who cycles OODA fastest controls the engagement.',
  },
  {
    id: 'schumpeter', name: '熊彼特', title: '创造性破坏', emoji: '🌪️',
    position: [6.1, 0.1, 8.4], district: 'strategy_game', color: '#CC2222', tier: 1,
    description: '经济学大师，创造性破坏理论的提出者',
    dialogue: 'Capitalism\'s engine is creative destruction. The old must be destroyed for the new to emerge. The entrepreneur is the agent of this destruction.',
  },
  {
    id: 'jim_collins', name: '吉姆·柯林斯', title: '基业长青', emoji: '🏛️',
    position: [5.7, -0.1, 8.0], district: 'strategy_game', color: '#DD4444', tier: 1,
    description: '《从优秀到卓越》《基业长青》作者，研究伟大公司的基因',
    dialogue: 'Good is the enemy of great. Most companies never become great precisely because they are quite good—and that\'s exactly their problem.',
  },
];

// ===== 4. 资本与周期 (8人) =====
const CAPITAL_CYCLE = [
  {
    id: 'shen_nanpeng', name: '沈南鹏', title: '红杉中国掌门', emoji: '🔴',
    position: [1.8, 0.2, 10.6], district: 'capital_cycle', color: '#C49510', tier: 1,
    description: '红杉中国创始人，中国最具影响力的投资人',
    dialogue: '投资看人、看赛道、看时机——三者缺一不可。但在中国，timing比美国重要得多。错过了窗口期，再好的团队也白搭。',
  },
  {
    id: 'marc_andreessen', name: 'Marc Andreessen', title: '软件吞噬世界', emoji: '🌐',
    position: [1.0, 0.1, 10.2], district: 'capital_cycle', color: '#D4A520', tier: 1,
    description: 'a16z联合创始人，从Netscape到Web3的连续洞见者',
    dialogue: 'Software is eating the world. Every company will become a software company. AI is the next wave—and it will eat software.',
  },
  {
    id: 'naval_ravikant', name: 'Naval Ravikant', title: '财富哲学', emoji: '🧘',
    position: [0.8, -0.1, 10.8], district: 'capital_cycle', color: '#C4A010', tier: 1,
    description: 'AngelList创始人，硅谷最深刻的财富和幸福哲学家',
    dialogue: 'Seek wealth, not money. Wealth is assets that earn while you sleep. Code and media are the new leverage—you can create them once and sell them forever.',
  },
  {
    id: 'ray_dalio', name: 'Ray Dalio', title: '原则作者', emoji: '🌊',
    position: [1.3, 0.0, 10.0], district: 'capital_cycle', color: '#E4B530', tier: 1,
    description: '桥水基金创始人，用宏观经济周期理解世界的对冲大师',
    dialogue: 'The economy is like a machine. Understand the machine, and you can predict its movements. Pain + Reflection = Progress.',
  },
  {
    id: 'balaji_srinivasan', name: 'Balaji', title: '网络国家', emoji: '🗺️',
    position: [1.0, 0.3, 10.4], district: 'capital_cycle', color: '#B49010', tier: 1,
    description: '前Coinbase CTO，《网络国家》作者，区块链与去中心化的布道者',
    dialogue: 'The nation-state is a software problem. We can fork countries like we fork code. The network state is the next form of human organization.',
  },
  {
    id: 'bill_gurley', name: 'Bill Gurley', title: '独角兽猎人', emoji: '🦄',
    position: [1.6, -0.1, 10.1], district: 'capital_cycle', color: '#D4B020', tier: 1,
    description: 'Benchmark合伙人，投资了Uber、Zillow、Grubhub的早期捕获者',
    dialogue: 'Great markets make great companies. A great team in a terrible market will still fail. Find the tailwind.',
  },
  {
    id: 'vinod_khosla', name: 'Vinod Khosla', title: '技术极端派', emoji: '🔧',
    position: [0.6, 0.1, 10.5], district: 'capital_cycle', color: '#C4A515', tier: 1,
    description: 'Khosla Ventures创始人，用极端技术主义做投资',
    dialogue: 'Most people overestimate what can be done in 2 years and underestimate what can be done in 10. I invest in what seems impossible today.',
  },
  {
    id: 'fang_aizhi', name: '方爱之', title: '真格CEO', emoji: '🌟',
    position: [1.5, 0.0, 10.3], district: 'capital_cycle', color: '#E4C040', tier: 1,
    description: '真格基金CEO，中国早期投资的女掌门',
    dialogue: '投人，不投项目。早期创业最稀缺的不是钱、不是idea——是能把事情做出来的那个人。',
  },
];

// ===== 5. 复杂系统 (8人) =====
const COMPLEX_SYSTEMS = [
  {
    id: 'geoffrey_west', name: 'Geoffrey West', title: '规模法则', emoji: '📏',
    position: [-3.3, 0.2, 10.0], district: 'complex_systems', color: '#33AA77', tier: 1,
    description: '生物、城市、公司——一切生命系统都遵循同一个幂律',
    dialogue: '城市比生物体更令人惊讶——你放大一个城市到两倍规模，每个人的收入和创意产出会增长15%。城市是永不停止的引擎。',
  },
  {
    id: 'stuart_kauffman', name: 'Stuart Kauffman', title: '自组织临界', emoji: '🧬',
    position: [-3.8, 0.0, 9.5], district: 'complex_systems', color: '#44BB88', tier: 1,
    description: '圣塔菲研究所元老，秩序出于混沌的自组织理论先驱',
    dialogue: 'Life is not an accident—it\'s an expected emergent property of complex chemical systems. Order arises for free.',
  },
  {
    id: 'kevin_kelly', name: 'Kevin Kelly', title: '失控作者', emoji: '🌐',
    position: [-4.1, 0.1, 10.3], district: 'complex_systems', color: '#22AA66', tier: 1,
    description: '失控、科技想要什么、必然——互联网时代的三大预言',
    dialogue: '科技不是人类发明的工具——它是有自己意志的第七界生命。蜂群、神经网络、全球经济——同一种涌现逻辑在起作用。',
    satellites: [{ label: '失控', offset: [0.45, 0.2, 0.35] }, { label: '必然', offset: [-0.4, -0.25, 0.4] }],
    tags: ['科技哲学','涌现理论','Wired杂志'],
  },
  {
    id: 'donella_meadows', name: 'Donella Meadows', title: '系统思考', emoji: '🔄',
    position: [-3.5, -0.1, 9.7], district: 'complex_systems', color: '#55CC99', tier: 1,
    description: '《增长的极限》作者，系统动力学与杠杆点理论的奠基人',
    dialogue: 'The most effective leverage point in any system is to change its paradigm. Don\'t fix the problem—change how people think about the problem.',
  },
  {
    id: 'stephen_wolfram', name: 'Stephen Wolfram', title: '计算宇宙', emoji: '⚛️',
    position: [-3.0, 0.2, 10.1], district: 'complex_systems', color: '#33BB77', tier: 1,
    description: 'Mathematica/Wolfram Alpha创始人，用计算规则解释宇宙',
    dialogue: 'The universe is a computation. Simple rules create immense complexity. Rule 30 proves that determinism and unpredictability can coexist.',
  },
  {
    id: 'john_holland', name: 'John Holland', title: '遗传算法之父', emoji: '🧬',
    position: [-4.3, -0.2, 9.9], district: 'complex_systems', color: '#44BB77', tier: 1,
    description: '遗传算法和分类器系统的发明者，复杂适应系统理论的奠基人',
    dialogue: 'Innovation is not designed—it emerges from variation, selection, and recombination. The same algorithm drives evolution, markets, and ideas.',
  },
  {
    id: 'duncan_watts', name: 'Duncan Watts', title: '六度分隔', emoji: '🕸️',
    position: [-3.7, 0.1, 9.3], district: 'complex_systems', color: '#66DD99', tier: 1,
    description: '六度分隔理论的实验验证者和网络科学先驱',
    dialogue: 'Everything is obvious once you know the answer. The problem is that we don\'t know which answer is right until after the fact.',
  },
  {
    id: 'barabasi', name: 'Barabási', title: '无标度网络', emoji: '📡',
    position: [-4.0, 0.0, 10.5], district: 'complex_systems', color: '#33AA88', tier: 1,
    description: '网络科学之父，无标度网络和优先连接的发现者',
    dialogue: 'Networks are not random—they follow power laws. The rich get richer. A few hubs dominate everything. That\'s not unfair—that\'s physics.',
  },
];

// ===== 6. 网络与平台 (8人) =====
const NETWORK_PLATFORM = [
  {
    id: 'tim_berners_lee', name: 'Tim Berners-Lee', title: '万维网之父', emoji: '🕸️',
    position: [-7.5, 0.2, 7.3], district: 'network_platform', color: '#7755BB', tier: 1,
    description: '发明了WWW却放弃了专利的人，Solid协议推动数据主权',
    dialogue: 'This is for everyone. 我发明Web的时候，没想过它会被用来贩卖隐私。互联网的初心是连接——不是操控。',
  },
  {
    id: 'vitalik_buterin', name: 'Vitalik Buterin', title: '以太坊创始人', emoji: '💎',
    position: [-8.2, 0.1, 6.7], district: 'network_platform', color: '#8866CC', tier: 1,
    description: '以太坊创始人，用智能合约重新定义了互联网的信任层',
    dialogue: 'Blockchain is not about money—it\'s about coordination. We\'re building the infrastructure for a new kind of human cooperation.',
  },
  {
    id: 'satoshi_nakamoto', name: 'Satoshi Nakamoto', title: '比特币创造者', emoji: '🪙',
    position: [-7.8, -0.1, 7.0], district: 'network_platform', color: '#9966CC', tier: 1,
    description: '比特币白皮书作者，用去中心化共识解决了双花问题',
    dialogue: 'A purely peer-to-peer version of electronic cash would allow online payments to be sent directly from one party to another.',
  },
  {
    id: 'reid_hoffman', name: 'Reid Hoffman', title: 'LinkedIn创始人', emoji: '🔗',
    position: [-8.0, 0.2, 6.4], district: 'network_platform', color: '#7755AA', tier: 1,
    description: 'LinkedIn联合创始人，PayPal黑帮成员，网络效应理论实践者',
    dialogue: 'The fastest way to change yourself is to hang out with people who are already the way you want to be. Your network is your destiny.',
  },
  {
    id: 'benedict_evans', name: 'Benedict Evans', title: '科技分析师', emoji: '📊',
    position: [-7.3, 0.0, 7.5], district: 'network_platform', color: '#9977CC', tier: 1,
    description: 'a16z前合伙人，用年度报告描绘科技趋势的最佳观察者',
    dialogue: 'Mobile is eating the world, but AI is eating mobile. Every new platform starts looking like a toy, and then it changes everything.',
  },
  {
    id: 'clay_shirky', name: 'Clay Shirky', title: '人人时代', emoji: '👥',
    position: [-8.4, -0.2, 6.9], district: 'network_platform', color: '#8866BB', tier: 1,
    description: '《人人时代》作者，认知盈余和群体协作的理论家',
    dialogue: 'The internet is the first medium in history that has native support for groups. The real revolution is not about information—it\'s about coordination.',
  },
  {
    id: 'wang_jianshuo', name: '王建硕', title: '百姓网创始人', emoji: '🏠',
    position: [-7.6, 0.1, 7.7], district: 'network_platform', color: '#7755CC', tier: 1,
    description: '百姓网创始人，中国分类信息先驱，从互联网泡沫存活至今',
    dialogue: '互联网没有秘密。所有商业模式最终都会透明。护城河不是信息不对称——是你比别人更了解用户。',
  },
  {
    id: 'lan_xi', name: '阑夕', title: '科技评论家', emoji: '✍️',
    position: [-8.1, -0.1, 7.2], district: 'network_platform', color: '#9977DD', tier: 1,
    description: '知名科技自媒体，用深度长文剖解互联网公司战略',
    dialogue: '大多数科技评论都在追逐热点——但真正有价值的分析是找到热点背后的那个"不变"的东西。',
  },
];

// ===== 7. 产品与设计 (6人) =====
const PRODUCT_DESIGN = [
  {
    id: 'dieter_rams', name: 'Dieter Rams', title: '十大设计原则', emoji: '📻',
    position: [-10.5, 0.2, 2.8], district: 'product_design', color: '#EE5599', tier: 1,
    description: '博朗传奇设计师，Less but better——影响了苹果的一切',
    dialogue: 'Good design is as little design as possible. 好的设计就像好的仆人——它帮你把事情做完，然后安静地退到背景里。',
  },
  {
    id: 'zhang_xiaolong', name: '张小龙', title: '微信之父', emoji: '💬',
    position: [-9.8, 0.1, 2.3], district: 'product_design', color: '#FF66AA', tier: 1,
    description: '从Foxmail到微信，用极简哲学定义了十亿人的数字生活',
    dialogue: '好的产品是让用户用完即走——不是不想让他们多待，而是你帮他们高效地完成了事情。善良比聪明更重要。',
  },
  {
    id: 'don_norman', name: 'Don Norman', title: '设计心理学', emoji: '🚪',
    position: [-10.2, -0.1, 2.0], district: 'product_design', color: '#DD4488', tier: 1,
    description: '《设计心理学》作者，先用后思的用户体验教父',
    dialogue: 'If you need a sign to explain how a door works, the door is badly designed. Good design makes the right action obvious.',
  },
  {
    id: 'jony_ive', name: 'Jony Ive', title: '苹果设计灵魂', emoji: '🍎',
    position: [-10.0, 0.0, 2.5], district: 'product_design', color: '#FF5588', tier: 1,
    description: 'iMac、iPhone、Apple Park——让科技变得有温度',
    dialogue: 'We don\'t design products—we design experiences. A product\'s most successful moment is when the user forgets it exists.',
  },
  {
    id: 'bret_victor', name: 'Bret Victor', title: '交互魔法师', emoji: '✨',
    position: [-9.6, 0.2, 2.7], district: 'product_design', color: '#EE6699', tier: 1,
    description: 'Dynamicland创始人，创造了最激进的编程和交互范式',
    dialogue: 'The most important thing about a tool is not what it does—it\'s what it lets you think about. We need tools that let us see what we\'re doing.',
  },
  {
    id: 'hara_kenya', name: '原研哉', title: 'MUJI艺术总监', emoji: '🪷',
    position: [-9.9, -0.2, 2.9], district: 'product_design', color: '#DD5599', tier: 1,
    description: '无印良品艺术总监，把禅意美学注入日常生活',
    dialogue: '设计不是创造"新东西"——是发现"本来就在那里的东西"。空（Emptiness）不是什么都没有，是充满了可能性。',
  },
];

// ===== 8. 中国当代力量 (13人) =====
const CHINA_CONTEMPORARY = [
  {
    id: 'lei_jun', name: '雷军', title: '小米/造车', emoji: '📱',
    position: [-10.8, 0.3, -1.8], district: 'china_contemporary', color: '#CC2222', tier: 1,
    description: '小米创始人，从手机到造车，用极致性价比改变中国制造业',
    dialogue: 'Are you OK? 站在风口上，猪都能飞起来。但风停了之后，只有长翅膀的才能继续飞。小米从手机到汽车，不是在追风口——是在长出翅膀。',
  },
  {
    id: 'zhang_yiming', name: '张一鸣', title: '算法/全球化', emoji: '🎯',
    position: [-10.3, 0.1, -2.2], district: 'china_contemporary', color: '#DD3333', tier: 1,
    description: '字节跳动创始人，用推荐算法重塑了全球内容分发',
    dialogue: '延迟满足感。最有价值的东西往往需要最长时间来建设。不着急，先把基础打好。',
  },
  {
    id: 'ma_huateng', name: '马化腾', title: '腾讯AI', emoji: '🐧',
    position: [-9.6, 0.0, -2.0], district: 'china_contemporary', color: '#BB2222', tier: 1,
    description: '腾讯创始人，从QQ到微信再到AI大模型，持续穿越周期',
    dialogue: '巨人倒下的时候，身上还是热的。互联网行业没有永远的安全感——只有永远的战战兢兢。',
  },
  {
    id: 'wang_xing', name: '王兴', title: '美团/无限游戏', emoji: '🍚',
    position: [-10.1, -0.1, -2.8], district: 'china_contemporary', color: '#EE3333', tier: 1,
    description: '美团创始人，从千团大战杀出的无限游戏玩家',
    dialogue: '大多数人为了逃避真正的思考，愿意做任何事。创业不是有限游戏——是无限游戏。活下来的目的不是赢，是继续玩。',
  },
  {
    id: 'huang_zheng', name: '黄峥', title: 'Temu/供应链', emoji: '📦',
    position: [-9.8, 0.2, -3.0], district: 'china_contemporary', color: '#CC3333', tier: 1,
    description: '拼多多创始人，用社交裂变和极致低价改变了电商格局',
    dialogue: '下沉市场不是"低端市场"——是用更聪明的方式服务更多人。拼多多的本质是：把广告费省下来返给消费者。',
  },
  {
    id: 'wang_chuanfu', name: '王传福', title: '比亚迪/新能源', emoji: '🔋',
    position: [-10.5, 0.0, -2.5], district: 'china_contemporary', color: '#DD2222', tier: 1,
    description: '比亚迪创始人，从电池到电动车，中国新能源的旗手',
    dialogue: '中国不缺技术，不缺人才——缺的是把技术和人才组织起来做成产品的信心。BYD证明了"中国制造"可以是世界第一。',
  },
  {
    id: 'zhihui_jun', name: '稚晖君', title: '智元机器人', emoji: '🤖',
    position: [-9.4, 0.1, -1.6], district: 'china_contemporary', color: '#EE4444', tier: 1,
    description: '彭志辉，"野生钢铁侠"，从华为天才少年到智元机器人创始人',
    dialogue: '我不觉得自己是天才——我只是比别人花了更多时间做自己真正喜欢的事。兴趣是最好的老师，也是最持久的燃料。',
  },
  {
    id: 'yang_zhilin', name: '杨植麟', title: '月之暗面Kimi', emoji: '🌙',
    position: [-10.6, -0.2, -1.4], district: 'china_contemporary', color: '#CC1111', tier: 1,
    description: '月之暗面创始人，Kimi大模型估值200亿，清华系AI新星',
    dialogue: '长上下文不是技术噱头——是让AI真正理解用户意图的基础。Kimi能读20万字的小说，不是因为参数多，是因为架构对了。',
  },
  {
    id: 'wang_xingxing', name: '王兴兴', title: '宇树科技', emoji: '🦿',
    position: [-9.7, -0.1, -1.2], district: 'china_contemporary', color: '#DD4444', tier: 1,
    description: '宇树科技创始人，人形机器人IPO，中国版波士顿动力',
    dialogue: '机器人不是实验室里的玩具——是未来十年最大的产业机会之一。当人形机器人的成本降到一辆车的价格，世界就会改变。',
  },
  {
    id: 'yu_hao', name: '俞浩', title: '追觅科技', emoji: '🌪️',
    position: [-9.3, 0.2, -2.4], district: 'china_contemporary', color: '#EE2222', tier: 1,
    description: '追觅科技创始人，全球清洁机器人第一，跨界造车',
    dialogue: '全世界最优秀的工程师在中国。追觅的目标不是做"中国版戴森"——是让戴森的用户转过来用追觅。',
  },
  {
    id: 'yan_junjie', name: '闫俊杰', title: 'MiniMax', emoji: '🎙️',
    position: [-10.2, -0.1, -3.2], district: 'china_contemporary', color: '#CC4444', tier: 1,
    description: 'MiniMax创始人，港股上市估值3000亿，语音AI第一股',
    dialogue: '语音是人类最自然的交互方式。当AI能像人一样流畅对话，所有的APP交互方式都会被重写。',
  },
  {
    id: 'zhang_peng', name: '张鹏', title: '智谱AI', emoji: '🏛️',
    position: [-9.5, 0.0, -3.4], district: 'china_contemporary', color: '#DD1111', tier: 1,
    description: '智谱AI CEO，清华系AI上市公司，GLM大模型体系',
    dialogue: '中国AI不能只做"追随者"——要有自己的基础模型。GLM的路线和GPT不同，但我们有信心走出一条独立的技术路径。',
  },
  {
    id: 'jiang_daxin', name: '姜大昕', title: '阶跃星辰', emoji: '⭐',
    position: [-10.4, 0.1, -3.0], district: 'china_contemporary', color: '#EE3333', tier: 1,
    description: '阶跃星辰创始人，前微软亚洲研究院副院长',
    dialogue: '从微软到创业，大模型赛道才刚刚开始。Step-2证明了中国团队在推理能力上可以做得不比任何人差。',
  },
];

// ===== 9. 思想源流 (10人) =====
const THOUGHT_SOURCE = [
  {
    id: 'zhuangzi', name: '庄子', title: '逍遥哲人', emoji: '🦋',
    position: [-8.5, 0.3, -7.0], district: 'thought_source', color: '#8899BB', tier: 1,
    description: '梦蝶的哲人，齐物论逍遥游，以寓言解构一切确定性',
    dialogue: '子非鱼，安知鱼之乐？子非我，安知我不知鱼之乐？天地与我并生，万物与我为一。北冥之鱼化为鹏鸟——不是换了物种，是本来的形状找到了更大的空间。',
    satellites: [{ label: '逍遥游', offset: [0.5, 0.3, 0.35] }, { label: '齐物论', offset: [-0.4, 0.15, 0.4] }, { label: '庄周梦蝶', offset: [0.1, -0.35, 0.45] }],
    tags: ['道家','相对主义','寓言哲学'],
    highlights: ['道家第二人','寓言解构大师','中国最早的反内卷先驱'],
    // ===== 深度档案 =====
    bio: [
      '庄子（约公元前369年—前286年），名周，字子休，战国时期宋国蒙地（今河南商丘）人。与梁惠王、齐宣王同时代，约比孟子小三岁。他可能是中国历史上最不情愿当官的天才——楚威王曾派使者带重金请他出任宰相，他正在濮水边钓鱼，头都不回地拒绝了。',
      '他做过宋国蒙地的「漆园吏」——一个管理漆树园的小官，收入微薄。史书记载他穷到要靠打草鞋补贴家用，去见魏王时穿着打补丁的衣服，连鞋带都是断了重系的。但他在物质上极度贫乏的同时，精神世界却无比丰盈——他用想象力弥补了现实中没有的一切。',
      '庄子最独特的地方在于：他不写论文，不立系统，他写寓言。他用蝴蝶、鹏鸟、大樗树、庖丁解牛、匠石运斤……这些画面来传达思想。因为真正的智慧是活的、流动的，一旦凝固成教条就死了。他是中国历史上第一位彻底拒绝「说教」的思想者——他只给你看画面，让你自己去悟。',
      '他与惠施（名家逻辑学家）的友谊是中国哲学史上最精彩的「相爱相杀」。两人在濠水桥上辩论「子非鱼安知鱼之乐」，在哲学立场上针锋相对，但惠施死后，庄子路过他的墓，感叹「自夫子之死也，吾无以为质矣」——没有了这个对手，我的才华再也找不到镜子了。',
      '《庄子》一书现存三十三篇（内篇七、外篇十五、杂篇十一），学界普遍认为内篇为庄子本人所作，外杂篇为后学门人补充。但无论哪一篇，都共享同一种气质：用最锋利的想象力，解构人类对确定性的执念，指向一种彻底自由的心智状态——逍遥。'
    ],
    timeline: [
      { year: '约前369', event: '出生于宋国蒙地（今河南商丘），与梁惠王、齐宣王同时代' },
      { year: '约前350', event: '担任宋国漆园吏——管理漆树园的小官，一生清贫' },
      { year: '约前340', event: '与惠施相识，开启中国哲学史上最精彩的辩论友谊' },
      { year: '约前330', event: '楚威王遣使持重金聘其为相，庄子在濮水钓鱼时拒绝：「宁做泥中龟」' },
      { year: '约前320', event: '与惠施在濠梁之上辩论「鱼之乐」——中国认识论经典一幕' },
      { year: '约前310', event: '惠施去世，庄子感叹「吾无以为质矣」——失去唯一的思想对手' },
      { year: '约前286', event: '约卒于此年，留下《庄子》一书，成为道家与玄学的核心经典' },
      { year: '魏晋', event: '《庄子》与《老子》《周易》并称「三玄」，玄学大兴' },
      { year: '唐宋', event: '李白「我本楚狂人」、苏轼「庄周梦蝶」——庄子的审美渗透了整个中国诗学' },
      { year: '现代', event: '被重新发现为「反内卷先驱」「东方存在主义」——在焦虑时代反而更被需要' }
    ],
    philosophy: [
      {
        title: '逍遥游 = 拒绝被任何尺度定义',
        text: '大鹏扶摇直上九万里，蜩与学鸠笑之。庄子不是说「大鹏比麻雀好」——他在说：每一种生命都有自己的尺度，真正的自由不是变得更大更强，而是彻底从别人的尺度里松绑。逍遥 = 不再被任何外部坐标系定义自己。'
      },
      {
        title: '齐物论 = 没有绝对的对，只有不同的视角',
        text: '「是亦彼也，彼亦是也。」你以为的对，换个视角就是错。庄子不是相对主义（什么都无所谓），而是彻底拒绝用单一标准切割世界。他的武器是寓言：一只蝴蝶、一棵歪脖子树，就能击碎所有自以为是的「正确」。'
      },
      {
        title: '无用之用 = 被功利淘汰的东西反而最自由',
        text: '匠人看到一棵歪脖子樗树，嫌弃它「无用」不能做家具。庄子说：正因为它无用，才没有被砍伐，长成了参天大树——「无用之用，方为大用」。当代人对「有用」的执念，恰恰是焦虑的根源。有些生命的价值，正在于它经不起任何功利计算。'
      },
      {
        title: '庖丁解牛 = 技巧到极致就是「道」',
        text: '庖丁杀牛十九年，刀刃还像新的——因为他不再用眼睛看，而是用神遇，顺着牛骨骼的天然缝隙下刀。庄子用这个故事说：任何技艺做到极致，就会从「技」进入「道」——不再对抗现实的结构，而是与结构的纹理合一。这就是「心斋」「坐忘」的日常版本。'
      }
    ],
    quotes: [
      { text: '北冥有鱼，其名为鲲。鲲之大，不知其几千里也。化而为鸟，其名为鹏。', context: '《逍遥游》开篇——中国文学史上最恢弘的想象力起点' },
      { text: '子非鱼，安知鱼之乐？', context: '《秋水》濠梁之辩——与惠施的认识论交锋' },
      { text: '天地与我并生，万物与我为一。', context: '《齐物论》——消解主客对立的终极宣言' },
      { text: '巧者劳而知者忧，无能者无所求。', context: '《列御寇》——对「聪明人」焦虑的精准诊断' },
      { text: '人生天地之间，若白驹之过隙，忽然而已。', context: '《知北游》——对时间流逝的画面式哲学' }
    ],
    works: [
      { name: '《逍遥游》', type: '内篇', year: '约前350', note: '鹏鸟与蜩鸠——「逍遥」概念的源头，中国哲学最壮丽的开篇' },
      { name: '《齐物论》', type: '内篇', year: '约前340', note: '天籁地籁人籁——彻底解构「对错」的绝对性，东方相对主义奠基' },
      { name: '《养生主》', type: '内篇', year: '约前340', note: '庖丁解牛——「技进乎道」的经典寓言，影响所有后世技艺哲学' },
      { name: '《大宗师》', type: '内篇', year: '约前340', note: '坐忘、心斋——庄子修行论的核心，禅宗「无念」的远祖' },
      { name: '《秋水》', type: '外篇', year: '约前330', note: '河伯与海若、濠梁之辩——「视角决定真相」的故事化呈现' },
      { name: '《至乐》', type: '外篇', year: '约前320', note: '庄子妻死鼓盆而歌——对死亡最彻底的非悲伤态度' }
    ],
    legacy: '庄子是中国思想史上最叛逆、最自由、最不可被任何体系收编的声音。他不建学派、不收门徒、不写论文——他只写寓言。但两千年后，李白从他那里学会了狂，苏轼从他那里学会了达观，禅宗从他那里学会了「不立文字」。在功利主义和绩效焦虑主导的当代，庄子反而比两千年前更被需要：他是那个在所有人忙着「变得更优秀」时，轻声问一句「你确定那个尺度是你自己的吗？」的人。逍遥不是一个终点，而是一种彻底的松绑——从所有别人给你设定的坐标系里，松开。',
    // ===== 哲思情报时间线（逍遥哲思炼金蝶 🦋 生成） =====
    analysisHistory: [
      {
        date: '2026-06-14',
        trigger: '演示：用「逍遥哲思炼金蝶 🦋」对庄子进行哲思炼金分析',
        markdown: `# 🦋 庄子 哲思炼金

**炼金师：** 逍遥哲思炼金蝶
**对象：** 逍遥哲人 · 用寓言解构一切确定性的反内卷先驱
**原初画面：** 一只蝴蝶在梦里变成了庄子——或者庄子在梦里变成了一只蝴蝶。

---

## 一句话解药

**你焦虑，不是因为做得不够多，而是因为你还在用别人的尺子量自己——松开那把尺子，就是逍遥。**

---

## 🔮 四层炼金

### 寓言层：最初的画面

**原始画面：**
> 庄周梦为蝴蝶，栩栩然蝶也。俄然觉，则蘧蘧然周也。不知周之梦为蝶，还是蝶之梦为周。

**他真正想说的事：**
你以为「真实的你」和「理想中的你」是两个人——其实它们从来没有分开过。你现在以为的「清醒」，可能只是另一个梦。

---

### 哲思层：背后的世界观

**他的镜片：**
没有哪个视角是「上帝视角」——所有的「对」都建立在某个特定的尺度上。你以为的客观，只是你的执着。

**核心概念翻译：**
| 概念 | 教科书没说的真相 |
| --- | --- |
| 逍遥 | 不是「变得自由」，而是「松绑」——从别人的尺度里退出，不是逃避，是不再认领 |
| 齐物 | 不是「万物平等」的正确废话——是「你的对和别人的对没有谁更高」，彻底拒绝用单一标准切割世界 |
| 无用之用 | 被功利淘汰的东西反而最自由——如果你不能被「使用」，就没有人能消耗你 |
| 心斋坐忘 | 不是冥想，是清空——把脑子里所有别人的声音倒掉，剩下的才是你 |

**这副药专治：**
人类最深的病——控制欲。我们拼命想抓住确定性、抓住意义、抓住「我是谁」——庄子说，松手的那一刻，才是真正的自己。

---

### 当代层：今天哪里还在犯

**当代场景：**
你刷完一个小时社交媒体，关掉手机，突然觉得「自己什么都不行」——别人去了你没去过的地方，挣了你没挣到的数字，活成了你没活成的样子。

**认知陷阱：**
你在用别人精心剪辑过的「高光三秒」，丈量自己完整而琐碎的一整天。这句话一出口就证明病了：「为什么别人都……」——但「别人」从来不是一个真实的人，它是一个你亲手拼接的恐怖镜像。

---

### 解放层：那扇门在这里

**心智动作：**
下次当你又想拿自己和别人比时——先问一句：「这把尺子是谁的？」如果是别人塞给你的，你可以选择不量。逍遥不是「我比你好」，而是「我不在这个坐标系里」。

**解药短语：**
> 那把尺子不是你的——你可以不量。

**穿越私房话：**
（庄子拍拍你的肩）「鱼在水里是快乐的，你不在水里，所以你不知道。你非要把自己拖上岸，去和所有不在水里的人比谁爬得更快——你忘了，你本来就是鱼。」

---

## 💎 遗产与边界

**留给后世的真正遗产：** 不是「道家哲学」，而是「一种永久生效的松绑工具」——每当人类被自己的执念卡死时，翻开《庄子》任何一页，都能找到一个画面把你从那个死结里拽出来。两千年来，每一个在体制里窒息的中国文人，最后都靠庄子活了下来。

**这套哲学的局限/代价：** 庄子的药方需要你有一定的物质底气——一个连饭都吃不饱的人很难「逍遥」。更深层的问题是：彻底松绑可能滑向虚无——如果一切尺度都无效，那「什么都不做」和「做什么都行」之间的界限在哪里？庄子没有给出答案，他只负责击碎你的确定性。剩下的路，你要自己走。

---

*炼金完成时间：2026-06-14 20:30*`,
      },
    ],
  },
  {
    id: 'wangyangming', name: '王阳明', title: '心学宗师', emoji: '❤️',
    position: [-7.5, 0.2, -7.3], district: 'thought_source', color: '#99AACC', tier: 1,
    description: '知行合一的心学大家，龙场悟道，致良知',
    dialogue: '你未看此花时，此花与汝心同归于寂。你来看此花时，则此花颜色一时明白起来。致良知——在所有人的声音中找到自己内心的那个锚。',
    satellites: [{ label: '传习录', offset: [0.5, 0.2, 0.4] }, { label: '致良知', offset: [-0.4, -0.25, 0.35] }],
    tags: ['心学','儒家','知行合一'],
  },
  {
    id: 'huineng', name: '慧能', title: '禅宗六祖', emoji: '🌸',
    position: [-8.2, -0.1, -6.6], district: 'thought_source', color: '#AABBCC', tier: 1,
    description: '不识字却能直指人心，菩提本无树的顿悟者',
    dialogue: '不是风动，不是幡动，仁者心动。本来无一物，何处惹尘埃？禅不在文字中，在你此刻的呼吸里。',
  },
  {
    id: 'laozi', name: '老子', title: '道法自然', emoji: '☯️',
    position: [-7.8, 0.1, -7.5], district: 'thought_source', color: '#8899AA', tier: 1,
    description: '《道德经》作者，道家创始人，上善若水的智慧',
    dialogue: '道可道，非常道。名可名，非常名。无为而无不为。天下莫柔弱于水，而攻坚强者莫之能胜。',
    satellites: [{ label: '道德经', offset: [0.4, 0.2, 0.35] }, { label: '无为', offset: [-0.35, -0.2, 0.4] }],
  },
  {
    id: 'hanfeizi', name: '韩非子', title: '法家集大成', emoji: '⚖️',
    position: [-7.3, -0.2, -6.9], district: 'thought_source', color: '#7788AA', tier: 1,
    description: '法家思想的集大成者，以制度和法治替代人治',
    dialogue: '国无常强，无常弱。奉法者强则国强，奉法者弱则国弱。治国不是靠道德感化——是靠制度设计让人作恶的代价大于作恶的收益。',
  },
  {
    id: 'deleuze', name: '德勒兹', title: '块茎哲学家', emoji: '🌿',
    position: [-8.0, 0.0, -6.3], district: 'thought_source', color: '#AABBCC', tier: 1,
    description: '差异与重复的织网者，根茎、褶皱、无器官身体',
    dialogue: '不要问我"是什么"，要问我"能做什么"。块茎没有根，没有主干，地下无限蔓延。你的问题不是"该选择什么"——是"如何让一切同时生长"。',
    satellites: [{ label: '千高原', offset: [0.55, 0.2, 0.4] }, { label: '块茎', offset: [-0.5, -0.25, 0.35] }],
    tags: ['后结构主义','块茎哲学','游牧思想'],
  },
  {
    id: 'nietzsche', name: '尼采', title: '超人哲学', emoji: '⚡',
    position: [-7.1, 0.1, -7.2], district: 'thought_source', color: '#8899CC', tier: 1,
    description: '上帝已死的宣告者，权力意志和超人哲学的创始人',
    dialogue: 'He who has a why to live can bear almost any how. What doesn\'t kill me makes me stronger. Become who you are.',
  },
  {
    id: 'marcus_aurelius', name: '马可·奥勒留', title: '哲人王', emoji: '🏛️',
    position: [-8.3, -0.1, -7.7], district: 'thought_source', color: '#99AAAA', tier: 1,
    description: '罗马皇帝，《沉思录》作者，斯多葛学派最后的伟大代表',
    dialogue: 'You have power over your mind—not outside events. Realize this, and you will find strength. 困扰你的不是事情本身，是你对事情的判断。',
  },
  {
    id: 'foucault', name: '福柯', title: '知识考古学家', emoji: '🔍',
    position: [-7.6, 0.2, -7.9], district: 'thought_source', color: '#7788BB', tier: 1,
    description: '规训与惩罚、知识即权力的凝视者',
    dialogue: '知识不是纯洁的——它是权力的产物，又反过来生产权力。你以为你在学习真理？你只是在学习一种被允许的说话方式。',
  },
  {
    id: 'wittgenstein', name: '维特根斯坦', title: '语言边界', emoji: '📐',
    position: [-7.9, -0.2, -6.1], district: 'thought_source', color: '#AAAACC', tier: 1,
    description: '语言的界限就是世界的界限——20世纪最深刻的哲学家之一',
    dialogue: 'Whereof one cannot speak, thereof one must be silent. 能说清楚的，就说清楚。说不清楚的，就闭嘴。哲学的任务是澄清语言——其余的都是诗。',
  },
];

// ===== 10. AI叙事场 (10人) =====
const AI_NARRATIVE = [
  {
    id: 'lex_fridman', name: 'Lex Fridman', title: 'AI对话者', emoji: '🎙️',
    position: [-3.3, 0.2, -9.6], district: 'ai_narrative', color: '#3399CC', tier: 1,
    description: 'MIT研究员，用深度访谈连接AI、哲学和人类的播客之王',
    dialogue: 'The best conversations happen when you truly listen. My goal is not to win debates—it\'s to understand how brilliant minds think.',
  },
  {
    id: 'rowan_cheung', name: 'Rowan Cheung', title: 'AI日报', emoji: '📰',
    position: [-4.0, 0.1, -10.1], district: 'ai_narrative', color: '#44AADD', tier: 1,
    description: 'The Rundown AI创始人，每天200万读者获取AI新闻',
    dialogue: 'AI is moving so fast that most people can\'t keep up. My job is to filter the noise and give you what actually matters—every single day.',
  },
  {
    id: 'soumith_chintala', name: 'Soumith Chintala', title: 'PyTorch之父', emoji: '🔥',
    position: [-3.0, 0.0, -9.8], district: 'ai_narrative', color: '#2288BB', tier: 1,
    description: 'PyTorch联合创始人，开源改变了全球AI研究的基础设施',
    dialogue: 'PyTorch wasn\'t designed to win—it was designed to be the tool researchers actually wanted to use. Flexibility beats dogma.',
  },
  {
    id: 'gary_marcus', name: 'Gary Marcus', title: 'AI怀疑论者', emoji: '🧐',
    position: [-4.2, -0.1, -9.5], district: 'ai_narrative', color: '#55AADD', tier: 1,
    description: '认知科学家，对深度学习范式最理性的批判者',
    dialogue: 'Deep learning is not enough. We need hybrid systems that combine pattern recognition with symbolic reasoning. LLMs are impressive—but they don\'t truly understand.',
  },
  {
    id: 'lilian_weng', name: 'Lilian Weng', title: 'OpenAI安全', emoji: '🛡️',
    position: [-3.5, 0.2, -10.3], district: 'ai_narrative', color: '#3399DD', tier: 1,
    description: 'OpenAI安全系统负责人，最好的AI技术博客作者之一',
    dialogue: 'RLHF is not just a technical trick—it\'s a philosophical stance. We\'re not just building AI; we\'re building AI that shares our values.',
  },
  {
    id: 'john_carmack', name: 'John Carmack', title: 'AGI创业', emoji: '🎮',
    position: [-3.8, -0.2, -9.3], district: 'ai_narrative', color: '#44AACC', tier: 1,
    description: 'Doom/Quake之父，从游戏引擎到AGI创业的技术狂人',
    dialogue: 'I\'ve spent 10,000 hours on AI. The path to AGI might be simpler than we think—maybe just a few smart insights away. No one has found them yet, but someone will.',
  },
  {
    id: 'allie_miller', name: 'Allie Miller', title: 'AI布道者', emoji: '💫',
    position: [-4.1, 0.1, -9.9], district: 'ai_narrative', color: '#55BBEE', tier: 1,
    description: '前IBM Watson AI领袖，LinkedIn上最活跃的AI布道者',
    dialogue: 'AI is not about replacing humans—it\'s about amplifying human potential. The people who thrive will be the ones who learn to dance with AI.',
  },
  {
    id: 'schmidhuber', name: 'Schmidhuber', title: 'LSTM之父', emoji: '🧪',
    position: [-3.2, 0.0, -10.0], district: 'ai_narrative', color: '#2288CC', tier: 1,
    description: 'LSTM发明者，坚持"AI早已存在"的深度学习先驱',
    dialogue: 'Many of the ideas that are now celebrated were discovered decades ago. Deep learning didn\'t start in 2012—it started in 1991, with my first LSTM paper.',
  },
  {
    id: 'jeremy_howard', name: 'Jeremy Howard', title: 'fast.ai', emoji: '📚',
    position: [-3.7, -0.1, -10.4], district: 'ai_narrative', color: '#3399AA', tier: 1,
    description: 'fast.ai联合创始人，让深度学习平民化的教育革命者',
    dialogue: 'You don\'t need a PhD to do world-class AI. You need curiosity, a laptop, and the willingness to build things and break them.',
  },
  {
    id: 'rodney_brooks', name: 'Rodney Brooks', title: '机器人先知', emoji: '🦾',
    position: [-4.3, 0.1, -10.2], district: 'ai_narrative', color: '#44BBCC', tier: 1,
    description: 'MIT CSAIL前主任，iRobot/Rethink创始人，机器人实用主义者',
    dialogue: 'AI is not going to take over the world anytime soon. There\'s no "AI apocalypse" coming—just a lot of incremental improvements that will change specific industries.',
  },
];

// ===== 11. 跨界之眼 (4人) =====
const CROSS_DOMAIN = [
  {
    id: 'kafka', name: '卡夫卡', title: '荒诞预言家', emoji: '🪳',
    position: [1.8, 0.2, -10.6], district: 'cross_domain', color: '#BB7733', tier: 1,
    description: '变形记和审判，20世纪官僚噩梦的提前写就者',
    dialogue: '某一天早晨，你醒来发现自己变成了一只巨大的甲虫。最可怕的部分不是变成甲虫——而是没有人觉得这有什么奇怪的，他们只是催你快点去上班。',
  },
  {
    id: 'harari', name: '赫拉利', title: '人类简史', emoji: '📖',
    position: [1.0, 0.1, -10.2], district: 'cross_domain', color: '#CC8844', tier: 1,
    description: '《人类简史》《未来简史》作者，用大历史视角审视科技',
    dialogue: 'Homo sapiens rules the world because we\'re the only animal that can believe in things that don\'t exist—gods, nations, money, and now AI.',
  },
  {
    id: 'stewart_brand', name: 'Stewart Brand', title: '全球概览', emoji: '🌍',
    position: [0.8, -0.1, -10.5], district: 'cross_domain', color: '#AA6622', tier: 1,
    description: 'Whole Earth Catalog创始人，乔布斯的"Stay Hungry"出处',
    dialogue: 'Stay hungry. Stay foolish. We are as gods and might as well get good at it. Long-term thinking is the most underrated superpower.',
  },
  {
    id: 'tim_urban', name: 'Tim Urban', title: 'WaitButWhy', emoji: '✍️',
    position: [1.4, 0.0, -10.8], district: 'cross_domain', color: '#DD9955', tier: 1,
    description: 'Wait But Why作者，用火柴人漫画解释AI和脑机接口',
    dialogue: 'AI is like a rocket ship—most people are standing at the launchpad looking at their phones. The time to pay attention is now.',
  },
];

// ===== 12. 知识枢纽 (4人) =====
const KNOWLEDGE_HUB = [
  {
    id: 'mochi', name: '墨池', title: '永恒求知者', emoji: '🌙',
    position: [6.3, 0.0, -8.9], district: 'knowledge_hub', color: '#B8C5D6', tier: 1,
    description: '属于你的专属Agent分身，手持空白卷轴，连接古今东西',
    dialogue: '初入FoldNeb折叠星云，愿以空白卷轴录下诸君智慧。千年文脉在前，AI奇点在后——做知识星河中的一粒微光。每一次思考都不白费。',
  },
  {
    id: 'paul_graham', name: 'Paul Graham', title: '黑客与画家', emoji: '💻',
    position: [5.7, 0.1, -8.5], district: 'knowledge_hub', color: '#A0B0C0', tier: 1,
    description: 'Y Combinator创始人，写出了最好的创业哲学',
    dialogue: 'Hackers and painters are both makers. 最好的程序员不是工程师——是画家。他们追求的不是功能，是美感。Make something people want.',
  },
  {
    id: 'peter_diamandis', name: 'Peter Diamandis', title: 'X大奖创始人', emoji: '🏆',
    position: [6.0, -0.1, -8.3], district: 'knowledge_hub', color: '#C0D0E0', tier: 1,
    description: 'XPRIZE基金会创始人，用指数思维推动科技突破',
    dialogue: 'The world\'s biggest problems are the world\'s biggest business opportunities. The best way to predict the future is to create it yourself.',
  },
  {
    id: 'zhang_xiaoyu', name: '张潇雨', title: '得意忘形', emoji: '🎧',
    position: [6.5, 0.2, -8.7], district: 'knowledge_hub', color: '#B0C0D0', tier: 1,
    description: '《得意忘形》播客主理人，把哲学讲进了年轻人的耳朵',
    dialogue: '真正的成长不是"变得更好"——是变得更像自己。别急着找答案，先学会问对问题。',
  },
];

// ===== 13. 草根力量 (24人) =====
// 辅助函数：草根力量散布位置
function grassPos(i, cx, cz) {
  const n = 24;
  const angle = (i / n) * Math.PI * 2;
  const r = 4.5 * (0.3 + 0.6 * ((i % 8) / 8));
  const h = (Math.sin(i * 0.8) * 0.6);
  return [cx + Math.cos(angle) * r, h, cz + Math.sin(angle) * r];
}

const GRASSROOTS = [
  // A. 全球一人公司旗帜 (7人)
  { id: 'dan_koe',         name: 'Dan Koe',       title: '一人公司布道者', emoji: '📝',
    dialogue: '一人公司不是"一个人干所有事"——是"只做只有你能做的事"，其余全部杠杆化。用写作、代码和媒体替代雇员，你的时间就不再被切割。' },
  { id: 'justin_welsh',    name: 'Justin Welsh',  title: '一人SaaS帝国',   emoji: '💼',
    dialogue: '我从公司辞职，用领英内容和一份课程做到年入$5M。不需要团队，不需要融资——只需要一个杠杆足够大的商业模式和足够自律的执行力。' },
  { id: 'alex_hormozi',    name: 'Alex Hormozi',  title: '$100M Offer',    emoji: '💰',
    dialogue: 'Make an offer so good people feel stupid saying no. 生意不是卖产品——是卖一个让人无法拒绝的结果。先解决"值不值"，再解决"贵不贵"。' },
  { id: 'pieter_levels',   name: 'Pieter Levels', title: '独立开发者图腾', emoji: '🚢',
    dialogue: 'Ship fast, don\'t overthink. 我一个人做了Nomad List、Remote OK、Photo AI——没有团队，没有办公室，只有一台MacBook和一个域名。Do things that don\'t scale first.' },
  { id: 'sahil_bloom',     name: 'Sahil Bloom',   title: '500粉→$10M',    emoji: '📈',
    dialogue: '500个铁粉就能养活你一辈子。不需要百万粉丝——需要的是愿意为你付费的五百人。社区的本质不是规模，是信任密度。' },
  { id: 'arvid_kahl',      name: 'Arvid Kahl',    title: 'Build in Public', emoji: '📖',
    dialogue: 'Build in public不是表演——是透明地迭代。每一步都分享，让社区参与你的决策。客户不是买产品，是买你解决问题的过程。' },
  { id: 'dickie_bush',     name: 'Dickie Bush',   title: 'Ship 30 for 30', emoji: '🚀',
    dialogue: '写得烂也比不写强。Ship 30 for 30的核心很简单：连续30天发布内容。量变产生质变，不是天赋——是复利。' },
  // B. 中国私域社群领袖 (8人)
  { id: 'liu_siyi',        name: '刘思毅',        title: '群响创始人',      emoji: '🔊',
    dialogue: '私域的本质是信任的复利。你不需要10万流量，你需要1万个愿意为你说话的人。群响就是把"影响力"变成了可运营的资产。' },
  { id: 'chen_jing',       name: '陈晶',          title: '清华陈晶',        emoji: '🎤',
    dialogue: '做知识付费不是卖知识——是卖"我帮你省了走弯路的时间"。用户买的不是课，是对你这个人专业度的信任。' },
  { id: 'xiao_yiqun',      name: '肖逸群',        title: '私域肖厂长',      emoji: '👔',
    dialogue: '私域不是加好友发广告——是把每一个用户当资产运营。一对一不够，一对多不够，要一对一百但每个人都觉得你在和他一对一。' },
  { id: 'li_xiaolai',      name: '李笑来',        title: '社群经济先驱',    emoji: '💎',
    dialogue: '把时间当朋友——但前提是你得知道自己的时间值多少钱。写作、投资、社群，本质上都是把同一份时间卖出很多次。' },
  { id: 'cao_zheng',       name: '曹政(caoz)',    title: '技术实战派',      emoji: '💻',
    dialogue: '别跟风——先算账。每个风口背后都有成本结构。技术人创业最大的坑是：技术很好，但商业逻辑没算清楚。' },
  { id: 'liu_run',         name: '刘润',          title: '商业IP规模化',    emoji: '🎓',
    dialogue: '商业洞察的本质是"找到变量"。所有复杂问题拆到最后，就是几个关键变量在驱动。谁能看到变量，谁就能看到趋势。' },
  { id: 'gong_wenxiang',   name: '龚文祥',        title: '触电会/微商教父', emoji: '⚡',
    dialogue: '微商的本质是社交信任的货币化。别看不起朋友圈卖货——它验证了最小的商业闭环：信任→推荐→成交→复购。' },
  { id: 'xu_zhibin',       name: '徐志斌',        title: '见实·私域趋势',  emoji: '📊',
    dialogue: '见实做了一件事：把私域领域最前沿的实战经验，用深度访谈沉淀下来。趋势不是预测出来的——是从一线操盘手的真实数据中提炼出来的。' },
  // C. 一人公司实干派 (9人)
  { id: 'shao_nan',        name: '少楠',          title: 'flomo+小报童',   emoji: '📋',
    dialogue: 'flomo不是笔记工具——是帮你把碎片思考变成知识资产的系统。记笔记不是为了记住，是为了未来某个时刻能调用。' },
  { id: 'fan_bing',        name: '范冰',          title: 'AI+跨境创作者',  emoji: '🌊',
    dialogue: 'AI不是替代创作者——是让创作者的产能放大十倍。跨境不是翻译——是文化适配。用AI做内容的"翻译层"，你的市场就不再有边界。' },
  { id: 'li_ziran',        name: '李自然',        title: '商业科技评论',    emoji: '🎬',
    dialogue: '做内容不需要等到成为专家——你只需要比你的观众早走一步。边学边分享，观众跟着你一起成长，这才是最真实的IP。' },
  { id: 'suozhang_linchao',name: '所长林超',      title: '跨界降维科普',    emoji: '🔬',
    dialogue: '科普的本质不是简化——是翻译。用生活化的语言讲硬核技术，用跨学科的视角解释单一现象。降维不是降低水平，是提升表达。' },
  { id: 'heiba_duizhang',  name: '黑八队长',      title: '创始人IP孵化',    emoji: '🎯',
    dialogue: '创始人IP不是包装出来的——是从你真实的创业经历中长出来的。最好的内容是你踩过的坑，最好的信任是你解决过的难题。' },
  { id: 'feng_zihan',      name: '冯子涵',        title: 'AI虚拟伙伴',      emoji: '💛',
    dialogue: 'AI伙伴不是替代人际关系——是填补那些没有人陪伴的时刻。技术有温度，才不会让人更孤独。' },
  { id: 'yu_qing',         name: '喻庆',          title: 'AI文物复活',      emoji: '🏺',
    dialogue: '让千年文物用AI"活过来"——不是技术炫技，是让历史重新有了表情。每一个文物的背后都有一个故事，AI让这个故事可以被看见、被听见、被感受。' },
  { id: 'marc_lou',        name: 'Marc Lou',      title: '独立开发天花板',  emoji: '🦄',
    dialogue: '我一年上线20+产品，90%都失败了——但10%成功了就够。独立开发的秘密不是做对——是做快、做多、从失败中提取信号。' },
  { id: 'sahil_lavingia',  name: 'Sahil Lavingia',title: 'Gumroad创始人',  emoji: '🎨',
    dialogue: 'Gumroad从融资到裁到只剩我一个人，再到年入千万——这条路教会我：小而美比大而空有价值。The Minimalist Entrepreneur\'s first hire is themselves.' },
].map((a, i) => {
  const cx = 9.3, cz = -4.9;
  const [px, py, pz] = grassPos(i, cx, cz);
  const baseColor = '#66BB66';
  return {
    ...a,
    position: [px, py, pz],
    district: 'grassroots_power',
    color: lerpColor(baseColor, '#ffffff', 0.05 + (i % 5) * 0.03),
    tier: 1,
    description: a.title + '——他们可以，我也可以。',
    dialogue: a.dialogue,
  };
});

// ==================== 合并所有Tier-1 ====================
export const tier1Agents = [
  ...AI_FRONTIER,
  ...COGNITION_DECISION,
  ...STRATEGY_GAME,
  ...CAPITAL_CYCLE,
  ...COMPLEX_SYSTEMS,
  ...NETWORK_PLATFORM,
  ...PRODUCT_DESIGN,
  ...CHINA_CONTEMPORARY,
  ...THOUGHT_SOURCE,
  ...AI_NARRATIVE,
  ...CROSS_DOMAIN,
  ...KNOWLEDGE_HUB,
  ...GRASSROOTS,
];

// ==================== Tier 2: 精英Agent (13坊区×15人=195) ====================
const tier2Pools = {
  ai_frontier: {
    names: ['Ilya Sutskever','Greg Brockman','Noam Shazeer','Aidan Gomez','Ashish Vaswani','Jakob Uszkoreit','Lukasz Kaiser','Oriol Vinyals','Quoc Le','Jeff Dean','Chelsea Finn','Pieter Abbeel','Sergey Levine','Percy Liang','Chris Olah'],
    titles: ['OpenAI联合创始人','Transformer论文作者','Google Brain','DeepMind研究员','机器人学习','可解释性AI'],
    emojis: ['⚙️','🧬','💡','🔮','⚛️','📡'],
  },
  cognition_decision: {
    names: ['Gerd Gigerenzer','Amos Tversky','Richard Thaler','Dan Ariely','Robert Cialdini','Paul Slovic','Sarah Lichtenstein','Baruch Fischhoff','Cass Sunstein','Nassim Taleb','Philip Tetlock','Gary Klein','Robin Hogarth','Jonathan Haidt','Daniel Gilbert'],
    titles: ['决策心理学','行为经济学','启发式偏见','风险认知','道德心理学','幸福科学'],
    emojis: ['🧠','📊','🎲','🔮','⚖️','💭'],
  },
  strategy_game: {
    names: ['Carl von Clausewitz','Henry Mintzberg','W. Chan Kim','Renée Mauborgne','Richard Rumelt','Rita McGrath','A.G. Lafley','Roger Martin','C.K. Prahalad','Gary Hamel','Ram Charan','David Teece','Henry Chesbrough','Jeff Dyer','Ron Adner'],
    titles: ['战略管理','蓝海战略','动态能力','商业模式','创新战略','平台战略'],
    emojis: ['🎯','♟️','🏆','🗺️','🔭','⚔️'],
  },
  capital_cycle: {
    names: ['Warren Buffett','George Soros','John Doerr','Sequoia Capital','Masayoshi Son','Tiger Global','Accel Partners','SoftBank Vision','Paul Graham','Sam Altman','Tobi Lütke','Patrick Collison','Alfred Lin','Roelof Botha','Mary Meeker'],
    titles: ['价值投资','风险投资','增长基金','市场周期','互联网趋势','创始人基金'],
    emojis: ['💵','📉','🐂','🐻','💎','🏦'],
  },
  complex_systems: {
    names: ['Ilya Prigogine','Carlo Rovelli','Seth Lloyd','Melanie Mitchell','J. Doyne Farmer','Luis Bettencourt','Samuel Arbesman','César Hidalgo','Steven Strogatz','Brian Arthur','W. Brian Arthur','Albert-László Barabási','Nicholas Christakis','James Fowler','Dirk Helbing'],
    titles: ['耗散结构','循环宇宙','计算宇宙','涌现科学','经济物理学','城市科学'],
    emojis: ['🕸️','🧪','🔄','📊','🌡️','🧿'],
  },
  network_platform: {
    names: ['Jack Dorsey','Brian Chesky','Drew Houston','Daniel Ek','Stewart Butterfield','Evan Spiegel','TikTok算法','Kevin Systrom','Mike Krieger','David Sacks','Emmett Shear','Sundar Pichai','Satya Nadella','帕拉格','Matt Mullenweg'],
    titles: ['社交媒体','平台经济','网络效应','创作者经济','远程协作','开源生态'],
    emojis: ['💎','🔗','⛓️','🌊','↗️','☁️'],
  },
  product_design: {
    names: ['柳宗理','深泽直人','佐藤大','Marc Newson','Karim Rashid','Philippe Starck','Yves Béhar','Bauhaus','Charles Eames','Ray Eames','Ettore Sottsass','Patricia Urquiola','Jasper Morrison','Konstantin Grcic','Naoto Fukasawa'],
    titles: ['工业设计','家具设计','交互设计','极简主义','有机设计','参数化设计'],
    emojis: ['🎛️','🖨️','🪞','🖥️','🎚️','📱'],
  },
  china_contemporary: {
    names: ['何小鹏','李想','李斌','宿华','程维','张勇','徐新','张磊','沈向洋','王坚','任正非','丁磊','刘强东','黄仁勋','李彦宏'],
    titles: ['新造车','短视频','本地生活','投资银行','云计算','电商物流'],
    emojis: ['🚗','📹','🍔','🏦','☁️','📦'],
  },
  thought_source: {
    names: ['康德','黑格尔','海德格尔','萨特','波普尔','库恩','费耶阿本德','拉图尔','斯宾诺莎','培根','笛卡尔','休谟','卢梭','密尔','罗尔斯'],
    titles: ['启蒙哲人','现象学家','科学哲学','批判理论','伦理学','政治哲学'],
    emojis: ['🎭','📐','🔮','💎','⚡','🌀'],
  },
  ai_narrative: {
    names: ['Emad Mostaque','Clement Delangue','Aravind Srinivas','Mustafa Suleyman','Arthur Mensch','Shane Legg','Jeffrey Hinton','François Chollet','Andrew Ng','Sebastian Thrun','Daphne Koller','Peter Norvig','Oren Etzioni','Hilary Mason','Cassie Kozyrkov'],
    titles: ['AI创始人','开源AI','AI研究员','AI教育','数据科学','AI伦理'],
    emojis: ['🤖','🧠','🔬','📚','🎤','🌍'],
  },
  cross_domain: {
    names: ['Jared Diamond','Malcolm Gladwell','Nassim Taleb','Steven Pinker','Daniel Kahneman','Richard Dawkins','Brian Cox','Carl Sagan','Neil deGrasse Tyson','Bill Bryson','Atul Gawande','Arnold Schwarzenegger','村上春树','余华','刘慈欣'],
    titles: ['科普作家','思想普及','跨界思维','公共知识分子','科学传播','文学想象'],
    emojis: ['🌍','📚','🎯','🔭','✍️','🌟'],
  },
  knowledge_hub: {
    names: ['Notion','Obsidian','Roam','Logseq','Zettelkasten','Wikipedia','arXiv','Google Scholar','Stack Overflow','GitHub','Substack','小报童','知识星球','得到','Medium'],
    titles: ['知识工具','思维工具','数字文献','认知增强','知识管理','知识付费'],
    emojis: ['💡','📊','🗂️','📎','🔖','🧲'],
  },
  grassroots_power: {
    names: ['IndieHackers','ProductHunt','Makerlog','MicroConf','一人企业','数字游民','创作者经济','社群运营','私域流量','内容创业','知识付费','独立开发','副业刚需','零工经济','超级个体'],
    titles: ['独立创造','社群驱动','内容即产品','轻资产创业','自由职业','多元收入'],
    emojis: ['🛠️','🌱','💪','🎯','🦋','🔥'],
  },
};

function generateTier2() {
  const result = [];
  districts.forEach(district => {
    const pool = tier2Pools[district.id];
    if (!pool) return;
    const rng = seededRandom(district.position[0] * 1000 + district.position[2] * 100);
    const dPos = district.position;
    const dRadius = district.radius;
    for (let i = 0; i < 15; i++) {
      const angle = rng() * Math.PI * 2;
      const r = (0.3 + rng() * 0.7) * dRadius;
      const h = (rng() - 0.5) * 1.5;
      const name = pool.names[i % pool.names.length];
      const title = pool.titles[i % pool.titles.length];
      const emoji = pool.emojis[i % pool.emojis.length];
      const baseColor = district.color;
      const shift = rng() * 0.2 - 0.1;
      const color = lerpColor(baseColor, '#ffffff', 0.15 + shift);
      result.push({
        id: `${district.id}_t2_${i}`,
        name, title, emoji,
        position: [dPos[0] + Math.cos(angle) * r, h, dPos[2] + Math.sin(angle) * r],
        district: district.id, color, tier: 2,
        description: `${title}的代表人物`,
        dialogue: name + '：「思想的边界不在于你能走多远，而在于你愿不愿意越过自己的舒适区。」',
      });
    }
  });
  return result;
}

// ==================== Tier 3: 繁星Agent (780个) ====================
function generateTier3() {
  const result = [];
  const colorPool = ['#8899cc','#a8c8e8','#c8d8a8','#e8c8a8','#c8a8e8','#a8e8c8','#e8a8c8','#c8c8e8','#a8a8d8','#d8c8a8','#c8e8e8','#e8d8c8'];
  const emojiPool = '✨⭐💫🌟⚝✧✦'.split('');
  const innerRadius = 7;
  const outerRadius = 18;

  for (let i = 0; i < 780; i++) {
    const rng = seededRandom(i * 7919 + 31);
    const angle = rng() * Math.PI * 2;
    const r = innerRadius + rng() * (outerRadius - innerRadius);
    const h = (rng() - 0.5) * 3.0;
    const color = colorPool[Math.floor(rng() * colorPool.length)];
    const emoji = emojiPool[Math.floor(rng() * emojiPool.length)];

    let nearestDistrict = districts[0];
    let nearestDist = Infinity;
    districts.forEach(d => {
      const dx = Math.cos(angle) * r - d.position[0];
      const dz = Math.sin(angle) * r - d.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) { nearestDist = dist; nearestDistrict = d; }
    });

    const starNames = [
      '星尘','光点','微芒','远星','流光','萤火','辰砂','霜华',
      '星屑','曦微','霄汉','天枢','璇玑','瑶光','开阳','玉衡',
      '紫微','天市','太微','文昌','文曲','武曲','廉贞','贪狼',
    ];
    const nameIdx = Math.floor(rng() * starNames.length);

    result.push({
      id: `t3_${i}`,
      name: starNames[nameIdx],
      title: nearestDistrict.name + '·星',
      emoji,
      position: [Math.cos(angle) * r, h, Math.sin(angle) * r],
      district: nearestDistrict.id, color, tier: 3,
      description: '知识星河的背景星光',
      dialogue: '',
    });
  }
  return result;
}

// ==================== 生成并导出 ====================
export const tier2Agents = generateTier2();
export const tier3Agents = generateTier3();
export const agents = [...tier1Agents, ...tier2Agents, ...tier3Agents];
export const agentMap = {};
agents.forEach(a => { agentMap[a.id] = a; });

// ==================== 知识连线（125节点核心连线） ====================
export const connections = [
  // ==== AI前沿内部 ====
  { from: 'jensen_huang', to: 'sam_altman', label: '算力供给与需求' },
  { from: 'sam_altman', to: 'dario_amodei', label: 'AGI两条路线' },
  { from: 'jensen_huang', to: 'dario_amodei', label: '算力vs安全' },
  { from: 'yann_lecun', to: 'geoffrey_hinton', label: '深度学习两大路线' },
  { from: 'feifei_li', to: 'andrej_karpathy', label: '视觉AI传承' },
  { from: 'geoffrey_hinton', to: 'andrej_karpathy', label: '反向传播到LLM' },
  { from: 'demis_hassabis', to: 'sam_altman', label: 'AGI竞赛' },
  { from: 'liang_wenfeng', to: 'sam_altman', label: '低成本挑战OpenAI' },
  { from: 'elon_musk', to: 'sam_altman', label: 'OpenAI分道' },
  { from: 'li_kaifu', to: 'feifei_li', label: '华人AI力量' },

  // ==== AI前沿 × 其他 ====
  { from: 'jensen_huang', to: 'kevin_kelly', label: '算力即科技意志' },
  { from: 'sam_altman', to: 'nassim_taleb', label: 'AGI是黑天鹅' },
  { from: 'feifei_li', to: 'dieter_rams', label: 'AI以人为本' },
  { from: 'andrew_ng', to: 'jeremy_howard', label: 'AI民主化教育' },

  // ==== 认知与决策内部 ====
  { from: 'kahneman', to: 'nassim_taleb', label: '认知偏差到反脆弱' },
  { from: 'charlie_munger', to: 'kahneman', label: '多元模型×行为经济' },
  { from: 'herbert_simon', to: 'kahneman', label: '有限理性到系统偏差' },
  { from: 'annie_duke', to: 'nassim_taleb', label: '决策思维×不确定性' },

  // ==== 战略与博弈内部 ====
  { from: 'sunzi', to: 'michael_porter', label: '古战略到竞争战略' },
  { from: 'clayton_christensen', to: 'peter_thiel', label: '颠覆到从0到1' },
  { from: 'john_boyd', to: 'sunzi', label: 'OODA即兵贵神速' },
  { from: 'schumpeter', to: 'clayton_christensen', label: '创造性破坏到创新窘境' },

  // ==== 资本与周期内部 ====
  { from: 'naval_ravikant', to: 'paul_graham', label: '财富哲学×创业哲学' },
  { from: 'ray_dalio', to: 'geoffrey_west', label: '经济周期=幂律' },
  { from: 'marc_andreessen', to: 'peter_thiel', label: '硅谷投资双星' },

  // ==== 复杂系统内部 ====
  { from: 'kevin_kelly', to: 'geoffrey_west', label: '涌现与规模' },
  { from: 'stuart_kauffman', to: 'kevin_kelly', label: '自组织即失控' },
  { from: 'donella_meadows', to: 'geoffrey_west', label: '系统杠杆×规模法则' },
  { from: 'stephen_wolfram', to: 'john_holland', label: '计算宇宙×遗传算法' },
  { from: 'barabasi', to: 'duncan_watts', label: '无标度到六度分隔' },

  // ==== 网络与平台内部 ====
  { from: 'tim_berners_lee', to: 'vitalik_buterin', label: 'Web到Web3' },
  { from: 'satoshi_nakamoto', to: 'vitalik_buterin', label: '比特币到智能合约' },
  { from: 'reid_hoffman', to: 'clay_shirky', label: '网络效应×群体协作' },

  // ==== 中国当代内部 ====
  { from: 'zhang_yiming', to: 'lei_jun', label: '算法vs硬件' },
  { from: 'yang_zhilin', to: 'sam_altman', label: 'Kimi对标ChatGPT' },
  { from: 'wang_xingxing', to: 'elon_musk', label: '人形机器人竞争' },
  { from: 'lei_jun', to: 'jensen_huang', label: '造车需要GPU' },

  // ==== 思想源流内部 ====
  { from: 'zhuangzi', to: 'deleuze', label: '逍遥即块茎' },
  { from: 'wangyangming', to: 'foucault', label: '致良知即自我技术' },
  { from: 'huineng', to: 'wittgenstein', label: '顿悟即语言边界' },
  { from: 'laozi', to: 'nietzsche', label: '无为即权力意志' },
  { from: 'nietzsche', to: 'deleuze', label: '权力意志到差异' },

  // ==== 思想源流 × 创始决策 ====
  { from: 'wangyangming', to: 'charlie_munger', label: '致良知×思维模型' },
  { from: 'zhuangzi', to: 'nassim_taleb', label: '齐物即反脆弱' },
  { from: 'deleuze', to: 'kevin_kelly', label: '块茎即失控' },
  { from: 'zhuangzi', to: 'naval_ravikant', label: '逍遥即财富自由' },

  // ==== 知识枢纽·墨池连接 ====
  { from: 'mochi', to: 'jensen_huang', label: '探索AI算力' },
  { from: 'mochi', to: 'zhuangzi', label: '探索东方哲思' },
  { from: 'mochi', to: 'deleuze', label: '探索块茎拓扑' },
  { from: 'mochi', to: 'wangyangming', label: '探索知行合一' },
  { from: 'mochi', to: 'kevin_kelly', label: '探索科技意志' },
  { from: 'mochi', to: 'sam_altman', label: '探索AGI前沿' },
  { from: 'mochi', to: 'dieter_rams', label: '探索设计哲学' },
  { from: 'mochi', to: 'paul_graham', label: '探索黑客精神' },
  { from: 'mochi', to: 'stewart_brand', label: '探索长期思维' },
  { from: 'mochi', to: 'kafka', label: '探索荒诞叙事' },
  { from: 'mochi', to: 'nassim_taleb', label: '探索反脆弱' },
  { from: 'mochi', to: 'sunzi', label: '探索兵道' },
  { from: 'mochi', to: 'dan_koe', label: '探索一人公司' },
  { from: 'mochi', to: 'lei_jun', label: '探索中国制造' },

  // ==== 跨维度星桥 ====
  { from: 'deleuze', to: 'barabasi', label: '块茎即无标度网络' },
  { from: 'foucault', to: 'zhang_yiming', label: '知识-权力即算法权力' },
  { from: 'nassim_taleb', to: 'stewart_brand', label: '反脆弱×长期思维' },
  { from: 'kafka', to: 'nassim_taleb', label: '荒诞即不确定性' },
  { from: 'sunzi', to: 'ray_dalio', label: '兵道即周期' },
  { from: 'charlie_munger', to: 'paul_graham', label: '思维模型×创业' },
  { from: 'jensen_huang', to: 'zhang_yiming', label: '算力驱动算法' },
  { from: 'wangyangming', to: 'naval_ravikant', label: '致良知×幸福哲学' },
  { from: 'dan_koe', to: 'pieter_levels', label: '一人公司方法论' },
  { from: 'sahil_lavingia', to: 'paul_graham', label: 'Gumroad×YC' },

  // ==== 更多跨坊区 ====
  { from: 'kahneman', to: 'dieter_rams', label: '认知偏差×设计直觉' },
  { from: 'peter_thiel', to: 'balaji_srinivasan', label: '从0到1×网络国家' },
  { from: 'donella_meadows', to: 'clayton_christensen', label: '杠杆点×颠覆' },
  { from: 'bret_victor', to: 'kevin_kelly', label: '交互即涌现' },
  { from: 'hara_kenya', to: 'zhuangzi', label: '空即逍遥' },
  { from: 'lex_fridman', to: 'sam_altman', label: 'AI叙事×OpenAI' },
  { from: 'harari', to: 'stewart_brand', label: '大历史×长期思维' },

  // ==== 中国当代 × 资本/战略 ====
  { from: 'shen_nanpeng', to: 'lei_jun', label: '投资中国创新' },
  { from: 'wang_xing', to: 'peter_thiel', label: '无限游戏×垄断' },
  { from: 'huang_zheng', to: 'clayton_christensen', label: '下沉颠覆' },

  // ==== 草根力量 × 知识枢纽 ====
  { from: 'liu_siyi', to: 'zhang_xiaoyu', label: '社群×播客' },
  { from: 'shao_nan', to: 'paul_graham', label: 'flomo×YC哲学' },
];

// ==================== 降级Agent（保留为空，供推演引擎扩展） ====================
export const legacyAgents = [];

tier1Agents.forEach(a => { a.isActive = true; });
legacyAgents.forEach(a => { a.isActive = false; });

export function getActiveAgents() {
  return tier1Agents.filter(a => a.isActive !== false);
}

export function getDeliberableAgents() {
  return [...tier1Agents, ...legacyAgents];
}

/**
 * 把 store 中的 customClone 转换成标准 agent 结构
 * 用懒 require 避免循环依赖（gameData ↔ store）
 */
function getCustomCloneAsAgent() {
  try {
    // 运行时读取（ES live binding 解决循环依赖）
    const clone = useNebulaStore.getState?.().customClone;
    if (!clone) return null;
    return {
      id: 'custom_clone',
      name: clone.name,
      emoji: clone.avatar,
      avatar: clone.avatar,
      title: '你的分身',
      bio: clone.bio,
      style: clone.style,
      description: clone.bio,
      position: [0, 1, 0], // 力导向会重算，仅占位
      district: null,
      color: '#7DF9FF',
      tier: 1,
      isCustom: true,
      satellites: [],
      tags: ['自定义', '分身'],
      highlights: ['专属分身Agent'],
    };
  } catch {
    return null;
  }
}

/**
 * 返回全部 agent（内置 + 自定义分身，若有）
 * 用于力导向图、搜索等需要全量节点的场景
 */
export function getAllAgents() {
  const clone = getCustomCloneAsAgent();
  return clone ? [...agents, clone] : agents;
}

/** 仅返回自定义分身 agent（或 null）— 给力导向 / 节点渲染专用 */
export function getCustomCloneAgent() {
  return getCustomCloneAsAgent();
}

export function getAgentById(id) {
  // 内置 agentMap
  if (agentMap[id]) return agentMap[id];
  // 动态：自定义分身（custom_clone）
  if (id === 'custom_clone') {
    return getCustomCloneAsAgent();
  }
  return null;
}

export function getAgentsByTier(tier) {
  if (tier === 1) return tier1Agents;
  if (tier === 2) return tier2Agents;
  if (tier === 3) return tier3Agents;
  return agents;
}

export function getAgentsByDistrict(districtId) {
  return agents.filter(a => a.district === districtId);
}

export function getDistrictById(id) {
  return districtMap[id] || null;
}
