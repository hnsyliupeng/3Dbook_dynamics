#!/usr/bin/env node
/** Verify all 12 actually rendered live substitutions against independent
 * SciPy states for several sign, energy, extremal and boundary branches. */
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { brotliDecompressSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import chromium from '@sparticuz/chromium'
import { chromium as playwright } from 'playwright-core'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),port=Number(process.env.DERIVATION_PORT||4177),base=`http://127.0.0.1:${port}`
const reference=JSON.parse(readFileSync(join(root,'content/references/deep-physics-reference.json'),'utf8'))
const names=['initial reversal','reverse direction with initial velocity','equal moving at .05']
const server=spawn(process.execPath,[join(root,'node_modules/vite/bin/vite.js'),'--host','0.0.0.0','--port',String(port),'--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe']})
let log='';server.stdout.on('data',x=>log+=x);server.stderr.on('data',x=>log+=x)
const cases=[],errors=[];let browser,failure
try{
  await new Promise((ok,fail)=>{
    let elapsed=0
    const id=setInterval(async()=>{
      elapsed+=100
      if(server.exitCode!==null){clearInterval(id);fail(new Error(`Vite exited: ${log}`));return}
      try{if((await fetch(base)).ok){clearInterval(id);ok();return}}catch{}
      if(elapsed>15000){clearInterval(id);fail(new Error(`Vite did not start: ${log}`))}
    },100)
  })
  const libDir=join(tmpdir(),'3dbook-chromium-libs')
  if(process.platform==='linux'&&!existsSync(join(libDir,'lib','libnss3.so'))){
    mkdirSync(libDir,{recursive:true});const tar=join(libDir,'al2023.tar')
    writeFileSync(tar,brotliDecompressSync(readFileSync(join(root,'node_modules/@sparticuz/chromium/bin/al2023.tar.br'))))
    execFileSync('tar',['-xf',tar,'-C',libDir])
  }
  const args=chromium.args.filter(a=>!['--disable-web-security','--allow-running-insecure-content'].includes(a))
  browser=await playwright.launch({executablePath:process.env.CHROMIUM_PATH||await chromium.executablePath(),headless:true,
    env:{...process.env,LD_LIBRARY_PATH:[join(libDir,'lib'),process.env.LD_LIBRARY_PATH].filter(Boolean).join(':')},
    args:[...args,'--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
  const page=await browser.newPage({viewport:{width:1440,height:1000}})
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  await page.goto(base,{waitUntil:'networkidle',timeout:60000})
  await page.waitForFunction(()=>!document.querySelector('[data-testid=timeline]')?.disabled,null,{timeout:15000})
  const setRange=async(testid,value)=>page.getByTestId(testid).evaluate((el,val)=>{
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,String(val))
    el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))
  },value)
  const fixed=(n,d)=>{const s=n.toFixed(d);return Number(s)===0?(0).toFixed(d):s}
  for(const name of names){
    const c=reference.cases.find(c=>c.name===name);assert.ok(c,name)
    const p=c.parameters, sample=c.samples[/tangency with mass cancellation|near tangent but misses/.test(name)?8:4]
    for(const key of ['m1','m2','g','v0'])await setRange(`param-${key}`,p[key])
    await setRange('timeline',sample.t)
    const {q,velocity:v,t}=sample, a=c.acceleration
    const K=.5*(p.m1+p.m2)*v*v, V=(p.m1-p.m2)*p.g*q, E=K+V, E0=.5*(p.m1+p.m2)*p.v0*p.v0
    const expected=[
      `${(.75-q).toFixed(3)} + ${(.75+q).toFixed(3)} + π × 0.22 = ${(1.5+Math.PI*.22).toFixed(3)} m`,
      `q = ${fixed(q,3)} m · 左侧变化 ${fixed(-q,3)} m`,
      `ẏ₁ = ${fixed(v,3)} m/s · ẏ₂ = ${fixed(-v,3)} m/s`,
      `Tkin = ${fixed(K,3)} J`, `V = ${fixed(V,3)} J`,
      `L = ${fixed(K,3)} − (${fixed(V,3)}) = ${fixed(K-V,3)} J`,
      `∂L/∂q = ${fixed((p.m2-p.m1)*p.g,3)} N · d/dt(∂L/∂q̇) = ${fixed((p.m1+p.m2)*a,3)} N`,
      `${(p.m1+p.m2).toFixed(2)} × ${fixed(a,3)} = ${((p.m2-p.m1)*p.g).toFixed(3)} N`,
      `a = ${fixed(a,3)} m/s²`, `T₍rope₎ = ${c.tension.toFixed(3)} N`,
      `t = ${t.toFixed(3)} s · q = ${fixed(q,3)} m · q̇ = ${fixed(v,3)} m/s`,
      `E = ${fixed(E,3)} J · E₀ = ${fixed(E0,3)} J`,
    ]
    // Comparing formatted strings directly is wrong at a rounding tie: two
    // independent solvers can straddle the last displayed decimal by 1 ulp.
    // Compare each rendered number to the *unrounded* independent reference
    // within half a display unit (plus a tiny binary arithmetic allowance).
    const raw=[
      [.75-q,.75+q,.22,1.5+Math.PI*.22], [q,-q], [v,-v], [K], [V], [K,V,K-V],
      [(p.m2-p.m1)*p.g,(p.m1+p.m2)*a], [p.m1+p.m2,a,(p.m2-p.m1)*p.g],
      [a], [c.tension], [t,q,v], [E,E0],
    ]
    const labels=['π ×','左侧变化','ẏ₁','Tkin','V =','L =','∂L/∂q',' × ','a =','T₍rope₎','t =','E =']
    const steps=[]
    for(let i=0;i<12;i++){
      await page.getByRole('button',{name:new RegExp(`^推导步骤 ${i+1}：`)}).click()
      const actual=await page.locator('.live-substitution').innerText()
      assert.ok(actual.includes(labels[i]),`${name}, step ${i+1}: wrong expression ${actual}`)
      const numbers=(actual.match(/[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)||[]).map(Number)
      assert.ok(numbers.length>=raw[i].length,`${name}, step ${i+1}: missing values ${actual}`)
      for(let j=0;j<raw[i].length;j++){
        const digits=i===7&&j===0?2:i===0&&j===2?2:3
        const tolerance=.5*10**(-digits)+1e-9
        assert.ok(Math.abs(numbers[j]-raw[i][j])<=tolerance,`${name}, step ${i+1}, value ${j}: expected ${raw[i][j]}, got ${numbers[j]} in ${actual}`)
      }
      const actualTime=Number(await page.getByTestId('timeline').inputValue())
      assert.ok(Math.abs(actualTime-t)<1e-9,`${name}: step changed time`)
      steps.push({number:i+1,independentValues:raw[i],illustrativeRoundedText:expected[i],displayed:actual})
    }
    cases.push({name,parameters:p,time:t,steps});console.log(`PASS ${name}: 12/12 live substitutions`)
  }
  assert.deepEqual(errors,[])
}catch(error){failure=String(error.stack||error);console.error('FAIL',failure)}
finally{
  if(browser)await browser.close();server.kill('SIGTERM')
  const output={date:new Date().toISOString(),method:'Rendered UI strings compared with independent SciPy sample states at fixed time',
    casesChecked:cases.length,stepsChecked:cases.reduce((n,c)=>n+c.steps.length,0),failed:failure?1:0,cases,errors,...(failure?{failure}:{})}
  writeFileSync(join(root,'reports/live-derivation-audit.json'),JSON.stringify(output,null,2)+'\n')
  console.log(`Live derivations: ${output.casesChecked} cases, ${output.stepsChecked} step substitutions, ${output.failed} failed.`)
  if(failure)process.exitCode=1
}
