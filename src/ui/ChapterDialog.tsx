import { useEffect } from 'react'
import { X, ArrowUpRight, LockKeyhole } from 'lucide-react'

import catalog from '../../content/manifest/lesson-catalog.json'
const chapters = catalog.map(c => [c.number,c.title,c.englishTitle] as const)

export function ChapterDialog({onClose}: {onClose:()=>void}) {
  useEffect(()=>{ const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[onClose])
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="chapter-modal" role="dialog" aria-modal="true" aria-label="章节目录" onMouseDown={e=>e.stopPropagation()}>
    <header><div><span className="eyebrow">THE LIVING BOOK / CONTENTS</span><h2>一本正在生长的书。</h2><p>根据原课程的实际目录编排。目前开放一节互动实验。</p></div><button onClick={onClose} className="round-icon" aria-label="关闭章节目录"><X size={19}/></button></header>
    <div className="chapter-list">{chapters.map(([n,title,en])=><button key={n} className={n==='04'?'chapter-item current':'chapter-item'} disabled={n!=='04'} onClick={onClose}><span className="chapter-num">{n}</span><span><b>{title}</b><small>{en}</small></span><em>{n==='04'?<>开始阅读 <ArrowUpRight size={14}/></>:<><LockKeyhole size={12}/> 待制作</>}</em></button>)}</div>
    <p className="modal-foot">第 11、14 周分别延续第 10、13 章，原仓库没有独立目录。</p>
  </section></div>
}
