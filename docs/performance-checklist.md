# Flux Performance Checklist

## Targets
- Maintain `55-60 FPS` on default `21x21` grid.
- Keep frame time under `16ms` in Chrome/Safari performance recordings.
- Keep memory usage stable and below `20-25MB` during continuous use.

## Checklist
- Use `requestAnimationFrame` loop only once.
- Avoid object allocation in the frame loop.
- Cache canvas sizing values and cell size.
- Keep simulator update path deterministic (`gravity -> force -> diffusion -> advection -> decay`).
- Test `14x14`, `21x21`, and `32x32` profiles separately.

## If FPS Drops
- Lower grid to `14x14`.
- Reduce diffusion iterations or decay pressure.
- Migrate grids to `Float32Array` for `>25x25`.
- Move simulation to worker/offscreen canvas as advanced fallback.
