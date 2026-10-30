import {makePrintMesh} from './print-mesh.mjs';
self.onmessage=e=>{try{const result=makePrintMesh(e.data.model,{...e.data.options,progress:text=>self.postMessage({progress:text})});self.postMessage(result,[result.buffer]);}catch(err){self.postMessage({error:err.message})}};
