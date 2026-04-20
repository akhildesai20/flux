class FluidSimulator {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.gravity = 0.15;
    this.gravity_dx = 0;
    this.gravity_dy = this.gravity;
    this.gravityTiltScale = 0.65;
    this.diffusion = 0.0001;
    this.decay = 0.985;
    this.dissipation = 0.96;
    this.wallDamping = 0.6;
    this.floorDamping = 0.5;
    this.pileUpBias = 0.08;
    this.pressureIterations = 20;
    this.pressureStrength = 1.8;
    this.shearViscosity = 0.00008;
    this.boundaryDrag = 0.08;
    this.surfaceTension = 0.15;
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
    this.computeDivergence();
    this.solvePressure(this.pressureIterations);
    this.projectVelocity();
    this.applyDirectionalBoundaries();
    this.advectDensity(deltaTime);
    this.applyParticleCollisions();
    this.applySurfaceTension();
    this.applyDirectionalBoundaries();
    this.applyDecayAndDissipation();
    this.injectSource();
  }

  applyGravity(deltaTime) {
    const tiltX = this.forceX * this.gravityTiltScale;
    const tiltY = this.forceY * this.gravityTiltScale;
    this.gravity_dx = tiltX;
    this.gravity_dy = this.gravity + tiltY;

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.velocityX[y][x] += this.gravity_dx * deltaTime;
        this.velocityY[y][x] += this.gravity_dy * deltaTime;
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
        const coupling = this.clamp(shear * this.shearViscosity * deltaTime * 1000, 0, 0.2);

        this.velocityX[y][x] *= 1 - coupling;
        this.velocityY[y][x] *= 1 - coupling;
      }
    }
  }

  getGravityBoundary() {
    const mag = Math.sqrt(this.gravity_dx ** 2 + this.gravity_dy ** 2);
    if (mag < 0.01) {
      return null;
    }

    const gx = this.gravity_dx / mag;
    const gy = this.gravity_dy / mag;

    return {
      downstreamX: gx > 0 ? this.width - 1 : gx < 0 ? 0 : -1,
      downstreamY: gy > 0 ? this.height - 1 : gy < 0 ? 0 : -1,
      wallNormalX: gx,
      wallNormalY: gy,
    };
  }

  applyDirectionalBoundaries() {
    const boundary = this.getGravityBoundary();
    if (!boundary) {
      return;
    }

    const { downstreamX, downstreamY, wallNormalX, wallNormalY } = boundary;

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        let distToEdge = 999;
        if (downstreamX >= 0) {
          distToEdge = Math.min(distToEdge, Math.abs(x - downstreamX));
        }
        if (downstreamY >= 0) {
          distToEdge = Math.min(distToEdge, Math.abs(y - downstreamY));
        }

        if (distToEdge > 2) {
          continue;
        }

        const velDot = this.velocityX[y][x] * wallNormalX + this.velocityY[y][x] * wallNormalY;
        if (velDot > 0) {
          const bounceScale = 1 + this.wallDamping;
          this.velocityX[y][x] -= velDot * wallNormalX * bounceScale;
          this.velocityY[y][x] -= velDot * wallNormalY * bounceScale;
        }

        if (distToEdge < 1.5) {
          this.density[y][x] = this.clamp(this.density[y][x] * (1 + this.pileUpBias), 0, 1);
        }

        const sharpenFactor = 1 - 0.02 * (2 - distToEdge);
        this.density[y][x] = this.clamp(this.density[y][x] * sharpenFactor, 0, 1);

        this.velocityX[y][x] *= 1 - this.boundaryDrag * 0.5;
        this.velocityY[y][x] *= 1 - this.boundaryDrag * 0.5;
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
    const scale = 0.25;

    for (let pass = 0; pass < passes; pass += 1) {
      for (let y = 1; y < this.height - 1; y += 1) {
        for (let x = 1; x < this.width - 1; x += 1) {
          const div = this.divergence[y][x];
          if (Math.abs(div) > 0.1) {
            const pAvg =
              (this.pressure[y][x - 1] +
                this.pressure[y][x + 1] +
                this.pressure[y - 1][x] +
                this.pressure[y + 1][x]) *
              scale;
            this.pressure[y][x] = pAvg - div * this.pressureStrength * 1.5;
          } else {
            this.pressure[y][x] *= 0.95;
          }
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
        if (current < this.surfaceThresholdLow) {
          continue;
        }

        const neighbors = [
          this.density[y][x - 1],
          this.density[y][x + 1],
          this.density[y - 1][x],
          this.density[y + 1][x],
        ];
        const averageNeighbor =
          (this.density[y][x - 1] +
            this.density[y][x + 1] +
            this.density[y - 1][x] +
            this.density[y + 1][x]) *
          0.25;

        if (current > 0.3 && averageNeighbor < 0.2) {
          this.density[y][x] *= 1 - this.surfaceTension * 0.5;
        } else if (current > 0.3 && averageNeighbor > 0.3) {
          this.density[y][x] = Math.min(1, this.density[y][x] * (1 + this.surfaceTension * 0.1));
        }

        const maxNeighbor = Math.max(...neighbors);
        if (current > this.surfaceThresholdLow && current < this.surfaceThresholdHigh && maxNeighbor > current) {
          this.density[y][x] = this.clamp(
            current + (maxNeighbor - current) * this.surfaceTension * 0.06,
            0,
            1,
          );
        }
      }
    }
  }

  applyParticleCollisions() {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.density[y][x] > 0.9) {
          this.velocityX[y][x] *= 0.85;
          this.velocityY[y][x] *= 0.85;
        }
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
