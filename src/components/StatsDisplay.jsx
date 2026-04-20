function toTitleCase(value) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (match) => match.toUpperCase());
}

function StatsDisplay({ fps, gridSize, colorScheme }) {
  return (
    <aside className="stats-display" aria-live="polite">
      <p>FPS: {fps}</p>
      <p>
        Grid: {gridSize}x{gridSize}
      </p>
      <p>Scheme: {toTitleCase(colorScheme)}</p>
    </aside>
  );
}

export default StatsDisplay;
