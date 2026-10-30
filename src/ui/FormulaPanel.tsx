import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { lessonCompiler } from '../lessons/LessonCompiler'
const atwoodLesson = lessonCompiler.get('atwood-ideal')!
import { Formula } from '../math/FormulaRenderer'
import { DerivationEngine } from '../math/DerivationEngine'
import type { PhysicsSnapshot } from '../physics/PhysicsModel'
import { INITIAL_HANGING_M, RADIUS_M, type AtwoodParameters } from '../physics/atwood'
import { formatFixed } from './format'
const engine=new DerivationEngine(atwoodLesson.derivation)
const variables=[['m1','m₁'],['m2','m₂'],['q','q'],['qdot','q̇'],['a','a']] as const
export function FormulaPanel({snapshot,parameters,selected,onSelect}: {snapshot:PhysicsSnapshot;parameters:AtwoodParameters;selected:string;onSelect:(part:string)=>void}) {
  const [index,setIndex]=useState(0)
  const steps=atwoodLesson.derivation, step=steps[index]
  const substitution:Record<string,string>={
    constraint:`${(INITIAL_HANGING_M-snapshot.q).toFixed(3)} + ${(INITIAL_HANGING_M+snapshot.q).toFixed(3)} + π × ${RADIUS_M.toFixed(2)} = ${(2*INITIAL_HANGING_M+Math.PI*RADIUS_M).toFixed(3)} m`,
    coordinate:`q = ${formatFixed(snapshot.q,3)} m · 左侧变化 ${formatFixed((-snapshot.q),3)} m`,
    velocity:`ẏ₁ = ${formatFixed(snapshot.velocity,3)} m/s · ẏ₂ = ${formatFixed((-snapshot.velocity),3)} m/s`,
    kinetic:`Tkin = ${formatFixed(snapshot.kinetic,3)} J`, potential:`V = ${formatFixed(snapshot.potential,3)} J`,
    lagrangian:`L = ${formatFixed(snapshot.kinetic,3)} − (${formatFixed(snapshot.potential,3)}) = ${formatFixed((snapshot.kinetic-snapshot.potential),3)} J`,
    partials:`两项均为 ${((parameters.m2-parameters.m1)*parameters.g).toFixed(3)} N`,
    euler:`${(parameters.m1+parameters.m2).toFixed(2)} × ${formatFixed(snapshot.acceleration,3)} = ${((parameters.m2-parameters.m1)*parameters.g).toFixed(3)} N`,
    acceleration:`a = ${formatFixed(snapshot.acceleration,3)} m/s²`, tension:`T₍rope₎ = ${snapshot.tension.toFixed(3)} N`,
    solution:`t = ${snapshot.t.toFixed(3)} s · q = ${formatFixed(snapshot.q,3)} m · q̇ = ${formatFixed(snapshot.velocity,3)} m/s`,
    validation:`E = ${formatFixed(snapshot.energy,3)} J · 绳长残差 = ${snapshot.ropeResidual.toExponential(1)} m`,
  }
  const value:Record<string,string>={m1:`${parameters.m1.toFixed(2)} kg`,m2:`${parameters.m2.toFixed(2)} kg`,q:`${formatFixed(snapshot.q,3)} m`,qdot:`${formatFixed(snapshot.velocity,3)} m/s`,a:`${formatFixed(snapshot.acceleration,2)} m/s²`}
  return <div className="formula-panel">
    <div className="formula-head"><div><span className="section-kicker">THE DERIVATION / 02</span><h3>从约束到方程 <span>Follow the logic</span></h3></div><span className="step-count">{String(index+1).padStart(2,'0')} / {String(steps.length).padStart(2,'0')}</span></div>
    <div className="step-dots" aria-label="推导步骤">{steps.map((s,i)=><button key={s.id} className={i===index?'active':''} aria-label={`推导步骤 ${i+1}：${s.title}`} aria-pressed={i===index} onClick={()=>setIndex(i)}><span>{String(i+1).padStart(2,'0')}</span></button>)}</div>
    <div className="formula-card"><div className="formula-card-title"><span>{step.number} / {step.title}</span><span>{engine.pathTo(step.id).length>1?`依赖 ${engine.pathTo(step.id).length-1} 步`:'起点'}</span></div>
      <Formula latex={step.latex} display/><p>{step.explanation}</p><div className="live-substitution">实时代入 · {substitution[step.id]}</div>
      <div className="formula-bottom"><span>✓ {step.verification}</span><div><button aria-label="上一步推导" disabled={index===0} onClick={()=>setIndex(i=>i-1)}><ArrowLeft size={15}/></button><button aria-label="下一步推导" disabled={index===steps.length-1} onClick={()=>setIndex(i=>i+1)}><ArrowRight size={15}/></button></div></div>
    </div>
    <div className="variable-line"><span>点击变量，在模型中定位</span>{variables.map(([key,label])=><button key={key} className={selected===key?'selected':''} onClick={()=>onSelect(selected===key?'':key)} title={`${label} = ${value[key]}`} aria-pressed={selected===key}>{label}</button>)}<em>{selected&&value[selected] ? value[selected] : '↗'}</em></div>
  </div>
}
