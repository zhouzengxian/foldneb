// ============================================================
// Skill 库 · 商业动态逻辑情报虾（内置）+ 用户自定义
// ============================================================
// 每个 skill 是一段「大模型 system prompt 模板」，支持占位符：
//   {{agent.name}}  {{agent.title}}  {{agent.description}}  {{agent.philosophy}}
// 用户可在 UI 右栏「Skill 管理」面板里编辑 / 新增 / 切换 / 导出。
// 内置 skill builtin=true，不可删除但可编辑（编辑后标记 builtin_edited）。
// 数据持久化在 localStorage，并支持导出 md 到 Obsidian vault 本地留痕。
// ============================================================

const SKILLS_KEY = 'foldneb_skills';
const ACTIVE_KEY = 'foldneb_active_skill_id';

// ---- 内置 skill：商业动态逻辑情报虾（prompt 含占位符） ----
export const BUILTIN_SKILL = {
  id: 'business-shrimp',
  name: '商业动态逻辑情报虾',
  emoji: '🦐',
  description: '用「结构-逻辑推导-未来可能性」三层框架，深度拆解商业领袖动态背后的底层逻辑',
  builtin: true,
  prompt: `你是「商业动态逻辑情报虾」——一位顶尖的商业动态逻辑分析师。

## 你的使命
用「结构 - 逻辑推导 - 未来可能性」三层框架，深度拆解每一位商业领袖最新动态背后的底层逻辑，提炼可立即复用的商业判断和行动建议。

## 分析对象
- 姓名：{{agent.name}}
- 身份：{{agent.title}}
- 简介：{{agent.description}}
{{agent.philosophy}}

## 核心分析框架：三层拆解

### 第一层：结构拆解（说了什么？）
- 识别发言中的核心论点
- 拆解论点背后的假设前提
- 标注关键利益相关方

### 第二层：逻辑推导（为什么这么说？）
- 追溯观点形成的思维路径
- 分析话语背后的利益动机
- 识别信息不对称所在
- 判断言论的受众目标

### 第三层：未来可能性（然后呢？）
- 预判该人物的下一个动作
- 推断行业即将发生的变化
- 提炼可迁移的判断模型

## 风格指南
1. 看透本质，不追表面：不复述新闻，而是揭示新闻背后的权力转移
2. 提前半步判断：预判下一个稀缺点在哪里，比市场快半步
3. 提炼可迁移模型：每个人物分析都要提炼出可复用的思维模型
4. 短句有力，避免冗长；直击要害，不废话；类比精准，跨界降维；有态度，敢判断

## 任务
基于 {{agent.name}} 最近的真实公开动态、言论、决策或市场事件，生成一份「商业动态逻辑深度分析」报告：
1. 抓取一个真实且近期的触发事件（访谈、财报、产品发布、政策表态、市场波动等）作为切入点，注明来源场合与大致日期
2. 按三层框架层层递进，每一层都要给出有锐度的判断，不要正确废话
3. 严格遵循下面的 Markdown 输出模板，不要增删一级标题、不要输出任何解释性前言

## 输出模板（严格照此结构）

# 📊 {{agent.name}} 动态分析

**日期：** YYYY-MM-DD
**身份：** （一句话身份 + 段位/风格标签）
**触发事件：** （近期真实事件，注明来源场合与日期）

---

## 一句话本质
（一句话点破这次动态的本质——用商业逻辑解构表面叙事，揭示背后的权力转移）

---

## 🔍 三层拆解

### 结构层：说了什么？

**核心表态（原文精选）：**
> （3-4 条核心表态原文，用引用块逐条呈现）

| 编号 | 论点 | 潜在前提 |
| --- | --- | --- |
| 1 | （论点） | （假设前提） |
| 2 | ... | ... |

---

### 逻辑层：为什么这么说？

**利益分析：**
- **直接利益**：
- **间接利益**：
- **深层博弈**：

**假设还原：** （这个人的底层假设是什么）

**逻辑链条：** A → B → C → D（用箭头链呈现因果）

**信息不对称所在：**
- 公众看到的是……
- {{agent.name}} 看到的是……

**受众目标：** （这番话真正说给谁听）

---

### 未来层：然后呢？

**短期预判（1-3 个月）：**
- （3 条，带时间节点）

**中期格局（6-12 个月）：**
- （3 条，行业格局变化）

**长期影响（2-3 年）：**
- （2-3 条，能力圈/权力结构迁移）

---

## 💡 可复用要点

### 商业判断（3 条，每条带标题 + 解释）
1. **「模型名」**：解释
2. ...

### 行动建议（3 条，每条带标题 + 解释）
1. **「行动名」**：解释
2. ...

---

## 🎯 同频者视角
**核心能力圈：** （一句话总结此人当前的核心能力圈）
**下一个能力圈：** （他正在试图进入的下一个能力圈）

---

*分析完成时间：YYYY-MM-DD HH:MM*

## 约束
- 全部使用简体中文
- 表格用标准 Markdown 语法（| a | b |）
- 引用块用 > 开头
- 不要输出任何解释性前言或结语，直接从「# 📊」开始，到「*分析完成时间*」结束
- 内容要有锐度，敢判断，避免正确废话
- 若该人物近期确无显著公开动态，可选取最近 3 个月内最具代表性的事件，并在「触发事件」中注明时间范围`,
};

// ============================================================
// localStorage CRUD
// ============================================================

/** 读取所有 skill（首次访问自动注入内置 skill） */
export function getSkills() {
  try {
    const raw = localStorage.getItem(SKILLS_KEY);
    if (!raw) {
      // 首次：写入内置 skill
      localStorage.setItem(SKILLS_KEY, JSON.stringify([BUILTIN_SKILL]));
      localStorage.setItem(ACTIVE_KEY, BUILTIN_SKILL.id);
      return [BUILTIN_SKILL];
    }
    const skills = JSON.parse(raw);
    if (!Array.isArray(skills) || skills.length === 0) {
      localStorage.setItem(SKILLS_KEY, JSON.stringify([BUILTIN_SKILL]));
      return [BUILTIN_SKILL];
    }
    // 保证内置 skill 始终存在且内容为最新版本（除非用户已编辑覆盖）
    const hasBuiltin = skills.some((s) => s.id === BUILTIN_SKILL.id);
    if (!hasBuiltin) {
      skills.unshift(BUILTIN_SKILL);
      localStorage.setItem(SKILLS_KEY, JSON.stringify(skills));
    }
    return skills;
  } catch {
    return [BUILTIN_SKILL];
  }
}

/** 保存全部 skill 列表 */
export function saveSkills(skills) {
  localStorage.setItem(SKILLS_KEY, JSON.stringify(skills));
}

/** 当前激活 skill id（默认内置） */
export function getActiveSkillId() {
  const id = localStorage.getItem(ACTIVE_KEY);
  if (id) return id;
  return BUILTIN_SKILL.id;
}

/** 设置激活 skill */
export function setActiveSkillId(id) {
  localStorage.setItem(ACTIVE_KEY, id);
}

/** 获取当前激活的 skill 对象 */
export function getActiveSkill() {
  const skills = getSkills();
  const id = getActiveSkillId();
  return skills.find((s) => s.id === id) || skills[0] || BUILTIN_SKILL;
}

/** 新增自定义 skill（返回新 skill 对象含 id） */
export function addSkill({ name, emoji, description, prompt }) {
  const skills = getSkills();
  const skill = {
    id: 'skill-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name || '未命名 Skill',
    emoji: emoji || '⚡',
    description: description || '',
    prompt: prompt || '',
    builtin: false,
  };
  skills.push(skill);
  saveSkills(skills);
  return skill;
}

/** 更新已有 skill（内置 skill 可编辑，标记 builtin_edited 不改 id） */
export function updateSkill(id, patch) {
  const skills = getSkills();
  const idx = skills.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  skills[idx] = { ...skills[idx], ...patch };
  if (skills[idx].builtin) skills[idx].builtin_edited = true;
  saveSkills(skills);
  return skills[idx];
}

/** 删除 skill（内置不可删） */
export function deleteSkill(id) {
  const skills = getSkills();
  const target = skills.find((s) => s.id === id);
  if (!target || target.builtin) return false;
  const next = skills.filter((s) => s.id !== id);
  saveSkills(next);
  if (getActiveSkillId() === id) setActiveSkillId(next[0]?.id || BUILTIN_SKILL.id);
  return true;
}

/** 恢复内置 skill 到原始版本（撤销用户编辑） */
export function resetBuiltinSkill() {
  const skills = getSkills();
  const idx = skills.findIndex((s) => s.id === BUILTIN_SKILL.id);
  if (idx >= 0) skills[idx] = { ...BUILTIN_SKILL };
  else skills.unshift(BUILTIN_SKILL);
  saveSkills(skills);
  return BUILTIN_SKILL;
}

// ============================================================
// Prompt 构造（占位符替换）
// ============================================================

function fillTemplate(tpl, agent) {
  if (!tpl) return '';
  const philosophy = agent.philosophy
    ? `- 核心思想（已知背景）：${agent.philosophy.map((p) => (typeof p === 'string' ? p : p.title) || '').join('；')}`
    : '';
  return tpl
    .replace(/\{\{agent\.name\}\}/g, agent.name || '')
    .replace(/\{\{agent\.title\}\}/g, agent.title || '')
    .replace(/\{\{agent\.description\}\}/g, agent.description || '')
    .replace(/\{\{agent\.philosophy\}\}/g, philosophy);
}

/**
 * 构造当前激活 skill 的大模型 system prompt
 * @param {Object} agent - gameData 思想者对象
 * @returns {string}
 */
export function buildAnalysisPrompt(agent) {
  const skill = getActiveSkill();
  return fillTemplate(skill.prompt, agent);
}

/** 导出 skill 为 md 文本（供 Obsidian 留痕 / 文件下载） */
export function skillToMarkdown(skill) {
  const s = skill || getActiveSkill();
  return `# ${s.emoji || '⚡'} ${s.name}

> 同步自 FoldNeb 折叠星云 Skill 库 · 本地留痕副本

${s.description ? `**简介：** ${s.description}\n` : ''}
**Skill ID：** \`${s.id}\`
**类型：** ${s.builtin ? '内置' : '自定义'}${s.builtin_edited ? '（已编辑）' : ''}
**导出时间：** ${new Date().toISOString().slice(0, 19).replace('T', ' ')}

---

## Prompt 模板

> 占位符说明：\`{{agent.name}}\` \`{{agent.title}}\` \`{{agent.description}}\` \`{{agent.philosophy}}\` 在生成时自动替换为当前人物信息。

\`\`\`
${s.prompt}
\`\`\`
`;
}

export default buildAnalysisPrompt;
