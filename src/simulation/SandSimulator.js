class PixelObject {
  constructor(x, y, inId) {
    this.xPos = x;
    this.yPos = y;
    this.id = inId;
    this.isOn = false;
    this.gravityOn = false;
  }
}

class ArrayRow {
  constructor(width) {
    this.row = Array.from({ length: width }, () => 0);
  }
}

class Matrix {
  constructor(width, height) {
    this.rows = Array.from({ length: height }, () => new ArrayRow(width).row.slice());
  }

  clear() {
    for (let y = 0; y < this.rows.length; y += 1) {
      this.rows[y].fill(0);
    }
  }
}

export class SandSimulator {
  constructor(width, height, particleCount = 5000) {
    this.width = width;
    this.height = height;
    // Keep headroom so dots can move; a fully packed matrix appears frozen.
    this.particleCount = Math.min(particleCount, Math.floor(width * height * 0.35));
    this.dots = [];
    this.grid = Array.from({ length: this.width }, () => Array.from({ length: this.height }, () => 0));
    this.fieldMatrix = new Matrix(width, height);
    this.forceX = 0;
    this.forceY = 0;
    this.rollThreshold = 0.02;
    this.pitchThreshold = 0.02;
    this.reset();
  }

  setForce(fx, fy, magnitude = 0) {
    this.forceX = Number.isFinite(fx) ? fx : 0;
    this.forceY = Number.isFinite(fy) ? fy : 0;
    const mag = Number.isFinite(magnitude) ? magnitude : 0;

    // With little/no motion input, keep gravity acting downward so the pile settles visibly.
    if (mag < 0.02) {
      this.forceX = 0;
      this.forceY = 1;
    }
  }

  update() {
    this.rebuildFieldMatrix();
    for (let i = 0; i < this.dots.length; i += 1) {
      const dot = this.dots[i];
      if (!dot.isOn || !dot.gravityOn) continue;

      if (this.forceX > this.rollThreshold) {
        this.moveDot("r", dot);
      } else if (this.forceX < -this.rollThreshold) {
        this.moveDot("l", dot);
      }

      if (this.forceY > this.pitchThreshold) {
        this.moveDot("d", dot);
      } else if (this.forceY < -this.pitchThreshold) {
        this.moveDot("u", dot);
      }
    }
    this.rebuildGrid();
  }

  moveDot(direction, dot) {
    const oldX = dot.xPos;
    const oldY = dot.yPos;
    let nx = oldX;
    let ny = oldY;

    if (direction === "r" && oldX < this.width - 1) nx += 1;
    if (direction === "l" && oldX > 0) nx -= 1;
    if (direction === "u" && oldY > 0) ny -= 1;
    if (direction === "d" && oldY < this.height - 1) ny += 1;

    if (nx === oldX && ny === oldY) return;

    // Fast collision lookup by matrix (mirrors reference intent).
    if (this.fieldMatrix.rows[ny][nx] === 1) return;

    dot.xPos = nx;
    dot.yPos = ny;

    // Keep matrix in sync so subsequent dots in this frame see occupied spot.
    this.fieldMatrix.rows[oldY][oldX] = 0;
    this.fieldMatrix.rows[ny][nx] = 1;
  }

  rebuildFieldMatrix() {
    this.fieldMatrix.clear();
    for (let i = 0; i < this.dots.length; i += 1) {
      const dot = this.dots[i];
      if (!dot.isOn) continue;
      this.fieldMatrix.rows[dot.yPos][dot.xPos] = 1;
    }
  }

  rebuildGrid() {
    for (let x = 0; x < this.width; x += 1) {
      this.grid[x].fill(0);
    }
    for (let i = 0; i < this.dots.length; i += 1) {
      const dot = this.dots[i];
      if (!dot.isOn) continue;
      this.grid[dot.xPos][dot.yPos] = 1;
    }
  }

  toggleGravity() {
    for (let i = 0; i < this.dots.length; i += 1) {
      this.dots[i].gravityOn = !this.dots[i].gravityOn;
    }
  }

  togglePixels() {
    for (let i = 0; i < this.dots.length; i += 1) {
      this.dots[i].isOn = !this.dots[i].isOn;
    }
    this.rebuildGrid();
  }

  getDensity(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
    return this.grid[x][y];
  }

  getParticleCount() {
    let count = 0;
    for (let i = 0; i < this.dots.length; i += 1) {
      if (this.dots[i].isOn) count += 1;
    }
    return count;
  }

  reset() {
    this.dots = [];
    const rowsToSeed = Math.max(1, Math.ceil(this.particleCount / this.width));
    let id = 0;
    let placed = 0;

    for (let y = 0; y < rowsToSeed && y < this.height && placed < this.particleCount; y += 1) {
      for (let x = 0; x < this.width && placed < this.particleCount; x += 1) {
        const dot = new PixelObject(x, y, id++);
        dot.isOn = true;
        dot.gravityOn = true;
        this.dots.push(dot);
        placed += 1;
      }
    }

    this.rebuildGrid();
    this.rebuildFieldMatrix();
  }

  clear() {
    for (let i = 0; i < this.dots.length; i += 1) {
      this.dots[i].isOn = false;
    }
    this.rebuildGrid();
    this.rebuildFieldMatrix();
  }
}

export default SandSimulator;
