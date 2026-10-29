import {readFile,writeFile} from 'node:fs/promises';
import {LESSONS} from '../app/src/lessons.js';
const catalog=JSON.parse(await readFile('app/data/source-catalog.json','utf8'));
const pagonis=JSON.parse(await readFile('app/data/pagonis-catalog.json','utf8'));
const repositories={aldotb:{...catalog,repository:'aldotb/Solve-classic-mechanics-problems-with-python'},pagonis};
const mapping=new Map();
for(const lesson of LESSONS)for(const source of lesson.sources){
  const key=`${source.repo||'aldotb'}::${source.file}`;
  if(!mapping.has(key))mapping.set(key,[]);mapping.get(key).push({lesson,source});
}
const sections={'01':'矢量','02':'运动学','03':'静力学','04':'刚体与摩擦','05':'动力学','06':'质心与惯量','07':'功与能量'};
const order=['01','03','04','02','05','07','06'];
const link=(repo,file)=>`https://github.com/${repo.repository}/blob/${repo.commit}/${file.split('/').map(encodeURIComponent).join('/')}`;
function lessonList(items){return items.map(({lesson,source})=>`[${lesson.title}](../cases/${lesson.id}.html)（单元 ${source.cells.join(', ')}）`).join('；');}
const lookup=nb=>mapping.get(`aldotb::${nb.file}`)||[];
const linked=catalog.notebooks.filter(nb=>lookup(nb).length).length;
let out=`# 第一来源覆盖清单（按 Notebook）\n\n源仓库：[${repositories.aldotb.repository}](https://github.com/${repositories.aldotb.repository})，固定提交 \`${catalog.commit}\`。\n\n当前共 **${LESSONS.length} 个综合演示**，本来源的 **${linked}/${catalog.notebooks.length} 个 Notebook** 至少有部分单元与演示关联。关联不是整本完成；同一 Notebook 可能还有其他未实施例题。同类原题可共享综合演示，源题与代码不一致时以每个演示的“查看来源”说明为准。第二来源见 [Pagonis 覆盖清单](pagonis-coverage.md)。\n\n`;
for(const prefix of order){
  out+=`## ${sections[prefix]}（${prefix}）\n\n| 原 Notebook | 状态 | 已关联的演示与零基单元索引 |\n|---|---|---|\n`;
  for(const nb of catalog.notebooks.filter(n=>n.file.startsWith(prefix))){const m=lookup(nb);out+=`| [${nb.file}](${link(repositories.aldotb,nb.file)}) | ${m.length?'部分关联':'待核对 / 实施'} | ${m.length?lessonList(m):'—'} |\n`;}
  out+='\n';
}
await writeFile('docs/source-coverage.md',out.trimEnd()+'\n');
const lookupP=nb=>mapping.get(`pagonis::${nb.file}`)||[];
const linkedP=pagonis.notebooks.filter(nb=>lookupP(nb).length).length;
let outP=`# 第二来源覆盖清单（Pagonis）\n\n源仓库：[${pagonis.repository}](https://github.com/${pagonis.repository})，固定提交 \`${pagonis.commit}\`。该仓库是 *Classical Mechanics: A Computational Approach* 第二版的配套代码；GitHub 元数据和仓库根目录未显示许可证。这里仅保存文件/单元元数据和指向固定提交的链接，并未复制 Notebook 内容。\n\n**${pagonis.notebooks.length} 个 Python / Jupyter Notebook、${pagonis.mathematica.length} 个 Mathematica 文件**均列出。当前 **${linkedP}/${pagonis.notebooks.length} 个 Python Notebook** 至少部分关联；覆盖的是列出的单元，**不是整章或整库**。这些 Notebook 的 cell 未提供 ID，所以下列索引均为从 0 开始的原始序号，JSON 中 cell ID 为 null，不会伪造。许多示例只有编号和代码、没有完整书面题干；页面明确标注哪些条件可由代码确认、哪些场景是教学示意。\n\n## Python / Jupyter\n\n| 原文件 | 状态 | 已关联的演示与零基单元索引 |\n|---|---|---|\n`;
for(const nb of pagonis.notebooks){const m=lookupP(nb);outP+=`| [${nb.file}](${link(pagonis,nb.file)}) | ${m.length?'部分关联':'待核对 / 实施'} | ${m.length?lessonList(m):'—'} |\n`;}
outP+=`\n## Mathematica（待解析）\n\n以下文件目前仅列为来源，不因 Python 同章节有链接而标记为已覆盖。\n\n| 原文件 | 状态 |\n|---|---|\n`;
for(const nb of pagonis.mathematica)outP+=`| [${nb.file}](${link(pagonis,nb.file)}) | 待解析 / 核对 |\n`;
await writeFile('docs/pagonis-coverage.md',outP.trimEnd()+'\n');
console.log(`Coverage: aldotb ${linked}/${catalog.notebooks.length}; Pagonis Python ${linkedP}/${pagonis.notebooks.length}; Mathematica ${pagonis.mathematica.length} unparsed`);
