import { FIXED_DT } from '../physics/atwood'

/** Wall-time adapter: rendering frequency cannot change a physics step. */
export class SimulationClock {
  private accumulator = 0
  reset() { this.accumulator = 0 }
  consume(wallSeconds: number, speed: number): number {
    // Cap long background-tab stalls; do not pretend wall time was simulated.
    this.accumulator += Math.max(0, Math.min(0.1, wallSeconds)) * speed
    const steps = Math.floor((this.accumulator + 1e-12) / FIXED_DT)
    this.accumulator -= steps * FIXED_DT
    return steps * FIXED_DT
  }
}
