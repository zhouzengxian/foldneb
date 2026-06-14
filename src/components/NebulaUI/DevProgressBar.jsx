export default function DevProgressBar() {
  return (
    <div className="dev-progress-bar">
      <div className="dot-track">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={`dot${i < 9 ? ' on' : ''}${i === 8 ? ' head' : ''}`}
          />
        ))}
      </div>
      <div className="dev-label">开发进度</div>
      <div className="pixel-text">90%</div>
    </div>
  );
}
