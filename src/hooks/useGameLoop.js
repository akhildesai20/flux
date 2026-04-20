import { useEffect, useMemo, useRef, useState } from "react";

function useGameLoop(simulator, sensor, canvasRef) {
  const frameRef = useRef(0);
  const timeRef = useRef(performance.now());
  const samplesRef = useRef([]);
  const [fps, setFps] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let active = true;
    setIsRunning(true);

    const loop = (now) => {
      if (!active) return;
      const deltaTime = Math.min((now - timeRef.current) / 1000, 0.033) || 0.016;
      timeRef.current = now;

      simulator.setForce(sensor.forceX, sensor.forceY, sensor.forceMag);
      simulator.update(deltaTime);
      canvasRef.current?.renderFrame();

      samplesRef.current.push(deltaTime);
      if (samplesRef.current.length === 10) {
        const sum = samplesRef.current.reduce((acc, value) => acc + value, 0);
        setFps(Math.round(1 / (sum / samplesRef.current.length)));
        samplesRef.current.length = 0;
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      setIsRunning(false);
      cancelAnimationFrame(frameRef.current);
    };
  }, [canvasRef, sensor.forceMag, sensor.forceX, sensor.forceY, simulator]);

  return useMemo(() => ({ fps, isRunning }), [fps, isRunning]);
}

export default useGameLoop;
