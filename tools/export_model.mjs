// Build the exact periodic graph used in the viewer, for numerical analysis.
import {buildBilayer} from '../apps/gyroid-truss/js/truss.mjs';
const w=Number(process.argv[2] ?? .32);
if(!Number.isFinite(w)||w<.15||w>.5)throw Error('w must be between 0.15 and 0.50');
const resolution=Number(process.argv[3] ?? 48);
if(!Number.isInteger(resolution)||resolution<12||resolution>128)throw Error('resolution must be an integer 12..128');
console.log(JSON.stringify(buildBilayer(w,{boundaryResolution:resolution}))); 
