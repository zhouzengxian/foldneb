import { useState } from 'react';
import {
  getSkills,
  getActiveSkill,
  addSkill,
  updateSkill,
  deleteSkill,
  resetBuiltinSkill,
  setActiveSkillId as persistActiveSkill,
  skillToMarkdown,
} from '../../utils/analysisPrompt.js';

const miniBtn = {
  padding: '3px 8px', borderRadius: 5, fontSize: 9.5, cursor: 'pointer',
  fontFamily: 'inherit', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(136,153,204,0.2)', color: '#a8b8d0',
};

/**
 * Skill 管理面板：列表态 + 编辑态
 * 内部自管理 skillManagerOpen/editingSkill/isCreatingSkill
 * 通过 onActiveSkillChange 通知父组件当前激活的 skill（供一键生成用）
 */
export default function SkillManagerPanel({ onActiveSkillChange }) {
  const [activeSkill, setActiveSkillState] = useState(getActiveSkill());
  const [skillManagerOpen, setSkillManagerOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);

  const syncActive = (s) => {
    setActiveSkillState(s);
    onActiveSkillChange?.(s);
  };

  const handleSelectSkill = (id) => {
    persistActiveSkill(id);
    const s = getSkills().find((x) => x.id === id);
    if (s) syncActive(s);
  };

  const handleSaveSkillEdit = () => {
    if (!editingSkill?.name?.trim()) return;
    updateSkill(editingSkill.id, {
      name: editingSkill.name.trim(),
      emoji: editingSkill.emoji?.trim() || '⚡',
      description: editingSkill.description,
      prompt: editingSkill.prompt,
    });
    setEditingSkill(null);
    setIsCreatingSkill(false);
    setActiveSkillState(getActiveSkill());
    onActiveSkillChange?.(getActiveSkill());
  };

  const handleCreateSkill = () => {
    const s = addSkill({
      name: '新建 Skill',
      emoji: '⚡',
      description: '',
      prompt:
        '你是……（在此编写大模型 system prompt）\n\n## 分析对象\n- 姓名：{{agent.name}}\n- 身份：{{agent.title}}\n- 简介：{{agent.description}}\n\n## 任务\n（描述你希望大模型做什么）\n',
    });
    persistActiveSkill(s.id);
    syncActive(s);
    setEditingSkill({ ...s });
    setIsCreatingSkill(true);
  };

  const handleDeleteSkill = (id) => {
    const skill = getSkills().find((s) => s.id === id);
    if (skill?.builtin) return;
    if (!window.confirm('确定删除这个 Skill？此操作不可撤销。')) return;
    deleteSkill(id);
    setActiveSkillState(getActiveSkill());
    onActiveSkillChange?.(getActiveSkill());
  };

  const handleResetBuiltin = () => {
    if (!window.confirm('恢复内置 Skill 到原始版本？当前对该 Skill 的编辑将被覆盖。')) return;
    resetBuiltinSkill();
    setEditingSkill(null);
    setActiveSkillState(getActiveSkill());
    onActiveSkillChange?.(getActiveSkill());
  };

  const handleExportSkill = (skill) => {
    const md = skillToMarkdown(skill);
    try { navigator.clipboard.writeText(md); } catch {}
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(skill.name || 'skill').replace(/[<>:"/\\|?*]/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={skillManagerOpen ? '' : 'archive-skill-bar'}>
      <div style={{
        fontSize: 11, color: '#88ddaa', marginBottom: 10,
        letterSpacing: '0.15em', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 6,
        justifyContent: 'space-between',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 3, height: 12, background: '#88ddaa', borderRadius: 2 }} />
          {activeSkill.emoji} {activeSkill.name}
        </span>
        <button
          onClick={() => { setSkillManagerOpen(!skillManagerOpen); setEditingSkill(null); }}
          style={{
            background: 'transparent', border: '1px solid rgba(136,221,170,0.25)',
            color: '#88ddaa', fontSize: 9.5, padding: '2px 8px', borderRadius: 10,
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em',
          }}
          title="管理 / 编辑 / 新增 Skill（大模型指令模板）"
        >
          Skill 库 {skillManagerOpen ? '▲' : '▼'}
        </button>
      </div>

      {skillManagerOpen && (
        <div style={{
          marginBottom: 12, padding: 10, borderRadius: 10,
          background: 'rgba(136,221,170,0.04)',
          border: '1px solid rgba(136,221,170,0.18)',
        }}>
          {editingSkill ? (
            <SkillEditForm
              editingSkill={editingSkill}
              setEditingSkill={setEditingSkill}
              onSave={handleSaveSkillEdit}
              onCancel={() => { setEditingSkill(null); setIsCreatingSkill(false); }}
            />
          ) : (
            <SkillListView
              activeSkill={activeSkill}
              onSelect={handleSelectSkill}
              onEdit={(s) => setEditingSkill({ ...s })}
              onExport={handleExportSkill}
              onDelete={handleDeleteSkill}
              onCreate={handleCreateSkill}
              onResetBuiltin={handleResetBuiltin}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SkillEditForm({ editingSkill, setEditingSkill, onSave, onCancel }) {
  return (
    <div>
      <div style={{ fontSize: 9.5, color: '#88ddaa', marginBottom: 8, letterSpacing: '0.05em' }}>
        ✎ 编辑 Skill 指令模板
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          value={editingSkill.emoji}
          onChange={(e) => setEditingSkill({ ...editingSkill, emoji: e.target.value })}
          placeholder="🦐"
          style={{ width: 50, padding: '6px', textAlign: 'center', borderRadius: 6,
            background: 'rgba(10,8,20,0.7)', border: '1px solid rgba(136,153,204,0.3)',
            color: '#e8f0ff', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
        />
        <input
          value={editingSkill.name}
          onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
          placeholder="Skill 名称"
          style={{ flex: 1, padding: '6px 8px', borderRadius: 6,
            background: 'rgba(10,8,20,0.7)', border: '1px solid rgba(136,153,204,0.3)',
            color: '#e8f0ff', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>
      <input
        value={editingSkill.description}
        onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })}
        placeholder="一句话描述这个 Skill 做什么"
        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, marginBottom: 8, boxSizing: 'border-box',
          background: 'rgba(10,8,20,0.7)', border: '1px solid rgba(136,153,204,0.3)',
          color: '#e8f0ff', fontSize: 11, fontFamily: 'inherit', outline: 'none' }}
      />
      <div style={{ fontSize: 9, color: '#7788aa', marginBottom: 4, lineHeight: 1.6 }}>
        Prompt 模板 · 占位符（生成时自动替换为当前人物）：
        <code style={{ color: '#88ddaa' }}>{'{'}{`{agent.name}`}{'}'}</code>{' '}
        <code style={{ color: '#88ddaa' }}>{'{'}{`{agent.title}`}{'}'}</code>{' '}
        <code style={{ color: '#88ddaa' }}>{'{'}{`{agent.description}`}{'}'}</code>{' '}
        <code style={{ color: '#88ddaa' }}>{'{'}{`{agent.philosophy}`}{'}'}</code>
      </div>
      <textarea
        value={editingSkill.prompt}
        onChange={(e) => setEditingSkill({ ...editingSkill, prompt: e.target.value })}
        spellCheck={false}
        style={{ width: '100%', minHeight: 240, padding: '8px', borderRadius: 6, marginBottom: 8, boxSizing: 'border-box',
          background: 'rgba(10,8,20,0.85)', border: '1px solid rgba(136,153,204,0.3)',
          color: '#c5d0e0', fontSize: 10.5, fontFamily: 'Consolas, "Cascadia Code", monospace', outline: 'none',
          lineHeight: 1.6, resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onSave} style={{ flex: 1, padding: '7px', borderRadius: 6,
          background: 'rgba(136,221,170,0.2)', border: '1px solid rgba(136,221,170,0.4)',
          color: '#88ddaa', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
          ✓ 保存 Skill
        </button>
        <button onClick={onCancel} style={{ padding: '7px 14px', borderRadius: 6,
          background: 'transparent', border: '1px solid rgba(136,153,204,0.3)',
          color: '#8899bb', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
          取消
        </button>
      </div>
    </div>
  );
}

function SkillListView({ activeSkill, onSelect, onEdit, onExport, onDelete, onCreate, onResetBuiltin }) {
  return (
    <div>
      {getSkills().map((s) => (
        <div key={s.id} style={{
          padding: '8px', marginBottom: 6, borderRadius: 8,
          background: s.id === activeSkill.id ? 'rgba(136,221,170,0.1)' : 'rgba(255,255,255,0.02)',
          border: '1px solid ' + (s.id === activeSkill.id ? 'rgba(136,221,170,0.4)' : 'rgba(255,255,255,0.05)'),
        }}>
          <div style={{ fontSize: 11, color: '#e8f0ff', fontWeight: 600, marginBottom: 3 }}>
            {s.emoji} {s.name}
            {s.id === activeSkill.id && <span style={{ fontSize: 8.5, color: '#88ddaa', marginLeft: 6 }}>● 当前</span>}
            {s.builtin && <span style={{ fontSize: 8.5, color: '#7788aa', marginLeft: 4 }}>· 内置</span>}
            {s.builtin_edited && <span style={{ fontSize: 8.5, color: '#ffaa66', marginLeft: 4 }}>· 已编辑</span>}
          </div>
          {s.description && <div style={{ fontSize: 9.5, color: '#8899bb', lineHeight: 1.5, marginBottom: 5 }}>{s.description}</div>}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {s.id !== activeSkill.id && (
              <button onClick={() => onSelect(s.id)} style={miniBtn}>设为当前</button>
            )}
            <button onClick={() => onEdit(s)} style={miniBtn}>✎ 编辑</button>
            <button onClick={() => onExport(s)} style={miniBtn} title="导出为 md 文件 + 复制（供 Obsidian 本地留痕）">⬇ 导出 md</button>
            {!s.builtin && (
              <button onClick={() => onDelete(s.id)} style={{ ...miniBtn, color: '#ff9999' }}>✕ 删除</button>
            )}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button onClick={onCreate} style={{ flex: 1, padding: '7px', borderRadius: 6,
          background: 'rgba(136,221,170,0.12)', border: '1px dashed rgba(136,221,170,0.35)',
          color: '#88ddaa', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
          ＋ 新建 Skill
        </button>
        <button onClick={onResetBuiltin} style={{ padding: '7px 10px', borderRadius: 6,
          background: 'transparent', border: '1px solid rgba(136,153,204,0.25)',
          color: '#8899bb', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}
          title="恢复内置情报虾 Skill 到原始版本">
          ↺ 重置内置
        </button>
      </div>
      <div style={{ fontSize: 8.5, color: '#6677aa', marginTop: 8, lineHeight: 1.6 }}>
        Skill = 大模型 system prompt 模板。编辑/新增后点「一键生成」即用新指令。所有数据存本地浏览器，可导出 md 留痕。
      </div>
    </div>
  );
}
