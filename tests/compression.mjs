import assert from 'node:assert/strict';
import {parseCompressionCSV,compressionMetrics} from '../apps/gyroid-truss/js/compression.mjs';
const p=parseCompressionCSV('u_mm,F_N\n0,0\n1,10\n2,20\n3,10\n');
const o={widthMm:10,depthMm:10,heightMm:10,massG:1,solidDensity:2,cutoffMm:2.5,elasticStart:0,elasticEnd:.1,plateauStart:.1,plateauEnd:.2};
const r=compressionMetrics(p,o),m=r.metrics;
assert.equal(m.effectiveDensityGcm3,1);assert.equal(m.relativeDensity,.5);assert.equal(m.youngChordMPa,1);assert.equal(m.peakForceN,20);assert.equal(m.absorbedEnergyJ,.02875);assert.equal(m.SEA_J_g,.02875);assert.equal(m.meanForceN,11.5);assert.equal(m.CFE,.575);assert.equal(m.plateauStressMPa,.15);
assert.throws(()=>parseCompressionCSV('u_mm,F_N\n0,0\n1,'));assert.throws(()=>compressionMetrics([{u:0,f:0},{u:0,f:1}],o));assert.throws(()=>compressionMetrics([{u:1,f:0},{u:2,f:1}],o));assert.throws(()=>compressionMetrics(p,{...o,cutoffMm:4}));assert.throws(()=>compressionMetrics(p,{...o,plateauStart:.2,plateauEnd:.3}));
console.log('Compression metrics, interpolated cutoff/window and invalid inputs passed.');
