import * as THREE from 'three'
// This is the actual MIT Machine Skill kit, installed at its documented project skill path.
// @ts-expect-error upstream JavaScript has no declaration file
import { GEO, MAT } from '../../.claude/skills/machine/kit/lab-kit.js'
import { RADIUS_M, PULLEY_Y_M, INITIAL_MASS_Y_M, BLOCK_HEIGHT_M } from '../physics/atwood'
import type { AtwoodParameters } from '../physics/atwood'
import type { PhysicsSnapshot } from '../physics/PhysicsModel'

/** Machine Skill product: a procedural metre-scale Atwood assembly using its
 * GEO closed-solid builders and MAT PBR material presets. Motion is set only by
 * a host PhysicsSnapshot; no Lab.onTick/independent solver is installed. */
export function createMachineAssembly() {
  const root = new THREE.Group()
  const material = {
    frame: MAT.paint({ color: '#627b75', finish: null, roughness: 0.48 }),
    dark: MAT.steelDark({ color: '#405453', finish: null, roughness: 0.5 }),
    paper: MAT.paint({ color: '#e1d7c1', finish: null, roughness: 0.8 }),
    brass: MAT.brass({ color: '#c99c58', finish: null, roughness: 0.33, metalness: 0.65 }),
    brassLight: MAT.brass({ color: '#e5c983', finish: null, roughness: 0.4, metalness: 0.45 }),
    steel: MAT.stainless({ color: '#adb3a7', finish: null, roughness: 0.35, metalness: 0.55 }),
    rope: MAT.enamel({ color: '#a67f53', finish: null, roughness: 0.8 }),
    m1: MAT.paint({ color: '#76a69b', finish: null, roughness: 0.44 }),
    m2: MAT.paint({ color: '#ce8069', finish: null, roughness: 0.44 }),
  }
  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], parent: THREE.Object3D = root) => {
    const object = new THREE.Mesh(geo, mat)
    object.position.set(...pos); object.castShadow = true; object.receiveShadow = true; parent.add(object)
    return object
  }
  const box = (w: number, h: number, d: number, mat: THREE.Material, pos: [number, number, number], parent?: THREE.Object3D) =>
    mesh(GEO.rbox(w, h, d, Math.min(w, h, d) * 0.12), mat, pos, parent)
  const disc = (r: number, h: number, mat: THREE.Material, pos: [number, number, number], parent?: THREE.Object3D) => {
    const m = mesh(GEO.disc(r, h), mat, pos, parent); m.rotation.x = Math.PI / 2; return m
  }

  // A physical base and frame. All dimensions are metres, not arbitrary pixels.
  box(1.72, .10, .56, material.paper, [0,.08,0])
  box(1.78,.035,.60,material.dark,[0,.025,0])
  for (const x of [-.75,.75]) {
    box(.075,1.93,.10,material.frame,[x,1.085,-.11])
    box(.17,.035,.23,material.dark,[x,.15,-.11])
    box(.14,.065,.15,material.brass,[x,2.03,-.11])
    for (const z of [-.18,.18]) disc(.025,.014,material.steel,[x,.07,z])
  }
  box(1.60,.08,.10,material.frame,[0,2.07,-.11])
  box(.13,.35,.11,material.dark,[0,1.90,-.11])
  // Axle and bearing connect pulley to the support.
  const shaft = mesh(GEO.disc(.035,.31),material.steel,[0,PULLEY_Y_M,0]); shaft.rotation.x=Math.PI/2
  disc(.068,.04,material.dark,[0,PULLEY_Y_M,-.15])
  disc(.048,.035,material.brassLight,[0,PULLEY_Y_M,.16])

  const wheel = new THREE.Group(); wheel.position.set(0,PULLEY_Y_M,.08); root.add(wheel)
  const ringFull = mesh(GEO.tube(RADIUS_M,.166,.065),material.brass,[0,0,0],wheel); ringFull.rotation.x=Math.PI/2
  // A closed 3/4 annular extrusion for the actual visual cut, including radial section faces.
  const ringShape = new THREE.Shape()
  ringShape.absarc(0,0,RADIUS_M,Math.PI/2,Math.PI*2,false)
  ringShape.absarc(0,0,.166,Math.PI*2,Math.PI/2,true)
  ringShape.closePath()
  const ringCut = mesh(GEO.extrude(ringShape,.065,.0015),material.brass,[0,0,0],wheel)
  ringCut.visible=false
  for(let i=0;i<5;i++) {
    const angle=i*Math.PI*2/5
    const spoke = box(.17,.027,.05,material.brassLight,[Math.cos(angle)*.095,Math.sin(angle)*.095,0],wheel)
    spoke.rotation.z=angle
  }
  disc(.062,.082,material.brassLight,[0,0,0],wheel)
  disc(.026,.09,material.dark,[0,0,0],wheel)

  // Rope's top arc is static. Vertical segments change by ±q, preserving length.
  const arc = mesh(new THREE.TorusGeometry(RADIUS_M,.008,8,64,Math.PI),material.rope,[0,PULLEY_Y_M,.128])
  const verticalGeometry = new THREE.CylinderGeometry(.008,.008,1,10)
  const ropeL = mesh(verticalGeometry,material.rope,[-RADIUS_M,1.1,.128])
  const ropeR = mesh(verticalGeometry,material.rope,[RADIUS_M,1.1,.128])

  const massLeft = new THREE.Group(), massRight = new THREE.Group()
  root.add(massLeft,massRight)
  const leftBlock=box(.19,.22,.16,material.m1,[0,0,0],massLeft)
  const rightBlock=box(.19,.22,.16,material.m2,[0,0,0],massRight)
  for (const mass of [massLeft,massRight]) {
    box(.12,.018,.12,material.dark,[0,.112,0],mass)
    const eye=mesh(new THREE.TorusGeometry(.025,.005,8,20),material.steel,[0,.135,0],mass)
    eye.rotation.y=Math.PI/2
    for(const x of [-.06,.06]) {
      const screw=mesh(GEO.disc(.008,.008),material.brassLight,[x,.05,.081],mass); screw.rotation.x=Math.PI/2
    }
  }
  leftBlock.userData.part='m1'; rightBlock.userData.part='m2'

  // A ruled reference staff makes displacement legible; ticks are decoration, not a constraint.
  box(.018,1.25,.018,material.steel,[.46,1.01,-.06])
  for (let i=0;i<=10;i++) box(i%5===0?.08:.045,.006,.009,material.dark,[.49,.41+i*.12,-.045])
  const qArrow = new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),new THREE.Vector3(.53,1.44,.08),.27,0xb65b45,.07,.035)
  root.add(qArrow)
  const arrows: {tension: THREE.ArrowHelper; gravity: THREE.ArrowHelper; velocity: THREE.ArrowHelper; acceleration: THREE.ArrowHelper}[]=[]
  for (let i=0;i<2;i++) {
    const tension = new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),.1,0x478d80,.04,.025)
    const gravity = new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),new THREE.Vector3(),.1,0xc3664c,.04,.025)
    const velocity = new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),.1,0x577daa,.04,.025)
    const acceleration = new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),.1,0xc79a4b,.04,.025)
    root.add(tension,gravity,velocity,acceleration); arrows.push({tension,gravity,velocity,acceleration})
  }
  const setArrow = (arrow: THREE.ArrowHelper, at: THREE.Vector3, direction: number, length: number) => {
    arrow.position.copy(at); arrow.setDirection(new THREE.Vector3(0,direction,0))
    arrow.setLength(Math.max(.001,length), Math.min(.055,Math.max(.018,length*.34)), Math.min(.035,Math.max(.012,length*.2)))
  }
  function update(s: PhysicsSnapshot, p: AtwoodParameters, opts: { forces: boolean; constraint: boolean; cut: boolean; selected: string }) {
    const leftY=INITIAL_MASS_Y_M+s.q, rightY=INITIAL_MASS_Y_M-s.q
    massLeft.position.set(-RADIUS_M,leftY,.128); massRight.position.set(RADIUS_M,rightY,.128)
    wheel.rotation.z = -s.q/RADIUS_M // clockwise when m2 goes down
    const leftTop=leftY+BLOCK_HEIGHT_M/2, rightTop=rightY+BLOCK_HEIGHT_M/2
    for (const [rope, top] of [[ropeL,leftTop],[ropeR,rightTop]] as const) {
      const length=PULLEY_Y_M-top; rope.position.y=(PULLEY_Y_M+top)/2; rope.scale.y=length
    }
    const showRope=opts.constraint
    material.rope.color.set(showRope ? '#9b7850' : '#c0b29b')
    arc.visible=true; ropeL.visible=true; ropeR.visible=true
    ringFull.visible=!opts.cut; ringCut.visible=opts.cut
    material.m1.emissive.set(opts.selected==='m1' ? '#264f46' : '#000000')
    material.m2.emissive.set(opts.selected==='m2' ? '#632a1e' : '#000000')
    const masses=[{x:-RADIUS_M,y:leftY,m:p.m1,vel:s.velocity},{x:RADIUS_M,y:rightY,m:p.m2,vel:-s.velocity}]
    masses.forEach((m,i)=>{
      const a=arrows[i], at=new THREE.Vector3(m.x,m.y,.245)
      a.tension.visible=opts.forces; a.gravity.visible=opts.forces
      setArrow(a.tension,at.clone().add(new THREE.Vector3(-.055,.07,0)),1,s.tension*.008)
      setArrow(a.gravity,at.clone().add(new THREE.Vector3(.055,-.07,0)),-1,m.m*p.g*.008)
      a.velocity.visible=(opts.forces || opts.selected==='qdot') && Math.abs(m.vel)>.015
      setArrow(a.velocity,at.clone().add(new THREE.Vector3(.11,0,0)),Math.sign(m.vel)||1,Math.abs(m.vel)*.15)
      const signedAcceleration=i===0 ? s.acceleration : -s.acceleration
      a.acceleration.visible=opts.selected==='a' && Math.abs(signedAcceleration)>.015
      setArrow(a.acceleration,at.clone().add(new THREE.Vector3(-.12,0,0)),Math.sign(signedAcceleration)||1,Math.abs(signedAcceleration)*.05)
    })
    qArrow.setColor(new THREE.Color(opts.selected==='q' ? 0x9c442e : 0xb65b45))
    qArrow.visible=opts.constraint || opts.selected==='q'
  }
  return { root, update, leftBlock, rightBlock, massLeft, massRight, wheel, ropeL, ropeR }
}
