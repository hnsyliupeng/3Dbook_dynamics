// Printable approximation: sample the union of round-capped beam solids, then
// extract its boundary using a conforming six-tetrahedra-per-voxel grid.
// The domain is padded with empty samples, closing the six cut cell faces.
import {add, segCellTranslations} from './geom.mjs';

export function makeDlpMesh(model, {sizeMm=14, radiusMm=.3, tiles=[2,2,1], pitchMm=.2, boundaryFrame=false, progress=()=>{}}={}) {
 if(!Number.isFinite(sizeMm)||sizeMm<10||sizeMm>100)throw Error('单胞边长需为 10–100 mm。');
 if(!Number.isFinite(radiusMm)||radiusMm<.15||radiusMm>2||radiusMm/sizeMm>.08)throw Error('半径需为 0.15–2 mm 且 r/a≤0.08。');
 if(!Array.isArray(tiles)||tiles.length!==3||tiles.some(n=>!Number.isInteger(n)||n<1||n>3)||tiles.reduce((a,b)=>a*b,1)>8)throw Error('阵列每轴为 1–3 且总胞元数≤8。');
 if(!Number.isFinite(pitchMm)||pitchMm<=0)throw Error('采样间距必须为正。');
 const n0=Math.ceil(sizeMm/pitchMm),h=sizeMm/n0;if(h>radiusMm*2/3+1e-12)throw Error('杆径必须至少跨越 3 个实际采样格。');
 const ns=tiles.map(t=>n0*t),[Nx,Ny,Nz]=ns.map(n=>n+2),N=Nx,stride=Nx*Ny,len=Nx*Ny*Nz;
 if(len>3000000)throw Error(`采样网格 ${(len/1e6).toFixed(2)} 百万点超过浏览器上限 3 百万；请增加采样间距、减小阵列或单胞。`);
 const vox=new Uint8Array(len),layerMask=new Uint8Array(len),idx=(x,y,z)=>x+Nx*y+stride*z;
 const pos=i=>(i-.5)*h,rad=radiusMm;
 // Include all periodic images whose finite radii intersect the finite array,
 // unlike the centreline-only display preview. No extra frame is added.
 for(let ei=0;ei<model.edges.length;ei++){
  const e=model.edges[ei],a=model.vertices[e.a].p,b=add(model.vertices[e.b].p,e.o),seenShift=new Set();
  for(const {t} of segCellTranslations(a,b,rad/sizeMm))for(let x=0;x<tiles[0];x++)for(let y=0;y<tiles[1];y++)for(let z=0;z<tiles[2];z++){
   const shift=[t[0]+x,t[1]+y,t[2]+z],key=shift.join(',');if(seenShift.has(key))continue;seenShift.add(key);
   const p=a.map((v,k)=>(v+shift[k])*sizeMm),q=b.map((v,k)=>(v+shift[k])*sizeMm),d=q.map((v,k)=>v-p[k]);
   const d2=d.reduce((s,v)=>s+v*v,0);if(d2<1e-18)continue;
   const lo=p.map((v,k)=>Math.max(1,Math.ceil((Math.min(v,q[k])-rad)/h+.5)));
   const hi=p.map((v,k)=>Math.min(ns[k],Math.floor((Math.max(v,q[k])+rad)/h+.5)));
   for(let zz=lo[2];zz<=hi[2];zz++)for(let yy=lo[1];yy<=hi[1];yy++)for(let xx=lo[0];xx<=hi[0];xx++){
    const dx=pos(xx)-p[0],dy=pos(yy)-p[1],dz=pos(zz)-p[2],u=Math.max(0,Math.min(1,(dx*d[0]+dy*d[1]+dz*d[2])/d2));
    if((dx-u*d[0])**2+(dy-u*d[1])**2+(dz-u*d[2])**2<=rad*rad){const id=idx(xx,yy,zz);vox[id]=1;if(e.kind==='red')layerMask[id]|=1;else if(e.kind==='blue')layerMask[id]|=2;}
   }
  }
  if(ei%250===0)progress(`融合周期杆件 ${ei}/${model.edges.length}`);
 }
 if(boundaryFrame){
  // Optional explicitly disclosed peripheral frame, along the 12 outside edges
  // of the FINITE array. It is an added structural member, not a support mesh.
  for(let axis=0;axis<3;axis++)for(let u=0;u<2;u++)for(let v=0;v<2;v++){
   const other=[0,1,2].filter(k=>k!==axis),p=[0,0,0],q=[0,0,0];p[other[0]]=q[other[0]]=u*tiles[other[0]]*sizeMm;p[other[1]]=q[other[1]]=v*tiles[other[1]]*sizeMm;q[axis]=tiles[axis]*sizeMm;
   const d=q.map((v,k)=>v-p[k]),d2=d.reduce((s,v)=>s+v*v,0),lo=p.map((v,k)=>Math.max(1,Math.ceil((Math.min(v,q[k])-rad)/h+.5))),hi=p.map((v,k)=>Math.min(ns[k],Math.floor((Math.max(v,q[k])+rad)/h+.5)));
   for(let z=lo[2];z<=hi[2];z++)for(let y=lo[1];y<=hi[1];y++)for(let x=lo[0];x<=hi[0];x++){
    const dx=pos(x)-p[0],dy=pos(y)-p[1],dz=pos(z)-p[2],t=Math.max(0,Math.min(1,(dx*d[0]+dy*d[1]+dz*d[2])/d2));if((dx-t*d[0])**2+(dy-t*d[1])**2+(dz-t*d[2])**2<=rad*rad)vox[idx(x,y,z)]=1;
   }
  }
 }
 // Sampling-induced red/blue contacts are rejected, even if the exact
 // centreline check passed. White interlayer braces remain deliberate joints.
 let conflicts=0;for(let i=0;i<len;i++)if(layerMask[i]===3)conflicts++;
 if(conflicts)throw Error(`红蓝层在采样模型中重叠 ${conflicts} 点；导出中止。请缩小半径、改变几何或使用更精细采样。`);
 for(let z=1;z<=ns[2];z++)for(let y=1;y<=ns[1];y++)for(let x=1;x<=ns[0];x++){
  const i=idx(x,y,z);if(layerMask[i]!==1)continue;
  for(let dz=-1;dz<=1;dz++)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(layerMask[idx(x+dx,y+dy,z+dz)]&2)throw Error('红蓝层在采样模型中相邻，可能因体素化桥连；导出中止。请减小杆径或提高采样精度。');
 }
 // Require one face-connected bulk component. This is stricter than merely
 // touching at an edge/corner, which is not a robust printable connection.
 let solid=0,first=-1;for(let i=0;i<len;i++)if(vox[i]){solid++;if(first<0)first=i;}
 if(first<0)throw Error('未生成实体，请检查参数。');
 const seen=new Uint8Array(len),queue=new Int32Array(solid);let head=0,tail=0;queue[tail++]=first;seen[first]=1;
 while(head<tail){const p=queue[head++];for(const d of [1,-1,N,-N,stride,-stride]){const q=p+d;if(q>=0&&q<len&&vox[q]&&!seen[q]){seen[q]=1;queue[tail++]=q;}}}
 if(tail!==solid){const counts=[tail];for(let i=0;i<len;i++)if(vox[i]&&!seen[i]){head=0;tail=0;queue[tail++]=i;seen[i]=1;while(head<tail){const p=queue[head++];for(const d of [1,-1,N,-N,stride,-stride]){const q=p+d;if(q>=0&&q<len&&vox[q]&&!seen[q]){seen[q]=1;queue[tail++]=q}}}counts.push(tail)}counts.sort((a,b)=>b-a);throw Error(`导出中止：有限阵列实体有 ${counts.length} 个分量（最大 ${counts[0]} 点，其余 ${(solid-counts[0])} 点）；周期连通不等于有限边界连通。`)}
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
  if(count>=1800000)throw Error('三角面过多，超过浏览器安全上限；请降低阵列规模。');
  if(count===capacity){capacity*=2;const next=new ArrayBuffer(84+50*capacity);new Uint8Array(next).set(new Uint8Array(buffer));buffer=next;view=new DataView(buffer)}
  let off=84+50*count++;const mag=Math.hypot(...normal);for(const val of [...normal.map(x=>x/mag),...p,...q,...r]){view.setFloat32(off,val,true);off+=4;}view.setUint16(off,0,true);
 }
 const corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
 const tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 for(let z=0;z<Nz-1;z++){
  for(let y=0;y<Ny-1;y++)for(let x=0;x<Nx-1;x++){
   const ids=corners.map(c=>idx(x+c[0],y+c[1],z+c[2]));let mask=0;for(let k=0;k<8;k++)mask+=vox[ids[k]];if(!mask||mask===8)continue;
   for(const tet of tets){const inside=tet.map(i=>ids[i]).filter(i=>vox[i]),outside=tet.map(i=>ids[i]).filter(i=>!vox[i]);if(!inside.length||!outside.length)continue;
    const centroid=arr=>arr.map(pcoords).reduce((a,p)=>a.map((v,k)=>v+p[k]/arr.length),[0,0,0]);const ci=centroid(inside),co=centroid(outside),dir=co.map((v,k)=>v-ci[k]);
    if(inside.length===1){triangle(...outside.map(o=>vertex(inside[0],o)),dir)}
    else if(outside.length===1){triangle(...inside.map(i=>vertex(i,outside[0])),dir)}
    else{const [i,j]=inside,[k,l]=outside;const a=vertex(i,k),b=vertex(i,l),c=vertex(j,l),d=vertex(j,k);triangle(a,b,c,dir);triangle(a,c,d,dir)}
   }
  }
  if(z%16===0)progress(`生成三角网格 ${Math.round(z/(Nz-1)*100)}%`);
 }
 let bad=0;for(const [c,o] of edgeMap.values())if(c!==2||o!==0)bad++;
 if(bad)throw Error(`导出中止：网格存在 ${bad} 条非封闭或方向错误的边。`);
 view.setUint32(80,count,true);return {buffer:buffer.slice(0,84+count*50),report:{sizeMm,radiusMm,tiles,pitchMm:h,triangles:count,vertices:verts.length,connectedVoxelComponents:1,badEdges:bad,occupiedSamples:solid,redBlueVoxelOverlap:conflicts,addedFrame:boundaryFrame}};
}
