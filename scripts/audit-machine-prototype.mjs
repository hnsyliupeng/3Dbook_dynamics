#!/usr/bin/env node
/** Audit the self-contained Machine Skill prototype. This is intentionally
 * separate from the book clock: it is a second, independent demonstrator. */
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { brotliDecompressSync } from 'node:zlib'
import { fileURLToPath, pathToFileURL } from 'node:url'
import chromium from '@sparticuz/chromium'
import { chromium as playwright } from 'playwright-core'

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const libDir=join(tmpdir(),'3dbook-chromium-libs')
if(process.platform==='linux'&&!existsSync(join(libDir,'lib','libnss3.so'))){
  mkdirSync(libDir,{recursive:true});const tar=join(libDir,'al2023.tar')
  writeFileSync(tar,brotliDecompressSync(readFileSync(join(root,'node_modules/@sparticuz/chromium/bin/al2023.tar.br'))))
  execFileSync('tar',['-xf',tar,'-C',libDir])
}
const args=chromium.args.filter(a=>!['--disable-web-security','--allow-running-insecure-content'].includes(a))
const browser=await playwright.launch({executablePath:process.env.CHROMIUM_PATH||await chromium.executablePath(),headless:true,
  env:{...process.env,LD_LIBRARY_PATH:[join(libDir,'lib'),process.env.LD_LIBRARY_PATH].filter(Boolean).join(':')},
  args:[...args,'--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const checks=[], errors=[], requests=[]
const context=await browser.newContext({viewport:{width:1280,height:720}}), page=await context.newPage()
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
await context.route('**/*',route=>{
  const url=route.request().url();if(/^(file:|data:|blob:)/.test(url))return route.continue()
  requests.push(url);return route.abort()
})
const check=async(name,fn)=>{try{await fn();checks.push({name,status:'passed'});console.log('PASS',name)}catch(error){checks.push({name,status:'failed',error:String(error.stack||error)});console.error('FAIL',name,error);throw error}}
const state=()=>page.evaluate(()=>{
  const lab=window.__lab, part=name=>lab.parts.find(p=>p.name===name)
  return {q:part('Mass 1').base.y-.89,m2Y:part('Mass 2').base.y,angle:part('Pulley and hub').obj.rotation.z,
    ropeL:part('Left rope').obj.scale.y,ropeR:part('Right rope').obj.scale.y,
    paused:lab.paused,hero:lab._hv.textContent,status:lab._hs.textContent,sub:lab._hsub.textContent,
    runButton:lab.$('.lab-modes [data-k="run"]').textContent,xray:lab.state.xray,
    ghosts:lab.ghosts.filter(m=>m.userData.ghost?.visible).length}
})
const advance=async(seconds)=>page.evaluate(n=>{for(let i=0;i<n;i++)window.__lab._update(.05)},Math.ceil(seconds/.05))
const setMass=async(n)=>{
  await page.locator('.lab-ctls input[type=range]').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}))},n)
  await page.evaluate(()=>window.__lab._update(0))
}
const screenshot=async(name)=>{
  // Avoid expensive software-only postprocessing, without changing physics.
  await page.evaluate(()=>{const lab=window.__lab;lab._assembly=0;lab.render(0)})
  await page.screenshot({path:join(root,'screenshots',name),timeout:60000})
}
let failure
try{
  await page.goto(pathToFileURL(join(root,'public/skill-artifacts/atwood-machine-standalone.html')).href,{waitUntil:'load',timeout:60000})
  await page.waitForFunction(()=>window.__lab?.controls.m2 && document.querySelector('.lab-modes [data-k=run]'),null,{timeout:30000})
  await page.evaluate(()=>{const lab=window.__lab;lab.ao.enabled=false;lab.bloom.enabled=false;lab.renderer.shadowMap.enabled=false;lab._contact.update=()=>{}})
  await page.waitForFunction(()=>window.__lab?.tickers?.length>0 && window.__lab._hv?.textContent==='3.27',null,{timeout:30000})
  await check('Direct file has no external resources and starts paused with correct default numbers',async()=>{
    await page.evaluate(()=>window.__lab._update(0));const s=await state()
    assert.equal(s.paused,true);assert.match(s.runButton,/Run/);assert.equal(s.hero,'3.27')
    assert.match(s.sub,/tension 13\.08 N/);assert.equal(requests.length,0);assert.equal(errors.length,0)
  })
  await check('The Run control advances the actual browser clock before pausing',async()=>{
    await page.locator('.lab-modes [data-k=run]').click()
    await page.waitForFunction(()=>window.__lab.parts.find(p=>p.name==='Mass 1').base.y>.891,null,{timeout:20000})
    await page.locator('.lab-modes [data-k=run]').click()
    const s=await state();assert.equal(s.paused,true);assert.ok(s.q>0 && s.q<.5)
    const q=s.q;await page.waitForTimeout(400);assert.ok(Math.abs((await state()).q-q)<1e-12)
  })
  await check('Negative acceleration, exact negative endpoint and replay',async()=>{
    await setMass(.2);assert.match(await page.locator('.lab-ctl .row b').innerText(),/^0\.2 kg$/)
    assert.equal((await state()).paused,true);assert.equal((await state()).hero,'-6.54')
    await page.locator('.lab-modes [data-k=run]').click();await advance(2)
    const s=await state();assert.equal(s.paused,true);assert.match(s.status,/at travel stop/);assert.match(s.runButton,/Run/)
    assert.ok(Math.abs(s.q+.5)<1e-12);assert.ok(Math.abs(s.m2Y-1.39)<1e-12)
    assert.ok(Math.abs(s.angle-.5/.22)<1e-12);assert.ok(Math.abs(s.ropeL-1.25)<1e-12);assert.ok(Math.abs(s.ropeR-.25)<1e-12)
    await screenshot('17a-machine-negative-stop.png')
    await page.locator('.lab-modes [data-k=run]').click();await advance(.05)
    const replay=await state();assert.equal(replay.paused,false);assert.ok(replay.q<0 && replay.q>-.05)
    await page.locator('.lab-modes [data-k=run]').click()
  })
  await check('Positive acceleration, tension and exact positive endpoint',async()=>{
    await setMass(5);const start=await state();assert.equal(start.hero,'6.54');assert.match(start.sub,/tension 16\.35 N/)
    await page.locator('.lab-modes [data-k=run]').click();await advance(2)
    const s=await state();assert.equal(s.paused,true);assert.match(s.status,/at travel stop/)
    assert.ok(Math.abs(s.q-.5)<1e-12);assert.ok(Math.abs(s.angle+.5/.22)<1e-12)
    assert.ok(Math.abs(s.ropeL-.25)<1e-12);assert.ok(Math.abs(s.ropeR-1.25)<1e-12)
    await screenshot('17b-machine-positive-stop.png')
  })
  await check('Equal masses remain stationary, finish the 4 s observation and replay',async()=>{
    await setMass(1);assert.equal((await state()).hero,'0.00')
    await page.locator('.lab-modes [data-k=run]').click();await advance(4.1)
    const s=await state();assert.equal(s.paused,true);assert.match(s.status,/observation complete/);assert.equal(s.q,0)
    await screenshot('17c-machine-equal-observation.png')
    await page.locator('.lab-modes [data-k=run]').click();await advance(.1)
    const replay=await state();assert.equal(replay.paused,false);assert.equal(replay.q,0)
    await page.locator('.lab-modes [data-k=run]').click()
  })
  await check('X-ray toggles the actual pulley ghost without changing the physical pose',async()=>{
    const q=(await state()).q
    await page.locator('.lab-modes [data-k=xray]').click();await advance(2)
    const x=await state();assert.ok(x.xray>.99 && x.ghosts>0);assert.equal(x.q,q)
    await page.locator('.lab-modes [data-k=xray]').click();await advance(2)
    const off=await state();assert.ok(off.xray<.01);assert.equal(off.q,q)
  })
  await check('No external requests or browser script errors',async()=>{assert.deepEqual(requests,[]);assert.deepEqual(errors,[])})
}catch(error){failure=String(error.stack||error)}
finally{
  await browser.close()
  const report={date:new Date().toISOString(),environment:'Playwright Chromium, direct file://, software WebGL; expensive post-processing disabled for audit',
    passed:checks.filter(c=>c.status==='passed').length,failed:checks.filter(c=>c.status==='failed').length+(failure&&!checks.some(c=>c.status==='failed')?1:0),checks,blockedExternalRequests:requests,errors,...(failure?{failure}:{})}
  writeFileSync(join(root,'reports/machine-prototype-audit.json'),JSON.stringify(report,null,2)+'\n')
  console.log(`Machine prototype: ${report.passed} passed, ${report.failed} failed. Report: reports/machine-prototype-audit.json`)
  if(failure)process.exitCode=1
}
