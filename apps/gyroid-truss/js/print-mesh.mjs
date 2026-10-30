// Printable approximation: sample the union of round-capped beam solids, then
// extract its boundary using a conforming six-tetrahedra-per-voxel grid.
// The domain is padded with empty samples, closing the six cut cell faces.
import {add, segCellTranslations} from './geom.mjs';

export function makePrintMesh(model, {sizeMm=40, diameterMm=1.4, pitchMm=.4, progress=()=>{}}={}) {
 if (!Number.isFinite(sizeMm) || sizeMm<40 || sizeMm>60) throw Error('单胞边长需在 40–60 mm 范围内。');
 if (!Number.isFinite(diameterMm) || diameterMm<1.2 || diameterMm>3) throw Error('杆径需在 1.2–3.0 mm 范围内。');
 const n=Math.ceil(sizeMm/pitchMm), h=sizeMm/n, N=n+2, stride=N*N, len=N*N*N;
 const vox=new Uint8Array(len), idx=(x,y,z)=>x+N*y+stride*z;
 const pos=i=>(i-.5)*h, rad=diameterMm/2;
 // Cells with centres inside the unit cube only. Include periodic images so
 // that paired exterior faces are sampled from the same periodic geometry.
 // Add a permanent 12-edge cube frame to join pieces exposed by the finite
 // cut. This changes the graph and MUST be reported; it is not the FE model.
 const vertices=model.vertices.map(v=>v.p), edges=model.edges.map(e=>({a:e.a,b:e.b,o:e.o}));
 const base=vertices.length;
 for(let z=0;z<2;z++)for(let y=0;y<2;y++)for(let x=0;x<2;x++)vertices.push([x,y,z]);
 for(let z=0;z<2;z++)for(let y=0;y<2;y++)for(let x=0;x<2;x++)for(let axis=0;axis<3;axis++){
  const p=[x,y,z];if(p[axis])continue;const q=p.slice();q[axis]=1;
  edges.push({a:base+x+2*y+4*z,b:base+q[0]+2*q[1]+4*q[2],o:[0,0,0]});
 }
 for(let ei=0;ei<edges.length;ei++){
  const e=edges[ei], a=vertices[e.a], b=add(vertices[e.b],e.o);
  for(const {t} of segCellTranslations(a,b,rad/sizeMm)){
   const p=a.map((v,k)=>(v+t[k])*sizeMm), q=b.map((v,k)=>(v+t[k])*sizeMm), d=q.map((v,k)=>v-p[k]);
   const d2=d.reduce((s,v)=>s+v*v,0); if(d2<1e-18)continue;
   const lo=p.map((v,k)=>Math.max(1,Math.ceil((Math.min(v,q[k])-rad)/h+.5)));
   const hi=p.map((v,k)=>Math.min(n,Math.floor((Math.max(v,q[k])+rad)/h+.5)));
   for(let z=lo[2];z<=hi[2];z++)for(let y=lo[1];y<=hi[1];y++)for(let x=lo[0];x<=hi[0];x++){
    const dx=pos(x)-p[0],dy=pos(y)-p[1],dz=pos(z)-p[2];
    const u=Math.max(0,Math.min(1,(dx*d[0]+dy*d[1]+dz*d[2])/d2));
    if((dx-u*d[0])**2+(dy-u*d[1])**2+(dz-u*d[2])**2<=rad*rad)vox[idx(x,y,z)]=1;
   }
  }
  if(ei%250===0)progress(`融合杆件 ${ei}/${edges.length}`);
 }
 // Require one face-connected bulk component. This is stricter than merely
 // touching at an edge/corner, which is not a robust printable connection.
 let solid=0,first=-1;for(let i=0;i<len;i++)if(vox[i]){solid++;if(first<0)first=i;}
 if(first<0)throw Error('未生成实体，请检查参数。');
 const seen=new Uint8Array(len),queue=new Int32Array(solid);let head=0,tail=0;queue[tail++]=first;seen[first]=1;
 while(head<tail){const p=queue[head++];for(const d of [1,-1,N,-N,stride,-stride]){const q=p+d;if(q>=0&&q<len&&vox[q]&&!seen[q]){seen[q]=1;queue[tail++]=q;}}}
 if(tail!==solid)throw Error(`导出中止：实体存在未融合部分（${solid-tail} 个采样点未连接）。请增大杆径。`);
 progress('生成闭合三角网格并检查拓扑…');
 // Vertex crossings are shared by endpoint pair. Orient each triangle away
 // from occupied samples; audit each mesh edge for two opposite incidences.
 const verts=[],vertexMap=new Map(),edgeMap=new Map();let capacity=1024*1024, buffer=new ArrayBuffer(84+50*capacity),view=new DataView(buffer),count=0;
 const pcoords=id=>{const z=Math.floor(id/stride),rem=id-z*stride,y=Math.floor(rem/N),x=rem-y*N;return [pos(x),pos(y),pos(z)];};
 function vertex(a,b){if(a>b)[a,b]=[b,a];const key=a*len+b;let id=vertexMap.get(key);if(id!==undefined)return id;const p=pcoords(a),q=pcoords(b);id=verts.length;verts.push([(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2]);vertexMap.set(key,id);return id;}
 function triangle(a,b,c,dir){
  let p=verts[a],q=verts[b],r=verts[c];let u=q.map((v,k)=>v-p[k]),v=r.map((v,k)=>v-p[k]);
  let normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  if(normal.reduce((s,v,k)=>s+v*dir[k],0)<0){[b,c]=[c,b];[q,r]=[r,q];normal=normal.map(v=>-v)}
  for(const [i,j] of [[a,b],[b,c],[c,a]]){const lo=Math.min(i,j),hi=Math.max(i,j),key=lo+','+hi,old=edgeMap.get(key)||[0,0];old[0]++;old[1]+=i===lo?1:-1;edgeMap.set(key,old);}
  if(count===capacity){capacity*=2;const next=new ArrayBuffer(84+50*capacity);new Uint8Array(next).set(new Uint8Array(buffer));buffer=next;view=new DataView(buffer)}
  let off=84+50*count++;const mag=Math.hypot(...normal);for(const val of [...normal.map(x=>x/mag),...p,...q,...r]){view.setFloat32(off,val,true);off+=4;}view.setUint16(off,0,true);
 }
 const corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
 const tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 for(let z=0;z<N-1;z++){
  for(let y=0;y<N-1;y++)for(let x=0;x<N-1;x++){
   const ids=corners.map(c=>idx(x+c[0],y+c[1],z+c[2]));let mask=0;for(let k=0;k<8;k++)mask+=vox[ids[k]];if(!mask||mask===8)continue;
   for(const tet of tets){const inside=tet.map(i=>ids[i]).filter(i=>vox[i]),outside=tet.map(i=>ids[i]).filter(i=>!vox[i]);if(!inside.length||!outside.length)continue;
    const centroid=arr=>arr.map(pcoords).reduce((a,p)=>a.map((v,k)=>v+p[k]/arr.length),[0,0,0]);const ci=centroid(inside),co=centroid(outside),dir=co.map((v,k)=>v-ci[k]);
    if(inside.length===1){triangle(...outside.map(o=>vertex(inside[0],o)),dir)}
    else if(outside.length===1){triangle(...inside.map(i=>vertex(i,outside[0])),dir)}
    else{const [i,j]=inside,[k,l]=outside;const a=vertex(i,k),b=vertex(i,l),c=vertex(j,l),d=vertex(j,k);triangle(a,b,c,dir);triangle(a,c,d,dir)}
   }
  }
  if(z%16===0)progress(`生成三角网格 ${Math.round(z/(N-1)*100)}%`);
 }
 let bad=0;for(const [c,o] of edgeMap.values())if(c!==2||o!==0)bad++;
 if(bad)throw Error(`导出中止：网格存在 ${bad} 条非封闭或方向错误的边。`);
 view.setUint32(80,count,true);return {buffer:buffer.slice(0,84+count*50),report:{sizeMm,diameterMm,pitchMm:h,triangles:count,vertices:verts.length,connectedVoxelComponents:1,badEdges:bad,occupiedSamples:solid}};
}
