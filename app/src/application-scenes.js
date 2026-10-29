import * as THREE from 'three';
import { buildDeepApplicationScene } from './deep-application-scenes.js';

// Programmatic, offline 3D apparatus for the source-specific applications.
// None of the objects supplies physics: every position comes from model.sample().
export function buildApplicationScene({lesson,model,root,label,h}) {
  const deep=buildDeepApplicationScene({lesson,model,root,label,h});
  if(deep)return deep;
  const {C,V,mat,makeBox,makeSphere,cyl,ring,segment,placeSegment,makeLine,setLine,arrow,setArrow,wheel,crate,dynamicRope,polylineLength}=h;
  const q=model.parameters,kind=lesson.kind;
  let update,inspect=()=>({}),camera={target:[0,1.5,0],position:[8,6.8,10.8]};
  const flatLine=(points,color,tag)=>makeLine(root,points,color,tag);
  // Show labels for the current equation only, so hardware is not buried under tags.
  const mark=(tag,p,text)=>label(tag,()=>h.isTagActive(tag)?p():null,text);
  const bolt=(parent,x,y,z)=>{const b=cyl(parent,.035,.035,[x,y,z],0xe0bf80);b.rotation.x=Math.PI/2;return b;};
  const ropeFrom=(points,color,tag,r=.018)=>points.slice(1).map((p,i)=>segment(root,points[i],p,r,color,tag));
  const arrowAt=(color,tag,start,delta)=>{const a=arrow(root,color,tag);setArrow(a,start,delta);return a;};

  if(kind==='cabled-beam'){
    camera={target:[0,2.0,0],position:[5.8,4.8,8.8]};
    const x0=-2.45,L=4.9,end=x0+L,beamY=1.15,top=beamY+.14,angle=q.angle*Math.PI/180,r=.23;
    makeBox(root,.28,3.55,.72,[x0-.21,1.98,0],0x9caeaa,'hinge');
    for(let y=.58;y<3.5;y+=.48)makeBox(root,.29,.025,.75,[x0-.21,y,0],0xc2c9c2);
    const beam=makeBox(root,L,.28,.48,[0,beamY,0],0xc59362,'weight',{metalness:.2,roughness:.55});
    makeBox(root,L-.15,.045,.5,[0,beamY+.08,0],0xdcb987);
    const pivot=cyl(root,.18,.65,[x0,beamY,0],0xc8ad73,'hinge');pivot.rotation.x=Math.PI/2;bolt(root,x0,beamY,.35);
    const start=V(x0+L/4,top,.01),Q=V(start.x+1.9,top+1.9*Math.tan(angle),.01);
    const c1=Q.clone().add(V(r*Math.sin(angle),-r*Math.cos(angle),0));
    const c2=V(end-r,3.63,0),ceilingY=4.22;
    makeBox(root,5.45,.13,.85,[0,ceilingY,0],0x9caeaa);makeBox(root,5.45,.04,.9,[0,ceilingY+.085,0],0xd4d8cf);
    [c1,c2].forEach(c=>segment(root,V(c.x,ceilingY,0),V(c.x,c.y,0),.033,C.steel));
    const w1=wheel(root,c1,r,'ropeUpper'),w2=wheel(root,c2,r,'ropeLower');
    const arc1=Array.from({length:17},(_,i)=>{const a=(angle+Math.PI/2)*(1-i/16);return V(c1.x+r*Math.cos(a),c1.y+r*Math.sin(a),.08)});
    const heavyY=c1.y-.25,heavyH=.29;
    const rope1=[V(start.x,start.y,.08),...arc1,V(c1.x+r,heavyY+heavyH/2,.08)];ropeFrom(rope1,0x4f5d5b,'ropeUpper');
    const heavy=makeBox(root,.33,heavyH,.34,[c1.x+r,heavyY,0],0xb16b5b,'ropeUpper');
    const arc2=Array.from({length:19},(_,i)=>{const a=Math.PI*i/18;return V(c2.x+r*Math.cos(a),c2.y+r*Math.sin(a),.08)});
    const smallY=c2.y-.68,smallH=.33;
    const rope2=[V(end,top,.08),...arc2,V(c2.x-r,smallY+smallH/2,.08)];ropeFrom(rope2,0x4f5d5b,'ropeLower');
    makeBox(root,.31,smallH,.34,[c2.x-r,smallY,0],0xd8aa6a,'ropeLower');
    const weight=arrowAt(C.coral,'weight',V(.05,2.0,.65),V(0,-.72,0));
    const rx=arrowAt(C.teal,'hinge',V(x0,beamY,.67),V(-.65,0,0));
    const ry=arrowAt(C.teal,'hinge',V(x0,beamY,.67),V(0,.52,0));
    const inclineForce=arrow(root,C.purple,'ropeUpper'),endForce=arrow(root,C.coral,'ropeLower');
    const moment=ring(root,.42,.025,[x0,beamY,.55],C.gold,'moment',Math.PI*1.65);moment.rotation.z=-Math.PI*.4;
    mark('hinge',()=>V(x0-.2,beamY+.42,.5),'铰点 B');mark('weight',()=>V(.05,2.1,.65),'梁重 G');
    mark('ropeUpper',()=>V(c1.x-.1,c1.y+.4,.2),'斜绳 · 2W');mark('ropeLower',()=>V(c2.x+.22,c2.y+.4,.2),'端绳 · W');
    mark('moment',()=>V(x0+.28,beamY-.35,.6),'B 点力矩');
    update=s=>{ // Static apparatus; the force construction is progressively revealed.
      const reveal=x=>Math.max(0,Math.min(1,x));
      setArrow(weight,V(.05,2.02,.65),V(0,-.67*(q.load/500),0),reveal(4*s.p));
      setArrow(inclineForce,V(start.x,top,.55),V(Math.cos(angle),Math.sin(angle),0).multiplyScalar(.9*s.T1/400),reveal(4*s.p-1));
      setArrow(endForce,V(end,top,.55),V(0,.8*s.T2/200,0),reveal(4*s.p-1));
      setArrow(rx,V(x0,beamY,.67),V(-.55*Math.abs(s.Bx)/346.41,0,0),reveal(4*s.p-3));
      setArrow(ry,V(x0,beamY,.67),V(0,.55*Math.abs(s.By)/100,0),reveal(4*s.p-3));
      moment.visible=s.p>=.5;
    };
    inspect=()=>({quarter:(start.x-x0)/L,slopeAngle:Math.atan2(Q.y-start.y,Q.x-start.x),tangentError:Math.abs(Q.distanceTo(c1)-r),beamTop:top,heavyBottom:heavy.position.y-heavyH/2,rope1Length:polylineLength(rope1),rope2Length:polylineLength(rope2)});
  } else if(kind==='pushing-blocks'){
    camera={target:[0,1.2,0],position:[5.2,4.0,8.0]};
    const floor=.255,sideA=1.12,sideB=.7,initialA=-1.65,initialB=initialA+(sideA+sideB)/2,scale=1.05;
    makeBox(root,6.45,.06,1.8,[0,floor,0],0xb7c1b6,'floor');
    for(let x=-2.8;x<=2.8;x+=.4)makeLine(root,[V(x,.292,-.8),V(x,.292,.8)],0x9caaa1);
    function boxCargo(side,color,tag){
      const g=new THREE.Group();g.userData.tag=tag;root.add(g);
      makeBox(g,side,side,side,[0,side/2,0],color,null,{roughness:.8});
      for(const z of [-side*.51,side*.51]){
        makeBox(g,side*.9,.045,.025,[0,side*.28,z],0xe9c18c);makeBox(g,side*.9,.045,.025,[0,side*.74,z],0xe9c18c);
        makeBox(g,.045,side*.9,.025,[-side*.35,side*.5,z],0xe4b87d);makeBox(g,.045,side*.9,.025,[side*.35,side*.5,z],0xe4b87d);
      }
      return g;
    }
    const A=boxCargo(sideA,0xc28657,'blockA'),B=boxCargo(sideB,0xdab076,'blockB');
    const F=arrow(root,C.coral,'appliedForce'),fr=arrow(root,C.gold,'friction'),frB=arrow(root,C.gold,'friction'),acc=arrow(root,C.teal,'accel'),contact=arrow(root,C.purple,'contact');
    mark('blockA',()=>V(A.position.x,floor+sideA+.3,0),'大箱 4m');mark('blockB',()=>V(B.position.x,floor+sideB+.35,0),'小箱 m');
    mark('appliedForce',()=>V(A.position.x-.8,floor+.82,.6),'推力 F');mark('friction',()=>V(A.position.x-.15,floor+.23,.8),'地面摩擦');
    mark('accel',()=>V(B.position.x+.75,floor+.48,0),'共同加速度');mark('contact',()=>V((A.position.x+B.position.x)/2+.1,floor+1.24,.15),'块间接触力');
    update=s=>{
      A.position.set(initialA+s.x*scale,floor+.03,0);B.position.set(initialB+s.x*scale,floor+.03,0);
      setArrow(F,V(A.position.x-1.05,floor+.65,.62),V(.75,0,0));
      setArrow(fr,V(A.position.x+.3,floor+.18,.82),V(-.66*q.mu/.2,0,0));
      setArrow(frB,V(B.position.x+.25,floor+.18,.82),V(-.165*q.mu/.2,0,0));
      setArrow(acc,V(B.position.x+.5,floor+.7,.12),V(.6,0,0));
      setArrow(contact,V(A.position.x+sideA/2-.18,floor+1.04,.48),V(.42,0,0));
    };
    inspect=()=>({A:A.position.x,B:B.position.x,gap:B.position.x-sideB/2-(A.position.x+sideA/2),initialA,initialB,scale,bottomA:A.position.y,bottomB:B.position.y,floor:floor+.03,frictionVisible:fr.root.visible,frictionBVisible:frB.root.visible});
  } else if(kind==='cart-strings'){
    camera={target:[0,1.8,0],position:[5.5,4.7,8.3]};
    const floor=.29,start=-.8,scale=1.1;
    makeBox(root,6.4,.07,1.7,[0,floor-.035,0],0x929e9b,'floor');
    for(let x=-2.8;x<=2.8;x+=.7)makeBox(root,.34,.009,.025,[x,floor+.004,.65],0xf3e4bc);
    const cart=new THREE.Group();cart.userData.tag='accel';root.add(cart);
    makeBox(cart,3.05,.18,.85,[0,.74,0],0x6f9f97,null,{metalness:.35,roughness:.4});
    makeBox(cart,3.15,.08,.92,[0,.84,0],0xc4d5c8);makeBox(cart,.19,2.65,.36,[1.1,2.17,0],0x9caeaa);
    makeBox(cart,.24,.1,.46,[1.1,3.53,0],0xd3dbd1);for(const y of [1.15,2,3])bolt(cart,1.1,y,.205);
    const wheels=[wheel(cart,V(-.95,.52,.48),.23),wheel(cart,V(.95,.52,.48),.23),wheel(cart,V(-.95,.52,-.48),.23),wheel(cart,V(.95,.52,-.48),.23)];
    const mass=makeBox(cart,.49,.48,.42,[-.48,2.04,0],0xd88468,'mass');
    const origin=V(-.235,2.04,.07),upper=V(1.1,3.375,.07),lower=V(1.1,.705,.07);
    segment(cart,origin,upper,.025,C.purple,'ropeUpper');segment(cart,origin,lower,.025,C.coral,'ropeLower');
    makeSphere(cart,.055,upper.toArray(),C.gold,'ropeUpper');makeSphere(cart,.055,lower.toArray(),C.gold,'ropeLower');
    const acc=arrow(root,C.gold,'accel');
    mark('mass',()=>V(cart.position.x-.48,2.55,.1),'载荷 m');
    mark('ropeUpper',()=>V(cart.position.x+.4,2.94,.1),'上绳 T₁');mark('ropeLower',()=>V(cart.position.x+.4,1.12,.1),'下绳 T₂');
    mark('accel',()=>V(cart.position.x+1.75,1.15,.25),'向右加速');
    update=s=>{cart.position.x=start+s.x*scale;for(const w of wheels)w.rotation.z=-s.x*scale/.23;setArrow(acc,V(cart.position.x+1.5,1.0,.4),V(.68,0,0));};
    inspect=()=>({cartX:cart.position.x,start,scale,massOffset:mass.position.x,ropeUpper:origin.distanceTo(upper),ropeLower:origin.distanceTo(lower),upperAngle:Math.atan2(upper.y-origin.y,upper.x-origin.x),lowerAngle:Math.atan2(lower.y-origin.y,lower.x-origin.x)});
  } else if(kind==='guided-wedge'){
    camera={target:[0,1.8,0],position:[5.5,4.8,8.5]};
    const floor=.255,left0=-2.05,width=2.7,guideX=-.8,scale=1.0,a=q.angle*Math.PI/180,r=.09;
    makeBox(root,6.45,.07,2.0,[0,floor,0],0xb9c3b7,'floor');
    const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(width,0);shape.lineTo(width,width*Math.tan(a));shape.closePath();
    const wedge=new THREE.Group();wedge.userData.tag='wedge';root.add(wedge);
    const body=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.85,bevelEnabled:false}),mat(0xd3a16f,{roughness:.68}));body.position.z=-.425;body.castShadow=true;body.receiveShadow=true;wedge.add(body);
    body.add(new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry),new THREE.LineBasicMaterial({color:0x42584f})));
    const guide=new THREE.Group();guide.userData.tag='guide';root.add(guide);
    makeBox(guide,.13,3.55,.18,[guideX,2.22,-.5],0x91a6a4);makeBox(guide,.95,.12,.28,[guideX,4.0,-.5],0x718c89);
    for(const y of [1.45,3.0])makeBox(guide,.54,.13,.55,[guideX,y,-.28],0xa6b9af);
    const slider=new THREE.Group();slider.userData.tag='guide';root.add(slider);
    makeBox(slider,.38,.64,.4,[0,.42,0],0x5d9f94,'guide');makeBox(slider,.14,1.25,.14,[0,1.05,0],0x829a97,'guide');
    const ball=makeSphere(slider,r,[0,0,0],0xc8b07d,'contact');
    const norm=arrow(root,C.blue,'normal'),acc=arrow(root,C.gold,'accel');
    let foot=V();
    mark('wedge',()=>V(wedge.position.x+1.8,floor+.7,.3),'楔块 3m');mark('guide',()=>V(guideX-.3,slider.position.y+.85,.2),'滑块 m / 导轨');
    mark('normal',()=>foot.clone().add(V(-.35,.7,.5)),'法向力 N');mark('contact',()=>foot.clone().add(V(.25,.3,.5)),'光滑接触');
    mark('accel',()=>V(wedge.position.x+width+.48,floor+.5,.1),'楔块加速度');
    update=s=>{
      wedge.position.set(left0+s.x*scale,floor+.035,0);
      foot=V(guideX+r*Math.sin(a),wedge.position.y+(guideX+r*Math.sin(a)-wedge.position.x)*Math.tan(a),0);
      slider.position.set(guideX,foot.y+r*Math.cos(a),0);
      setArrow(norm,foot.clone().add(V(0,0,.45)),V(-.5*Math.sin(a),.5*Math.cos(a),0));
      setArrow(acc,V(wedge.position.x+width,floor+.45,.5),V(.65,0,0));
    };
    inspect=()=>({wedgeX:wedge.position.x,left0,scale,guideX,sliderX:slider.position.x,sliderY:slider.position.y,initialSliderY:floor+.035+(guideX+r*Math.sin(a)-left0)*Math.tan(a)+r*Math.cos(a),contactX:foot.x,contactY:foot.y,slopeY:wedge.position.y+(foot.x-wedge.position.x)*Math.tan(a),contactRadius:r});
  } else if(kind==='billiards'){
    camera={target:[0,.45,0],position:[4.6,8.6,8.5]};
    const felt=.56,r=.15;
    makeBox(root,5.75,.30,3.65,[0,.38,0],0x76513e);makeBox(root,5.4,.035,3.3,[0,felt,0],0x367b67,'path');
    for(const z of [-1.75,1.75])makeBox(root,5.75,.18,.22,[0,.65,z],0x926747);
    for(const x of [-2.75,2.75])makeBox(root,.22,.18,3.35,[x,.65,0],0x926747);
    const A=makeSphere(root,r,[0,0,0],0xf4efdf,'ballA',{metalness:.05,roughness:.22});
    const B=makeSphere(root,r,[0,0,0],0xd5674f,'ballB',{metalness:.08,roughness:.24});
    const whiteStripe=ring(B,r*.84,.018,[0,0,0],0xf5e6d0);whiteStripe.rotation.x=Math.PI/2;
    const dot=makeSphere(root,.055,[0,felt+.03,0],C.gold,'impact');
    const traceA=flatLine([V(),V()],0xffe2a7,'path'),traceB=flatLine([V(),V()],0xe89a76,'path');
    const va=arrow(root,C.teal,'velocity');
    const map=p=>V(p[0],felt+.02,-p[1]);
    const baseline=model.sample(0),impact=baseline.impact,start=[baseline.A[0],baseline.A[1]];
    dot.position.copy(map(impact.map(v=>v/2)).add(V(0,.03,0)));
    mark('ballA',()=>A.position.clone().add(V(-.12,.35,.05)),'入射球 m₁');mark('ballB',()=>B.position.clone().add(V(.1,.35,0)),'靶球 m₂');
    mark('impact',()=>dot.position.clone().add(V(-.12,.3,.2)),'碰撞点');mark('velocity',()=>A.position.clone().add(V(.5,.4,-.2)),'速度方向');mark('path',()=>V(1.8,.85,-.9),'碰后轨迹');
    update=s=>{
      A.position.copy(map(s.A).add(V(0,r,0)));B.position.copy(map(s.B).add(V(0,r,0)));
      const ptsA=s.collided?[map(start),map(s.impact),map(s.A)]:[map(start),map(s.A)];setLine(traceA,ptsA);
      setLine(traceB,[map([0,0]),map(s.B)]);
      const speed=Math.hypot(...s.va),delta=V(s.va[0]/speed*.6,0,-s.va[1]/speed*.6);setArrow(va,A.position.clone().add(V(0,.22,0)),delta);
    };
    inspect=()=>{const pa=traceA.geometry.getAttribute('position'),pb=traceB.geometry.getAttribute('position');return {Ax:A.position.x,Ay:-A.position.z,Bx:B.position.x,By:-B.position.z,r,separation:A.position.distanceTo(B.position),collisionX:impact[0],collisionY:impact[1],trailACount:pa.count,trailAEndX:pa.getX(pa.count-1),trailAEndY:-pa.getZ(pa.count-1),trailBCount:pb.count,trailBEndX:pb.getX(pb.count-1),trailBEndY:-pb.getZ(pb.count-1)};};
  } else if(kind==='cubic-drag'){
    camera={target:[0,1.8,0],position:[5.2,4.3,8.2]};
    const floor=.29,startY=3.38,scale=1.0,xA=-1.25,xB=1.25;
    for(const [x,color] of [[xA,C.teal],[xB,C.coral]]){
      makeBox(root,1.05,.13,1.05,[x,floor,0],0x899d98);
      const tube=new THREE.Mesh(new THREE.CylinderGeometry(.47,.47,3.05,32,1,true),mat(0xd0e5e2,{transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false}));tube.position.set(x,1.88,0);root.add(tube);
      for(const y of [.37,3.4]){const band=ring(root,.47,.035,[x,y,0],0x849d9b);band.rotation.x=Math.PI/2;}
      for(const dx of [-.47,.47])segment(root,V(x+dx,.34,0),V(x+dx,3.43,0),.018,0x94aaa3);
      for(let i=0;i<=6;i++)makeBox(root,i%2?.08:.15,.018,.02,[x+.53,3.28-i*.4,.05],0x798e87);
    }
    const A=makeSphere(root,.17,[xA,startY,0],0x5aa99d,'ballA',{metalness:.18,roughness:.3});
    const B=makeSphere(root,.17,[xB,startY,0],0xd7846c,'ballB',{metalness:.18,roughness:.3});
    const weight=arrow(root,C.coral,'weight'),drag=arrow(root,C.purple,'friction'),vel=arrow(root,C.teal,'velocity');
    mark('ballA',()=>A.position.clone().add(V(-.4,.25,0)),'欧拉法');mark('ballB',()=>B.position.clone().add(V(.42,.25,0)),'RK4 参考');
    mark('weight',()=>B.position.clone().add(V(.55,-.28,.15)),'重力');mark('friction',()=>B.position.clone().add(V(-.45,.45,.15)),'立方阻力');
    mark('velocity',()=>A.position.clone().add(V(.28,-.35,.15)),'向下速度');
    update=s=>{
      A.position.y=startY-s.xEuler*scale;B.position.y=startY-s.x*scale;
      setArrow(weight,B.position.clone().add(V(.32,.08,.25)),V(0,-.55,0));
      setArrow(drag,B.position.clone().add(V(-.32,-.08,.25)),V(0,.5*(1-s.a/9.8),0));
      setArrow(vel,A.position.clone().add(V(.27,0,.2)),V(0,-.28*s.vEuler,0));
    };
    inspect=()=>({Ay:A.position.y,By:B.position.y,startY,scale,platformTop:floor+.065,ballRadius:.17,dragVisible:drag.root.visible,velocityVisible:vel.root.visible});
  } else if(kind==='peg-flight'){
    camera={target:[0,1.4,0],position:[5.3,4.3,8.0]};
    const last=model.sample(1),initial=model.sample(0),R=q.R,scale=5.65/(last.landingX+2*R),floor=.255,br=.13,pivotX=-2.8+2*R*scale;
    const pivot=V(pivotX,floor+br+2*R*scale,0),peg=V(pivotX,floor+br+R*scale,0);
    makeBox(root,6.3,.06,1.45,[0,floor,0],0xc5c9bd,'floor');
    makeBox(root,.16,pivot.y+.45,.26,[pivot.x,pivot.y/2+.18,-.36],0x8a9e99);
    makeBox(root,.7,.12,.6,[pivot.x,pivot.y+.05,-.17],0x9bada6);
    const axis=cyl(root,.105,.38,[pivot.x,pivot.y,0],0xd7b778,'pendulum');axis.rotation.x=Math.PI/2;
    const pegObj=cyl(root,.09,.38,[peg.x,peg.y,0],0xd7b778,'contact');pegObj.rotation.x=Math.PI/2;
    const bob=makeSphere(root,br,[0,0,0],0xd97860,'ball',{metalness:.15,roughness:.28});
    const cable=segment(root,pivot,V(pivot.x,pivot.y-1,0),.02,C.ink,'pendulum');
    const trajectory=flatLine([V(),V()],C.gold,'path');
    const launch=makeSphere(root,.045,[0,0,0],C.gold,'velocity');const velocity=arrow(root,C.teal,'velocity');
    const toWorld=(x,y)=>V(pivotX+x*scale,floor+br+y*scale,0);
    launch.position.copy(toWorld(last.xC,last.yC));
    mark('pendulum',()=>pivot.clone().add(V(-.4,.3,.1)),'悬点 / 摆长');mark('contact',()=>peg.clone().add(V(.3,.24,.1)),'碰钉');
    mark('ball',()=>bob.position.clone().add(V(0,.3,.1)),'摆球');mark('velocity',()=>launch.position.clone().add(V(.35,.45,.15)),'C 点切线速度');
    mark('path',()=>V(2.15,floor+.72,.1),'飞行轨迹');
    update=s=>{
      bob.position.copy(toWorld(s.x,s.y));
      cable.visible=s.phase!=='flight';if(cable.visible)placeSegment(cable,s.phase==='long'?pivot:peg,bob.position,.022);
      const speed=Math.hypot(s.vx,s.vy);setArrow(velocity,bob.position.clone().add(V(0,0,.2)),speed>1e-8?V(.65*s.vx/speed,.65*s.vy/speed,0):V(0,0,0));
      const tau=Math.max(0,s.t-s.tC),pts=Array.from({length:41},(_,i)=>{const u=tau*i/40;return toWorld(s.xC+s.vxC*u,s.yC+s.vyC*u-5*u*u);});setLine(trajectory,pts);
    };
    inspect=()=>{const pos=trajectory.geometry.getAttribute('position');return {ballX:bob.position.x,ballY:bob.position.y,pivotX,pivotY:pivot.y,pegY:peg.y,scale,floor,ballRadius:br,cableVisible:cable.visible,cableLength:cable.visible?cable.scale.y:0,trajectoryCount:pos.count,trajectoryEndX:pos.getX(pos.count-1),trajectoryEndY:pos.getY(pos.count-1)};};
  } else if(kind==='nonlinear-pendulum'){
    camera={target:[0,1.9,0],position:[5.8,4.8,8.8]};
    const pivot=V(0,2.25,0),Lvis=1.48,scale=Lvis/q.L;
    makeBox(root,3.45,.10,1.45,[0,.31,0],0x9daea6);
    // The support is behind the plane of motion and higher than the bob's
    // full 175-degree sweep; otherwise the rigid pendulum would strike it.
    for(const x of [-1.6,1.6]){segment(root,V(x,.35,-.55),V(x,4.16,-.55),.055,0x91a7a3);bolt(root,x,.45,-.45);}
    makeBox(root,3.45,.12,.45,[0,4.14,-.55],0x8a9f9a);
    segment(root,V(-1.55,4.07,-.55),V(0,2.25,-.32),.035,0xa8b8ae);segment(root,V(1.55,4.07,-.55),V(0,2.25,-.32),.035,0xa8b8ae);
    const pin=cyl(root,.12,.66,[0,pivot.y,0],0xd2b277,'pendulum');pin.rotation.x=Math.PI/2;
    const rod=segment(root,pivot,V(0,.8,0),.035,0x637e7a,'pendulum');
    const bob=makeSphere(root,.19,[0,.8,0],0xd47c62,'ball',{metalness:.28,roughness:.25});
    const ghost=makeSphere(root,.13,[0,.8,-.28],0x57a59b,'angular',{transparent:true,opacity:.46,depthWrite:false});
    const range=q.theta*Math.PI/180,arc=flatLine(Array.from({length:101},(_,i)=>{const a=-range+2*range*i/100;return V(pivot.x+Lvis*Math.sin(a),pivot.y-Lvis*Math.cos(a),-.1)}),0xb0c9bd,'energy');
    const grav=arrow(root,C.coral,'weight'),ang=arrow(root,C.teal,'angular');
    mark('pendulum',()=>pivot.clone().add(V(.27,.32,.1)),'刚性杆 / 铰点');mark('ball',()=>bob.position.clone().add(V(.25,.24,.2)),'非线性摆球');
    mark('weight',()=>bob.position.clone().add(V(.5,-.25,.3)),'重力 mg');mark('angular',()=>ghost.position.clone().add(V(-.45,.2,0)),'小角度近似');
    mark('energy',()=>V(-1.5,.65,0),'机械能守恒');
    update=s=>{
      bob.position.set(pivot.x+Lvis*Math.sin(s.theta),pivot.y-Lvis*Math.cos(s.theta),0);placeSegment(rod,pivot,bob.position,.035);
      ghost.position.set(pivot.x+Lvis*Math.sin(s.small),pivot.y-Lvis*Math.cos(s.small),-.3);
      setArrow(grav,bob.position.clone().add(V(.25,0,.2)),V(0,-.55,0));
      setArrow(ang,pivot.clone().add(V(0,0,.3)),V(Math.sin(s.theta)*.45,-Math.cos(s.theta)*.45,0));
    };
    inspect=()=>({pivotX:pivot.x,pivotY:pivot.y,bobX:bob.position.x,bobY:bob.position.y,rodLength:pivot.distanceTo(bob.position),Lvis,scale,bobRadius:.19,frameBottom:4.08,braceFrontZ:-.32});
  } else if(kind==='coupled-springs'||kind==='equal-spring-modes'){
    camera={target:[0,1.05,0],position:[6.0,4.3,9.0]};
    const floor=.3,scale=kind==='equal-spring-modes'?.40:.55,eq1=-1.05,eq2=1.05,wa=.76,wb=kind==='equal-spring-modes'?.76:.84;
    makeBox(root,6.4,.1,1.45,[0,floor,0],0xa7b7ae,'floor');
    for(const z of [-.53,.53])makeBox(root,6.15,.08,.08,[0,.41,z],0x647d7b);
    for(const x of [-2.75,2.75])makeBox(root,.20,1.4,1.0,[x,1.0,0],0x9bada6);
    function cart(color,tag,w){
      const g=new THREE.Group();g.userData.tag=tag;root.add(g);
      makeBox(g,w,.52,.78,[0,.86,0],color,null,{metalness:.22,roughness:.48});
      makeBox(g,w+.06,.08,.84,[0,.57,0],0x536e68);
      for(const dx of [-w*.3,w*.3])for(const z of [-.42,.42]){const w1=cyl(g,.12,.07,[dx,.49,z],0x3c5551);w1.rotation.x=Math.PI/2;}
      return g;
    }
    const A=cart(0x58a397,'blockA',wa),B=cart(0xd47d67,'blockB',wb);
    function spring(tag,color){
      const pieces=Array.from({length:42},()=>segment(root,V(),V(.1,0,0),.017,color,tag));
      return (x1,x2)=>{const pts=Array.from({length:43},(_,i)=>{
        const u=i/42,amplitude=(i===0||i===42)?0:.105;return V(x1+(x2-x1)*u,1.02+amplitude*Math.sin(12*Math.PI*u),amplitude*Math.cos(12*Math.PI*u));
      });pieces.forEach((m,i)=>placeSegment(m,pts[i],pts[i+1],.017));};
    }
    const s1=spring('spring1',C.gold),s2=spring('spring2',C.purple),s3=spring('spring3',C.gold);
    const energy=makeSphere(root,.07,[0,1.65,0],C.teal,'energy');
    if(kind==='equal-spring-modes')makeSphere(root,.06,[0,1.62,-.42],C.purple,'normalMode');
    mark('blockA',()=>V(A.position.x,1.8,0),'滑块 m₁');mark('blockB',()=>V(B.position.x,1.8,0),'滑块 m₂');
    mark('spring1',()=>V((-2.65+A.position.x-wa/2)/2,1.38,0),'弹簧 k₁');
    mark('spring2',()=>V((A.position.x+B.position.x)/2,1.4,.05),'耦合弹簧 k₂');
    mark('spring3',()=>V((2.65+B.position.x+wb/2)/2,1.38,0),'弹簧 k₃');
    mark('energy',()=>V(0,.65,.8),'系统能量');
    if(kind==='equal-spring-modes')mark('normalMode',()=>V(0,1.95,-.42),'正常模态');
    update=s=>{A.position.x=eq1+s.x1*scale;B.position.x=eq2+s.x2*scale;s1(-2.65,A.position.x-wa/2);s2(A.position.x+wa/2,B.position.x-wb/2);s3(B.position.x+wb/2,2.65);};
    inspect=()=>({Ax:A.position.x,Bx:B.position.x,eq1,eq2,scale,wa,wb,space:B.position.x-wb/2-(A.position.x+wa/2)});
  } else if(kind==='planet-orbits'||kind==='moon-orbit'){
    camera={target:[0,.40,0],position:[.01,10.8,5.4]};
    const y=.36;
    makeBox(root,6.7,.045,4.5,[0,.28,0],0x182d3d,'path',{roughness:.9});
    // Stylized stars and planet textures; orbital distances, unlike globe radii,
    // all share one scale. No map or astronomical photograph is asserted.
    for(let i=0;i<65;i++){
      const x=3.15*Math.sin(i*19.183),z=2.03*Math.sin(i*7.743+.7),s=i%7===0?.025:.013;
      makeSphere(root,s,[x,.31,z],0xdce5d9);
    }
    function globe(radius,which,tag){
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');
      if(which==='earth'){
        c.fillStyle='#315f8e';c.fillRect(0,0,512,256);c.fillStyle='#8aaa76';
        const blobs=[[[35,46],[75,34],[125,59],[112,91],[88,98],[78,128],[54,112],[35,83]],[[140,115],[172,127],[180,170],[163,220],[148,196],[136,155]],[[240,48],[295,36],[330,54],[370,52],[421,69],[454,105],[427,120],[391,111],[365,130],[337,104],[298,112],[286,146],[259,121],[251,88]],[[290,127],[329,125],[345,154],[326,205],[308,215],[286,174]],[[410,160],[448,153],[469,179],[450,195],[420,188]]];
        for(const ps of blobs){c.beginPath();c.moveTo(...ps[0]);ps.slice(1).forEach(p=>c.lineTo(...p));c.closePath();c.fill();}
        c.fillStyle='rgba(240,245,235,.8)';c.fillRect(0,0,512,12);c.fillRect(0,244,512,12);
      }else{
        c.fillStyle='#b7b5ae';c.fillRect(0,0,512,256);
        for(let i=0;i<65;i++){const x=(i*71)%512,y=18+(i*37)%220,rad=3+(i*17)%13;c.strokeStyle=i%2?'#8d8e89':'#d0cfc8';c.lineWidth=2;c.beginPath();c.arc(x,y,rad,0,2*Math.PI);c.stroke();}
      }
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      const m=new THREE.Mesh(new THREE.SphereGeometry(radius,32,22),mat(0xffffff,{map:texture,roughness:.75}));m.userData.tag=tag;m.castShadow=true;root.add(m);return m;
    }
    const velocity=arrow(root,C.coral,'velocity');
    if(kind==='planet-orbits'){
      const d=model.sample(0),aE=d.aE,aM=d.aM,scale=2.13/aE,focus=V(0,y+.18,0);
      const sun=makeSphere(root,.23,focus.toArray(),0xf1b14e,'sun',{roughness:.35});
      const halo=ring(root,.30,.025,[0,y+.015,0],0xeab76a,'sun');halo.rotation.x=Math.PI/2;
      const earth=globe(.145,'earth','earth'),mercury=makeSphere(root,.09,[0,y+.12,0],0xa98b75,'mercury');
      const orbit=(a,e,color)=>flatLine(Array.from({length:161},(_,i)=>{const E=i*2*Math.PI/160;return V(scale*a*(Math.cos(E)-e),y,-scale*a*Math.sqrt(1-e*e)*Math.sin(E))}),color,'path');
      orbit(aE,q.eEarth,0x8bbeb5);orbit(aM,q.eMercury,0xe3aa7b);
      mark('sun',()=>focus.clone().add(V(-.15,.5,0)),'太阳 / 焦点');mark('earth',()=>earth.position.clone().add(V(.15,.4,0)),'地球');
      mark('mercury',()=>mercury.position.clone().add(V(.1,.35,0)),'水星');mark('path',()=>V(-2.15,.8,-1.15),'椭圆轨道');
      mark('velocity',()=>earth.position.clone().add(V(.45,.65,0)),'地球速度');
      update=s=>{
        earth.position.set(s.earth.x*scale,y+.15,-s.earth.y*scale);mercury.position.set(s.mercury.x*scale,y+.1,-s.mercury.y*scale);
        const len=s.earth.speed;setArrow(velocity,earth.position.clone().add(V(0,.2,0)),V(s.earth.vx/len*.6,0,-s.earth.vy/len*.6));
      };
      inspect=()=>({earthX:earth.position.x,earthY:-earth.position.z,mercuryX:mercury.position.x,mercuryY:-mercury.position.z,scale,focusX:focus.x,focusY:focus.z});
    }else{
      const d=model.sample(0),scale=2.05/d.a,earth=globe(.36,'earth','earth'),moon=globe(.14,'moon','moon');earth.position.set(0,y+.35,0);
      flatLine(Array.from({length:161},(_,i)=>{const E=i*2*Math.PI/160;return V(scale*d.a*(Math.cos(E)-d.e),y,-scale*d.a*Math.sqrt(1-d.e*d.e)*Math.sin(E));}),0xa4c1bd,'path');
      const line=flatLine([V(),V()],0xdac99f,'geometry');
      mark('earth',()=>earth.position.clone().add(V(-.15,.55,0)),'地球 / 焦点');mark('moon',()=>moon.position.clone().add(V(.2,.4,0)),'月球');
      mark('path',()=>V(-2.05,.72,-1.2),'月球相对轨道');mark('velocity',()=>moon.position.clone().add(V(.5,.6,0)),'月球速度');
      update=s=>{
        moon.position.set(s.x*scale,y+.14,-s.y*scale);setLine(line,[V(0,y+.02,0),V(s.x*scale,y+.02,-s.y*scale)]);
        setArrow(velocity,moon.position.clone().add(V(0,.2,0)),V(s.vx/s.speed*.65,0,-s.vy/s.speed*.65));
      };
      inspect=()=>({earthX:earth.position.x,earthY:-earth.position.z,moonX:moon.position.x,moonY:-moon.position.z,scale});
    }
  } else return null;
  return {update,inspect,camera};
}
