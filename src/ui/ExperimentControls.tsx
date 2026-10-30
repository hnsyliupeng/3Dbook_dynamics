import { RotateCcw, Pause, Play, SkipBack, SkipForward, ChevronDown } from 'lucide-react'
import type { AtwoodParameters } from '../physics/atwood'
import type { PhysicsSnapshot } from '../physics/PhysicsModel'
import { SnapshotStore } from '../simulation/SnapshotStore'

export function Timeline({snapshot,store,playing,speed,setSpeed,onPlay,onReset,onSeek,onStep}: {
  snapshot:PhysicsSnapshot;store:SnapshotStore;playing:boolean;speed:number;setSpeed:(n:number)=>void
  onPlay:()=>void;onReset:()=>void;onSeek:(n:number)=>void;onStep:(direction:-1|1)=>void
}) {
  const atEnd=store.stopTime!==null&&snapshot.t>=store.endTime-1e-8
  return <div className="timeline">
    <div className="transport"><button className="play-button" aria-label={playing?'暂停模拟':atEnd?'从头播放':'开始模拟'} onClick={onPlay}>{playing?<Pause size={16} fill="currentColor"/>:<Play size={16} fill="currentColor"/>}<span>{playing?'暂停':atEnd?'重播':'开始'}</span></button>
      <button className="transport-icon" aria-label="后退一步" title="后退一步" onClick={()=>onStep(-1)}><SkipBack size={16}/></button>
      <button className="transport-icon" aria-label="前进一步" title="前进一步" onClick={()=>onStep(1)}><SkipForward size={16}/></button>
      <button className="transport-icon" aria-label="重置模拟" title="重置模拟" onClick={onReset}><RotateCcw size={15}/></button>
      <div className="time-range"><div className="time-labels"><span>TIME <b data-testid="time-value">{snapshot.t.toFixed(2)}</b> s</span><span>{store.endTime.toFixed(2)} s</span></div><input aria-label="模拟时间轴" data-testid="timeline" type="range" min="0" max={store.endTime} step="any" value={snapshot.t} onChange={e=>onSeek(Number(e.target.value))} style={{'--progress':`${snapshot.t/store.endTime*100}%`} as React.CSSProperties}/></div>
      <div className="speed-select"><select aria-label="播放速度" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select><ChevronDown size={12}/></div>
    </div>
    <div className="timeline-note"><span className={playing?'live-dot active':'live-dot'}/>{atEnd?'已到达行程端点 · 暂停，未模拟碰撞':playing?'模拟运行中 · 固定步长 1/120 s':'已暂停 · 可拖动时间轴'}<span className="right">{store.stopTime===null?'观察窗口 4 s':'端点事件已启用'}</span></div>
  </div>
}
const config=[
  {key:'m1',label:'质量 m₁',unit:'kg',min:.2,max:5,step:.1},
  {key:'m2',label:'质量 m₂',unit:'kg',min:.2,max:5,step:.1},
  {key:'g',label:'重力加速度 g',unit:'m/s²',min:1,max:20,step:.01},
  {key:'v0',label:'初速度 v₀',unit:'m/s',min:-1,max:1,step:.05},
] as const
export function Parameters({parameters,onChange}: {parameters:AtwoodParameters;onChange:(p:AtwoodParameters)=>void}) {
  return <div className="parameter-panel"><div className="parameter-title"><div><span className="section-kicker">YOUR EXPERIMENT / 04</span><h3>改变一个条件 <span>Make it yours</span></h3></div><small>修改后从 t = 0 重新计算</small></div>
    <div className="parameter-grid">{config.map(c=><label key={c.key} className="parameter"><span>{c.label}<b data-testid={`value-${c.key}`}>{parameters[c.key].toFixed(c.key==='g'?2:1)} <small>{c.unit}</small></b></span><input aria-label={c.label} data-testid={`param-${c.key}`} type="range" min={c.min} max={c.max} step={c.step} value={parameters[c.key]} onChange={e=>onChange({...parameters,[c.key]:Number(e.target.value)})} style={{'--progress':`${(parameters[c.key]-c.min)/(c.max-c.min)*100}%`} as React.CSSProperties}/></label>)}</div>
  </div>
}
