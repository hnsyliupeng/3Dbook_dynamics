import { ArrowRight, BookOpen } from 'lucide-react'

/** The cover is presentation only. Opening it never advances the physics clock. */
export function ClosedBook({onOpen}: {onOpen:()=>void}) {
  return <div className="closed-volume" aria-label="合上的三维书本">
    <div className="cover-spine"/><div className="cover-border"/>
    <div className="cover-top"><span><BookOpen size={15}/> THE LIVING BOOK</span><span>VOLUME 01</span></div>
    <div className="cover-heading"><span>AN INTERACTIVE FIELD GUIDE</span><h2>Mechanics<br/><em>in motion.</em></h2><p>计算分析力学 · 一本会动的书</p></div>
    <svg className="cover-drawing" viewBox="0 0 300 250" aria-hidden="true"><path d="M66 226V32H234V226M52 226H248M150 32V62M112 104V175M188 104V175M112 104a38 38 0 0 1 76 0M101 175h22v26h-22zM177 175h22v26h-22z"/><circle cx="150" cy="104" r="38"/><circle cx="150" cy="104" r="5"/><path d="M150 66v76M112 104h76M123 77l54 54M177 77l-54 54"/></svg>
    <div className="cover-bottom"><div><span>UNIVERSIDAD NACIONAL DE LA MATANZA</span><b>从方程出发，<br/>去发现运动。</b></div><button onClick={onOpen}>打开书 <ArrowRight size={16}/></button></div>
  </div>
}
