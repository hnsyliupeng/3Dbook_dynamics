import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import * as THREE from '../vendor/three.module.min.js';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {F} from './gyroid.mjs';
import {buildBilayer,validate} from './truss.mjs';
import {validateLattice} from './lattice.mjs';
import {add,segCellTranslations,sphereCellTranslations} from './geom.mjs';
const $=id=>document.getElementById(id), viewport=$('viewport');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.localClippingEnabled=true;renderer.setClearColor(0,0);viewport.prepend(renderer.domElement);
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(35,1,.01,100);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.target.set(.5,.5,.5);
scene.add(new THREE.HemisphereLight(0xffffff,0x9eb3a5,2.3));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,5,6);scene.add(light);const light2=new THREE.DirectionalLight(0xb9d1c9,1);light2.position.set(-4,-2,-3);scene.add(light2);
let model, group, latticeReport, radius=.006, tiles=1, visible={surface:true,struts:true,nodes:false,box:true};
const materials={red:new THREE.MeshStandardMaterial({color:0xc9625e,roughness:.6}),blue:new THREE.MeshStandardMaterial({color:0x497caa,roughness:.55}),cross:new THREE.MeshStandardMaterial({color:0xe6e6de,roughness:.55}),nodeRed:new THREE.MeshStandardMaterial({color:0xcf716b}),nodeBlue:new THREE.MeshStandardMaterial({color:0x5a88ac})};
const cyl=new THREE.CylinderGeometry(1,1,1,8),sphere=new THREE.SphereGeometry(1,10,7);let surfaceGeom;
function surfaceGeometry(){
 const N=27,pos=[],tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]],corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],pairs=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
 for(let x=0;x<N;x++)for(let y=0;y<N;y++)for(let z=0;z<N;z++){
  const p=corners.map(c=>[(x+c[0])/N,(y+c[1])/N,(z+c[2])/N]),f=p.map(F);
  for(const t of tetra){let hits=[];for(const [a,b] of pairs){const i=t[a],j=t[b];if((f[i]<0)!==(f[j]<0)){let q=f[i]/(f[i]-f[j]);hits.push(p[i].map((v,k)=>v+q*(p[j][k]-v)));}}
   if(hits.length===3)pos.push(...hits[0],...hits[1],...hits[2]);else if(hits.length===4)pos.push(...hits[0],...hits[1],...hits[2],...hits[1],...hits[3],...hits[2]);
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g;
}
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};new ResizeObserver(resize).observe(viewport);
function cameraView(axis=false){
 let c=tiles/2;controls.target.set(c,c,c);
 const aspect=Math.max(.15,viewport.clientWidth/Math.max(1,viewport.clientHeight));
 const vertical=THREE.MathUtils.degToRad(camera.fov),horizontal=2*Math.atan(Math.tan(vertical/2)*aspect);
 const distance=Math.max(4.1*tiles,1.12*(Math.sqrt(3)*tiles/2)/Math.sin(Math.min(vertical,horizontal)/2));
 const direction=new THREE.Vector3(...(axis?[1,1,1]:[2.25,1.75,2.8])).normalize();
 camera.position.copy(controls.target).addScaledVector(direction,distance);controls.update();
}
function build(){
 if(group){scene.remove(group);group.traverse(o=>{if(o.geometry && o.geometry!==cyl && o.geometry!==sphere && o.geometry!==surfaceGeom)o.geometry.dispose();if(o.userData.ownedMaterial)o.material.dispose()})}
 group=new THREE.Group();scene.add(group);
 // Render complete periodic copies, then use the six cell planes only as a display window.
 const planes=[new THREE.Plane(new THREE.Vector3(1,0,0),0),new THREE.Plane(new THREE.Vector3(-1,0,0),tiles),new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Plane(new THREE.Vector3(0,-1,0),tiles),new THREE.Plane(new THREE.Vector3(0,0,1),0),new THREE.Plane(new THREE.Vector3(0,0,-1),tiles)];
 for(const m of Object.values(materials))m.clippingPlanes=planes;
 const lists={red:[],blue:[],cross:[]};
 for(const e of model.edges){let a=model.vertices[e.a].p,b=add(model.vertices[e.b].p,e.o);for(const {t} of segCellTranslations(a,b,radius)){for(let x=0;x<tiles;x++)for(let y=0;y<tiles;y++)for(let z=0;z<tiles;z++){const shift=[t[0]+x,t[1]+y,t[2]+z];lists[e.kind].push([add(a,shift),add(b,shift)])}}}
 const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
 for(const kind of ['red','blue','cross']){const mesh=new THREE.InstancedMesh(cyl,materials[kind],lists[kind].length);let i=0;for(const [a,b] of lists[kind]){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);dummy.position.copy(av).add(bv).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,d.clone().normalize());dummy.scale.set(radius,d.length(),radius);dummy.updateMatrix();mesh.setMatrixAt(i++,dummy.matrix)}mesh.visible=visible.struts;mesh.name='struts';group.add(mesh)}
 for(let layer=0;layer<2;layer++){let ps=[];for(const v of model.vertices.slice(0,2*model.n).filter(v=>v.layer===layer))for(const t of sphereCellTranslations(v.p,radius*1.8))for(let x=0;x<tiles;x++)for(let y=0;y<tiles;y++)for(let z=0;z<tiles;z++)ps.push(add(v.p,[t[0]+x,t[1]+y,t[2]+z]));const mesh=new THREE.InstancedMesh(sphere,layer?materials.nodeBlue:materials.nodeRed,ps.length);ps.forEach((p,i)=>{dummy.position.set(...p);dummy.quaternion.identity();dummy.scale.setScalar(radius*1.8);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.name='nodes';mesh.visible=visible.nodes;group.add(mesh)}
 if(!surfaceGeom)surfaceGeom=surfaceGeometry();const sm=new THREE.MeshStandardMaterial({color:0x94b9a6,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false,roughness:1});for(let x=0;x<tiles;x++)for(let y=0;y<tiles;y++)for(let z=0;z<tiles;z++){const m=new THREE.Mesh(surfaceGeom,sm);m.position.set(x,y,z);m.name='surface';m.visible=visible.surface;group.add(m)}
 const boxGeom=new THREE.EdgesGeometry(new THREE.BoxGeometry(tiles,tiles,tiles));const boxMat=new THREE.LineBasicMaterial({color:0x8ea99a,transparent:true,opacity:.65});const box=new THREE.LineSegments(boxGeom,boxMat);box.position.setScalar(tiles/2);box.name='box';box.visible=visible.box;box.userData.ownedMaterial=true;group.add(box);
 $('tileTag').textContent=`${tiles} × ${tiles} × ${tiles}`;resize();
}
function updateChecks(){const v=validate(model,radius);$('nodeCount').textContent=model.n;$('crossCount').textContent=v.cross+v.boundaryWebs.count;$('periodText').textContent=`边界连接点 ${v.boundary.junctionCount} · 单层无断头 ${v.connectivity.red.degreeOne + v.connectivity.blue.degreeOne === 0 ? '是' : '否'}`;$('surfaceText').textContent=`最大 |g ∓ w| = ${v.residual.toExponential(1)}`;const pass=v.minClearance>0;$('clearText').textContent=`最小净距 ${v.minClearance.toFixed(4)} a · ${pass?'未发现干涉':`${v.intersections} 对发生干涉`}`;$('clearIcon').textContent=pass?'✓':'!';$('clearIcon').className='check-icon '+(pass?'':'fail');$('webText').textContent=`${v.boundaryWebs.count} 根 · 中心线交叉 ${v.boundaryWebs.intersectionCount} · 半径邻近 ${v.boundaryWebs.nearCount} 对（${v.proximity.other} 对非一跳邻接）`; $('rigidityText').textContent=`至少 ${v.rigidity.maxwellLowerBound} 个非平移机构；${v.rigidity.degreeTwo} 个二杆节点`;  $('webIcon').className='check-icon '+(v.boundaryWebs.intersectionCount || v.boundaryWebs.nearCount ? 'warning' : ''); $('webIcon').textContent=v.boundaryWebs.intersectionCount || v.boundaryWebs.nearCount ? '!' : '✓';$('periodIcon').className='check-icon '+(v.error<1e-8 && v.connectivity.red.components===1 && v.connectivity.blue.components===1 && v.connectivity.red.degreeOne===0 && v.connectivity.blue.degreeOne===0?'':'fail');$('surfaceIcon').className='check-icon '+(v.residual<1e-8?'':'fail')}
function updateLattice(){
 latticeReport=validateLattice(model,2);const r=latticeReport,ok=r.facePass&&r.graphPass&&r.surface.maxError<1e-12;
 $('latticeStatus').textContent=ok?'✓ 几何接缝与周期图连通':'! 检测到拼接或连通问题';$('latticeStatus').classList.toggle('failed',!ok);
 $('latticeFaces').textContent=r.faces.map(f=>`${f.axis.toUpperCase()}: ${f.pointMismatch+f.segmentMismatch}`).join(' / ')+' 不匹配';
 $('latticeComponents').textContent=`整体 ${r.graph.componentCount} · 红 ${r.red.componentCount} · 蓝 ${r.blue.componentCount}`;
 $('latticeSize').textContent=`${r.graph.activeVertices.toLocaleString()} / ${r.graph.edgeCount.toLocaleString()}`;
 $('latticeSurface').textContent=r.surface.maxError.toExponential(1);
}
$('latticeExport').onclick=()=>{if(!latticeReport)return;const report={description:'Centreline face signatures and fixed periodic quotient graph; not a solid interference or mechanical stability certification.',w:model.w,radius,report:latticeReport};const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='gyroid-2x2x2-lattice-validation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
function rebuild(){model=buildBilayer(Number($('width').value));radius=Number($('radius').value);$('wValue').textContent=model.w.toFixed(2);$('radiusValue').textContent=radius.toFixed(3);build();updateChecks();updateLattice();$('loading').style.display='none'}
for(const id of ['width','radius'])$(id).addEventListener('change',()=>{ $('loading').style.display='block';requestAnimationFrame(()=>setTimeout(rebuild,10)) });for(const id of ['surface','struts','nodes','box'])$(id).addEventListener('change',e=>{visible[id]=e.target.checked;group.traverse(o=>{if(o.name===id)o.visible=visible[id]})});
document.querySelectorAll('#tiles button').forEach(btn=>btn.addEventListener('click',()=>{tiles=+btn.dataset.n;document.querySelectorAll('#tiles button').forEach(b=>b.classList.toggle('active',b===btn));build();cameraView()}));$('iso').onclick=()=>cameraView();$('axis').onclick=()=>cameraView(true);$('reset').onclick=()=>cameraView();$('openPaper').onclick=()=>$('modal').classList.add('open');$('closePaper').onclick=()=>$('modal').classList.remove('open');$('modal').onclick=e=>{if(e.target===$('modal'))$('modal').classList.remove('open')};document.addEventListener('keydown',e=>{if(e.key==='Escape')$('modal').classList.remove('open')});
$('export').onclick=()=>{const data={description:'H=12 approximation with added face-contour reinforcement; fractional coordinates; each undirected edge joins a to b+offset. Not paper Fig.4 simulation data.',w:model.w,vertices:model.vertices,edges:model.edges};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='gyroid-H12-periodic-graph.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
cameraView();requestAnimationFrame(()=>setTimeout(rebuild,20));function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}animate();
