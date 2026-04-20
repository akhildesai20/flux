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
    const cells = [];

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.grid[x][y] > 0) {
          cells.push({ x, y, count: this.grid[x][y] });
        }
      }
    }

    cells.sort((a, b) => {
      const dotA = a.x * this.gravity_x + a.y * this.gravity_y;
      const dotB = b.x * this.gravity_x + b.y * this.gravity_y;
      return dotB - dotA;
    });

    for (const cell of cells) {
      for (let i = 0; i < cell.count; i += 1) {
        const { nx, ny } = this.findNewPosition(cell.x, cell.y, newGrid);
        newGrid[nx][ny] += 1;
      }
    }

    this.grid = newGrid;
  }

  findNewPosition(x, y, newGrid) {
    const dx = Math.round(this.gravity_x);
    const dy = Math.round(this.gravity_y);

    const direct = { nx: x + dx, ny: y + dy };
    if (this.isEmpty(direct.nx, direct.ny, newGrid)) {
      return direct;
    }

    if (dx !== 0 && dy !== 0) {
      const canX = this.isEmpty(x + dx, y, newGrid);
      const canY = this.isEmpty(x, y + dy, newGrid);
      if (canX && canY) {
        return Math.random() > 0.5 ? { nx: x + dx, ny: y } : { nx: x, ny: y + dy };
      }
      if (canX) return { nx: x + dx, ny: y };
      if (canY) return { nx: x, ny: y + dy };
    } else if (dx !== 0) {
      const canUp = this.isEmpty(x, y - 1, newGrid);
      const canDown = this.isEmpty(x, y + 1, newGrid);
      if (canUp && canDown) {
        return Math.random() > 0.5 ? { nx: x, ny: y - 1 } : { nx: x, ny: y + 1 };
      }
      if (canUp) return { nx: x, ny: y - 1 };
      if (canDown) return { nx: x, ny: y + 1 };
    } else if (dy !== 0) {
      const canLeft = this.isEmpty(x - 1, y, newGrid);
      const canRight = this.isEmpty(x + 1, y, newGrid);
      if (canLeft && canRight) {
        return Math.random() > 0.5 ? { nx: x - 1, ny: y } : { nx: x + 1, ny: y };
      }
      if (canLeft) return { nx: x - 1, ny: y };
      if (canRight) return { nx: x + 1, ny: y };
    }

    return { nx: x, ny: y };
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
