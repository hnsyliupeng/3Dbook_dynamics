// Keep generated visual evidence small enough to distribute in Git, while
// preserving dimensions and legibility. Source figures and GIFs are untouched.
import {readdir,readFile,writeFile,rename,unlink,stat} from 'node:fs/promises';
import {join,dirname,basename} from 'node:path';
import {spawn} from 'node:child_process';

async function pngs(root){
  const result=[];
  for(const item of await readdir(root,{withFileTypes:true})){
    const path=join(root,item.name);
    if(item.isDirectory())result.push(...await pngs(path));
    else if(item.isFile()&&item.name.endsWith('.png'))result.push(path);
  }
  return result;
}
function convert(file,tmp){return new Promise((resolve,reject)=>{
  const child=spawn('convert',[file,'-strip','+dither','-colors','256','-define','png:compression-level=9',`PNG8:${tmp}`],{stdio:['ignore','ignore','pipe']});
  let errors='';child.stderr.on('data',s=>errors+=s);child.on('error',reject);
  child.on('close',code=>code===0?resolve():reject(new Error(`Screenshot compression failed: ${file}: ${errors}`)));
});}
const files=await pngs('docs/qa');
let index=0,before=0,after=0,changed=0;
async function worker(){
  for(;;){
    const i=index++;if(i>=files.length)return;
    const file=files[i],tmp=join(dirname(file),`.${basename(file)}.compact.png`);
    const original=(await stat(file)).size;
    try{
      await convert(file,tmp);
      const optimized=(await stat(tmp)).size;
      if(optimized<original){await rename(tmp,file);after+=optimized;changed++;}
      else{await unlink(tmp);after+=original;}
      before+=original;
    }catch(error){await unlink(tmp).catch(()=>{});throw error;}
  }
}
await Promise.all(Array.from({length:4},worker));
const reportPath='docs/qa/report.json',report=JSON.parse(await readFile(reportPath,'utf8'));
report.screenshotOptimization={fileCount:files.length,format:'PNG: up to 256 indexed colors, no dithering',note:'Only generated GUI screenshots are palette-optimized; source figures and animated GIFs are unchanged.'};
await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
const readmePath='docs/qa/README.md';let readme=await readFile(readmePath,'utf8');
const note='GUI 截图为最多 256 色的索引 PNG（无抖动），尺寸不变；原始题图和动画 GIF 未处理。';
if(!readme.includes(note))await writeFile(readmePath,readme.trimEnd()+'\n\n'+note+'\n');
console.log(`Optimized ${changed}/${files.length} GUI screenshots: ${(before/1048576).toFixed(1)} → ${(after/1048576).toFixed(1)} MiB.`);
