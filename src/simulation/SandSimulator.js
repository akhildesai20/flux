export class SandSimulator {
  constructor(width, height, particleCount = 5000) {
    this.width = width;
    this.height = height;
    this.particleCount = particleCount;
    this.maxParticlesPerCell = 12;
    this.grid = Array.from({ length: width }, () => Array.from({ length: height }, () => 0));
    this.gravity_x = 0;
    this.gravity_y = 1;
    this.reset();
  }

  setForce(fx, fy, magnitude) {
    if (magnitude < 0.01) return;
    const mag = Math.sqrt(fx * fx + fy * fy);
    if (mag < 0.0001) return;
    this.gravity_x = fx / mag;
    this.gravity_y = fy / mag;
  }

  update() {
    const newGrid = Array.from({ length: this.width }, () => Array.from({ length: this.height }, () => 0));

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const count = this.grid[x][y];
        if (count === 0) continue;

        for (let i = 0; i < count; i += 1) {
          const { nx, ny } = this.findNewPosition(x, y, newGrid);

          if (!this.addParticleToCell(nx, ny, newGrid)) {
            // Destination was full or invalid: keep particle at source.
            // If source cell is already at max in newGrid, we still add one to conserve particle count.
            this.addParticleToCell(x, y, newGrid, true);
          }
        }
      }
    }

    this.grid = newGrid;
  }

  findNewPosition(x, y, newGrid) {
    const primaryDx = this.gravity_x > 0 ? 1 : this.gravity_x < 0 ? -1 : 0;
    const primaryDy = this.gravity_y > 0 ? 1 : this.gravity_y < 0 ? -1 : 0;
    const primaryMagnitude = Math.max(Math.abs(this.gravity_x), Math.abs(this.gravity_y));

    if (Math.random() < primaryMagnitude) {
      const nx = x + primaryDx;
      const ny = y + primaryDy;
      if (this.isEmpty(nx, ny, newGrid)) {
        return { nx, ny };
      }
    }

    if (primaryDx !== 0 && primaryDy !== 0) {
      const tryX = Math.random() > 0.5;
      if (tryX && this.isEmpty(x + primaryDx, y, newGrid)) {
        return { nx: x + primaryDx, ny: y };
      }
      if (this.isEmpty(x, y + primaryDy, newGrid)) {
        return { nx: x, ny: y + primaryDy };
      }
    } else if (primaryDx !== 0) {
      const tryUp = Math.random() > 0.5;
      if (tryUp && this.isEmpty(x, y - 1, newGrid)) {
        return { nx: x, ny: y - 1 };
      }
      if (this.isEmpty(x, y + 1, newGrid)) {
        return { nx: x, ny: y + 1 };
      }
    } else if (primaryDy !== 0) {
      const tryLeft = Math.random() > 0.5;
      if (tryLeft && this.isEmpty(x - 1, y, newGrid)) {
        return { nx: x - 1, ny: y };
      }
      if (this.isEmpty(x + 1, y, newGrid)) {
        return { nx: x + 1, ny: y };
      }
    }

    return { nx: x, ny: y };
  }

  addParticleToCell(x, y, newGrid, allowOverflow = false) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    if (allowOverflow || newGrid[x][y] < this.maxParticlesPerCell) {
      newGrid[x][y] += 1;
      return true;
    }
    return false;
  }

  isEmpty(x, y, newGrid) {
    return (
      x >= 0 &&
      x < this.width &&
      y >= 0 &&
      y < this.height &&
      newGrid[x][y] < this.maxParticlesPerCell
    );
  }

  getDensity(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
    const normalized = Math.min(1, this.grid[x][y] / this.maxParticlesPerCell);
    return Math.sqrt(normalized);
  }

  reset() {
    this.grid = Array.from({ length: this.width }, () => Array.from({ length: this.height }, () => 0));
    const topThird = Math.floor(this.height / 3);
    let placed = 0;

    for (let x = 0; x < this.width && placed < this.particleCount; x += 1) {
      for (let y = 0; y < topThird && placed < this.particleCount; y += 1) {
        const count = Math.floor(Math.random() * 10) + 5;
        this.grid[x][y] = Math.min(this.maxParticlesPerCell, this.grid[x][y] + count);
        placed += count;
      }
    }
  }

  clear() {
    this.grid = Array.from({ length: this.width }, () => Array.from({ length: this.height }, () => 0));
  }
}

export default SandSimulator;
