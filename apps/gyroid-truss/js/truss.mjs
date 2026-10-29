// Approximate H=12 bilayer, seeded from the paper's single-membrane S2 positions.
import {mod1,mimgDist,add,norm,sub,segSegDist,segCellTranslations} from './geom.mjs';
import {projectToLevel,gyroidSymmetryOps,orbit,WYCKOFF,F} from './gyroid.mjs';
import {reinforceBoundary} from './boundary.mjs';
import {inspectBoundaryBraces,analyzeBoundaryProximity} from './boundary-braces.mjs';
import {rigidityBound} from './rigidity.mjs';

function offset(a,b) { return a.map((v,i)=>Math.round(v-b[i])); }
export function buildBilayer(w=.32) {
 const ops=gyroidSymmetryOps().i43d;
 const seeds=WYCKOFF[12].gens.flatMap(g=>orbit(g,ops));
 const red=seeds.map(p=>projectToLevel(p,w).map(mod1));
 const blue=red.map(p=>p.map(x=>mod1(-x)));
 const vertices=[...red.map(p=>({p,layer:0})),...blue.map(p=>({p,layer:1}))];
 const n=red.length, edges=[];
 // SI points are single-layer samples; distance cutoffs below are a modelling choice,
 // not the unknown contacts of the paper's double-membrane simulation.
 const same=[];
 for(let i=0;i<n;i++) for(let j=i+1;j<n;j++) {
   const d=mimgDist(red[i],red[j]); if(d<.158) same.push({a:i,b:j,o:offset(red[i],red[j]),d});
 }
 for(const e of same) {
   edges.push({...e,kind:'red'});
   edges.push({a:e.a+n,b:e.b+n,o:offset(blue[e.a],blue[e.b]),d:e.d,kind:'blue'});
 }
 // Include the three nearest distinct opposite-layer vertices for each red vertex.
 for(let i=0;i<n;i++) {
  const near=blue.map((p,j)=>({j,d:mimgDist(red[i],p)})).sort((a,b)=>a.d-b.d).slice(0,3);
  for(const q of near) edges.push({a:i,b:n+q.j,o:offset(red[i],blue[q.j]),d:q.d,kind:'cross'});
 }
 const model={w,n,vertices,edges};
 model.boundary=reinforceBoundary(model);
 return model;
}
export function validate(s,radius) {
 const {vertices,edges,n,w}=s; let residual=0, minNode=Infinity;
 for(const v of vertices.slice(0,2*n)) residual=Math.max(residual,Math.abs(F(v.p)-(v.layer===0?w:-w)));
 for(let i=0;i<n;i++) for(let j=n;j<2*n;j++) minNode=Math.min(minNode,mimgDist(vertices[i].p,vertices[j].p));
 const reds=edges.filter(e=>e.kind==='red'), blues=edges.filter(e=>e.kind==='blue');
 let min=Infinity, intersections=0;
 for(const a of reds){const a0=vertices[a.a].p,a1=add(vertices[a.b].p,a.o),am=a0.map((v,k)=>(v+a1[k])/2),al=norm(sub(a1,a0));
  for(const b of blues){const b0=vertices[b.a].p,b1=add(vertices[b.b].p,b.o),bm=b0.map((v,k)=>(v+b1[k])/2),bl=norm(sub(b1,b0));
   const base=am.map((v,k)=>Math.round(v-bm[k]));
   for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++) {
    const t=[base[0]+x,base[1]+y,base[2]+z];
    if(norm(sub(am,add(bm,t)))>(al+bl)/2+Math.max(min,2*radius)) continue;
    const d=segSegDist(a0,a1,add(b0,t),add(b1,t)); min=Math.min(min,d); if(d<2*radius-1e-9) intersections++;
   }
  }
 }
 let error=0,crossing=0;
 for(const e of edges.filter(e=>e.role==='original')){const a=vertices[e.a].p,b=add(vertices[e.b].p,e.o);let pieces=segCellTranslations(a,b);const sum=pieces.reduce((v,p)=>v+p.r[1]-p.r[0],0); error=Math.max(error,Math.abs(sum-1));if(pieces.length>1)crossing++;}
 const connectivity={};
 for(const kind of ['red','blue']) {
  const adj=new Map();
  for(const e of edges.filter(e=>e.kind===kind)) {
   if(!adj.has(e.a))adj.set(e.a,[]);if(!adj.has(e.b))adj.set(e.b,[]);
   adj.get(e.a).push(e.b);adj.get(e.b).push(e.a);
  }
  const seen=new Set();let components=0,degreeOne=0;
  for(const [v,neighbors] of adj){if(neighbors.length===1)degreeOne++;if(seen.has(v))continue;components++;const queue=[v];seen.add(v);while(queue.length){for(const u of adj.get(queue.pop()))if(!seen.has(u)){seen.add(u);queue.push(u)}}}
  connectivity[kind]={components,degreeOne};
 }
 const boundaryWebs=inspectBoundaryBraces(s,radius);
 const proximity=analyzeBoundaryProximity(s,radius);
 const rigidity=rigidityBound(s);
 return {boundaryWebs,proximity,rigidity,connectivity,residual,minNode,minClearance:min-2*radius,intersections,error,crossing,red:reds.length,blue:blues.length,cross:edges.filter(e=>e.kind==='cross'&&e.role==='original').length, boundary:modelBoundary(s)};
}

function modelBoundary(s){return s.boundary;}
