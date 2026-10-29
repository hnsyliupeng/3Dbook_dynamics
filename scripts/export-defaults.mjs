import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {LESSONS,TAG_COLORS} from '../app/src/lessons.js';
import {createModel,defaultParameters} from '../app/src/models.js';
const catalog=JSON.parse(await readFile('app/data/source-catalog.json','utf8'));
const pagonis=JSON.parse(await readFile('app/data/pagonis-catalog.json','utf8'));
const repos={aldotb:{...catalog,repository:'aldotb/Solve-classic-mechanics-problems-with-python'},pagonis};
await mkdir('data/cases',{recursive:true});
for(const lesson of LESSONS){
  const parameters=defaultParameters(lesson),preset=lesson.presets?.[0].id||'abc',model=createModel(lesson,parameters,preset);
  const sources=lesson.sources.map(s=>{const repo=repos[s.repo||'aldotb'];return {...s,repository:repo.repository,commit:repo.commit,cellIds:s.cells.map(i=>repo.notebooks.find(n=>n.file===s.file).cells[i].id)};});
  const result={version:1,caseId:lesson.id,title:lesson.title,question:lesson.question,assumptions:lesson.provenance,sourceCommit:catalog.commit,sourceCommits:Object.fromEntries(Object.entries(repos).map(([k,v])=>[k,v.commit])),sources,parameters,preset,duration:model.duration,clock:model.clock,timeUnit:model.timeUnit,events:model.events,colorMap:TAG_COLORS,
    derivationScript:lesson.steps.map((s,i)=>({...s,stepId:String(i+1),tStart:model.duration*model.stepBounds[i],tEnd:model.duration*model.stepBounds[i+1],highlight:s.tags,visual:{highlightObjects:s.tags}})),
    timeSeries:Array.from({length:241},(_,i)=>model.sample(i/240))};
  // Keep the metadata readable while storing each deterministic sample on one
  // line. This avoids duplicating megabytes of indentation across 36 files.
  const {timeSeries,...metadata}=result;
  const json=JSON.stringify(metadata,null,2).replace(/\n}$/, '')+',\n  "timeSeries": [\n'+timeSeries.map(state=>'    '+JSON.stringify(state)).join(',\n')+'\n  ]\n}\n';
  await writeFile(`data/cases/${lesson.id}.json`,json);
}
console.log(`Exported ${LESSONS.length} default models with 241 deterministic samples each.`);
