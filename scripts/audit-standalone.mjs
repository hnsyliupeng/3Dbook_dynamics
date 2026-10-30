#!/usr/bin/env node
/** Browser-level deployment audit. No CDN or application backend is allowed. */
import { createServer } from 'node:http'
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'
import { brotliDecompressSync } from 'node:zlib'
import chromium from '@sparticuz/chromium'
import { chromium as playwright } from 'playwright-core'

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'), dist=join(root,'dist')
const baseline=process.argv.includes('--baseline')
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'}
async function serve(prefix) {
  const server=createServer(async(req,res)=>{
    try {
      const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname)
      if(!pathname.startsWith(prefix)){res.writeHead(404).end('not in deployment prefix');return}
      let relative=pathname.slice(prefix.length)
      if(!relative || relative.endsWith('/')) relative+='index.html'
      const file=resolve(dist,relative)
      if(!file.startsWith(dist+sep)){res.writeHead(403).end();return}
      const data=await readFile(file)
      res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}).end(data)
    }catch{res.writeHead(404).end('not found')}
  })
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok))
  return {server,url:`http://127.0.0.1:${server.address().port}${prefix}`}
}
const rootServer=await serve('/'), prefixServer=await serve('/nested/course/')
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
const checks=[]
const ctx=await browser.newContext({viewport:{width:1100,height:800}}), page=await ctx.newPage()
let errors=[], remote=[]
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
await ctx.route('**/*',async(route)=>{
  const requested=route.request().url()
  if(requested.startsWith('file:') || requested.startsWith('data:') || requested.startsWith(rootServer.url) || requested.startsWith(prefixServer.url)) return route.continue()
  remote.push(requested);return route.abort()
})
async function inspect(name,url,{wait=1200,interactive=false}={}){
  errors=[];remote=[]
  let rendered=false, details={}
  try{
    await page.goto(url,{waitUntil:'load',timeout:45000});await page.waitForTimeout(wait)
    rendered=await page.locator('[data-testid=machine-canvas]').count()===1
    if(rendered){
      details.acceleration=await page.getByTestId('acceleration').innerText()
      if(interactive){
        // Exercise the actual shared clock, derivation binding and iframe message
        // protocol in each deployment, not merely the presence of an element.
        await page.waitForFunction(()=>!document.querySelector('[data-testid=timeline]')?.disabled,null,{timeout:15000})
        await page.getByRole('button',{name:'推导步骤 7：计算偏导与全导数'}).click()
        await page.getByRole('button',{name:'插画',exact:true}).click()
        await page.waitForSelector('iframe',{timeout:12000})
        const frame=page.frames().find(f=>f.parentFrame()===page.mainFrame())
        assert.ok(frame,'figure frame not found')
        await frame.waitForFunction(()=>window.__st?.activeStep==='partials',null,{timeout:12000})
        const beforeSvg=await frame.locator('#art').innerHTML()
        const spokeBefore=await frame.locator('[data-component=pulley-spokes]').innerHTML()
        const boxes=()=>frame.evaluate(()=>Object.fromEntries(['m1','m2'].map(name=>{const b=document.querySelector(`[data-act=${name}]`).getBBox();return [name,{x:b.x,y:b.y,width:b.width,height:b.height}]})))
        const beforeBoxes=await boxes()
        await page.getByTestId('timeline').evaluate(el=>{
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'0.2')
          el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))
        })
        await frame.waitForFunction(()=>Math.abs(window.__st?.q-.0654)<1e-8,null,{timeout:12000})
        const st=await frame.evaluate(()=>window.__st), afterSvg=await frame.locator('#art').innerHTML()
        assert.ok(Math.abs(st.velocity-.654)<1e-8 && Math.abs(st.tension-13.08)<1e-8)
        assert.equal(st.activeStep,'partials');assert.deepEqual(st.activeParts,['m1','m2'])
        assert.ok(beforeSvg!==afterSvg && !afterSvg.includes('NaN'),'SVG did not follow physical state')
        const afterBoxes=await boxes(), spokeAfter=await frame.locator('[data-component=pulley-spokes]').innerHTML()
        assert.ok(afterBoxes.m1.y<beforeBoxes.m1.y && afterBoxes.m2.y>beforeBoxes.m2.y,'mass SVGs moved in the wrong direction')
        assert.notEqual(spokeBefore,spokeAfter,'rendered pulley spokes did not turn with q')
        assert.equal(await page.getByTestId('time-value').innerText(),'0.20')
        const m2Active=await frame.locator('[data-act=m2]').innerHTML()
        await page.getByRole('button',{name:'推导步骤 10：绳索中的张力'}).click()
        await frame.waitForFunction(()=>window.__st?.activeStep==='tension',null,{timeout:12000})
        assert.deepEqual((await frame.evaluate(()=>window.__st.activeParts)),['rope','m1'])
        assert.notEqual(await frame.locator('[data-act=m2]').innerHTML(),m2Active,'step did not change actual SVG highlighting')
        assert.equal(await page.getByTestId('time-value').innerText(),'0.20')
        await page.getByRole('button',{name:'推导步骤 7：计算偏导与全导数'}).click()
        await frame.waitForFunction(()=>window.__st?.activeStep==='partials',null,{timeout:12000})
        // Reject messages with wrong origin, wrong protocol version, and wrong
        // sender Window even when the parent uses an opaque file:// origin.
        await frame.evaluate(()=>{
          const origin=document.documentElement.dataset.parentOrigin || location.origin
          const payload={channel:'mechanics-book',version:1,type:'SET_STATE',snapshot:{q:.45,velocity:0,acceleration:0,tension:1},parameters:{m1:1,m2:2,g:9.81}}
          window.dispatchEvent(new MessageEvent('message',{origin:'https://evil.invalid',source:window.parent,data:payload}))
          window.dispatchEvent(new MessageEvent('message',{origin,source:window.parent,data:{...payload,version:999}}))
          window.dispatchEvent(new MessageEvent('message',{origin,source:window,data:payload}))
        })
        assert.ok(Math.abs((await frame.evaluate(()=>window.__st.q))-.0654)<1e-8,'frame accepted a forged message')
        // The host must reject bad SELECT_PART origin/version/source as well.
        await page.evaluate(()=>{
          const child=document.querySelector('iframe').contentWindow
          const origin=location.protocol==='file:'?'null':location.origin
          const payload={channel:'mechanics-book',version:1,type:'SELECT_PART',part:'m2'}
          window.dispatchEvent(new MessageEvent('message',{origin:'https://evil.invalid',source:child,data:payload}))
          window.dispatchEvent(new MessageEvent('message',{origin,source:child,data:{...payload,version:999}}))
          window.dispatchEvent(new MessageEvent('message',{origin,source:window,data:payload}))
        })
        assert.equal(await page.getByRole('button',{name:'m₂',exact:true}).getAttribute('aria-pressed'),'false','host accepted a forged message')
        // A real artifact click travels back to the host and changes selection.
        await frame.locator('[data-act=m1]').dispatchEvent('pointerdown',{bubbles:true,button:0})
        await page.waitForFunction(()=>document.querySelector('button[title^="m₁ ="]')?.getAttribute('aria-pressed')==='true',null,{timeout:12000})
        await frame.waitForFunction(()=>window.__st?.selected==='m1',null,{timeout:12000})
        details={...details,illustration:true,sharedQ:st.q,sharedVelocity:st.velocity,sharedTension:st.tension,
          derivationStep:st.activeStep,geometryChanged:true,massDirectionsCorrect:true,pulleySpokesTurn:true,stepHighlightChanged:true,forgedMessagesRejected:true,bidirectionalSelection:true}
        if(name==='完整自包含单文件 file://') await page.screenshot({path:join(root,'screenshots/16-standalone-file.png'),fullPage:true,timeout:60000})
      }
    }
  }catch(e){errors.push(String(e.message||e))}
  const result={name,url,rendered,details,blockedExternalRequests:remote,errors:errors.slice(0,6)}
  checks.push(result);console.log(`${rendered?'RENDERED':'NOT RENDERED'} ${name}`,errors[0]||'')
}
async function inspectFigure(){
  errors=[];remote=[]
  const name='独立 Colorfigures file://',url=pathToFileURL(join(root,'public/skill-artifacts/atwood-colorfigures.html')).href+'?q=0.2'
  let rendered=false,details={}
  try{
    await page.goto(url,{waitUntil:'load',timeout:45000})
    await page.waitForFunction(()=>window.__st?.q===.2,null,{timeout:15000})
    assert.equal(await page.locator('#art').count(),1)
    const before=await page.locator('#art').innerHTML()
    assert.ok(!before.includes('NaN'));assert.ok(!(await page.locator('html').getAttribute('data-errors')))
    await page.getByRole('button',{name:'Reset pose'}).click()
    assert.equal(await page.evaluate(()=>window.__st.q),0)
    assert.notEqual(await page.locator('#art').innerHTML(),before)
    await page.getByRole('button',{name:'Move to +0.2 m'}).click()
    assert.equal(await page.evaluate(()=>window.__st.q),.2)
    rendered=true;details={poseControls:true,noNaN:true,simulationClock:false}
    await page.screenshot({path:join(root,'screenshots/18-colorfigure-file.png'),fullPage:true,timeout:60000})
  }catch(e){errors.push(String(e.stack||e))}
  checks.push({name,url,rendered,details,blockedExternalRequests:remote,errors:errors.slice(0,6)})
  console.log(`${rendered?'RENDERED':'NOT RENDERED'} ${name}`,errors[0]||'')
}
try{
  await inspect('源码 index.html 直接 file://',pathToFileURL(join(root,'index.html')).href)
  await inspect('生产 dist/index.html 直接 file://',pathToFileURL(join(dist,'index.html')).href)
  await inspect('离线静态根目录',rootServer.url,{interactive:true,wait:2200})
  await inspect('离线静态子目录',prefixServer.url,{interactive:true,wait:2200})
  const single=join(root,'standalone/atwood-book.html')
  if(existsSync(single)) await inspect('完整自包含单文件 file://',pathToFileURL(single).href,{interactive:true,wait:2200})
  else checks.push({name:'完整自包含单文件 file://',rendered:false,details:{},blockedExternalRequests:[],errors:['standalone/atwood-book.html 不存在']})
  await inspectFigure()
}finally{
  await browser.close();rootServer.server.close();prefixServer.server.close()
}
await mkdir(join(root,'reports'),{recursive:true})
const output=join(root,'reports',baseline?'standalone-baseline.json':'standalone-audit.json')
await writeFile(output,JSON.stringify({date:new Date().toISOString(),environment:'Playwright Chromium; external network blocked; HTTP server serves only dist files',checks},null,2)+'\n')
console.log('Wrote',output)
if(!baseline){
  const required=checks.filter(x=>['离线静态根目录','离线静态子目录','完整自包含单文件 file://'].includes(x.name))
  const figure=checks.find(x=>x.name==='独立 Colorfigures file://')
  if(required.length!==3||required.some(x=>!x.rendered||!x.details.illustration||!x.details.forgedMessagesRejected||!x.details.bidirectionalSelection||x.blockedExternalRequests.length||x.errors.length)||
    !figure?.rendered||!figure.details.poseControls||figure.blockedExternalRequests.length||figure.errors.length)process.exitCode=1
}
