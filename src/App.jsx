import { useEffect, useMemo, useRef, useState } from "react";
import useSensorInput from "./hooks/useSensorInput";
import SandSimulator from "./simulation/SandSimulator";

const DEFAULTS = {
  gridSize: 32,
};

const GRID_OPTIONS = [16, 32, 64];

function getParticleRange(gridSize) {
  return {
    min: 16,
    max: Math.max(16, Math.floor((gridSize * gridSize) / 2)),
  };
}

function App() {
  const [gridSize, setGridSize] = useState(DEFAULTS.gridSize);
  const initialRange = getParticleRange(DEFAULTS.gridSize);
  const [particleCount, setParticleCount] = useState(Math.floor((initialRange.min + initialRange.max) / 2));
  const [fps, setFps] = useState(0);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [motionRequested, setMotionRequested] = useState(false);
  const sensor = useSensorInput();
  const simulator = useMemo(() => new SandSimulator(gridSize, gridSize, particleCount), [gridSize, particleCount]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const fpsRef = useRef([]);
  const lastFrameTimeRef = useRef(0);
  const particleRange = getParticleRange(gridSize);

  useEffect(() => {
    setParticleCount((current) => Math.min(particleRange.max, Math.max(particleRange.min, current)));
  }, [particleRange.max, particleRange.min]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    let running = true;

    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const size = Math.max(1, Math.min(rect.width, rect.height) - 20);
      canvas.width = size;
      canvas.height = size;
    };

    const animate = () => {
      if (!running) return;

      const now = performance.now();
      if (lastFrameTimeRef.current) {
        const deltaTime = (now - lastFrameTimeRef.current) / 1000;
        fpsRef.current.push(1 / deltaTime);
        if (fpsRef.current.length > 10) fpsRef.current.shift();
        if (fpsRef.current.length === 10) {
          const average = fpsRef.current.reduce((sum, value) => sum + value, 0) / 10;
          setFps(Math.round(average));
        }
      }
      lastFrameTimeRef.current = now;

      simulator.setForce(sensor.forceX, sensor.forceY, sensor.forceMag);
      simulator.update(0.016);

      context.fillStyle = "#000";
      context.fillRect(0, 0, canvas.width, canvas.height);

      const cellSize = canvas.width / gridSize;
      for (let y = 0; y < gridSize; y += 1) {
        for (let x = 0; x < gridSize; x += 1) {
          const density = simulator.getDensity(x, y);
          context.fillStyle = density > 0 ? "#39ff14" : "#000";
          context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          context.strokeStyle = "#222";
          context.lineWidth = 0.5;
          context.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [gridSize, sensor.forceMag, sensor.forceX, sensor.forceY, simulator]);

  const requestMotion = async () => {
    setMotionRequested(true);
    await sensor.requestMotionPermission();
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#000" }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
        <canvas ref={canvasRef} style={{ border: "1px solid #333", background: "#000" }} />
        <div
          style={{
            position: "fixed",
            top: "12px",
            right: "12px",
            color: "#0f0",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        >
          FPS: {fps} | Grid: {gridSize}x{gridSize} | Green | Particles: {simulator.getParticleCount()}
        </div>
      </div>

      <button
        onClick={() => setBottomSheetOpen((open) => !open)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          padding: "12px 24px",
          background: "#007aff",
          color: "#fff",
          border: "none",
          borderRadius: "24px",
          cursor: "pointer",
          zIndex: 100,
        }}
      >
        Settings
      </button>

      {!motionRequested && !sensor.isRequested ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "12px", textAlign: "center", maxWidth: "320px" }}>
            <h2>Enable Motion</h2>
            <p>Tilt your device to control the sand</p>
            <button
              onClick={requestMotion}
              style={{
                padding: "12px 24px",
                background: "#007aff",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Enable
            </button>
            {sensor.error ? <p style={{ color: "#b00020" }}>{sensor.error}</p> : null}
          </div>
        </div>
      ) : null}

      {bottomSheetOpen ? (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#1a1a1a",
            color: "#fff",
            padding: "2rem",
            borderRadius: "12px 12px 0 0",
            zIndex: 999,
          }}
        >
          <h3>Settings</h3>
          <div style={{ marginBottom: "1rem" }}>
            <label>Grid Size</label>
            <div>
              {GRID_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => setGridSize(size)}
                  style={{
                    padding: "8px 16px",
                    margin: "4px",
                    background: gridSize === size ? "#007aff" : "#333",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {size}x{size}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label>Particles</label>
            <div style={{ marginTop: "8px" }}>
              <input
                type="range"
                min={particleRange.min}
                max={particleRange.max}
                step={1}
                value={particleCount}
                onChange={(event) => setParticleCount(Number(event.target.value))}
                style={{ width: "100%" }}
              />
              <div style={{ fontSize: "12px", marginTop: "4px", color: "#b8beca" }}>
                {particleCount} (min {particleRange.min}, max {particleRange.max})
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              simulator.reset();
              setBottomSheetOpen(false);
            }}
            style={{
              padding: "12px 24px",
              background: "#ff3b30",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Reset
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default App;
