export class SandSimulator {
  constructor(width, height, particleCount = 5000) {
    this.width = width;
    this.height = height;
    this.particleCount = particleCount;
    this.maxParticlesPerCell = 12;
    this.grid = Array.from({ length: width }, () => Array.from({ length: height }, () => 0));
    this.gravity_x = 0;
    this.gravity_y = 0;
    this.reset();
  }

  setForce(fx, fy, magnitude) {
    if (Math.abs(fx) < 0.08) {
      this.gravity_x = 0;
      this.gravity_y = 0;
      return;
    }

    this.gravity_x = fx > 0 ? 1 : -1;
    this.gravity_y = 0;
  }

  update() {
    const newGrid = Array.from({ length: this.width }, () => Array.from({ length: this.height }, () => 0));

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const count = this.grid[x][y];
        if (count === 0) continue;

        for (let i = 0; i < count; i += 1) {
          const { nx, ny } = this.findNewPosition(x, y, newGrid);

          if (this.isEmpty(nx, ny, newGrid)) {
            newGrid[nx][ny] += 1;
          } else {
            newGrid[x][y] += 1;
          }
        }
      }
    }

    this.grid = newGrid;
  }

  findNewPosition(x, y, newGrid) {
    const primaryDx = this.gravity_x;
    const primaryDy = 1;

    const nx1 = x + primaryDx;
    const ny1 = y + primaryDy;
    if (this.isEmpty(nx1, ny1, newGrid)) {
      return { nx: nx1, ny: ny1 };
    }

    const nx2 = x;
    const ny2 = y + 1;
    if (this.isEmpty(nx2, ny2, newGrid)) {
      return { nx: nx2, ny: ny2 };
    }

    if (primaryDx !== 0) {
      const nx3 = x + primaryDx;
      const ny3 = y;
      if (this.isEmpty(nx3, ny3, newGrid)) {
        return { nx: nx3, ny: ny3 };
      }

      const nx4 = x - primaryDx;
      const ny4 = y;
      if (this.isEmpty(nx4, ny4, newGrid)) {
        return { nx: nx4, ny: ny4 };
      }
    }

    return { nx: x, ny: y };
  }

  isEmpty(x, y, newGrid) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    return newGrid[x][y] < this.maxParticlesPerCell;
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

    console.log("Reset: placed", placed, "particles");
  }

  clear() {
    this.grid = Array.from({ length: this.width }, () => Array.from({ length: this.height }, () => 0));
  }
}

export default SandSimulator;
