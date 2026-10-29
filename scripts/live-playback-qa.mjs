// Check real requestAnimationFrame playback for every lesson, in addition to
// deterministic render-mode GIFs and frame scans. Never reuse ?render here.
import {chromium as playwright} from 'playwright-core';
import chromium from '@sparticuz/chromium';
import {brotliDecompressSync} from 'node:zlib';
import {existsSync} from 'node:fs';
import {mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {LESSONS} from '../app/src/lessons.js';

const qa=resolve('docs/qa'),temp=await mkdtemp(join(tmpdir(),'mechanics-playback-'));
await mkdir(qa,{recursive:true});
await rm(join(qa,'live-playback.json'),{force:true});
const libdir=join(temp,'libs');await mkdir(libdir,{recursive:true});
const archive=resolve('node_modules/@sparticuz/chromium/bin/al2023.tar.br');
if(existsSync(archive)){
  const tar=join(temp,'libs.tar');
  await writeFile(tar,brotliDecompressSync(await readFile(archive)));
  execFileSync('tar',['-xf',tar,'-C',libdir]);
}
const env={...process.env,LD_LIBRARY_PATH:[join(libdir,'lib'),process.env.LD_LIBRARY_PATH||''].filter(Boolean).join(':')};
if(existsSync('/tmp/fonts/fonts.conf'))env.FONTCONFIG_PATH='/tmp/fonts';
const browser=await playwright.launch({executablePath:await chromium.executablePath(),headless:true,args:chromium.args,env});
const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[],entries=[];
// Track outstanding callbacks to catch duplicated animation loops when pause
// and play are invoked repeatedly before the next frame arrives.
await page.addInitScript(()=>{
  const pending=new Set(),raf=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
  window.requestAnimationFrame=callback=>{const id=raf(t=>{pending.delete(id);callback(t);});pending.add(id);return id;};
  window.cancelAnimationFrame=id=>{pending.delete(id);cancel(id);};
  window.__qaPendingFrames=()=>pending.size;
});
page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`);});
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
try{
  await page.goto(pathToFileURL(resolve('index.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>window.__MECH__);
  const stress=await page.evaluate(()=>{
    const api=window.__MECH__;api.pause();
    for(let i=0;i<100;i++){api.play();api.pause();}
    api.play();return {pending:window.__qaPendingFrames(),playing:api.snapshot().playing};
  });
  assert(stress.playing&&stress.pending===1,`快速暂停/播放后存在 ${stress.pending} 个待执行动画帧`);
  await page.waitForFunction(()=>window.__MECH__.snapshot().progress>0,{timeout:12000});
  const afterStress=await page.evaluate(()=>{window.__MECH__.pause();return window.__qaPendingFrames();});
  assert(afterStress===0,`暂停后还有 ${afterStress} 个待执行动画帧`);
  await page.evaluate(()=>window.__MECH__.setMode('auto'));
  for(const lesson of LESSONS){
    const before=await page.evaluate(id=>{
      const api=window.__MECH__;api.loadCase(id);api.pause();api.setProgress(.10);
      const before=api.snapshot();api.play();return before;
    },lesson.id);
    // Wait on actual RAF state, not a fixed sleep: busy software-rendered
    // browsers can take longer than a nominal 16 ms per frame.
    await page.waitForFunction(()=>window.__MECH__.snapshot().progress>=.11,{timeout:12000});
    const {after,pending}=await page.evaluate(()=>({after:window.__MECH__.snapshot(),pending:window.__qaPendingFrames()}));
    assert(after.playing&&after.progress>before.progress&&after.state.t>before.state.t,`${lesson.id}: 自动播放未推进模型时间`);
    assert(pending===1,`${lesson.id}: 正在播放时存在 ${pending} 个待执行动画帧`);
    const preservation=await page.evaluate(([key,value])=>{
      const api=window.__MECH__,before=api.snapshot();api.changeParameter(key,value);
      const after=api.snapshot();return {before:before.progress,after:after.progress,playing:after.playing};
    },[lesson.params[0].key,lesson.params[0].max]);
    assert(preservation.playing&&Math.abs(preservation.after-preservation.before)<1e-9,`${lesson.id}: 播放中改变参数丢失相对进度`);
    const stopped=await page.evaluate(()=>{window.__MECH__.pause();return window.__MECH__.snapshot();});
    await page.waitForTimeout(70);
    const {still,pendingAfterPause}=await page.evaluate(()=>({still:window.__MECH__.snapshot(),pendingAfterPause:window.__qaPendingFrames()}));
    assert(!still.playing&&Math.abs(still.progress-stopped.progress)<1e-9&&pendingAfterPause===0,`${lesson.id}: 暂停后进度或动画帧没有停止`);
    entries.push({id:lesson.id,start:before.progress,advanced:after.progress,timeStart:before.state.t,timeAfter:after.state.t,timeUnit:after.timeUnit,parameterChangedWhilePlaying:lesson.params[0].key,progressPreserved:true,paused:true});
    console.log(`[${entries.length}/${LESSONS.length}] live playback ${lesson.id}`);
  }
  assert(errors.length===0,`浏览器错误: ${errors.join(' | ')}`);
  const result={generatedAt:new Date().toISOString(),caseCount:entries.length,browser:'Headless Chromium, requestAnimationFrame, WebGL/SwiftShader',renderMode:false,rapidPausePlayCycles:100,pendingFramesAfterResume:stress.pending,pendingFramesAfterPause:afterStress,checks:['model time advances during actual automatic playback','parameter changes preserve normalized progress while playing','pause holds progress','rapid pause/play never creates multiple animation loops'],errors,entries};
  await writeFile(join(qa,'live-playback.json'),JSON.stringify(result,null,2)+'\n');
  const readmePath=join(qa,'README.md'),readme=await readFile(readmePath,'utf8');
  const note=`另对 ${entries.length} 个案例在非 render 模式下实际播放：确认 requestAnimationFrame 推进模型时间、播放中改参数保留相对进度、暂停后保持不动；连续 100 次暂停/播放后仅存在一个待执行动画帧。详见 [实际播放报告](live-playback.json)。`;
  if(!readme.includes(note))await writeFile(readmePath,readme.trimEnd()+'\n\n'+note+'\n');
  console.log(`LIVE PLAYBACK PASS: ${entries.length} cases; ${errors.length} errors.`);
}finally{await page.close();await browser.close();await rm(temp,{recursive:true,force:true});}
