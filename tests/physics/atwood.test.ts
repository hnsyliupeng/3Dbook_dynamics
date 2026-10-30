import { describe, expect, it } from 'vitest'
import { acceleration, analyticState, DEFAULT_PARAMETERS, firstStopTime, FIXED_DT, ropeTension, PULLEY_Y_M, INITIAL_MASS_Y_M, BLOCK_HEIGHT_M, RADIUS_M, TRAVEL_M } from '../../src/physics/atwood'
import { rk4Step } from '../../src/physics/ODESolver'
import { SnapshotStore } from '../../src/simulation/SnapshotStore'
import { SimulationClock } from '../../src/simulation/SimulationClock'
import { TimelineController } from '../../src/simulation/TimelineController'
import { DerivationEngine } from '../../src/math/DerivationEngine'
import { atwoodLesson } from '../../src/lessons/atwood/lesson'
import reference from '../../content/references/physics-reference.json'
import { formatFixed } from '../../src/ui/format'

describe('ideal Atwood mechanics',()=>{
  it('matches the requested a and rope tension with SI units',()=>{
    expect(acceleration(DEFAULT_PARAMETERS)).toBeCloseTo(3.27,12)
    expect(ropeTension(DEFAULT_PARAMETERS)).toBeCloseTo(13.08,12)
  })
  it('equal stationary masses remain at rest; swapping masses reverses acceleration',()=>{
    const equal={...DEFAULT_PARAMETERS,m1:2,m2:2}
    expect(acceleration(equal)).toBe(0);expect(firstStopTime(equal)).toBeNull()
    expect(analyticState(equal,3)).toEqual({q:0,v:0})
    expect(acceleration({...DEFAULT_PARAMETERS,m1:2,m2:1})).toBeCloseTo(-3.27,12)
  })
  it('rejects nonphysical parameters',()=>{
    expect(()=>acceleration({...DEFAULT_PARAMETERS,m1:0})).toThrow()
    expect(()=>ropeTension({...DEFAULT_PARAMETERS,g:NaN})).toThrow()
  })
  it('RK4 snapshots match the independent SciPy references including a reversal',()=>{
    for(const example of reference.cases){
      const store=new SnapshotStore(example.parameters)
      expect(store.endTime).toBeCloseTo(example.endTime,10)
      expect(acceleration(example.parameters)).toBeCloseTo(example.acceleration,11)
      expect(ropeTension(example.parameters)).toBeCloseTo(example.tension,11)
      for(const sample of example.samples){
        const actual=store.at(sample.t)
        expect(actual.q).toBeCloseTo(sample.q,9)
        expect(actual.velocity).toBeCloseTo(sample.velocity,9)
        expect(Math.abs(actual.ropeResidual)).toBeLessThan(1e-12)
        expect(Math.abs(actual.energy-0.5*(example.parameters.m1+example.parameters.m2)*example.parameters.v0**2)).toBeLessThan(1e-10)
      }
    }
  })
  it('stops exactly at the first travel boundary without pretending a collision',()=>{
    const timeline=new TimelineController(DEFAULT_PARAMETERS);timeline.play();timeline.advance(10)
    expect(timeline.playing).toBe(false);expect(timeline.snapshot.q).toBeCloseTo(.5,10)
    expect(timeline.snapshot.velocity).toBeGreaterThan(0) // pre-impact velocity retained
    expect(timeline.snapshot.t).toBeCloseTo(Math.sqrt(1/3.27),10)
    timeline.seek(0.2);expect(timeline.playing).toBe(false)
    expect(timeline.snapshot.q).toBeCloseTo(0.5*3.27*.2*.2,10)
  })
  it('travel limits leave clearance between mass blocks, pulley and base',()=>{
    const highBlockTop=INITIAL_MASS_Y_M+TRAVEL_M+BLOCK_HEIGHT_M/2
    // Closest horizontal block edge to the pulley centre at the tangent.
    const closestX=RADIUS_M-.19/2
    const lowestPulleyAtEdge=PULLEY_Y_M-Math.sqrt(RADIUS_M**2-closestX**2)
    const lowBlockBottom=INITIAL_MASS_Y_M-TRAVEL_M-BLOCK_HEIGHT_M/2
    expect(highBlockTop).toBeLessThan(lowestPulleyAtEdge)
    expect(lowBlockBottom).toBeGreaterThan(.13) // top of visual base
  })
  it('scrubs and steps deterministically, resetting after parameter changes',()=>{
    const timeline=new TimelineController(DEFAULT_PARAMETERS)
    timeline.seek(.3);const first=timeline.snapshot
    timeline.seek(.1);timeline.seek(.3);expect(timeline.snapshot).toEqual(first)
    timeline.step(-1);expect(timeline.time).toBeCloseTo(.3-FIXED_DT,12)
    timeline.play();timeline.setParameters({...DEFAULT_PARAMETERS,m1:2,m2:2})
    expect(timeline.playing).toBe(false);expect(timeline.time).toBe(0);expect(timeline.snapshot.acceleration).toBe(0)
  })
  it('fixed-step clock produces the same trajectory at different render frame rates',()=>{
    const p={...DEFAULT_PARAMETERS,m1:2,m2:2,v0:.1}
    function run(fps:number){const clock=new SimulationClock(),timeline=new TimelineController(p);timeline.play();for(let i=0;i<fps;i++)timeline.advance(clock.consume(1/fps,1));return timeline.snapshot}
    const slow=run(30), fast=run(120)
    expect(slow.t).toBeCloseTo(fast.t,12);expect(slow.q).toBeCloseTo(fast.q,12)
    expect(slow.q).toBeCloseTo(.1,12)
  })
  it('the reusable RK4 solver exhibits fourth-order convergence on a nonconstant oscillator',()=>{
    function error(h:number){let state={q:1,v:0};for(let t=0;t<1-1e-10;t+=h)state=rk4Step((_t,s)=>({q:s.v,v:-s.q}),t,state,h);return Math.abs(state.q-Math.cos(1))}
    expect(error(.2)/error(.1)).toBeGreaterThan(12)
    expect(error(.1)/error(.05)).toBeGreaterThan(12)
  })
  it('displays floating-point negative zero as zero without changing nonzero values',()=>{
    expect(formatFixed(-1e-14,2)).toBe('0.00')
    expect(formatFixed(-.01,2)).toBe('-0.01')
  })
  it('derivation is a dependency-checked sequence',()=>{
    const engine=new DerivationEngine(atwoodLesson.derivation)
    expect(engine.pathTo('acceleration').map(s=>s.id)).toEqual(['constraint','coordinate','velocity','kinetic','potential','lagrangian','partials','euler','acceleration'])
  })
})
