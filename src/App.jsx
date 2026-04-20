import { useMemo, useRef, useState } from "react";
import BottomSheet from "./components/BottomSheet";
import CanvasRenderer from "./components/CanvasRenderer";
import MotionPrompt from "./components/MotionPrompt";
import StatsDisplay from "./components/StatsDisplay";
import ColorSchemeSelector from "./components/controls/ColorSchemeSelector";
import GridSizeSelector from "./components/controls/GridSizeSelector";
import PhysicsSlider from "./components/controls/PhysicsSlider";
import ResetButton from "./components/controls/ResetButton";
import useGameLoop from "./hooks/useGameLoop";
import useSensorInput from "./hooks/useSensorInput";
import useTheme from "./hooks/useTheme";
import ParticleSimulator from "./simulation/ParticleSimulator";

const DEFAULTS = {
  gridSize: 21,
  colorScheme: "blueCyan",
  speed: 1,
  randomness: 0.5,
};

function App() {
  const [gridSize, setGridSize] = useState(DEFAULTS.gridSize);
  const [colorScheme, setColorScheme] = useState(DEFAULTS.colorScheme);
  const [customColor, setCustomColor] = useState("#35d4ff");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [speed, setSpeed] = useState(DEFAULTS.speed);
  const [randomness, setRandomness] = useState(DEFAULTS.randomness);

  const sensor = useSensorInput();
  const { theme, toggleTheme } = useTheme();
  const simulator = useMemo(() => new ParticleSimulator(gridSize, gridSize), [gridSize]);
  simulator.speed = speed;
  simulator.randomness = randomness;

  const rendererRef = useRef(null);
  const { fps } = useGameLoop(simulator, sensor, rendererRef);

  const handleReset = () => {
    setSpeed(DEFAULTS.speed);
    setRandomness(DEFAULTS.randomness);
    simulator.reset();
  };

  return (
    <div className="app-shell" onContextMenu={(event) => event.preventDefault()}>
      <main className="canvas-area">
        <CanvasRenderer
          ref={rendererRef}
          gridSize={gridSize}
          colorScheme={colorScheme}
          customColor={customColor}
          simulator={simulator}
        />
      </main>

      <StatsDisplay fps={fps} gridSize={gridSize} colorScheme={colorScheme} />

      <div className="top-left-controls">
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>

      <button
        type="button"
        className="settings-fab"
        aria-label="Open settings"
        onClick={() => setSheetOpen(true)}
      >
        Settings
      </button>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <GridSizeSelector value={gridSize} onChange={setGridSize} />
        <ColorSchemeSelector
          value={colorScheme}
          onChange={setColorScheme}
          customColor={customColor}
          onCustomColorChange={setCustomColor}
        />
        <div className="slider-stack">
          <PhysicsSlider label="Speed" value={speed} min={0.5} max={2} step={0.1} onChange={setSpeed} />
          <PhysicsSlider label="Randomness" value={randomness} min={0} max={1} step={0.05} onChange={setRandomness} />
        </div>
        <ResetButton onClick={handleReset} />
        <div className="info-section">
          <h3>Current Stats</h3>
          <p>FPS: {fps}</p>
          <p>
            Grid: {gridSize}x{gridSize}
          </p>
          <p>Color: {colorScheme}</p>
          <p>Speed: {speed.toFixed(1)}x</p>
        </div>
      </BottomSheet>

      <MotionPrompt hasMotion={sensor.hasMotion} motionRequested={sensor.isRequested} onRequest={sensor.requestMotionPermission} error={sensor.error} />
    </div>
  );
}

export default App;
