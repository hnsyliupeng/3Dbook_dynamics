import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { AtwoodParameters } from '../physics/atwood'
import type { PhysicsSnapshot } from '../physics/PhysicsModel'
import { createMachineAssembly } from '../integrations/MachineSkillAdapter'
import type { DerivationStep } from '../lessons/atwood/lesson'

interface Props {
  snapshot: PhysicsSnapshot; parameters: AtwoodParameters; showForces: boolean; showConstraint: boolean
  cut: boolean; selected: string; onSelect: (part: string) => void; cameraReset: number; rising: boolean; activeStep: DerivationStep | null
}
export function MachineScene(props: Props) {
  const container=useRef<HTMLDivElement>(null), leftLabel=useRef<HTMLDivElement>(null), rightLabel=useRef<HTMLDivElement>(null)
  const latest=useRef(props); latest.current=props
  const controlRef=useRef<OrbitControls | null>(null)
  useEffect(()=>{
    const el=container.current
    if(!el) return
    const scene=new THREE.Scene()
    const camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,30)
    camera.position.set(2.5,2.25,4.5); camera.lookAt(0,1.09,0)
    const renderer=new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); renderer.setClearColor(0x000000,0)
    renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap
    el.prepend(renderer.domElement); renderer.domElement.className='machine-canvas'; renderer.domElement.dataset.testid='machine-canvas'
    const ambient=new THREE.HemisphereLight(0xffffff,0xbcb4a2,2.0); scene.add(ambient)
    const sun=new THREE.DirectionalLight(0xfff8e8,2.5); sun.position.set(-3,5,4); sun.castShadow=true
    sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-2; sun.shadow.camera.right=2; sun.shadow.camera.top=3; sun.shadow.camera.bottom=-2
    sun.shadow.bias=-.0002; scene.add(sun)
    const assembly=createMachineAssembly(); scene.add(assembly.root)
    const controls=new OrbitControls(camera,renderer.domElement)
    controls.target.set(0,1.09,0); controls.enableDamping=true; controls.enablePan=false; controls.enableZoom=true
    controls.minZoom=.75; controls.maxZoom=2.3; controls.minPolarAngle=.35; controls.maxPolarAngle=Math.PI*.59
    controls.update(); controlRef.current=controls
    const resize=()=>{
      const w=Math.max(1,el.clientWidth), h=Math.max(1,el.clientHeight), aspect=w/h, height=2.58
      camera.left=-height*aspect/2; camera.right=height*aspect/2; camera.top=height/2; camera.bottom=-height/2
      camera.updateProjectionMatrix(); renderer.setSize(w,h,false)
    }
    const observer=new ResizeObserver(resize); observer.observe(el); resize()
    const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2(); let down={x:0,y:0}
    const onDown=(event:PointerEvent)=>{down={x:event.clientX,y:event.clientY}}
    const onUp=(event:PointerEvent)=>{
      if(Math.hypot(event.clientX-down.x,event.clientY-down.y)>5)return
      const rect=renderer.domElement.getBoundingClientRect()
      pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1)
      raycaster.setFromCamera(pointer,camera)
      const hit=raycaster.intersectObjects([assembly.leftBlock,assembly.rightBlock])[0]
      if(hit?.object.userData.part) latest.current.onSelect(hit.object.userData.part)
    }
    renderer.domElement.addEventListener('pointerdown',onDown); renderer.domElement.addEventListener('pointerup',onUp)
    const vector=new THREE.Vector3()
    function positionLabel(element:HTMLDivElement|null, object:THREE.Object3D, side:-1|1){
      if(!element)return
      object.getWorldPosition(vector); vector.project(camera)
      const x=(vector.x*.5+.5)*el!.clientWidth, y=(-vector.y*.5+.5)*el!.clientHeight
      element.style.transform=`translate(${x+side*16}px, ${y}px) translate(${side<0?'-100%':'0'},-50%)`
    }
    let frame=0, first=performance.now()
    const render=(now:number)=>{
      const p=latest.current
      assembly.update(p.snapshot,p.parameters,{forces:p.showForces,constraint:p.showConstraint,cut:p.cut,selected:p.selected,activeParts:p.activeStep?.physicalObjectBindings,activeVariables:p.activeStep?.variableBindings})
      renderer.domElement.dataset.activeStep=p.activeStep?.id || ''
      renderer.domElement.dataset.highlightedM1=String(assembly.materials.m1.emissive.getHex()!==0)
      renderer.domElement.dataset.highlightedM2=String(assembly.materials.m2.emissive.getHex()!==0)
      renderer.domElement.dataset.velocityVisible=String(assembly.arrows[0].velocity.visible)
      renderer.domElement.dataset.accelerationVisible=String(assembly.arrows[0].acceleration.visible)
      renderer.domElement.dataset.ropeColor=assembly.materials.rope.color.getHexString()
      renderer.domElement.dataset.time=String(p.snapshot.t)
      renderer.domElement.dataset.q=String(p.snapshot.q)
      renderer.domElement.dataset.velocity=String(p.snapshot.velocity)
      renderer.domElement.dataset.acceleration=String(p.snapshot.acceleration)
      renderer.domElement.dataset.tension=String(p.snapshot.tension)
      renderer.domElement.dataset.wheelAngle=String(assembly.wheel.rotation.z)
      renderer.domElement.dataset.m1Height=String(assembly.massLeft.position.y)
      renderer.domElement.dataset.m2Height=String(assembly.massRight.position.y)
      renderer.domElement.dataset.leftRopeLength=String(assembly.ropeL.scale.y)
      renderer.domElement.dataset.rightRopeLength=String(assembly.ropeR.scale.y)
      renderer.domElement.dataset.straightRopeLength=String(assembly.ropeL.scale.y+assembly.ropeR.scale.y)
      // Only the paper pop-up presentation is eased. Physics is never advanced here.
      const progress=p.rising ? Math.min(1,(now-first)/1100) : 1
      const rise=1-Math.pow(1-progress,3)
      assembly.root.scale.set(1,Math.max(.001,rise),1)
      controls.update(); renderer.render(scene,camera)
      positionLabel(leftLabel.current,assembly.massLeft,-1); positionLabel(rightLabel.current,assembly.massRight,1)
      frame=requestAnimationFrame(render)
    }
    frame=requestAnimationFrame(render)
    return ()=>{
      cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); controlRef.current=null
      renderer.domElement.removeEventListener('pointerdown',onDown); renderer.domElement.removeEventListener('pointerup',onUp)
      scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose(); const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose())}})
      renderer.dispose(); renderer.domElement.remove()
    }
  },[])
  useEffect(()=>{
    const controls=controlRef.current
    if(controls && props.cameraReset>0){ controls.object.position.set(2.5,2.25,4.5); const camera=controls.object as THREE.OrthographicCamera; camera.zoom=1; camera.updateProjectionMatrix(); controls.target.set(0,1.09,0); controls.update() }
  },[props.cameraReset])
  return <div className="machine-scene" ref={container} aria-label="可旋转的三维阿特伍德机模型">
    <div className="object-label left-label" ref={leftLabel}><b>m₁</b><span>{props.parameters.m1.toFixed(1)} kg</span></div>
    <div className="object-label right-label" ref={rightLabel}><b>m₂</b><span>{props.parameters.m2.toFixed(1)} kg</span></div>
  </div>
}
