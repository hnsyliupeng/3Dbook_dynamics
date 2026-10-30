// Approximate, single-surface union of capsule centreline rods, for display only.
// Surface nets on a bounded scalar grid; not an export mesh or mechanical model.
export function buildUnionPreview(lists,tiles,radius,{longestCells=144}={}){
 const h=Math.max(...tiles)/longestCells, sizes=tiles.map(v=>Math.round(v/h)+3),[nx,ny,nz]=sizes, stride=nx*ny,total=nx*ny*nz;
 const idx=(x,y,z)=>x+nx*y+stride*z,coord=i=>(i-1)*h, dist=new Float32Array(total),kind=new Uint8Array(total);dist.fill(Infinity);
 const labels={red:1,blue:2,cross:3},pad=radius+2*h;
 for(const [name,pairs] of Object.entries(lists))for(const [a,b] of pairs){
  const d=b.map((v,k)=>v-a[k]),dd=d.reduce((s,v)=>s+v*v,0);if(dd<1e-20)continue;
  const low=a.map((v,k)=>Math.max(0,Math.ceil((Math.min(v,b[k])-pad)/h+1))),high=a.map((v,k)=>Math.min(sizes[k]-1,Math.floor((Math.max(v,b[k])+pad)/h+1)));
  for(let z=low[2];z<=high[2];z++)for(let y=low[1];y<=high[1];y++)for(let x=low[0];x<=high[0];x++){
   const dx=coord(x)-a[0],dy=coord(y)-a[1],dz=coord(z)-a[2],t=Math.max(0,Math.min(1,(dx*d[0]+dy*d[1]+dz*d[2])/dd));
   const v=Math.hypot(dx-t*d[0],dy-t*d[1],dz-t*d[2])-radius,j=idx(x,y,z);
   if(v<dist[j]){dist[j]=v;kind[j]=labels[name];}
  }
 }
 // Intersect field with the outer reference window; positive on its boundary.
 // The resulting visual caps are approximate and do not certify a closed mesh.
 for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  const j=idx(x,y,z),px=coord(x),py=coord(y),pz=coord(z);
  dist[j]=Math.max(dist[j],-px,px-tiles[0],-py,py-tiles[1],-pz,pz-tiles[2],-1e8);
  if(x===1||y===1||z===1||x===nx-2||y===ny-2||z===nz-2)dist[j]=Math.max(dist[j],h*1e-5);
 }
 const vertices=[],colors=[],cells=new Int32Array(total);cells.fill(-1);
 const corner=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],palette=[[.6,.65,.6],[.68,.24,.23],[.22,.42,.67],[.88,.88,.84]];
 for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
  const ids=corner.map(c=>idx(x+c[0],y+c[1],z+c[2]));let inside=0;for(const i of ids)inside+=dist[i]<0?1:0;if(!inside||inside===8)continue;
  let px=0,py=0,pz=0,count=0,best=Infinity,label=0;
  for(const [u,v] of edges){const p=ids[u],q=ids[v],f=dist[p],g=dist[q];if((f<0)===(g<0))continue;
   // Infinity may occur beyond a capsule's local bounding box.
   const t=!Number.isFinite(f)?1:!Number.isFinite(g)?0:f/(f-g),ca=corner[u],cb=corner[v];
   px+=coord(x+ca[0]+t*(cb[0]-ca[0]));py+=coord(y+ca[1]+t*(cb[1]-ca[1]));pz+=coord(z+ca[2]+t*(cb[2]-ca[2]));count++;
   const id=f<0?p:q;if(dist[id]<best){best=dist[id];label=kind[id]}
  }
  if(!count)continue;cells[idx(x,y,z)]=vertices.length/3;vertices.push(px/count,py/count,pz/count);colors.push(...palette[label]);
 }
 const triangles=[];
 function quad(ids,axis,sign){if(ids.some(i=>i<0))return;const [a,b,c,d]=ids,pa=vertices.slice(a*3,a*3+3),pb=vertices.slice(b*3,b*3+3),pc=vertices.slice(c*3,c*3+3),u=pb.map((v,k)=>v-pa[k]),v=pc.map((v,k)=>v-pa[k]);const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];if(normal[axis]*sign>=0)triangles.push(a,b,c,a,c,d);else triangles.push(a,c,b,a,d,c);}
 for(let z=1;z<nz-1;z++)for(let y=1;y<ny-1;y++)for(let x=1;x<nx-1;x++){
  const f=dist[idx(x,y,z)];
  if(x<nx-1){const g=dist[idx(x+1,y,z)];if((f<0)!==(g<0))quad([cells[idx(x,y-1,z-1)],cells[idx(x,y,z-1)],cells[idx(x,y,z)],cells[idx(x,y-1,z)]],0,f<0?1:-1)}
  if(y<ny-1){const g=dist[idx(x,y+1,z)];if((f<0)!==(g<0))quad([cells[idx(x-1,y,z-1)],cells[idx(x-1,y,z)],cells[idx(x,y,z)],cells[idx(x,y,z-1)]],1,f<0?1:-1)}
  if(z<nz-1){const g=dist[idx(x,y,z+1)];if((f<0)!==(g<0))quad([cells[idx(x-1,y-1,z)],cells[idx(x,y-1,z)],cells[idx(x,y,z)],cells[idx(x-1,y,z)]],2,f<0?1:-1)}
 }
 return {positions:new Float32Array(vertices),colors:new Float32Array(colors),indices:new Uint32Array(triangles),pitch:h,diameterSamples:2*radius/h};
}
