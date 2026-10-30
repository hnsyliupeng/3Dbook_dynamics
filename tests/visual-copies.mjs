import assert from 'node:assert/strict';
import {buildBilayer} from '../apps/gyroid-truss/js/truss.mjs';
import {clipSegToBox} from '../apps/gyroid-truss/js/geom.mjs';
import {visibleEdgeCopies,visibleNodeCopies} from '../apps/gyroid-truss/js/visual-copies.mjs';
const model=buildBilayer(.32);
for(const tiles of [[1,1,1],[2,2,1],[2,2,2]]){
 const {lists,duplicateCopies}=visibleEdgeCopies(model,tiles),seen=new Set();let count=0;
 for(const [kind,pairs] of Object.entries(lists))for(const [p,q] of pairs){
  const result=clipSegToBox(p,q,[0,0,0],tiles);assert.ok(result&&result[1]-result[0]>1e-9);
  const key=kind+':'+[p.map(n=>n.toFixed(8)).join(','),q.map(n=>n.toFixed(8)).join(',')].sort().join('|');
  assert.ok(!seen.has(key),'duplicate coincident centreline copy');seen.add(key);count++;
 }
 if(tiles[0]===2)assert.ok(duplicateCopies>0);
 console.log(`${tiles.join('x')} unique visible segments: ${count}, repeated copies skipped: ${duplicateCopies}`);
}
const corners=visibleNodeCopies([0,0,0],[2,2,1]);assert.equal(corners.length,18);assert.equal(new Set(corners.map(p=>p.join(','))).size,18);
