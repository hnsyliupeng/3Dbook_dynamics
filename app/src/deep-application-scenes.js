import * as THREE from 'three';

// Source-specific mechanisms; all positions are driven by model.sample().
export function buildDeepApplicationScene({lesson,model,root,label,h}){
  const {C,V,mat,makeBox,makeSphere,cyl,ring,segment,placeSegment,makeLine,setLine,arrow,setArrow,roadCar}=h;
  const q=model.parameters,kind=lesson.kind;
  let update,inspect=()=>({}),camera={target:[0,1.5,0],position:[8,6.8,10.8]};
  const mark=(tag,anchor,text)=>label(tag,()=>h.isTagActive(tag)?anchor():null,text);
  const line=(points,color,tag)=>makeLine(root,points,color,tag);
  function spring(tag,z,color){
    const pieces=Array.from({length:42},()=>segment(root,V(),V(.1,0,0),.016,color,tag));
    return (x1,x2,y)=>{const pts=Array.from({length:43},(_,i)=>{const f=i/42,r=(i===0||i===42)?0:.105;return V(x1+(x2-x1)*f,y+r*Math.sin(12*Math.PI*f),z+r*Math.cos(12*Math.PI*f));});pieces.forEach((m,i)=>placeSegment(m,pts[i],pts[i+1],.016));};
  }
  function cart(color=0x63a89b){
    const g=new THREE.Group();g.userData.tag='blockA';root.add(g);
    makeBox(g,.78,.42,.72,[0,.87,0],color,null,{metalness:.2,roughness:.5});
    makeBox(g,.84,.08,.78,[0,.62,0],0x536e68);
    for(const x of [-.27,.27])for(const z of [-.41,.41]){const w=cyl(g,.105,.07,[x,.53,z],0x344f52);w.rotation.x=Math.PI/2;}
    return g;
  }
  if(kind==='car-ratio'){
    camera={target:[0,.78,0],position:[6.7,4.9,9.8]};
    const left=-2.5,right=2.5,roadY=.34,initial=model.sample(0),scale=(right-left)/initial.xB,Ax=left+initial.xA*scale;
    makeBox(root,6.8,.12,1.7,[0,.27,0],0x596466,'path');
    for(const z of [-.82,.82])makeBox(root,6.8,.06,.12,[0,.34,z],0xb4b8a8);
    for(let x=-3;x<3.2;x+=.6)makeBox(root,.27,.009,.025,[x,roadY+.003,0],0xede4c9);
    for(const [x,c,tag] of [[left,C.teal,'start'],[Ax,C.gold,'pointA'],[right,C.coral,'finish']]){
      makeBox(root,.035,.012,1.5,[x,roadY+.01,0],c,tag);makeBox(root,.09,.28,.09,[x,roadY+.16,-.71],c,tag);
    }
    const {group:vehicle,wheels}=roadCar(root,C.teal,'car');vehicle.scale.setScalar(.72);
    // Visual magnification also changes the wheel radius; keep rolling in sync
    // with displayed distance rather than rotating by an unrelated constant.
    const wheelRadius=.13*.72,vel=arrow(root,C.coral,'velocity');
    mark('start',()=>V(left,.9,-.8),'出发点 O');mark('pointA',()=>V(Ax,1.05,-.6),'A');mark('finish',()=>V(right,.95,-.75),'B');
    mark('car',()=>vehicle.position.clone().add(V(-.1,.64,0)),'汽车');mark('velocity',()=>vehicle.position.clone().add(V(.45,.85,.1)),'速度 v');
    update=s=>{vehicle.position.set(left+s.x*scale,roadY,0);wheels.forEach(w=>w.rotation.z=-s.x*scale/wheelRadius);setArrow(vel,vehicle.position.clone().add(V(.08,.52,.1)),V(.35+.7*s.v/s.vB,0,0),s.v>1e-8?1:0);};
    inspect=()=>({carX:vehicle.position.x,startX:left,markerAX:Ax,endX:right,scale,roadY,carBottomY:vehicle.position.y,wheelRadius,wheelAngle:wheels[0].rotation.z,velocityVisible:vel.root.visible});
  } else if(kind==='two-stones'){
    camera={target:[-.25,2.20,0],position:[4.8,4.6,7.6]};
    const base=.28,scale=.055,top=base+(50+q.gap)*scale,ground=.27;
    makeBox(root,2.25,top-ground,1.12,[-1.18,(top+ground)/2,-.55],0xb0beb8,'start');
    makeBox(root,2.35,.10,1.22,[-1.18,top,-.55],0x758d89);
    // A simple facade, with the actual two release elevations marked separately.
    for(let j=0;j<7;j++)for(let i=0;i<3;i++)makeBox(root,.38,.23,.025,[-1.85+i*.64,.52+j*.37,.025],0x7e9ca4);
    for(const [y,color] of [[base+50*scale,C.teal],[base+(50+q.gap)*scale,C.coral]])makeBox(root,2.35,.055,.10,[-1.18,y,.075],color);
    makeBox(root,5.8,.04,2.9,[.1,.25,.05],0xc4c9bb);
    const radius=.075,dropX=.75;
    // Release ledges end immediately beside the falling spheres. This keeps
    // both bodies outside the facade and avoids obscuring the drop visually.
    for(const y of [base+50*scale,base+(50+q.gap)*scale])makeBox(root,.72,.07,.30,[.31,y-radius-.035,.2],0x839992);
    const A=makeSphere(root,radius,[dropX,1,.2],C.teal,'ballA'),B=makeSphere(root,radius,[dropX,1,.2],C.coral,'ballB');
    const meter=segment(root,V(),V(0,.1,0),.016,C.gold,'separation'),v=arrow(root,C.coral,'velocity');
    const tickA=segment(root,V(),V(.1,0,0),.014,C.gold,'separation'),tickB=segment(root,V(),V(.1,0,0),.014,C.gold,'separation');
    mark('ballA',()=>A.position.clone().add(V(-.48,0,.15)),'下层石 A');mark('ballB',()=>B.position.clone().add(V(.42,.06,.15)),'上层石 B');
    mark('separation',()=>V(1.5,(A.position.y+B.position.y)/2,.2),'两石间距');mark('velocity',()=>B.position.clone().add(V(.42,-.35,.1)),'上石速度');
    update=s=>{
      A.position.set(dropX,base+s.yA*scale,.2);B.position.set(dropX,base+s.yB*scale,.2);
      const x=1.26;placeSegment(meter,V(x,A.position.y,.22),V(x,B.position.y,.22),.016);
      placeSegment(tickA,V(x-.11,A.position.y,.22),V(x+.11,A.position.y,.22),.014);placeSegment(tickB,V(x-.11,B.position.y,.22),V(x+.11,B.position.y,.22),.014);
      setArrow(v,B.position.clone().add(V(.18,0,.08)),V(0,-Math.min(.8,Math.abs(s.vB)*.032),0));
    };
    inspect=()=>({Ay:A.position.y,By:B.position.y,base,scale,radius,dropX,ledgeRight:.67,ground,verticalGap:B.position.y-A.position.y,barLength:meter.scale.y});
  } else if(kind==='free-wedge'){
    camera={target:[0,1.3,0],position:[6.7,5.1,10.2]};
    const scale=1.55,floor=.34,a=q.angle*Math.PI/180,L=2.2,W=L*Math.cos(a)*scale,H=L*Math.sin(a)*scale,left=-W/2;
    makeBox(root,6.25,.12,1.6,[0,.27,0],0x9aada6,'path');
    for(const z of [-.6,.6])makeBox(root,6.0,.035,.055,[0,floor+.02,z],0x526f6e);
    const wedge=new THREE.Group();wedge.userData.tag='wedge';root.add(wedge);
    const shape=new THREE.Shape();shape.moveTo(left,0);shape.lineTo(left+W,0);shape.lineTo(left,H);shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:1.0,bevelEnabled:false}),mesh=new THREE.Mesh(geo,mat(0xc79561,{roughness:.62}));mesh.position.set(0,floor,-.5);wedge.add(mesh);
    const outline=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x546962}));outline.position.copy(mesh.position);wedge.add(outline);
    const trackA=V(left,floor+H,.51),trackB=V(left+W,floor,.51);segment(wedge,trackA,trackB,.045,0x526f6d,'contact');
    const block=new THREE.Group();block.userData.tag='blockA';root.add(block);makeBox(block,.56,.4,.62,[0,0,0],C.teal,null,{metalness:.18,roughness:.52});
    makeBox(block,.46,.04,.64,[0,.12,0],0xcfe4d7);block.rotation.z=-a;
    const norm=arrow(root,C.blue,'normal'),acc=arrow(root,C.gold,'accel');
    const gauge=makeBox(root,.22,.7,.26,[2.68,.78,-.5],0xd6b46f,'energy');
    let contact=V();
    mark('wedge',()=>V(wedge.position.x-.55,.7,.5),'楔块 M');mark('blockA',()=>block.position.clone().add(V(.1,.42,.2)),'滑块 m');
    mark('accel',()=>V(wedge.position.x-1.1,.53,.75),'水平反冲');mark('normal',()=>block.position.clone().add(V(-.5,.53,.15)),'法向力 N');
    mark('energy',()=>V(2.55,1.45,-.5),'系统能量');
    update=s=>{
      wedge.position.x=s.X*scale;
      contact=V(left+(s.s0+s.s)*scale*Math.cos(a)+wedge.position.x,floor+(s.L-s.s0-s.s)*scale*Math.sin(a),0);
      block.position.copy(contact).add(V(.2*Math.sin(a),.2*Math.cos(a),0));
      setArrow(norm,block.position.clone().add(V(0,0,.38)),V(.55*Math.sin(a),.55*Math.cos(a),0));
      setArrow(acc,V(wedge.position.x-.3,.54,.75),V(-.7,0,0));
    };
    inspect=()=>({wedgeX:wedge.position.x,contactX:contact.x,contactY:contact.y,blockX:block.position.x,blockY:block.position.y,floor,scale,left,L,W,H,angle:a,offset:.2,gaugeY:gauge.position.y});
  } else if(kind==='damped-cart'||kind==='driven-cart'){
    camera={target:[0,1.0,0],position:[6.3,4.4,9.5]};
    const forced=kind==='driven-cart',initial=model.sample(0),scale=forced?.84/Math.max(1,initial.maxAbs):.65;
    makeBox(root,6.45,.10,1.45,[0,.30,0],0xa4b6ad,'path');
    for(const z of [-.53,.53])makeBox(root,6.15,.08,.08,[0,.41,z],0x657d7a);
    makeBox(root,.24,1.38,1.15,[-2.7,1.0,0],0x9aaca5,'spring1');
    const block=cart(),coil=spring('spring1',-.24,C.gold),dashBody=segment(root,V(-2.55,.96,.28),V(-1.65,.96,.28),.12,0x7c9290,'damper');
    const piston=segment(root,V(),V(.2,0,0),.045,0xd0d6cb,'damper');
    const friction=arrow(root,C.purple,'velocity');
    let actuator=null,driveArrow=null;
    if(forced){
      actuator=new THREE.Group();actuator.userData.tag='actuator';root.add(actuator);
      makeBox(actuator,.55,.58,.7,[2.55,.82,.0],0x899da0);makeBox(actuator,.36,.35,.78,[2.4,.82,0],0x46696a);
      for(let y=.65;y<=1.0;y+=.09)makeBox(actuator,.1,.035,.8,[2.28,y,0],0xc79960);
      driveArrow=arrow(root,C.coral,'force');
    }
    // Mechanical-energy indicator is a normalized visual bar; readout uses joules.
    makeBox(root,.2,.9,.22,[1.75,.91,-.64],0xd7d9c8);
    const bar=makeBox(root,.16,.1,.18,[1.75,.52,-.64],C.teal,'energy');
    mark('blockA',()=>block.position.clone().add(V(0,1.52,0)),'滑块');mark('spring1',()=>V(-1.45,1.38,-.32),'弹簧 k');
    mark('damper',()=>V(-2.0,.67,.56),'阻尼器 b');mark('velocity',()=>block.position.clone().add(V(.35,.8,.3)),'速度 v');
    mark('energy',()=>V(1.75,1.62,-.64),'机械能');
    if(forced){mark('actuator',()=>V(2.62,1.44,.1),'周期激振器');mark('force',()=>block.position.clone().add(V(.8,1.06,.2)),'驱动力 F(t)');}
    update=s=>{
      block.position.x=s.x*scale;const left=block.position.x-.39;
      coil(-2.58,left,.94);placeSegment(piston,V(-1.67,.96,.28),V(left,.96,.28),.045);
      setArrow(friction,block.position.clone().add(V(.1,.95,.48)),V(Math.sign(s.v)*Math.min(.8,Math.abs(s.v)*.45),0,0));
      if(forced)setArrow(driveArrow,block.position.clone().add(V(.4,.9,0)),V(Math.sign(s.force)*Math.min(.9,Math.abs(s.force)/q.F*.9),0,0));
      const maxE=forced?Math.max(1,.5*initial.maxAbs**2*(1+q.omega**2)):s.E0,ratio=Math.max(.01,Math.min(1,s.E/maxE));
      bar.scale.y=ratio*8;bar.position.y=.48+.4*ratio;
    };
    inspect=()=>({cartX:block.position.x,scale,left:block.position.x-.39,pistonStart:-1.67,pistonEnd:block.position.x-.39,springStart:-2.58,energyBar:bar.scale.y,hasActuator:!!actuator,damperLength:dashBody.scale.y,velocityVisible:friction.root.visible,forceVisible:driveArrow?.root.visible??false});
  } else if(kind==='crank-pendulum'){
    camera={target:[0,1.8,0],position:[6.7,5.0,9.8]};
    const center=V(0,3.0,0),scale=1.55,R=q.R*scale,L=scale;
    makeBox(root,.28,3.2,.46,[-1.65,1.89,-.65],0x8da49f,'drive');
    makeBox(root,3.45,.22,.55,[0,3.48,-.65],0x9fb0a8);
    makeBox(root,1.05,.72,.38,[0,3.0,-.58],0x657f7b,'drive');
    const rim=ring(root,R,.035,center.toArray(),0x99a8a0,'drive');
    const hub=cyl(root,.14,.19,center.toArray(),C.gold,'drive');hub.rotation.x=Math.PI/2;
    const crank=segment(root,center,V(R,3,0),.045,C.gold,'drive');
    const pin=makeSphere(root,.095,[0,3,0],C.purple,'pivot'),bob=makeSphere(root,.18,[0,1,0],C.coral,'ball');
    const rod=segment(root,V(),V(0,-1,0),.032,0x617874,'pendulum'),velocity=arrow(root,C.teal,'velocity');
    mark('drive',()=>center.clone().add(V(-.8,.45,-.1)),'电机与曲柄');mark('pivot',()=>pin.position.clone().add(V(.35,.25,.15)),'偏心支点');
    mark('pendulum',()=>pin.position.clone().add(bob.position).multiplyScalar(.5).add(V(-.4,0,.15)),'刚性摆杆');
    mark('ball',()=>bob.position.clone().add(V(.2,.38,.1)),'摆球');mark('velocity',()=>bob.position.clone().add(V(.55,.02,.1)),'摆球速度');
    update=s=>{
      pin.position.copy(center).add(V(s.pivotX*scale,s.pivotY*scale,0));bob.position.copy(center).add(V(s.x*scale,s.y*scale,0));
      placeSegment(crank,center,pin.position,.045);placeSegment(rod,pin.position,bob.position,.032);
      const speed=Math.hypot(s.vx,s.vy);setArrow(velocity,bob.position.clone().add(V(0,0,.22)),speed>1e-8?V(s.vx/speed*.65,s.vy/speed*.65,0):V());
    };
    inspect=()=>({centerX:center.x,centerY:center.y,pivotX:pin.position.x,pivotY:pin.position.y,bobX:bob.position.x,bobY:bob.position.y,scale,rodLength:rod.scale.y,crankLength:crank.scale.y,bobRadius:.18,platformY:.21,braceFrontZ:-.375});
  } else if(kind==='binary-stars'){
    camera={target:[0,.35,0],position:[.01,9.0,4.8]};
    const scale=2.6,y=.34,s0=model.sample(0),fA=-q.m2/(1+q.m2),fB=1/(1+q.m2);
    makeBox(root,6.7,.045,4.5,[0,.28,0],0x182d3d,'path');
    for(let i=0;i<45;i++)makeSphere(root,i%8? .011:.020,[3.1*Math.sin(i*19.1),.31,2.0*Math.sin(i*7.8+.4)],0xd8e6db);
    const map=(x,z,f)=>V(scale*x*f,y,-scale*z*f),circle=(factor,color)=>{
      const pts=Array.from({length:201},(_,i)=>{const E=i*2*Math.PI/200,x=-s0.a*(Math.cos(E)-s0.e),z=-s0.a*Math.sqrt(1-s0.e*s0.e)*Math.sin(E);return map(x,z,factor)});
      return line(pts,color,'path');
    };
    circle(fA,0xe0af77);circle(fB,0x80bfc2);
    const starA=makeSphere(root,.085,[0,y+.085,0],0xf0b875,'starA'),starB=makeSphere(root,.10,[0,y+.1,0],0x86c3d2,'starB');
    const bary=makeSphere(root,.04,[0,y+.035,0],0xf4e5aa,'barycenter'),bar=line([V(),V()],0xe5d8b7,'separation');
    segment(root,V(-.13,y+.01,0),V(.13,y+.01,0),.012,0xd7d7c1,'barycenter');
    segment(root,V(0,y+.01,-.13),V(0,y+.01,.13),.012,0xd7d7c1,'barycenter');
    mark('starA',()=>starA.position.clone().add(V(-.2,.4,0)),'天体 m₁');mark('starB',()=>starB.position.clone().add(V(.3,.4,0)),'天体 m₂');
    mark('path',()=>V(-1.7,.70,-.7),'质心轨道');mark('barycenter',()=>V(0,.72,.45),'共同质心');
    mark('separation',()=>starA.position.clone().add(starB.position).multiplyScalar(.5).add(V(0,.38,0)),'两体连线');
    update=s=>{starA.position.set(s.A[0]*scale,y+.085,-s.A[1]*scale);starB.position.set(s.B[0]*scale,y+.1,-s.B[1]*scale);setLine(bar,[V(starA.position.x,y+.04,starA.position.z),V(starB.position.x,y+.04,starB.position.z)]);};
    inspect=()=>({Ax:starA.position.x,Ay:-starA.position.z,Bx:starB.position.x,By:-starB.position.z,scale,centerX:bary.position.x,centerY:bary.position.z,radiusA:.085,radiusB:.10,distance:Math.hypot(starA.position.x-starB.position.x,starA.position.z-starB.position.z)});
  } else if(kind==='jupiter-moons'){
    camera={target:[0,.35,0],position:[.01,10.2,5.5]};
    const y=.36,cx=-1.28,maxRadius=1.65,s0=model.sample(0),scale=maxRadius/s0.axis[3],colors=[0xe1b666,0x9bd1d1,0xb8b1a4,0xd7bca9];
    makeBox(root,6.7,.045,4.5,[0,.28,0],0x182d3d,'path');
    for(let i=0;i<42;i++)makeSphere(root,.012,[3.15*Math.sin(i*17.2),.31,1.95*Math.sin(i*7.3+.2)],0xd4e2db);
    const jupiter=makeSphere(root,.24,[cx,y+.24,0],0xc99768,'jupiter');
    // Fine colored bands suggest Jupiter without implying a geographic texture.
    for(const yy of [-.10,0,.10]){const r=Math.sqrt(.24*.24-yy*yy),band=ring(root,r,.009,[cx,y+.24+yy,0],yy===0?0x9d6e53:0xe5c89c,'jupiter');band.rotation.x=Math.PI/2;}
    const moons=s0.moons.map((m,i)=>{
      const r=m.a*scale;line(Array.from({length:161},(_,j)=>{const a=j*2*Math.PI/160;return V(cx+r*Math.cos(a),y,-r*Math.sin(a));}),colors[i],'path');
      return makeSphere(root,[.048,.055,.065,.06][i],[0,y+.08,0],colors[i],i===0?'io':'galilean');
    });
    // The diagram plots the exact same four a^3,T^2 values used in the fit.
    makeBox(root,1.75,.04,2.52,[1.9,y+.005,0],0x273f4e,'fit');
    const xMax=Math.max(...s0.xData)*1.05,yMax=Math.max(...s0.yData)*1.05,plot=(x,z)=>V(1.08+1.62*x/xMax,y+.05,1.12-2.24*z/yMax);
    line([plot(0,0),plot(xMax,0)],0xa7b9b1,'fit');line([plot(0,0),plot(0,yMax)],0xa7b9b1,'fit');
    for(let i=0;i<4;i++)makeSphere(root,.045,plot(s0.xData[i],s0.yData[i]).toArray(),colors[i],'fit');
    line([plot(0,s0.fit.intercept),plot(xMax,s0.fit.intercept+s0.fit.slope*xMax)],0xe0b66f,'fit');
    mark('jupiter',()=>V(cx,.86,.15),'木星');mark('io',()=>moons[0].position.clone().add(V(0,.33,0)),'木卫一');
    mark('galilean',()=>moons[3].position.clone().add(V(.05,.3,0)),'木卫四');mark('path',()=>V(-2.7,.76,-1.0),'卫星轨道');
    mark('fit',()=>V(1.88,.85,.85),'T²－a³ 拟合');
    update=s=>{s.moons.forEach((m,i)=>moons[i].position.set(cx+m.x*scale,y+.08,-m.y*scale));};
    inspect=()=>({cx,scale,jupiterX:jupiter.position.x,jupiterZ:jupiter.position.z,moonPositions:moons.map(m=>[m.position.x,-m.position.z]),jupiterRadius:.24,moonRadii:[.048,.055,.065,.06],fitSlope:s0.fit.slope,fitIntercept:s0.fit.intercept});
  } else if(kind==='triangle-lamina'){
    camera={target:[0,1.65,0],position:[6.5,4.5,10]};
    const data=model.sample(0),scale=2.35/data.h,base=.42,N=32,thick=.08;
    makeBox(root,5.4,.18,.7,[0,.32,0],0x829992,'mass');
    const strips=[];
    for(let i=0;i<N;i++){
      const u0=i/N,u1=(i+1)/N,y0=base+2.35*u0,y1=base+2.35*u1,x0=2.35*(1-u0),x1=2.35*(1-u1),shape=new THREE.Shape();
      shape.moveTo(-x0,y0);shape.lineTo(x0,y0);shape.lineTo(x1,y1);shape.lineTo(-x1,y1);shape.closePath();
      const geom=new THREE.ExtrudeGeometry(shape,{depth:thick,bevelEnabled:false});const mesh=new THREE.Mesh(geom,mat(C.blue,{roughness:.65}));mesh.position.z=-thick/2;mesh.userData.tag='lamina';root.add(mesh);strips.push(mesh);
    }
    const outline=line([V(-2.35,base,.09),V(2.35,base,.09),V(0,base+2.35,.09),V(-2.35,base,.09)],0x3b5c58,'geometry');
    const scan=segment(root,V(),V(.1,0,0),.025,C.gold,'slice'),centroid=makeSphere(root,.095,[0,base,.17],C.teal,'center');
    const final=ring(root,.16,.022,[0,base+data.fullY*scale,.19],C.teal,'center');
    // The key must also become uniform when the uniform-density preset is
    // selected; otherwise it would misrepresent the chosen mass distribution.
    const densityKey=Array.from({length:7},(_,i)=>makeBox(root,.20,.24,.14,[2.75,.63+i*.25,-.15],C.blue,'density'));
    mark('lamina',()=>V(-1.55,1.1,.16),'三角薄板');mark('geometry',()=>V(.05,3.05,.12),'h=a/√2');
    mark('slice',()=>V(1.4,scan.position.y,.15),'积分薄条');mark('density',()=>V(2.75,2.65,0),'面密度 σ(y)');
    mark('mass',()=>V(-2.25,.55,.2),'累计质量');mark('center',()=>centroid.position.clone().add(V(.35,.25,.12)),'累计质心');
    update=s=>{
      strips.forEach((m,i)=>{const u=(i+.5)/N,gray=s.graded?0.78-.27*u:.60;const color=new THREE.Color().setHSL(.48,.21,gray);if(u<=s.p)color.lerp(new THREE.Color(C.teal),.35);m.material.color.copy(color);});
      densityKey.forEach((m,i)=>m.material.color.setHSL(.48,.21,s.graded?0.78-.27*(i+.5)/densityKey.length:.60));
      const half=s.width*scale/2,y=base+s.s*scale;
      if(half<1e-5){scan.visible=false;scan.position.set(0,y,.12);scan.scale.y=0;}
      else placeSegment(scan,V(-half,y,.12),V(half,y,.12),.025);
      centroid.visible=s.mass>1e-12;centroid.position.set(0,base+s.yCenter*scale,.22);final.position.set(0,base+s.fullY*scale,.16);
    };
    inspect=()=>({scale,base,scanY:scan.position.y,scanHalf:scan.scale.y/2,scanVisible:scan.visible,centroidY:centroid.position.y,centroidVisible:centroid.visible,finalY:final.position.y,height:2.35,densityKey:densityKey.map(m=>m.material.color.getHex())});
  } else return null;
  return {update,inspect,camera};
}
