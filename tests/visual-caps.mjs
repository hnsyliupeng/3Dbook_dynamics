import assert from 'node:assert/strict';
import {sectionPolygons,capTriangles} from '../apps/gyroid-truss/js/visual-caps.mjs';
let cap=sectionPolygons([-.5,.5,.5],[.5,.5,.5],.1,[1,1,1]);assert.equal(cap.length,1);assert.equal(cap[0].axis,0);assert.equal(cap[0].face,0);assert.ok(cap[0].points.length>=8);
cap=sectionPolygons([0,.1,.5],[0,.9,.5],.1,[1,1,1]);assert.equal(cap.length,1);assert.equal(cap[0].axis,0);
assert.equal(sectionPolygons([.2,.2,.2],[.8,.8,.8],.05,[1,1,1]).length,0);
const tr=capTriangles([[[-.5,.5,.5],[.5,.5,.5]]],.1,[1,1,1]);assert.ok(tr.length>=54);assert.ok([...tr].every(Number.isFinite));console.log('Polygonal section caps pass crossing / coplanar / internal tests');
