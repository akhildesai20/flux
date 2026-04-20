function MotionPrompt({ hasMotion, motionRequested, onRequest, error }) {
  if (hasMotion) {
    return null;
  }

  if (motionRequested && error) {
    return (
      <div className="motion-overlay">
        <article className="motion-card">
          <h2>Motion Control Disabled</h2>
          <p>{error}</p>
        </article>
      </div>
    );
  }

  if (!motionRequested || !hasMotion) {
    return (
      <div className="motion-overlay">
        <article className="motion-card">
          <div className="motion-icon" aria-hidden="true">
            📱↔
          </div>
          <h2>Enable Motion Control</h2>
          <p>Tilt your device to control the fluid.</p>
          <button type="button" onClick={onRequest}>
            Enable Motion
          </button>
          <small>Keyboard controls not available (motion required)</small>
          {error ? <small className="error-text">{error}</small> : null}
        </article>
      </div>
    );
  }

  return null;
}

export default MotionPrompt;
