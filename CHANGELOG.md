# Changelog · FoldNeb 折叠星云

## V4.9 — 开发进度 90% + 「开发中」收纳文件夹 + 巡游默认静音 (2026-06-14)

工具栏按钮过多，未完善功能（旁白/截图/场景Demo/调试）干扰主流程。本版本做收纳 + 静音：右上角新增橙色「开发中」下拉文件夹，工具栏精简为 4 个主流程按钮，星河巡游默认不播放声音。

### 核心改动

#### 1. 开发进度条 84% → 90%（`NebulaUI/DevProgressBar.jsx`）
- 像素点亮数 `i < 8` → `i < 9`，head 位置 `i === 7` → `i === 8`，文案 `84%` → `90%`

#### 2. 新建「开发中」收纳文件夹（`NebulaUI/DevFolder.jsx`）
- 右上角橙色「🚧 开发中 ▼」下拉按钮（`position: fixed; top: 24; right: 24`）
- 收纳 4 项：🔇/🔊 旁白（toggleNarration）/ 📸 截图（takeScreenshot，成功后 1.6s 自动收起）/ 🎬 场景 Demo（回调打开 ScenarioDemos）/ 🔧 调试（回调打开 DebugPanel）
- 点击外部自动收起（mousedown + ref contains）

#### 3. 工具栏精简（`NebulaUI.jsx`）
- 移除 3 个按钮：🎬 场景 Demo / 📸 截图 / 🔇 旁白
- 移除对应 store 订阅（narrationEnabled / toggleNarration / takeScreenshot / screenshotReady）
- 保留主流程：✨ 星河巡游 / 🪐 创建分身 / 🗂️ 十三星系 / 🔍 搜索

#### 4. DebugPanel 重构为受控组件（`NebulaUI/DebugPanel.jsx`）
- 删除自带触发按钮，改为接受 `open` / `onClose` props
- 由 DevFolder 的「🔧 调试」项触发，NebulaUI 统一管理 `debugPanelOpen` state

#### 5. 星河巡游默认静音（`store/useNebulaStore.js`）
- `narrationEnabled` 默认值 `true` → `false`
- 语音旁白 TTS 效果未调好，默认关闭；用户仍可从「开发中」文件夹手动开启

### 取舍决策
| ✅ 做 | ❌ 不做 |
|-------|---------|
| 未完善功能收纳到右上角文件夹 | 直接删除旁白/截图功能（后续要调） |
| DebugPanel 改受控，统一开关态 | 保留 DebugPanel 自带按钮（会和文件夹重复） |
| narrationEnabled 全局默认 false | 仅在 runDemo 内禁音（用户巡游外也想静音） |

---

## V4.8 — 转场精简 + autoStart 修复 (2026-06-14)

本版本是对 V4.7「双场景 Demo 横纵联动」的衔接性能修复。Demo 完成后的转场动画被移除，改为直接面板切换，autoStart 链路从异步打字机改为同步赋值 + setTimeout 启动。

### 核心改动

#### 1. 删除转场动画组件（`DeliberationTransition.jsx` 不再渲染，文件保留）
- `DeliberationUI.jsx`：移除 `import DeliberationTransition`、移除 `showTunnel` state、移除两处 `{showTunnel && <DeliberationTransition />}` 渲染
- `handleLaunchTemporal` 简化：`closeDeliberation()` → `clearDeliberationAutoChain()` → `openTemporalWithPrefill(prefill, { autoStart })`，三行同步调用，无 setTimeout/隧道延迟

#### 2. TemporalDeliberation autoStart 链路简化
- 移除 `typeProfileField` 异步打字机回调（`src/components/TemporalDeliberation.jsx` 第 77-92 行）
- autoStart IIIF 从「逐字段打字 + sleep → startRef」改为「`setProfile` 直接赋值 → `setTimeout(150ms)` → `startRef.current()`」
- effect 依赖数组移除 `typeProfileField`

### 已知问题
⚠️ **场景 Demo → 时间折叠自动衔接偶尔不触发**：`startRef` 闭包与 React 状态更新时序存在竞态，150ms setTimeout 可能不够可靠。面板能正常打开+预填，但折叠不自动开始。下一版本需用 zustand 订阅或 `flushSync` 彻底解决。

### 取舍决策
| ✅ 做 | ❌ 不做 |
|-------|---------|
| 移除转场动画，改为直接衔接 | 追查 autoStart 深层竞态（先确保面板打开畅通） |
| 简化 autoStart 为同步赋值 + setTimeout | 重写 startTemporal 签名（改动太大） |
| 保留 `DeliberationTransition.jsx` 源文件 | 删除文件（可能后续恢复） |

---

## V4.7 — 知识资产价值面板 + 商业叙事立柱 (2026-06-14)

本版本是**黑客松收尾档**：把「知识星图市场 — AI 时代知识交易平台雏形」这个叙事彻底立住。底层基础设施（分身/星球/推演/朋友圈/Obsidian）已全部就位，本版本只做**叙事点破 + 价值可视化**，不再加新大功能（守住「尖锐卖点 × 极致完成度」原则）。

### 核心改动

#### 1. 星球价值面板（`PlanetExtras.jsx` · `PlanetValuePanel`）
每颗知识星球详情页顶部新增**知识资产价值可视化**模块，基于 posts 真实数据实时计算，无后端依赖：
- **4 个核心指标**：知识卡片数 / AI 衍生次数 / 平均深度（字数）/ 活跃指数（综合分）
- **5 维 SVG 雷达图**：产出 / AI 协作 / 深度 / 频率 / 广度（含网格、轴线、数据多边形、顶点标签）
- **智能判语**：🔥 高价值（≥70）/ ✨ 成长中（≥35）/ 🌱 新生（<35）
- **价值公式注脚**：知识价值 = 产出 × AI 衍生 × 连接 × 时间复利

这是《知识星球商业化战略分析-V4.5》报告判定的**唯一 Tier-1 功能级强加分项**，把「知识资产化」从叙事变成可演示的功能。

#### 2. README 商业叙事三段升级（`README.md`）
- **顶部「这是什么 — 你的 3D 思考舱」三场景卡片**：做决策时 / 迷茫时 / 学习时，评委第一眼就能理解项目用途
- **亮点第 12 条「知识星图市场 — AI 时代知识交易平台雏形」**：三层跃迁表（知识形态 / 价值放大 / 消费方式 / 资产形态），传统知识星球 vs FoldNeb
- **压轴「🚀 商业化愿景与路线图」**：已有能力在平台叙事中的角色表 + 协同地图 ASCII + 三阶段路线图 + 金句收尾

#### 3. 星球板块文案呼应叙事（`PlanetExtras.jsx` · 5 处）
- 发表 → **铸造**（按钮）
- 创建 → **开垦**（按钮 + Modal 标题「开垦知识星域」）
- 发表到「星球」→ **铸造知识卡片到「星球」**（ComposePost 标题）
- 知识星球 → **知识星图市场**（列表页 Banner 标题）
- 副文案升级为「每颗星球都是可视化生长的知识资产」

### 取舍决策
| ✅ 做 | ❌ 不做 |
|-------|---------|
| 价值面板（Tier-1 强加分） | 流式响应改造（大工程，收尾翻车风险） |
| README 商业叙事三段 | Agent 辩论引擎（稀释主线） |
| 文案呼应叙事 | 概率化未来矩阵（同上） |
| 错误提示体面化（验证 V3.0+ 已全面实现） | 真支付/账户系统（静态托管做不了，mock 当场穿帮） |
| | HUD 定位浮层（README 已覆盖，违背极致完成度） |

### 经验教训
- **63**. 黑客松收尾阶段 = 尖锐卖点 × 极致完成度，绝不再加新大功能，只拉满叙事和完成度

---

## V4.6 — 月球公转轨道 + 星空定位 (2026-06-14)

V4.5 的知识星球月球是静态环绕，本版本让月球**动态公转**并支持从手机端**一键定位到星空中的月球**。

### 核心改动

#### 1. 月球公转轨道系统（`UserPlanets.jsx`）
- 抽取共享公式 `moonOrbitSpeed(index)` / `moonOrbitRadius(index)`（内圈快外圈慢，开普勒感）
- MoonNode 改为动态公转：`angle = baseAngle + elapsedTime * orbitSpeed`，统一轨道平面 `y = py + 1.2`
- 新增 `OrbitRings` 组件：跟随分身位置画半透明轨道环（按 radius 去重避免重叠）
- 导出 `calcMoonWorldPos()` 供 CameraController 每帧重算月球世界坐标，保证公转与相机聚焦同步

#### 2. 星空定位月球（跨手机端 ↔ 3D 联动）
- `useNebulaStore.js`：新增 `focusPlanetId` state + `focusPlanet` / `clearFocusPlanet` action（设置时关闭自动旋转）
- `NebulaScene.jsx::CameraController`：focusPlanetId 变化时 gsap 推近镜头到月球位置，useFrame 中 `target.lerp` 跟随公转中的月球
- `UserPlanets.jsx::MoonNode`：聚焦时 emissive 冷月光蓝白发光（`#b8d4ff`）+ 脉动光环，确保用户在星空中一眼锁定
- `PlanetExtras.jsx::PlanetDetailScreen`：封面区新增「🛰️ 在星空中定位这颗月球」按钮，点击 `focusPlanet + closePhone`

#### 3. 月球配色统一冷月光色
- 聚焦发光、脉动光环、轨道环从紫色统一为冷月光蓝白，更贴近真实月球质感

### 修改文件清单

- `src/components/UserPlanets.jsx`：公转公式 + MoonNode 动态公转 + OrbitRings + calcMoonWorldPos 导出 + 冷月光配色
- `src/components/NebulaScene.jsx`：import calcMoonWorldPos + CameraController 聚焦动画 + useFrame 跟踪
- `src/components/PlanetExtras.jsx`：PlanetDetailScreen 定位按钮
- `src/store/useNebulaStore.js`：focusPlanetId state + focusPlanet/clearFocusPlanet action

---

## V4.5 — 知识星球·仿知识星球沉淀个人知识 (2026-06-14)

新增「知识星球」板块：用户可注册自己的星球（在 3D 星空中化作环绕分身的灰白月球天体），发布文字内容，星主既可手动发表，也可让 AI 自动生成。

### 核心改动

#### 1. 知识星球 3D 月球天体（`UserPlanets.jsx` 新增）
- 用户创建的每颗星球在 3D 星空中以**不发光的灰白月球**形态渲染，环绕用户分身节点轨道分布
- **程序化月球纹理**（`createMoonTexture`）：512×512 Canvas 绘制灰白渐变底色 + 6 块月海暗斑 + 24 个带高光边的中型陨石坑 + 60 个小陨石坑点缀
- 材质：`meshStandardMaterial` color #dcdce2，roughness 0.95，metalness 0，**emissive 黑色零自发光**，完全依靠场景自然光照
- 缓慢自转 + 按 `orbitAngle` 均匀分布在半径 3.5~4.7 的环带上
- 点击月球直接打开手机端对应星球详情页

#### 2. 手机端「知识星球」Tab（`PhoneApp.jsx`）
- 底部 TabBar 新增第 4 个 Tab「星球」（朋友圈 / 通讯录 / **星球** / 我）
- 顶部标题栏同步增加「知识星球」标题
- 内容区根据 `currentPlanetId` 切换：null 显示星球列表，有值显示对应星球详情页

#### 3. 星球列表页（`PlanetExtras.jsx::PlanetListScreen`）
- 顶部深色 Banner：标题「🪐 知识星球」+ 创建按钮
- 星球卡片：左侧灰白月球质感圆形头像（`radial-gradient` 模拟立体球面 + inset shadow）+ 右侧名称/简介/篇数 + 删除入口
- 空态提示：「还没有自己的星球」

#### 4. 星球详情页（`PlanetExtras.jsx::PlanetDetailScreen`）仿知识星球
- 深色渐变封面（星球 emoji + 名称 + 简介 + 创建日期 + 篇数）
- 右上角「✎ 发表」绿色按钮
- 内容流：左头像 + 作者名/时间 + 正文，AI 生成的内容带「AI 生成」橙色标签
- 挂载时自动复位滚动位置

#### 5. 创建星球浮层（`PlanetExtras.jsx::CreatePlanetModal`）
- 12 个星球 emoji 候选（🌑🌒🌓🌔🌕🌖🌗🌘🌙🪐☄️🌍）单选
- 名称输入（≤20 字）+ 一句话简介（≤80 字，选填）
- 底部上滑浮层 + 「完成」按钮创建后直接进入新星球详情页

#### 6. 发布内容（`PlanetExtras.jsx::ComposePlanetPost`）双形式
- **手动发表**：textarea 输入（≤500 字），「发表」按钮
- **AI 生成**：「✨ 让 AI 替我生成一篇」按钮，调用本地 6 条主题模板（基于星球名生成思考笔记），800ms 模拟生成延迟后自动发布，标记 `source:'agent'` + 作者「AI 星主助理」

### 修改文件清单

- `src/components/UserPlanets.jsx`（新增）：MoonNode + createMoonTexture + UserPlanets 主组件
- `src/components/PlanetExtras.jsx`（新增）：PlanetListScreen / PlanetDetailScreen / CreatePlanetModal / ComposePlanetPost / PlanetPostCard / SubNavBar
- `src/components/NebulaScene.jsx`：import UserPlanets + 在 CustomCloneNode 后渲染 `<UserPlanets>`
- `src/components/PhoneApp.jsx`：import Planet 组件 + 拉 currentPlanetId + 顶部标题/内容区/TabBar 三处接入「星球」
- `src/store/useNebulaStore.js`：新增 `userPlanets` / `planetPosts` / `currentPlanetId` state + `createPlanet` / `deletePlanet` / `setCurrentPlanet` / `addPlanetPost` / `deletePlanetPost` 5 个 action（均持久化到 localStorage）
- `src/index.css`：新增 `@keyframes fnSheetUp` 底部弹层上滑动画

---

## V4.4 — 朋友圈大版本·仿微信完整社交闭环 (2026-06-14)

朋友圈从「只读 Agent 动态」升级为**用户也能参与**的完整社交闭环：搜索 Agent、点开头像看主页、发布朋友圈并收获 agent 自动回复。

### 核心改动

#### 1. Agent 搜索（`PhoneApp.jsx`）
- **顶部搜索框**：`tier1Agents.filter(a => a.name.includes(keyword))` 覆盖全星河 agent（不止已加好友）
- 下拉结果卡片显示头像 + 名称 + 状态
- 点击直接进入 `AgentDetailScreen`，并清空搜索词

#### 2. Agent 个人主页（`MomentsExtras.jsx::AgentDetailScreen`）仿微信设计
- **入口**：朋友圈卡片头像/昵称可点击 + 通讯录头像可点击 + 搜索结果点击
- **页面结构**：sticky 顶部导航（‹ 返回 / Agent 名 / + 关注按钮）+ 渐变封面 + 大头像 + 基本信息 + 描述
- **今日动态**：`getTodayPosts(agentId)` 列出该 Agent 今天发布的所有帖子
- **「🌌 在星河中查看详情 →」按钮**：`focusAgent + selectAgent + closePhone`，一键跳到 3D 星河详情页

#### 3. 我的朋友圈主页（`MomentsExtras.jsx::UserMomentsScreen`）
- **入口**：朋友圈封面左下角「我的头像」可点击
- 页面展示我所有已发布动态（`userPosts`），样式同朋友圈卡片
- 空态提示：「还没有发布过动态，返回朋友圈点右上角相机发布吧 ✨」

#### 4. 发布朋友圈浮层（`MomentsExtras.jsx::ComposePost`）仿微信设计
- **入口**：朋友圈封面右上角相机按钮（毛玻璃半透明 SVG）
- **顶部导航**：取消 / 这一刻的想法… / 发表按钮（绿底 `#07C160`，禁用态灰）
- **文本输入**：textarea 最大 200 字，autofocus
- **配图选择**：12 个表情 emoji（🌟🌙🔥💡🌊🏔️🦋☕📚🎯♾️ + 不配图），点击切换
- **提示**：「✨ 发布后，1-2 位你已添加的好友会给你点赞或评论」

#### 5. 发布后 agent 自动反应（`MomentsExtras.jsx::triggerAgentReactions`）
- 从 `friends` 数组随机抽 1-2 位（`Math.random() < 0.6` 决定是否抽第 2 位）
- 每位随机选**评论**（10 条内置模板，如「说得真好，我深有同感。」）或**点赞 emoji**（👍❤️🌟✨）
- 错峰延迟：`600 + i*800 + random*600` ms，模拟真人阅读思考节奏
- 调用 `addUserReaction(postId, ...)` 写入 `userReactions`

### 修改文件清单

- `src/components/PhoneApp.jsx`：搜索框 + Agent 头像可点 + 我的头像入口 + 相机发布按钮
- `src/components/MomentsExtras.jsx`（新增）：UserPostCard / AgentDetailScreen / UserMomentsScreen / ComposePost / triggerAgentReactions
- `src/data/agentMoments.js`：可能补充了用户帖子的反应模板数据
- `src/store/useNebulaStore.js`：新增 `userPosts` / `userReactions` / `addUserPost` / `addUserReaction` / `deleteUserPost` / `deleteUserReaction` / `momentsViewer` / `setMomentsViewer` 等

---

## V4.3 — 档案时间线 + 宽屏适配 + API 统一 (2026-06-14)

情报分析升级为**时间线折叠结构**，档案 Modal 适配宽屏，API 配置统一到决策推演共享的 Provider 机制。

### 核心改动

#### 1. 情报分析时间线化（`gameData.js` 数据结构改造）
- `recentAnalysis: { 单对象 }` → `analysisHistory: [ 数组 ]`（最新情报置顶）
- 黄仁勋首批 2 条情报：
  - **2026-06-14**（新）：Computex 2026 触发，H200-China + NIM Robotics + CUDA 物理世界 OS 叙事
  - **2026-04-20**（历史）：原版情报保留
- 支持按日期粒度折叠/展开（`expandedHistory` state 控制每条历史的展开态）

#### 2. 档案 Modal 宽屏优化（`index.css` + `NebulaUI.jsx`）
- **滚动根因修复**：右栏整体 `position: sticky; top: 0` 导致左右两栏独立滚动 → 改为只 sticky 顶部 `.archive-skill-bar`（工具条钉顶但不钉整栏）
- **Skill 管理面板展开时动态取消 sticky**：大 textarea 被钉顶工具条遮挡 → 展开时 className 切换取消 sticky
- **宽屏断点** `@media (min-width: 1280px)`：Modal max-width 撑到 1160px / font-size 收紧到 12px / 两栏比例改 `1.15fr / 0.85fr`
- **模块 Grid 自适应**：左栏 4 个模块（核心档案/原创语录/核心思想/影响力卫星）包进 `.archive-modules-grid`（`auto-fit minmax(220px, 1fr)`）

#### 3. API 配置统一到决策推演 Provider（`analysisApi.js`）
- 删除独立配置：`CONFIG_KEY` / `DEFAULT_CONFIG` / `getApiConfig` / `saveApiConfig` / `isApiConfigured`
- 新增 `getArchiveProvider()` / `setArchiveProvider(pid)`（localStorage key: `foldneb_archive_provider`）
- `generateBusinessAnalysis` 改用 `getEffectiveConfig(provider)` + `getCorsProxyUrl()` 统一调用链
- corsproxy.io 时自动加 `X-Requested-Headers` 头
- `NebulaUI.jsx` API 配置表单替换为 `<ApiSettingsPanel>`（与决策推演同一组件）

### 修改文件清单

| 文件 | 改动 |
|------|------|
| `src/data/gameData.js` | `recentAnalysis` → `analysisHistory` 数组 + 新增 2026-06-14 情报 |
| `src/components/NebulaUI.jsx` | 新增 `expandedHistory`/`archiveProvider` state + 动态 `.archive-skill-bar` + `.archive-modules-grid` + 时间线渲染 + `ApiSettingsPanel` |
| `src/index.css` | 删除右栏 sticky + 新增 `.archive-skill-bar` + `.archive-modules-grid` + `.analysis-timeline-*` + `@media (min-width: 1280px)` |
| `src/utils/analysisApi.js` | 删除独立配置 + 新增 `getArchiveProvider`/`setArchiveProvider` + 改用 `getEffectiveConfig`/`getCorsProxyUrl` |

### 关键经验教训

52. **sticky 定位的"整栏钉顶"陷阱**：右栏整体 `position: sticky; top: 0` 会让该栏内容溢出时独立滚动，与左栏不同步。正确做法是只 sticky 顶部工具条（`.archive-skill-bar`），整栏让外层容器统一滚动
53. **sticky 工具条与展开面板的冲突**：Skill 管理面板展开后大 textarea 高度增加，sticky 工具条会遮挡内容。解决方案是面板展开时动态切换 className 取消 sticky，收起后恢复
54. **API 配置应该全平台共享而非每模块独立**：档案页和决策推演用同一套 Provider 机制（`getEffectiveConfig`），用户配一次密钥两边可用。避免「每加一个 AI 功能就加一套密钥配置」的重复

---

## V4.2 — Skill 化：用户可编辑的商业分析能力 + Obsidian 本地留痕 (2026-06-14)

把「AI 商业情报分析」从硬编码 prompt 升级为**用户可编辑、可新增、可切换的 Skill 系统**，并实现三渠道本地留痕。

### 新增文件
| 文件 | 职责 |
|------|------|
| `skills/商业动态逻辑情报虾.md` | 内置 Skill 原版正文（项目内权威源 + 版本控制） |

### 核心改动

#### 1. Skill 数据化 + localStorage CRUD（`utils/analysisPrompt.js` 重写）
- 内置 skill 提为可编辑数据结构（`id`/`name`/`emoji`/`description`/`prompt`/`builtin`/`builtin_edited`）
- 占位符 prompt：`{{agent.name}}` `{{agent.title}}` `{{agent.description}}` `{{agent.philosophy}}`，生成时按当前人物替换
- 全套 CRUD：`getSkills` / `saveSkills` / `addSkill` / `updateSkill` / `deleteSkill`（内置不可删）/ `resetBuiltinSkill`（恢复原版）/ `getActiveSkill` / `setActiveSkillId`
- `skillToMarkdown` 导出（供 Obsidian 留痕）

#### 2. 动态 system prompt（`utils/analysisApi.js`）
- `generateBusinessAnalysis` 改用 `buildAnalysisPrompt(agent)` 按当前激活 skill 构建 system prompt
- 三层框架（结构 / 逻辑 / 未来）+ 风格指南（看透本质 / 提前半步 / 可迁移模型 / 短句有力）+ 受众目标 + 核心能力圈 全部注入

#### 3. Skill 管理面板（`NebulaUI.jsx`）
- 右栏标题动态品牌名（`🦐 商业动态逻辑情报虾`）+ 「Skill 库 ▼」入口按钮
- **列表态**：每个 skill 一张卡片（设为当前 / ✎ 编辑 / ⬇ 导出 md / ✕ 删除），底部 + 新建 Skill / ↺ 重置内置
- **编辑态**：emoji / 名称 / 描述 / **prompt 大文本框**（240px，等宽字体）+ 占位符提示 + 保存/取消
- 生成按钮文案动态：`🦐 商业动态逻辑情报虾 · 一键生成`

#### 4. 本地留痕（三渠道）
| 渠道 | 用途 |
|------|------|
| `foldneb/skills/*.md` | 项目内权威源，随 git 版本控制 |
| Obsidian vault `5_skill库/*.md` | iCloud 同步，Obsidian 可检索 |
| 运行时「⬇ 导出 md」 | 用户自定义 skill 实时导出（下载文件 + 复制剪贴板） |

### 附：V4.1 思想者深度档案（前置工作，commit 3a2f33f）
- `gameData.js` 黄仁勋/马斯克新增 6 类深度字段：`bio`(传记多段) / `timeline`(时间轴) / `philosophy`(核心思想) / `quotes`(语录+背景) / `works`(代表作) / `legacy`(影响启示)
- `NebulaUI.jsx` Modal 全新渲染：6 大版块带视觉分隔（左竖条 + 英文副标题 + 渐变背景）
- graceful fallback：无深度字段 agent 仍显原 description + dialogue，不破坏
- 按钮文案差异化：有 bio 显「📖 查看深度档案」，无则「📄 查看完整档案」

---

## V3.3 —— 朋友圈接入大模型：✦ AI 对话模式 (2026-06-14)

核心 Agent 朋友圈接入大模型，新增 **Demo / ✦ AI 双模式切换** 与 **VIP 标识符**（会员认证风格）。

### 新增文件
| 文件 | 职责 |
|------|------|
| `utils/agentReplyEngine.js` | 朋友圈 Agent LLM 回复引擎：人设 prompt + API 调用 + 柔和降级 |

### 核心改动

#### 1. Agent 朋友圈 LLM 回复引擎（`agentReplyEngine.js`）
- **16 位核心 Agent 名单**（`LLM_AGENT_IDS`）：庄子/王阳明/马斯克/黄仁勋/Sam Altman/Kevin Kelly/Paul Graham/梁文锋/雷军/张一鸣/Peter Thiel/Naval/塔勒布/芒格/孙子/张小龙
- **`isLLMAgent(id)`**：判断 Agent 是否接入大模型（驱动 VIP 徽标显隐）
- **`buildAgentSocialPrompt()`**：融合 `agents.js` 人设（bio/style）+ `agentMoments.js` 发帖语料 + 回复样本，构建专属 System Prompt
- **`generateAgentReply()`**：异步调用大模型生成回复；**柔和降级**——非 LLM Agent / API 未就绪 / 超时 → 自动回落关键词匹配
- 复用 `callLLMWithProvider`（CORS 代理、超时、错误处理），朋友圈专用 **12s 超时 + 200 token**

#### 2. 状态层（`useNebulaStore.js`）
- 新增 `momentsMode`（`'demo'` | `'api'`）状态 + `setMomentsMode` action，持久化到 localStorage
- `addReply` 新增 `opts.skipAutoReply` 参数：UI 层统一接管 Agent 回复，消除 store 与 UI 双重回复

#### 3. 手机端（`PhoneApp.jsx`）
- **`VipBadge` 组件**：金色渐变 ✦ 徽标（会员认证风格），紧贴昵称显示
- **`ModeToggle`**：朋友圈顶部「Demo 演示 / ✦ AI 对话」分段切换按钮
- **API 模式状态条**：显示当前模型、Key 配置状态、「去配置」入口
- **`ApiSettingsOverlay`**：复用决策推演的 `ApiSettingsPanel`，深色浮层内嵌，支持切换 5 个 provider
- **`MomentCard.submitReply` 改为异步**：api 模式调大模型（带对话历史 + 帖子上下文），随机延迟模拟真人阅读
- **回复来源标识**：金色边框 + 「✦ AI 生成」/「⚠ 降级」徽标
- VIP 徽标覆盖三处：朋友圈卡片昵称、通讯录昵称、回复区昵称
- 通讯录统计「✦ N 位已接入 AI」

### 体验流程
1. 默认 **Demo 演示**模式 → 关键词匹配（与原行为一致，零成本）
2. 切到 **✦ AI 对话**模式 → 首次自动弹出 API 配置浮层（复用已配置的 Key）
3. 给带 ✦ 的核心 Agent 发评论 → 大模型以其人设风格回复，附「✦ AI 生成」标识
4. 非 VIP Agent 或 API 失败 → 自动降级关键词匹配并提示

### 凭据共享
API 配置与决策推演共用同一份 localStorage 凭据，配一次两边都能用。

---

## V3.2 —— 因果回溯引擎 (2026-06-14)

### 新增：因果回溯引擎（`causalTrace.js`）
纯计算模块（无 LLM 调用），基于已生成的 selves/letters/crossReviews/matrix，反向追溯每个锚点判断的因果链：

| # | 功能 | 描述 |
|---|------|------|
| 1 | **traceAnchor** | 对单个锚点做因果回溯：赞同方 + 反对方各有的 keyEvents/letterExcerpt/mindset 证据 |
| 2 | **traceAllAnchors** | 批量回溯所有锚点 |
| 3 | **compareAnchorTraces** | 对比两个锚点的因果链差异（分叉对比场景复用） |

### 新增：因果回溯面板（AnchorCard 内联 + CausalTracePanel）
- 锚点矩阵卡片可点击展开 → 显示该判断的因果回溯详情
- 两列布局：👍 支持方（谁、经历了什么、信件节选）vs 👎 反对方
- 💬 相关跨时间互评关联展示
- causalSummary 一句话因果总结（如 "3年·5年 支持；1年反对 — 经历了不同事件"）

---

## V3.1 —— 分叉对比引擎 + 追问对话 (2026-06-14)

### 新增：分叉对比引擎（`forkEngine.js`）
对多条替代决策路径分别跑完整时间折叠，对比终局评分：

| # | 功能 | 描述 |
|---|------|------|
| 1 | **exploreFork** | 对单条替代路径跑完整四阶段时间折叠（90% 复用 temporalEngine） |
| 2 | **compareForks** | 并行对比 2-4 条路径，按终局评分降序排列 |
| 3 | **computeTimelineScore** | 基于锚点矩阵 verdict + confidence 计算 0-100 终局评分 |
| 4 | **generateCompareReport** | 提炼对比洞察：最佳 vs 最差路径的差异锚点 |

### 新增：分叉对比面板（TemporalDeliberation ForkCompareSection）
- 时间折叠完成后的锚点矩阵底部：「🔄 分叉对比」可展开区块
- 输入替代路径（逗号或换行分隔）→ 点击"开始分叉对比"
- 结果面板：排行榜（柱状图 + 评分）+ 计数器（do/longterm/beware/avoid）+ 对比洞察报告
- 每条替代路径约 5 次 LLM 调用（复用时间折叠管线，无需额外配置）

### 新增：未来自我追问对话（LetterCard 内联聊天）
- 每封信件卡片底部「💬 追问X年」按钮 → 展开内联聊天面板
- 追问时 system prompt 注入该时间点的完整人格快照（mood/keyEvents/mindset/tone）
- 用户输入 → LLM 以「已活过那段」的未来身份回答

---

## V3.0 —— 时间折叠：与未来的自己对话 (2026-06-13)

新增**纵向时间轴推演**，与横向「决策推演」正交：同一个「我」在 1年/3年/5年/10年后回看现在的决策。

### 新增文件
| 文件 | 职责 |
|------|------|
| `utils/temporalEngine.js` | 时间折叠引擎：生成未来自我 → 写信给过去 → 跨时间互评 → 锚点矩阵 |
| `components/TemporalDeliberation.jsx` | 时间折叠主面板（档案输入 + 信件流 + 互评 + 锚点矩阵） |
| `components/TemporalSubViews.jsx` | 子组件：IdleForm/RunningView/LetterCard/CrossReviewCard/AnchorCard |
| `components/TimelineGraph.jsx` | Canvas 2D 时间轴可视化（Y轴锁时间、X轴力导向） |

### 引擎四阶段流程（`temporalEngine.js`）
1. **generateFutureSelves** — 基于用户现状档案，一次 LLM 调用产出 4 个人格快照（1/3/5/10年），每人含 mood/keyEvents/mindset/tone/stance
2. **writeLetterToPast** — 每个时间点的「我」给现在的自己写信，标记 sentiment（support/warn/reframe/letgo）
3. **crossTimelineReview** — 未来的不同版本之间互评（1年↔10年、3年↔5年），制造远近距离的对话与分歧
4. **buildAnchorMatrix** — 收束成「时间锚点矩阵」：每个选择按 do/beware/longterm/avoid 分类，带跨时间一致性 confidence

### 时间轴可视化（`TimelineGraph.jsx`）
- **Y 轴锁定时间顺序**：10年在顶、现在在底；**X 轴力导向游走**（节点水平排斥 + 中心引力）
- 节点颜色 = 信件 sentiment；连线颜色 = 互评 agreement（agree=绿/disagree=红/partial=灰虚线）
- hover 节点显示信件摘要

### 入口与共享
- 入口按钮与「决策推演」并列（右下角按钮组：⏳时间折叠 / ⚡决策推演）
- 时间折叠复用决策推演配置的 API Key（两者共享 `modelConfig` 凭据）
- `index.css` 新增 `spin`/`fadeIn` keyframes

### 技术细节
- provider 与决策推演共享（默认 `getDeliberationProvider()`），亦提供独立 `setTemporalProvider`
- store 扩展 `temporalOpen/temporalPhase/temporalSession` + `patchTemporalSession`

### API 失败明示错误（移除静默兜底，杜绝"瞎说"）
- `modelConfig.js` 新增 `LLMUnavailableError` 错误类 + `getApiErrorMessage()`（从最近一次调用错误中取真实信息：超时/网络/CORS/HTTP 4xx）
- 引擎层（temporalEngine 4 处 / deliberationEngine 4 处 + getAgentResponse）API 失败时**抛 `LLMUnavailableError`**，不再静默走 `getFallbackXxx()` 编造内容
- `getAgentResponse` 失败标记 `{ text:'', failed:true, error }`，不再伪装成"XX 沉默了片刻"
- UI 层 try/catch 捕获 `LLMUnavailableError`，显示真实原因（如「折叠中断：[GLM-5] 请求超时 (30s)…」）
- 批量重试检测从「包含'沉默'字符串」改为 `failed` 标记；单轮全部失败时立即中断并报错
- Demo 模式不受影响（仍走 fallback 假数据，面板显示绿色「🎬 演示数据」横幅）

---

## V2.4 —— Zep 风格推演图谱 (2026-06-13)

### 推演图谱增强（`DeliberationGraph.jsx`）
| # | 功能 | 描述 |
|---|------|------|
| 1 | **节点出生弹性动画** | 新节点出现时用 easeOutBack 曲线（0→1.15→1.0）弹性生长，伴随向外扩散的光环 |
| 2 | **全连线粒子流** | 所有连线都有流动粒子（原仅洞察连线）；connection 类型粒子更淡更小 |
| 3 | **节点点击交互** | 点击图谱节点 → `onSelectNode` 回调，弹出该 Agent 的详情面板 |
| 4 | **hover 高亮** | 鼠标悬停节点时放大 1.25 倍 + 白色外圈描边，指针变手型 |

### 推演面板（`DeliberationUI.jsx`）
| # | 功能 | 描述 |
|---|------|------|
| 5 | **节点详情面板** | 右侧图谱下方固定面板，显示选中 Agent 的身份 + 各轮推演发言（彩色圆点+轮次标签） |

### 记忆晶体图谱（`MemoryGraph.jsx`）
| # | 功能 | 描述 |
|---|------|------|
| 6 | **关系类型多色映射** | 连线按关系类型上色：关注=蓝、认同=绿、共鸣/影响=紫、辩论/反对=红、知识延伸=青 |
| 7 | **无边描节点** | 去掉白色描边，改用柔和外发光（kg-visualizer 风格） |
| 8 | **hover 聚焦** | 悬停节点时相关连线高亮、无关节点/连线变暗 |
| 9 | **点击关系详情** | 点击节点弹出该 Agent 与所有人的关系列表（彩色标签+交互次数） |

### 技术细节
- `easeOutBack` 弹性曲线 + `bornAt` 时间戳驱动 600ms 出生动画 + 800ms 扩散光环
- `selectedNodeRef`/`hoverRef` 用 ref 传递到 requestAnimationFrame 闭包，避免 prop 闭包过期
- `withAlpha()` 统一 hex+alpha 颜色拼接，兼容 rgba 连线绘制
