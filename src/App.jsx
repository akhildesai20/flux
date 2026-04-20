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
import FluidSimulator from "./simulation/FluidSimulator";

const DEFAULTS = {
  gridSize: 21,
  colorScheme: "blueCyan",
  gravity: 0.15,
  viscosity: 0.0001,
  decay: 0.99,
  wallDamping: 0.82,
  pressureIterations: 22,
  shearViscosity: 0.08,
  surfaceTension: 0.12,
};

function App() {
  const [gridSize, setGridSize] = useState(DEFAULTS.gridSize);
  const [colorScheme, setColorScheme] = useState(DEFAULTS.colorScheme);
  const [customColor, setCustomColor] = useState("#35d4ff");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [gravity, setGravity] = useState(DEFAULTS.gravity);
  const [viscosity, setViscosity] = useState(DEFAULTS.viscosity);
  const [decay, setDecay] = useState(DEFAULTS.decay);
  const [wallDamping, setWallDamping] = useState(DEFAULTS.wallDamping);
  const [pressureIterations, setPressureIterations] = useState(DEFAULTS.pressureIterations);
  const [shearViscosity, setShearViscosity] = useState(DEFAULTS.shearViscosity);
  const [surfaceTension, setSurfaceTension] = useState(DEFAULTS.surfaceTension);

  const sensor = useSensorInput();
  const { theme, toggleTheme } = useTheme();
  const simulator = useMemo(() => new FluidSimulator(gridSize, gridSize), [gridSize]);
  simulator.gravity = gravity;
  simulator.diffusion = viscosity;
  simulator.decay = decay;
  simulator.wallDamping = wallDamping;
  simulator.pressureIterations = pressureIterations;
  simulator.shearViscosity = shearViscosity;
  simulator.surfaceTension = surfaceTension;

  const rendererRef = useRef(null);
  const { fps } = useGameLoop(simulator, sensor, rendererRef);

  const handleReset = () => {
    setGravity(DEFAULTS.gravity);
    setViscosity(DEFAULTS.viscosity);
    setDecay(DEFAULTS.decay);
    setWallDamping(DEFAULTS.wallDamping);
    setPressureIterations(DEFAULTS.pressureIterations);
    setShearViscosity(DEFAULTS.shearViscosity);
    setSurfaceTension(DEFAULTS.surfaceTension);
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
          <PhysicsSlider label="Gravity" value={gravity} min={0} max={0.5} step={0.01} onChange={setGravity} />
          <PhysicsSlider
            label="Viscosity"
            value={viscosity}
            min={0}
            max={0.002}
            step={0.0001}
            onChange={setViscosity}
          />
          <PhysicsSlider label="Decay" value={decay} min={0.9} max={1} step={0.001} onChange={setDecay} />
          <PhysicsSlider
            label="Wall Damping"
            value={wallDamping}
            min={0.2}
            max={1}
            step={0.01}
            onChange={setWallDamping}
          />
          <PhysicsSlider
            label="Pressure Iterations"
            value={pressureIterations}
            min={8}
            max={40}
            step={1}
            onChange={(value) => setPressureIterations(Math.round(value))}
          />
          <PhysicsSlider
            label="Shear Viscosity"
            value={shearViscosity}
            min={0}
            max={0.3}
            step={0.01}
            onChange={setShearViscosity}
          />
          <PhysicsSlider
            label="Surface Tension"
            value={surfaceTension}
            min={0}
            max={0.4}
            step={0.01}
            onChange={setSurfaceTension}
          />
        </div>
        <ResetButton onClick={handleReset} />
        <div className="info-section">
          <h3>Current Stats</h3>
          <p>FPS: {fps}</p>
          <p>
            Grid: {gridSize}x{gridSize}
          </p>
          <p>Color: {colorScheme}</p>
          <p>Pressure Iterations: {pressureIterations}</p>
        </div>
      </BottomSheet>

      <MotionPrompt hasMotion={sensor.hasMotion} motionRequested={sensor.isRequested} onRequest={sensor.requestMotionPermission} error={sensor.error} />
    </div>
  );
}

export default App;
