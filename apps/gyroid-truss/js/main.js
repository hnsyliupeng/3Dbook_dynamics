import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import * as THREE from '../vendor/three.module.min.js';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {F} from './gyroid.mjs';
import {parseCompressionCSV, compressionMetrics} from './compression.mjs';
import {buildBilayer,validate} from './truss.mjs';
import {validateLattice} from './lattice.mjs';
import mechanicsDefault from '../../../data/mechanics-default.json';
import mechanicsFields from '../../../data/mechanics-fields-w032.json';
import frameReport from '../../../data/frame-fem-default.json';
import frameFields from '../../../data/frame-fem-fields-w032-r006.json';
import {add,segCellTranslations} from './geom.mjs';
import {visibleEdgeCopies,visibleNodeCopies} from './visual-copies.mjs';
const $=id=>document.getElementById(id), viewport=$('viewport');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.localClippingEnabled=true;renderer.setClearColor(0,0);viewport.prepend(renderer.domElement);
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(35,1,.01,100);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.target.set(.5,.5,.5);
scene.add(new THREE.HemisphereLight(0xffffff,0x9eb3a5,2.3));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,5,6);scene.add(light);const light2=new THREE.DirectionalLight(0xb9d1c9,1);light2.position.set(-4,-2,-3);scene.add(light2);
let model, group, latticeReport, resultMode='beam', radius=.006, cellMm=100, tiles=[1,1,1], visible={surface:true,struts:true,nodes:false,box:true};
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
 controls.target.set(...tiles.map(n=>n/2));
 const aspect=Math.max(.15,viewport.clientWidth/Math.max(1,viewport.clientHeight));
 const vertical=THREE.MathUtils.degToRad(camera.fov),horizontal=2*Math.atan(Math.tan(vertical/2)*aspect);
 const distance=Math.max(2.2*Math.max(...tiles),1.12*(Math.hypot(...tiles)/2)/Math.sin(Math.min(vertical,horizontal)/2));
 const direction=new THREE.Vector3(...(axis?[1,1,1]:[2.25,1.75,2.8])).normalize();
 camera.position.copy(controls.target).addScaledVector(direction,distance);controls.update();
}
function build(){
 if(group){scene.remove(group);group.traverse(o=>{if(o.geometry && o.geometry!==cyl && o.geometry!==sphere && o.geometry!==surfaceGeom)o.geometry.dispose();if(o.userData.ownedMaterial)o.material.dispose()})}
 group=new THREE.Group();scene.add(group);
 // Render complete periodic copies, then use the six cell planes only as a display window.
 const planes=[new THREE.Plane(new THREE.Vector3(1,0,0),0),new THREE.Plane(new THREE.Vector3(-1,0,0),tiles[0]),new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Plane(new THREE.Vector3(0,-1,0),tiles[1]),new THREE.Plane(new THREE.Vector3(0,0,1),0),new THREE.Plane(new THREE.Vector3(0,0,-1),tiles[2])];
 for(const m of Object.values(materials))m.clippingPlanes=planes;
 const {lists}=visibleEdgeCopies(model,tiles);
 const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
 for(const kind of ['red','blue','cross']){const mesh=new THREE.InstancedMesh(cyl,materials[kind],lists[kind].length);let i=0;for(const [a,b] of lists[kind]){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);dummy.position.copy(av).add(bv).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,d.clone().normalize());dummy.scale.set(radius,d.length(),radius);dummy.updateMatrix();mesh.setMatrixAt(i++,dummy.matrix)}mesh.visible=visible.struts && resultMode==='structure';mesh.name='struts';group.add(mesh)}
 for(let layer=0;layer<2;layer++){let ps=[];for(const v of model.vertices.slice(0,2*model.n).filter(v=>v.layer===layer))ps.push(...visibleNodeCopies(v.p,tiles));const mesh=new THREE.InstancedMesh(sphere,layer?materials.nodeBlue:materials.nodeRed,ps.length);ps.forEach((p,i)=>{dummy.position.set(...p);dummy.quaternion.identity();dummy.scale.setScalar(radius*1.8);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.name='nodes';mesh.visible=visible.nodes && resultMode==='structure';group.add(mesh)}
 if(!surfaceGeom)surfaceGeom=surfaceGeometry();const sm=new THREE.MeshStandardMaterial({color:0x94b9a6,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false,roughness:1});for(let x=0;x<tiles[0];x++)for(let y=0;y<tiles[1];y++)for(let z=0;z<tiles[2];z++){const m=new THREE.Mesh(surfaceGeom,sm);m.position.set(x,y,z);m.name='surface';m.visible=visible.surface;group.add(m)}
 if(resultMode==='force') addForceVisual();
 if(resultMode==='beam') addBeamVisual();
 const boxGeom=new THREE.EdgesGeometry(new THREE.BoxGeometry(...tiles));const boxMat=new THREE.LineBasicMaterial({color:0x8ea99a,transparent:true,opacity:.65});const box=new THREE.LineSegments(boxGeom,boxMat);box.position.set(...tiles.map(n=>n/2));box.name='box';box.visible=visible.box;box.userData.ownedMaterial=true;group.add(box);
 $('tileTag').textContent=tiles.join(' × ');resize();
}
// Axial-force colors on the UNDEFORMED periodic graph. Do not display the
// non-unique displacement field of this mechanism-rich pin-jointed model.
function addForceVisual(){
 const mode=Number($('loadCase').value),field=mechanicsFields.modes[mode],applied=.01;
 const names=['εxx · X 向拉伸','εyy · Y 向拉伸','εzz · Z 向拉伸','γyz · YZ 剪切','γxz · XZ 剪切','γxy · XY 剪切'];
 $('forceCaseTitle').textContent=names[mode];
 $('forceOverlay').querySelector('.force-foot').textContent='未变形参考几何 · 位移不唯一；轴向杆模型，不是实体应力云图。';
 $('forceOverlay').querySelector('.force-caption').textContent='单项宏观应变 1% · 其余为 0';
 const bound=field.max_abs_axial_strain*applied;$('forceMin').textContent=(-bound).toFixed(4);$('forceMax').textContent=(bound).toFixed(4);
 const pieces=[];
 model.edges.forEach((e,ei)=>{
  const a=model.vertices[e.a].p,b=add(model.vertices[e.b].p,e.o),delta=b.map((v,k)=>v-a[k]);
  for(const {t,r} of segCellTranslations(a,b)){
   if(r[1]-r[0]<1e-8)continue;
   for(let x=0;x<tiles[0];x++)for(let y=0;y<tiles[1];y++)for(let z=0;z<tiles[2];z++){
    const shift=[t[0]+x,t[1]+y,t[2]+z],coords=q=>a.map((v,k)=>v+shift[k]+q*delta[k]);
    pieces.push({p:coords(r[0]),q:coords(r[1]),value:field.axial_strain[ei]});
   }
  }
 });
 const shaded=new THREE.MeshBasicMaterial({color:0xffffff});
 const mesh=new THREE.InstancedMesh(cyl,shaded,pieces.length);
 mesh.name='force-struts';mesh.visible=visible.struts;mesh.userData.ownedMaterial=true;
 const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),blue=new THREE.Color('#1658b7'),white=new THREE.Color('#9da8a2'),red=new THREE.Color('#ca3024');
 pieces.forEach((p,i)=>{const av=new THREE.Vector3(...p.p),bv=new THREE.Vector3(...p.q),d=bv.clone().sub(av);dummy.position.copy(av).add(bv).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,d.normalize());dummy.scale.set(radius,av.distanceTo(bv),radius);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);const v=Math.max(-1,Math.min(1,p.value/field.max_abs_axial_strain));const color=white.clone().lerp(v<0?blue:red,Math.sqrt(Math.abs(v)));mesh.setColorAt(i,color)});
 group.add(mesh);
}
// Display a precomputed rigid-joint 3D Euler–Bernoulli FE field.
// Each member is sampled at Hermite shape-function points, including nodal rotations.
// Color shows axial N/(EA), NOT von Mises or bending stress.
function addBeamVisual(){
 const mode=Number($('loadCase').value),name=$('beamMaterial').value,field=frameFields.materials[name];
 const magnification=Number($('beamScale').value),eps=.01,area=Math.PI*frameFields.r_over_a**2;
 const names=['εxx · X 向拉伸','εyy · Y 向拉伸','εzz · Z 向拉伸','γyz · YZ 剪切','γxz · XZ 剪切','γxy · XY 剪切'];
 $('forceCaseTitle').textContent=`${name} 刚接梁 · ${names[mode]}`;
 $('forceOverlay').querySelector('.force-caption').textContent=`单项宏观应变 1% · 其余为 0；变形显示 ${magnification}×`;
 $('forceOverlay').querySelector('.force-foot').textContent='欧拉-伯努利梁 · 全节点刚接；色标为轴力，不包含弯曲应力。仅示例模型。';
 let maximum=0;for(const a of field.axial_force_over_Ea2)maximum=Math.max(maximum,Math.abs(a[mode]/area));
 const bound=maximum*eps;$('forceMin').textContent=(-bound).toFixed(4);$('forceMax').textContent=(bound).toFixed(4);
 function affine(p){let [x,y,z]=p.map((v,k)=>v-tiles[k]/2);switch(mode){case 0:return [x,0,0];case 1:return [0,y,0];case 2:return [0,0,z];case 3:return [0,z/2,y/2];case 4:return [z/2,0,x/2];default:return [y/2,x/2,0]}}
 const vec=x=>new THREE.Vector3(...x),pieces=[];
 model.edges.forEach((e,ei)=>{
  const a=model.vertices[e.a].p,b=add(model.vertices[e.b].p,e.o),d=vec(b).sub(vec(a)),L=d.length(),ex=d.clone().normalize();
  const abs=[Math.abs(ex.x),Math.abs(ex.y),Math.abs(ex.z)],axis=abs.indexOf(Math.min(...abs)),seed=new THREE.Vector3();seed.setComponent(axis,1);
  const ez=ex.clone().cross(seed).normalize(),ey=ez.clone().cross(ex),U=field.fluctuation;
  const trans=id=>new THREE.Vector3(U[id][0][mode],U[id][1][mode],U[id][2][mode]);
  const rot=id=>new THREE.Vector3(U[id][3][mode],U[id][4][mode],U[id][5][mode]);
  const u1=trans(e.a),u2=trans(e.b),r1=rot(e.a),r2=rot(e.b);
  const ux1=u1.dot(ex),ux2=u2.dot(ex),uy1=u1.dot(ey),uy2=u2.dot(ey),uz1=u1.dot(ez),uz2=u2.dot(ez),ry1=r1.dot(ey),ry2=r2.dot(ey),rz1=r1.dot(ez),rz2=r2.dot(ez);
  function displacement(t,p){
   const h1=1-3*t*t+2*t*t*t,h2=L*(t-2*t*t+t*t*t),h3=3*t*t-2*t*t*t,h4=L*(-t*t+t*t*t);
   const ux=(1-t)*ux1+t*ux2,uy=h1*uy1+h2*rz1+h3*uy2+h4*rz2,uz=h1*uz1-h2*ry1+h3*uz2-h4*ry2;
   const af=affine(p),fluct=ex.clone().multiplyScalar(ux).addScaledVector(ey,uy).addScaledVector(ez,uz);
   return [0,1,2].map(k=>eps*magnification*(af[k]+fluct.getComponent(k)));
  }
  for(const {t,r} of segCellTranslations(a,b)){
   if(r[1]-r[0]<1e-8)continue;
   for(let x=0;x<tiles[0];x++)for(let y=0;y<tiles[1];y++)for(let z=0;z<tiles[2];z++){
    const shift=[t[0]+x,t[1]+y,t[2]+z],point=q=>a.map((v,k)=>v+shift[k]+q*(b[k]-v));
    // Four intervals preserve curved beam shape. Clip is in the reference configuration.
    let previous=null;
    for(let n=0;n<=4;n++){
     const tval=r[0]+(r[1]-r[0])*n/4,p=point(tval),deformed=add(p,displacement(tval,p));
     if(previous)pieces.push({p:previous,q:deformed,value:field.axial_force_over_Ea2[ei][mode]/area});previous=deformed;
    }
   }
  }
 });
 const mat=new THREE.MeshBasicMaterial({color:0xffffff}),mesh=new THREE.InstancedMesh(cyl,mat,pieces.length);
 mesh.name='force-struts';mesh.visible=visible.struts;mesh.userData.ownedMaterial=true;
 const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),blue=new THREE.Color('#1658b7'),white=new THREE.Color('#9da8a2'),red=new THREE.Color('#ca3024');
 pieces.forEach((p,i)=>{const av=vec(p.p),bv=vec(p.q),d=bv.clone().sub(av);dummy.position.copy(av).add(bv).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,d.normalize());dummy.scale.set(radius,av.distanceTo(bv),radius);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);const v=maximum?Math.max(-1,Math.min(1,p.value/maximum)):0;mesh.setColorAt(i,white.clone().lerp(v<0?blue:red,Math.sqrt(Math.abs(v))))});
 group.add(mesh);
}
function syncResultUI(){
 const valid=model && Math.abs(model.w-.32)<1e-9 && model.vertices.length===mechanicsFields.node_count && model.edges.length===mechanicsFields.edge_count && model.vertices.every((v,i)=>v.p.every((x,k)=>Math.abs(x-mechanicsFields.positions[i][k])<1e-10)) && model.edges.every((e,i)=>[e.a,e.b,...e.o].every((x,k)=>x===mechanicsFields.edge_keys[i][k]));
 const beamValid=valid && Math.abs(radius-frameFields.r_over_a)<1e-9;
 if(!valid || (resultMode==='beam'&&!beamValid))resultMode='structure';
 document.querySelectorAll('#resultMode button').forEach(b=>{b.classList.toggle('active',b.dataset.result===resultMode);b.disabled=(b.dataset.result==='force'&&!valid)||(b.dataset.result==='beam'&&!beamValid)});
 $('forceAvailability').textContent=!valid?'当前 w 无预计算场；力学视图仅支持 w=0.32。':resultMode==='beam'?'刚接梁预计算（w=0.32、r/a=0.006）；示例结果，不是实体或屈曲认证。':beamValid?'刚接梁可选；铰接杆位移不唯一，仅显示其未变形轴力。':'当前半径无梁结果；铰接杆位移不唯一，仅显示其未变形轴力。';
 $('forceOverlay').hidden=resultMode==='structure';$('structureLegend').style.visibility=resultMode!=='structure'?'hidden':'visible';
 $('loadCase').disabled=!valid;$('beamMaterial').disabled=!beamValid;$('beamScale').disabled=!beamValid;
}
function updateChecks(){const v=validate(model,radius);const clearance=v.minClearance*cellMm,limit=(v.minClearance+2*radius)*cellMm/2; $('dlpClearance').textContent=clearance<=0?`⚠ 红蓝层杆径重叠：净距 ${clearance.toFixed(3)} mm；当前图中避免这类重叠的半径须小于 ${limit.toFixed(3)} mm。`:`红蓝层已检查杆对最小净距 ${clearance.toFixed(3)} mm（不代表全部实体无干涉）。`; $('dlpClearance').classList.toggle('failed',clearance<=0);$('nodeCount').textContent=model.n;$('crossCount').textContent=v.cross+v.boundaryWebs.count;$('periodText').textContent=`边界连接点 ${v.boundary.junctionCount} · 单层无断头 ${v.connectivity.red.degreeOne + v.connectivity.blue.degreeOne === 0 ? '是' : '否'}`;$('surfaceText').textContent=`最大 |g ∓ w| = ${v.residual.toExponential(1)}`;const pass=v.minClearance>0;$('clearText').textContent=`最小净距 ${v.minClearance.toFixed(4)} a · ${pass?'未发现干涉':`${v.intersections} 对发生干涉`}`;$('clearIcon').textContent=pass?'✓':'!';$('clearIcon').className='check-icon '+(pass?'':'fail');$('webText').textContent=`${v.boundaryWebs.count} 根 · 中心线交叉 ${v.boundaryWebs.intersectionCount} · 半径邻近 ${v.boundaryWebs.nearCount} 对（${v.proximity.other} 对非一跳邻接）`; $('rigidityText').textContent=`至少 ${v.rigidity.maxwellLowerBound} 个非平移机构；${v.rigidity.degreeTwo} 个二杆节点`;  $('webIcon').className='check-icon '+(v.boundaryWebs.intersectionCount || v.boundaryWebs.nearCount ? 'warning' : ''); $('webIcon').textContent=v.boundaryWebs.intersectionCount || v.boundaryWebs.nearCount ? '!' : '✓';$('periodIcon').className='check-icon '+(v.error<1e-8 && v.connectivity.red.components===1 && v.connectivity.blue.components===1 && v.connectivity.red.degreeOne===0 && v.connectivity.blue.degreeOne===0?'':'fail');$('surfaceIcon').className='check-icon '+(v.residual<1e-8?'':'fail')}
function updateMechanics(){
 const isDefault=Math.abs(model.w-.32)<1e-9,m=mechanicsDefault.with_boundary_webs.directional_moduli_over_EA_a2;
 $('mechanicsResults').style.display=isDefault?'block':'none';
 $('mechanicsStatus').textContent=isDefault?'固定胞元 · 理想铰接轴向杆':'当前 w 未计算力学数据';
 $('mechanicsHint').textContent=isDefault?'固定 w=0.32 的数值结果；单位为 EA/a²。圆截面换算忽略实体干涉。存在内部机构，不能作为稳定性认证。':'目前仅内置 w=0.32 的力学结果；其他参数请运行命令行计算，不能沿用这些数值。';
 $('mechanicsYoung').textContent=m.young_x.toFixed(3)+' EA/a²';
 $('mechanicsShear').textContent=m.shear_yz_fixed_other_strains.toFixed(3)+' EA/a²';
 $('mechanicsPoisson').textContent=m.poisson_xy.toFixed(4);
 $('mechanicsScale').textContent=(m.young_x*Math.PI*radius*radius).toExponential(3);
 $('mechanicsExport').disabled=!isDefault;
}
$('mechanicsExport').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(mechanicsDefault,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='gyroid-mechanics-w032.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
function updateFrame(){
 const valid=Math.abs(model.w-frameReport.w)<1e-9&&Math.abs(radius-frameReport.r_over_a)<1e-9;
 const name=$('beamMaterial').value,m=frameReport.materials[name];
 $('frameResults').style.display=valid?'block':'none';$('frameExport').disabled=!valid;
 $('frameStatus').textContent=valid?'示例材料 · 全节点刚接 · 圆实心截面':'当前几何不在预计算范围';
 $('frameHint').textContent=valid?'线性 Euler–Bernoulli 梁；材料值为假设，边界杆件有邻近问题。非实体 FEA 或稳定性认证。':'预计算仅适用 w=0.32、r/a=0.006；其他参数需命令行重新求解。';
 $('frameMaterialText').textContent=`${name} / ${m.material_assumption.E_GPa.toFixed(1)} GPa`;
 $('frameYoung').textContent=m.nominal_Ex_MPa.toFixed(3)+' MPa';$('frameShear').textContent=m.nominal_C44_MPa.toFixed(3)+' MPa';
 $('framePoisson').textContent=m.moduli.poisson_xy.toFixed(4);$('frameResidual').textContent=m.max_equilibrium_residual.toExponential(1);
}
$('openPrint').onclick=()=>document.querySelector('.print-controls').scrollIntoView({behavior:'smooth',block:'center'});
let printWorker;
$('printExport').onclick=()=>{
 const exportW=model.w,sizeMm=Number($('printSize').value),diameterMm=Number($('printDiameter').value);
 if(!Number.isFinite(sizeMm)||sizeMm<40||sizeMm>50||!Number.isFinite(diameterMm)||diameterMm<1.2||diameterMm>3){$('printStatus').textContent='请输入边长 40–50 mm、杆径 1.2–3 mm。';return}
 $('printExport').disabled=true;$('printStatus').textContent='正在融合杆件，可能需要几十秒及较多内存…';
 printWorker=new Worker(new URL('./print-worker.mjs',import.meta.url),{type:'module'});
 printWorker.onmessage=({data})=>{
  if(data.progress){$('printStatus').textContent=data.progress;return}
  $('printExport').disabled=false;printWorker.terminate();printWorker=null;
  if(data.error){$('printStatus').textContent=data.error;return}
  const url=URL.createObjectURL(new Blob([data.buffer],{type:'model/stl'})),a=document.createElement('a');a.href=url;a.download=`gyroid-w${exportW.toFixed(2)}-${sizeMm}mm-d${diameterMm}mm.stl`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  const support=$('printSupport').value==='yes'?'请在切片器开启支撑。':'已选择不使用支撑；悬空杆件可能打印失败。';
  $('printStatus').textContent=`STL 已生成：${data.report.triangles.toLocaleString()} 三角面、实体连通、边检查通过；采样 ${data.report.pitchMm.toFixed(3)} mm。${support} 请检查预览与打印机尺寸。`;
 };
 printWorker.onerror=()=>{$('printExport').disabled=false;$('printStatus').textContent='STL 生成失败或内存不足；请尝试 40 mm，并关闭其他程序。';printWorker?.terminate();printWorker=null};
 printWorker.postMessage({model,options:{sizeMm,diameterMm}});
};
$('frameExport').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(frameReport,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='gyroid-rigid-beam-fea.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
function updateLattice(){
 latticeReport=validateLattice(model,2);const r=latticeReport,ok=r.facePass&&r.graphPass&&r.surface.maxError<1e-12;
 $('latticeStatus').textContent=ok?'✓ 几何接缝与周期图连通':'! 检测到拼接或连通问题';$('latticeStatus').classList.toggle('failed',!ok);
 $('latticeFaces').textContent=r.faces.map(f=>`${f.axis.toUpperCase()}: ${f.pointMismatch+f.segmentMismatch}`).join(' / ')+' 不匹配';
 $('latticeComponents').textContent=`整体 ${r.graph.componentCount} · 红 ${r.red.componentCount} · 蓝 ${r.blue.componentCount}`;
 $('latticeSize').textContent=`${r.graph.activeVertices.toLocaleString()} / ${r.graph.edgeCount.toLocaleString()}`;
 $('latticeSurface').textContent=r.surface.maxError.toExponential(1);
}
$('latticeExport').onclick=()=>{if(!latticeReport)return;const report={description:'Centreline face signatures and fixed periodic quotient graph; not a solid interference or mechanical stability certification.',w:model.w,radius,report:latticeReport};const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='gyroid-2x2x2-lattice-validation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
function rebuild(){model=buildBilayer(Number($('width').value));radius=Number($('radius').value);$('wValue').textContent=model.w.toFixed(2);$('radiusValue').textContent=radius.toFixed(3);syncResultUI();build();updateChecks();updateLattice();updateMechanics();updateFrame();updateDimensions();$('loading').style.display='none'}
let dimensionTimer;
function scheduleRebuild(){clearTimeout(dimensionTimer);$('loading').style.display='block';$('dlpClearance').textContent='正在重新检查红蓝层杆件间距…';$('dlpClearance').classList.remove('failed');dimensionTimer=setTimeout(()=>{rebuild();updateDimensions();},250)}
for(const id of ['width','radius'])$(id).addEventListener('input',()=>{if(id==='radius')$('rodMm').value=(Number($('radius').value)*cellMm).toFixed(3);else $('dlpW').value=$('width').value;$('wValue').textContent=Number($('width').value).toFixed(2);$('radiusValue').textContent=Number($('radius').value).toFixed(3);scheduleRebuild()});
function applyDimensions(recenter=false){
 const a=Number($('cellMm').value),r=Number($('rodMm').value),counts=['arrayX','arrayY','arrayZ'].map(id=>Number($(id).value));
 if(!$('cellMm').value||!$('rodMm').value||!Number.isFinite(a)||a<10||a>100||!Number.isFinite(r)||r<.15||r>2||r/a>.08||counts.some(n=>!Number.isInteger(n)||n<1||n>3)||counts.reduce((p,n)=>p*n,1)>8){$('dlpStatus').textContent='输入范围：a 10–100 mm，半径 0.15–2 mm 且 r/a≤0.08；每轴 1–3、总胞元≤8。';return}
 cellMm=a;tiles=counts;syncRadiusBounds();$('radius').value=(r/a).toFixed(5);radius=Number($('radius').value);
 document.querySelectorAll('#tiles button').forEach(b=>b.classList.toggle('active',counts.every(n=>n===Number(b.dataset.n))));
 resultMode='structure';syncResultUI();updateDimensions();if(recenter)cameraView();scheduleRebuild();
}
function syncRadiusBounds(){$('radius').min=String(Math.max(.001,.15/cellMm));$('radius').max=String(Math.min(.08,2/cellMm));}
function updateDimensions(){
 $('physicalSize').textContent=tiles.map(n=>(n*cellMm).toFixed(1)).join(' × ')+' mm';
 $('physicalRod').textContent=(2*radius*cellMm).toFixed(2)+' mm';
 $('relativeRadius').textContent=(radius).toFixed(4);
 const pixel=Number($('pixelMm').value),layer=Number($('layerMm').value);$('diaPixels').textContent=pixel>=.001&&pixel<=1?((2*radius*cellMm)/pixel).toFixed(1)+' px':'请输入有效像素尺寸';$('printLayers').textContent=layer>=.001&&layer<=1?Math.ceil(tiles[2]*cellMm/layer).toLocaleString()+' 层':'请输入有效层厚';
 const copies=tiles.reduce((a,b)=>a*b,1);$('superCount').textContent=model?`${(model.vertices.length*copies).toLocaleString()} / ${(model.edges.length*copies).toLocaleString()}`:'—';
 $('dlpStatus').textContent='尺寸为示例，需按设备像素、树脂和后固化校准；w 是隐函数值，不是恒定层间距离。';
}
for(const id of ['cellMm','rodMm','arrayX','arrayY','arrayZ'])$(id).addEventListener('input',()=>applyDimensions(true));
for(const id of ['pixelMm','layerMm'])$(id).addEventListener('input',updateDimensions);
$('dlpW').addEventListener('input',()=>{const w=Number($('dlpW').value);if(!$('dlpW').value||w<.15||w>.5){$('dlpStatus').textContent='w 请输入 0.15–0.50；不是恒定层间距。';return}$('width').value=w;$('wValue').textContent=Number($('width').value).toFixed(3);scheduleRebuild()});
$('dlpPreset').onclick=()=>{$('cellMm').value=14;$('rodMm').value=.45;$('arrayX').value=2;$('arrayY').value=2;$('arrayZ').value=1;$('width').value=.32;$('dlpW').value=.32;$('wValue').textContent='0.32';applyDimensions(true)};
for(const id of ['surface','struts','nodes','box'])$(id).addEventListener('change',e=>{visible[id]=e.target.checked;group.traverse(o=>{if(o.name===id)o.visible=visible[id] && ((id!=='nodes'&&id!=='struts')||resultMode==='structure');if(id==='struts'&&o.name==='force-struts')o.visible=visible.struts})});
document.querySelectorAll('#resultMode button').forEach(b=>b.addEventListener('click',()=>{resultMode=b.dataset.result;syncResultUI();build();cameraView();if(resultMode!=='structure'){camera.position.sub(controls.target).multiplyScalar(.84).add(controls.target);controls.update()}}));
$('loadCase').addEventListener('change',()=>{if(resultMode!=='structure')build()});
$('beamMaterial').addEventListener('change',()=>{updateFrame();if(resultMode==='beam')build()});
$('beamScale').addEventListener('input',()=>{$('beamScaleValue').textContent=$('beamScale').value+'×';if(resultMode==='beam')build()});
document.querySelectorAll('#tiles button').forEach(btn=>btn.addEventListener('click',()=>{for(const id of ['arrayX','arrayY','arrayZ'])$(id).value=btn.dataset.n;applyDimensions(true)}));
$('iso').onclick=()=>cameraView();$('axis').onclick=()=>cameraView(true);$('reset').onclick=()=>cameraView();$('openPaper').onclick=()=>$('modal').classList.add('open');$('closePaper').onclick=()=>$('modal').classList.remove('open');$('modal').onclick=e=>{if(e.target===$('modal'))$('modal').classList.remove('open')};document.addEventListener('keydown',e=>{if(e.key==='Escape')$('modal').classList.remove('open')});
$('export').onclick=()=>{const data={description:'H=12 approximation with added face-contour reinforcement; fractional coordinates; each undirected edge joins a to b+offset. Not paper Fig.4 simulation data.',w:model.w,vertices:model.vertices,edges:model.edges};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='gyroid-H12-periodic-graph.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
syncRadiusBounds();cameraView();requestAnimationFrame(()=>setTimeout(rebuild,20));function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}animate();

// Compression post-processing deliberately remains independent from the beam FE.
$('openCompression').onclick=()=>$('compressionPanel').scrollIntoView({behavior:'smooth'});
let compressionReport=null, compressionRevision=0;
function clearCompressionChart(){const svg=$('cChart');svg.replaceChildren();const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x','250');t.setAttribute('y','115');t.setAttribute('text-anchor','middle');t.textContent='计算后显示力–位移曲线';svg.append(t)}
for(const id of ['compressionFile','cWidth','cDepth','cHeight','cMass','cDensity','cCutoff','cElasticStart','cElasticEnd','cPlateauStart','cPlateauEnd']) $(id).addEventListener('input',()=>{compressionRevision++;compressionReport=null;clearCompressionChart();$('cDownload').disabled=true;$('cResults').hidden=true;$('cStatus').textContent='输入已更改，请重新计算。'});
$('cCalculate').onclick=async()=>{
 const revision=++compressionRevision;compressionReport=null;clearCompressionChart();$('cDownload').disabled=true;$('cResults').hidden=true;$('cStatus').textContent='正在读取并计算…';
 try{
  const file=$('compressionFile').files[0];if(!file)throw Error('请先选择力–位移 CSV。');if(file.size>10*1024*1024)throw Error('CSV 超过 10 MB。');
  const number=(id,optional=false)=>{const s=$(id).value.trim();return optional&&s===''?null:s===''?NaN:Number(s)};
  const options={widthMm:number('cWidth'),depthMm:number('cDepth'),heightMm:number('cHeight'),massG:number('cMass'),solidDensity:number('cDensity',true),cutoffMm:number('cCutoff',true),elasticStart:number('cElasticStart',true),elasticEnd:number('cElasticEnd',true),plateauStart:number('cPlateauStart',true),plateauEnd:number('cPlateauEnd',true)};
  const text=await file.text();if(revision!==compressionRevision)return;const points=parseCompressionCSV(text);
  const result=compressionMetrics(points,options);compressionReport={description:'User-supplied single monotonic compression curve; not a beam FE prediction.',source:file.name,options,points,result};
  const m=result.metrics,fmt=(x,d=4)=>x==null?'未指定':Number(x).toPrecision(d);
  const cards=[['相对密度 ρ̄',fmt(m.relativeDensity)],['有效密度 ρeff',fmt(m.effectiveDensityGcm3)+' g/cm³'],['区间割线刚度 E',m.youngChordMPa==null?'未指定':fmt(m.youngChordMPa)+' MPa'],['比刚度 E/ρeff',m.specificStiffness==null?'未指定':fmt(m.specificStiffness)+' MPa/(g/cm³)'],['峰值压应力',fmt(m.peakStressMPa)+' MPa'],['比峰值压应力',fmt(m.specificPeakStrength)+' MPa/(g/cm³)'],['吸收能量 EA',fmt(m.absorbedEnergyJ)+' J'],['比吸能 SEA',fmt(m.SEA_J_g)+' J/g'],['压溃力效率 CFE',fmt(m.CFE)],['平台平均应力',m.plateauStressMPa==null?'未指定':fmt(m.plateauStressMPa)+' MPa'],['截断位移 / 应变',fmt(result.analysis.cutoffMm)+' mm / '+fmt(result.analysis.cutoffStrain)],['峰值 / 平均力',fmt(m.peakForceN)+' / '+fmt(m.meanForceN)+' N']];
  $('cResults').replaceChildren(...cards.map(([label,value])=>{const d=document.createElement('div');d.className='compression-metric';const t=document.createElement('span'),v=document.createElement('b');t.textContent=label;v.textContent=value;d.append(t,v);return d}));$('cResults').hidden=false;
  const svg=$('cChart');svg.replaceChildren();const ns='http://www.w3.org/2000/svg',node=(tag,attrs,text)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;svg.append(el);return el};
  let maxF=0;for(const p of points)maxF=Math.max(maxF,p.f);const maxU=points.at(-1).u,scaleF=maxF||1,X=u=>45+425*u/maxU,Y=f=>195-160*f/scaleF;
  node('path',{d:'M45 20V195H470',fill:'none',stroke:'#91a99b'});node('polyline',{points:points.map(p=>`${X(p.u).toFixed(2)},${Y(p.f).toFixed(2)}`).join(' '),fill:'none',stroke:'#387c9a','stroke-width':2});const cut=X(result.analysis.cutoffMm);node('line',{x1:cut,x2:cut,y1:20,y2:195,stroke:'#cf6559','stroke-dasharray':'5 4'});node('text',{x:250,y:225,'text-anchor':'middle'},`位移 u (mm)，末点 ${maxU.toPrecision(4)}`);node('text',{x:50,y:18},`力 F (N)，最大 ${maxF.toPrecision(4)}`);
  $('cStatus').textContent=`完成：${points.length} 个测点。刚度/平台仅对应所填区间；峰值、能量和 CFE 对应截断位移。${result.warnings.slice(3).join(' ')}`;$('cDownload').disabled=false;
 }catch(err){if(revision===compressionRevision)$('cStatus').textContent=err.message;}
};
$('cDownload').onclick=()=>{if(!compressionReport)return;const url=URL.createObjectURL(new Blob([JSON.stringify(compressionReport,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='compression-analysis.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
