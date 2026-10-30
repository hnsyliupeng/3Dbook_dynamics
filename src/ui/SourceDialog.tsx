import { X, ExternalLink } from 'lucide-react'
import { atwoodLesson } from '../lessons/atwood/lesson'
export function SourceDialog({onClose}: {onClose:()=>void}) {
  const {repository,commit,notebooks}=atwoodLesson.source
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="source-modal" role="dialog" aria-modal="true" aria-label="来源与模型假设" onMouseDown={e=>e.stopPropagation()}>
    <header><span className="eyebrow">ABOUT THIS LESSON</span><button onClick={onClose} className="round-icon" aria-label="关闭来源说明"><X size={19}/></button></header>
    <h2>来源与假设</h2><p>本实验是对 Víctor A. Bettachini / UNLaM 课程的<strong>改编</strong>，不是原 Notebook 的逐字或逐数值复现。</p>
    <div className="source-note"><b>理想模型</b><p>轻绳不可伸长、滑轮无质量、轴无摩擦且绳不滑动；端点处仅暂停，不模拟碰撞。滑轮几何用于观察，其惯量不参与计算。</p></div>
    <p>第 05 章原例包含滑轮转动惯量及不同初值，其式子给出 θ̇ = πẋ₁/R；本实验改用标准无滑移关系 <em>q = Rθ</em>（θ 顺时针为正），详见来源映射。</p>
    {notebooks.map(n=><a key={n} className="source-link" href={`${repository}/blob/${commit}/${n}`} target="_blank" rel="noreferrer">{n}<ExternalLink size={14}/></a>)}
    <p className="license-copy">课程内容：<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a> · 已修改 · 非商业使用与相同方式共享。<br/>源版本：<code>{commit.slice(0,12)}</code> · Colorfigures & Machine Skill: MIT</p>
  </section></div>
}
