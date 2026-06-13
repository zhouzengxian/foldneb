# Changelog · FoldNeb 折叠星云

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
