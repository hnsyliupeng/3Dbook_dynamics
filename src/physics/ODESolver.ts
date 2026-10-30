import type { InitialState } from './PhysicsModel'

/** Pure classical RK4. No rendering clock, mutations or external physics engine. */
export function rk4Step(
  derivative: (t: number, state: InitialState) => InitialState,
  t: number,
  state: InitialState,
  h: number,
): InitialState {
  const add = (a: InitialState, b: InitialState, scale: number): InitialState => ({
    q: a.q + b.q * scale,
    v: a.v + b.v * scale,
  })
  const k1 = derivative(t, state)
  const k2 = derivative(t + h / 2, add(state, k1, h / 2))
  const k3 = derivative(t + h / 2, add(state, k2, h / 2))
  const k4 = derivative(t + h, add(state, k3, h))
  return {
    q: state.q + h * (k1.q + 2 * k2.q + 2 * k3.q + k4.q) / 6,
    v: state.v + h * (k1.v + 2 * k2.v + 2 * k3.v + k4.v) / 6,
  }
}
