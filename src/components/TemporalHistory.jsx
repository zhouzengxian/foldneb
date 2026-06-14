import { useState } from 'react';
import useNebulaStore from '../store/useNebulaStore';

/**
 * TemporalHistory — 时间折叠历史面板
 * 展示所有已完成的折叠会话，支持查看详情、删除
 * 与 DeliberationHistory 同源结构，适配时间折叠数据
 */
export default function TemporalHistory({ onClose }) {
  const {
    temporalHistory, temporalHistoryView,
    openTemporalHistoryView, closeTemporalHistoryView,
    deleteTemporal, clearTemporalHistory,
  } = useNebulaStore();

  const handleClose = onClose || closeTemporalHistoryView;
  const [confirmClear, setConfirmClear] = useState(false);

  const total = temporalHistory.length;

  // 统计
  const stats = {
    total,
    selvesCount: 0,
    anchorsCount: 0,
  };
  temporalHistory.forEach(h => {
    stats.selvesCount += (h.selves?.length || 0);
    stats.anchorsCount += (h.matrix?.anchors?.length || 0);
  });

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

  // 共用样式
  const styles = {
    overlay: {
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(4,4,16,0.85)', backdropFilter: 'blur(8px)',
    },
    panel: {
      width: '90vw', maxWidth: 720, maxHeight: '85vh',
      background: 'rgba(10,10,26,0.96)',
      border: '1px solid rgba(72,170,255,0.2)',
      borderRadius: '16px', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 0 60px rgba(72,170,255,0.06), 0 4px 40px rgba(0,0,0,0.5)',
    },
    header: {
      padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: 'rgba(72,170,255,0.03)',
    },
  };

  // ===== 详情视图 =====
  if (temporalHistoryView) {
    const session = temporalHistoryView;
    const p = session.profile || {};
    const selves = session.selves || [];
    const letters = session.letters || [];
    const crossReviews = session.crossReviews || [];
    const anchors = session.matrix?.anchors || [];
    return (
      <div style={styles.overlay} onClick={closeTemporalHistoryView}>
        <div style={styles.panel} onClick={e => e.stopPropagation()}>
          <div style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '18px' }}>⏳</span>
              <span style={{ color: '#7ad', fontWeight: 700, fontSize: '14px', fontFamily: 'system-ui' }}>
                折叠回顾
              </span>
              <span style={{ color: '#667', fontSize: '10px', fontFamily: 'system-ui' }}>
                {formatTime(session.archivedAt)}
              </span>
            </div>
            <button onClick={handleClose} style={btnStyle('#666')}>✕</button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            {/* 四维 profile */}
            <div style={{
              padding: '14px 16px', marginBottom: 16,
              background: 'rgba(72,170,255,0.06)', borderLeft: '3px solid rgba(72,170,255,0.4)',
              borderRadius: '0 8px 8px 0',
            }}>
              <HField label="🌱 现状" color="#9bb8ff">{p.currentSituation}</HField>
              {p.goal && <HField label="🎯 目标" color="#FFD700">{p.goal}</HField>}
              {p.biggestFear && <HField label="⚠️ 担忧" color="#ff9999">{p.biggestFear}</HField>}
              {p.keyDecision && <HField label="🧭 关键决策" color="#DDA0DD">{p.keyDecision}</HField>}
            </div>

            {/* 未来自我 */}
            {selves.length > 0 && (
              <Section icon="🌀" label={`未来自我（${selves.length} 个版本）`}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selves.map((s, i) => (
                    <span key={i} style={{
                      padding: '6px 10px', borderRadius: 12, fontSize: '11px',
                      background: 'rgba(72,170,255,0.08)', color: '#9bd',
                      fontFamily: 'system-ui',
                    }}>
                      {s.emoji || '👤'} {s.label}{s.mood ? ` · ${s.mood}` : ''}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* 跨时空来信（摘要） */}
            {letters.length > 0 && (
              <Section icon="✉️" label={`跨时空来信（${letters.length} 封）`}>
                {letters.slice(0, 3).map((lt, i) => (
                  <div key={i} style={{
                    color: '#cce', fontSize: '12px', fontFamily: 'system-ui',
                    padding: '8px 12px', marginBottom: 6,
                    background: 'rgba(255,255,255,0.02)', borderRadius: 6,
                    borderLeft: '2px solid rgba(221,160,221,0.4)',
                  }}>
                    {lt.summary || lt.message?.slice(0, 120) || '(无内容)'}
                  </div>
                ))}
                {letters.length > 3 && (
                  <div style={{ color: '#556', fontSize: '11px', textAlign: 'center', marginTop: 4 }}>
                    …还有 {letters.length - 3} 封
                  </div>
                )}
              </Section>
            )}

            {/* 跨时间互评 */}
            {crossReviews.length > 0 && (
              <Section icon="💬" label={`跨时间互评（${crossReviews.length} 条）`}>
                {crossReviews.slice(0, 3).map((cr, i) => (
                  <div key={i} style={{
                    color: '#aac', fontSize: '11px', fontFamily: 'system-ui',
                    padding: '6px 12px', marginBottom: 4,
                    background: 'rgba(255,255,255,0.02)', borderRadius: 6,
                  }}>
                    {typeof cr === 'string' ? cr : (cr.summary || cr.opinion || '(互评)')}
                  </div>
                ))}
              </Section>
            )}

            {/* 时间锚点 */}
            {anchors.length > 0 && (
              <Section icon="🧭" label={`时间锚点（${anchors.length} 个）`}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {anchors.map((a, i) => (
                    <span key={i} style={{
                      padding: '4px 10px', borderRadius: 10, fontSize: '11px',
                      background: 'rgba(255,215,0,0.08)', color: '#dda',
                      fontFamily: 'system-ui',
                    }}>
                      ⚓ {a.label || a.name || a.id || `锚点${i + 1}`}
                    </span>
                  ))}
                </div>
              </Section>
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
            <span style={{ color: '#7ad', fontWeight: 700, fontSize: '14px', fontFamily: 'system-ui' }}>
              折叠历史
            </span>
            <span style={{ color: '#556', fontSize: '11px', fontFamily: 'system-ui' }}>
              {total} 次折叠
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {total > 0 && (
              confirmClear ? (
                <>
                  <button onClick={() => { clearTemporalHistory(); setConfirmClear(false); }} style={btnStyle('#e44')}>确认清空</button>
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
              <div style={{ fontSize: '14px' }}>还没有折叠记录</div>
              <div style={{ fontSize: '12px', marginTop: 6 }}>开启一次时间折叠，与未来的自己对话</div>
            </div>
          ) : (
            <>
              {/* 统计概览 */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                <StatBadge icon="📊" label="总折叠" value={total} />
                <StatBadge icon="🌀" label="未来版本" value={stats.selvesCount} />
                <StatBadge icon="🧭" label="时间锚点" value={stats.anchorsCount} />
              </div>

              {/* 历史列表 */}
              {[...temporalHistory].reverse().map((h) => {
                const p = h.profile || {};
                const title = p.keyDecision || p.currentSituation || '(未填写)';
                return (
                  <div key={h.id} style={{
                    padding: '12px 16px', marginBottom: 10,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(72,170,255,0.3)'; e.currentTarget.style.background = 'rgba(72,170,255,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }} onClick={() => openTemporalHistoryView(h)}>
                        <div style={{ color: '#7ad', fontSize: '13px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 4 }}>
                          {title.slice(0, 50)}{title.length > 50 ? '…' : ''}
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: '11px', fontFamily: 'system-ui' }}>
                          <span style={{ color: '#556' }}>{formatTime(h.archivedAt)}</span>
                          {h.selves?.length > 0 && <span style={{ color: '#556' }}>🌀 {h.selves.length} 个未来版本</span>}
                          {h.matrix?.anchors?.length > 0 && <span style={{ color: '#556' }}>🧭 {h.matrix.anchors.length} 个锚点</span>}
                          {h.letters?.length > 0 && <span style={{ color: '#556' }}>✉️ {h.letters.length} 封来信</span>}
                        </div>
                        {p.currentSituation && (
                          <div style={{ color: '#889', fontSize: '11px', fontFamily: 'system-ui', marginTop: 6, opacity: 0.7 }}>
                            {p.currentSituation.slice(0, 60)}{p.currentSituation.length > 60 ? '…' : ''}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 12 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTemporal(h.id); }}
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
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== 小组件 =====
function HField({ label, color, children }) {
  if (!children) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: '#889', fontSize: '10px', fontFamily: 'system-ui', marginBottom: 2 }}>{label}</div>
      <div style={{ color: color || '#ccd', fontSize: '13px', fontFamily: 'system-ui', lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function Section({ icon, label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ color: '#aaa', fontSize: '11px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 8 }}>
        {icon} {label}
      </div>
      {children}
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
        <div style={{ color: '#7ad', fontSize: '14px', fontWeight: 700, fontFamily: 'system-ui' }}>{value}</div>
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
