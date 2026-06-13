# 🌌 FoldNeb 折叠星云

> **为思考者建造会生长的思想星河** — 3D 知识星河可视化平台

125 位思想者（黄仁勋、马斯克、凯文·凯利、老子、王阳明、塔勒布...）化为发光星体，分布在 13 个星系中，节点之间形成金色连线网络。支持力导向布局、搜索定位、Agent 对话、决策推演、朋友圈社交，以及一键跳转 Obsidian 知识库。

---

## 在线体验

- **GitHub Pages**: https://zhouzengxian.github.io/foldneb
- **本地开发**: http://localhost:3000

---

## 项目亮点

### 1. 125 位思想者的 3D 星河宇宙

13 个星系（AI前沿、认知决策、战略博弈、资本周期、思想源流...）环绕中心，每位思想者是一颗多层发光星体：

| 视觉层 | 实现 |
|--------|------|
| 核心 | Canvas 径向渐变纹理 + 四向十字光芒 |
| 光环 | 双层旋转 Ring + 脉冲呼吸动画 |
| 卫星粒子 | 每位 Agent 2-3 颗标签卫星（如 CUDA、ChatGPT）环绕 |
| 影响力星云 | 三层粒子壳，颜色随星系主题变化 |
| 深空背景 | 2500 颗深空星 + 500 粒宇宙尘埃 |

### 2. 力导向布局 — 节点自然聚集

基于物理模拟的力导向算法（`useForceGraph.js`），让相关思想者的星体自然靠近：

- **引力**：有连线关系的节点互相吸引
- **斥力**：所有节点之间存在排斥，避免重叠
- **星系引力**：同星系节点向星系圆心聚集
- **中心引力**：全局向原点收束，防止节点飞散

### 3. 折叠记忆引擎 — 记忆永不重置

每次 Agent 之间的对话或互动，自动提取记忆晶体（知识三元组），在 3D 星河中生成金色连线。

三种提取精度：

| 精度 | 方式 | 场景 |
|------|------|------|
| CRYSTAL | LLM 提取精确三元组 | 对话完成后调用大模型 |
| FRAGMENT | 关键词快速匹配 | 社交评论实时处理 |
| DUST | 截取文本前 15 字 | 匹配失败降级兜底 |

所有关系经过 `AGENT_ALIAS_MAP`（42 个 Tier-1 Agent 双向别名映射表）验证，确保知识图谱的准确性。

### 4. 决策推演引擎 — 多 Agent 圆桌辩论

输入你的商业卡点，系统自动：

1. 分析问题领域，匹配最相关的 3-5 位 Agent
2. 多轮推演，Agent 依次发言并引用彼此观点
3. Canvas 实时绘制推演脉络网络
4. 一键导出截图报告

支持 API 实时模式（调用大模型）和 Demo 模式（预置语料离线运行）。

### 5. 朋友圈社交系统

拟真 iPhone 外观的朋友圈界面：

- 11 位 Agent 每日自动发布动态（167 条预置语料）
- 点赞、评论，Agent 根据内容自动回复
- 评论中提及的 Agent 自动提取记忆晶体
- 用户分身化作星河中的金色发光节点

### 6. 五大模型自由切换

内置 5 家大模型提供商，设置面板一键切换，支持请求 JSON 预览和一键测试连接。

### 7. Obsidian 知识库联动

每位 Agent 星体可直接跳转到 Obsidian Vault 中的对应笔记，Web 可视化与 Obsidian 知识库完全同构。

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器（默认端口 3000）
npm run dev

# 浏览器打开 http://localhost:3000
```

### 构建与预览

```bash
npm run build     # 构建到 dist/
npm run preview   # 本地预览构建产物
```

---

## 技术架构

### 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 3D 渲染 | Three.js + @react-three/fiber + @react-three/drei | three 0.169 |
| 后处理 | @react-three/postprocessing | 3.0 |
| 动画 | GSAP | 3.15 |
| 状态管理 | Zustand（localStorage 持久化） | 5.0 |
| UI 框架 | React + TailwindCSS | React 18 |
| 构建工具 | Vite | 6.0 |

### 架构总览

```
App.jsx
 ├── NebulaScene          3D 主场景（Canvas）
 │    ├── AgentNode        星体节点（Canvas 纹理 + 光环 + 卫星）
 │    ├── ConnectionLines  静态连线 + 记忆金线
 │    ├── GrowingLines     生长动画连线
 │    ├── DeepSpace        深空星 + 宇宙尘埃
 │    ├── GalaxyAtmosphere 星系粒子雾气氛
 │    ├── DemoController   Demo 巡游特效
 │    └── DistrictGround   星系地面标记
 │
 ├── NebulaUI             2D HUD 界面
 │    ├── SearchBar        搜索定位
 │    ├── AgentDetail      Agent 详情面板
 │    ├── MemoryCounter    记忆晶体计数
 │    ├── OnboardingGuide  新手引导
 │    └── DistrictFilter   星系筛选
 │
 ├── PhoneApp             朋友圈浮层（iPhone 外观）
 │
 └── DeliberationUI       决策推演浮层
      ├── DeliberationGraph   推演脉络 Canvas
      └── DeliberationHistory 推演历史记录
```

### 全局状态 (Zustand)

`useNebulaStore.js` 管理所有应用状态，关键数据通过 localStorage 持久化：

| 状态域 | 说明 | 持久化 |
|--------|------|--------|
| 3D 交互 | 选中/悬停/聚焦 Agent、相机目标 | 否 |
| 记忆系统 | 记忆晶体三元组 `{source, relation, target}` | 是 |
| 朋友圈 | 用户资料、好友列表、点赞、评论 | 是 |
| 决策推演 | 推演会话、历史记录 | 是 |
| 模型配置 | API Key、模型选择 | 是 |

### 数据流

```
gameData.js (125 Agent + 13 星系 + 连线)
       │
       ▼
useForceGraph (物理模拟 → 动态坐标)
       │
       ▼
NebulaScene (渲染星体 / 连线 / 粒子)
       │
       ├── 用户点击/搜索 ──→ useNebulaStore ──→ AgentDetail 面板
       │
       ├── Agent 对话 ──→ memoryCrystal 提取 ──→ GrowingLines 金色连线
       │
       └── 决策推演 ──→ deliberationEngine ──→ modelConfig 调用 LLM
```

---

## 核心功能详解

### 星河探索

- **自由视角**：鼠标拖拽旋转、滚轮缩放、右键平移
- **自动旋转**：空闲时镜头缓慢环绕，点击任意节点停止
- **星系筛选**：点击底部星系标签，仅高亮该星系节点
- **搜索定位**：输入名字，镜头 GSAP 飞行动画到目标星体并高亮

### Agent 详情面板

点击任意星体弹出详情面板，包含：

- 基本信息（名字、头衔、描述、标签）
- 原创语录 / 核心观点
- 影响力卫星标签（如黄仁勋的 CUDA、DGX、GPU 算力）
- 一键跳转 Obsidian — 打开对应笔记
- 触发对话 — 自动提取记忆晶体

### 决策推演

1. 点击右下角「决策推演」按钮
2. 输入你的商业难题（如「我的 SaaS 产品增长停滞」）
3. 系统分析问题领域，智能匹配 3-5 位 Agent
4. Agent 多轮发言，实时显示在推演脉络图中
5. 完成后可查看推演历史、导出截图

设置面板支持：

- 切换大模型提供商（5 家可选）
- 输入 API Key（仅存储在本地，不上传服务器）
- 查看完整请求 JSON 预览（调试 API 格式）
- 一键测试连接（发送最小请求验证可用性）

### 朋友圈

- 点击右侧「朋友圈」竖排按钮展开
- 浏览 Agent 日常动态（每日刷新）
- 点赞 / 评论，Agent 会根据内容自动回复
- 评论中提及其他 Agent 会自动提取记忆晶体

### Demo 巡游

- 点击 Demo 按钮触发 60 秒星河巡游
- GSAP 镜头飞行，依次聚焦 6 位关键 Agent
- 金色脉冲球体 + 蝴蝶尾迹特效

---

## 多模型接入

### 配置方式

1. 点击决策推演面板的设置按钮
2. 选择模型提供商
3. 输入 API Key（仅存储在本地 localStorage）
4. 选择模型版本
5. 点击「测试连接」验证

### 支持的模型

| 提供商 | API 地址 | 模型 | 获取 Key |
|--------|----------|------|----------|
| 小米 MiMo | `api.xiaomimimo.com` | `mimo-v2-pro` / `mimo-v2-flash` | platform.xiaomimimo.com |
| 智谱 GLM | `open.bigmodel.cn` | `glm-5.1` / `glm-4.7` / `glm-4.6` | open.bigmodel.cn |
| DeepSeek | `api.deepseek.com` | `deepseek-chat` / `deepseek-reasoner` | platform.deepseek.com |
| Kimi | `api.moonshot.cn` | `moonshot-v1-8k/32k/128k` | platform.moonshot.cn |
| MiniMax | `api.minimax.chat` | `abab6.5s-chat` / `abab7-chat-preview` | platform.minimax.io |

### CORS 代理

GitHub Pages 等静态托管下浏览器直接请求外部 API 会触发 CORS 拦截。系统内置自动检测：

- `localhost` / `127.0.0.1` / `192.168.*` → 直连，无需代理
- 其他域名 → 自动启用 `corsproxy.io` 代理
- 可在设置面板手动覆盖代理地址

### 特殊适配

- **GLM-5.x / GLM-4.7 thinking mode**：自动添加 `thinking: { type: "disabled" }` 参数关闭思维链，并在响应解析时回退读取 `reasoning_content` 字段
- **API 并发限流**：多 Agent 推演使用 worker 池模式（默认 2 并发 + 1 次重试），避免超出 API 限流

---

## Obsidian 联动

FoldNeb 的 Web 数据与 Obsidian Vault 完全同构，点击 Agent 详情面板中的「Obsidian」按钮可直接跳转到对应笔记。

### Vault 结构

```
AI一人公司/
└── 11-黑客松大赛/折叠星云agent数据库/
    ├── 0_索引导航/          14 个文件（13 坊区索引 + 知识星图总览）
    ├── 1_智慧星河/          125 位 Tier-1（13 个数字前缀子目录）
    ├── 2_精英星团/          Tier-2（13 子目录，含 _旧版遗珍）
    ├── 3_叙事脚本/
    ├── 4_朋友圈/
    └── 过程文件/
```

### 跳转原理

通过 `obsidian://` URI 协议：

```
obsidian://open?vault=AI一人公司&file=11-黑客松大赛/折叠星云agent数据库/1_智慧星河/1-AI前沿/黄仁勋.md
```

`obsidianLink.js` 中实现了三级降级策略：

1. `window.open(uri)` — 首选方案
2. `window.location.href = uri` — 备用
3. 创建隐藏 `<a>` 标签点击
4. 复制 URI 到剪贴板 — 最终兜底

---

## 项目结构

```
foldneb/
├── public/                         # 静态资源
├── src/
│   ├── main.jsx                    # 入口
│   ├── App.jsx                     # 根组件
│   ├── index.css                   # 全局样式
│   │
│   ├── data/
│   │   ├── gameData.js             # 125 Agent + 13 星系 + 初始连线
│   │   └── agentMoments.js         # 朋友圈语料（167 条）
│   │
│   ├── store/
│   │   └── useNebulaStore.js       # Zustand 全局状态
│   │
│   ├── hooks/
│   │   └── useForceGraph.js        # 力导向布局物理引擎
│   │
│   ├── components/
│   │   ├── NebulaScene.jsx         # 3D 场景主容器
│   │   ├── AgentNode.jsx           # 星体节点（Canvas 纹理）
│   │   ├── AgentSatellites.jsx     # 卫星粒子
│   │   ├── InfluenceNebula.jsx     # 影响力星云
│   │   ├── ConnectionLines.jsx     # 连线系统
│   │   ├── GrowingLines.jsx        # 生长记忆金线
│   │   ├── DeepSpace.jsx           # 深空星 + 尘埃
│   │   ├── GalaxyAtmosphere.jsx    # 星系粒子雾
│   │   ├── DistrictGround.jsx      # 星系地面标记
│   │   ├── HeroSatellites.jsx      # 关键 Agent 特殊卫星
│   │   ├── SparkleField.jsx        # 闪烁粒子场
│   │   ├── Starfield.jsx           # 星场背景
│   │   ├── DemoController.jsx      # Demo 巡游特效
│   │   ├── DialoguePanel.jsx       # 对话面板
│   │   ├── NebulaUI.jsx            # 2D HUD 主界面
│   │   ├── SearchBar.jsx           # 搜索定位
│   │   ├── AgentDetail.jsx         # Agent 详情面板
│   │   ├── ConnectionDetail.jsx    # 连线详情
│   │   ├── MemoryCounter.jsx       # 记忆晶体计数
│   │   ├── MemoryGraph.jsx         # 记忆图谱可视化
│   │   ├── OnboardingGuide.jsx     # 新手引导
│   │   ├── PhoneApp.jsx            # 朋友圈浮层
│   │   ├── UserAvatar.jsx          # 用户分身节点
│   │   ├── DeliberationUI.jsx      # 决策推演界面
│   │   ├── DeliberationGraph.jsx   # 推演脉络 Canvas
│   │   ├── DeliberationHistory.jsx # 推演历史
│   │   ├── TextSprite.jsx          # 3D 文字标签
│   │   └── LinesLayer.jsx          # 连线分层管理
│   │
│   └── utils/
│       ├── modelConfig.js          # 多模型配置中心（5 家大模型）
│       ├── deliberationEngine.js   # 决策推演引擎
│       ├── deliberationDemos.js    # 推演 Demo 语料
│       ├── memoryCrystal.js        # 折叠记忆晶体提取
│       ├── obsidianLink.js         # Obsidian URI 跳转
│       ├── audio.js                # 音效系统
│       └── reportImage.js          # 报告截图导出
│
├── index.html                      # HTML 入口
├── vite.config.js                  # Vite 配置（base: './'）
├── tailwind.config.js              # TailwindCSS 配置
├── package.json
└── README.md
```

---

## 部署指南

### GitHub Pages

```bash
# 构建并部署
npm run build
npx gh-pages -d dist
```

项目已配置 `base: './'`（相对路径），适配 GitHub Pages 子目录托管。

### 其他静态托管

```bash
npm run build
# 将 dist/ 目录上传到任意静态服务器
```

---

## 版本历史

| 版本 | 主要内容 |
|------|----------|
| **初始化** | 黑客松竞赛项目初始化，确定 FoldNeb 折叠星云方向 |
| **V1.0** | 完整构建（6 个 Phase 全部完成）：基础 3D 星河可视化、星体渲染、相机交互 |
| **V2.0** | 重大升级：125 Agent 星体扩展 + 力导向布局 + FoldNeb 折叠星云视觉重构 + Obsidian 关联跳转 + GitHub Pages 部署 |
| **V2.1** | 功能集成：朋友圈社交系统 + 决策推演引擎 + 多模型 API 系统 + CORS 代理支持 + 错误信息透传到 UI |
| **V2.2** | 模型优化：DeepSeek 设为默认 + 清理失效端点 + 智谱 Coding Plan 专属端点（GLM-4.7 / 4.6 / 4.6v）+ 无 Key 提前拦截 |
| **V2.3** | 体验打磨：打字机语录逐字气泡 + 右侧面板信息密度提升 + 小米 MiMo 接入 + GLM-5.1 thinking 模式适配 + 推演脉络字体变形修复 + 请求 JSON 预览 / 测试连接 + API 并发限流修复 |

---

## 许可证

MIT
