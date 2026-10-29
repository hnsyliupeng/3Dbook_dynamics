import {buildBilayer,validate} from '../apps/gyroid-truss/js/truss.mjs';
import {rigidityBound} from '../apps/gyroid-truss/js/rigidity.mjs';
import {validateLattice} from '../apps/gyroid-truss/js/lattice.mjs';
const w=Number(process.argv[2]??.32),radius=Number(process.argv[3]??.006);
if(!Number.isFinite(w)||w<.15||w>.5||!Number.isFinite(radius)||radius<.002||radius>.012)throw new Error('Usage: node tools/analyze.mjs [w:0.15–0.50] [radius:0.002–0.012]');
const s=buildBilayer(w);const v=validate(s,radius);
console.log(JSON.stringify({w,radius,lattice2:validateLattice(s,2),lattice3:validateLattice(s,3),boundary:s.boundary,rigidity:v.rigidity,beforeWebs:rigidityBound(s,{excludeBoundaryWebs:true}),proximity:v.proximity,redBlueClearance:v.minClearance},null,2));
