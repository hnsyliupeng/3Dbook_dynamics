import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TAG_LABELS, TAG_COLORS } from './lessons.js';
import { clamp } from './models.js';

const C={ink:0x25434b,cream:0xf6f2e8,paper:0xe8e3d7,base:0xd8ddd2,teal:0x3f9d92,coral:0xdb806d,gold:0xdab16b,blue:0x7ca5b2,wood:0xc99160,woodLight:0xe6bc86,steel:0x879da0,white:0xfbf8ee,purple:0x9b91b7};
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const col=x=>new THREE.Color(x);
function mat(color, options={}) {return new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.02,...options});}
function makeBox(parent,w,h,d,xyz,color,tag=null,options={}) {
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,options));m.position.set(...xyz);m.castShadow=true;m.receiveShadow=true;
  if(tag)m.userData.tag=tag; parent.add(m);
  if(options.transparent!==true) {const edge=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:C.ink,transparent:true,opacity:.56}));m.add(edge);}
  return m;
}
function makeSphere(parent,r,xyz,color,tag=null,options={}) {
  const m=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),mat(color,options));m.position.set(...xyz);m.castShadow=true;m.receiveShadow=true;if(tag)m.userData.tag=tag;parent.add(m);return m;
}
function cyl(parent,r,h,xyz,color,tag=null,options={}) {
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),mat(color,options));m.position.set(...xyz);m.castShadow=true;m.receiveShadow=true;if(tag)m.userData.tag=tag;parent.add(m);return m;
}
function ring(parent,r,tube,xyz,color,tag=null,arc=Math.PI*2) {
  const m=new THREE.Mesh(new THREE.TorusGeometry(r,tube,8,48,arc),mat(color));m.position.set(...xyz);if(tag)m.userData.tag=tag;parent.add(m);return m;
}
function segment(parent,a,b,r,color,tag=null) {
  const g=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,10),mat(color)); if(tag)g.userData.tag=tag;parent.add(g);placeSegment(g,a,b,r);return g;
}
function placeSegment(m,a,b,r=.025) {
  const d=b.clone().sub(a),length=d.length();m.visible=length>1e-5;if(!m.visible)return;
  m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());m.scale.set(r,length,r);
}
const polylineLength=points=>points.slice(1).reduce((sum,p,i)=>sum+p.distanceTo(points[i]),0);
function dynamicRope(parent,count=20,color=C.ink,tag='constraint') {
  const parts=Array.from({length:count},()=>segment(parent,V(),V(0,.1,0),.02,color,tag));
  return points=>parts.forEach((part,i)=>{if(i<points.length-1)placeSegment(part,points[i],points[i+1],.022);else part.visible=false;});
}
function makeLine(parent,points,color=C.ink,tag=null,opacity=1) {
  const geom=new THREE.BufferGeometry().setFromPoints(points),material=new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity});
  const l=new THREE.Line(geom,material);if(tag)l.userData.tag=tag;parent.add(l);return l;
}
function setLine(line,points) {
  // Three.js updates only an existing buffer's capacity. Growing a two-point
  // line to a trajectory must allocate a correctly sized buffer once.
  const position=line.geometry.getAttribute('position');
  if(!position||position.count!==points.length){line.geometry.dispose();line.geometry=new THREE.BufferGeometry().setFromPoints(points);}
  else line.geometry.setFromPoints(points);
  line.geometry.computeBoundingSphere();
}
function lineInfo(line) {
  const a=line.geometry.getAttribute('position'),i=a.count-1;
  return {count:a.count,x:a.getX(i),y:a.getY(i),z:a.getZ(i)};
}
function arrow(parent,color,tag) {
  const root=new THREE.Group();root.userData.tag=tag;
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,12),mat(color));
  const head=new THREE.Mesh(new THREE.ConeGeometry(1,1,16),mat(color));root.add(shaft,head);parent.add(root);
  return {root,shaft,head,tag};
}
function setArrow(a,start,delta, fraction=1) {
  const length=delta.length()*clamp(fraction);a.root.visible=length>.025;
  if(!a.root.visible)return;
  a.root.position.copy(start);a.root.quaternion.setFromUnitVectors(V(0,1,0),delta.clone().normalize());
  const head=Math.min(.24,Math.max(.11,length*.24)),shaft=Math.max(.01,length-head);
  a.shaft.position.set(0,shaft/2,0);a.shaft.scale.set(.035,shaft,.035);
  a.head.position.set(0,shaft+head/2,0);a.head.scale.set(.11,head,.11);
}
function wheel(parent,center,r=.3,tag=null) {
  const root=new THREE.Group();root.position.copy(center);if(tag)root.userData.tag=tag;parent.add(root);
  const disc=cyl(root,r,.14,[0,0,0],C.steel);disc.rotation.x=Math.PI/2;
  const side=ring(root,r*.82,.025,[0,0,.085],C.ink);const hub=cyl(root,r*.17,.18,[0,0,0],C.gold);hub.rotation.x=Math.PI/2;
  for(let i=0;i<4;i++){const a=i*Math.PI/2;segment(root,V(0,0,.1),V(Math.cos(a)*r*.66,Math.sin(a)*r*.66,.1),.018,C.ink);}
  return root;
}
function grid(parent,opts={}) {
  const {y=.27,extent=3,step=.5}=opts;
  for(let x=-extent;x<=extent+1e-5;x+=step)makeLine(parent,[V(x,y,-extent*.7),V(x,y,extent*.7)],0xc4cbc1,null,.5);
  for(let z=-extent*.7;z<=extent*.7+1e-5;z+=step)makeLine(parent,[V(-extent,y,z),V(extent,y,z)],0xc4cbc1,null,.5);
}
function platform(parent,w=7,d=4.8) {
  makeBox(parent,w,.24,d,[0,.05,0],C.base);makeBox(parent,w-.14,.035,d-.14,[0,.19,0],C.paper);
  for(let x of [-w/2+.24,w/2-.24])for(let z of [-d/2+.24,d/2-.24]){const bolt=cyl(parent,.045,.025,[x,.22,z],C.steel);}
}
function support(parent,x,roller=false) {
  const shape=new THREE.Shape();shape.moveTo(-.32,0);shape.lineTo(.32,0);shape.lineTo(0,.58);shape.closePath();
  const m=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.38,bevelEnabled:false}),mat(C.blue));m.position.set(x,.31,-.19);parent.add(m);
  m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:C.ink})));
  if(roller){for(const dx of [-.18,.18]){const c=cyl(parent,.075,.45,[x+dx,.28,0],C.steel);c.rotation.x=Math.PI/2;}}
  else {makeBox(parent,.68,.1025,.5,[x,.25875,0],C.steel);const c=cyl(parent,.08,.44,[x,.58,0],C.gold);c.rotation.x=Math.PI/2;}
}
function crate(parent,xyz,tag,color=C.coral,scale=1) {
  const g=new THREE.Group();g.position.set(...xyz);if(tag)g.userData.tag=tag;parent.add(g);
  makeBox(g,.65*scale,.58*scale,.62*scale,[0,0,0],color);
  makeBox(g,.5*scale,.045*scale,.645*scale,[0,.13*scale,0],C.woodLight);
  makeBox(g,.5*scale,.045*scale,.645*scale,[0,-.13*scale,0],C.woodLight);
  return g;
}
function vehicle(parent,color,truck=false,tag) {
  const g=new THREE.Group();g.userData.tag=tag;parent.add(g);
  makeBox(g,truck?1.0:.8,.22,.5,[0,.19,0],color);
  if(truck){makeBox(g,.53,.48,.49,[-.19,.51,0],color);makeBox(g,.35,.34,.46,[.27,.42,0],C.white);}
  else {makeBox(g,.43,.25,.45,[-.03,.4,0],color);makeBox(g,.27,.13,.46,[.03,.44,0],C.blue);}
  for(const x of [-.28,.28])for(const z of [-.28,.28]){const w=cyl(g,.13,.08,[x,.12,z],C.ink);w.rotation.x=Math.PI/2;const hub=cyl(g,.05,.09,[x,.12,z*1.01],C.white);hub.rotation.x=Math.PI/2;}
  return g;
}


// The car is built from a profiled body, windows, lamps, bumpers and four
// independently rotating wheel assemblies rather than a box with painted wheels.
function roadCar(parent,color=C.teal,tag='car') {
  const g=new THREE.Group();g.userData.tag=tag;parent.add(g);
  const outline=new THREE.Shape();outline.moveTo(-.55,.14);outline.lineTo(.55,.14);outline.lineTo(.55,.28);outline.lineTo(.46,.34);outline.lineTo(.23,.36);outline.lineTo(.14,.52);outline.lineTo(-.23,.52);outline.lineTo(-.36,.35);outline.lineTo(-.53,.31);outline.closePath();
  const body=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:.48,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:2,steps:1}),mat(color,{metalness:.35,roughness:.34}));body.position.z=-.24;body.castShadow=true;body.receiveShadow=true;g.add(body);
  const glass=new THREE.Shape();glass.moveTo(-.30,.36);glass.lineTo(.20,.36);glass.lineTo(.12,.49);glass.lineTo(-.21,.49);glass.closePath();
  for(const z of [-.267,.267]){const pane=new THREE.Mesh(new THREE.ShapeGeometry(glass),mat(0x365d69,{metalness:.3,roughness:.28,side:THREE.DoubleSide}));pane.position.z=z;g.add(pane);segment(g,V(-.055,.36,z*1.01),V(-.06,.49,z*1.01),.008,C.cream);makeBox(g,.11,.018,.012,[-.22,.31,z],C.steel);}
  makeBox(g,.025,.07,.38,[.56,.235,0],C.white);makeBox(g,.025,.065,.38,[-.56,.235,0],0x9d5144);
  makeBox(g,.035,.035,.49,[.565,.145,0],C.steel);makeBox(g,.035,.035,.49,[-.565,.145,0],C.steel);
  const wheels=[];
  for(const x of [-.34,.34])for(const z of [-.27,.27]){
    const w=new THREE.Group();w.position.set(x,.13,z);g.add(w);wheels.push(w);
    const tire=cyl(w,.13,.075,[0,0,0],0x29353a,null,{roughness:.93});tire.rotation.x=Math.PI/2;
    const rim=cyl(w,.075,.08,[0,0,z>0?.014:-.014],0xb5c0bd,null,{metalness:.7,roughness:.3});rim.rotation.x=Math.PI/2;
    for(let k=0;k<4;k++){const a=k*Math.PI/2;segment(w,V(0,0,z>0?.058:-.058),V(Math.cos(a)*.055,Math.sin(a)*.055,z>0?.058:-.058),.007,C.ink);}
  }
  return {group:g,wheels};
}
function runnerFigure(parent,tag='runner') {
  const g=new THREE.Group();g.userData.tag=tag;parent.add(g);
  makeSphere(g,.105,[0,.92,0],0xdab494);makeBox(g,.24,.35,.16,[0,.65,0],C.teal);
  segment(g,V(-.09,.51,0),V(-.14,.13,0),.045,C.ink);segment(g,V(.09,.51,0),V(.16,.13,0),.045,C.ink);
  segment(g,V(-.12,.75,0),V(-.25,.48,0),.035,C.teal);segment(g,V(.12,.75,0),V(.26,.55,0),.035,C.teal);
  return g;
}


function ship(parent,color,tag) {
  const group=new THREE.Group();group.userData.tag=tag;parent.add(group);
  const outline=new THREE.Shape();outline.moveTo(-.48,-.22);outline.lineTo(.25,-.22);outline.lineTo(.52,0);outline.lineTo(.25,.22);outline.lineTo(-.48,.22);outline.closePath();
  const hull=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:.15,bevelEnabled:false}),mat(color));hull.rotation.x=-Math.PI/2;hull.castShadow=true;group.add(hull);
  hull.add(new THREE.LineSegments(new THREE.EdgesGeometry(hull.geometry),new THREE.LineBasicMaterial({color:C.ink})));
  makeBox(group,.35,.18,.31,[-.10,.24,0],C.white);makeBox(group,.22,.12,.26,[-.13,.39,0],color);
  const mast=segment(group,V(-.28,.22,0),V(-.28,.67,0),.018,C.ink);makeBox(group,.16,.12,.012,[-.20,.58,0],C.gold);
  return group;
}

export class MechanicsScene {
  constructor(container,canvas,labels,onTag){
    this.container=container;this.labels=labels;this.onTag=onTag;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.scene=new THREE.Scene();this.scene.background=col(0xf1efe7);
    this.camera=new THREE.PerspectiveCamera(35,1,.1,100);this.camera.position.set(9,7,11);
    this.controls=new OrbitControls(this.camera,canvas);this.controls.enableDamping=false;this.controls.enablePan=false;this.controls.minDistance=5;this.controls.maxDistance=24;this.controls.maxPolarAngle=Math.PI*.49;
    this.controls.addEventListener('change',()=>{if(this.currentState)this.update(this.currentState,this.currentTags);else this.render();});
    this.scene.add(new THREE.HemisphereLight(0xffffff,0xd9d2bf,2.0));
    const light=new THREE.DirectionalLight(0xffffff,2.5);light.position.set(-4,9,6);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-9;light.shadow.camera.right=9;light.shadow.camera.top=9;light.shadow.camera.bottom=-9;light.shadow.bias=-.0003;this.scene.add(light);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.14}));floor.rotation.x=-Math.PI/2;floor.position.y=-.075;floor.receiveShadow=true;this.scene.add(floor);
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    canvas.addEventListener('pointerdown',e=>{this.pointerStart=[e.clientX,e.clientY];});
    canvas.addEventListener('pointerup',e=>{if(!this.pointerStart||Math.hypot(e.clientX-this.pointerStart[0],e.clientY-this.pointerStart[1])>5)return;const rect=canvas.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);for(const hit of this.raycaster.intersectObjects(this.root?.children||[],true)){let obj=hit.object;while(obj&&!obj.userData.tag)obj=obj.parent;if(obj?.userData.tag){this.onTag(obj.userData.tag);break;}}});
    new ResizeObserver(()=>this.resize()).observe(container);this.resize();
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();if(this.currentState)this.update(this.currentState,this.currentTags);else this.render();}
  build(lesson,model,resetCamera=true){
    if(this.root){this.scene.remove(this.root);this.root.traverse(o=>{o.geometry?.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});}
    this.currentState=null;this.inspectGeometry=()=>({});this.labels.replaceChildren();this.labelDefs=[];this.root=new THREE.Group();this.scene.add(this.root);this.lesson=lesson;this.model=model;
    const root=this.root,q=model.parameters;
    const label=(tag,anchor,text=TAG_LABELS[tag])=>{const el=document.createElement('button');el.type='button';el.className='scene-label';el.dataset.tag=tag;el.textContent=text;el.style.setProperty('--tag-color',TAG_COLORS[tag]||'#497c7b');el.addEventListener('click',e=>{e.stopPropagation();this.onTag(tag)});this.labels.append(el);this.labelDefs.push({tag,anchor,el});};
    platform(root,lesson.kind==='energy'?8:7,4.8);
    let update=()=>{};
    if(lesson.kind==='vector') {
      grid(root,{extent:3.2});
      // Use one uniform scale for every arrow, fitted to the entire cumulative path.
      // Negative z-components remain above the platform, without changing the vector math.
      const vectors=model.sample(1).vectors,points=[[0,0,0]];
      for(const v of vectors){const prev=points.at(-1);points.push(prev.map((x,i)=>x+v[i]));}
      const lo=[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))),hi=[0,1,2].map(i=>Math.max(...points.map(p=>p[i])));
      const scale=Math.min(.54,5.2/Math.max(.01,hi[0]-lo[0]),3.4/Math.max(.01,hi[1]-lo[1]),3.0/Math.max(.01,hi[2]-lo[2]));
      const origin=V(-.5*(lo[0]+hi[0])*scale,.4-lo[2]*scale,-.5*(lo[1]+hi[1])*scale),map=v=>V(v[0]*scale,v[2]*scale,v[1]*scale);
      const axes=[V(1.5,0,0),V(0,0,1.5),V(0,1.5,0)];
      axes.forEach(a=>segment(root,origin,origin.clone().add(a),.012,0xa6b5ae,'position'));
      makeSphere(root,.07,origin.toArray(),C.ink);
      const vec=Array.from({length:5},(_,i)=>arrow(root,[C.teal,C.coral,C.gold,C.purple,C.blue][i],i===0?'A':i===1?'B':'C'));
      const resultant=arrow(root,0x315e80,'R');let A=origin.clone(),B=origin.clone(),Ce=origin.clone(),Re=origin.clone();
      // A pale construction line makes the initial, paused state meaningful.
      const preview=arrow(root,0xb7cdc3,'A');setArrow(preview,origin,map([q.ax,q.ay,q.az]));
      label('A',()=>vec[0].root.visible?A.clone().add(V(0,.3,0)):origin.clone().add(map([q.ax,q.ay,q.az])).add(V(0,.3,0)),'A');
      label('B',()=>vec[1].root.visible?B.clone().add(V(.1,.25,0)):null,'B');
      label('C',()=>vec[2].root.visible?Ce.clone().add(V(.35,.1,0)):null,'后续');
      label('R',()=>resultant.root.visible?Re.clone().add(V(-.35,.45,0)):null,'合矢量 R');
      update=s=>{let from=origin.clone();s.vectors.forEach((v,i)=>{const delta=map(v).multiplyScalar(s.weights[i]);setArrow(vec[i],from,delta);from=from.clone().add(delta);if(i===0)A=from.clone();if(i===1)B=from.clone();if(i>=2)Ce=from.clone();});for(let i=s.vectors.length;i<vec.length;i++)vec[i].root.visible=false;
        const d=map(s.R);setArrow(resultant,origin,d,s.showR);Re=origin.clone().add(d.multiplyScalar(s.showR));};
    } else if(lesson.kind==='vector-metric') {
      grid(root,{extent:3.0});const data=model.sample(1),[A,B]=[data.A,data.B],points=[[0,0,0],A,B];
      const lo=[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))),hi=[0,1,2].map(i=>Math.max(...points.map(p=>p[i])));
      const scale=Math.min(.7,4.8/Math.max(.01,hi[0]-lo[0]),3.3/Math.max(.01,hi[1]-lo[1]),2.6/Math.max(.01,hi[2]-lo[2]));
      const origin=V(-.5*(lo[0]+hi[0])*scale,.4-lo[2]*scale,-.5*(lo[1]+hi[1])*scale),map=v=>V(v[0]*scale,v[2]*scale,v[1]*scale);
      [V(1.3,0,0),V(0,0,1.3),V(0,1.3,0)].forEach(a=>segment(root,origin,origin.clone().add(a),.012,0xaab8ae,'geometry'));
      makeSphere(root,.075,origin.toArray(),C.ink);const a=arrow(root,C.teal,'A'),b=arrow(root,C.coral,'B');
      const u=map(A).normalize(),w=map(B).normalize(),axis=u.clone().cross(w).normalize(),radius=.66;
      const arcPoints=Array.from({length:33},(_,i)=>origin.clone().add(u.clone().applyAxisAngle(axis,data.angle*i/32).multiplyScalar(radius)));
      const arc=makeLine(root,arcPoints,C.purple,'angleMarker');
      label('A',()=>origin.clone().add(map(A)).add(V(.1,.25,0)),'矢量 A');
      label('B',()=>origin.clone().add(map(B)).add(V(-.05,.3,.1)),'参照 B');
      label('angleMarker',()=>arcPoints[16].clone().add(V(.05,.32,0)),'夹角 θ');
      update=s=>{setArrow(a,origin,map(s.A),clamp(s.p*4));setArrow(b,origin,map(s.B),clamp(s.p*4-1));arc.visible=s.p>=.75;};
    } else if(lesson.kind==='dot-cross') {
      grid(root,{extent:2.8});const d=model.sample(1),sum=d.A.map((v,i)=>v+d.B[i]);
      const points=[[0,0,0],d.A,d.B,sum,d.cross],lo=[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))),hi=[0,1,2].map(i=>Math.max(...points.map(p=>p[i])));
      const scale=Math.min(.62,4.8/Math.max(.01,hi[0]-lo[0]),3.5/Math.max(.01,hi[1]-lo[1]),3.1/Math.max(.01,hi[2]-lo[2]));
      const origin=V(-.5*(lo[0]+hi[0])*scale,.42-lo[2]*scale,.5*(lo[1]+hi[1])*scale),map=v=>V(v[0]*scale,v[2]*scale,-v[1]*scale);
      const A=origin.clone().add(map(d.A)),B=origin.clone().add(map(d.B)),AB=origin.clone().add(map(sum)),X=origin.clone().add(map(d.cross));
      [V(1.15,0,0),V(0,0,-1.15),V(0,1.15,0)].forEach(v=>segment(root,origin,origin.clone().add(v),.012,0x9bada4,'dot'));
      makeSphere(root,.065,origin.toArray(),C.ink);
      const geom=new THREE.BufferGeometry().setFromPoints([origin,A,AB,origin,AB,B]);geom.computeVertexNormals();
      const face=new THREE.Mesh(geom,mat(C.blue,{transparent:true,opacity:.23,side:THREE.DoubleSide,depthWrite:false}));face.userData.tag='area';root.add(face);
      const edges=[segment(root,A,AB,.013,C.blue,'area'),segment(root,B,AB,.013,C.blue,'area')];
      const a=arrow(root,C.teal,'A'),b=arrow(root,C.coral,'B'),c=arrow(root,C.purple,'cross');
      label('A',()=>A.clone().add(V(.1,.28,0)),'A');label('B',()=>B.clone().add(V(.15,.25,0)),'B');
      label('dot',()=>origin.clone().add(V(-.2,.4,.1)),'点积');label('cross',()=>X.clone().add(V(.05,.28,0)),'A × B');
      label('area',()=>origin.clone().add(map(sum).multiplyScalar(.5)).add(V(.3,.15,.2)),'张成面积');
      this.inspectGeometry=()=>({area:d.area,dot:d.dot,cross:d.cross,handedness:V(1,0,0).cross(V(0,0,-1)).dot(V(0,1,0))});
      update=s=>{setArrow(a,origin,map(s.A),Math.max(.01,clamp(s.p*4)));setArrow(b,origin,map(s.B),Math.max(.01,clamp(s.p*4)));setArrow(c,origin,map(s.cross),clamp(s.p*4-2));face.visible=s.p>=.5;edges.forEach(e=>e.visible=s.p>=.5);};
    } else if(lesson.kind==='chord-vector') {
      const data=model.sample(1),scale=4/data.diameter,pt=([x,y])=>V(x*scale-2,2.45+y*scale,0);
      const O=pt([0,0]),A=pt(data.A),B=pt(data.B),P=pt(data.P);
      // The source figure is a circle with OB as a diameter; all coordinates share one scale.
      ring(root,2,.026,[0,2.45,0],C.blue,'geometry');
      for(const x of [-1.45,1.45])segment(root,V(x,.3,-.10),V(x,.95,-.10),.025,0xaebcb0);
      segment(root,A,B,.025,C.ink,'chord');
      for(const [v,color,tag] of [[O,C.ink,null],[A,C.teal,'A'],[B,C.coral,'B'],[P,C.gold,'division']])makeSphere(root,.075,v.toArray(),color,tag);
      const avec=arrow(root,C.teal,'A'),bvec=arrow(root,C.coral,'B'),xvec=arrow(root,C.gold,'result');
      const oa=A.clone().sub(O),ob=B.clone().sub(O),op=P.clone().sub(O);
      // A right-angle marker follows from the diameter, rather than being drawn by eye.
      const u=O.clone().sub(A).normalize().multiplyScalar(.21),v=B.clone().sub(A).normalize().multiplyScalar(.21);
      makeLine(root,[A.clone().add(u),A.clone().add(u).add(v),A.clone().add(v)],0x6c8b82,'geometry');
      label('A',()=>A.clone().add(V(-.18,.35,.05)),'矢量 a');label('B',()=>B.clone().add(V(.12,.30,.05)),'矢量 b');
      label('chord',()=>A.clone().lerp(B,.58).add(V(.15,.35,.02)),'弦 AB');label('division',()=>P.clone().add(V(.12,.31,.08)),'分点 P');
      label('result',()=>O.clone().lerp(P,.56).add(V(-.12,.3,.15)),'分点矢量 x');
      this.inspectGeometry=()=>({circleAError:Math.hypot(A.x,A.y-2.45)-2,chordScale:scale,AP:A.distanceTo(P),PB:P.distanceTo(B),diameter:O.distanceTo(B)});
      update=s=>{setArrow(avec,O.clone().add(V(0,0,.10)),oa);setArrow(bvec,O.clone().add(V(0,0,.13)),ob);setArrow(xvec,O.clone().add(V(0,0,.24)),op,clamp(s.p*4-2));};
    } else if(lesson.kind==='quad-midpoint') {
      const data=model.sample(1),pt=([x,y])=>V(x,.55+y,0),[M,N,P,Q]=[data.M,data.N,data.P,data.Q].map(pt),ps=data.points.map(pt),O=pt(data.O);
      const shape=new THREE.Shape();shape.moveTo(M.x,M.y);for(const v of [N,P,Q])shape.lineTo(v.x,v.y);shape.closePath();
      const face=new THREE.Mesh(new THREE.ShapeGeometry(shape),mat(C.blue,{transparent:true,opacity:.14,side:THREE.DoubleSide,depthWrite:false}));face.position.z=-.09;face.userData.tag='geometry';root.add(face);
      for(let i=0;i<4;i++){const v=[M,N,P,Q];segment(root,v[i],v[(i+1)%4],.024,C.ink,'geometry');segment(root,ps[i],ps[(i+1)%4],.017,C.blue,'geometry');}
      makeLine(root,[ps[0],ps[2]],0x9db2a8,'geometry');makeLine(root,[ps[3],ps[1]],0x9db2a8,'geometry');
      ps.forEach(v=>makeSphere(root,.07,v.toArray(),C.blue,'geometry'));makeSphere(root,.09,O.toArray(),C.gold,'center');
      const b=arrow(root,C.coral,'B'),d=arrow(root,C.gold,'D'),x=arrow(root,C.teal,'result'),x2=arrow(root,C.teal,'result');
      label('geometry',()=>ps[0].clone().add(V(-.05,.3,0)),'中点连线');label('center',()=>O.clone().add(V(0,.34,.1)),'交点 O');
      label('B',()=>M.clone().lerp(N,.53).add(V(.1,.38,.1)),'上边 b');label('D',()=>P.clone().lerp(Q,.54).add(V(0,-.26,.1)),'底边 d');
      label('result',()=>ps[3].clone().lerp(O,.45).add(V(-.2,.32,.1)),'半段 x');
      this.inspectGeometry=()=>({midpointError:O.distanceTo(ps[3].clone().add(ps[1]).multiplyScalar(.5)),equalHalfError:Math.abs(O.distanceTo(ps[3])-O.distanceTo(ps[1]))});
      update=s=>{setArrow(b,M.clone().add(V(0,0,.12)),N.clone().sub(M),clamp(s.p*4-1));setArrow(d,P.clone().add(V(0,0,.12)),Q.clone().sub(P),clamp(s.p*4-1));
        setArrow(x,ps[3].clone().add(V(0,0,.23)),O.clone().sub(ps[3]),clamp(s.p*4-2));setArrow(x2,O.clone().add(V(0,0,.23)),ps[1].clone().sub(O),clamp(s.p*4-2));};
    } else if(lesson.kind==='triangle-centroid') {
      const data=model.sample(1),pt=([x,y])=>V(x,.55+y,0),[L,R,T,H,E,G]=[data.L,data.R,data.T,data.H,data.E,data.G].map(pt);
      const shape=new THREE.Shape();shape.moveTo(L.x,L.y);shape.lineTo(R.x,R.y);shape.lineTo(T.x,T.y);shape.closePath();
      const face=new THREE.Mesh(new THREE.ShapeGeometry(shape),mat(C.blue,{transparent:true,opacity:.14,side:THREE.DoubleSide,depthWrite:false}));face.position.z=-.09;face.userData.tag='geometry';root.add(face);
      for(const [a,b] of [[L,R],[R,T],[T,L]])segment(root,a,b,.023,C.ink,'geometry');
      makeLine(root,[H,T],0x80a39c,'geometry');makeLine(root,[L,E],0x80a39c,'geometry');
      for(const v of [H,E])makeSphere(root,.065,v.toArray(),C.blue,'geometry');makeSphere(root,.10,G.toArray(),C.gold,'center');
      const a=arrow(root,C.teal,'A'),b=arrow(root,C.coral,'B'),b2=arrow(root,C.coral,'B'),x=arrow(root,C.purple,'result');
      const bEnd=data.lambda===2?E:T;
      label('geometry',()=>H.clone().lerp(T,.66).add(V(-.2,.2,0)),'三角形中线');label('center',()=>G.clone().add(V(-.2,.35,.1)),'重心 G');
      label('A',()=>L.clone().lerp(T,.45).add(V(-.2,.32,.1)),'A');label('B',()=>R.clone().lerp(bEnd,.58).add(V(.25,.25,.1)),data.lambda===2?'半边 B':'整边 B');
      label('result',()=>H.clone().lerp(G,.65).add(V(.2,.18,.2)),'x');
      this.inspectGeometry=()=>({centroidMedianError:G.distanceTo(H.clone().lerp(T,1/3)),sideFraction:data.lambda===2?R.distanceTo(E)/R.distanceTo(T):1});
      update=s=>{setArrow(a,L.clone().add(V(0,0,.15)),T.clone().sub(L),clamp(s.p*4-1));setArrow(b,R.clone().add(V(0,0,.18)),bEnd.clone().sub(R),clamp(s.p*4-1));
        setArrow(b2,E.clone().add(V(0,0,.18)),T.clone().sub(E),data.lambda===2?clamp(s.p*4-1):0);setArrow(x,H.clone().add(V(0,0,.26)),G.clone().sub(H),clamp(s.p*4-2));};
    } else if(lesson.kind==='direction') {
      grid(root,{extent:3.0});const scale=.72,map=([x,y,z])=>V((x-2)*scale,.38+z*scale,(y-1)*scale),delta=v=>V(v[0]*scale,v[2]*scale,v[1]*scale);
      // The thin edges keep the source cuboid legible without hiding its diagonal.
      for(const x of [0,4])for(const y of [0,2])makeLine(root,[map([x,y,0]),map([x,y,2])],0x9fb2a7,'geometry',.8);
      for(const x of [0,4])for(const z of [0,2])makeLine(root,[map([x,0,z]),map([x,2,z])],0x9fb2a7,'geometry',.8);
      for(const y of [0,2])for(const z of [0,2])makeLine(root,[map([0,y,z]),map([4,y,z])],0x9fb2a7,'geometry',.8);
      const A=map([4,2,0]),B=map([0,0,2]);makeSphere(root,.11,A.toArray(),C.teal,'pointA');makeSphere(root,.11,B.toArray(),C.coral,'pointB');
      const raw=arrow(root,C.gold,'direction'),unit=arrow(root,C.purple,'unit'),result=arrow(root,C.teal,'result');
      label('pointA',()=>A.clone().add(V(.2,.45,.1)),'起点 A');label('pointB',()=>B.clone().add(V(-.25,.45,.1)),'终点 B');
      label('direction',()=>A.clone().add(B).multiplyScalar(.5).add(V(-.3,.35,.1)),'方向 d');label('unit',()=>A.clone().add(delta(model.sample(1).unit)).add(V(.15,.48,.12)),'单位方向');
      label('result',()=>A.clone().add(delta(model.sample(1).result)).add(V(.35,.25,.2)),'目标 P');
      update=s=>{setArrow(raw,A.clone().add(V(0,0,-.12)),delta(s.direction));setArrow(unit,A.clone().add(V(0,0,.04)),delta(s.unit),clamp(s.p*4-1));setArrow(result,A.clone().add(V(0,0,.18)),delta(s.result),clamp(s.p*4-2));};
    } else if(lesson.kind==='beam') {
      const data=model.sample(1),left=-2.35,right=1.175,load1=-1.175,load2=data.k===4?2.35:0;
      makeBox(root,4.85,.21,.48,[0,.995,0],C.wood);makeBox(root,4.8,.035,.51,[0,1.1175,0],C.woodLight);support(root,left);support(root,right,true);
      crate(root,[load1,1.3612,0],'W1',C.coral,.78);segment(root,V(load2,.89,0),V(load2,.716,0),.017,C.ink,'W2');crate(root,[load2,.53,0],'W2',C.gold,.64);
      const w1=arrow(root,C.coral,'W1'),w2=arrow(root,C.coral,'W2'),ra=arrow(root,C.teal,'RA'),rb=arrow(root,C.teal,'RB');
      const m=ring(root,.43,.025,[left,1.0,.38],C.gold,'moment',Math.PI*1.5);
      label('W1',()=>V(load1,2.65,.1),'W₁');label('W2',()=>V(load2,1.68,.2),'W₂');
      label('RA',()=>V(left,1.48,.28),Math.abs(data.RA)<1e-9?'R_A = 0':'R_A');label('RB',()=>V(right,1.48,.28),'R_B');label('moment',()=>V(left-.45,.9,.4),'力矩');
      this.inspectGeometry=()=>({load1X:load1,load2X:load2,supportAX:left,supportBX:right,visualK:(load2-left)/(load1-left),beamBottomY:.89,supportTopY:.89,loadBottomY:1.3612-.58*.78/2,beamTopY:1.135});
      update=s=>{setArrow(w1,V(load1,2.4,.02),V(0,-.85,0),clamp(s.p*4));setArrow(w2,V(load2,1.4,.22),V(0,-.63,0),clamp(s.p*4));
        const forceScale=1.2/Math.max(1,Math.abs(s.RA),Math.abs(s.RB));setArrow(ra,V(left,.89,.25),V(0,s.RA*forceScale,0),clamp(s.p*4-1));setArrow(rb,V(right,.89,.25),V(0,s.RB*forceScale,0),clamp(s.p*4-1));m.visible=s.p>=.5;};
    } else if(lesson.kind==='equilibrium') {
      makeBox(root,3.9,.20,1.5,[-1.0,1.05,0],C.wood);for(const x of [-2.6,.6])makeBox(root,.16,.75,.16,[x,.62,0],C.wood);
      const body=crate(root,[-1.65,1.45,0],'weight',C.coral,.95);
      const y=1.5+2.7*Math.tan(q.angle*Math.PI/180),wx=1.35;wheel(root,V(wx,y,0),.28,'tension');
      makeBox(root,.16,Math.max(.3,y-.25),.18,[wx,y/2+.12,-.45],C.steel);
      segment(root,V(-1.3,1.5,.05),V(wx,y,.05),.022,C.ink,'tension');segment(root,V(wx+.28,y,.05),V(wx+.28,1.35,.05),.022,C.ink,'tension');crate(root,[wx+.28,1.02,.05],'weight',C.gold,.72);
      const N=arrow(root,C.teal,'normal'),F=arrow(root,C.gold,'friction'),T=arrow(root,C.purple,'tension'),W=arrow(root,C.coral,'weight');
      label('normal',()=>V(-1.65,2.8,.2),'N');label('friction',()=>V(-3,1.35,.3),'fₛ');label('tension',()=>V(-.45,2.1,.2),'T');label('weight',()=>V(-1.65,.65,.4),'m₁g');
      update=s=>{setArrow(T,V(-1.65,1.45,.35),V(Math.cos(s.angle)*1.3,Math.sin(s.angle)*1.3,0),clamp(s.p*4));setArrow(W,V(-1.65,1.45,.35),V(0,-.92,0),clamp(s.p*4));setArrow(N,V(-1.65,1.45,.35),V(0,1.2,0),clamp(s.p*4-1));setArrow(F,V(-1.65,1.45,.35),V(-1.15,0,0),clamp(s.p*4-1));};
    } else if(lesson.kind==='ladder') {
      const theta=q.angle*Math.PI/180,wallX=-2.15,base=.25,L=4.2,top=V(wallX,base+L*Math.sin(theta),0),foot=V(wallX+L*Math.cos(theta),base,0);
      makeBox(root,.18,4.1,1.4,[wallX-.12,2.28,0],C.blue);
      for(const z of [-.27,.27])segment(root,V(top.x,top.y,z),V(foot.x,foot.y,z),.085,C.wood,'weight');
      for(let i=1;i<=8;i++){const u=i/9,x=top.x+(foot.x-top.x)*u,y=top.y+(foot.y-top.y)*u;segment(root,V(x,y,-.29),V(x,y,.29),.045,C.woodLight,'weight');}
      const mid=top.clone().add(foot).multiplyScalar(.5),W=arrow(root,C.coral,'weight'),NW=arrow(root,C.blue,'wall'),N=arrow(root,C.teal,'floor'),F=arrow(root,C.gold,'friction');
      const m=ring(root,.4,.025,[foot.x,foot.y+.3,.4],C.gold,'moment',Math.PI*1.45);
      label('wall',()=>top.clone().add(V(.6,.25,.1)),'N墙');label('weight',()=>mid.clone().add(V(0,-1,.3)),'W');label('floor',()=>foot.clone().add(V(.15,1,.25)),'N地');label('friction',()=>foot.clone().add(V(-1,.35,.3)),'fₛ');label('moment',()=>foot.clone().add(V(.5,.1,.3)),'转轴');
      update=s=>{const reveal=clamp(s.p*4);setArrow(W,mid.clone().add(V(0,0,.35)),V(0,-1.15,0),reveal);setArrow(NW,top.clone().add(V(0,0,.35)),V(1,0,0),reveal);setArrow(N,foot.clone().add(V(0,.05,.35)),V(0,1.3,0),reveal);setArrow(F,foot.clone().add(V(0,.25,.35)),V(-1,0,0),reveal);m.visible=s.p>=.5;};
    } else if(lesson.kind==='sphere-cylinder') {
      const s0=model.sample(0),scale=Math.min(4.7/(q.R+s0.dx+q.r),3/(q.R+q.r)),base=.29,cx=-(-q.R+s0.dx+q.r)*scale/2,cy=base+Math.max(0,(q.r-q.R)*scale);
      const O=V(cx,cy,0),S=V(cx+s0.dx*scale,cy+q.R*scale,0),contact=O.clone().lerp(S,q.R/(q.R+q.r));
      this.inspectGeometry=()=>({contactError:S.distanceTo(O)-(q.R+q.r)*scale,stringLevelError:S.y-(cy+q.R*scale),ballGroundClearance:S.y-q.r*scale-base});
      const cylinder=cyl(root,q.R*scale,1.15,O.toArray(),C.blue,'geometry');cylinder.rotation.x=Math.PI/2;
      const sphere=makeSphere(root,q.r*scale,S.toArray(),C.coral,'weight');
      const dot=makeSphere(root,.085,contact.clone().add(V(0,0,.58)).toArray(),C.gold,'contact');
      segment(root,V(cx,cy+q.R*scale,.55),V(S.x-q.r*scale,S.y,.55),.025,C.ink,'tension');
      const W=arrow(root,C.coral,'weight'),N=arrow(root,C.blue,'normal'),T=arrow(root,C.purple,'tension');
      label('geometry',()=>O.clone().add(V(-.25,.3,.65)),'圆心几何');label('contact',()=>contact.clone().add(V(-.2,.4,.7)),'接触点');
      label('weight',()=>S.clone().add(V(.3,-1.1,.7)),'mg');label('normal',()=>S.clone().add(V(.8,1,.7)),'N');label('tension',()=>S.clone().add(V(-1.4,.35,.7)),'T');
      update=s=>{const center=S.clone().add(V(0,0,q.r*scale+.1)),f=clamp(s.p*4-1);setArrow(W,center,V(0,-1.1,0),f);setArrow(T,center,V(-1.3,0,0),f);setArrow(N,center,V(s.cos,s.sin,0).multiplyScalar(1.45),f);};
    } else if(lesson.kind==='two-balls') {
      const data=model.sample(1),center=V(0,2.55,0),p2=([x,y],z=0)=>center.clone().add(V(x,y,z));
      const C1=p2(data.C1),C2=p2(data.C2),normal=v=>V(v[0],v[1],0),dir=normal(data.e);
      ring(root,data.container,.033,center.toArray(),C.ink,'geometry');
      makeSphere(root,data.r,C1.toArray(),C.teal,'ball1');makeSphere(root,data.r,C2.toArray(),C.coral,'ball2');
      const chord=makeLine(root,[C1,C2],C.gold,'angleMarker');chord.position.z=1.03;
      const arm1=makeLine(root,[center,C1],0x7d9e93,'geometry'),arm2=makeLine(root,[center,C2],0x7d9e93,'geometry');arm1.position.z=1.03;arm2.position.z=1.03;
      const n1=arrow(root,C.blue,'normal'),n2=arrow(root,C.blue,'normal'),r1=arrow(root,C.gold,'contact'),r2=arrow(root,C.gold,'contact'),w1=arrow(root,C.coral,'weight'),w2=arrow(root,C.coral,'weight');
      label('geometry',()=>center.clone().add(V(0,1.9,.15)),'圆心角 120°');label('ball1',()=>C1.clone().add(V(-.3,.5,.9)),'球 m₁');label('ball2',()=>C2.clone().add(V(.3,.5,.9)),'球 m₂');
      label('normal',()=>center.clone().add(V(0,.15,1.1)),'壁反力 N');label('contact',()=>C1.clone().lerp(C2,.5).add(V(.3,.32,1.1)),'球间作用力');
      label('weight',()=>C1.clone().add(V(-.2,-.8,1.1)),'重力');label('angleMarker',()=>C1.clone().lerp(C2,.42).add(V(0,-.22,1.15)),'倾角 α');
      this.inspectGeometry=()=>({ballContactError:C1.distanceTo(C2)-2*data.r,wall1Error:C1.distanceTo(center)+data.r-data.container,wall2Error:C2.distanceTo(center)+data.r-data.container,centerDot:(C1.clone().sub(center).normalize().dot(C2.clone().sub(center).normalize()))});
      update=s=>{const max=Math.max(s.N1,s.N2,s.contact,10*q.m1,10*q.m2),k=1.25/max,start1=C1.clone().add(V(0,0,1.06)),start2=C2.clone().add(V(0,0,1.06));
        const force=clamp(s.p*4-1);setArrow(n1,start1,normal(s.n1).multiplyScalar(s.N1*k),force);setArrow(n2,start2,normal(s.n2).multiplyScalar(s.N2*k),force);
        setArrow(r1,start1,dir.clone().multiplyScalar(-s.contact*k),force);setArrow(r2,start2,dir.clone().multiplyScalar(s.contact*k),force);
        setArrow(w1,start1,V(0,-10*q.m1*k,0),force);setArrow(w2,start2,V(0,-10*q.m2*k,0),force);};
    } else if(lesson.kind==='stacked-pulley') {
      // Two blocks on the same plane; the rope's upper and lower horizontal strands
      // are tangent to the same ideal pulley (one tension on both sides).
      makeBox(root,2.0,.7,1.15,[-1.75,.60,0],C.blue,'blockB');makeBox(root,1.0,.58,.88,[-1.9,1.24,0],C.coral,'blockA');
      const cx=1.35,cy=.945,r=.295,z=.18;wheel(root,V(cx,cy,z),r,'tension');
      const rope=[V(-1.4,cy+r,z),V(cx,cy+r,z)];for(let i=1;i<=32;i++){const a=Math.PI/2-i*Math.PI/32;rope.push(V(cx+r*Math.cos(a),cy+r*Math.sin(a),z));}rope.push(V(-.75,cy-r,z));
      for(let i=0;i<rope.length-1;i++)segment(root,rope[i],rope[i+1],.018,C.ink,'tension');
      const pull=arrow(root,C.coral,'appliedForce'),ttop=arrow(root,C.purple,'tension'),tbottom=arrow(root,C.purple,'tension');
      const ftop=arrow(root,C.gold,'frictionTop'),freaction=arrow(root,C.gold,'frictionTop'),fground=arrow(root,C.coral,'frictionGround');
      label('blockA',()=>V(-2.25,1.85,.1),'上块 m');label('blockB',()=>V(-2.65,.8,.1),'下块 M');
      label('appliedForce',()=>V(2.55,1.25,.1),'外力 F');label('tension',()=>V(.15,1.55,.2),'两段张力 T');
      label('frictionTop',()=>V(-1.8,1.38,.55),'层间摩擦');label('frictionGround',()=>V(-1.35,.40,.55),'地面摩擦');
      this.inspectGeometry=()=>({ropeLength:polylineLength(rope),upperTangentError:Math.abs(rope[1].y-(cy+r)),lowerTangentError:Math.abs(rope.at(-2).y-(cy-r))});
      update=s=>{const k=Math.min(1.25,s.T/32);
        setArrow(pull,V(cx+r+.05,cy,.28),V(k,0,0),clamp(s.p*4));
        setArrow(ttop,V(-1.75,1.24,.48),V(k,0,0),clamp(s.p*4-1));setArrow(tbottom,V(-1.3,.65,.53),V(k,0,0),clamp(s.p*4-1));
        setArrow(ftop,V(-1.8,1.10,.56),V(-k,0,0),clamp(s.p*4-1));setArrow(freaction,V(-1.8,1.02,.56),V(k,0,0),clamp(s.p*4-2));
        setArrow(fground,V(-1.55,.34,.57),V(-Math.min(1.45,s.groundRequired/30),0,0),clamp(s.p*4-2));};
    } else if(lesson.kind==='straight-car') {
      const data=model.sample(1),roadY=.34,left=-2.5,right=2.5,unit=5/q.distance;
      // Surface, verges, kerbs, and scale-consistent car on a real two-lane road.
      makeBox(root,6.9,.12,1.75,[0,.27,0],0x596365,'position');
      makeBox(root,6.9,.06,.18,[0,.34,-.96],0xb4b4a4);makeBox(root,6.9,.06,.18,[0,.34,.96],0xb4b4a4);
      for(let x=-3.1;x<3.2;x+=.65)makeBox(root,.32,.008,.025,[x,roadY+.003,0],0xe9e1c2);
      for(const z of [-.72,.72])makeBox(root,6.5,.009,.025,[0,roadY+.004,z],0xe8e5d8);
      for(const [x,color,tag] of [[left,C.teal,'start'],[right,C.coral,'finish']]){makeBox(root,.026,.012,1.64,[x,roadY+.01,0],color,tag);cyl(root,.065,.025,[x,roadY+.025,.75],color,tag);}
      const {group:car,wheels}=roadCar(root,C.teal,'car');const vehicleScale=4*unit/1.1;car.scale.setScalar(vehicleScale);
      const velocity=arrow(root,C.coral,'velocity');
      label('start',()=>V(left,.85,-.8),'A');label('finish',()=>V(right,.85,-.8),'B');
      label('position',()=>car.position.clone().add(V(0,.75*vehicleScale,.25)),'位置 x');label('car',()=>car.position.clone().add(V(-.45,.55*vehicleScale,.25)),'汽车');
      label('velocity',()=>car.position.clone().add(V(.55,.85*vehicleScale,.2)),'速度 v');
      this.inspectGeometry=()=>({carX:car.position.x,startX:left,endX:right,roadY,wheelBottomY:car.position.y,vehicleLength:1.1*vehicleScale,expectedLength:4*unit});
      update=s=>{car.position.set(left+s.x*unit,roadY,0);wheels.forEach(w=>w.rotation.z=-s.x/(4*.13/1.1));
        setArrow(velocity,car.position.clone().add(V(0,.66*vehicleScale,0)),V(.9,0,0),clamp(s.p*4));};
    } else if(lesson.kind==='level-projectile') {
      const d=model.sample(1),floor=.2675,range=Math.max(d.range,d.hasRunner?q.runnerStart:0),scale=4.9/range,left=-2.45;
      const to=(x,y)=>V(left+x*scale,floor+y*scale+.13,0),end=to(d.range,0),max=to(d.range/2,d.maxHeight);
      makeBox(root,6.5,.06,1.35,[0,.2375,0],0xcac5b1,'position');
      for(let x=-3;x<=3;x+=.5)makeBox(root,.23,.006,.018,[x,.271,.56],C.white);
      const landing=ring(root,.18,.025,[end.x,floor+.025,0],C.gold,'landing');landing.rotation.x=Math.PI/2;
      const path=makeLine(root,[to(0,0),to(.01,0)],C.coral,'trajectory'),ball=makeSphere(root,.13,to(0,0).toArray(),C.coral,'ball');
      const vel=arrow(root,C.teal,'velocity'),person=d.hasRunner?runnerFigure(root,'runner'):null;
      if(person)person.scale.setScalar(1.75*scale/1.025);
      label('ball',()=>ball.position.clone().add(V(0,.35,.12)),'小球');label('velocity',()=>ball.position.clone().add(V(.35,.58,0)),'速度 v');
      label('trajectory',()=>max.clone().add(V(0,.35,.05)),'轨迹');label('landing',()=>end.clone().add(V(.2,.45,.2)),'落点 R');
      if(person)label('runner',()=>person.position.clone().add(V(.3,.55,0)),'跑者');
      this.inspectGeometry=()=>({ballX:ball.position.x,ballY:ball.position.y,landingX:end.x,startX:left,runnerX:person?.position.x??null,scale,floor,ballRadius:.13,trail:lineInfo(path)});
      update=s=>{ball.position.copy(to(s.x,Math.max(0,s.y)));if(person)person.position.copy(to(s.runnerX,0).add(V(0,-.13,0)));
        setLine(path,Array.from({length:41},(_,i)=>{const t=s.t*i/40;return to(d.vx*t,Math.max(0,q.v0*Math.sin(q.angle*Math.PI/180)*t-.5*q.g*t*t));}));
        const direction=V(s.vx,s.vy,0).normalize().multiplyScalar(.85);setArrow(vel,ball.position,direction,clamp(s.p*4));};
    } else if(lesson.kind==='projectile-elevation') {
      const d=model.sample(1),floor=.2675,maxH=(d.v0*Math.sin(q.angle*Math.PI/180))**2/20,scale=Math.min(4.8/q.distance,2.6/maxH),left=-2.4,r=.13;
      const to=(x,y)=>V(left+x*scale,floor+y*scale+r,0),target=to(q.distance,q.height),top=floor+q.height*scale;
      makeBox(root,6.5,.06,1.5,[0,.2375,0],0xcac5b1,'position');
      makeBox(root,.8,q.height*scale,1.3,[target.x+.4,floor+q.height*scale/2,0],0xa9b4ac,'target');
      makeBox(root,.82,.04,1.34,[target.x+.4,top-.02,0],0xd6d6c6,'target');
      const path=makeLine(root,[to(0,0),to(.01,0)],C.coral,'trajectory'),ball=makeSphere(root,r,to(0,0).toArray(),C.coral,'ball');
      const start=ring(root,.16,.025,[left,floor+.018,0],C.teal,'launch');start.rotation.x=Math.PI/2;
      const velocity=arrow(root,C.teal,'velocity');
      label('launch',()=>V(left,floor+.45,.2),'A');label('target',()=>target.clone().add(V(.25,.4,.1)),'B（高台）');
      label('ball',()=>ball.position.clone().add(V(0,.35,.12)),'小球');label('trajectory',()=>to(q.distance*.48,maxH).add(V(.1,.35,0)),'轨迹');
      label('velocity',()=>ball.position.clone().add(V(.45,.5,0)),'速度 v');
      this.inspectGeometry=()=>({ballX:ball.position.x,ballY:ball.position.y,targetX:target.x,targetY:target.y,startX:left,platformTop:top,floor,ballRadius:r,scale,trail:lineInfo(path)});
      update=s=>{ball.position.copy(to(s.x,Math.max(0,s.y)));setLine(path,Array.from({length:41},(_,i)=>{const t=s.t*i/40;return to(d.vx*t,Math.max(0,(d.v0*Math.sin(q.angle*Math.PI/180))*t-5*t*t));}));
        setArrow(velocity,ball.position,V(s.vx,s.vy,0).normalize().multiplyScalar(.85),clamp(s.p*4));};
    } else if(lesson.kind==='projectiles-meet') {
      const d=model.sample(1),floor=.2075,scale=2.5/q.height,left=-.65,r=.12;
      const to=(x,y)=>V(left+x*scale,floor+y*scale+r,0),meeting=to(d.L,d.meetingY);
      makeBox(root,1.65,2.5,1.35,[left-.825,floor+1.25,0],0xabb8b0,'position');
      makeBox(root,1.7,.06,1.4,[left-.825,floor+2.47,0],0xdad8cb);
      const a=makeSphere(root,r,to(0,q.height).toArray(),C.teal,'ballA'),b=makeSphere(root,r,to(d.L,0).toArray(),C.coral,'ballB');
      const pa=makeLine(root,[a.position,a.position.clone().add(V(.001,0,0))],C.teal,'trajectory'),pb=makeLine(root,[b.position,b.position.clone().add(V(0,.001,0))],C.coral,'trajectory');
      const mark=ring(root,.18,.02,meeting.toArray(),C.gold,'meeting');
      label('ballA',()=>a.position.clone().add(V(-.18,.35,0)),'A');label('ballB',()=>b.position.clone().add(V(.2,.35,0)),'B');
      label('meeting',()=>meeting.clone().add(V(.3,.4,.1)),'相遇点');label('trajectory',()=>to(d.L*.5,q.height*.7).add(V(.4,.4,0)),'轨迹');
      this.inspectGeometry=()=>({ballAX:a.position.x,ballAY:a.position.y,ballBX:b.position.x,ballBY:b.position.y,meetingX:meeting.x,meetingY:meeting.y,startX:left,scale,floor,ballRadius:r,trailA:lineInfo(pa),trailB:lineInfo(pb)});
      update=s=>{a.position.copy(to(s.xA,Math.max(0,s.yA)));b.position.copy(to(s.xB,Math.max(0,s.yB)));
        setLine(pa,Array.from({length:31},(_,i)=>{const t=s.t*i/30;return to(q.v*t,q.height-5*t*t);}));
        setLine(pb,Array.from({length:31},(_,i)=>{const t=s.t*i/30;return to(d.L,2*q.v*t-5*t*t);}));};
    } else if(lesson.kind==='chase') {
      makeBox(root,6.6,.035,2.4,[0,.25,0],0x8a9992);for(let x=-3;x<3;x+=.8)makeBox(root,.4,.012,.035,[x,.275,0],C.white);
      const car=vehicle(root,C.teal,false,'car'),truck=vehicle(root,C.coral,true,'truck');
      const mark=segment(root,V(2.55,.27,-1.2),V(2.55,1.15,-1.2),.022,C.gold,'meeting');makeBox(root,.35,.24,.03,[2.72,1.05,-1.2],C.gold,'meeting');
      label('car',()=>car.position.clone().add(V(0,1,.0)),'汽车');label('truck',()=>truck.position.clone().add(V(0,1.1,0)),'卡车');label('meeting',()=>V(2.6,1.45,-1.2),'再次相遇');
      update=s=>{car.position.set(-2.55+5.1*s.carRatio,.29,.62);truck.position.set(-2.55+5.1*s.truckRatio,.29,-.62);};
    } else if(lesson.kind==='train') {
      const initial=model.sample(0),trainLength=initial.trainLength,scale=5.6/(q.length+2*trainLength),map=x=>-2.8+(x+trainLength)*scale;
      const entrance=map(0),exit=map(q.length),length=trainLength*scale,center=(entrance+exit)/2;
      makeBox(root,5.95,.09,1.6,[0,.29,0],C.woodLight);
      for(const z of [-.42,.42])segment(root,V(-2.9,.37,z),V(2.9,.37,z),.025,C.steel);
      for(let x=-2.8;x<2.9;x+=.32)makeBox(root,.08,.035,1.1,[x,.37,0],C.wood);
      makeBox(root,exit-entrance,.09,1.35,[center,1.52,0],C.blue,'tunnel',{transparent:true,opacity:.35,depthWrite:false});
      makeBox(root,exit-entrance,1.06,.06,[center,.99,-.65],C.blue,'tunnel',{transparent:true,opacity:.18,depthWrite:false});
      for(const x of [entrance,exit]){for(const z of [-.68,.68])makeBox(root,.11,1.2,.12,[x,.93,z],C.steel,'tunnel');makeBox(root,.13,.12,1.48,[x,1.56,0],C.steel,'tunnel');}
      const train=new THREE.Group();train.userData.tag='train';root.add(train);makeBox(train,length,.4,.64,[0,.72,0],C.coral);
      makeBox(train,Math.max(.05,length-.08),.1,.61,[0,.97,0],C.white);
      for(let i=0;i<Math.max(1,Math.floor(length/.35));i++){const x=-length*.4+(i+.5)*length*.8/Math.max(1,Math.floor(length/.35));makeBox(train,Math.min(.15,length*.15),.11,.655,[x,.78,0],C.blue);}
      for(const x of [-.3*length,.3*length])for(const z of [-.34,.34]){const w=cyl(train,.11,.07,[x,.48,z],C.ink);w.rotation.x=Math.PI/2;}
      const head=makeSphere(root,.10,[entrance,.91,1.02],C.gold,'observer');makeBox(root,.14,.35,.14,[entrance,.62,1.02],C.gold,'observer');
      label('train',()=>train.position.clone().add(V(0,1.25,.15)),'列车');label('tunnel',()=>V(center,1.8,0),'隧道');label('observer',()=>V(entrance,.95,1.15),'观察者');
      update=s=>{train.position.x=map((s.head+s.rear)/2);};
    } else if(lesson.kind==='ships') {
      makeBox(root,6.55,.055,4.05,[0,.255,0],0xb6d0cd);
      for(let x=-2.8;x<=2.8;x+=.8)for(let z=-1.65;z<=1.65;z+=.65)makeLine(root,[V(x,.288,z),V(x+.24,.288,z)],0xe2eddf,null,.85);
      const start=model.sample(0),end=model.sample(1),mid=model.sample(.5),xs=[start.xA,start.xB,end.xA,end.xB],ys=[start.yA,start.yB,end.yA,end.yB];
      const loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys),scale=Math.min(.22,5.35/Math.max(.01,hiX-loX),3.25/Math.max(.01,hiY-loY));
      const map=(x,y,h=.32)=>V((x-(loX+hiX)/2)*scale,h,-(y-(loY+hiY)/2)*scale);
      const A=ship(root,C.teal,'shipA'),B=ship(root,C.coral,'shipB');A.rotation.y=Math.PI/2;B.rotation.y=Math.atan2(-start.vBy,start.vBx)*-1;
      const travelA=makeLine(root,[map(start.xA,start.yA),map(start.xA,start.yA)],C.teal,'path',.8),travelB=makeLine(root,[map(start.xB,start.yB),map(start.xB,start.yB)],C.coral,'path',.8);
      const connection=segment(root,V(),V(1,0,0),.025,C.gold,'separation');
      const nearest=makeLine(root,[map(mid.xA,mid.yA,.34),map(mid.xB,mid.yB,.34)],C.purple,'closest');nearest.visible=false;
      const dotA=makeSphere(root,.07,map(mid.xA,mid.yA,.34).toArray(),C.purple,'closest'),dotB=makeSphere(root,.07,map(mid.xB,mid.yB,.34).toArray(),C.purple,'closest');
      const va=arrow(root,C.teal,'velocity'),vb=arrow(root,C.coral,'velocity');
      label('shipA',()=>A.position.clone().add(V(0,.9,0)),'A 船');label('shipB',()=>B.position.clone().add(V(0,.9,0)),'B 船');
      label('velocity',()=>A.position.clone().add(V(.6,.65,-.3)),'速度');label('separation',()=>A.position.clone().add(B.position).multiplyScalar(.5).add(V(0,.3,0)),'当前距离');
      label('closest',()=>mid.p<=this.currentState.p?map((mid.xA+mid.xB)/2,(mid.yA+mid.yB)/2,.8):null,'最近距离');
      update=s=>{A.position.copy(map(s.xA,s.yA));B.position.copy(map(s.xB,s.yB));
        setLine(travelA,[map(start.xA,start.yA,.31),map(s.xA,s.yA,.31)]);setLine(travelB,[map(start.xB,start.yB,.31),map(s.xB,s.yB,.31)]);
        placeSegment(connection,A.position.clone().add(V(0,.18,0)),B.position.clone().add(V(0,.18,0)),.025);
        nearest.visible=dotA.visible=dotB.visible=s.p>=.5;
        const da=V(s.vAx,0,-s.vAy).normalize().multiplyScalar(.8*q.vA/40),db=V(s.vBx,0,-s.vBy).normalize().multiplyScalar(.8*q.vB/30);
        setArrow(va,A.position.clone().add(V(0,.5,0)),da);setArrow(vb,B.position.clone().add(V(0,.5,0)),db);};
    } else if(lesson.kind==='variable-velocity') {
      makeBox(root,6.2,.12,1.35,[0,.42,0],C.woodLight);
      for(let x=-2.5;x<=2.51;x+=.5)makeBox(root,.025,.025,.35,[x,.495,-.4],C.steel);
      const cart=vehicle(root,C.teal,false,'position');const vel=arrow(root,C.teal,'velocity'),acc=arrow(root,C.coral,'accel');
      segment(root,V(2.4,.5,-.65),V(2.4,1.35,-.65),.024,C.gold,'turn');makeBox(root,.34,.23,.03,[2.23,1.25,-.65],C.gold,'turn');
      label('position',()=>cart.position.clone().add(V(0,.85,.1)),'位置 x');label('velocity',()=>cart.position.clone().add(V(.45,1.2,.1)),'速度 v');label('accel',()=>cart.position.clone().add(V(-.7,.85,.1)),'加速度 a');label('turn',()=>V(2.4,1.65,-.65),'折返点');
      update=s=>{cart.position.set(-2.4+4.8*clamp(s.x/s.maxX),.51,0);const o=cart.position.clone().add(V(0,.65,.25));setArrow(vel,o,V(Math.sign(s.v)*Math.min(1.35,Math.abs(s.v)*.19),0,0));setArrow(acc,o.clone().add(V(0,.38,0)),V(-Math.min(1.1,Math.abs(s.a)*.12),0,0),clamp(s.p*4-1));};
    } else if(lesson.kind==='cubic-velocity') {
      const data=model.sample(1),map=x=>-2.5+5*(x-data.minX)/(data.maxX-data.minX);
      makeBox(root,5.7,.13,.75,[0,.36,0],C.woodLight,'position');
      for(let i=0;i<=10;i++){const x=-2.5+i*.5;segment(root,V(x,.44,-.25),V(x,.44,.25),.012,0xa9977d);}
      const car=vehicle(root,C.teal,false,'car'),marker=cyl(root,.075,.035,[0,.46,0],C.blue,'position');
      const turn=V(map(data.maxX),.49,0);makeSphere(root,.09,turn.toArray(),C.gold,'turn');const velocity=arrow(root,C.coral,'velocity');
      label('car',()=>car.position.clone().add(V(0,.85,0)),'小车');label('position',()=>marker.position.clone().add(V(-.15,.52,.28)),'当前 x');
      label('turn',()=>turn.clone().add(V(.1,.4,.22)),'速度为零');label('velocity',()=>car.position.clone().add(V(.0,1.35,.05)),'速度 v');
      this.inspectGeometry=()=>({visualX:car.position.x,markerX:marker.position.x,minX:data.minX,maxX:data.maxX});
      update=s=>{const x=map(s.x);car.position.set(x,.46,0);marker.position.x=x;
        const len=Math.min(1.4,Math.abs(s.v)/35);setArrow(velocity,V(x,1.45,.15),V(Math.sign(s.v)*len,0,0),clamp(s.p*4));};
    } else if(lesson.kind==='projectile') {
      const g=10,duration=model.duration,range=.5*q.ax*duration**2,maxY=q.y0+q.vy*q.vy/(2*g),scale=3.7/Math.max(range,maxY),origin=V(-2.4,.22+.19,0);
      const pt=t=>V(origin.x+.5*q.ax*t*t*scale,origin.y+(q.y0+q.vy*t-.5*g*t*t)*scale,0);
      for(let i=0;i<5;i++)makeLine(root,[V(-2.5,.3+i*.85,-.05),V(2.9,.3+i*.85,-.05)],0xc4cbc1,null,.55);
      const ghost=makeLine(root,Array.from({length:81},(_,i)=>pt(duration*i/80)),0xc3b99f,'path',.8);
      const trail=makeLine(root,[pt(0),pt(0)],C.gold,'path');const ball=makeSphere(root,.19,pt(0).toArray(),C.coral,'position');
      const vel=arrow(root,C.teal,'velocity'),acc=arrow(root,C.gold,'accel');
      segment(root,V(origin.x,.3,0),V(origin.x,q.y0*scale+.3,0),.012,C.blue,'position');
      label('position',()=>ball.position.clone().add(V(.15,.4,0)),'位置');label('velocity',()=>ball.position.clone().add(V(.6,.35,0)),'速度 v');label('accel',()=>ball.position.clone().add(V(.5,-.55,0)),'加速度');label('path',()=>V(-.8,3.8,0),'轨迹');
      this.inspectGeometry=()=>({ballX:ball.position.x,ballY:ball.position.y,ballRadius:.19,floor:.22,trail:lineInfo(trail)});
      update=s=>{ball.position.copy(pt(s.t));setLine(trail,Array.from({length:81},(_,i)=>pt(s.t*i/80)));const v=V(s.vx,s.vy,0);if(v.length()>0)v.setLength(Math.min(1.25,.35+Math.hypot(s.vx,s.vy)*.025));setArrow(vel,ball.position,v);const a=V(q.ax,-g,0).normalize().multiplyScalar(.8);setArrow(acc,ball.position.clone().add(V(0,0,.15)),a,clamp(s.p*4-1));};
    } else if(lesson.kind==='barrier') {
      const L=q.L,g=10,base=.3,r=.07,scale=.96/L,origin=V(-2.5,base+r,0),height=3*L*scale;
      const point=t=>{const s=model.sample(t/model.duration);return V(origin.x+s.x*scale,origin.y+s.y*scale,0);};
      const wall=makeBox(root,L*scale,height,.8,[origin.x+2.5*L*scale,base+height/2,0],C.blue,'obstacle');
      const A=V(origin.x+2*L*scale,base+height,0),B=V(origin.x+3*L*scale,base+height,0);
      makeSphere(root,.065,A.clone().add(V(0,.03,.5)).toArray(),C.teal,'pointA');makeSphere(root,.065,B.clone().add(V(0,.03,.5)).toArray(),C.coral,'pointB');
      const ghost=makeLine(root,Array.from({length:121},(_,i)=>point(model.duration*i/120)),0xc1c9bc,'path',.8),trail=makeLine(root,[point(0),point(0)],C.gold,'path');
      const ball=makeSphere(root,r,point(0).toArray(),C.coral,'position'),vel=arrow(root,C.teal,'velocity'),acc=arrow(root,C.gold,'accel');
      label('pointA',()=>A.clone().add(V(-.25,.4,.55)),'A');label('pointB',()=>B.clone().add(V(.25,.4,.55)),'B');label('obstacle',()=>V(origin.x+2.5*L*scale,base+height*.52,.55),'障碍物');
      label('path',()=>V(origin.x+3.9*L*scale,base+2.7*L*scale,.1),'轨迹');label('velocity',()=>ball.position.clone().add(V(.5,.35,.2)),'速度');label('position',()=>ball.position.clone().add(V(-.25,.25,.2)),'位置');
      this.inspectGeometry=()=>({ballX:ball.position.x,ballY:ball.position.y,trail:lineInfo(trail)});
      update=s=>{ball.position.copy(point(s.t));setLine(trail,Array.from({length:81},(_,i)=>point(s.t*i/80)));const v=V(s.vx,s.vy,0).normalize().multiplyScalar(.95);setArrow(vel,ball.position.clone().add(V(0,0,.15)),v);setArrow(acc,ball.position.clone().add(V(0,0,.2)),V(0,-.7,0));};
    } else if(lesson.kind==='wall-bounce') {
      // The sphere is a visual marker: positions are computed for a point projectile.
      const hit=model.events[0].time,end=model.sample(1),apex=q.h+(q.v0*Math.sin(q.angle*Math.PI/180))**2/(2*9.8),maxX=Math.max(q.d,end.landingX);
      const scale=Math.min(.95,4.8/Math.max(.01,maxX),3.0/Math.max(.01,apex)),r=.16,origin=V(-2.45,.30+r,0);
      const point=t=>{const s=model.sample(t/model.duration);return V(origin.x+s.x*scale,origin.y+s.y*scale,0);};
      const height=apex*scale+.55;
      makeBox(root,.18,height,1.1,[origin.x-r-.09,.28+height/2,0],C.blue,'wallSurface');
      makeBox(root,5.5,.055,1.6,[.25,.25,0],C.woodLight);
      const section=(from,to)=>Array.from({length:31},(_,i)=>point(from+(to-from)*i/30));
      makeLine(root,section(0,hit),0xb9c8bd,'path',.75);makeLine(root,section(hit,model.duration),0xd3c0aa,'path',.75);
      const incoming=makeLine(root,[point(0),point(0)],C.teal,'path'),outgoing=makeLine(root,[point(hit),point(hit)],C.gold,'path');
      const ball=makeSphere(root,r,point(0).toArray(),C.coral,'position'),mark=makeSphere(root,.085,point(hit).toArray(),C.gold,'impact');
      const vel=arrow(root,C.teal,'velocity'),acc=arrow(root,C.gold,'accel');
      label('wallSurface',()=>V(origin.x-r-.1,height*.6,.2),'光滑墙');label('impact',()=>point(hit).add(V(-.15,.35,.05)),'撞墙点');
      label('position',()=>ball.position.clone().add(V(.15,.45,.1)),'位置');label('velocity',()=>ball.position.clone().add(V(.65,.3,.1)),'速度');label('path',()=>V(.6,2.8,.1),'轨迹');label('accel',()=>ball.position.clone().add(V(.4,-.5,.1)),'重力加速度');
      this.inspectGeometry=()=>({ballX:ball.position.x,ballY:ball.position.y,trail:lineInfo(this.currentState?.bounced?outgoing:incoming)});
      update=s=>{ball.position.copy(point(s.t));setLine(incoming,section(0,Math.min(s.t,hit)));outgoing.visible=s.bounced;if(s.bounced)setLine(outgoing,section(hit,s.t));
        const direction=V(s.vx,s.vy,0).normalize().multiplyScalar(Math.min(1.15,.25+Math.hypot(s.vx,s.vy)*.09));setArrow(vel,ball.position.clone().add(V(0,0,.2)),direction);
        setArrow(acc,ball.position.clone().add(V(0,0,.15)),V(0,-.75,0));};
    } else if(lesson.kind==='friction') {
      makeBox(root,6.3,.14,1.8,[0,.42,0],C.woodLight);const block=crate(root,[-2.15,.83,0],'force',C.coral,1.15);
      const F=arrow(root,C.coral,'force'),W=arrow(root,C.coral,'weight'),N=arrow(root,C.blue,'normal'),fr=arrow(root,C.gold,'friction'),a=arrow(root,C.teal,'accel');
      label('force',()=>block.position.clone().add(V(1.3,.6,.3)),'推力 F');label('friction',()=>block.position.clone().add(V(-1,.0,.3)),'摩擦 f');label('normal',()=>block.position.clone().add(V(0,1.4,.3)),'N');label('weight',()=>block.position.clone().add(V(.3,-.6,.3)),'mg');label('accel',()=>block.position.clone().add(V(.85,1.1,.3)),'a');
      update=s=>{block.position.x=-2.15+4.1*(s.x/3);const o=block.position.clone().add(V(0,0,.4));setArrow(F,o,V(Math.max(.1,Math.min(1.5,q.F/35)),0,0),clamp(s.p*4));setArrow(W,o,V(0,-.8,0),clamp(s.p*4));setArrow(N,o,V(0,1.1,0),clamp(s.p*4));setArrow(fr,o,V(-Math.max(.1,Math.min(1.2,s.friction/25)),0,0),clamp(s.p*4-1));setArrow(a,o.clone().add(V(0,.65,0)),V(Math.min(1.25,s.a*.25),0,0),clamp(s.p*4-2));};
    } else if(lesson.kind==='incline') {
      const th=q.angle*Math.PI/180,L=4.15,base=.29,foot=V(-2.1,base,0),tangent=V(Math.cos(th),Math.sin(th),0),normal=V(-Math.sin(th),Math.cos(th),0),top=foot.clone().add(tangent.clone().multiplyScalar(L));
      const shape=new THREE.Shape();shape.moveTo(foot.x,base);shape.lineTo(top.x,base);shape.lineTo(top.x,top.y);shape.closePath();const wedge=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.9,bevelEnabled:false}),mat(C.blue));wedge.position.z=-.45;root.add(wedge);wedge.add(new THREE.LineSegments(new THREE.EdgesGeometry(wedge.geometry),new THREE.LineBasicMaterial({color:C.ink})));
      const box=crate(root,[0,0,0],'position',C.coral,.9);box.rotation.z=th;
      const W=arrow(root,C.coral,'weight'),N=arrow(root,C.blue,'normal'),F=arrow(root,C.gold,'friction'),A=arrow(root,C.teal,'accel');
      label('position',()=>box.position.clone().add(V(.2,.55,.1)),'木块');label('weight',()=>box.position.clone().add(V(.3,-1,.2)),'mg');label('normal',()=>box.position.clone().add(normal.clone().multiplyScalar(1.25)),'N');label('friction',()=>box.position.clone().add(tangent.clone().multiplyScalar(1.05)),'摩擦 f');label('accel',()=>box.position.clone().sub(tangent.clone().multiplyScalar(1.1)),'加速度 a');
      update=s=>{const d=.1+.8*clamp(s.s/3);box.position.copy(top.clone().sub(tangent.clone().multiplyScalar(L*d)).add(normal.clone().multiplyScalar(.29)));const o=box.position.clone().add(V(0,0,.45));setArrow(W,o,V(0,-1.1,0),clamp(s.p*4));setArrow(N,o,normal.clone().multiplyScalar(1.05),clamp(s.p*4));setArrow(F,o,tangent.clone().multiplyScalar(.85),clamp(s.p*4-1));setArrow(A,o,tangent.clone().multiplyScalar(-Math.min(1,s.a*.22)),clamp(s.p*4-2));};
    } else if(lesson.kind==='atwood') {
      const cx=0,cy=3.23,r=.46,left=-r,right=r,baseY=1.48,half=.28;
      // A metal laboratory frame and pulley bracket; the cord follows the rim.
      makeBox(root,3.5,.12,.65,[0,.2675,0],C.steel);
      for(const x of [-1.45,1.45]){makeBox(root,.11,3.52,.18,[x,2.1,-.14],C.steel);makeBox(root,.42,.08,.38,[x,.3675,-.14],C.ink);}
      makeBox(root,3.05,.14,.22,[0,3.88,-.14],C.steel);makeBox(root,.16,.58,.21,[0,3.55,-.14],C.steel);
      const pulley=wheel(root,V(cx,cy,0),r,'rope');
      const makeWeight=(tag,color)=>{const g=new THREE.Group();g.userData.tag=tag;root.add(g);makeBox(g,.5,.56,.44,[0,0,0],color,null,{metalness:.4,roughness:.4});
        const hook=ring(g,.08,.018,[0,.32,0],C.steel);return g;};
      const m1=makeWeight('m1',0x5a9e92),m2=makeWeight('m2',0xc58470),rope=dynamicRope(root,17,0x4b514e,'rope');
      const t1=arrow(root,C.purple,'tension'),t2=arrow(root,C.purple,'tension'),w1=arrow(root,C.coral,'weight1'),w2=arrow(root,C.coral,'weight2'),acc=arrow(root,C.gold,'accel');
      let ropePoints=[];
      label('m1',()=>m1.position.clone().add(V(-.35,.2,.3)),'m₁');label('m2',()=>m2.position.clone().add(V(.35,.2,.3)),'m₂');
      label('rope',()=>V(0,cy+r+.34,0),'轻绳');label('tension',()=>V(-.95,2.4,.3),'张力 T');
      label('weight1',()=>m1.position.clone().add(V(-.5,-.35,.25)),'m₁g');label('weight2',()=>m2.position.clone().add(V(.5,-.35,.25)),'m₂g');
      label('accel',()=>m2.position.clone().add(V(.55,.65,.1)),Math.abs(model.sample(0).a)<1e-9?'a = 0':'加速度 a');
      this.inspectGeometry=()=>({ropeLength:polylineLength(ropePoints),leftMassY:m1.position.y,rightMassY:m2.position.y,baseY,ropeLeftX:ropePoints[0]?.x,ropeRightX:ropePoints.at(-1)?.x,pulleyRadius:r,pulleyAngle:pulley.rotation.z});
      update=s=>{m1.position.set(left,baseY+s.displacement,0);m2.position.set(right,baseY-s.displacement,0);pulley.rotation.z=-s.displacement/r;
        ropePoints=[V(left,m1.position.y+half+.08,0),V(left,cy,0),...Array.from({length:13},(_,i)=>{const a=Math.PI*(1-(i+1)/14);return V(cx+r*Math.cos(a),cy+r*Math.sin(a),0);}),V(right,cy,0),V(right,m2.position.y+half+.08,0)];rope(ropePoints);
        const scale=1.2/Math.max(s.weight1,s.weight2,s.T),f=clamp(s.p*4-1);
        setArrow(t1,m1.position.clone().add(V(0,.28,.25)),V(0,s.T*scale,0),f);setArrow(t2,m2.position.clone().add(V(0,.28,.25)),V(0,s.T*scale,0),f);
        setArrow(w1,m1.position.clone().add(V(-.13,0,.25)),V(0,-s.weight1*scale,0),f);setArrow(w2,m2.position.clone().add(V(.13,0,.25)),V(0,-s.weight2*scale,0),f);
        setArrow(acc,m2.position.clone().add(V(.38,0,0)),V(0,-Math.sign(s.a)*.8,0),clamp(s.p*4-2));};
    } else if(lesson.kind==='two-incline') {
      const th=q.angle*Math.PI/180,run=2.45,base=.3,height=run*Math.tan(th),L=run/Math.cos(th),radius=.23;
      const leftDir=V(-Math.cos(th),Math.sin(th),0),rightDir=V(Math.cos(th),Math.sin(th),0),leftN=V(Math.sin(th),Math.cos(th),0),rightN=V(-Math.sin(th),Math.cos(th),0),origin=V(0,base,0);
      for(const side of [-1,1]){const shape=new THREE.Shape();shape.moveTo(0,base);shape.lineTo(side*run,base);shape.lineTo(side*run,base+height);shape.closePath();
        const wedge=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.85,bevelEnabled:false}),mat(C.blue));wedge.position.z=-.43;root.add(wedge);wedge.add(new THREE.LineSegments(new THREE.EdgesGeometry(wedge.geometry),new THREE.LineBasicMaterial({color:C.ink})));}
      const A=crate(root,[0,0,0],'blockA',C.teal,.85),B=crate(root,[0,0,0],'blockB',C.coral,.95);A.rotation.z=-th;B.rotation.z=th;
      const topL=origin.clone().add(leftDir.clone().multiplyScalar(L)),topR=origin.clone().add(rightDir.clone().multiplyScalar(L));
      const cL=topL.clone().add(leftN.clone().multiplyScalar(.28)),cR=topR.clone().add(rightN.clone().multiplyScalar(.28));
      const wheelL=wheel(root,cL,radius,'constraint'),wheelR=wheel(root,cR,radius,'constraint');
      let ropeLength=0;this.inspectGeometry=()=>({ropeLength});
      const rope=dynamicRope(root,20,C.ink,'tension'),T=arrow(root,C.purple,'tension'),FA=arrow(root,C.gold,'friction'),FB=arrow(root,C.gold,'friction'),N=arrow(root,C.blue,'normal'),acc=arrow(root,C.teal,'accel');
      label('blockA',()=>A.position.clone().add(V(-.3,.65,.15)),'A · m');label('blockB',()=>B.position.clone().add(V(.4,.65,.15)),'B · 4m');
      label('constraint',()=>V(0,base+height+.85,.1),'等距绳长');label('tension',()=>A.position.clone().add(leftDir.clone().multiplyScalar(.9)).add(V(0,.5,.15)),'张力 T');
      label('normal',()=>B.position.clone().add(rightN.clone().multiplyScalar(.95)),'N');label('friction',()=>B.position.clone().add(rightDir.clone().multiplyScalar(.9)).add(V(0,.3,.15)),'摩擦');label('accel',()=>B.position.clone().sub(rightDir.clone().multiplyScalar(.9)).add(V(0,.1,.15)),'加速度');
      update=s=>{wheelL.rotation.z=wheelR.rotation.z=.72*s.s/radius;A.position.copy(origin.clone().add(leftDir.clone().multiplyScalar(.4*L+.72*s.s)).add(leftN.clone().multiplyScalar(.28)));B.position.copy(origin.clone().add(rightDir.clone().multiplyScalar(.78*L-.72*s.s)).add(rightN.clone().multiplyScalar(.28)));
        const off=V(0,0,.10),pts=[A.position.clone().add(leftN.clone().multiplyScalar(radius)).add(off),cL.clone().add(leftN.clone().multiplyScalar(radius)).add(off)];
        for(let i=1;i<=4;i++){const a=Math.PI/2-th+th*i/4;pts.push(cL.clone().add(V(radius*Math.cos(a),radius*Math.sin(a),.1)));}
        pts.push(cR.clone().add(V(0,radius,.1)));for(let i=1;i<=4;i++){const a=Math.PI/2+th*i/4;pts.push(cR.clone().add(V(radius*Math.cos(a),radius*Math.sin(a),.1)));}pts.push(B.position.clone().add(rightN.clone().multiplyScalar(radius)).add(off));ropeLength=polylineLength(pts);rope(pts);
        const oa=A.position.clone().add(V(0,0,.4)),ob=B.position.clone().add(V(0,0,.4));setArrow(T,oa,leftDir.clone().multiplyScalar(1.0));
        setArrow(FA,oa,leftDir.clone().multiplyScalar(-Math.min(.85,s.fA*.12)),clamp(s.p*4));setArrow(FB,ob,rightDir.clone().multiplyScalar(Math.min(.95,s.fB*.08)),clamp(s.p*4));
        setArrow(N,ob,rightN.clone().multiplyScalar(.95),clamp(s.p*4));setArrow(acc,ob.clone().add(V(0,0,.15)),rightDir.clone().multiplyScalar(-Math.min(1,s.a*.3)),clamp(s.p*4-2));};
    } else if(lesson.kind==='pulley') {
      makeBox(root,4.1,.18,1.35,[-1.3,3.65,0],C.wood);for(const x of [-2.8,-.05])makeBox(root,.17,3.3,.18,[x,1.94,0],C.wood);
      const A=crate(root,[-2.4,4.05,0],'blockA',C.teal,.85);const fixed=wheel(root,V(1.05,3.83,0),.28,'constraint');
      const moving=wheel(root,V(1.33,2.7,0),.28,'constraint');const B=crate(root,[1.61,1.96,0],'blockB',C.coral,.75);
      let mainRopeLength=0,lowerRopeLength=0;this.inspectGeometry=()=>({mainRopeLength,lowerRopeLength});
      const mainRope=dynamicRope(root,16,C.ink,'tension'),lowerRope=dynamicRope(root,18,C.ink,'constraint');
      const T=arrow(root,C.purple,'tension'),acc=arrow(root,C.gold,'accel');
      label('blockA',()=>A.position.clone().add(V(0,.65,.2)),'A');label('blockB',()=>B.position.clone().add(V(.35,.1,.2)),'B');label('constraint',()=>moving.position.clone().add(V(-.2,.45,.15)),'动滑轮');label('tension',()=>V(.05,4.18,.1),'主绳 T');label('accel',()=>B.position.clone().add(V(.5,-.5,.2)),'a_B = 2a_A');
      update=s=>{A.position.x=-2.4+s.sA;moving.position.y=2.7-s.sA;B.position.y=1.96-s.sB;fixed.rotation.z=-s.sA/.28;moving.rotation.z=s.sA/.28;
        const up=[V(A.position.x+.3,4.11,.1),V(1.05,4.11,.1)];for(let i=1;i<=6;i++){const a=Math.PI/2-i*Math.PI/12;up.push(V(1.05+.28*Math.cos(a),3.83+.28*Math.sin(a),.1));}up.push(V(1.33,moving.position.y,.1));mainRopeLength=polylineLength(up);mainRope(up);
        const low=[V(1.05,.32,.1),V(1.05,moving.position.y,.1)];for(let i=1;i<=8;i++){const a=Math.PI-i*Math.PI/8;low.push(V(1.33+.28*Math.cos(a),moving.position.y+.28*Math.sin(a),.1));}low.push(V(1.61,B.position.y+.23,.1));lowerRopeLength=polylineLength(low);lowerRope(low);
        setArrow(T,V(A.position.x,4.08,.35),V(1.0,0,0),clamp(s.p*4));setArrow(acc,B.position.clone().add(V(0,0,.35)),V(0,-.8,0),clamp(s.p*4-2));};
    } else if(lesson.kind==='loaded-pulley') {
      const r=.30,moveX=-.8,fixedX=-.2,top=4.10;
      makeBox(root,4.7,.18,1.0,[0,4.48,0],C.wood);for(const x of [-2.15,2.15])makeBox(root,.16,4.2,.16,[x,2.35,-.15],C.wood);
      const A=crate(root,[moveX,1.30,0],'blockA',C.teal,.78),B=crate(root,[fixedX+r,1.72,0],'blockB',C.coral,.78);
      const fixed=wheel(root,V(fixedX,top,0),r,'constraint'),moving=wheel(root,V(moveX,2.42,0),r,'constraint');
      let ropeLength=0;this.inspectGeometry=()=>({ropeLength});
      const rope=dynamicRope(root,28,C.ink,'tension'),hanger=segment(root,V(),V(0,1,0),.024,C.steel,'blockA');
      const force=arrow(root,C.coral,'appliedForce'),tension=arrow(root,C.purple,'tension'),acc=arrow(root,C.gold,'accel');
      label('blockA',()=>A.position.clone().add(V(-.4,.05,.1)),'A');label('blockB',()=>B.position.clone().add(V(.45,.05,.1)),'B');
      label('constraint',()=>moving.position.clone().add(V(-.5,.35,.2)),'动滑轮');label('tension',()=>B.position.clone().add(V(.45,.75,.15)),'绳张力 T');
      label('appliedForce',()=>moving.position.clone().add(V(.25,.85,.2)),'外力 F');label('accel',()=>A.position.clone().add(V(-.55,-.55,.2)),'加速度');
      update=s=>{A.position.y=1.30-s.sA;moving.position.y=2.42-s.sA;B.position.y=1.72+s.sB;fixed.rotation.z=2*s.sA/r;moving.rotation.z=-s.sA/r;
        const pts=[V(moveX-r,4.40,.1),V(moveX-r,moving.position.y,.1)];for(let i=1;i<=10;i++){const a=Math.PI+Math.PI*i/10;pts.push(V(moveX+r*Math.cos(a),moving.position.y+r*Math.sin(a),.1));}
        pts.push(V(fixedX-r,top,.1));for(let i=1;i<=10;i++){const a=Math.PI-Math.PI*i/10;pts.push(V(fixedX+r*Math.cos(a),top+r*Math.sin(a),.1));}pts.push(V(fixedX+r,B.position.y+.22,.1));ropeLength=polylineLength(pts);rope(pts);
        placeSegment(hanger,V(moveX,moving.position.y-r,.12),V(moveX,A.position.y+.22,.12),.024);
        setArrow(force,moving.position.clone().add(V(0,.28,.3)),V(0,Math.min(1,q.F*.04),0));setArrow(tension,B.position.clone().add(V(0,.1,.35)),V(0,.85,0),clamp(s.p*4));
        setArrow(acc,A.position.clone().add(V(0,0,.35)),V(0,-Math.sign(s.aA)*Math.min(.9,Math.abs(s.aA)*.2),0),clamp(s.p*4-2));};
    } else if(lesson.kind==='energy') {
      const angle=q.angle*Math.PI/180,height=Math.min(2.5,2.9*Math.tan(angle)),run=height/Math.tan(angle),foot=-.3,start=foot-run;
      const shape=new THREE.Shape();shape.moveTo(start,.28);shape.lineTo(foot,.28);shape.lineTo(start,.28+height);shape.closePath();const ramp=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.8,bevelEnabled:false}),mat(C.blue));ramp.position.z=-.4;ramp.userData.tag='height';root.add(ramp);ramp.add(new THREE.LineSegments(new THREE.EdgesGeometry(ramp.geometry),new THREE.LineBasicMaterial({color:C.ink})));
      makeBox(root,3.5,.12,.8,[1.45,.33,0],C.woodLight);const ball=makeSphere(root,.22,[start,.5+height,0],C.coral,'velocity');
      const VEL=arrow(root,C.teal,'velocity'),fr=arrow(root,C.gold,'friction');segment(root,V(start-.25,.3,0),V(start-.25,.3+height,0),.018,C.gold,'height');
      const barK=makeBox(root,.25,1,.2,[2.15,1.0,-.9],C.teal,'energy');const barU=makeBox(root,.25,1,.2,[2.5,1.0,-.9],C.blue,'energy');const barH=makeBox(root,.25,1,.2,[2.85,1.0,-.9],C.gold,'energy');
      label('height',()=>V(start-.3,1.4,-.1),'高度 h');label('velocity',()=>ball.position.clone().add(V(.4,.45,.15)),'速度');label('friction',()=>V(1.3,.85,.2),'摩擦');label('energy',()=>V(2.5,2.1,-.9),'K / U / 耗散');
      update=s=>{if(s.atRamp){const u=s.s/s.sRamp;ball.position.set(start+run*u,.5+height*(1-u),0);}else ball.position.set(foot+3.1*s.x/s.stop,.5,0);
        setArrow(VEL,ball.position.clone().add(V(0,0,.25)),s.atRamp?V(.8,-.8*Math.tan(angle),0):V(.85,0,0),clamp(s.v/2));setArrow(fr,ball.position.clone().add(V(0,0,.25)),V(-.7,0,0),s.atRamp?0:1);
        [[barK,s.K],[barU,s.U],[barH,s.heat]].forEach(([bar,n])=>{const h=Math.max(.01,1.5*n/s.E);bar.scale.y=h;bar.position.y=.42+h/2;});};
    } else if(lesson.kind==='rod') {
      makeBox(root,.25,4.0,1.2,[-2.3,2.25,0],C.blue);const hinge=V(-2.1,4.05,0);const pin=cyl(root,.24,.55,hinge.toArray(),C.steel,'inertia');pin.rotation.x=Math.PI/2;
      const bar=new THREE.Group();bar.position.copy(hinge);bar.userData.tag='inertia';root.add(bar);makeBox(bar,3.65,.22,.4,[1.82,0,0],C.woodLight);for(let x=.45;x<3.6;x+=.65)makeBox(bar,.035,.24,.42,[x,0,0],C.wood);
      const W=arrow(root,C.coral,'weight'),vel=arrow(root,C.teal,'angular'),torque=ring(root,.52,.03,[hinge.x,hinge.y,.36],C.gold,'torque',Math.PI*1.45);
      let mid=hinge.clone(),tip=hinge.clone();label('inertia',()=>hinge.clone().add(V(-.15,.5,.1)),'固定端');label('weight',()=>mid.clone().add(V(.2,-.8,.1)),'mg');label('torque',()=>hinge.clone().add(V(.65,.5,.4)),'力矩 τ');label('angular',()=>tip.clone().add(V(.2,-.5,.15)),'角速度 ω');
      update=s=>{bar.rotation.z=-s.angle;mid=hinge.clone().add(V(1.82*Math.cos(s.angle),-1.82*Math.sin(s.angle),.28));tip=hinge.clone().add(V(3.65*Math.cos(s.angle),-3.65*Math.sin(s.angle),.28));setArrow(W,mid,V(0,-1,0),clamp(s.p*4));const d=V(-Math.sin(s.angle),-Math.cos(s.angle),0).multiplyScalar(Math.min(1.15,s.omega*.5));setArrow(vel,tip,d,clamp(s.p*4-2));torque.visible=s.p>.03;};
    } else if(lesson.kind==='centroid') {
      const to=(x,y)=>V(-2.2+x*1.05,.45+y*1.0,0);for(let x=0;x<=4;x++)makeLine(root,[to(x,0),to(x,3)],0xc1cbc0,'position',.8);for(let y=0;y<=3;y++)makeLine(root,[to(0,y),to(4,y)],0xc1cbc0,'position',.8);
      const pts=[[0,0],[0,3],[2,2],[4,0],[4,3]],masses=[3,4,3,2,q.m5],colors=[C.coral,C.teal,C.purple,C.blue,C.gold];
      const circles=pts.map(([x,y],i)=>{const n=cyl(root,.12+Math.sqrt(masses[i])*.08,.15,to(x,y).toArray(),colors[i],'mass',{transparent:true,opacity:.25});n.rotation.x=Math.PI/2;return n;});
      const center=makeSphere(root,.14,to(0,0).toArray(),C.teal,'center');const cross1=segment(root,V(),V(.1,0,0),.025,C.ink,'center'),cross2=segment(root,V(),V(0,.1,0),.025,C.ink,'center');
      label('mass',()=>to(4,3).add(V(.25,.4,.1)),'质点 m_i');label('position',()=>to(0,3).add(V(-.45,.3,.1)),'坐标');label('center',()=>center.position.clone().add(V(.2,.5,.1)),'质心 G');
      update=s=>{circles.forEach((o,i)=>o.material.opacity=.22+.78*s.weights[i]);center.visible=!!s.cg;cross1.visible=!!s.cg;cross2.visible=!!s.cg;if(s.cg){center.position.copy(to(s.cg.x,s.cg.y));center.position.z=.2;placeSegment(cross1,center.position.clone().add(V(-.22,0,.02)),center.position.clone().add(V(.22,0,.02)),.02);placeSegment(cross2,center.position.clone().add(V(0,-.22,.02)),center.position.clone().add(V(0,.22,.02)),.02);}};
    } else if(lesson.kind==='cone') {
      const scale=3.35/Math.max(q.h,2*q.r),H=q.h*scale,R=q.r*scale,base=.27;
      const cone=new THREE.Mesh(new THREE.ConeGeometry(R,H,48,1),mat(C.blue,{transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}));cone.position.set(0,base+H/2,0);cone.userData.tag='mass';root.add(cone);
      ring(root,R,.025,[0,base,0],C.ink,'mass').rotation.x=Math.PI/2;segment(root,V(0,base,0),V(0,base+H,0),.018,C.ink,'center');
      const slice=cyl(root,1,.065,[0,base,0],C.gold,'slice',{transparent:true,opacity:.82});const cg=makeSphere(root,.13,[0,base,0],C.teal,'center');
      label('slice',()=>slice.position.clone().add(V(R*.55,.15,0)),'薄圆盘');label('center',()=>cg.position.clone().add(V(.25,.22,0)),'累计质心');label('mass',()=>V(-R,base+H*.45,0),'圆锥');
      update=s=>{slice.position.y=base+H*s.u;slice.scale.set(Math.max(.001,R*(1-s.u)),1,Math.max(.001,R*(1-s.u)));cg.position.y=base+s.zc*scale;};
    } else if(lesson.kind==='disk') {
      const R=2.0,base=.42;const disk=cyl(root,R,.28,[0,base,0],C.blue,'mass',{transparent:true,opacity:.5});const filled=cyl(root,1,.07,[0,base+.18,0],C.teal,'inertia',{transparent:true,opacity:.62});const scan=ring(root,1,.03,[0,base+.24,0],C.gold,'ring');scan.rotation.x=Math.PI/2;
      segment(root,V(0,base-.15,0),V(0,2.9,0),.035,C.ink,'inertia');const axle=cyl(root,.12,.45,[0,base+.1,0],C.gold,'inertia');
      label('mass',()=>V(-1.55,.85,.45),'圆盘 M');label('ring',()=>V(1.35,.95,.45),'积分圆环');label('inertia',()=>V(0,2.9,0),'中心转轴');
      update=s=>{filled.scale.set(Math.max(.001,R*s.u),1,Math.max(.001,R*s.u));scan.scale.setScalar(Math.max(.001,R*s.u));};
    }
    this.updateScene=update;
    if(resetCamera){const targetY=lesson.kind==='ships'?.28:['chord-vector','two-balls','atwood','projectiles-meet','dot-cross'].includes(lesson.kind)?2.15:['pulley','loaded-pulley','rod','quad-midpoint','triangle-centroid'].includes(lesson.kind)?2.1:lesson.kind==='ladder'?1.8:1.4;this.controls.target.set(0,targetY,0);if(lesson.kind==='ships')this.camera.position.set(.01,13,6);else if(lesson.kind==='atwood'||lesson.kind==='projectiles-meet')this.camera.position.set(6,5.4,8.2);else if(['straight-car','level-projectile','projectile-elevation','dot-cross'].includes(lesson.kind))this.camera.position.set(7,5.6,8.9);else if(lesson.kind==='direction')this.camera.position.set(8,6.8,-10.2);else if(lesson.kind==='vector')this.camera.position.set(8,6.8,-10.2);else if(lesson.kind==='vector-metric')this.camera.position.set(8,7.2,10.4);else if(['pulley','loaded-pulley','rod','ladder','equilibrium','wall-bounce','two-incline','sphere-cylinder','barrier','train','chord-vector','quad-midpoint','triangle-centroid','stacked-pulley','two-balls','atwood','dot-cross','straight-car','level-projectile','projectile-elevation','projectiles-meet'].includes(lesson.kind))this.camera.position.set(8.2,6.8,10.6);else this.camera.position.set(8,6.6,10.2);this.controls.update();}
  }
  update(state,tags=[]){
    if(!this.root)return;this.currentState=state;this.currentTags=tags;this.updateScene(state);const active=new Set(tags);
    this.root.traverse(o=>{if(!o.isMesh||!o.material?.emissive)return;let p=o;while(p&&!p.userData.tag)p=p.parent;const selected=p&&active.has(p.userData.tag);o.material.emissive.setHex(selected?0x17352e:0x000000);o.material.emissiveIntensity=selected?.35:0;});
    // Place labels near their projected anchors without covering each other or the scene controls.
    const width=this.container.clientWidth,height=this.container.clientHeight,placed=[];
    for(const d of [...this.labelDefs].sort((a,b)=>Number(active.has(b.tag))-Number(active.has(a.tag)))){
      d.el.classList.toggle('active',active.has(d.tag));const p=d.anchor();if(!p){d.el.style.display='none';continue;}
      const v=p.clone().project(this.camera);if(v.z>1||v.z< -1){d.el.style.display='none';continue;}d.el.style.display='';
      const w=d.el.offsetWidth||36,h=d.el.offsetHeight||22,x0=(v.x*.5+.5)*width,y0=(-v.y*.5+.5)*height;
      const candidates=[[0,0],[0,-h-5],[0,h+5],[-w-6,0],[w+6,0],[0,-2*h-10],[0,2*h+10],[-w-6,-h-5],[w+6,-h-5]];
      let best=null,bestPenalty=Infinity;
      for(const [dx,dy] of candidates){const x=Math.max(w/2+4,Math.min(width-w/2-4,x0+dx)),y=Math.max(h/2+47,Math.min(height-h/2-30,y0+dy));
        const box={left:x-w/2-2,right:x+w/2+2,top:y-h/2-2,bottom:y+h/2+2};
        const overlap=placed.reduce((sum,b)=>sum+Math.max(0,Math.min(box.right,b.right)-Math.max(box.left,b.left))*Math.max(0,Math.min(box.bottom,b.bottom)-Math.max(box.top,b.top)),0);
        const penalty=overlap*1000+Math.hypot(x-x0,y-y0);if(penalty<bestPenalty){best={x,y,box};bestPenalty=penalty;}if(overlap===0)break;
      }
      d.el.style.left=`${best.x}px`;d.el.style.top=`${best.y}px`;placed.push(best.box);
    }
    this.render();
  }
  render(){if(!this.renderer||!this.scene||!this.camera)return;this.renderer.render(this.scene,this.camera);}
}
