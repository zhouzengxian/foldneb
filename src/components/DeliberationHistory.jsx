import { useState } from 'react';
import useNebulaStore from '../store/useNebulaStore';
import { generateReportImage, downloadReportImage } from '../utils/reportImage';

/**
 * DeliberationHistory — 推演历史面板
 * 展示所有已完成的推演记录，支持查看详情、导出图片、删除
 */
export default function DeliberationHistory({ onClose }) {
  const {
    deliberationHistory, deliberationHistoryView,
    openDeliberationHistoryView, closeDeliberationHistoryView,
    deleteDeliberation, clearDeliberationHistory,
  } = useNebulaStore();

  const handleClose = onClose || closeDeliberationHistoryView;

  const [exporting, setExporting] = useState(null); // 正在导出的 id
  const [confirmClear, setConfirmClear] = useState(false);

  const total = deliberationHistory.length;

  // 统计
  const stats = {
    total,
    domains: {},
    agentCount: 0,
  };
  deliberationHistory.forEach(h => {
    if (h.domain) {
      stats.domains[h.domain] = (stats.domains[h.domain] || 0) + 1;
    }
    stats.agentCount += (h.agents?.length || 0);
  });

  // 导出图片
  const handleExport = async (session) => {
    setExporting(session.id);
    try {
      const blob = await generateReportImage(session);
      const dateStr = new Date(session.archivedAt || session.createdAt)
        .toISOString().slice(0, 10);
      downloadReportImage(blob, `FoldNeb-推演-${dateStr}.png`);
    } catch (err) {
      console.error('导出失败:', err);
    }
    setExporting(null);
  };

  // 格式化时间
  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return '今天 ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return diffDays + '天前';
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  // 共用的样式
  const styles = {
    overlay: {
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(4,4,16,0.85)', backdropFilter: 'blur(8px)',
    },
    panel: {
      width: '90vw', maxWidth: 700, maxHeight: '85vh',
      background: 'rgba(10,10,26,0.96)',
      border: '1px solid rgba(255,215,0,0.2)',
      borderRadius: '16px', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 0 60px rgba(255,215,0,0.06), 0 4px 40px rgba(0,0,0,0.5)',
    },
    header: {
      padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: 'rgba(255,215,0,0.03)',
    },
  };

  // ===== 详情视图 =====
  if (deliberationHistoryView) {
    const session = deliberationHistoryView;
    const rpt = session.report || {};
    return (
      <div style={styles.overlay} onClick={closeDeliberationHistoryView}>
        <div style={styles.panel} onClick={e => e.stopPropagation()}>
          <div style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '18px' }}>📋</span>
              <span style={{ color: '#FFD700', fontWeight: 700, fontSize: '14px', fontFamily: 'system-ui' }}>
                推演回顾
              </span>
              <span style={{ color: '#667', fontSize: '10px', fontFamily: 'system-ui' }}>
                {formatTime(session.archivedAt || session.createdAt)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleExport(session)}
                disabled={exporting === session.id}
                style={btnStyle('#FFD700')}
              >
                {exporting === session.id ? '⏳' : '📷'} 导出图片
              </button>
              <button onClick={handleClose} style={btnStyle('#666')}>✕</button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            {/* 问题 */}
            <div style={{
              padding: '12px 16px', marginBottom: 16,
              background: 'rgba(255,215,0,0.06)', borderLeft: '3px solid rgba(255,215,0,0.4)',
              borderRadius: '0 8px 8px 0',
            }}>
              <div style={{ color: '#889', fontSize: '10px', fontFamily: 'system-ui', marginBottom: 4 }}>推演问题</div>
              <div style={{ color: '#e8e0d0', fontSize: '14px', fontFamily: 'system-ui' }}>{session.problem}</div>
              {session.domain && <div style={{ color: '#FFD700', fontSize: '11px', marginTop: 4 }}>域：{session.domain}</div>}
            </div>

            {/* 报告 */}
            {rpt.reframedProblem && <HBlock icon="🔄" label="重新框定" color="#DDA0DD">{rpt.reframedProblem}</HBlock>}
            {rpt.coreFinding && <HBlock icon="💡" label="核心发现" color="#FFD700" highlight>{rpt.coreFinding}</HBlock>}

            {rpt.keyInsights?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: '#aaa', fontSize: '11px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 8 }}>🔑 关键洞察</div>
                {rpt.keyInsights.map((ins, i) => (
                  <div key={i} style={{ color: '#cce', fontSize: '12px', fontFamily: 'system-ui', padding: '6px 0 6px 12px', borderLeft: '2px solid rgba(68,170,255,0.3)', marginBottom: 4 }}>
                    {ins}
                  </div>
                ))}
              </div>
            )}

            {rpt.actionableAdvice && <HBlock icon="🎯" label="行动建议" color="#44DD88">{rpt.actionableAdvice}</HBlock>}

            {/* 参演Agent */}
            {session.agents?.length > 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <div style={{ color: '#667', fontSize: '10px', marginBottom: 6 }}>参演思想者</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {session.agents.map(a => (
                    <span key={a.id} style={{
                      padding: '3px 8px', borderRadius: 10, fontSize: '11px',
                      background: 'rgba(255,215,0,0.08)', color: '#dda',
                      fontFamily: 'system-ui',
                    }}>{a.name || a.id}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== 列表视图 =====
  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.panel} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '18px' }}>📁</span>
            <span style={{ color: '#FFD700', fontWeight: 700, fontSize: '14px', fontFamily: 'system-ui' }}>
              推演历史
            </span>
            <span style={{ color: '#556', fontSize: '11px', fontFamily: 'system-ui' }}>
              {total} 次推演
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {total > 0 && (
              confirmClear ? (
                <>
                  <button onClick={() => { clearDeliberationHistory(); setConfirmClear(false); }} style={btnStyle('#e44')}>确认清空</button>
                  <button onClick={() => setConfirmClear(false)} style={btnStyle('#889')}>取消</button>
                </>
              ) : (
                <button onClick={() => setConfirmClear(true)} style={btnStyle('#889')}>🗑 清空</button>
              )
            )}
            <button onClick={handleClose} style={btnStyle('#666')}>✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {total === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#556', fontFamily: 'system-ui' }}>
              <div style={{ fontSize: '48px', marginBottom: 16 }}>📭</div>
              <div style={{ fontSize: '14px' }}>还没有推演记录</div>
              <div style={{ fontSize: '12px', marginTop: 6 }}>开始一次决策推演，让思想者为你出谋划策</div>
            </div>
          ) : (
            <>
              {/* 统计概览 */}
              {total > 0 && (
                <div style={{
                  display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap',
                }}>
                  <StatBadge icon="📊" label="总推演" value={total} />
                  <StatBadge icon="🎯" label="涉及领域" value={Object.keys(stats.domains).length} />
                  <StatBadge icon="👥" label="参演人次" value={stats.agentCount} />
                  {Object.entries(stats.domains).slice(0, 3).map(([d, c]) => (
                    <StatBadge key={d} icon="🏷️" label={d} value={c} />
                  ))}
                </div>
              )}

              {/* 历史列表 */}
              {[...deliberationHistory].reverse().map((h) => (
                <div key={h.id} style={{
                  padding: '12px 16px', marginBottom: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,215,0,0.3)'; e.currentTarget.style.background = 'rgba(255,215,0,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }} onClick={() => openDeliberationHistoryView(h)}>
                      <div style={{ color: '#FFD700', fontSize: '13px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 4 }}>
                        {h.problem.slice(0, 50)}{h.problem.length > 50 ? '…' : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: '11px', fontFamily: 'system-ui' }}>
                        {h.domain && <span style={{ color: '#889', background: 'rgba(255,215,0,0.08)', padding: '2px 8px', borderRadius: 6 }}>{h.domain}</span>}
                        <span style={{ color: '#556' }}>{formatTime(h.archivedAt || h.createdAt)}</span>
                        <span style={{ color: '#556' }}>{h.agents?.length || 0} 位思想者</span>
                        <span style={{ color: '#556' }}>{h.rounds?.length || 0} 轮推演</span>
                      </div>
                      {h.report?.coreFinding && (
                        <div style={{ color: '#889', fontSize: '11px', fontFamily: 'system-ui', marginTop: 6, opacity: 0.7 }}>
                          {h.report.coreFinding.slice(0, 80)}{h.report.coreFinding.length > 80 ? '…' : ''}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 12 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleExport(h); }}
                        disabled={exporting === h.id}
                        title="导出图片"
                        style={{
                          background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
                          borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                          color: '#FFD700', fontSize: '13px',
                        }}
                      >
                        {exporting === h.id ? '⏳' : '📷'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteDeliberation(h.id); }}
                        title="删除"
                        style={{
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                          color: '#889', fontSize: '11px',
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== 小组件 =====
function HBlock({ icon, label, color, highlight, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: '#aaa', fontSize: '11px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 4 }}>
        {icon} {label}
      </div>
      <div style={{
        color: color || '#ccd', fontSize: '13px', fontFamily: 'system-ui',
        lineHeight: 1.6, padding: '10px 14px',
        background: 'rgba(255,255,255,0.03)', borderRadius: 8,
        borderLeft: highlight ? '3px solid rgba(255,215,0,0.4)' : 'none',
      }}>
        {children}
      </div>
    </div>
  );
}

function StatBadge({ icon, label, value }) {
  return (
    <div style={{
      padding: '8px 14px', background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <div>
        <div style={{ color: '#667', fontSize: '9px', fontFamily: 'system-ui' }}>{label}</div>
        <div style={{ color: '#FFD700', fontSize: '14px', fontWeight: 700, fontFamily: 'system-ui' }}>{value}</div>
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}33`,
    borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
    color: color, fontSize: '12px', fontFamily: 'system-ui',
  };
}
