// 推演报告区（complete 阶段）：重新框定 / 核心发现 / 关键洞察 / 行动建议 / 后续追问 / 横纵联动引导
// Props:
//   report             - session.report 对象
//   onFollowUpQuestion - 点击"你可能还想问"中的问题时的回调
function ReportSection({ icon, label, color, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: '#aaa', fontSize: '11px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 4 }}>
        {icon} {label}
      </div>
      <div style={{
        color: color || '#ccd', fontSize: '13px', fontFamily: 'system-ui',
        lineHeight: 1.6, padding: '6px 10px',
        background: 'rgba(255,255,255,0.03)', borderRadius: '6px',
      }}>
        {children}
      </div>
    </div>
  );
}

export default function ReportView({ report, onFollowUpQuestion }) {
  if (!report) return null;

  return (
    <div style={{
      padding: '16px', marginTop: 8,
      background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,180,0,0.05))',
      border: '1px solid rgba(255,215,0,0.3)', borderRadius: '12px',
    }}>
      <div style={{ color: '#FFD700', fontSize: '15px', fontWeight: 700, fontFamily: 'system-ui', marginBottom: 14 }}>
        📋 推演报告
      </div>

      {/* 重新框定 */}
      <ReportSection icon="🔄" label="重新框定" color="#E8D080">
        {report.reframedProblem}
      </ReportSection>

      {/* 核心发现 */}
      <ReportSection icon="💡" label="核心发现" color="#FFD700">
        {report.coreFinding}
      </ReportSection>

      {/* 关键洞察 */}
      {report.keyInsights?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: '#aaa', fontSize: '11px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 6 }}>
            🔑 关键洞察
          </div>
          {report.keyInsights.map((ins, i) => (
            <div key={i} style={{
              color: '#ccd', fontSize: '12px', fontFamily: 'system-ui',
              padding: '4px 0', paddingLeft: 12, borderLeft: '2px solid rgba(255,215,0,0.2)',
              marginBottom: 4,
            }}>
              {ins}
            </div>
          ))}
        </div>
      )}

      {/* 可执行建议 */}
      <ReportSection icon="🎯" label="行动建议" color="#80E8A0">
        {report.actionableAdvice}
      </ReportSection>

      {/* 后续可追问 */}
      {report.followUpQuestions?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ color: '#aaa', fontSize: '11px', fontWeight: 600, fontFamily: 'system-ui', marginBottom: 6 }}>
            🤔 你可能还想问
          </div>
          {report.followUpQuestions.map((q, i) => (
            <div key={i} style={{
              color: '#99b', fontSize: '12px', fontFamily: 'system-ui',
              padding: '6px 10px', marginBottom: 4,
              background: 'rgba(255,255,255,0.03)', borderRadius: '6px',
              cursor: 'pointer',
            }}
              onClick={() => onFollowUpQuestion?.(q)}
            >
              → {q}
            </div>
          ))}
        </div>
      )}

      {/* 横纵联动引导（场景 Demo 专用） */}
      {report.nextStepHint && (
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: 'linear-gradient(135deg, rgba(68,136,255,0.10), rgba(68,100,255,0.05))',
          border: '1px solid rgba(68,136,255,0.25)',
          borderRadius: 10,
          color: '#9bb8ff', fontSize: '12px', fontFamily: 'system-ui', lineHeight: 1.7,
        }}>
          {report.nextStepHint}
        </div>
      )}
    </div>
  );
}
