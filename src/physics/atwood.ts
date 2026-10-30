import type { InitialState, PhysicsModel, PhysicsSnapshot } from './PhysicsModel'

/** Ideal inextensible massless rope, massless pulley, frictionless axle, no slip.
 * q is downward displacement of mass 2, metres. q=0 is the displayed start.
 * The finite travel stop is an observation boundary, NOT an impact model.
 */
export interface AtwoodParameters {
  m1: number
  m2: number
  g: number
  v0: number
}

export const DEFAULT_PARAMETERS: AtwoodParameters = { m1: 1, m2: 2, g: 9.81, v0: 0 }
export const RADIUS_M = 0.22
export const PULLEY_Y_M = 1.75
export const INITIAL_HANGING_M = 0.75
export const BLOCK_HEIGHT_M = 0.22
export const INITIAL_MASS_Y_M = PULLEY_Y_M - INITIAL_HANGING_M - BLOCK_HEIGHT_M / 2
export const TRAVEL_M = 0.50
export const HORIZON_S = 4
export const FIXED_DT = 1 / 120

export function validateParameters(p: AtwoodParameters): void {
  if (!Number.isFinite(p.m1) || p.m1 <= 0 || !Number.isFinite(p.m2) || p.m2 <= 0 ||
      !Number.isFinite(p.g) || p.g <= 0 || !Number.isFinite(p.v0)) {
    throw new Error('Masses and gravity must be finite and positive; initial velocity must be finite.')
  }
}
export function acceleration(p: AtwoodParameters): number {
  validateParameters(p)
  return (p.m2 - p.m1) * p.g / (p.m1 + p.m2)
}
export function ropeTension(p: AtwoodParameters): number {
  validateParameters(p)
  return 2 * p.m1 * p.m2 * p.g / (p.m1 + p.m2)
}
export function analyticState(p: AtwoodParameters, t: number): InitialState {
  const a = acceleration(p)
  return { q: p.v0 * t + 0.5 * a * t * t, v: p.v0 + a * t }
}
export const atwoodModel: PhysicsModel<AtwoodParameters> = {
  initialState: p => ({ q: 0, v: p.v0 }),
  derivative: (_t, state, p) => ({ q: state.v, v: acceleration(p) }),
}

/** First positive root at either end. Includes reversal before touching a stop. */
export function firstStopTime(p: AtwoodParameters, limit = TRAVEL_M, horizon = HORIZON_S): number | null {
  const a = acceleration(p), v = p.v0, roots: number[] = []
  for (const target of [-limit, limit]) {
    if (Math.abs(a) < 1e-12) {
      if (Math.abs(v) > 1e-12) roots.push(target / v)
      continue
    }
    // 1/2 a t² + v0 t - target = 0
    const disc = v * v + 2 * a * target
    if (disc >= 0) {
      const d = Math.sqrt(disc)
      roots.push((-v + d) / a, (-v - d) / a)
    }
  }
  const valid = roots.filter(x => Number.isFinite(x) && x > 1e-10 && x <= horizon + 1e-10)
  return valid.length ? Math.min(...valid) : null
}

export function makeSnapshot(p: AtwoodParameters, t: number, state: InitialState): PhysicsSnapshot {
  const a = acceleration(p), analytic = analyticState(p, t)
  const kinetic = 0.5 * (p.m1 + p.m2) * state.v ** 2
  // Choice of datum: V=0 at q=0. Negative potential is legitimate.
  const potential = (p.m1 - p.m2) * p.g * state.q
  const leftLength = INITIAL_HANGING_M - state.q
  const rightLength = INITIAL_HANGING_M + state.q
  return {
    t, q: state.q, velocity: state.v, acceleration: a, tension: ropeTension(p),
    kinetic, potential, energy: kinetic + potential,
    ropeResidual: leftLength + rightLength - 2 * INITIAL_HANGING_M,
    analyticalQ: analytic.q, numericalError: state.q - analytic.q,
  }
}
