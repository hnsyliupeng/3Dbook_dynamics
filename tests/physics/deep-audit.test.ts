import { describe, expect, it } from 'vitest'
import { firstStopTime, analyticState, acceleration, ropeTension } from '../../src/physics/atwood'
import { SnapshotStore } from '../../src/simulation/SnapshotStore'
import { TimelineController } from '../../src/simulation/TimelineController'
import reference from '../../content/references/deep-physics-reference.json'
import audit from '../../reports/derivation-audit.json'
import { atwoodLesson } from '../../src/lessons/atwood/lesson'

describe('independent source, derivation and parameter audit',()=>{
  it('checks every displayed derivation against its corresponding symbolic proof',()=>{
    expect(audit.steps).toHaveLength(12)
    expect(atwoodLesson.derivation.map(s=>s.id)).toEqual(audit.steps.map(s=>s.id))
    for(const [i,step] of audit.steps.entries()){
      expect(atwoodLesson.derivation[i].latex,`displayed ${step.id}`).toBe(step.reviewedLatex)
      expect(step.latexMatchesReviewedExpression).toBe(true);expect(step.symbolicIdentity).toBe(true)
    }
  })
  it('matches 118 independent high-precision/SciPy cases and all 1062 sample states',()=>{
    expect(reference.cases).toHaveLength(118)
    for(const c of reference.cases){
      const store=new SnapshotStore(c.parameters)
      expect(store.stopTime!==null,`${c.name}: stop flag`).toBe(c.stop)
      expect(store.endTime,`${c.name}: stop time`).toBeCloseTo(c.endTime,9)
      expect(acceleration(c.parameters),`${c.name}: acceleration`).toBeCloseTo(c.acceleration,10)
      expect(ropeTension(c.parameters),`${c.name}: tension`).toBeCloseTo(c.tension,10)
      for(const sample of c.samples){
        const actual=store.at(sample.t)
        expect(actual.q,`${c.name}: q at ${sample.t}`).toBeCloseTo(sample.q,9)
        expect(actual.velocity,`${c.name}: v at ${sample.t}`).toBeCloseTo(sample.velocity,9)
        expect(actual.analyticalQ,`${c.name}: analytical q`).toBeCloseTo(sample.q,9)
        expect(actual.ropeResidual,`${c.name}: inextensible rope`).toBeCloseTo(0,11)
        expect(actual.energy,`${c.name}: energy`).toBeCloseTo(.5*(c.parameters.m1+c.parameters.m2)*c.parameters.v0**2,9)
      }
    }
  })
  it('does not lose near-equal-mass roots to floating-point cancellation',()=>{
    const p={m1:1,m2:1.00000000002,g:1,v0:1}
    const a=acceleration(p), expected=1/(1+Math.sqrt(1+a))
    expect(firstStopTime(p)).toBeCloseTo(expected,13)
    expect(analyticState(p,firstStopTime(p)!).q).toBeCloseTo(.5,13)
  })
  it('stops at a tangential touch even without a sign crossing',()=>{
    const p={m1:1,m2:3,g:2,v0:-1}
    expect(firstStopTime(p)).toBeCloseTo(1,13)
    const end=new SnapshotStore(p).at(1)
    expect(end.q).toBeCloseTo(-.5,12);expect(end.velocity).toBeCloseTo(0,12)
  })
  it('handles tangency rounded just below zero without confusing a real near miss',()=>{
    const touch={m1:.2,m2:1,g:1.5,v0:-1}, miss={...touch,g:1.51}
    expect(firstStopTime(touch)).toBeCloseTo(1,12)
    expect(firstStopTime({m1:.2,m2:.3,g:1.25,v0:-.5})).toBeCloseTo(2,12)
    expect(new SnapshotStore(touch).at(firstStopTime(touch)!).q).toBeCloseTo(-.5,12)
    const missTime=firstStopTime(miss)!
    expect(missTime).toBeGreaterThan(2)
    expect(new SnapshotStore(miss).at(missTime).q).toBeCloseTo(.5,12)
  })
  it('detects every exact in-window UI-grid tangency in both directions',()=>{
    let count=0
    // On this UI grid q*=−.5 and v0=−k/20 imply a=(k/20)^2.
    // Solve rationally for g and keep only values exactly on the 0.01 grid.
    for(let i=2;i<=50;i++)for(let j=i+1;j<=50;j++)for(let k=5;k<=20;k++){
      const numerator=k*k*(i+j)*100, denominator=400*(j-i)
      if(numerator%denominator!==0)continue
      const g100=numerator/denominator
      if(g100<100||g100>2000)continue
      const p={m1:i/10,m2:j/10,g:g100/100,v0:-k/20}, expected=20/k
      expect(firstStopTime(p),JSON.stringify(p)).toBeCloseTo(expected,9)
      expect(firstStopTime({...p,m1:p.m2,m2:p.m1,v0:-p.v0}),`reversed ${JSON.stringify(p)}`).toBeCloseTo(expected,9)
      count++
    }
    expect(count).toBe(2366)
  })
  it('does not turn neighboring UI-grid near misses into false tangencies',()=>{
    let count=0
    // Compare the two nearest gravity-grid values against an independent
    // integer-rational discriminant, avoiding floating cancellation in the oracle.
    for(let i=2;i<=50;i++)for(let j=i+1;j<=50;j++)for(let k=5;k<=20;k++){
      const top=k*k*100*(i+j), bottom=400*(j-i), center=top/bottom
      for(const g100 of [Math.floor(center),Math.ceil(center)]){
        if(g100<100||g100>2000)continue
        const discriminator=top-bottom*g100
        if(discriminator===0)continue
        const d=discriminator/(40000*(i+j)), v=k/20
        const a=(j-i)*g100/(100*(i+j))
        const expected=discriminator>0 ? 1/(v+Math.sqrt(d)) : (v+Math.sqrt(v*v+a))/a
        const p={m1:i/10,m2:j/10,g:g100/100,v0:-v}
        for(const sample of [p,{...p,m1:p.m2,m2:p.m1,v0:v}]){
          const actual=firstStopTime(sample)
          if(expected<=4+1e-12)expect(actual,JSON.stringify(sample)).toBeCloseTo(Math.min(4,expected),9)
          else expect(actual,JSON.stringify(sample)).toBeNull()
        }
        count++
      }
    }
    expect(count).toBe(16026)
  })
  it('recognizes a stop exactly at the horizon and rejects invalid controls',()=>{
    const p={m1:1.5,m2:1.7,g:1,v0:0}
    expect(firstStopTime(p)).toBeCloseTo(4,12)
    expect(()=>firstStopTime(p,0)).toThrow()
    const timeline=new TimelineController(p)
    expect(()=>timeline.seek(NaN)).toThrow();expect(()=>timeline.advance(Infinity)).toThrow()
    expect(timeline.time).toBe(0)
  })
})
