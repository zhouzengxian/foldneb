import { renderMarkdown } from '../../utils/analysisApi.js';

/**
 * 深度分析内容渲染区
 * - loading 态：骨架提示
 * - empty 态：空状态引导
 * - data 态：元信息条 + Markdown 渲染 + 历史情报时间线（折叠）
 */
export default function AnalysisContent({
  agent,
  analysisByAgent,
  analysisLoading,
  expandedHistory,
  onToggleHistory,
}) {
  const cached = analysisByAgent[agent.id];
  const history = agent.analysisHistory || (agent.recentAnalysis ? [agent.recentAnalysis] : []);
  const latestPreset = history[0] || null;
  const pastAnalyses = history.slice(1);
  const data = cached || (latestPreset ? {
    markdown: latestPreset.markdown,
    date: latestPreset.date,
    trigger: latestPreset.trigger,
    source: 'preset',
  } : null);

  if (analysisLoading && !cached) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#7788aa', fontSize: 11 }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
        大模型正在生成深度分析…
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{
        padding: 24, textAlign: 'center', borderRadius: 10,
        background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(136,153,204,0.2)',
        color: '#8899bb', fontSize: 11, lineHeight: 1.8,
      }}>
        <div style={{ fontSize: 20, marginBottom: 8 }}>📊</div>
        暂无近期深度分析<br/>
        点击上方按钮，接入大模型一键生成
      </div>
    );
  }

  return (
    <>
      {/* 元信息条 */}
      <div style={{
        fontSize: 9.5, color: '#7788aa', marginBottom: 8, lineHeight: 1.6,
        padding: '6px 8px', background: 'rgba(136,221,170,0.04)', borderRadius: 6,
        borderLeft: '2px solid rgba(136,221,170,0.3)',
      }}>
        {data.date && <div>📅 {data.date}</div>}
        {data.trigger && <div style={{ marginTop: 2 }}>🎯 {data.trigger}</div>}
        <div style={{ marginTop: 2, opacity: 0.6 }}>
          {data.source === 'preset' ? '📋 预置样本分析' :
           data.source === 'generating' ? '⏳ 生成中…' :
           '✨ AI 实时生成'}
        </div>
      </div>
      {/* Markdown 渲染 */}
      <div
        className="analysis-md-body"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(data.markdown) }}
      />

      {/* 历史情报时间线 */}
      {pastAnalyses.length > 0 && (
        <div className="analysis-timeline">
          <div className="analysis-timeline-header">
            <span className="analysis-timeline-line" />
            <span className="analysis-timeline-label">📜 历史情报 · {pastAnalyses.length} 期</span>
            <span className="analysis-timeline-line" />
          </div>
          {pastAnalyses.map((item) => {
            const open = (expandedHistory[agent.id] || new Set()).has(item.date);
            return (
              <div key={item.date} className="analysis-timeline-item">
                <button
                  className="analysis-timeline-toggle"
                  onClick={() => onToggleHistory(item.date)}
                >
                  <span className="analysis-timeline-dot" />
                  <span className="analysis-timeline-date">{item.date}</span>
                  <span className="analysis-timeline-trigger">{item.trigger}</span>
                  <span className="analysis-timeline-arrow">{open ? '▾' : '▸'}</span>
                </button>
                {open && (
                  <div style={{ marginTop: 8, animation: 'fadeInUp 0.3s ease-out' }}>
                    <div style={{
                      fontSize: 9.5, color: '#7788aa', marginBottom: 8, lineHeight: 1.6,
                      padding: '6px 8px', background: 'rgba(136,221,170,0.03)', borderRadius: 6,
                      borderLeft: '2px solid rgba(136,221,170,0.2)',
                    }}>
                      <div>📅 {item.date}</div>
                      <div style={{ marginTop: 2 }}>🎯 {item.trigger}</div>
                      <div style={{ marginTop: 2, opacity: 0.6 }}>📋 历史预置分析</div>
                    </div>
                    <div
                      className="analysis-md-body"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(item.markdown) }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
