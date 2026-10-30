import { atwoodModel, FIXED_DT, firstStopTime, HORIZON_S, makeSnapshot, type AtwoodParameters } from '../physics/atwood'
import { rk4Step } from '../physics/ODESolver'
import type { InitialState, PhysicsSnapshot } from '../physics/PhysicsModel'

/** Deterministic fixed-step checkpoints, plus an RK4 fractional last step for scrubbing.
 * No backwards integration, no invisible scene clocks and no extrapolation past the stop.
 */
export class SnapshotStore {
  readonly parameters: AtwoodParameters
  readonly stopTime: number | null
  readonly endTime: number
  readonly checkpoints: InitialState[]
  constructor(parameters: AtwoodParameters) {
    this.parameters = { ...parameters }
    this.stopTime = firstStopTime(parameters)
    this.endTime = this.stopTime ?? HORIZON_S
    this.checkpoints = [atwoodModel.initialState(parameters)]
    const count = Math.floor(this.endTime / FIXED_DT + 1e-10)
    for (let n = 0; n < count; n++) {
      this.checkpoints.push(rk4Step((t, s) => atwoodModel.derivative(t, s, this.parameters), n * FIXED_DT, this.checkpoints[n], FIXED_DT))
    }
  }
  at(requestedTime: number): PhysicsSnapshot {
    const t = Math.max(0, Math.min(this.endTime, Number.isFinite(requestedTime) ? requestedTime : 0))
    const index = Math.min(this.checkpoints.length - 1, Math.floor(t / FIXED_DT + 1e-10))
    const remainder = t - index * FIXED_DT
    const base = this.checkpoints[index]
    const state = Math.abs(remainder) < 1e-12 ? base : rk4Step(
      (time, s) => atwoodModel.derivative(time, s, this.parameters), index * FIXED_DT, base, remainder,
    )
    return makeSnapshot(this.parameters, t, state)
  }
  samples(count = 64): PhysicsSnapshot[] {
    return Array.from({ length: count + 1 }, (_, i) => this.at(this.endTime * i / count))
  }
}
