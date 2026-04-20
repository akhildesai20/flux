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
  decay: 0.985,
  wallDamping: 0.6,
  pressureIterations: 20,
  pressureStrength: 1.8,
  shearViscosity: 0.00008,
  surfaceTension: 0.15,
  pileUpBias: 0.08,
  dissipation: 0.96,
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
  const [pressureStrength, setPressureStrength] = useState(DEFAULTS.pressureStrength);
  const [shearViscosity, setShearViscosity] = useState(DEFAULTS.shearViscosity);
  const [surfaceTension, setSurfaceTension] = useState(DEFAULTS.surfaceTension);
  const [pileUpBias, setPileUpBias] = useState(DEFAULTS.pileUpBias);
  const [dissipation, setDissipation] = useState(DEFAULTS.dissipation);

  const sensor = useSensorInput();
  const { theme, toggleTheme } = useTheme();
  const simulator = useMemo(() => new FluidSimulator(gridSize, gridSize), [gridSize]);
  simulator.gravity = gravity;
  simulator.diffusion = viscosity;
  simulator.decay = decay;
  simulator.wallDamping = wallDamping;
  simulator.pressureIterations = pressureIterations;
  simulator.pressureStrength = pressureStrength;
  simulator.shearViscosity = shearViscosity;
  simulator.surfaceTension = surfaceTension;
  simulator.pileUpBias = pileUpBias;
  simulator.dissipation = dissipation;

  const rendererRef = useRef(null);
  const { fps } = useGameLoop(simulator, sensor, rendererRef);

  const handleReset = () => {
    setGravity(DEFAULTS.gravity);
    setViscosity(DEFAULTS.viscosity);
    setDecay(DEFAULTS.decay);
    setWallDamping(DEFAULTS.wallDamping);
    setPressureIterations(DEFAULTS.pressureIterations);
    setPressureStrength(DEFAULTS.pressureStrength);
    setShearViscosity(DEFAULTS.shearViscosity);
    setSurfaceTension(DEFAULTS.surfaceTension);
    setPileUpBias(DEFAULTS.pileUpBias);
    setDissipation(DEFAULTS.dissipation);
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
            min={10}
            max={30}
            step={1}
            onChange={(value) => setPressureIterations(Math.round(value))}
          />
          <PhysicsSlider
            label="Pressure Strength"
            value={pressureStrength}
            min={1.2}
            max={2.5}
            step={0.05}
            onChange={setPressureStrength}
          />
          <PhysicsSlider
            label="Shear Viscosity"
            value={shearViscosity}
            min={0}
            max={0.001}
            step={0.00001}
            onChange={setShearViscosity}
          />
          <PhysicsSlider
            label="Surface Tension"
            value={surfaceTension}
            min={0}
            max={0.35}
            step={0.01}
            onChange={setSurfaceTension}
          />
          <PhysicsSlider label="Pile Up Bias" value={pileUpBias} min={0.02} max={0.2} step={0.01} onChange={setPileUpBias} />
          <PhysicsSlider
            label="Dissipation"
            value={dissipation}
            min={0.94}
            max={0.99}
            step={0.001}
            onChange={setDissipation}
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
