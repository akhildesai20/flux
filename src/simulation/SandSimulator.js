export class SandSimulator {
  constructor(width, height, particleCount = 5000) {
    this.width = width;
    this.height = height;
    this.particleCount = Math.min(particleCount, Math.floor(width * height * 0.6));
    this.grid = Array.from({ length: width }, () => Array.from({ length: height }, () => 0));
    this.gravity_x = 0;
    this.gravity_y = 1;
    this.totalParticles = 0;
    this.reset();
  }

  setForce(fx, fy, magnitude) {
    // MicroBit-like behavior: gravity comes from both axes, then is normalized.
    const gx = Number.isFinite(fx) ? fx : 0;
    const gy = Number.isFinite(fy) ? fy : 0;
    const mag = Math.sqrt(gx * gx + gy * gy);
    if (mag < 0.03 || magnitude < 0.03) {
      this.gravity_x = 0;
      this.gravity_y = 1;
      return;
    }

    this.gravity_x = gx / mag;
    this.gravity_y = gy / mag;
  }

  update() {
    const newGrid = Array.from({ length: this.width }, () => Array.from({ length: this.height }, () => 0));
    const cells = [];

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const count = this.grid[x][y];
        if (count > 0) {
          cells.push({ x, y, count });
        }
      }
    }

    // ESP32-like downstream ordering: process particles in current gravity direction first.
    const gravityVecY = 1;
    cells.sort((a, b) => {
      const da = a.x * this.gravity_x + a.y * this.gravity_y;
      const db = b.x * this.gravity_x + b.y * this.gravity_y;
      return db - da;
    });

    for (const cell of cells) {
      const count = cell.count;
      for (let i = 0; i < count; i += 1) {
        const { nx, ny } = this.findNewPosition(cell.x, cell.y, newGrid);
        if (this.isEmpty(nx, ny, newGrid)) {
          newGrid[nx][ny] += 1;
        } else {
          newGrid[cell.x][cell.y] += 1;
        }
      }
    }

    this.grid = newGrid;
  }

  findNewPosition(x, y, newGrid) {
    const sx = this.gravity_x === 0 ? 0 : this.gravity_x > 0 ? 1 : -1;
    const sy = this.gravity_y === 0 ? 0 : this.gravity_y > 0 ? 1 : -1;

    // 1) primary direction
    const primary = { nx: x + sx, ny: y + sy };
    if (this.isEmpty(primary.nx, primary.ny, newGrid)) return primary;

    // 2) axis fallback (stronger component first)
    const xFirst = Math.abs(this.gravity_x) >= Math.abs(this.gravity_y);
    const axisA = xFirst ? { nx: x + sx, ny: y } : { nx: x, ny: y + sy };
    const axisB = xFirst ? { nx: x, ny: y + sy } : { nx: x + sx, ny: y };
    if (this.isEmpty(axisA.nx, axisA.ny, newGrid)) return axisA;
    if (this.isEmpty(axisB.nx, axisB.ny, newGrid)) return axisB;

    // 3) perpendicular spread for piling
    const sideA = { nx: x - sy, ny: y + sx };
    const sideB = { nx: x + sy, ny: y - sx };
    if (this.isEmpty(sideA.nx, sideA.ny, newGrid)) return sideA;
    if (this.isEmpty(sideB.nx, sideB.ny, newGrid)) return sideB;

    // 4) blocked
    return { nx: x, ny: y };
  }

  isEmpty(x, y, newGrid) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    return newGrid[x][y] === 0;
  }

  getDensity(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
    return this.grid[x][y] > 0 ? 1 : 0;
  }

  getParticleCount() {
    let total = 0;
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        total += this.grid[x][y];
      }
    }
    return total;
  }

  reset() {
    this.grid = Array.from({ length: this.width }, () => Array.from({ length: this.height }, () => 0));
    const topThird = Math.max(1, Math.floor(this.height / 3));
    let placed = 0;

    for (let y = 0; y < topThird && placed < this.particleCount; y += 1) {
      for (let x = 0; x < this.width && placed < this.particleCount; x += 1) {
        if (Math.random() < 0.72) {
          this.grid[x][y] = 1;
          placed += 1;
        }
      }
    }

    // If randomness under-filled, top up sequentially.
    for (let y = 0; y < topThird && placed < this.particleCount; y += 1) {
      for (let x = 0; x < this.width && placed < this.particleCount; x += 1) {
        if (this.grid[x][y] === 0) {
          this.grid[x][y] = 1;
          placed += 1;
        }
      }
    }

    this.totalParticles = placed;
    console.log("Reset: placed", placed, "particles");
  }

  clear() {
    this.grid = Array.from({ length: this.width }, () => Array.from({ length: this.height }, () => 0));
  }
}

export default SandSimulator;
