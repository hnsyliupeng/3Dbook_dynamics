// Closed-looking section caps for the *displayed* polygonal cylinders.
// This is a rendering helper, not a boolean union or a printable solid.
import * as THREE from '../vendor/three.module.min.js';

export function sectionPolygons(a,b,radius,tiles,radial=8){
 const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);if(delta.lengthSq()<1e-20)return [];
 const rot=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 const ring=[];
 for(let end=0;end<2;end++)for(let j=0;j<radial;j++){
  const t=2*Math.PI*j/radial,offset=new THREE.Vector3(radius*Math.sin(t),0,radius*Math.cos(t)).applyQuaternion(rot),p=(end?bv:av).clone().add(offset);ring.push([p.x,p.y,p.z]);
 }
 const edges=[];for(let i=0;i<radial;i++){const j=(i+1)%radial;edges.push([i,j],[i+radial,j+radial],[i,i+radial]);}
 const caps=[];
 for(let axis=0;axis<3;axis++)for(let face=0;face<2;face++){
  const level=face?tiles[axis]:0,points=[];
  const push=p=>{if(!points.some(q=>p.every((v,k)=>Math.abs(v-q[k])<1e-8)))points.push(p)};
  for(const [i,j] of edges){const p=ring[i],q=ring[j],d=p[axis]-level,e=q[axis]-level;
   if(Math.abs(d)<1e-9)push(p.slice());if(Math.abs(e)<1e-9)push(q.slice());
   if(d*e< -1e-18){const t=d/(d-e);push(p.map((v,k)=>v+t*(q[k]-v)))}
  }
  if(points.length<3)continue;
  const axes=[0,1,2].filter(k=>k!==axis),center=axes.map(k=>points.reduce((s,p)=>s+p[k],0)/points.length);
  points.sort((p,q)=>Math.atan2(p[axes[1]]-center[1],p[axes[0]]-center[0])-Math.atan2(q[axes[1]]-center[1],q[axes[0]]-center[0]));
  let area=0;for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];area+=p[axes[0]]*q[axes[1]]-q[axes[0]]*p[axes[1]];}if(Math.abs(area)<1e-14)continue;
  caps.push({axis,face,points});
 }
 return caps;
}

export function capTriangles(pairs,radius,tiles){
 const positions=[];
 for(const [a,b] of pairs)for(const cap of sectionPolygons(a,b,radius,tiles)){
  const {axis,face,points}=cap,offset=(face?-1:1)*1e-6;
  for(let i=1;i<points.length-1;i++)for(const p of [points[0],points[i],points[i+1]]){
   const q=p.slice();q[axis]+=offset;positions.push(...q);
  }
 }
 return new Float32Array(positions);
}
