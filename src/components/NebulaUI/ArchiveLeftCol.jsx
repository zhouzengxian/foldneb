import { useState } from 'react';
import { districts } from '../../data/gameData.js';
import { tryOpenObsidianWithFallback } from '../../utils/obsidianLink.js';

/**
 * 档案 Modal 左栏：思想者完整资料展示 + Obsidian 跳转
 * 自管理 obsidianHint 状态（trying/success/fallback）
 */
export default function ArchiveLeftCol({ agent }) {
  const [obsidianHint, setObsidianHint] = useState('');

  const handleTryObsidian = () => {
    if (!agent) return;
    setObsidianHint('trying');
    tryOpenObsidianWithFallback(agent, {
      onSuccess: () => {
        setObsidianHint('success');
        setTimeout(() => setObsidianHint(''), 3000);
      },
      onFallback: () => {
        setObsidianHint('fallback');
        try {
          navigator.clipboard.writeText(
            `obsidian://open?vault=${encodeURIComponent('AI一人公司')}&file=${encodeURIComponent(agent.name)}`
          );
        } catch {}
      },
    });
  };

  return (
    <div className="archive-left-col">
      {/* 一句话简介 */}
      {agent.description && (
        <div style={{
          marginBottom: 18, padding: '12px 14px',
          background: `${agent.color}10`, borderRadius: 10,
          borderLeft: `3px solid ${agent.color}88`,
        }}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#bbccdd', margin: 0 }}>{agent.description}</p>
        </div>
      )}

      {/* 完整传记 */}
      {agent.bio && agent.bio.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <SectionLabel color={agent.color}>完整传记 · BIOGRAPHY</SectionLabel>
          {agent.bio.map((p, i) => (
            <p key={i} style={{
              fontSize: 12.5, lineHeight: 1.85, color: '#c5d0e0', margin: '0 0 10px 0',
              textIndent: '1.8em',
            }}>{p}</p>
          ))}
        </div>
      )}

      <div className="archive-modules-grid">
        {/* 人生时间轴 */}
        {agent.timeline && agent.timeline.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionLabel color={agent.color}>人生里程碑 · TIMELINE</SectionLabel>
            <div style={{ position: 'relative', paddingLeft: 16 }}>
              <div style={{
                position: 'absolute', left: 5, top: 4, bottom: 4,
                width: 1, background: `${agent.color}33`,
              }} />
              {agent.timeline.map((item, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: 10 }}>
                  <div style={{
                    position: 'absolute', left: -16, top: 4,
                    width: 9, height: 9, borderRadius: '50%',
                    background: agent.color, boxShadow: `0 0 8px ${agent.color}88`,
                  }} />
                  <div style={{ fontSize: 11, color: agent.color, fontWeight: 600, marginBottom: 2 }}>
                    {item.year}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#b8c4d8', lineHeight: 1.6 }}>{item.event}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 核心思想 */}
        {agent.philosophy && agent.philosophy.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionLabel color={agent.color}>核心思想 · PHILOSOPHY</SectionLabel>
            {agent.philosophy.map((ph, i) => (
              <div key={i} style={{
                marginBottom: 10, padding: '12px 14px',
                background: 'rgba(255,255,255,0.025)', borderRadius: 10,
                border: `1px solid ${agent.color}1a`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e8f0ff', marginBottom: 5 }}>
                  {i + 1}. {ph.title}
                </div>
                <div style={{ fontSize: 11.5, lineHeight: 1.75, color: '#aabbcc' }}>{ph.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* 经典语录 */}
        {agent.quotes && agent.quotes.length > 0 ? (
          <div style={{ marginBottom: 18 }}>
            <SectionLabel color={agent.color}>经典语录 · QUOTES</SectionLabel>
            {agent.quotes.map((q, i) => (
              <div key={i} style={{
                marginBottom: 8, padding: '11px 14px',
                background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                borderLeft: `3px solid ${agent.color}88`,
              }}>
                <div style={{ fontSize: 12.5, lineHeight: 1.8, color: '#d8e2f0', fontStyle: 'italic' }}>
                  "{q.text}"
                </div>
                {q.context && (
                  <div style={{ fontSize: 10, color: '#7788aa', marginTop: 6, lineHeight: 1.5 }}>
                    —— {q.context}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : agent.dialogue ? (
          <div style={{
            marginBottom: 18, padding: '14px 16px',
            background: 'rgba(255,255,255,0.03)', borderRadius: 12,
            borderLeft: `3px solid ${agent.color}88`,
          }}>
            <div style={{ fontSize: 10, color: '#FFD700', opacity: 0.6, marginBottom: 6, letterSpacing: '0.1em' }}>经典语录</div>
            <div style={{ fontSize: 13, lineHeight: 1.85, color: '#d0dae8', fontStyle: 'italic' }}>
              "{agent.dialogue}"
            </div>
          </div>
        ) : null}

        {/* 代表作 */}
        {agent.works && agent.works.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionLabel color={agent.color}>代表作与产品 · WORKS</SectionLabel>
            {agent.works.map((w, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, marginBottom: 8, padding: '10px 12px',
                background: 'rgba(255,255,255,0.02)', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  flexShrink: 0, fontSize: 10, padding: '3px 8px',
                  borderRadius: 6, background: `${agent.color}1a`,
                  color: agent.color, fontWeight: 600, height: 'fit-content',
                }}>{w.year}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#e0e8f5', fontWeight: 500, marginBottom: 3 }}>
                    {w.name} <span style={{ fontSize: 10, color: '#7788aa', fontWeight: 400 }}>· {w.type}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#99aabb', lineHeight: 1.6 }}>{w.note}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>{/* /modules-grid */}

      {/* 影响与启示 */}
      {agent.legacy && (
        <div style={{
          marginBottom: 18, padding: '16px 18px',
          background: `linear-gradient(135deg, ${agent.color}12, ${agent.color}05)`,
          borderRadius: 14, border: `1px solid ${agent.color}25`,
        }}>
          <SectionLabel color={agent.color}>影响与启示 · LEGACY</SectionLabel>
          <p style={{ fontSize: 12.5, lineHeight: 1.85, color: '#cad4e2', margin: 0 }}>{agent.legacy}</p>
        </div>
      )}

      {/* 关键成就 */}
      {agent.highlights && agent.highlights.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#FFD700', opacity: 0.6, marginBottom: 6, letterSpacing: '0.1em' }}>关键成就</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {agent.highlights.map((h, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 8,
                background: `${agent.color}18`, color: `${agent.color}dd`,
                border: `1px solid ${agent.color}33`,
              }}>{h}</span>
            ))}
          </div>
        </div>
      )}

      {/* 关联概念 */}
      {agent.satellites && agent.satellites.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#FFD700', opacity: 0.6, marginBottom: 6, letterSpacing: '0.1em' }}>关联概念</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {agent.satellites.map((s, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 8,
                background: `${agent.color}12`, color: `${agent.color}bb`,
              }}>{s.label}</span>
            ))}
          </div>
        </div>
      )}

      {/* 标签 */}
      {agent.tags && agent.tags.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {agent.tags.map((t, i) => (
              <span key={i} style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)', color: '#8899aa',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>#{t}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 0 16px' }} />

      {/* Obsidian 路径信息 */}
      <div style={{
        padding: '12px 14px', marginBottom: 14,
        background: 'rgba(99,85,188,0.06)', borderRadius: 10,
        border: '1px solid rgba(99,85,188,0.14)',
        fontSize: 10, color: '#7788aa', lineHeight: 1.7,
      }}>
        <div style={{ color: '#8866CC', marginBottom: 6, letterSpacing: '0.05em', fontSize: 10 }}>📂 Obsidian 知识库路径</div>
        <div style={{ color: '#99aabb', fontSize: 10, wordBreak: 'break-all' }}>
          AI一人公司 / 11-黑客松大赛 / 折叠星云agent数据库 / {agent.tier === 2 ? '2_精英星团' : '1_智慧星河'} / {districts.find(d => d.id === agent.district)?.name || agent.district} / {agent.name}.md
        </div>
      </div>

      {/* Obsidian 跳转按钮 */}
      <button onClick={handleTryObsidian} style={{
        width: '100%', padding: '10px', borderRadius: 10,
        background: obsidianHint === 'success'
          ? 'linear-gradient(135deg, rgba(100,200,120,0.2), rgba(100,200,120,0.08))'
          : 'linear-gradient(135deg, rgba(99,85,188,0.18), rgba(99,85,188,0.08))',
        border: '1px solid ' + (obsidianHint === 'success' ? 'rgba(100,200,120,0.4)' : 'rgba(99,85,188,0.35)'),
        color: obsidianHint === 'success' ? '#88ddaa' : '#a890e0',
        fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
        transition: 'all 0.2s',
      }}>
        {obsidianHint === 'trying' ? '⏳ 正在尝试打开 Obsidian...' :
         obsidianHint === 'success' ? '✅ 已打开 Obsidian' :
         obsidianHint === 'fallback' ? '📓 未检测到 Obsidian（在线环境正常）' :
         '📓 在 Obsidian 中打开（本地用户）'}
      </button>

      {obsidianHint === 'fallback' && (
        <div style={{
          marginTop: 10, padding: '10px 12px',
          background: 'rgba(255,200,100,0.06)', borderRadius: 8,
          border: '1px solid rgba(255,200,100,0.15)',
          fontSize: 10.5, color: '#e8c890', lineHeight: 1.7,
        }}>
          💡 这是因为您当前是<b>在线 Demo 环境</b>，浏览器无法直接唤起本地 Obsidian。<br/>
          完整体验：clone 仓库 → 本地运行 → 安装 Obsidian → 导入「AI一人公司」vault。<br/>
          URI 已复制到剪贴板，可在本地浏览器地址栏粘贴试用。
        </div>
      )}
    </div>
  );
}

/** 区块小标题（色条 + 文字） */
function SectionLabel({ color, children }) {
  return (
    <div style={{
      fontSize: 11, color, marginBottom: 12,
      letterSpacing: '0.15em', fontWeight: 600, opacity: 0.9,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <span style={{ width: 3, height: 12, background: color, borderRadius: 2 }} />
      {children}
    </div>
  );
}
