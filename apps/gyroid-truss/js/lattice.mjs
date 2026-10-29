// Lattice validation on the periodic graph, not on pixels or the rendered mesh.
import {add,sub,scale,segCellTranslations} from './geom.mjs';
import {F} from './gyroid.mjs';

const mod=(x,n)=>((x%n)+n)%n;

// Build a periodic n×n×n supercell graph using each edge's integer image offset.
// Quotient identifies opposite outer faces; it is not a free-boundary specimen.
export function supercellConnectivity(model,n,kind='all'){
 if(!Number.isInteger(n)||n<1||n>8)throw Error('n must be an integer 1..8');
 const {vertices,edges}=model, V=vertices.length, total=V*n*n*n;
 const parent=new Int32Array(total),size=new Int32Array(total),active=new Uint8Array(total);
 for(let i=0;i<total;i++){parent[i]=i;size[i]=1}
 const cell=(x,y,z)=>((x*n+y)*n+z)*V;
 function find(i){while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i]}return i}
 function join(a,b){a=find(a);b=find(b);if(a===b)return;if(size[a]<size[b])[a,b]=[b,a];parent[b]=a;size[a]+=size[b]}
 let edgeCount=0,wrappedEdges=0;
 for(let x=0;x<n;x++)for(let y=0;y<n;y++)for(let z=0;z<n;z++)for(const e of edges){
  if(kind!=='all' && e.kind!==kind)continue;
  const c=[x+e.o[0],y+e.o[1],z+e.o[2]];
  if(c.some(v=>v<0||v>=n))wrappedEdges++;
  const a=cell(x,y,z)+e.a,b=cell(mod(c[0],n),mod(c[1],n),mod(c[2],n))+e.b;
  active[a]=active[b]=1;join(a,b);edgeCount++;
 }
 const counts=new Map();let activeVertices=0;
 for(let i=0;i<total;i++)if(active[i]){activeVertices++;const root=find(i);counts.set(root,(counts.get(root)||0)+1)}
 const components=[...counts.values()].sort((a,b)=>b-a);
 return {n,kind,activeVertices,edgeCount,wrappedEdges,componentCount:components.length,largestComponent:components[0]||0,isolatedVertices:total-activeVertices};
}

// Geometry of cut centreline points and face-coincident segments. Per-kind sets
// are compared after translating the + face onto the - face. This checks geometry,
// not incidence multiplicity, rod solids, or the full 3D geometry between faces.
export function faceSignatures(model,tolerance=1e-7){
 const result=Array.from({length:3},()=>Array.from({length:2},()=>({points:new Set(),segments:new Set()})));
 const quant=x=>Math.round(x/tolerance);
 for(const e of model.edges){
  const a=model.vertices[e.a].p,b=add(model.vertices[e.b].p,e.o),dir=sub(b,a);
  for(const {t,r} of segCellTranslations(a,b)){
   if(r[1]-r[0]<1e-10)continue;
   const p=add(add(a,t),scale(dir,r[0])),q=add(add(a,t),scale(dir,r[1]));
   for(let axis=0;axis<3;axis++)for(let face=0;face<2;face++){
    const onP=Math.abs(p[axis]-face)<1e-8,onQ=Math.abs(q[axis]-face)<1e-8;
    if(!onP&&!onQ)continue;
    const uv=[0,1,2].filter(i=>i!==axis),key=p=>`${quant(p[uv[0]])},${quant(p[uv[1]])}`,wrap=v=>Math.abs(v)<1e-8||Math.abs(v-1)<1e-8?0:mod(v,1),pointKey=p=>`${quant(wrap(p[uv[0]]))},${quant(wrap(p[uv[1]]))}`;
    const bucket=result[axis][face];
    if(onP)bucket.points.add(`${e.kind}:${pointKey(p)}`);
    if(onQ)bucket.points.add(`${e.kind}:${pointKey(q)}`);
    if(onP&&onQ){let a=key(p),b=key(q);if(a>b)[a,b]=[b,a];bucket.segments.add(`${e.kind}:${a}|${b}`)}
   }
  }
 }
 return result;
}
export function compareFaces(left,right=left,tolerance=1e-7){
 const A=faceSignatures(left,tolerance),B=right===left?A:faceSignatures(right,tolerance);
 // Allow adjacent quantization bins: mathematically equal coordinates can land on
 // opposite sides of a rounding boundary after floating-point translation.
 const closeKey=(x,y)=>{
  const ix=x.indexOf(':'),iy=y.indexOf(':');if(x.slice(0,ix)!==y.slice(0,iy))return false;
  const parse=k=>k.slice(k.indexOf(':')+1).split('|').map(p=>p.split(',').map(Number));
  const a=parse(x),b=parse(y);if(a.length!==b.length)return false;
  const close=(p,q)=>Math.abs(p[0]-q[0])<=1&&Math.abs(p[1]-q[1])<=1;
  if(a.length===1)return close(a[0],b[0]);
  return (close(a[0],b[0])&&close(a[1],b[1]))||(close(a[0],b[1])&&close(a[1],b[0]));
 };
 const missing=(a,b)=>{let n=0;for(const v of a){if(b.has(v))continue;let found=false;for(const u of b)if(closeKey(v,u)){found=true;break}if(!found)n++}return n};
 return [0,1,2].map(axis=>{const a=A[axis][1],b=B[axis][0];
  return {axis:'xyz'[axis],positivePoints:a.points.size,negativePoints:b.points.size,
   positiveSegments:a.segments.size,negativeSegments:b.segments.size,
   pointMismatch:missing(a.points,b.points)+missing(b.points,a.points),
   segmentMismatch:missing(a.segments,b.segments)+missing(b.segments,a.segments)};
 });
}
export function surfacePeriodicity(samples=20){
 let maxError=0;
 for(let axis=0;axis<3;axis++)for(let i=0;i<=samples;i++)for(let j=0;j<=samples;j++){
  const p=[0,0,0],uv=[0,1,2].filter(k=>k!==axis);p[uv[0]]=i/samples;p[uv[1]]=j/samples;
  const q=[...p];q[axis]=1;maxError=Math.max(maxError,Math.abs(F(p)-F(q)));
 }
 return {samplesPerFace:(samples+1)**2,maxError};
}
export function validateLattice(model,n=2){
 const surface=surfacePeriodicity();
 const faces=compareFaces(model),graph=supercellConnectivity(model,n),red=supercellConnectivity(model,n,'red'),blue=supercellConnectivity(model,n,'blue');
 return {n,surface,faces,graph,red,blue,facePass:faces.every(f=>f.pointMismatch===0&&f.segmentMismatch===0),
  graphPass:graph.componentCount===1&&graph.isolatedVertices===0&&red.componentCount===1&&blue.componentCount===1};
}
