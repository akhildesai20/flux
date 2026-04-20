class ParticleSimulator {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: width }, () => Array.from({ length: height }, () => 0));
    this.gravity_dx = 0;
    this.gravity_dy = 1;
    this.randomness = 0.5;
    this.speed = 1;
    this.reset();
  }

  setForce(fx, fy, magnitude) {
    if (magnitude < 0.01) return;
    const mag = Math.sqrt(fx * fx + fy * fy);
    if (mag < 0.0001) return;
    this.gravity_dx = fx / mag;
    this.gravity_dy = fy / mag;
  }

  update() {
    const stepCount = Math.max(1, Math.round(this.speed));
    const shouldStep = this.speed >= 1 ? true : Math.random() < this.speed;
    if (!shouldStep) return;

    for (let step = 0; step < stepCount; step += 1) {
      const newGrid = Array.from({ length: this.width }, () => Array.from({ length: this.height }, () => 0));

      const xStart = this.gravity_dx >= 0 ? this.width - 1 : 0;
      const xEnd = this.gravity_dx >= 0 ? -1 : this.width;
      const xStep = this.gravity_dx >= 0 ? -1 : 1;
      const yStart = this.gravity_dy >= 0 ? this.height - 1 : 0;
      const yEnd = this.gravity_dy >= 0 ? -1 : this.height;
      const yStep = this.gravity_dy >= 0 ? -1 : 1;

      for (let y = yStart; y !== yEnd; y += yStep) {
        for (let x = xStart; x !== xEnd; x += xStep) {
          if (this.grid[x][y] !== 1) continue;
          const { nx, ny } = this.getNewPosition(x, y, newGrid);
          newGrid[nx][ny] = 1;
        }
      }

      this.grid = newGrid;
    }
  }

  getNewPosition(x, y, newGrid) {
    const primaryDx = Math.round(this.gravity_dx);
    const primaryDy = Math.round(this.gravity_dy);

    const direct = { nx: x + primaryDx, ny: y + primaryDy };
    if (this.isValidAndEmpty(direct.nx, direct.ny, newGrid)) return direct;

    if (primaryDx !== 0 && primaryDy !== 0) {
      const xOnly = { nx: x + primaryDx, ny: y };
      const yOnly = { nx: x, ny: y + primaryDy };
      const canX = this.isValidAndEmpty(xOnly.nx, xOnly.ny, newGrid);
      const canY = this.isValidAndEmpty(yOnly.nx, yOnly.ny, newGrid);
      if (canX && canY) return Math.random() < this.randomness ? xOnly : yOnly;
      if (canX) return xOnly;
      if (canY) return yOnly;
    } else if (primaryDx !== 0) {
      const up = { nx: x, ny: y - 1 };
      const down = { nx: x, ny: y + 1 };
      const canUp = this.isValidAndEmpty(up.nx, up.ny, newGrid);
      const canDown = this.isValidAndEmpty(down.nx, down.ny, newGrid);
      if (canUp && canDown) return Math.random() < this.randomness ? up : down;
      if (canUp) return up;
      if (canDown) return down;
    } else if (primaryDy !== 0) {
      const left = { nx: x - 1, ny: y };
      const right = { nx: x + 1, ny: y };
      const canLeft = this.isValidAndEmpty(left.nx, left.ny, newGrid);
      const canRight = this.isValidAndEmpty(right.nx, right.ny, newGrid);
      if (canLeft && canRight) return Math.random() < this.randomness ? left : right;
      if (canLeft) return left;
      if (canRight) return right;
    }

    return { nx: x, ny: y };
  }

  isValidAndEmpty(x, y, newGrid) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height && newGrid[x][y] === 0;
  }

  getDensity(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
    return this.grid[x][y];
  }

  reset() {
    this.grid = Array.from({ length: this.width }, () => Array.from({ length: this.height }, () => 0));
    const fillRows = Math.min(3, this.height);
    for (let x = 0; x < this.width; x += 1) {
      for (let y = 0; y < fillRows; y += 1) {
        this.grid[x][y] = 1;
      }
    }
  }
}

export default ParticleSimulator;
