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
  if (!Number.isFinite(limit) || limit <= 0 || !Number.isFinite(horizon) || horizon <= 0) {
    throw new Error('Travel limit and horizon must be finite and positive.')
  }
  const a = acceleration(p), v = p.v0, roots: number[] = []
  for (const target of [-limit, limit]) {
    if (a === 0) {
      if (v !== 0) roots.push(target / v)
      continue
    }
    // q = v*t + a*t²/2. Use the numerically stable quadratic form:
    // direct (-v + sqrt(v²+2*a*target))/a loses precision when a ≈ 0.
    const discriminant = v * v + 2 * a * target
    // Input decimals and especially (m2-m1) can incur cancellation.
    // Include propagation through acceleration as well as the final sum;
    // otherwise some exact UI-grid tangencies fall just outside tolerance.
    const discTolerance = 8 * Number.EPSILON * (Math.abs(v * v) + Math.abs(2 * a * target) + 2 * Math.abs(target) * p.g)
    if (discriminant >= -discTolerance) {
      const rootDiscriminant = Math.abs(discriminant) <= discTolerance ? 0 : discriminant
      const numerator = -v - (v < 0 ? -1 : 1) * Math.sqrt(rootDiscriminant)
      if (numerator === 0) roots.push(-v / a)
      else roots.push(numerator / a, -2 * target / numerator)
    }
  }
  // Accept a root within a few floating-point ulps of the observation horizon.
  const tolerance = 8 * Number.EPSILON * Math.max(1, horizon)
  const valid = roots.filter(x => Number.isFinite(x) && x > 0 && x <= horizon + tolerance)
  return valid.length ? Math.min(horizon, ...valid) : null
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
