import {validate} from './truss.mjs';
import {makeDlpMesh} from './dlp-mesh.mjs';
self.onmessage=({data})=>{try{
 const {model,options}=data,v=validate(model,options.radiusMm/options.sizeMm);
 if(v.minClearance<=0)throw Error(`检测到红蓝杆实体重叠，最小净距 ${(v.minClearance*options.sizeMm).toFixed(3)} mm；请减小半径或调整几何，不能导出。`);
 const out=makeDlpMesh(model,{...options,progress:p=>self.postMessage({progress:p})});out.report.checkedRedBlueClearanceMm=v.minClearance*options.sizeMm;out.report.otherKnownProximityPairs=v.proximity.other;out.report.w=model.w;
 self.postMessage(out,[out.buffer]);
}catch(error){self.postMessage({error:String(error.message||error)});}};
