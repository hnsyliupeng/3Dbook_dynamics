import assert from 'node:assert/strict';
import {buildBilayer,validate} from '../apps/gyroid-truss/js/truss.mjs';
import {F} from '../apps/gyroid-truss/js/gyroid.mjs';
for(const w of [.15,.32,.5]){
 const s=buildBilayer(w); assert.equal(s.n,192);
 for(const v of s.vertices)assert.ok(v.p.every(x=>x>=0&&x<1));
 for(const v of s.vertices.slice(0,2*s.n)) assert.ok(Math.abs(F(v.p)-(v.layer?-w:w))<1e-9);
 const r=validate(s,.006);assert.ok(r.error<1e-8);assert.ok(r.crossing>0);assert.equal(r.cross,576);
 for(const layer of ['red','blue']){assert.equal(r.connectivity[layer].components,1);assert.equal(r.connectivity[layer].degreeOne,0)}
 const seam=s.vertices.map((v,i)=>v.role==='seam'?i:-1).filter(i=>i>=0);
 for(const id of seam)assert.ok(s.edges.some(e=>e.role==='tie'&&(e.a===id||e.b===id)),`seam ${id} not tied to contour`);
 assert.ok(s.boundary.maxTie<.04);assert.ok(r.minClearance>0);
 assert.ok(r.rigidity.maxwellLowerBound>0);assert.ok(r.rigidity.degreeTwo>0);
 assert.equal(r.proximity.nearCount,r.boundaryWebs.nearCount);
 assert.ok(s.boundary.webs.perAxis.every(n=>n>0));
 assert.equal(r.boundaryWebs.count,s.boundary.webs.count);
 assert.equal(r.boundaryWebs.intersectionCount,0);
 for(const e of s.edges.filter(e=>e.role==='boundary-web')) {
  assert.equal(s.vertices[e.a].layer,0);assert.equal(s.vertices[e.b].layer,1);
  assert.equal(s.vertices[e.a].p[e.axis],0);assert.equal(s.vertices[e.b].p[e.axis],0);
  assert.equal(e.o[e.axis],0);
 }
 console.log(`  boundary webs=${r.boundaryWebs.count}, axes=${s.boundary.webs.perAxis}, nonincident capsule close pairs=${r.boundaryWebs.nearCount}`);
 console.log(`w=${w} seam joints=${s.boundary.junctionCount}, rail edges=${s.boundary.railCount}, max tie=${s.boundary.maxTie.toFixed(5)}, clearance=${r.minClearance.toFixed(5)}; both layers connected, no degree-1 joints`);
}

// Count bounds also work for a single triangle: 9 DOF, 3 bars, minus 3 translations.
import {rigidityBound} from '../apps/gyroid-truss/js/rigidity.mjs';
const triangle={vertices:[{},{},{}],edges:[{a:0,b:1},{a:1,b:2},{a:2,b:0}]};
assert.equal(rigidityBound(triangle).maxwellLowerBound,3);
assert.equal(rigidityBound(triangle).degreeTwo,3);
