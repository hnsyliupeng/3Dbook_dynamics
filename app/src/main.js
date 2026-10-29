import './style.css';
import katex from 'katex';
import { LESSONS, SECTIONS, TAG_LABELS, TAG_COLORS } from './lessons.js';
import { createModel, defaultParameters, currentStep, clamp } from './models.js';
import catalog from '../data/source-catalog.json';
import { MechanicsScene } from './scene.js';

const $=id=>document.getElementById(id);
const htmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceBase='https://github.com/aldotb/Solve-classic-mechanics-problems-with-python/blob/'+catalog.commit+'/';
const sourceUrl=file=>sourceBase+encodeURIComponent(file);
const formatParam=v=>Number.isFinite(v)?String(Number(v.toFixed(3))):String(v);
const renderMath=tex=>katex.renderToString(tex,{throwOnError:false,displayMode:false,output:'htmlAndMathml'});
const paramsFromURL=new URLSearchParams(location.search);
const isRender=paramsFromURL.has('render');
const initialId=paramsFromURL.get('case')||window.__CASE_ID__||LESSONS[0].id;
const requested=LESSONS.findIndex(l=>l.id===initialId);
let index=requested>=0?requested:0,params={},preset='abc',model,scene,progress=0,playing=false,manualTag=null,lastStep=-1,lastStamp=null;
let mode='manual';
try { mode=localStorage.getItem('mechanics-mode')==='auto'?'auto':'manual'; } catch {}

function renderNavigation(){
  $('caseNav').innerHTML=SECTIONS.map(section=>`<div class="nav-section"><div class="nav-section-title"><span>${section.number}</span><b>${section.name}</b><small>${section.en}</small></div>${LESSONS.map((l,i)=>({l,i})).filter(({l})=>l.section===section.id).map(({l,i})=>`<button type="button" class="nav-item ${i===index?'active':''}" data-case="${l.id}" ${i===index?'aria-current="page"':''}><span class="nav-index">${String(i+1).padStart(2,'0')}</span><span class="nav-name">${l.title}</span><span class="nav-chevron">›</span></button>`).join('')}</div>`).join('');
  $('caseNav').querySelectorAll('[data-case]').forEach(btn=>btn.addEventListener('click',()=>loadCase(btn.dataset.case)));
}
function renderParameters(){
  const lesson=LESSONS[index];
  $('presetWrap').hidden=!lesson.presets;
  if(lesson.presets){$('preset').innerHTML=lesson.presets.map(x=>`<option value="${x.id}" ${preset===x.id?'selected':''}>${x.label}</option>`).join('');}
  $('parameters').innerHTML=lesson.params.map(p=>{
    const v=params[p.key],percentage=(v-p.min)/(p.max-p.min)*100;
    return `<div class="parameter"><div class="param-top"><label for="parameter-${p.key}">${htmlEscape(p.label)}</label><span class="param-value" id="value-${p.key}">${htmlEscape(formatParam(v))} <small>${htmlEscape(p.unit)}</small></span></div><input id="parameter-${p.key}" data-parameter="${p.key}" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${v}" style="--progress:${percentage}%" aria-label="${htmlEscape(p.label)}"></div>`;
  }).join('');
  $('parameters').querySelectorAll('input').forEach(el=>el.addEventListener('input',()=>changeParameter(el.dataset.parameter,Number(el.value))));
  $('parameterNote').textContent=lesson.kind==='energy'?'质量取 1 kg；场景两段距离分别缩放。修改参数保留当前进度。':lesson.kind==='vector'?'只调整矢量 A；其余分量由所选原题给出。场景按统一比例缩放，修改后保留进度。':lesson.kind==='wall-bounce'?'参数范围确保先撞墙、后落地；球半径仅作示意。修改参数保留进度。':lesson.kind==='two-incline'?'参数范围确保 B 下滑、A 上滑；修改参数保留进度。':'修改参数将重新求解，保留当前进度。';
}
function renderSteps(force=false){
  const lesson=LESSONS[index],active=currentStep(lesson,progress,model);
  if(active===lastStep&&!force)return;
  if(active!==lastStep)manualTag=null;
  lastStep=active;
  $('stepCounter').textContent=`${String(active+1).padStart(2,'0')} / ${String(lesson.steps.length).padStart(2,'0')}`;
  $('stepList').innerHTML=lesson.steps.map((s,i)=>{
    const isActive=i===active,done=i<active,disabled=mode==='manual'&&i>active+1;
    return `<div class="step-card ${isActive?'active':done?'done':'future'}"><button type="button" class="step-button" data-step="${i}" ${disabled?'disabled':''} ${isActive?'aria-current="step"':''}><span class="step-number">${done?'✓':String(i+1).padStart(2,'0')}</span><span class="step-name">${htmlEscape(s.title)}</span><span class="step-state">${isActive?'当前':done?'已完成':i===active+1?'下一步':''}</span></button>${isActive?`<div class="step-detail"><div class="formula">${renderMath(s.formula)}</div><p>${htmlEscape(s.detail)}</p><div class="tag-row">${s.tags.map(tag=>`<button type="button" class="term-tag ${manualTag===tag?'selected':''}" data-tag="${tag}" style="--tag-color:${TAG_COLORS[tag]||'#497c7b'}">${htmlEscape(TAG_LABELS[tag]||tag)} ↗</button>`).join('')}</div></div>`:''}</div>`;
  }).join('');
  $('stepList').querySelectorAll('[data-step]').forEach(el=>el.addEventListener('click',()=>{
    const n=Number(el.dataset.step);pause();setProgress(model.stepBounds[n]);play();
  }));
  $('stepList').querySelectorAll('[data-tag]').forEach(el=>el.addEventListener('click',()=>{manualTag=el.dataset.tag;renderSteps(true);renderCurrent();}));
}
function renderCurrent(){
  const lesson=LESSONS[index],step=currentStep(lesson,progress,model),s=model.sample(progress);
  renderSteps();
  const tags=manualTag?[manualTag]:lesson.steps[step].tags;
  if(scene)scene.update(s,tags);
  $('readouts').innerHTML=s.readouts.map(r=>`<div class="readout" data-readout="${htmlEscape(r.label)}"><span class="readout-label">${htmlEscape(r.label)}</span><span class="readout-value">${htmlEscape(r.value)}<small>${htmlEscape(r.unit)}</small></span></div>`).join('');
  $('timeline').value=Math.round(progress*1000);$('timeline').style.setProperty('--progress',`${progress*100}%`);
  $('timeText').textContent=model.clock==='physical'?`${s.t.toFixed(2)} / ${model.duration.toFixed(2)} ${model.timeUnit}`:`${Math.round(progress*100)}%`;
  $('timelineHint').textContent=lesson.steps[step].title;
  $('speedBadge').textContent=model.clock==='physical'?(model.timeUnit==='h'?`物理时间 ${(model.duration/14).toFixed(2)} h / 秒`:`物理时间 ×${(model.duration/14).toFixed(2)}`):'步骤演示';
  $('play').textContent=playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',playing?'暂停':'播放当前步骤');
  $('previousStep').disabled=progress<=0;$('nextStep').disabled=progress>=1;
}
function setProgress(p){progress=clamp(p);renderCurrent();}
function pause(){playing=false;lastStamp=null;$('play').textContent='▶';$('play').setAttribute('aria-label','播放当前步骤');}
function play(){
  if(isRender)return;
  if(progress>=1)setProgress(0);
  if(playing)return;playing=true;lastStamp=null;renderCurrent();requestAnimationFrame(tick);
}
function tick(now){
  if(!playing)return;
  if(lastStamp===null)lastStamp=now;
  const dt=Math.min((now-lastStamp)/1000,.1);lastStamp=now;
  const end=model.stepBounds[currentStep(LESSONS[index],progress,model)+1];
  let next=progress+dt/14;
  if(mode==='manual'&&next>=end-1e-9){next=end;pause();}
  if(next>=1){if(mode==='auto')next=0;else{next=1;pause();}}
  setProgress(next);
  if(playing)requestAnimationFrame(tick);
}
function setMode(next){mode=next==='auto'?'auto':'manual';try{localStorage.setItem('mechanics-mode',mode)}catch{};
  $('manualMode').classList.toggle('active',mode==='manual');$('autoMode').classList.toggle('active',mode==='auto');
  $('manualMode').setAttribute('aria-pressed',String(mode==='manual'));$('autoMode').setAttribute('aria-pressed',String(mode==='auto'));
  renderSteps(true);if(mode==='auto'&&!isRender)play();else pause();renderCurrent();
}
function loadCase(id,{replace=true}={}){
  const next=LESSONS.findIndex(l=>l.id===id);if(next<0)return;
  pause();index=next;const lesson=LESSONS[index];params=defaultParameters(lesson);preset=lesson.presets?.[0].id||'abc';progress=0;manualTag=null;lastStep=-1;
  model=createModel(lesson,params,preset);
  $('crumbSection').textContent=SECTIONS.find(s=>s.id===lesson.section).name;
  $('crumbNumber').textContent=String(index+1).padStart(2,'0');$('lessonEyebrow').textContent=lesson.eyebrow;
  $('lessonTitle').textContent=lesson.title;$('lessonDescription').textContent=lesson.description;$('lessonQuestion').textContent=lesson.question;$('bigIdea').textContent=lesson.idea;
  $('figureNumber').textContent=String(index+1).padStart(2,'0');$('bookPage').textContent=$('footerPage').textContent=`${String(index+1).padStart(2,'0')} / ${LESSONS.length}`;
  $('sceneNote').textContent=lesson.kind==='vector'?'各矢量按同一比例缩放 · 可拖动旋转':lesson.kind==='direction'?'平行箭头略微错位便于辨识':lesson.kind==='sphere-cylinder'?'球与圆柱按同一比例缩放':lesson.kind==='train'?'车长与隧道按同一比例缩放':lesson.kind==='barrier'?'点模型 · 球半径仅为示意':lesson.kind==='ships'?'位置按统一比例缩放 · 船只为示意':lesson.kind==='wall-bounce'?'点模型 · 球半径仅为示意':lesson.kind==='energy'?'两段距离分别缩放 · 可拖动旋转':['pulley','loaded-pulley','two-incline'].includes(lesson.kind)?'绳长关系按模型驱动 · 可拖动旋转':'拖动旋转 · 滚轮缩放';
  $('previousCase').disabled=index===0;$('nextCase').disabled=index===LESSONS.length-1;
  document.title=`${lesson.title} · 经典力学图鉴`;
  renderNavigation();renderParameters();scene?.build(lesson,model,true);renderSteps(true);renderCurrent();
  if(replace){try{const url=new URL(location.href);url.searchParams.set('case',id);history.replaceState(null,'',url);}catch{}}
  if(mode==='auto'&&!isRender)play();
}
function changeParameter(key,value){
  const lesson=LESSONS[index],spec=lesson.params.find(p=>p.key===key);if(!spec||!Number.isFinite(value))return;
  params[key]=clamp(value,spec.min,spec.max);model=createModel(lesson,params,preset);
  const input=$(`parameter-${key}`);if(input){input.value=params[key];input.style.setProperty('--progress',`${(params[key]-spec.min)/(spec.max-spec.min)*100}%`);}
  const valueEl=$(`value-${key}`);if(valueEl)valueEl.innerHTML=`${htmlEscape(formatParam(params[key]))} <small>${htmlEscape(spec.unit)}</small>`;
  scene?.build(lesson,model,false);renderCurrent();
}
function changePreset(value){
  const lesson=LESSONS[index],chosen=lesson.presets?.find(p=>p.id===value);if(!chosen)return;
  preset=value;params={...defaultParameters(lesson),...chosen.values};model=createModel(lesson,params,preset);renderParameters();scene?.build(lesson,model,false);renderCurrent();
}
function selectTag(tag){
  const lesson=LESSONS[index],step=currentStep(lesson,progress,model);
  if(!lesson.steps[step].tags.includes(tag)){
    const target=lesson.steps.findIndex(s=>s.tags.includes(tag));if(target<0)return;pause();setProgress(model.stepBounds[target]);
  }
  manualTag=tag;renderSteps(true);renderCurrent();
}
function sourceDetails(source){
  const nb=catalog.notebooks.find(n=>n.file===source.file);
  const cells=source.cells.map(i=>`${i} (${nb?.cells[i]?.id||'无 ID'})`).join('、');
  return `<div class="source-row"><div><a href="${sourceUrl(source.file)}" target="_blank" rel="noopener noreferrer">${htmlEscape(source.file)} ↗</a><div class="source-cells">单元索引（从 0 开始）及 cell ID：${htmlEscape(cells)}</div>${source.note?`<div class="source-cells">${htmlEscape(source.note)}</div>`:''}</div><small class="linked">已关联</small></div>`;
}
function showModal(title,kicker,body){$('modalTitle').textContent=title;$('modalKicker').textContent=kicker;$('modalBody').innerHTML=body;if(!$('modal').open)$('modal').showModal();}
function openSource(){
  const l=LESSONS[index];
  showModal('原题来源与模型说明','SOURCE / PROVENANCE',`<div class="modal-callout">${htmlEscape(l.provenance)}</div><p>以下链接固定到源仓库提交 <code>${catalog.commit.slice(0,12)}</code>。索引是原 Notebook 的零基单元序号，括号内为 cell ID；一个关联案例不代表整个 Notebook 已完成。</p><div class="source-list">${l.sources.map(sourceDetails).join('')}</div><p>演示中的场景是为解释模型而构建，并非源图的逐像素复制。示意尺寸、假设和数值差异以页面说明为准。</p><button class="source-button" type="button" id="exportData">↓ 导出当前模型 JSON</button>`);
  $('exportData').addEventListener('click',exportData);
}
function openCatalog(){
  const mapping=new Map();for(const l of LESSONS)for(const s of l.sources){if(!mapping.has(s.file))mapping.set(s.file,[]);mapping.get(s.file).push(l.title);}
  const groups=[['01','01 / 矢量'],['03','02 / 静力学'],['04','02 / 刚体与摩擦'],['02','03 / 运动学'],['05','03 / 动力学'],['07','03 / 功与能'],['06','04 / 质心与惯量']];
  const rows=groups.map(([prefix,title])=>`<h3>${title}</h3><div class="source-list">${catalog.notebooks.filter(nb=>nb.file.startsWith(prefix)).map(nb=>`<div class="source-row"><div><a href="${sourceUrl(nb.file)}" target="_blank" rel="noopener noreferrer">${htmlEscape(nb.file)} ↗</a><div class="source-cells">${nb.cellCount} 个单元${mapping.has(nb.file)?' · '+htmlEscape(mapping.get(nb.file).join('、')):''}</div></div><small class="${mapping.has(nb.file)?'linked':''}">${mapping.has(nb.file)?'部分关联':'待核对'}</small></div>`).join('')}</div>`).join('');
  showModal('源 Notebook 目录','SOURCE INDEX / 39 NOTEBOOKS',`<div class="modal-callout modal-warning"><b>${LESSONS.length} 个综合演示 · ${catalog.notebooks.length} 个源 Notebook。</b> ${mapping.size} 个 Notebook 至少有一个单元与当前案例关联；其他题目尚待逐题核对与实施。关联不等于整本 Notebook 完成。</div><p>按矢量 → 静力学 → 动力学 → 质心与惯量组织，同类题只保留一个综合演示。点击文件可查看原始 Notebook。</p>${rows}`);
}
function openText(){const l=LESSONS[index];showModal(l.title,'ACCESSIBLE TEXT / 文字版',`<div class="modal-callout">${htmlEscape(l.question)}<br><b>核心想法：</b>${htmlEscape(l.idea)}</div><ol class="text-steps">${l.steps.map((s,i)=>`<li><b>${i+1}. ${htmlEscape(s.title)}</b><div class="modal-formula">${renderMath(s.formula)}</div><p>${htmlEscape(s.detail)}</p></li>`).join('')}</ol><p>${htmlEscape(l.provenance)}</p>`);}
function exportData(){
  const l=LESSONS[index],count=l.steps.length;
  const data={version:1,caseId:l.id,title:l.title,sourceCommit:catalog.commit,sources:l.sources.map(s=>({...s,cellIds:s.cells.map(i=>catalog.notebooks.find(n=>n.file===s.file).cells[i].id)})),parameters:params,preset,duration:model.duration,clock:model.clock,timeUnit:model.timeUnit,events:model.events,colorMap:TAG_COLORS,
    derivationScript:l.steps.map((s,i)=>({...s,stepId:String(i+1),tStart:model.duration*model.stepBounds[i],tEnd:model.duration*model.stepBounds[i+1],highlight:s.tags,visual:{highlightObjects:s.tags}})),
    timeSeries:Array.from({length:241},(_,i)=>model.sample(i/240))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`${l.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

$('openCatalog').addEventListener('click',openCatalog);$('openSource').addEventListener('click',openSource);$('textMode').addEventListener('click',openText);
$('closeModal').addEventListener('click',()=>$('modal').close());$('modal').addEventListener('click',e=>{if(e.target===$('modal'))$('modal').close();});
$('manualMode').addEventListener('click',()=>setMode('manual'));$('autoMode').addEventListener('click',()=>setMode('auto'));
$('preset').addEventListener('change',e=>changePreset(e.target.value));
$('play').addEventListener('click',()=>playing?pause():play());
$('restart').addEventListener('click',()=>{pause();manualTag=null;setProgress(0)});
$('previousStep').addEventListener('click',()=>{pause();manualTag=null;setProgress(model.stepBounds[Math.max(0,currentStep(LESSONS[index],progress,model)-1)]);});
$('nextStep').addEventListener('click',()=>{pause();manualTag=null;setProgress(model.stepBounds[Math.min(LESSONS[index].steps.length,currentStep(LESSONS[index],progress,model)+1)]);});
$('timeline').addEventListener('input',e=>{pause();manualTag=null;setProgress(Number(e.target.value)/1000)});
$('previousCase').addEventListener('click',()=>{if(index>0)loadCase(LESSONS[index-1].id)});$('nextCase').addEventListener('click',()=>{if(index<LESSONS.length-1)loadCase(LESSONS[index+1].id)});
$('resetCamera').addEventListener('click',()=>{scene?.build(LESSONS[index],model,true);renderCurrent();});
window.addEventListener('keydown',e=>{
  if($('modal').open||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||e.target.isContentEditable)return;
  if(e.code==='Space'||e.key==='Enter'){e.preventDefault();playing?pause():play();}
  else if(e.key==='ArrowLeft'){$('previousStep').click();}else if(e.key==='ArrowRight'){$('nextStep').click();}else if(e.key.toLowerCase()==='r'){$('restart').click();}
});
try{scene=new MechanicsScene($('scenePanel')||document.querySelector('.scene-panel'),$('sceneCanvas'),$('sceneLabels'),selectTag);}catch(e){
  console.error('WebGL initialization failed',e);document.querySelector('.scene-panel').insertAdjacentHTML('beforeend','<div class="webgl-error">此浏览器无法开启 WebGL。可继续使用文字版和数据；请在浏览器设置中启用硬件加速。</div>');
}
loadCase(LESSONS[index].id,{replace:false});setMode(mode);

// Deterministic recording and acceptance interface. Render mode never starts its own clock.
window.seek=t=>{pause();setProgress(clamp(Number(t)/model.duration));return window.__MECH__.snapshot();};
window.__MECH__={
  lessons:LESSONS.map(l=>({id:l.id,section:l.section,title:l.title,steps:l.steps.length})),
  loadCase:id=>loadCase(id),setProgress,changeParameter,changePreset,setMode,play,pause,
  snapshot:()=>({caseId:LESSONS[index].id,progress,step:currentStep(LESSONS[index],progress,model),playing,mode,parameters:{...params},preset,duration:model.duration,clock:model.clock,timeUnit:model.timeUnit,stepBounds:model.stepBounds,events:model.events,state:model.sample(progress),tags:manualTag?[manualTag]:LESSONS[index].steps[currentStep(LESSONS[index],progress,model)].tags,
    geometry:scene?scene.inspectGeometry():{},sceneTags:scene?Array.from(new Set((()=>{const a=[];scene.root?.traverse(o=>{if(o.userData.tag)a.push(o.userData.tag)});return a})())):[],webgl:!!scene}),
};
