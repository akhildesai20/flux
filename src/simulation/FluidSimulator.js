class FluidSimulator {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.gravity = 0.15;
    this.diffusion = 0.0001;
    this.decay = 0.99;
    this.dissipation = 0.98;
    this.wallDamping = 0.82;
    this.floorDamping = 0.45;
    this.pileUpBias = 0.2;
    this.pressureIterations = 22;
    this.pressureStrength = 1.0;
    this.shearViscosity = 0.08;
    this.boundaryDrag = 0.08;
    this.surfaceTension = 0.12;
    this.surfaceThresholdLow = 0.06;
    this.surfaceThresholdHigh = 0.8;
    this.forceX = 0;
    this.forceY = 0;
    this.forceMagnitude = 0;
    this.density = this.createGrid(0);
    this.velocityX = this.createGrid(0);
    this.velocityY = this.createGrid(0);
    this.pressure = this.createGrid(0);
    this.divergence = this.createGrid(0);
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
    this.applyViscosityCoupling(deltaTime);
    this.diffuseVelocity();
    this.applyBoundaryConditions();
    this.computeDivergence();
    this.solvePressure(this.pressureIterations);
    this.projectVelocity();
    this.advectDensity(deltaTime);
    this.applySurfaceTension();
    this.applyBoundaryConditions();
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

  applyViscosityCoupling(deltaTime) {
    if (this.shearViscosity <= 0) {
      return;
    }

    for (let y = 1; y < this.height - 1; y += 1) {
      for (let x = 1; x < this.width - 1; x += 1) {
        const duDy = (this.velocityX[y + 1][x] - this.velocityX[y - 1][x]) * 0.5;
        const dvDx = (this.velocityY[y][x + 1] - this.velocityY[y][x - 1]) * 0.5;
        const shear = Math.abs(duDy + dvDx);
        const coupling = this.clamp(shear * this.shearViscosity * deltaTime, 0, 0.25);

        this.velocityX[y][x] *= 1 - coupling;
        this.velocityY[y][x] *= 1 - coupling;
      }
    }
  }

  applyBoundaryConditions() {
    const lastX = this.width - 1;
    const lastY = this.height - 1;

    for (let y = 0; y < this.height; y += 1) {
      if (this.velocityX[y][0] < 0) {
        this.velocityX[y][0] *= -this.wallDamping;
      }
      if (this.velocityX[y][lastX] > 0) {
        this.velocityX[y][lastX] *= -this.wallDamping;
      }

      this.velocityY[y][0] *= 1 - this.boundaryDrag;
      this.velocityY[y][lastX] *= 1 - this.boundaryDrag;
    }

    for (let x = 0; x < this.width; x += 1) {
      if (this.velocityY[0][x] < 0) {
        this.velocityY[0][x] *= -this.wallDamping;
      }
      if (this.velocityY[lastY][x] > 0) {
        this.velocityY[lastY][x] *= -this.floorDamping;
      }

      this.velocityX[0][x] *= 1 - this.boundaryDrag;
      this.velocityX[lastY][x] *= 1 - this.boundaryDrag;
    }

    for (let x = 0; x < this.width; x += 1) {
      const floorDensity = this.density[lastY][x];
      if (floorDensity > 0) {
        const retained = floorDensity * this.pileUpBias;
        this.density[lastY][x] = this.clamp(floorDensity + retained, 0, 1);
      }
    }
  }

  computeDivergence() {
    for (let y = 1; y < this.height - 1; y += 1) {
      for (let x = 1; x < this.width - 1; x += 1) {
        const vxDiff = this.velocityX[y][x + 1] - this.velocityX[y][x - 1];
        const vyDiff = this.velocityY[y + 1][x] - this.velocityY[y - 1][x];
        this.divergence[y][x] = (vxDiff + vyDiff) * 0.5;
      }
    }

    for (let y = 0; y < this.height; y += 1) {
      this.divergence[y][0] = 0;
      this.divergence[y][this.width - 1] = 0;
    }
    for (let x = 0; x < this.width; x += 1) {
      this.divergence[0][x] = 0;
      this.divergence[this.height - 1][x] = 0;
    }
  }

  solvePressure(iterations) {
    const passes = this.clamp(Math.round(iterations), 4, 60);
    const scale = this.pressureStrength;

    for (let pass = 0; pass < passes; pass += 1) {
      for (let y = 1; y < this.height - 1; y += 1) {
        for (let x = 1; x < this.width - 1; x += 1) {
          this.pressure[y][x] =
            (this.pressure[y][x - 1] +
              this.pressure[y][x + 1] +
              this.pressure[y - 1][x] +
              this.pressure[y + 1][x] -
              this.divergence[y][x] * scale) *
            0.25;
        }
      }

      for (let y = 0; y < this.height; y += 1) {
        this.pressure[y][0] = this.pressure[y][1];
        this.pressure[y][this.width - 1] = this.pressure[y][this.width - 2];
      }
      for (let x = 0; x < this.width; x += 1) {
        this.pressure[0][x] = this.pressure[1][x];
        this.pressure[this.height - 1][x] = this.pressure[this.height - 2][x];
      }
    }
  }

  projectVelocity() {
    for (let y = 1; y < this.height - 1; y += 1) {
      for (let x = 1; x < this.width - 1; x += 1) {
        const gradX = (this.pressure[y][x + 1] - this.pressure[y][x - 1]) * 0.5;
        const gradY = (this.pressure[y + 1][x] - this.pressure[y - 1][x]) * 0.5;
        this.velocityX[y][x] -= gradX;
        this.velocityY[y][x] -= gradY;
      }
    }
  }

  sampleDensity(x, y) {
    const clampedX = this.clamp(x, 0, this.width - 1);
    const clampedY = this.clamp(y, 0, this.height - 1);
    const x0 = Math.floor(clampedX);
    const y0 = Math.floor(clampedY);
    const x1 = Math.min(x0 + 1, this.width - 1);
    const y1 = Math.min(y0 + 1, this.height - 1);
    const tx = clampedX - x0;
    const ty = clampedY - y0;

    const top = this.density[y0][x0] * (1 - tx) + this.density[y0][x1] * tx;
    const bottom = this.density[y1][x0] * (1 - tx) + this.density[y1][x1] * tx;
    return top * (1 - ty) + bottom * ty;
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

  applySurfaceTension() {
    if (this.surfaceTension <= 0) {
      return;
    }

    for (let y = 1; y < this.height - 1; y += 1) {
      for (let x = 1; x < this.width - 1; x += 1) {
        const current = this.density[y][x];
        if (current < this.surfaceThresholdLow || current > this.surfaceThresholdHigh) {
          continue;
        }

        const gradX = (this.density[y][x + 1] - this.density[y][x - 1]) * 0.5;
        const gradY = (this.density[y + 1][x] - this.density[y - 1][x]) * 0.5;

        this.velocityX[y][x] -= gradX * this.surfaceTension;
        this.velocityY[y][x] -= gradY * this.surfaceTension;

        const neighborAverage =
          (this.density[y][x - 1] +
            this.density[y][x + 1] +
            this.density[y - 1][x] +
            this.density[y + 1][x]) *
          0.25;
        this.density[y][x] = this.clamp(current + (neighborAverage - current) * this.surfaceTension * 0.08, 0, 1);
      }
    }
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
    this.pressure = this.createGrid(0);
    this.divergence = this.createGrid(0);
    this.forceX = 0;
    this.forceY = 0;
    this.forceMagnitude = 0;
  }
}

export default FluidSimulator;
