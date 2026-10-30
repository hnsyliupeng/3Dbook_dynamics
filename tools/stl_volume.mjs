// Signed volume for a consistently oriented binary STL. This does not prove watertightness.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path=process.argv[2];if(!path)throw Error('Usage: node tools/stl_volume.mjs model.stl');
const data=readFileSync(path),count=data.readUInt32LE(80);if(data.length!==84+50*count)throw Error('Invalid binary STL length');
let v6=0,min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
for(let i=0;i<count;i++){const off=84+50*i+12,p=[];for(let j=0;j<3;j++){const q=[];for(let k=0;k<3;k++){const x=data.readFloatLE(off+12*j+4*k);q.push(x);min[k]=Math.min(min[k],x);max[k]=Math.max(max[k],x);}p.push(q);}const [a,b,c]=p;v6+=a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]);}
const boundsMm=max.map((v,i)=>v-min[i]),v=v6/6,box=boundsMm.reduce((a,b)=>a*b,1);
console.log(JSON.stringify({file:path,sha256:createHash('sha256').update(data).digest('hex'),triangles:count,boundsMm,signedVolumeMm3:v,boxVolumeMm3:box,relativeVolume:v/box,note:'Oriented mesh volume; does not verify mesh watertightness; no material mass or mechanical properties implied.'},null,2));
