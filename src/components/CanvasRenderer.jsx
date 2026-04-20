import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

function densityToColor(density, colorScheme, customColor = "#35d4ff") {
  const intensity = Math.floor(Math.max(0, Math.min(1, density)) * 255);
  switch (colorScheme) {
    case "blueCyan":
      if (intensity < 85) return `rgb(0,0,${Math.floor(intensity / 3)})`;
      if (intensity < 170) return `rgb(0,${Math.floor(intensity / 2)},255)`;
      return `rgb(${intensity},255,255)`;
    case "heat":
      if (intensity < 85) return "rgb(0,0,0)";
      if (intensity < 170) return `rgb(${intensity},0,0)`;
      return `rgb(255,${Math.floor(intensity / 2)},0)`;
    case "neon": {
      const r = Math.floor(Math.sin((intensity / 255) * Math.PI) * 255);
      const g = Math.floor(Math.sin(((intensity + 85) / 255) * Math.PI) * 255);
      const b = Math.floor(Math.sin(((intensity + 170) / 255) * Math.PI) * 255);
      return `rgb(${Math.max(0, r)},${Math.max(0, g)},${Math.max(0, b)})`;
    }
    case "monochrome":
      return `rgb(${intensity},${intensity},${intensity})`;
    case "rainbow":
      return `hsl(${(intensity / 255) * 360}, 100%, 50%)`;
    case "custom":
      return customColor;
    default:
      return `rgb(0,${Math.floor(intensity / 2)},255)`;
  }
}

const CanvasRenderer = forwardRef(function CanvasRenderer(
  { gridSize = 21, colorScheme = "blueCyan", customColor = "#35d4ff", simulator },
  ref,
) {
  const canvasRef = useRef(null);
  const parentRef = useRef(null);
  const drawStateRef = useRef({ cellSize: 0, canvasSize: 0 });

  const resizeCanvas = () => {
    if (!canvasRef.current || !parentRef.current) return;
    const dpr = window.devicePixelRatio || 1;
    const parentRect = parentRef.current.getBoundingClientRect();
    const canvasSize = Math.floor(Math.min(parentRect.width, parentRect.height));
    const cssSize = Math.max(canvasSize, 1);

    canvasRef.current.style.width = `${cssSize}px`;
    canvasRef.current.style.height = `${cssSize}px`;
    canvasRef.current.width = Math.floor(cssSize * dpr);
    canvasRef.current.height = Math.floor(cssSize * dpr);

    const context = canvasRef.current.getContext("2d");
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);
    drawStateRef.current = {
      cellSize: cssSize / gridSize,
      canvasSize: cssSize,
    };
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [gridSize]);

  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas || !simulator) return;
    const context = canvas.getContext("2d");
    const { cellSize, canvasSize } = drawStateRef.current;

    context.fillStyle = "black";
    context.fillRect(0, 0, canvasSize, canvasSize);
    context.strokeStyle = "rgba(60, 60, 60, 0.8)";
    context.lineWidth = 0.5;

    for (let y = 0; y < gridSize; y += 1) {
      for (let x = 0; x < gridSize; x += 1) {
        const density = simulator.getDensity(x, y);
        context.fillStyle = densityToColor(density, colorScheme, customColor);
        context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        context.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      renderFrame,
    }),
    [colorScheme, customColor, gridSize, simulator],
  );

  return (
    <div ref={parentRef} className="canvas-wrap">
      <canvas ref={canvasRef} className="fluid-canvas" aria-label="Fluid simulation canvas" tabIndex={0} />
    </div>
  );
});

export { densityToColor };
export default CanvasRenderer;
