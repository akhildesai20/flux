class FluidSimulator {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.gravity = 0.15;
    this.diffusion = 0.0001;
    this.decay = 0.99;
    this.dissipation = 0.98;
    this.forceX = 0;
    this.forceY = 0;
    this.forceMagnitude = 0;
    this.density = this.createGrid(0);
    this.velocityX = this.createGrid(0);
    this.velocityY = this.createGrid(0);
  }

  createGrid(value) {
    return Array.from({ length: this.height }, () => Array.from({ length: this.width }, () => value));
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  setForce(fx, fy, magnitude) {
    this.forceX = fx;
    this.forceY = fy;
    this.forceMagnitude = magnitude;
  }

  update(deltaTime) {
    this.applyGravity(deltaTime);
    this.applyExternalForce(deltaTime);
    this.diffuseVelocity();
    this.advectDensity(deltaTime);
    this.applyDecayAndDissipation();
    this.injectSource();
  }

  applyGravity(deltaTime) {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.velocityY[y][x] += this.gravity * deltaTime;
      }
    }
  }

  applyExternalForce(deltaTime) {
    if (this.forceMagnitude <= 0) {
      return;
    }

    const forceScale = this.forceMagnitude * deltaTime * 2.2;
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.velocityX[y][x] += this.forceX * forceScale;
        this.velocityY[y][x] += this.forceY * forceScale;
      }
    }
  }

  diffuseVelocity() {
    for (let iteration = 0; iteration < 3; iteration += 1) {
      const nextVX = this.createGrid(0);
      const nextVY = this.createGrid(0);
      for (let y = 0; y < this.height; y += 1) {
        for (let x = 0; x < this.width; x += 1) {
          const left = x > 0 ? x - 1 : x;
          const right = x < this.width - 1 ? x + 1 : x;
          const up = y > 0 ? y - 1 : y;
          const down = y < this.height - 1 ? y + 1 : y;
          const spread = this.diffusion * 1000;

          const avgVX =
            (this.velocityX[y][left] +
              this.velocityX[y][right] +
              this.velocityX[up][x] +
              this.velocityX[down][x]) /
            4;
          const avgVY =
            (this.velocityY[y][left] +
              this.velocityY[y][right] +
              this.velocityY[up][x] +
              this.velocityY[down][x]) /
            4;

          nextVX[y][x] = this.velocityX[y][x] * (1 - spread) + avgVX * spread;
          nextVY[y][x] = this.velocityY[y][x] * (1 - spread) + avgVY * spread;
        }
      }
      this.velocityX = nextVX;
      this.velocityY = nextVY;
    }
  }

  sampleDensity(x, y) {
    const cx = this.clamp(Math.round(x), 0, this.width - 1);
    const cy = this.clamp(Math.round(y), 0, this.height - 1);
    return this.density[cy][cx];
  }

  advectDensity(deltaTime) {
    const nextDensity = this.createGrid(0);
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const prevX = x - this.velocityX[y][x] * deltaTime * this.width * 0.8;
        const prevY = y - this.velocityY[y][x] * deltaTime * this.height * 0.8;
        nextDensity[y][x] = this.sampleDensity(prevX, prevY);
      }
    }
    this.density = nextDensity;
  }

  applyDecayAndDissipation() {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.velocityX[y][x] *= this.dissipation;
        this.velocityY[y][x] *= this.dissipation;
        this.density[y][x] = this.clamp(this.density[y][x] * this.decay, 0, 1);
      }
    }
  }

  injectSource() {
    const rows = Math.max(1, Math.floor(this.height * 0.1));
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.density[y][x] = this.clamp(this.density[y][x] + 0.025, 0, 1);
      }
    }
  }

  getDensity(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return 0;
    }
    return this.clamp(this.density[y][x], 0, 1);
  }

  reset() {
    this.density = this.createGrid(0);
    this.velocityX = this.createGrid(0);
    this.velocityY = this.createGrid(0);
    this.forceX = 0;
    this.forceY = 0;
    this.forceMagnitude = 0;
  }
}

export default FluidSimulator;
