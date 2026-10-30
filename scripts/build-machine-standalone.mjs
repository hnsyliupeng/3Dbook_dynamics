#!/usr/bin/env node
/** Bundle the genuine Machine kit and pinned Three for an offline file:// demo.
 * The standalone demo has its own simulation; the book uses MachineSkillAdapter
 * and its shared state instead. The vendor licences are in .claude/skills/machine
 * and licenses/. */
import { build } from 'esbuild'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const source=await readFile('content/skill-src/atwood-machine-uninlined.html','utf8')
const bundled=await build({entryPoints:['.claude/skills/machine/kit/lab-kit.js'],bundle:true,write:false,
  platform:'browser',format:'iife',target:['es2020'],minify:true,legalComments:'inline'})
const kit=bundled.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')
const out=source.replace(/<!-- lab-kit:start -->[\s\S]*?<!-- lab-kit:end -->/,
  () => `<!-- Machine Skill MIT; Three.js MIT. See licenses/. -->\n<script>${kit}</script>`)
await writeFile(resolve('public/skill-artifacts/atwood-machine-standalone.html'),out)
console.log('Wrote public/skill-artifacts/atwood-machine-standalone.html (offline bundle)')
