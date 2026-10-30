import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Box, Check, ChevronDown, CircleHelp, Layers2, Move3D, Rotate3D, ScanLine, Sparkles } from 'lucide-react'
import { type BookPage, type BookState, pageLabels } from '../book/BookEngine'
import { ClosedBook } from '../book/ClosedBook'
import { DEFAULT_PARAMETERS, RADIUS_M } from '../physics/atwood'
import { useSimulation } from '../simulation/useSimulation'
import { MachineScene } from '../visuals/MachineScene'
import { ColorfiguresAdapter } from '../integrations/ColorfiguresAdapter'
import { ChapterDialog } from '../ui/ChapterDialog'
import { SourceDialog } from '../ui/SourceDialog'
import { FormulaPanel } from '../ui/FormulaPanel'
import { Chart } from '../ui/Chart'
import { Parameters, Timeline } from '../ui/ExperimentControls'
import { Formula } from '../math/FormulaRenderer'
import { formatFixed } from '../ui/format'
import type { DerivationStep } from '../lessons/atwood/lesson'

const tabs: {id:BookPage; index:string; label:string}[]=[{id:'theory',index:'01',label:'认识系统'},{id:'experiment',index:'02',label:'推导与实验'},{id:'verify',index:'03',label:'验证与思考'}]
function Brand() { return <div className="brand"><span className="brand-mark"><BookOpen size={19} strokeWidth={1.6}/></span><div><strong>MECHANICS <em>in motion</em></strong><small>THE INTERACTIVE 3D BOOK</small></div></div> }
function IntroPanel() { return <div className="intro-panel"><div className="intro-number">01 <span>／ THE QUESTION</span></div><h3>如果两边不一样重，<br/><em>会发生什么？</em></h3><p>在理想条件下，两块质量由一根跨过滑轮的绳子相连。绳长固定，因此其中一块的位移决定了另一块的运动。</p><div className="concept-rows"><div><span>01</span><b>理想绳与滑轮</b><small>绳不可伸长，滑轮无质量</small></div><div><span>02</span><b>一个广义坐标</b><small>定义 m₂ 向下为正方向</small></div><div><span>03</span><b>在端点之前观察</b><small>到达边界时暂停，不计算碰撞</small></div></div><div className="intro-equation"><Formula latex={String.raw`\ell_1+\ell_2+\pi R=L`} display/><span>一条约束 · 一个自由度</span></div></div> }
function Quiz({onComplete}: {onComplete:()=>void}) {
  const [answer,setAnswer]=useState<string|null>(null)
  return <div className="quiz-panel"><span className="section-kicker">PREDICT / VERIFY / EXPLAIN</span><h3>先预测，再验证。</h3><p>如果两边质量相等，并且初速度为零，理想系统会如何运动？</p><div className="quiz-choices">{[['still','保持静止'],['down','m₂ 持续向下'],['oscillate','来回振荡']].map(([key,label],i)=><button key={key} onClick={()=>{setAnswer(key);if(key==='still')onComplete()}} className={answer===key?(key==='still'?'correct':'wrong'):''}><span>{String.fromCharCode(65+i)}</span>{label}{answer===key&&key==='still'&&<Check size={16}/>}</button>)}</div>{answer&&<div className={answer==='still'?'quiz-feedback good':'quiz-feedback'}>{answer==='still'?'正确。m₁ = m₂ 时合广义力为零；初速度也为零，所以 q 不变。':'再想一想：质量相等时，重力产生的广义力之差是多少？'}</div>}<div className="quiz-hint"><Sparkles size={16}/><span>试着把两个质量设为相同、初速度设为零，再按下开始。</span></div></div>
}
export default function App() {
  const sim=useSimulation()
  const [page,setPage]=useState<BookPage>('experiment')
  const [bookState,setBookState]=useState<BookState>('OPENING')
  const [turning,setTurning]=useState(false)
  const [mode,setMode]=useState<'engineering'|'illustration'>('engineering')
  const [forces,setForces]=useState(true), [constraint,setConstraint]=useState(true), [cut,setCut]=useState(false)
  const [selected,setSelected]=useState(''), [cameraReset,setCameraReset]=useState(0)
  const [activeStep,setActiveStep]=useState<DerivationStep|null>(null)
  const [chapters,setChapters]=useState(false), [sources,setSources]=useState(false)
  const [entrance,setEntrance]=useState(true), [closed,setClosed]=useState(false)
  const entranceTimers=useRef<number[]>([])
  const clearEntrance=useCallback(()=>{entranceTimers.current.forEach(clearTimeout);entranceTimers.current=[]},[])
  const animateOpening=useCallback(()=>{
    clearEntrance();setEntrance(true);setBookState('OPENING')
    entranceTimers.current=[window.setTimeout(()=>setBookState('INK_DRAWING'),250),window.setTimeout(()=>setBookState('POPUP_RISING'),850),
      window.setTimeout(()=>{setEntrance(false);setBookState(current=>['OPENING','INK_DRAWING','POPUP_RISING'].includes(current)?'MODEL_READY':current)},1750)]
  },[clearEntrance])
  useEffect(()=>{animateOpening();return clearEntrance},[animateOpening,clearEntrance])
  const closeBook=()=>{sim.pause();clearEntrance();setActiveStep(null);setEntrance(false);setClosed(true);setBookState('CLOSED')}
  const openBook=()=>{setClosed(false);animateOpening()}
  const select=useCallback((part:string)=>setSelected(part),[])
  const selectStep=useCallback((step:DerivationStep)=>{setSelected('');setActiveStep(step)},[])
  const changePage=(next:BookPage)=>{
    if(next===page||turning)return
    sim.pause();setActiveStep(null);setBookState('PAGE_TURNING');setTurning(true)
    window.setTimeout(()=>{setPage(next);setSelected('');setTurning(false);setBookState(next==='verify'?'VERIFYING':next==='experiment'?'DERIVING':'MODEL_READY')},340)
  }
  const openChapters=()=>{sim.pause();setBookState('CHAPTER_SELECT');setChapters(true)}
  const closeChapters=()=>{setChapters(false);setBookState(closed?'CLOSED':'PAUSED')}
  const openSources=()=>{sim.pause();setBookState(closed?'CLOSED':'PAUSED');setSources(true)}
  useEffect(()=>{if(sim.playing)setBookState('SIMULATING');else setBookState(current=>current==='SIMULATING'?'PAUSED':current)},[sim.playing])
  const togglePlay=()=>{sim.playPause();setBookState(sim.playing?'PAUSED':'SIMULATING')}
  const atEnd=sim.snapshot.t>=sim.store.endTime-1e-8
  const stateText=sim.playing?'运行中':atEnd?(sim.store.stopTime!==null?'端点已暂停':'观察结束'):'准备就绪'
  return <div className="app-shell" data-book-state={bookState}>
    <header className="site-header"><Brand/><nav aria-label="主导航"><button className="nav-active" onClick={openChapters}>章节目录 <ChevronDown size={13}/></button><span className="nav-divider"/><button onClick={openSources}>关于这本书</button></nav><div className="header-right"><span className="header-issue">AN OPEN LEARNING PROJECT</span>{!closed&&<button className="close-book" onClick={closeBook}>合上书</button>}<button className="source-button" onClick={openSources}>课程来源 <ArrowUpRight size={14}/></button></div></header>
    <main>
      <div className="masthead"><div><div className="breadcrumb"><span>THE LIVING BOOK</span><i/> <button onClick={openChapters}>04 — 约束</button><i/> <b>阿特伍德机</b></div><h1>把力学，<em>带到生活中。</em></h1><p>一本可以推导、实验和探索的分析力学书。</p></div><div className="masthead-right"><span>VOLUME 01</span><b>01 <i>/</i> 13</b><small>ANALYTICAL MECHANICS<br/>COMPUTATIONAL EDITION</small></div></div>
      <div className={`book-holder ${closed?'holder-closed':''}`}>{closed?<ClosedBook onOpen={openBook}/>:<div className={`book ${turning?'is-turning':''}`}>
        <div className="book-top-edge"/><div className={`turn-sheet ${turning?'turning':''}`} aria-hidden="true"/><div className="book-spine" aria-hidden="true"/>
        <section className="book-page theory-page" aria-label="理论与推导">
          <div className="page-topline"><span><b>04</b> / CONSTRAINTS</span><span>THEORY & DERIVATION</span></div>
          <div className="title-block"><div className="chapter-tag"><span>LESSON 01</span><i/> <span>约束与运动</span></div><h2>Atwood’s<br/><em>Machine.</em></h2><div className="title-chinese"><strong>阿特伍德机</strong><span>一根绳，两个质量，一种运动。</span></div></div>
          <div className="book-tabs" role="tablist" aria-label="课程阅读步骤">{tabs.map(t=><button role="tab" aria-selected={page===t.id} key={t.id} onClick={()=>changePage(t.id)}><span>{t.index}</span>{t.label}</button>)}</div>
          <div className="left-page-body" key={page}>
            {page==='theory'?<IntroPanel/>:page==='experiment'?<><FormulaPanel snapshot={sim.snapshot} parameters={sim.parameters} selected={selected} onSelect={select} onStepChange={selectStep}/><Chart store={sim.store} snapshot={sim.snapshot}/></>:<Quiz onComplete={()=>setBookState('COMPLETED')}/>}
          </div>
          <div className="page-bottom"><button onClick={()=>changePage(page==='verify'?'experiment':'theory')} aria-label="上一页"><ArrowLeft size={14}/></button><span>THE LIVING BOOK <i>·</i> {pageLabels[page]}</span><button onClick={()=>changePage(page==='theory'?'experiment':'verify')} aria-label="下一页"><ArrowRight size={14}/></button><b>04</b></div>
        </section>
        <section className="book-page lab-page" aria-label="交互式力学实验室">
          <div className="page-topline"><span><b>05</b> / INTERACTIVE LAB</span><span><i className="tiny-dot"/> {stateText}</span></div>
          <div className="lab-heading"><div><span className="section-kicker">FIGURE 01 / IDEAL ATWOOD MACHINE</span><h3>让方程，<em>动起来。</em></h3></div><button className="help-button" onClick={openSources} aria-label="模型假设与来源"><CircleHelp size={17}/></button></div>
          <div className="lab-stage" data-testid="lab-stage">
            <div className="stage-meta"><span><i/> LIVE MODEL</span><span>1 DOF <i className="slash">/</i> 理想模型</span></div>
            <div className="mode-toggle" role="group" aria-label="模型视觉模式"><button className={mode==='engineering'?'active':''} aria-pressed={mode==='engineering'} onClick={()=>setMode('engineering')}><Box size={13}/> 工程</button><button className={mode==='illustration'?'active':''} aria-pressed={mode==='illustration'} onClick={()=>setMode('illustration')}><Sparkles size={13}/> 插画</button></div>
            {activeStep&&<div className="stage-step-link" data-testid="active-derivation">推导 {activeStep.number} · {activeStep.title}</div>}
            {mode==='engineering'?<MachineScene snapshot={sim.snapshot} parameters={sim.parameters} showForces={forces} showConstraint={constraint} cut={cut} selected={selected} onSelect={select} cameraReset={cameraReset} rising={entrance} activeStep={activeStep}/>:<ColorfiguresAdapter snapshot={sim.snapshot} parameters={sim.parameters} showForces={forces} showConstraint={constraint} selected={selected} onSelect={select} activeStep={activeStep}/>}
            {entrance && mode==='engineering' && <div className="ink-appearance" aria-hidden="true"><svg viewBox="0 0 300 300"><path d="M72 254V43H228V254M50 254H250M150 43V74M112 135V240M188 135V240M112 135a38 38 0 0 1 76 0M101 240h22v23h-22zM177 240h22v23h-22z"/></svg><span>FROM INK TO MOTION</span></div>}
            <div className="stage-bottom-left"><span className="coord-symbol">q <ArrowDownRight size={14}/></span><div><b>正方向</b><small>m₂ 向下</small></div></div><div className="stage-bottom-right">{mode==='engineering'?<><Move3D size={14}/> 拖动旋转模型</>:<>COLORFIGURES · 固定视角</>}</div>
            {cut&&mode==='engineering'&&<div className="cut-note">轮缘 1/4 剖开 · 示意</div>}
          </div>
          <div className="view-options"><div className="view-buttons"><button className={forces?'on':''} onClick={()=>setForces(!forces)} aria-pressed={forces}><span className="check-box">{forces&&<Check size={10}/>}</span>受力矢量</button><button className={constraint?'on':''} onClick={()=>setConstraint(!constraint)} aria-pressed={constraint}><span className="check-box">{constraint&&<Check size={10}/>}</span>约束标注</button><button className={cut?'on':''} disabled={mode!=='engineering'} onClick={()=>setCut(!cut)} aria-pressed={cut}><ScanLine size={14}/>剖视</button></div><button className="camera-button" disabled={mode!=='engineering'} onClick={()=>setCameraReset(n=>n+1)}><Rotate3D size={14}/> 重置视角</button></div>
          <div className="force-legend"><span><i className="gravity"/>重力</span><span><i className="tension"/>张力</span><span><i className="velocity"/>速度</span>{(selected==='a'||(!selected&&activeStep?.variableBindings.includes('a')))&&<span><i className="acceleration-color"/>加速度 (0.05 m / (m/s²))</span>}<small>力矢量：0.008 m/N；插画模式为 0.005 m/N</small></div>
          <Timeline disabled={entrance} snapshot={sim.snapshot} store={sim.store} playing={sim.playing} speed={sim.speed} setSpeed={sim.setSpeed} onPlay={togglePlay} onReset={()=>{sim.reset();setBookState('PAUSED')}} onSeek={sim.seek} onStep={sim.step}/>
          <Parameters disabled={entrance} parameters={sim.parameters} onChange={p=>{sim.setParameters(p);setBookState('EXPERIMENTING')}}/>
          <div className="metrics-strip"><div><span>加速度 a</span><b data-testid="acceleration">{formatFixed(sim.snapshot.acceleration,2)} <small>m/s²</small></b></div><div><span>绳索张力 T<sub>rope</sub></span><b data-testid="tension">{formatFixed(sim.snapshot.tension,2)} <small>N</small></b></div><div><span>位移 q</span><b data-testid="displacement">{formatFixed(sim.snapshot.q,3)} <small>m</small></b></div><div><span>总能量 E</span><b data-testid="energy">{formatFixed(sim.snapshot.energy,2)} <small>J</small></b></div></div>
          <div className="page-bottom lab-page-bottom"><span>R = {RADIUS_M.toFixed(2)} m <i>·</i> ADAPTED MODEL</span><button onClick={openSources}>来源与假设 <ArrowUpRight size={13}/></button><b>05</b></div>
        </section>
      </div>}</div>
      <div className="under-book"><div><span className="under-icon"><Layers2 size={15}/></span><p><b>一个物理状态，多个观察角度。</b><br/>公式、模型与曲线始终共享同一条时间轴。</p></div><div className="under-actions">{!closed&&<button className="under-close" onClick={closeBook}>合上书</button>}<button disabled={entrance} onClick={()=>{sim.setParameters({...DEFAULT_PARAMETERS});setSelected('');setCut(false)}}><Rotate3D size={15}/> 恢复初始实验</button></div></div>
      <footer className="site-footer"><span>© 原课程 Víctor A. Bettachini / UNLaM · CC BY-NC-SA 4.0 · 本书为改编作品</span><button onClick={openSources}>来源、许可与模型说明 <ArrowUpRight size={13}/></button></footer>
    </main>
    {chapters&&<ChapterDialog onClose={closeChapters}/>}{sources&&<SourceDialog onClose={()=>setSources(false)}/>}
  </div>
}
