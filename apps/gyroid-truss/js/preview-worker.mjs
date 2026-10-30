import {buildUnionPreview} from './preview-union.mjs';
self.onmessage=e=>{try{const result=buildUnionPreview(e.data.lists,e.data.tiles,e.data.radius);self.postMessage(result,[result.positions.buffer,result.colors.buffer,result.indices.buffer]);}catch(err){self.postMessage({error:String(err.message||err)})}};
