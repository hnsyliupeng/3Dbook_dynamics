import {add,segCellTranslations,clipSegToBox} from './geom.mjs';

// Draw each periodic centreline copy once. Cylinders are clipped to the outer
// display box by the renderer. An exterior rod whose centreline misses that
// box can otherwise leave a tiny disconnected sliver of its circular surface.
// This is a centreline visualization policy, not solid geometry or STL CSG.
export function visibleEdgeCopies(model,tiles){
 const lists={red:[],blue:[],cross:[]};let duplicateCopies=0,zeroLength=0;
 const lo=[0,0,0];
 for(const e of model.edges){
  const a=model.vertices[e.a].p,b=add(model.vertices[e.b].p,e.o),seen=new Set();
  for(const {t} of segCellTranslations(a,b))for(let x=0;x<tiles[0];x++)for(let y=0;y<tiles[1];y++)for(let z=0;z<tiles[2];z++){
   const shift=[t[0]+x,t[1]+y,t[2]+z],key=shift.join(',');
   if(seen.has(key)){duplicateCopies++;continue}seen.add(key);
   const p=add(a,shift),q=add(b,shift),intersection=clipSegToBox(p,q,lo,tiles);
   if(!intersection||intersection[1]-intersection[0]<1e-9){zeroLength++;continue}
   lists[e.kind].push([p,q]);
  }
 }
 return {lists,duplicateCopies,zeroLength};
}
export function visibleNodeCopies(p,tiles){
 const points=[],seen=new Set();
 // A marker is shown if its centre lies within the box; its clipped outer
 // surface is not a claim about the physical finite-cell cut.
 for(let tx=-1;tx<=1;tx++)for(let ty=-1;ty<=1;ty++)for(let tz=-1;tz<=1;tz++)for(let x=0;x<tiles[0];x++)for(let y=0;y<tiles[1];y++)for(let z=0;z<tiles[2];z++){
  const shift=[tx+x,ty+y,tz+z],key=shift.join(',');if(seen.has(key))continue;seen.add(key);
  const point=add(p,shift);if(point.every((v,k)=>v>=-1e-10&&v<=tiles[k]+1e-10))points.push(point);
 }
 return points;
}

