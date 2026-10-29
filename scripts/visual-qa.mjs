import { chromium as playwright } from 'playwright-core';
import chromium from '@sparticuz/chromium';
import { brotliDecompressSync } from 'node:zlib';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { LESSONS, SECTIONS } from '../app/src/lessons.js';
import { APPLICATION_LESSONS } from '../app/src/application-lessons.js';

const root=resolve('.'),qa=resolve('docs/qa'),shotDir=join(qa,'screenshots'),gifDir=join(qa,'animations');
await mkdir(shotDir,{recursive:true});await mkdir(gifDir,{recursive:true});
// A failed run must not leave a previous machine-readable report claiming success.
await rm(join(qa,'report.json'),{force:true});
const temp=await mkdtemp(join(tmpdir(),'mechanics-gui-'));
// The serverless Chromium package carries NSS/NSPR libraries for Linux. Extract them
// even on minimal Debian containers where the package does not do so automatically.
const libdir=join(temp,'libs');await mkdir(libdir,{recursive:true});
const archive=resolve('node_modules/@sparticuz/chromium/bin/al2023.tar.br');
if(existsSync(archive)){const tar=join(temp,'libs.tar');await writeFile(tar,brotliDecompressSync(await readFile(archive)));execFileSync('tar',['-xf',tar,'-C',libdir]);}
const exe=await chromium.executablePath();
const env={...process.env,LD_LIBRARY_PATH:[join(libdir,'lib'),process.env.LD_LIBRARY_PATH||''].filter(Boolean).join(':')};
if(existsSync('/tmp/fonts/fonts.conf'))env.FONTCONFIG_PATH='/tmp/fonts';
const browser=await playwright.launch({executablePath:exe,headless:true,args:chromium.args,env});
const context=await browser.newContext({viewport:{width:1440,height:1080},deviceScaleFactor:1});
const page=await context.newPage();const errors=[];
page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
page.on('console',m=>{if(m.type()==='error'||m.text().includes('Buffer size too small'))errors.push(`console: ${m.text()}`)});
page.on('requestfailed',r=>{if(!r.url().startsWith('file:')&&!r.url().startsWith('data:'))errors.push(`request failed: ${r.url()} ${r.failure()?.errorText}`)});
const assert=(cond,msg)=>{if(!cond)throw new Error(msg)};
const near=(a,b,tol=1e-5)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol;
function checkGeometry(lesson,s){
  const g=s.geometry,d=s.state,q=s.parameters,fail=msg=>assert(false,`${lesson.id}: ${msg}`);
  const trail=(t,x,y,count)=>{if(t?.count!==count||!near(t.x,x)||!near(t.y,y))fail(`轨迹缓冲区/终点不匹配 (${JSON.stringify(t)})`)};
  switch(lesson.kind){
    case 'cabled-beam':if(!near(g.quarter,.25)||!near(g.slopeAngle,d.angle)||!near(g.tangentError,0)||g.heavyBottom<g.beamTop-1e-6)fail('梁的四分点、绳倾角、滑轮相切或配重位置不正确');break;
    case 'pushing-blocks':if(!near(g.gap,0)||!near(g.A,g.initialA+d.x*g.scale)||!near(g.B,g.initialB+d.x*g.scale)||!near(g.bottomA,g.floor)||!near(g.bottomB,g.floor)||(q.mu===0&&(g.frictionVisible||g.frictionBVisible)))fail('两块接触、地面、摩擦方向或运动坐标不匹配');break;
    case 'cart-strings':if(!near(g.cartX,g.start+d.x*g.scale)||!near(g.upperAngle,Math.PI/4)||!near(g.lowerAngle,-Math.PI/4)||!near(g.ropeUpper,g.ropeLower))fail('车体位置或两条 45° 绳不匹配');break;
    case 'guided-wedge':if(!near(g.wedgeX,g.left0+d.x*g.scale)||!near(g.sliderX,g.guideX)||!near(g.sliderY,g.initialSliderY-d.drop*g.scale)||!near(g.contactY,g.slopeY)||!near(g.contactX-g.sliderX,g.contactRadius*Math.sin(d.angle))||!near(g.sliderY-g.contactY,g.contactRadius*Math.cos(d.angle)))fail('滑块、楔面法向接触或位置约束不匹配');break;
    case 'billiards':if(!near(g.Ax,d.A[0])||!near(g.Ay,d.A[1])||!near(g.Bx,d.B[0])||!near(g.By,d.B[1])||g.separation<2*g.r-1e-6||Math.abs(g.Ax)+g.r>=2.64||Math.abs(g.Ay)+g.r>=1.64||Math.abs(g.Bx)+g.r>=2.64||Math.abs(g.By)+g.r>=1.64)fail('球心位置、球接触或桌边界错误');if(g.trailACount!==(d.collided?3:2)||g.trailBCount!==2||!near(g.trailAEndX,g.Ax)||!near(g.trailAEndY,g.Ay)||!near(g.trailBEndX,g.Bx)||!near(g.trailBEndY,g.By))fail('碰撞轨迹缓冲区或端点与球不同步');break;
    case 'cubic-drag':if(!near(g.Ay,g.startY-d.xEuler*g.scale)||!near(g.By,g.startY-d.x*g.scale)||g.Ay-g.ballRadius<g.platformTop||g.By-g.ballRadius<g.platformTop||(d.v===0&&g.dragVisible)||(d.vEuler===0&&g.velocityVisible))fail('两种数值解位置不同步、零速度箭头非零或球穿透底座');break;
    case 'peg-flight':if(!near(g.ballX,g.pivotX+d.x*g.scale)||!near(g.ballY,g.floor+g.ballRadius+d.y*g.scale)||g.trajectoryCount!==41||g.cableVisible!==(d.phase!=='flight'))fail('摆球位置、轨迹缓冲区或释放状态不匹配');if(g.cableVisible&&!near(g.cableLength,(d.phase==='long'?2:1)*q.R*g.scale,1e-4))fail('摆绳与摆长不匹配');if(d.phase==='flight'&&(!near(g.trajectoryEndX,g.ballX)||!near(g.trajectoryEndY,g.ballY)))fail('抛物线末端与摆球不同步');break;
    case 'nonlinear-pendulum':if(!near(g.rodLength,g.Lvis)||!near(g.bobX,g.pivotX+g.Lvis*Math.sin(d.theta))||!near(g.bobY,g.pivotY-g.Lvis*Math.cos(d.theta))||g.bobY+g.bobRadius>=g.frameBottom||g.braceFrontZ>=-g.bobRadius)fail('刚杆长度、摆球角度或支架净空不匹配');break;
    case 'coupled-springs':if(!near(g.Ax,g.eq1+d.x1*g.scale)||!near(g.Bx,g.eq2+d.x2*g.scale)||g.space<=0||g.Ax-.38<=-2.65||g.Bx+.42>=2.65)fail('小车位置或滑块间/墙面间距不匹配');break;
    case 'planet-orbits':if(!near(g.earthX,d.earth.x*g.scale)||!near(g.earthY,d.earth.y*g.scale)||!near(g.mercuryX,d.mercury.x*g.scale)||!near(g.mercuryY,d.mercury.y*g.scale)||!near(g.focusX,0)||!near(g.focusY,0))fail('两行星位置或太阳焦点不同步');break;
    case 'moon-orbit':if(!near(g.earthX,0)||!near(g.earthY,0)||!near(g.moonX,d.x*g.scale)||!near(g.moonY,d.y*g.scale))fail('地月相对轨道与数值模型不同步');break;
    case 'beam':if(!near(g.visualK,d.k)||!near(g.supportBX-g.supportAX,3*(g.load1X-g.supportAX))||!near(g.beamBottomY,g.supportTopY)||!near(g.loadBottomY,g.beamTopY))fail('题图载荷、支座或接触几何不匹配');break;
    case 'dot-cross':if(g.handedness!==1||!near(g.dot,d.dot)||!near(g.area,d.area))fail('叉积右手系或面积不匹配');break;
    case 'chord-vector':if(!near(g.circleAError,0)||!near(g.AP/(g.AP+g.PB),d.lambda))fail('圆与分点比例不匹配');break;
    case 'quad-midpoint':if(!near(g.midpointError,0)||!near(g.equalHalfError,0))fail('中点几何不匹配');break;
    case 'triangle-centroid':if(!near(g.centroidMedianError,0)||!near(g.sideFraction,d.lambda===2?.5:1))fail('重心/边向量几何不匹配');break;
    case 'two-balls':if(!near(g.ballContactError,0)||!near(g.wall1Error,0)||!near(g.wall2Error,0)||!near(g.centerDot,-.5))fail('两球与容器接触几何不匹配');break;
    case 'straight-car':if(!near(g.carX,g.startX+(g.endX-g.startX)*d.x/q.distance)||!near(g.roadY,g.wheelBottomY)||!near(g.vehicleLength,g.expectedLength))fail('汽车与道路、物理位置或尺度不一致');break;
    case 'level-projectile':if(!near(g.ballX,g.startX+d.x*g.scale)||!near(g.ballY,g.floor+Math.max(0,d.y)*g.scale+g.ballRadius)||(d.hasRunner&&!near(g.runnerX,g.startX+d.runnerX*g.scale)))fail('小球或跑者位置不匹配');trail(g.trail,g.ballX,g.ballY,41);break;
    case 'projectile-elevation':if(!near(g.ballX,g.startX+d.x*g.scale)||!near(g.ballY,g.floor+Math.max(0,d.y)*g.scale+g.ballRadius))fail('高台抛体位置不匹配');trail(g.trail,g.ballX,g.ballY,41);if(s.progress===1&&(!near(g.ballX,g.targetX)||!near(g.ballY-g.ballRadius,g.platformTop)))fail('小球未到高台顶部');break;
    case 'projectiles-meet':if(!near(g.ballAX,g.startX+d.xA*g.scale)||!near(g.ballBX,g.startX+d.xB*g.scale)||!near(g.ballAY,g.floor+d.yA*g.scale+g.ballRadius)||!near(g.ballBY,g.floor+d.yB*g.scale+g.ballRadius))fail('两球位置不匹配');trail(g.trailA,g.ballAX,g.ballAY,31);trail(g.trailB,g.ballBX,g.ballBY,31);if(s.progress===1&&(!near(g.ballAX,g.ballBX)||!near(g.ballAY,g.ballBY)))fail('相遇事件未重合');break;
    case 'atwood':if(!near(g.leftMassY+g.rightMassY,2*g.baseY)||!near(g.ropeLeftX,-g.pulleyRadius)||!near(g.ropeRightX,g.pulleyRadius)||!near(g.pulleyAngle,-d.displacement/g.pulleyRadius))fail('阿特伍德机位移、绳接触或滑轮转动不一致');break;
    case 'projectile':case 'barrier':trail(g.trail,g.ballX,g.ballY,81);break;
    case 'wall-bounce':trail(g.trail,g.ballX,g.ballY,31);break;
  }
}
const snap=()=>page.evaluate(()=>window.__MECH__.snapshot());
const rootUrl=pathToFileURL(join(root,'index.html')).href;
let entries=[],warnings=[];
try {
  await page.goto(rootUrl+'?render',{waitUntil:'load'});await page.waitForFunction(()=>window.__MECH__);await page.evaluate(()=>document.fonts.ready);
  assert((await snap()).webgl,'WebGL 未初始化');
  const nav=await page.evaluate(()=>window.__MECH__.lessons);
  assert(nav.length===LESSONS.length,'案例目录数量错误');
  assert(JSON.stringify(nav.map(n=>n.id))===JSON.stringify(LESSONS.map(n=>n.id)),'案例顺序错误');
  await page.locator('#openApplications').click();
  assert(await page.locator('#modal .application-card').count()===APPLICATION_LESSONS.length,'新增应用算例入口数量不正确');
  assert((await page.locator('#modalBody').textContent()).includes('静力学')&&(await page.locator('#modalBody').textContent()).includes('动力学'),'应用入口未按静力学、动力学分类');
  await page.locator('[data-open-application="double-pulley-beam"]').click();
  assert((await snap()).caseId==='double-pulley-beam'&&!(await page.locator('#modal').evaluate(e=>e.open)),'应用算例入口不能打开指定案例');
  await page.locator('#openCatalog').click();
  assert(await page.locator('#modal .source-row').count()===67,'源目录应显示 39 + 14 + 14 个源文件');
  assert(await page.locator('#modal .modal-warning').count()===1,'缺少未完成覆盖提示');
  assert(await page.locator('#modal a[target="_blank"]').count()===67,'源链接必须在新窗口打开');
  await page.locator('#closeModal').click();

  for(const [idx,lesson] of LESSONS.entries()){
    console.log(`[${idx+1}/${LESSONS.length}] ${lesson.id}`);
    await page.evaluate(id=>window.__MECH__.loadCase(id),lesson.id);
    let s=await snap();assert(s.caseId===lesson.id&&s.webgl,`${lesson.id}: 页面未加载`);
    assert(await page.evaluate(()=>document.querySelector('.derivation').scrollTop===0),`${lesson.id}: 新案例未返回题目顶部`);
    const folder=join(shotDir,lesson.id);await mkdir(folder,{recursive:true});
    const screenshots=[];
    for(let step=0;step<lesson.steps.length;step++){
      const p=(s.stepBounds[step]+s.stepBounds[step+1])/2;
      await page.evaluate(p=>window.__MECH__.setProgress(p),p);s=await snap();
      assert(s.step===step,`${lesson.id}: ${p} 步骤映射错误`);
      assert(s.tags.every(t=>s.sceneTags.includes(t)),`${lesson.id} step ${step+1}: 场景缺少标签 ${s.tags.filter(t=>!s.sceneTags.includes(t))}`);
      assert((await page.locator('.step-card.active .step-name').textContent()).trim()===lesson.steps[step].title,`${lesson.id}: 公式标题与时间轴不同步`);
      const gui=await page.evaluate(()=>{
        const panel=document.querySelector('.scene-panel').getBoundingClientRect(),card=document.querySelector('.step-card.active').getBoundingClientRect(),track=document.querySelector('.derivation').getBoundingClientRect();
        const labels=[...document.querySelectorAll('.scene-label')].filter(e=>getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return {tag:e.dataset.tag,left:r.left,right:r.right,top:r.top,bottom:r.bottom}});
        const outside=labels.filter(r=>r.left<panel.left-1||r.right>panel.right+1||r.top<panel.top-1||r.bottom>panel.bottom+1).map(r=>r.tag);
        const overlaps=[];for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j],area=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));if(area>12)overlaps.push(`${a.tag}/${b.tag}`);}
        return {outside,overlaps,cardVisible:card.top>=track.top-1&&card.bottom<=track.bottom+1,labels:labels.map(l=>l.tag),readouts:[...document.querySelectorAll('.readout-value')].map(e=>e.textContent.trim())};
      });
      assert(gui.outside.length===0,`${lesson.id} step ${step+1}: 场景标签越界 ${gui.outside}`);
      assert(s.tags.every(t=>gui.labels.includes(t)),`${lesson.id} step ${step+1}: 当前高亮标签未显示 ${s.tags.filter(t=>!gui.labels.includes(t))}`);
      if(gui.overlaps.length)warnings.push(`${lesson.id} step ${step+1}: 标签可能重叠 ${gui.overlaps.join(',')}`);
      assert(gui.cardVisible,`${lesson.id} step ${step+1}: 当前步骤在可滚动区域内未完全可见`);
      assert(s.state.readouts.every((r,i)=>gui.readouts[i]?.includes(r.value)),`${lesson.id}: 仪表与模型不一致`);
      checkGeometry(lesson,s);
      if(lesson.kind==='billiards')assert(step<2?!s.state.collided:s.state.collided,`${lesson.id}: 推演步骤与撞击事件不一致`);
      if(lesson.kind==='peg-flight')assert(s.state.phase===(step===0?'long':step===1?'short':'flight'),`${lesson.id}: 推演步骤与碰钉、释放事件不一致`);
      if(lesson.kind==='energy')assert(step<2?s.state.atRamp:!s.state.atRamp,`${lesson.id}: 推演步骤与坡面/摩擦事件不一致`);
      if(lesson.kind==='wall-bounce')assert(step<2?!s.state.bounced:s.state.bounced,`${lesson.id}: 推演步骤与碰墙事件不一致`);
      if(lesson.kind==='train')assert(step<2?!s.state.observerPassed:(step===2?s.state.observerPassed&&!s.state.headExited:s.state.headExited),`${lesson.id}: 推演步骤与车头/车尾事件不一致`);
      if(lesson.kind==='barrier'&&step===2)assert(s.state.y>=3*s.parameters.L-1e-8,`${lesson.id}: 障碍物区间内轨迹穿透`);
      const filename=`step-${step+1}.png`;await page.screenshot({path:join(folder,filename),fullPage:true});screenshots.push(`screenshots/${lesson.id}/${filename}`);
      const tag=s.tags[0];await page.locator(`.step-card.active .term-tag[data-tag="${tag}"]`).click();
      assert((await snap()).tags.length===1&&(await snap()).tags[0]===tag,`${lesson.id}: 公式标签未驱动场景高亮`);
      await page.locator(`.scene-label[data-tag="${tag}"]`).click();assert((await snap()).tags[0]===tag,`${lesson.id}: 场景标签无法反向定位`);
    }
    // Jump backwards from the last step: the current card must remain visible
    // without scrolling the whole page, even when the panel was scrolled down.
    await page.evaluate(()=>window.__MECH__.setProgress(0));
    assert(await page.evaluate(()=>{const panel=document.querySelector('.derivation').getBoundingClientRect(),card=document.querySelector('.step-card.active').getBoundingClientRect();return card.top>=panel.top-1&&card.bottom<=panel.bottom+1;}),`${lesson.id}: 返回首步时公式未完整可见`);
    // Presets are source exercises consolidated into lessons. Capture each one,
    // not just the default, and check exact values and preservation of normalized progress.
    const presetScreenshots=[];
    for(const choice of lesson.presets||[]){
      await page.evaluate(()=>window.__MECH__.setProgress(.82));
      await page.evaluate(id=>window.__MECH__.changePreset(id),choice.id);const selected=await snap();
      assert(selected.preset===choice.id&&Math.abs(selected.progress-.82)<1e-9,`${lesson.id}/${choice.id}: 预设或进度错误`);
      for(const [key,value] of Object.entries(choice.values))assert(Math.abs(selected.parameters[key]-value)<1e-9,`${lesson.id}/${choice.id}: 原题参数错误`);
      checkGeometry(lesson,selected);
      const filename=`preset-${choice.id}.png`;await page.screenshot({path:join(folder,filename),fullPage:true});presetScreenshots.push({id:choice.id,label:choice.label,path:`screenshots/${lesson.id}/${filename}`});
    }
    await page.evaluate(id=>window.__MECH__.loadCase(id),lesson.id);
    const ropeKeys=lesson.kind==='pulley'?['mainRopeLength','lowerRopeLength']:lesson.kind==='cabled-beam'?['rope1Length','rope2Length']:lesson.kind==='cart-strings'?['ropeUpper','ropeLower']:['two-incline','loaded-pulley','atwood','stacked-pulley'].includes(lesson.kind)?['ropeLength']:[];
    const checkRope=async()=>{
      if(!ropeKeys.length)return;
      await page.evaluate(()=>window.__MECH__.setProgress(0));const start=(await snap()).geometry;
      for(const p of [.25,.5,.75,1]){await page.evaluate(p=>window.__MECH__.setProgress(p),p);const end=(await snap()).geometry;
        for(const key of ropeKeys)assert(Number.isFinite(start[key])&&Math.abs(end[key]-start[key])<1e-4,`${lesson.id}: 场景绳长 ${key} 随进度变化`);
        checkGeometry(lesson,await snap());
      }
      await page.evaluate(()=>window.__MECH__.setProgress(.53));
    };
    await checkRope();
    // All parameter endpoints and midpoint must re-solve without moving normalized progress.
    await page.evaluate(()=>window.__MECH__.setProgress(.53));
    for(const param of lesson.params){
      for(const value of [param.min,(param.min+param.max)/2,param.max]){
        await page.evaluate(([key,value])=>window.__MECH__.changeParameter(key,value),[param.key,value]);const next=await snap();
        assert(Math.abs(next.progress-.53)<1e-9,`${lesson.id}/${param.key}: 参数更改丢失进度`);
        assert(Number.isFinite(next.duration)&&next.duration>0,`${lesson.id}/${param.key}: 时长无效`);
        assert(next.tags.every(t=>next.sceneTags.includes(t)),`${lesson.id}/${param.key}: 高亮目标丢失`);
        checkGeometry(lesson,next);
        if(lesson.kind==='sphere-cylinder'){const g=next.geometry;assert(Math.abs(g.contactError)<1e-8&&Math.abs(g.stringLevelError)<1e-8&&g.ballGroundClearance>=-1e-8,`${lesson.id}/${param.key}: 球、圆柱或地面的几何约束错误`);}
        await checkRope();
      }
    }
    // Test combined geometric limits as well as each single-parameter endpoint.
    if(lesson.kind==='sphere-cylinder'){
      const R=lesson.params.find(p=>p.key==='R'),r=lesson.params.find(p=>p.key==='r');
      for(const big of [R.min,R.max])for(const small of [r.min,r.max]){
        await page.evaluate(([big,small])=>{window.__MECH__.changeParameter('R',big);window.__MECH__.changeParameter('r',small);},[big,small]);
        const g=(await snap()).geometry;assert(Math.abs(g.contactError)<1e-8&&Math.abs(g.stringLevelError)<1e-8&&g.ballGroundClearance>=-1e-8,`${lesson.id}: 球与圆柱组合极值的几何约束错误`);
      }
    }
    // For each new apparatus, exercise combinations of parameter extremes at
    // several physical times and at exact event boundaries, not only one slider.
    if(APPLICATION_LESSONS.some(l=>l.id===lesson.id)){
      let corners=[{}];for(const param of lesson.params)corners=corners.flatMap(c=>[{...c,[param.key]:param.min},{...c,[param.key]:param.max}]);
      for(const values of corners){
        await page.evaluate(values=>{for(const [key,value] of Object.entries(values))window.__MECH__.changeParameter(key,value);},values);
        const bounds=(await snap()).stepBounds;
        for(const p of [...new Set([0,.25,.5,.75,1,...bounds])]){
          await page.evaluate(p=>window.__MECH__.setProgress(p),p);const sample=await snap();checkGeometry(lesson,sample);
        }
      }
    }
    // Restore defaults for all captured motion and deterministic pixel scans.
    await page.evaluate(id=>window.__MECH__.loadCase(id),lesson.id);
    const metrics=await page.evaluate(()=>{
      const api=window.__MECH__,canvas=document.getElementById('sceneCanvas');
      const sample=document.createElement('canvas');sample.width=240;sample.height=136;const ctx=sample.getContext('2d',{willReadFrequently:true});
      const counts=[],boundaries=api.snapshot().stepBounds;let previous=null,colors=0;
      for(let i=0;i<=140;i++){
        api.setProgress(i/140);ctx.drawImage(canvas,0,0,sample.width,sample.height);const pixels=ctx.getImageData(0,0,sample.width,sample.height).data;
        if(i===70){const set=new Set();for(let j=0;j<pixels.length;j+=16)set.add(`${pixels[j]},${pixels[j+1]},${pixels[j+2]}`);colors=set.size;}
        if(previous){let changed=0;for(let j=0;j<pixels.length;j+=4)if(Math.abs(pixels[j]-previous[j])+Math.abs(pixels[j+1]-previous[j+1])+Math.abs(pixels[j+2]-previous[j+2])>30)changed++;counts.push(changed);}
        previous=pixels;
      }
      const sorted=[...counts].sort((a,b)=>a-b),spikes=[];
      for(let i=1;i<counts.length-1;i++){const p=(i+1)/140,atBoundary=boundaries.some(b=>Math.abs(p-b)<2.1/140);if(!atBoundary&&counts[i]>120&&counts[i]>3*Math.max(1,counts[i-1],counts[i+1]))spikes.push({progress:p,changed:counts[i],before:counts[i-1],after:counts[i+1]});}
      return {frames:141,intervalSeconds:.1,downsample:'240×136',medianChanged:sorted[Math.floor(sorted.length/2)],maxChanged:Math.max(...counts),distinctColors:colors,spikes};
    });
    assert(metrics.distinctColors>30,`${lesson.id}: WebGL 场景似乎为空白`);
    assert(metrics.maxChanged>0,`${lesson.id}: 动态帧没有变化`);
    if(metrics.spikes.length)warnings.push(`${lesson.id}: 自动帧差扫描有 ${metrics.spikes.length} 个待人工复核的尖峰`);
    // A compact, deterministic animation of the same GUI. It is a review preview, not a real-time recording.
    const frames=join(temp,lesson.id);await mkdir(frames,{recursive:true});
    const paths=[];for(let i=0;i<=16;i++){
      await page.evaluate(p=>window.__MECH__.setProgress(p),i/16);
      const path=join(frames,`${String(i).padStart(2,'0')}.png`);await page.locator('.book').screenshot({path});paths.push(path);
    }
    try{execFileSync('convert',['-delay','18','-loop','0',...paths,'-resize','640x','-colors','64','-layers','OptimizePlus',join(gifDir,`${lesson.id}.gif`)],{stdio:'pipe',timeout:120000});}
    catch(e){throw new Error(`${lesson.id}: 无法生成 GIF；请安装 ImageMagick convert。${e.message}`);}
    entries.push({id:lesson.id,title:lesson.title,section:lesson.section,screenshots,presetScreenshots,geometryRopeLengthChecked:ropeKeys.length>0,animation:`animations/${lesson.id}.gif`,frameScan:metrics});
  }
  // Every generated per-case HTML is opened directly from disk (not a dev server).
  for(const lesson of LESSONS){
    const f=pathToFileURL(join(root,'cases',`${lesson.id}.html`)).href;await page.goto(f,{waitUntil:'load'});await page.waitForFunction(()=>window.__MECH__);
    const s=await snap();assert(s.caseId===lesson.id&&s.webgl,`${lesson.id}: 独立 HTML 默认案例错误`);
    await page.evaluate(()=>{window.__MECH__.pause();window.__MECH__.setProgress(.53);const el=document.querySelector('#parameters input');el.value=el.min;el.dispatchEvent(new Event('input',{bubbles:true}));});
    const next=await snap();assert(Math.abs(next.progress-.53)<1e-9&&next.parameters[lesson.params[0].key]===lesson.params[0].min,`${lesson.id}: 离线页面参数交互或进度错误`);
    await page.evaluate(()=>window.seek(window.__MECH__.snapshot().duration*.7));assert(Math.abs((await snap()).progress-.7)<1e-8,`${lesson.id}: 离线页面 seek 失效`);
  }
  // The five user-supplied figure crops must load offline and stay traceable.
  for(const lesson of APPLICATION_LESSONS.filter(l=>l.figure)){
    await page.goto(rootUrl+`?case=${lesson.id}&render`,{waitUntil:'load'});await page.waitForFunction(()=>window.__MECH__);
    await page.locator('#openFigure').click();
    const figure=await page.locator('#modal .problem-figure').evaluate(img=>({complete:img.complete,width:img.naturalWidth,src:img.currentSrc}));
    assert(figure.complete&&figure.width>0&&figure.src.startsWith('data:image/'),`${lesson.id}: 用户题图未离线嵌入`);
    assert((await page.locator('#modalBody').textContent()).includes('用户提供'),`${lesson.id}: 题图来源说明缺失`);
    if(lesson.id==='pushing-two-blocks')await page.screenshot({path:join(qa,'user-figure-modal.png'),fullPage:true});
    await page.locator('#closeModal').click();
  }
  // Native gzip decoding is deliberately optional: old browsers get a working
  // direct link to the uncompressed root and the same case, even offline.
  const fallback=await context.newPage();await fallback.addInitScript(()=>Object.defineProperty(window,'DecompressionStream',{value:undefined,configurable:true}));
  await fallback.goto(pathToFileURL(join(root,'cases','elastic-billiards-2d.html')).href,{waitUntil:'load'});
  await fallback.waitForSelector('#loading a');assert((await fallback.locator('#loading').textContent()).includes('不支持离线解压'),'旧浏览器没有可理解的回退说明');
  await fallback.locator('#loading a').click();await fallback.waitForFunction(()=>window.__MECH__);
  assert((await fallback.evaluate(()=>window.__MECH__.snapshot())).caseId==='elastic-billiards-2d','离线解压回退未保留案例');await fallback.close();
  // Cross-repository provenance and browser JSON export keep the actual source
  // and missing IDs, rather than assigning the first repository to every entry.
  await page.goto(rootUrl+'?case=car-constant-acceleration&render',{waitUntil:'load'});await page.waitForFunction(()=>window.__MECH__);
  await page.locator('#openSource').click();
  const links=await page.locator('#modal .source-row a').evaluateAll(es=>es.map(e=>e.href));
  assert(links.length===2&&links[0].includes('aldotb/Solve-classic-mechanics-problems-with-python/blob/dc05f371')&&links[1].includes('vpagonis/Classical_Mechanics_2nd_Edition/blob/1d608847'),'跨仓库来源链接或固定版本错误');
  assert((await page.locator('#modalBody').textContent()).includes('源文件无 cell ID'),'第二来源没有披露无 cell ID');
  await page.evaluate(()=>{const old=URL.createObjectURL.bind(URL);URL.createObjectURL=b=>{window.__qaBlob=b;return old(b);};});
  await page.locator('#exportData').click();const exported=await page.evaluate(async()=>JSON.parse(await window.__qaBlob.text()));
  assert(exported.question&&exported.assumptions&&exported.timeSeries.length===241,'浏览器 JSON 未导出题目、模型假设或时间序列');
  const second=exported.sources.find(s=>s.repo==='pagonis');
  assert(second?.repository==='vpagonis/Classical_Mechanics_2nd_Edition'&&second.commit==='1d60884725baabf901c2a5fc1eee2fd1ee3014da'&&second.cellIds.every(x=>x===null),'跨仓库导出来源或缺失 cell ID 错误');
  await page.locator('#closeModal').click();

  // Mobile layout, source modal, and no horizontal page overflow.
  await page.setViewportSize({width:390,height:844});await page.goto(rootUrl+'?case=movable-pulley&render',{waitUntil:'load'});await page.waitForFunction(()=>window.__MECH__);
  await page.evaluate(()=>window.__MECH__.setProgress(.6));await page.screenshot({path:join(qa,'mobile-pulley.png'),fullPage:true});
  const mobile=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,canvas:document.querySelector('canvas').getBoundingClientRect().width}));
  assert(mobile.width<=mobile.viewport,`移动端横向溢出: ${mobile.width}/${mobile.viewport}`);assert(mobile.canvas>250,'移动端场景宽度异常');
  await page.locator('#openSource').click();assert((await page.locator('#modalBody').textContent()).includes('05A3 Dynamics Pulley.ipynb'),'来源弹窗未显示对应原题');await page.locator('#closeModal').click();

  for(const id of ['cart-two-strings','elastic-billiards-2d','earth-moon-orbit']){
    await page.goto(rootUrl+`?case=${id}&render`,{waitUntil:'load'});await page.waitForFunction(()=>window.__MECH__);
    await page.evaluate(()=>window.__MECH__.setProgress(.55));await page.screenshot({path:join(qa,`mobile-${id}.png`),fullPage:true});
    const dims=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,canvas:document.querySelector('canvas').getBoundingClientRect().width}));
    assert(dims.width<=dims.viewport&&dims.canvas>250,`${id}: 移动端溢出或画布过窄`);
  }
  await page.locator('#openApplications').click();assert(await page.locator('#modal .application-card').count()===APPLICATION_LESSONS.length,'移动端应用入口缺失');await page.locator('#closeModal').click();

  // Real requestAnimationFrame playback, manual pause at a step boundary, keyboard, mode persistence.
  await page.setViewportSize({width:1440,height:1080});await page.goto(rootUrl+'?case=movable-pulley',{waitUntil:'load'});await page.waitForFunction(()=>window.__MECH__);await page.evaluate(()=>window.__MECH__.setMode('manual'));
  await page.locator('#play').click();await page.waitForTimeout(650);const advancing=await snap();assert(advancing.progress>0&&advancing.playing,'播放按钮没有驱动动画');
  await page.waitForFunction(()=>!window.__MECH__.snapshot().playing,{timeout:7000});let paused=await snap();assert(Math.abs(paused.progress-paused.stepBounds[1])<1e-6,'手动模式未在当前步骤结束时暂停');
  await page.locator('#autoMode').click();await page.waitForTimeout(400);let auto=await snap();assert(auto.mode==='auto'&&auto.playing&&auto.progress>paused.progress,'自动模式没有继续播放');
  await page.locator('#manualMode').click();paused=await snap();assert(!paused.playing&&paused.mode==='manual','切换手动模式未暂停');
  await page.keyboard.press('r');assert((await snap()).progress===0,'R 重置无效');await page.keyboard.press('ArrowRight');assert((await snap()).step===1,'右方向键单步无效');
  await page.locator('#textMode').click();assert(await page.locator('#modal .text-steps li').count()===4,'文字版步骤缺失');await page.locator('#closeModal').click();
  assert(errors.length===0,`浏览器错误：${errors.join(' | ')}`);

  const report={generatedAt:new Date().toISOString(),sourceCommit:'dc05f371ac47fb82f9a00f622a274c5433629018',sourceCommits:{aldotb:'dc05f371ac47fb82f9a00f622a274c5433629018',pagonis:'1d60884725baabf901c2a5fc1eee2fd1ee3014da'},caseCount:entries.length,stepScreenshotCount:entries.reduce((n,e)=>n+e.screenshots.length,0),animationCount:entries.length,presetScreenshotCount:entries.reduce((n,e)=>n+e.presetScreenshots.length,0),crossRepositoryExportChecked:true,geometryRopeCases:entries.filter(e=>e.geometryRopeLengthChecked).map(e=>e.id),
    browser:'Headless Chromium, WebGL/SwiftShader',viewport:'1440×1080; mobile 390×844',offlineFilePagesChecked:LESSONS.length,offlineInteractiveWithoutRender:true,offlineDecompressionFallbackChecked:true,userProblemFiguresChecked:5,applicationCornerGeometryCases:APPLICATION_LESSONS.map(l=>l.id),parameterEndpoints:'min/mid/max; progress preserved; application combinations at boundaries',playback:'manual/auto, step boundary, keyboard',
    pixelScan:'141 deterministic WebGL frames per case at 0.1 s of the 14 s presentation; 240×136 downsample. Step boundaries excluded from spike heuristic.',errors,warnings,entries};
  await writeFile(join(qa,'report.json'),JSON.stringify(report,null,2)+'\n');
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const gallery=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>逐案例 GUI 与动画验证 · 经典力学图鉴</title><style>body{font:15px/1.6 system-ui,"Microsoft YaHei",sans-serif;margin:0;background:#f2f0e8;color:#294940}header,main{max-width:1200px;margin:auto;padding:28px}header{padding-bottom:0}h1{font:32px Georgia,serif}h2{margin-top:36px;color:#487f70}.note{background:#fff7e7;border:1px solid #e7d6b7;padding:14px;border-radius:8px;color:#886c44}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:18px}.card{background:#fafaf5;border:1px solid #dfe7db;border-radius:8px;padding:14px;overflow:hidden}.card img{width:100%;border:1px solid #e5e8dc;border-radius:5px}.card h3{font-size:16px}.links{display:flex;gap:12px;flex-wrap:wrap;font-size:12px}a{color:#278376}small{color:#84988b}</style></head><body><header><small>MECHANICS ATLAS / VISUAL QA</small><h1>逐案例 GUI 与动态验证</h1><p>${entries.length} 个综合案例，每个案例 4 张步骤中点截图及一段确定性动态预览。</p><div class="note">这些是已实现案例的验证，不表示源仓库所有题目已完成。GIF 为 17 帧压缩预览，完整交互请打开案例 HTML。<a href="report.json">机器可读报告</a> · <a href="mobile-pulley.png">移动端截图</a></div></header><main>${SECTIONS.map(sec=>`<h2>${esc(sec.number)} / ${esc(sec.name)}</h2><div class="cards">${entries.filter(e=>e.section===sec.id).map(e=>`<article class="card"><h3>${esc(e.title)}</h3><a href="${e.animation}"><img src="${e.animation}" alt="${esc(e.title)}的动态验证预览"></a><p class="links">${e.screenshots.map((s,i)=>`<a href="${s}">步骤 ${i+1} 截图</a>`).join('')}${e.presetScreenshots.map((p,i)=>`<a href="${p.path}">原题预设 ${i+1}</a>`).join('')}<a href="../../cases/${e.id}.html">打开案例</a></p><small>帧差扫描 ${e.frameScan.frames} 帧 · ${e.frameScan.spikes.length} 个待复核尖峰</small></article>`).join('')}</div>`).join('')}</main></body></html>`;
  await writeFile(join(qa,'gallery.html'),gallery);
  await writeFile(join(qa,'README.md'),`# GUI 与动态验证\n\n- [逐案例截图及动态预览](gallery.html)\n- [移动端截图](mobile-pulley.png)\n- [机器可读报告](report.json)\n\n本次针对 ${entries.length} 个已实现综合案例，分别保存 4 个步骤中点截图（共 ${report.stepScreenshotCount} 张）和 17 帧 GIF；另有 ${report.presetScreenshotCount} 张原题预设截图。所有独立 HTML 直接以 file:// 打开；验证源目录、时间轴、参数最小/中间/最大值、高亮标签可见性、仪表、播放/暂停和移动端横向溢出。七个滑轮/绳索场景额外检查参数极值及各时刻的可视化绳长保持不变；新增 11 个应用装置检查组合极值、运动与接触几何、事件时刻及轨迹端点；五张用户题图检查离线加载；压缩案例逐个测试无 render 参数时的滑块、seek 和解压不可用回退。还检查梁、两球、球与圆柱、汽车接触、抛体轨迹缓存/坐标、两个来源的链接与 JSON 导出，以及列车、碰撞和越障事件。\n\n每个案例另外以统一时间轴逐 0.1 秒采样 141 个 WebGL 帧，缩至 240×136 比较像素变化；推演步骤边界的有意高亮变化不计尖峰。该启发式不能替代人工逐帧审查，GIF 也不是完整实时视频。\n\n${warnings.length?'需留意：\n'+warnings.map(w=>'- '+w).join('\n'):'自动检查未报告标签越界、标签重叠或帧差尖峰。'}\n\n这些验证只覆盖当前已实现案例，不能视为源 Notebook 的全部题目已复现。\n`);
  console.log(`GUI PASS: ${entries.length} cases, ${report.stepScreenshotCount} screenshots, ${entries.length} animations. Warnings: ${warnings.length}`);for(const w of warnings)console.log('WARN:',w);
} finally {await context.close();await browser.close();await rm(temp,{recursive:true,force:true});}
