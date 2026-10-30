export interface InitialState { q: number; v: number }
export interface PhysicsModel<P> {
  initialState(parameters: P): InitialState
  derivative(t: number, state: InitialState, parameters: P): InitialState
}
export interface PhysicsSnapshot {
  t: number
  q: number
  velocity: number
  acceleration: number
  tension: number
  kinetic: number
  potential: number
  energy: number
  ropeResidual: number
  analyticalQ: number
  numericalError: number
}
