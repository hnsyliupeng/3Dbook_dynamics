// Supplemental boundary web members. These are a design proposal, not Fig. 4 data.
import {add,sub,norm,mimgDist,segSegDist} from './geom.mjs';

function segment(vertices,e) {
 const a=vertices[e.a].p,b=add(vertices[e.b].p,e.o);
 return {a,b,mid:a.map((x,i)=>(x+b[i])/2),half:norm(sub(b,a))/2};
}
function imageDistance(s,t,limit=Infinity) {
 const base=s.mid.map((v,i)=>Math.round(v-t.mid[i]));let best=Infinity;
 for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
  const d=[base[0]+x,base[1]+y,base[2]+z];
  if(norm(sub(s.mid,add(t.mid,d)))>s.half+t.half+Math.min(best,limit))continue;
  best=Math.min(best,segSegDist(s.a,s.b,add(t.a,d),add(t.b,d)));
 }
 return best;
}

// Match actual boundary seam joints on each face. Reject centreline crossings
// with existing rods and already-selected webs; uniformly space starting joints.
export function addBoundaryBraces(model,junctions) {
 const {vertices,edges}=model;
 const rods=edges.map(e=>({...segment(vertices,e),aId:e.a,bId:e.b}));
 const added=[]; const seen=new Set();
 for(let axis=0;axis<3;axis++){
  const red=[...new Set(junctions.filter(j=>j.axis===axis&&j.layer===0).map(j=>j.id))];
  const blue=[...new Set(junctions.filter(j=>j.axis===axis&&j.layer===1).map(j=>j.id))];
  const candidates=[];
  for(const a of red)for(const b of blue){const d=mimgDist(vertices[a].p,vertices[b].p);if(d<.32)candidates.push({a,b,d});}
  candidates.sort((a,b)=>a.d-b.d||a.a-b.a||a.b-b.b);
  const chosen=[];
  for(const c of candidates){
   if(chosen.some(p=>mimgDist(vertices[p.a].p,vertices[c.a].p)<.10||mimgDist(vertices[p.b].p,vertices[c.b].p)<.10))continue;
   const key=c.a+':'+c.b;if(seen.has(key))continue;
   const pa=vertices[c.a].p,pb=vertices[c.b].p,o=pa.map((v,k)=>Math.round(v-pb[k]));
   o[axis]=0; // the web lies on this periodic face, not a neighbouring face
   const e={a:c.a,b:c.b,o,kind:'cross',role:'boundary-web',d:c.d,axis};
   const s=segment(vertices,e);
   let crosses=false;
   for(const r of rods){
    if(r.aId===e.a||r.aId===e.b||r.bId===e.a||r.bId===e.b)continue;
    if(imageDistance(s,r,1e-6)<1e-6){crosses=true;break;}
   }
   if(crosses)continue;
   edges.push(e);added.push(e);chosen.push(e);seen.add(key);rods.push({...s,aId:e.a,bId:e.b});
  }
 }
 return {count:added.length,perAxis:[0,1,2].map(i=>added.filter(e=>e.axis===i).length)};
}

// Centreline intersections for the NEW boundary webs, including all periodic
// images, with nonincident members. Separate finite-radius check reports capsule
// proximity, which may occur around triangulated joints.
export function inspectBoundaryBraces(model,radius) {
 const {vertices,edges}=model;
 const webs=edges.filter(e=>e.role==='boundary-web');
 const rods=edges.map(e=>({e,s:segment(vertices,e)}));
 let min=Infinity,intersectionCount=0,nearCount=0;
 for(const web of webs){const s=segment(vertices,web);
  for(const {e,s:t} of rods){
   if(e===web || e.a===web.a||e.a===web.b||e.b===web.a||e.b===web.b)continue;
   // Count web/web pairs once.
   if(e.role==='boundary-web'&&webs.indexOf(e)<webs.indexOf(web))continue;
   const d=imageDistance(s,t,Math.max(2*radius,.03));
   min=Math.min(min,d);if(d<1e-6)intersectionCount++;if(d<2*radius-1e-9)nearCount++;
  }
 }
 return {count:webs.length,intersectionCount,nearCount,clearance:min-2*radius};
}

// Diagnostic classification of nonincident boundary-web capsule proximity.
// A one-hop neighbour shares a joint with an endpoint, but does NOT imply the
// overlap is physically acceptable; the actual joint solid is unspecified.
export function analyzeBoundaryProximity(model,radius) {
 const {vertices,edges}=model;
 const adj=Array.from({length:vertices.length},()=>new Set());
 for(const e of edges){adj[e.a].add(e.b);adj[e.b].add(e.a);}
 const webs=edges.filter(e=>e.role==='boundary-web');
 const rods=edges.map(e=>({e,s:segment(vertices,e)}));
 const byRole={}, sample=[];let nearCount=0,oneHop=0,other=0;
 for(let wi=0;wi<webs.length;wi++){
  const web=webs[wi],s=segment(vertices,web);
  for(const {e,s:t} of rods){
   if(e===web||e.a===web.a||e.a===web.b||e.b===web.a||e.b===web.b)continue;
   if(e.role==='boundary-web' && webs.indexOf(e)<wi)continue;
   const d=imageDistance(s,t,2*radius);
   if(d>=2*radius-1e-9)continue;
   nearCount++;
   const role=e.role||'original';byRole[role]=(byRole[role]||0)+1;
   const neighbor=[e.a,e.b].some(v=>adj[web.a].has(v)||adj[web.b].has(v));
   if(neighbor)oneHop++;else other++;
   if(sample.length<8)sample.push({web:[web.a,web.b],other:[e.a,e.b],role,distance:d,oneHop:neighbor});
  }
 }
 return {radius,nearCount,byRole,oneHop,other,sample};
}
