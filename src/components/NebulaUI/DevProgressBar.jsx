export default function DevProgressBar({ runDemo }) {
  return (
    <div className="dev-progress-bar" onClick={runDemo} style={{ cursor: 'pointer' }}>
      <div className="dot-track">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={`dot${i < 10 ? ' on' : ''}${i === 9 ? ' head' : ''}`}
          />
        ))}
      </div>
      <div><span className="dev-label" style={{ color: '#ffd700' }}>播放</span><span className="pixel-text" style={{ fontSize: 14, lineHeight: 1.4, verticalAlign: 'middle' }}>demo</span></div>
    </div>
  );
}
