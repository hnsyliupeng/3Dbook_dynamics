#!/usr/bin/env node
/** Portable, real-browser interaction + visual evidence. Installs no remote browsers. */
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { brotliDecompressSync } from 'node:zlib'
import { fileURLToPath, pathToFileURL } from 'node:url'
import chromium from '@sparticuz/chromium'
import { chromium as playwright } from 'playwright-core'

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const port=Number(process.env.E2E_PORT || 4174)
const base=`http://127.0.0.1:${port}`
const screenshotDir=join(root,'screenshots'), reportDir=join(root,'reports')
mkdirSync(screenshotDir,{recursive:true});mkdirSync(reportDir,{recursive:true})
const results=[], failures=[], consoleErrors=[], caseAudits=[]
const independent=JSON.parse(readFileSync(join(root,'content/references/deep-physics-reference.json'),'utf8'))
const server=spawn(process.execPath,[join(root,'node_modules/vite/bin/vite.js'),'--host','0.0.0.0','--port',String(port),'--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe']})
let serverLog='';server.stdout.on('data',c=>serverLog+=c);server.stderr.on('data',c=>serverLog+=c)
let browser
try {
  await new Promise((ok,fail)=>{
    let elapsed=0
    const interval=setInterval(async()=>{
      elapsed+=100
      if(server.exitCode!==null){clearInterval(interval);fail(new Error(`Vite exited: ${serverLog}`));return}
      try { const r=await fetch(base);if(r.ok){clearInterval(interval);ok()} } catch {}
      if(elapsed>15000){clearInterval(interval);fail(new Error(`Vite did not start: ${serverLog}`))}
    },100)
  })
  const libDir=join(tmpdir(),'3dbook-chromium-libs')
  if(process.platform==='linux' && !existsSync(join(libDir,'lib','libnss3.so'))){
    mkdirSync(libDir,{recursive:true})
    const tar=join(libDir,'al2023.tar')
    writeFileSync(tar,brotliDecompressSync(readFileSync(join(root,'node_modules/@sparticuz/chromium/bin/al2023.tar.br'))))
    execFileSync('tar',['-xf',tar,'-C',libDir])
  }
  const args=chromium.args.filter(a=>!['--disable-web-security','--allow-running-insecure-content'].includes(a))
  browser=await playwright.launch({executablePath:process.env.CHROMIUM_PATH || await chromium.executablePath(),headless:true,
    env:{...process.env,LD_LIBRARY_PATH:[join(libDir,'lib'),process.env.LD_LIBRARY_PATH].filter(Boolean).join(':')},
    args:[...args,'--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1})
  const page=await context.newPage()
  page.on('pageerror',error=>consoleErrors.push(`pageerror: ${error.message}`))
  page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(`console: ${msg.text()}`)})
  const check=async(name,fn)=>{try{await fn();results.push({name,status:'passed'});console.log('PASS',name)}catch(e){failures.push({name,error:String(e.stack||e)});console.error('FAIL',name,e);throw e}}
  const snap=async(name,fullPage=true)=>{await page.screenshot({path:join(screenshotDir,name),fullPage,timeout:60000})}
  const setRange=async(testid,value)=>{
    await page.getByTestId(testid).evaluate((el,val)=>{
      const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set
      setter.call(el,String(val));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))
    },value)
  }
  const number=async(id)=>parseFloat((await page.getByTestId(id).innerText()).replace(/−/g,'-'))
  const getFrame=()=>page.frame({url:/atwood-colorfigures\.html/})
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('[data-testid=machine-canvas]')
  await check('Opening animation blocks physics controls until the model is ready',async()=>{
    assert.equal(await page.getByTestId('timeline').isDisabled(),true)
    assert.equal(await page.getByRole('button',{name:'开始模拟'}).isDisabled(),true)
    assert.equal(await page.getByTestId('param-m1').isDisabled(),true)
    await page.waitForFunction(()=>!document.querySelector('[data-testid=timeline]')?.disabled,null,{timeout:15000})
    assert.equal(await page.getByTestId('time-value').innerText(),'0.00')
  })
  await check('Default model and visible WebGL assembly',async()=>{
    assert.equal(await number('acceleration'),3.27);assert.equal(await number('tension'),13.08)
    assert.equal(await page.locator('.machine-canvas').count(),1)
    const pixels=await page.locator('.machine-canvas').evaluate(canvas=>{
      const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');if(!gl)return 0
      const a=new Uint8Array(4), w=canvas.width,h=canvas.height;let opaque=0
      for(let x=1;x<10;x++)for(let y=1;y<10;y++){gl.readPixels(Math.floor(w*x/10),Math.floor(h*y/10),1,1,gl.RGBA,gl.UNSIGNED_BYTE,a);if(a[3]>0)opaque++}return opaque
    })
    assert.ok(pixels>2,`WebGL canvas appears empty (${pixels})`)
    await snap('01-atwood-default-engineering.png')
  })
  await check('All 12 displayed substitutions and physical step bindings follow the same frozen time',async()=>{
    await setRange('timeline',.2)
    await page.getByRole('button',{name:'受力矢量'}).click()
    const steps=[
      ['constraint','0.685 + 0.815 + π × 0.22 = 2.191 m',true,true,false,false,true],
      ['coordinate','q = 0.065 m · 左侧变化 -0.065 m',true,true,false,false,true],
      ['velocity','ẏ₁ = 0.654 m/s · ẏ₂ = -0.654 m/s',true,true,true,false,false],
      ['kinetic','Tkin = 0.642 J',true,true,true,false,false],
      ['potential','V = -0.642 J',true,true,false,false,false],
      ['lagrangian','L = 0.642 − (-0.642) = 1.283 J',true,true,true,false,false],
      ['partials','∂L/∂q = 9.810 N · d/dt(∂L/∂q̇) = 9.810 N',true,true,true,true,false],
      ['euler','3.00 × 3.270 = 9.810 N',true,true,true,true,false],
      ['acceleration','a = 3.270 m/s²',true,true,false,true,false],
      ['tension','T₍rope₎ = 13.080 N',true,false,false,true,true],
      ['solution','t = 0.200 s · q = 0.065 m · q̇ = 0.654 m/s',true,true,true,true,false],
      ['validation','E = 0.000 J · E₀ = 0.000 J',true,true,true,false,true],
    ]
    for(let i=0;i<steps.length;i++){
      const [id,text,m1,m2,v,a,rope]=steps[i]
      await page.getByRole('button',{name:new RegExp(`^推导步骤 ${i+1}：`)}).click()
      await page.waitForFunction(id=>document.querySelector('[data-testid=machine-canvas]')?.dataset.activeStep===id,id,{timeout:15000})
      const actual=await page.getByTestId('machine-canvas').evaluate(el=>({...el.dataset}))
      assert.ok((await page.locator('.live-substitution').innerText()).includes(text),`${id}: substitution`)
      assert.equal(actual.highlightedM1,String(m1),`${id}: m1 highlight`)
      assert.equal(actual.highlightedM2,String(m2),`${id}: m2 highlight`)
      assert.equal(actual.velocityVisible,String(v),`${id}: velocity arrow`)
      assert.equal(actual.accelerationVisible,String(a),`${id}: acceleration arrow`)
      assert.equal(actual.ropeColor==='b65d38',rope,`${id}: rope highlight`)
      assert.ok(Math.abs(Number(actual.time)-.2)<1e-10,`${id}: step changed time`)
      assert.match(await page.getByTestId('active-derivation').innerText(),new RegExp(`推导 ${String(i+1).padStart(2,'0')}`))
      if(id==='partials')await snap('01b-atwood-derivation.png')
    }
    // Manual selection overrides step emphasis; changing step restores auto emphasis.
    await page.getByRole('button',{name:/^推导步骤 10：/}).click()
    await page.getByRole('button',{name:'m₂',exact:true}).click()
    await page.waitForFunction(()=>document.querySelector('[data-testid=machine-canvas]')?.dataset.highlightedM1==='false'&&document.querySelector('[data-testid=machine-canvas]')?.dataset.highlightedM2==='true',null,{timeout:15000})
    await page.getByRole('button',{name:/^推导步骤 1：/}).click()
    await page.waitForFunction(()=>document.querySelector('button[title^="m₂ ="]')?.getAttribute('aria-pressed')==='false',null,{timeout:15000})
    await page.getByRole('button',{name:'受力矢量'}).click()
  })
  await check('Play, pause and scrub keep physics, formula and timeline aligned',async()=>{
    await page.getByRole('button',{name:'开始模拟'}).click()
    await page.waitForFunction(()=>parseFloat(document.querySelector('[data-testid="time-value"]').textContent)>0.02,{timeout:15000})
    await page.getByRole('button',{name:'暂停模拟'}).click()
    const paused=await page.getByTestId('time-value').innerText();await page.waitForTimeout(400)
    assert.equal(await page.getByTestId('time-value').innerText(),paused)
    await setRange('timeline',0.2);await page.waitForTimeout(150)
    assert.equal(await page.getByTestId('time-value').innerText(),'0.20')
    assert.ok(Math.abs(await number('displacement')-.0654)<.001)
    await page.waitForFunction(()=>Math.abs(Number(document.querySelector('[data-testid=machine-canvas]')?.dataset.wheelAngle)+.0654/.22)<1e-8, null, {timeout:15000})
    const visual=await page.getByTestId('machine-canvas').evaluate(el=>({...el.dataset}))
    assert.ok(Math.abs(Number(visual.wheelAngle)+.0654/.22)<1e-8)
    assert.ok(Number(visual.m1Height)>.89 && Number(visual.m2Height)<.89)
    assert.ok(Math.abs(Number(visual.straightRopeLength)-1.5)<1e-10)
    assert.match(await page.getByTestId('solver-comparison').innerText(),/解析 q.*RK4 q/s)
    await snap('02-atwood-motion-and-scrub.png')
  })
  await check('A closed cover unloads the visible lab and reopening preserves the paused state',async()=>{
    const time=await page.getByTestId('time-value').innerText()
    await page.getByRole('button',{name:'合上书',exact:true}).click()
    assert.equal(await page.locator('.app-shell').getAttribute('data-book-state'),'CLOSED')
    assert.equal(await page.locator('.machine-canvas').count(),0)
    await snap('00-book-cover.png')
    await page.getByRole('button',{name:'打开书'}).click()
    await page.waitForSelector('.machine-canvas');await page.waitForTimeout(1900)
    assert.equal(await page.getByTestId('time-value').innerText(),time)
    await page.waitForTimeout(200);assert.equal(await page.getByTestId('time-value').innerText(),time)
    // Closing while actually running must also pause; reopening must not resume.
    await page.getByRole('button',{name:'开始模拟'}).click()
    await page.waitForFunction(()=>parseFloat(document.querySelector('[data-testid="time-value"]').textContent)>.20,null,{timeout:15000})
    await page.getByRole('button',{name:'合上书',exact:true}).click()
    assert.equal(await page.locator('.app-shell').getAttribute('data-book-state'),'CLOSED')
    await page.getByRole('button',{name:'打开书'}).click();await page.waitForSelector('.machine-canvas')
    const stopped=await page.getByTestId('time-value').innerText();await page.waitForTimeout(300)
    assert.equal(await page.getByTestId('time-value').innerText(),stopped)
    await page.waitForFunction(()=>!document.querySelector('[data-testid=timeline]')?.disabled,null,{timeout:15000})
    await setRange('timeline',.2)
  })
  await check('Source and licence dialog pauses the simulation',async()=>{
    await page.getByRole('button',{name:'开始模拟'}).click()
    await page.waitForFunction(()=>parseFloat(document.querySelector('[data-testid="time-value"]').textContent)>.20,null,{timeout:15000})
    await page.getByRole('button',{name:'课程来源'}).click()
    const stopped=await page.getByTestId('time-value').innerText();await page.waitForTimeout(300)
    assert.equal(await page.getByTestId('time-value').innerText(),stopped)
    const dialog=page.getByRole('dialog',{name:'来源与模型假设'})
    assert.ok(await dialog.getByRole('link',{name:'CC BY-NC-SA 4.0'}).count())
    await snap('01c-source-and-licence.png')
    await page.getByRole('button',{name:'关闭来源说明'}).click()
    await setRange('timeline',.2)
  })
  await check('Colorfigures artifact receives the exact shared state and rejects a wrong origin',async()=>{
    const before=await page.getByTestId('time-value').innerText()
    await page.getByRole('button',{name:'插画',exact:true}).click()
    await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.__st?.q>0.06,{timeout:12000})
    const frame=getFrame();assert.ok(frame)
    const state=await frame.evaluate(()=>window.__st)
    assert.ok(Math.abs(state.q-.0654)<1e-8);assert.equal(await page.getByTestId('time-value').innerText(),before)
    const errors=await frame.locator('html').getAttribute('data-errors');assert.ok(!errors,errors)
    await frame.evaluate(()=>window.dispatchEvent(new MessageEvent('message',{origin:'https://evil.invalid',source:window.parent,data:{channel:'mechanics-book',version:1,type:'SET_STATE',snapshot:{q:.45,velocity:0,acceleration:0,tension:0},parameters:{m1:1,m2:2,g:9.81}}})))
    assert.ok(Math.abs((await frame.evaluate(()=>window.__st.q))-.0654)<1e-8)
    await snap('03-atwood-colorfigures-synced.png')
    await page.getByRole('button',{name:'工程',exact:true}).click()
    assert.equal(await page.getByTestId('time-value').innerText(),before)
  })
  await check('Reverse masses reverse acceleration and displacement',async()=>{
    await setRange('param-m1',2);await setRange('param-m2',1)
    assert.equal(await number('acceleration'),-3.27);assert.equal(await number('tension'),13.08)
    assert.equal(await page.getByTestId('time-value').innerText(),'0.00')
    await setRange('timeline',.2);assert.ok(Math.abs(await number('displacement')+.0654)<.001)
    await snap('04-atwood-reversed-masses.png')
  })
  await check('Equal masses with zero initial speed stay still',async()=>{
    await setRange('param-m1',2);await setRange('param-m2',2)
    assert.equal(await number('acceleration'),0);assert.equal(await number('tension'),19.62)
    await page.getByRole('button',{name:'开始模拟'}).click();await page.waitForTimeout(650)
    await page.getByRole('button',{name:'暂停模拟'}).click()
    assert.equal(await number('displacement'),0);await snap('05-atwood-equal-masses.png')
  })
  await check('Travel event clamps the physical state; cutaway does not reset it',async()=>{
    await page.getByRole('button',{name:'恢复初始实验'}).click()
    const end=await page.getByTestId('timeline').getAttribute('max');await setRange('timeline',Number(end))
    assert.equal(await number('displacement'),.5);assert.match(await page.getByTestId('energy').innerText(),/^0\.00/);assert.match(await page.locator('.timeline-note').innerText(),/已到达行程端点/);assert.equal(await page.getByRole('button',{name:'从头播放'}).count(),1)
    const time=await page.getByTestId('time-value').innerText();await page.getByRole('button',{name:'剖视',exact:true}).click()
    assert.equal(await page.getByTestId('time-value').innerText(),time);assert.equal(await number('displacement'),.5)
    await snap('06-atwood-stop-and-cutaway.png')
  })
  await check('Step, graph cursor, forecast styling, CSV export and replay are synchronized',async()=>{
    await page.getByRole('button',{name:'重置模拟'}).click()
    await page.getByRole('button',{name:'前进一步'}).click()
    await page.waitForFunction(()=>Math.abs(Number(document.querySelector('[data-testid=machine-canvas]')?.dataset.time)-1/120)<1e-12,null,{timeout:15000})
    await page.getByRole('button',{name:'后退一步'}).click()
    await page.waitForFunction(()=>Number(document.querySelector('[data-testid=machine-canvas]')?.dataset.time)===0,null,{timeout:15000})
    await setRange('timeline',.2)
    const end=Number(await page.getByTestId('timeline').getAttribute('max'))
    const cursor=Number(await page.locator('.chart-cursor').getAttribute('x1'))
    const clip=Number(await page.locator('.chart-svg clipPath rect').getAttribute('width'))
    assert.ok(Math.abs(cursor-(34+334*.2/end))<1e-7)
    assert.ok(Math.abs(clip-334*.2/end)<1e-7)
    for(const [kind,count] of [['q',1],['velocity',1],['energy',3],['error',1]]){
      await page.getByRole('combobox',{name:'图表数据'}).selectOption(kind)
      assert.equal(await page.locator('.chart-svg path[stroke-dasharray]').count(),count)
      assert.equal(await page.locator('.chart-svg path[clip-path]').count(),count)
    }
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'导出 CSV 数据'}).click()])
    const rows=readFileSync(await download.path(),'utf8').trim().split('\n')
    assert.equal(rows.length,74);assert.match(rows[0],/^t_s,q_m,qdot_m_s/)
    assert.ok(Math.abs(Number(rows.at(-1).split(',')[0])-end)<1e-12)
    await page.getByRole('combobox',{name:'图表数据'}).selectOption('q')
    await setRange('timeline',end);await page.getByRole('button',{name:'从头播放'}).click()
    await page.waitForFunction(()=>Number(document.querySelector('[data-testid=machine-canvas]')?.dataset.time)<.15,null,{timeout:15000})
    await page.getByRole('button',{name:'暂停模拟'}).click()
    await page.getByRole('button',{name:'剖视',exact:true}).click()
  })
  await check('Every UI-reproducible named parameter branch matches its independent reference and has a screenshot',async()=>{
    const names=independent.cases.slice(0,independent.namedCases)
    for(const [i,c] of names.entries()){
      if(c.name==='near equal masses, cancellation stress')continue // below the UI slider resolution; tested programmatically
      for(const key of ['m1','m2','g','v0'])await setRange(`param-${key}`,c.parameters[key])
      await page.getByRole('button',{name:'重置模拟'}).click()
      assert.equal(await page.getByTestId('time-value').innerText(),'0.00',`${c.name}: parameter reset`)
      assert.ok(Math.abs((await number('acceleration'))-c.acceleration)<.0051,`${c.name}: a`)
      assert.ok(Math.abs((await number('tension'))-c.tension)<.0051,`${c.name}: T`)
      if(c.parameters.v0===.05)assert.match(await page.getByTestId('value-v0').innerText(),/^0\.05/)
      const end=Number(await page.getByTestId('timeline').getAttribute('max'))
      assert.ok(Math.abs(end-c.endTime)<1e-8,`${c.name}: end ${end} vs ${c.endTime}`)
      const mid=c.samples[4];await setRange('timeline',mid.t)
      await page.waitForFunction(q=>Math.abs(Number(document.querySelector('[data-testid=machine-canvas]')?.dataset.q)-q)<1e-8,mid.q,{timeout:15000})
      const actual=await page.getByTestId('machine-canvas').evaluate(el=>({...el.dataset}))
      assert.ok(Math.abs(Number(actual.velocity)-mid.velocity)<1e-8,`${c.name}: v`)
      assert.ok(Math.abs(Number(actual.wheelAngle)+mid.q/.22)<1e-8,`${c.name}: wheel`)
      assert.ok(Math.abs(Number(actual.m1Height)-(.89+mid.q))<1e-8,`${c.name}: left block`)
      assert.ok(Math.abs(Number(actual.m2Height)-(.89-mid.q))<1e-8,`${c.name}: right block`)
      assert.ok(Math.abs(Number(actual.leftRopeLength)-(.75-mid.q))<1e-8,`${c.name}: left rope`)
      assert.ok(Math.abs(Number(actual.rightRopeLength)-(.75+mid.q))<1e-8,`${c.name}: right rope`)
      await setRange('timeline',end)
      assert.ok(Math.abs((await number('displacement'))-c.samples[8].q)<.00051,`${c.name}: terminal q`)
      assert.match(await page.locator('.timeline-note').innerText(),c.stop?/已到达行程端点/:/观察窗口结束/)
      // Boundary/tangency cases show the event; others show a mid-trajectory pose.
      if(!/tangen|near tangent|horizon/i.test(c.name))await setRange('timeline',mid.t)
      await page.waitForTimeout(130)
      const slug=c.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
      const screenshot=`20-${String(i+1).padStart(2,'0')}-${slug}.png`
      await snap(screenshot)
      caseAudits.push({name:c.name,parameters:c.parameters,reference:c.samples[4],endTime:end,stop:c.stop,screenshot})
    }
    assert.equal(caseAudits.length,17)
    await page.getByRole('button',{name:'恢复初始实验'}).click()
  })
  await check('Page turn pauses the old simulation; exercise gives real feedback',async()=>{
    await setRange('param-m1',2);await setRange('param-m2',2)
    await page.getByRole('button',{name:'开始模拟'}).click();await page.waitForTimeout(300)
    await page.getByRole('tab',{name:/验证与思考/}).click();await page.waitForTimeout(500)
    const paused=await page.getByTestId('time-value').innerText();await page.waitForTimeout(300)
    assert.equal(await page.getByTestId('time-value').innerText(),paused)
    await page.getByRole('button',{name:/保持静止/}).click();assert.match(await page.locator('.quiz-feedback').innerText(),/正确/)
    await snap('07-atwood-verification-exercise.png')
  })
  await check('Chapter catalog contains only the actual 13 directories',async()=>{
    await page.getByRole('button',{name:'章节目录'}).click();const dialog=page.getByRole('dialog',{name:'章节目录'})
    assert.equal(await dialog.locator('.chapter-item').count(),13);assert.equal(await dialog.locator('.chapter-item:not(:disabled)').count(),1)
    await snap('08-chapter-catalog.png',false);await page.getByRole('button',{name:'关闭章节目录'}).click()
  })
  await check('Mobile layout has no horizontal overflow',async()=>{
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(700)
    const dims=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}))
    assert.ok(dims.scroll<=dims.width+1,JSON.stringify(dims));await snap('09-atwood-mobile.png')
  })
  await check('Colorfigures standalone build has no script errors or NaN geometry',async()=>{
    const art=await context.newPage();art.on('pageerror',e=>consoleErrors.push(`colorfigure: ${e.message}`))
    await art.setViewportSize({width:800,height:800});await art.goto(`${base}/skill-artifacts/atwood-colorfigures.html?q=0.2`,{waitUntil:'networkidle'})
    assert.ok(!(await art.locator('html').getAttribute('data-errors')))
    assert.ok(!(await art.locator('#art').innerHTML()).includes('NaN'))
    assert.equal(await art.evaluate(()=>window.__st.q),.2)
    await art.screenshot({path:join(screenshotDir,'10-colorfigures-standalone.png'),fullPage:true})
    await art.getByRole('button',{name:'Reset pose'}).click();assert.equal(await art.evaluate(()=>window.__st.q),0)
    await art.close()
  })
  await check('Machine Skill bundled prototype runs from file without a network request',async()=>{
    const machine=await context.newPage(), requests=[]
    machine.on('request',req=>requests.push(req.url()));machine.on('pageerror',e=>consoleErrors.push(`machine: ${e.message}`))
    await machine.setViewportSize({width:1280,height:720})
    await machine.goto(pathToFileURL(join(root,'public/skill-artifacts/atwood-machine-standalone.html')).href,{waitUntil:'load',timeout:60000})
    await machine.waitForFunction(()=>window.__lab?.renderer && window.__lab.partCount()>10,null,{timeout:30000})
    // Keep the headless software renderer lightweight; the original kit remains unchanged.
    await machine.evaluate(()=>{const lab=window.__lab;lab.ao.enabled=false;lab.bloom.enabled=false;lab.renderer.shadowMap.enabled=false;lab._contact.update=()=>{}})
    assert.ok(await machine.locator('canvas').count()>0)
    assert.equal(requests.filter(url=>/^https?:/.test(url)).length,0)
    await machine.close()
  })
  await check('No browser script or console errors',async()=>assert.deepEqual(consoleErrors,[]))
  await page.bringToFront()
  const fps=await page.evaluate(async()=>{let n=0;const start=performance.now();await new Promise(r=>{function tick(){n++;performance.now()-start<1000?requestAnimationFrame(tick):r()}requestAnimationFrame(tick)});return n})
  results.push({name:'Headless software-rendered rAF measurement (not a GPU performance guarantee)',status:'measured',fps})
  console.log('Headless rAF frames in ~1 s:',fps)
  await context.close()
} catch(error) {
  if(!failures.length)failures.push({name:'Setup or unhandled error',error:String(error.stack||error)})
} finally {
  if(browser)await browser.close()
  server.kill('SIGTERM')
  const report={date:new Date().toISOString(),environment:'Playwright + @sparticuz/chromium software WebGL',caseAudits,passed:results.filter(x=>x.status==='passed').length,failed:failures.length,results,failures,consoleErrors}
  writeFileSync(join(reportDir,'e2e-results.json'),JSON.stringify(report,null,2)+'\n')
  console.log(`E2E: ${report.passed} passed, ${report.failed} failed. Report: reports/e2e-results.json`)
  if(failures.length)process.exitCode=1
}
