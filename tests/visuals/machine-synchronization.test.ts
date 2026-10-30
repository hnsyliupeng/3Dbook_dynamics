import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { createMachineAssembly } from '../../src/integrations/MachineSkillAdapter'
import { INITIAL_HANGING_M, INITIAL_MASS_Y_M, RADIUS_M } from '../../src/physics/atwood'
import { SnapshotStore } from '../../src/simulation/SnapshotStore'
import reference from '../../content/references/deep-physics-reference.json'

const directionY=(arrow:{quaternion:import('three').Quaternion})=>new Vector3(0,1,0).applyQuaternion(arrow.quaternion).y
const arrowLength=(arrow:{line:import('three').Line;cone:import('three').Mesh})=>arrow.line.scale.y+arrow.cone.scale.y

describe('actual Machine Skill scene geometry and formula bindings',()=>{
  it('matches q, wheel angle, ropes, force vectors and motion directions for named cases',()=>{
    const assembly=createMachineAssembly()
    for(const c of reference.cases.slice(0,18)){
      const store=new SnapshotStore(c.parameters)
      for(const sample of c.samples){
        const state=store.at(sample.t)
        assembly.update(state,c.parameters,{forces:true,constraint:true,cut:false,selected:'a'})
        expect(assembly.massLeft.position.y,`${c.name}: m1`).toBeCloseTo(INITIAL_MASS_Y_M+state.q,11)
        expect(assembly.massRight.position.y,`${c.name}: m2`).toBeCloseTo(INITIAL_MASS_Y_M-state.q,11)
        expect(assembly.wheel.rotation.z,`${c.name}: wheel`).toBeCloseTo(-state.q/RADIUS_M,11)
        expect(assembly.ropeL.scale.y,`${c.name}: left rope`).toBeCloseTo(INITIAL_HANGING_M-state.q,11)
        expect(assembly.ropeR.scale.y,`${c.name}: right rope`).toBeCloseTo(INITIAL_HANGING_M+state.q,11)
        for(let i=0;i<2;i++){
          const arrow=assembly.arrows[i], mass=i===0?c.parameters.m1:c.parameters.m2
          expect(directionY(arrow.gravity)).toBeCloseTo(-1,11)
          expect(directionY(arrow.tension)).toBeCloseTo(1,11)
          expect(arrowLength(arrow.gravity)).toBeCloseTo(mass*c.parameters.g*.008,10)
          expect(arrowLength(arrow.tension)).toBeCloseTo(state.tension*.008,10)
          const velocity=i===0?state.velocity:-state.velocity
          expect(arrow.velocity.visible).toBe(Math.abs(velocity)>.015)
          if(arrow.velocity.visible)expect(directionY(arrow.velocity)).toBeCloseTo(Math.sign(velocity),11)
          const a=i===0?state.acceleration:-state.acceleration
          expect(arrow.acceleration.visible).toBe(Math.abs(a)>.015)
          if(arrow.acceleration.visible)expect(directionY(arrow.acceleration)).toBeCloseTo(Math.sign(a),11)
        }
      }
    }
  })
  it('highlights the active derivation parts, and manual selection overrides it',()=>{
    const p=reference.cases[0].parameters, state=new SnapshotStore(p).at(.2), assembly=createMachineAssembly()
    assembly.update(state,p,{forces:false,constraint:true,cut:false,selected:'',activeParts:['rope','m1'],activeVariables:['a']})
    expect(assembly.materials.m1.emissive.getHex()).not.toBe(0)
    expect(assembly.materials.m2.emissive.getHex()).toBe(0)
    expect(assembly.arrows[0].acceleration.visible).toBe(true)
    assembly.update(state,p,{forces:false,constraint:true,cut:false,selected:'m2',activeParts:['rope','m1'],activeVariables:['a']})
    expect(assembly.materials.m1.emissive.getHex()).toBe(0)
    expect(assembly.materials.m2.emissive.getHex()).not.toBe(0)
    expect(assembly.arrows[0].acceleration.visible).toBe(false)
  })
})
