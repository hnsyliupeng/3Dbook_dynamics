#!/usr/bin/env node
/** Build ONE offline book HTML, including JS, CSS, fonts and the embedded Skill figure.
 * No external scripts, CDN, backend or runtime build tool are required. */
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const out=join(root,'standalone'), temp=join(out,'.build')
await mkdir(out,{recursive:true})
await build({configFile:false,root,base:'./',plugins:[react()],logLevel:'warn',
  build:{outDir:temp,emptyOutDir:true,assetsInlineLimit:12*1024*1024,cssCodeSplit:false,
    rollupOptions:{input:join(root,'index.html'),output:{codeSplitting:false}}}})
let html=await readFile(join(temp,'index.html'),'utf8')
const script=html.match(/<script\s+type="module"[^>]*\ssrc="([^"]+)"[^>]*><\/script>/)
const style=html.match(/<link\s+rel="stylesheet"[^>]*\shref="([^"]+)"[^>]*>/)
if(!script||!style||html.includes('rel="modulepreload"')) throw new Error('Expected one inlinable script and stylesheet; inspect Vite output.')
const js=await readFile(resolve(temp,script[1]),'utf8'), css=await readFile(resolve(temp,style[1]),'utf8')
if(/\bimport\s*\(/.test(js)) throw new Error('Unexpected dynamic import; cannot promise an offline single file.')
if(/url\(["']?(?!data:|#)/.test(css)) throw new Error('Stylesheet still references a non-inlined asset.')
const figure=await readFile(join(root,'public/skill-artifacts/atwood-colorfigures.html'),'utf8')
const safeJson=JSON.stringify(figure).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')
html=html.replace(style[0],()=>`<style>\n${css.replace(/<\/style/gi,'<\\/style')}\n</style>`)
html=html.replace(script[0],()=>`<script>window.__MECHANICS_EMBEDDED_COLORFIGURE__=${safeJson};</script>\n<script type="module">\n${js.replace(/<\/script/gi,'<\\/script')}\n</script>`)
const noticePaths=[
  ['Original textbook CC BY-NC-SA 4.0','licenses/COURSE-CC-BY-NC-SA-4.0.txt'],
  ['Machine Skill MIT','.claude/skills/machine/LICENSE'],['Colorfigures MIT','.claude/skills/colorfigures/LICENSE'],
  ['Three.js MIT','node_modules/three/LICENSE'],['KaTeX MIT','node_modules/katex/LICENSE'],
  ['React MIT','node_modules/react/LICENSE'],['React DOM MIT','node_modules/react-dom/LICENSE'],
  ['Lucide ISC','node_modules/lucide-react/LICENSE'],
  ['DM Sans OFL','licenses/FONT-DM-SANS-OFL.txt'],['Instrument Serif OFL','licenses/FONT-INSTRUMENT-SERIF-OFL.txt'],
  ['IBM Plex Mono OFL','licenses/FONT-IBM-PLEX-MONO-OFL.txt'],['Noto Sans SC OFL','licenses/FONT-NOTO-SANS-SC-OFL.txt'],
]
let notice='Adapted from Computational Analytical Mechanics, Víctor A. Bettachini / Universidad Nacional de La Matanza.\nSource commit 387f2df07e70ba3bdff2c66460c04f6ae6ba2055; adapted model and Chinese interactive presentation.\nhttps://github.com/unlam/ComputationalAnalyticalMechanics · https://creativecommons.org/licenses/by-nc-sa/4.0/\n'
for(const [label,path] of noticePaths) notice+=`\n${label}\n${await readFile(join(root,path),'utf8')}\n`
// HTML comments must not contain a double hyphen.
html=html.replace('<!doctype html>',`<!doctype html>\n<!--\n${notice.replace(/--/g,'- -')}\n-->`)
const file=join(out,'atwood-book.html')
await writeFile(file,html)
console.log(`Wrote ${file} (${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MiB).`)
