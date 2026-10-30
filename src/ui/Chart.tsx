import { useId, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { SnapshotStore } from '../simulation/SnapshotStore'
import type { PhysicsSnapshot } from '../physics/PhysicsModel'
import { formatFixed } from './format'

type ChartKind = 'q' | 'velocity' | 'energy' | 'error'
const labels: Record<ChartKind, string> = { q:'位移 q (m)', velocity:'速度 q̇ (m/s)', energy:'能量 (J)', error:'数值误差 (m)' }
const colors = ['#40857d','#c87c61','#b29a68']
function values(s: PhysicsSnapshot, kind: ChartKind) {
  if (kind === 'q') return [s.q]
  if (kind === 'velocity') return [s.velocity]
  if (kind === 'energy') return [s.kinetic, s.potential, s.energy]
  return [s.numericalError]
}
function compact(x:number, kind:ChartKind) {
  if(kind === 'error') return x === 0 ? '0' : x.toExponential(1)
  return Math.abs(x) < 0.0005 ? '0' : x.toFixed(2)
}
export function Chart({store, snapshot}: {store: SnapshotStore; snapshot: PhysicsSnapshot}) {
  const [kind,setKind]=useState<ChartKind>('q')
  const id=useId().replaceAll(':','')
  const samples=useMemo(()=>store.samples(72),[store])
  const data=samples.flatMap(s=>values(s,kind))
  let min=Math.min(0,...data), max=Math.max(0,...data)
  if(Math.abs(max-min)<1e-14){min=kind==='error'?-1e-14:-1;max=kind==='error'?1e-14:1}
  const pad=(max-min)*.1; min-=pad;max+=pad
  const x=(t:number)=>34+(t/store.endTime)*334
  const y=(v:number)=>77-(v-min)/(max-min)*58
  const path=(index:number)=>samples.map((s,i)=>`${i?'L':'M'}${x(s.t).toFixed(2)},${y(values(s,kind)[index]).toFixed(2)}`).join(' ')
  const n=kind==='energy'?3:1
  const download=()=>{
    const rows=['t_s,q_m,qdot_m_s,qdd_m_s2,tension_N,kinetic_J,potential_J,total_J,rope_residual_m,analytic_q_m,numerical_error_m',
      ...samples.map(s=>[s.t,s.q,s.velocity,s.acceleration,s.tension,s.kinetic,s.potential,s.energy,s.ropeResidual,s.analyticalQ,s.numericalError].join(','))]
    const url=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}))
    const a=document.createElement('a');a.href=url;a.download='atwood-experiment.csv';a.click();URL.revokeObjectURL(url)
  }
  return <div className="chart-block">
    <div className="chart-heading"><div><span className="section-kicker">LIVE DATA / 03</span><h3>运动记录 <span>Motion study</span></h3></div>
      <div className="chart-actions"><label className="sr-only" htmlFor={`chart-${id}`}>图表数据</label><select id={`chart-${id}`} aria-label="图表数据" value={kind} onChange={e=>setKind(e.target.value as ChartKind)}>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><button className="icon-button download" aria-label="导出 CSV 数据" title="导出 CSV 数据" onClick={download}><Download size={14}/></button></div>
    </div>
    <svg className="chart-svg" viewBox="0 0 390 96" role="img" aria-label={`${labels[kind]}随时间变化，光标与仿真同步`}>
      <line x1="34" y1="18" x2="368" y2="18" className="chart-grid"/><line x1="34" y1="47" x2="368" y2="47" className="chart-grid"/><line x1="34" y1="77" x2="368" y2="77" className="chart-axis"/>
      <text x="1" y="21">{compact(max-pad,kind)}</text><text x="1" y="79">{compact(min+pad,kind)}</text>
      {Array.from({length:n},(_,i)=><path key={i} d={path(i)} fill="none" stroke={colors[i]} strokeWidth="2" vectorEffect="non-scaling-stroke"/>)}
      <line x1={x(snapshot.t)} y1="12" x2={x(snapshot.t)} y2="77" className="chart-cursor"/>
      {values(snapshot,kind).map((v,i)=><circle key={i} cx={x(snapshot.t)} cy={y(v)} r="3.4" fill={colors[i]} stroke="#faf8ef" strokeWidth="1.4"/>)}
      <text x="34" y="92">0 s</text><text x="368" y="92" textAnchor="end">{store.endTime.toFixed(2)} s</text>
      <defs><clipPath id={`clip-${id}`}><rect x="34" y="12" width="334" height="65"/></clipPath></defs>
    </svg>
    <div className="numerical-compare" data-testid="solver-comparison"><span>解析 q <b>{formatFixed(snapshot.analyticalQ,4)} m</b></span><span>RK4 q <b>{formatFixed(snapshot.q,4)} m</b></span><span>Δq <b>{snapshot.numericalError===0?'0':snapshot.numericalError.toExponential(1)} m</b></span></div>
    <div className="chart-caption">{kind==='energy'?<><span><i style={{background:colors[0]}}/>动能</span><span><i style={{background:colors[1]}}/>势能</span><span><i style={{background:colors[2]}}/>总能量</span></>:<span>固定步长 RK4 · 解析解对照</span>}<b>t = {snapshot.t.toFixed(2)} s</b></div>
  </div>
}
