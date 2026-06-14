import { districts } from '../../data/gameData.js';
import ArchiveLeftCol from './ArchiveLeftCol.jsx';
import ArchiveRightCol from './ArchiveRightCol.jsx';

/**
 * 网页档案 Modal（不依赖本地 Obsidian，在线即可查看）
 * 外壳：overlay + 关闭按钮 + 头像标题 + 两栏容器
 * 左栏：思想者完整资料（ArchiveLeftCol）
 * 右栏：Skill 管理 + 深度分析生成（ArchiveRightCol）
 */
export default function ArchiveModal({ agent, onClose }) {
  if (!agent) return null;

  return (
    <div
      onClick={onClose}
      className="archive-modal-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'auto',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="archive-modal-card"
        style={{
          maxHeight: '90vh', overflowY: 'auto',
          background: 'linear-gradient(180deg, rgba(15,12,40,0.98), rgba(8,6,24,0.98))',
          borderRadius: 18, border: `1px solid ${agent.color}33`,
          boxShadow: `0 20px 80px rgba(0,0,0,0.6), 0 0 60px ${agent.color}15`,
          color: '#e8f0ff', position: 'relative',
          fontFamily: 'inherit',
        }}
      >
        {/* 关闭按钮 */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 16,
          background: 'none', border: 'none', color: '#8899bb',
          cursor: 'pointer', fontSize: 22, padding: 2, lineHeight: 1,
        }}>✕</button>

        {/* 顶部说明条 */}
        <div style={{
          fontSize: 10, color: '#7788aa', letterSpacing: '0.1em',
          marginBottom: 14, opacity: 0.7,
        }}>
          📄 思想者档案 · 在线预览 · 完整 Obsidian 联动需本地运行
        </div>

        {/* 头像 + 标题 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: `radial-gradient(circle, ${agent.color}44, ${agent.color}11)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, border: `2px solid ${agent.color}66`, flexShrink: 0,
            boxShadow: `0 0 24px ${agent.color}33`,
          }}>{agent.emoji}</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{agent.name}</div>
            <div style={{ fontSize: 13, color: agent.color, marginTop: 4 }}>{agent.title}</div>
            <div style={{ fontSize: 11, color: '#7788aa', marginTop: 3 }}>
              {districts.find(d => d.id === agent.district)?.name || agent.district} · {agent.tier === 1 ? 'Tier-1 智慧星河' : `Tier-${agent.tier} 精英星团`}
            </div>
          </div>
        </div>

        {/* 两栏布局 */}
        <div className="archive-two-col">
          <ArchiveLeftCol agent={agent} />
          <ArchiveRightCol agent={agent} />
        </div>
      </div>
    </div>
  );
}
