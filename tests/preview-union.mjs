import assert from 'node:assert/strict';
import {buildUnionPreview} from '../apps/gyroid-truss/js/preview-union.mjs';
const mesh=buildUnionPreview({red:[[[.1,.5,.5],[.9,.5,.5]]],blue:[],cross:[]},[1,1,1],.1,{longestCells:32});
assert.ok(mesh.positions.length>0&&mesh.indices.length>0);assert.equal(mesh.colors.length,mesh.positions.length);assert.equal(mesh.indices.length%3,0);assert.ok([...mesh.positions].every(Number.isFinite));assert.ok([...mesh.indices].every(n=>n<mesh.positions.length/3));assert.ok([...mesh.positions].every(v=>v>=-1e-6&&v<=1+1e-6));console.log('Union-preview simple bounded capsule: vertices',mesh.positions.length/3,'triangles',mesh.indices.length/3);
