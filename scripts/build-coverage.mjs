import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { LESSONS } from '../app/src/lessons.js';

const catalog=JSON.parse(await readFile('app/data/source-catalog.json','utf8'));
const groups=[['01','矢量'],['03','静力学'],['04','刚体与摩擦'],['02','运动学'],['05','动力学'],['07','功与能'],['06','质心与惯量']];
const lookup=new Map();
for(const lesson of LESSONS) for(const source of lesson.sources){
  if(!lookup.has(source.file))lookup.set(source.file,{cases:[],cells:new Set()});
  const entry=lookup.get(source.file);if(!entry.cases.some(x=>x.id===lesson.id))entry.cases.push(lesson);
  source.cells.forEach(i=>entry.cells.add(i));
}
const base=`https://github.com/aldotb/Solve-classic-mechanics-problems-with-python/blob/${catalog.commit}/`;
let out=`# 上游 Notebook 关联清单\n\n> 范围说明：本表只跟踪已实现案例明确引用的源单元，**不是逐题完成清单**。\n> 目前有 ${LESSONS.length} 个综合演示，关联 ${lookup.size}/${catalog.notebooks.length} 个 Notebook 的部分单元；未关联文件以及已关联文件中的其他题目仍须逐题核对。理论说明或 API 教程也列入目录，不自动视为题目。\n\n源仓固定提交：\`${catalog.commit}\`。单元序号为零基索引，具体单元和 cell ID 可在每个案例的“查看来源与说明”中查看。\n\n`;
for(const [prefix,title] of groups){
  out+=`## ${title}\n\n| 源 Notebook | 关联状态 | 明确引用的单元数 | 关联演示 |\n| --- | --- | ---: | --- |\n`;
  for(const nb of catalog.notebooks.filter(n=>n.file.startsWith(prefix))){
    const entry=lookup.get(nb.file),url=base+encodeURIComponent(nb.file);
    const cases=entry?entry.cases.map(l=>`[${l.title}](../cases/${l.id}.html)`).join('、'):'—';
    out+=`| [${nb.file}](${url}) | ${entry?'部分关联':'待逐题核对'} | ${entry?.cells.size||0} / ${nb.cellCount} | ${cases} |\n`;
  }
  out+='\n';
}
await mkdir('docs',{recursive:true});await writeFile('docs/source-coverage.md',out.trimEnd()+'\n');
console.log(`Documented ${lookup.size}/${catalog.notebooks.length} partially linked notebooks.`);
