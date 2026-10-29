import { createApplicationModel } from './application-models.js';
/** Pure, deterministic mechanics models. A normalized progress maps to exactly one state. */
export const G = 9.8;
export const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const fixed = (v, digits = 2) => Number.isFinite(v) ? Number(v.toFixed(digits)).toString() : '—';
const read = (label, value, unit, tag, digits = 2) => ({ label, value: typeof value === 'number' ? fixed(value, digits) : value, unit, tag });
export const defaultParameters = lesson => Object.fromEntries(lesson.params.map(p => [p.key, p.value]));
const lerp = (a,b,t) => a+(b-a)*t;
const add2=(a,b)=>a.map((v,i)=>v+b[i]);
const sub2=(a,b)=>a.map((v,i)=>v-b[i]);
const scale2=(a,k)=>a.map(v=>v*k);
const midpoint=(a,b)=>scale2(add2(a,b),.5);

function rodSamples(q) {
  const dt = .002, I = q.m*q.L*q.L/3;
  const f = ([angle, omega]) => [omega, 3*G/(2*q.L)*Math.cos(angle)];
  let t=0, state=[0,0], data=[{t,angle:0,omega:0}];
  // RK4, then linearly interpolate the terminal crossing at the first vertical position.
  for (let i=0;i<20000;i++) {
    const k1=f(state), k2=f(state.map((v,j)=>v+dt*k1[j]/2));
    const k3=f(state.map((v,j)=>v+dt*k2[j]/2)), k4=f(state.map((v,j)=>v+dt*k3[j]));
    const next=state.map((v,j)=>v+dt*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6);
    if(next[0]>=Math.PI/2) {
      const f=(Math.PI/2-state[0])/(next[0]-state[0]);
      data.push({t:t+f*dt,angle:Math.PI/2,omega:lerp(state[1],next[1],f)}); break;
    }
    t+=dt;state=next;data.push({t,angle:state[0],omega:state[1]});
  }
  return { data, duration:data.at(-1).t, I, dt };
}

export function createModel(lesson, input, preset='abc') {
  const application=createApplicationModel(lesson,input,preset);
  if(application)return application;
  const q = {...defaultParameters(lesson),...input};
  let duration=6, clock='concept', timeUnit='s', stepBounds=[0,.25,.5,.75,1], events=[];
  let pre;
  switch(lesson.kind) {
    case 'straight-car': {
      const endSpeed=Math.sqrt(q.v0*q.v0+2*q.a*q.distance);
      duration=2*q.distance/(endSpeed+q.v0);clock='physical';pre={endSpeed};
      events=[{type:'arrives-at-B',time:duration}];break;
    }
    case 'level-projectile': {
      const th=q.angle*Math.PI/180,vx=q.v0*Math.cos(th),vy=q.v0*Math.sin(th);
      duration=2*vy/q.g;clock='physical';const range=vx*duration,maxHeight=vy*vy/(2*q.g);
      pre={vx,vy,range,maxHeight,runnerSpeed:(range-q.runnerStart)/duration};
      events=[{type:'same-height-landing',time:duration}];break;
    }
    case 'projectile-elevation': {
      const th=q.angle*Math.PI/180,g=10;
      const v0=Math.sqrt(g*q.distance*q.distance/(2*Math.cos(th)**2*(q.distance*Math.tan(th)-q.height)));
      const vx=v0*Math.cos(th),vy=v0*Math.sin(th);duration=q.distance/vx;clock='physical';pre={v0,vx,vy,g};
      events=[{type:'reaches-B',time:duration}];break;
    }
    case 'projectiles-meet': {
      const g=10,L=q.height/2;duration=q.height/(2*q.v);clock='physical';pre={g,L};
      events=[{type:'first-meeting',time:duration}];break;
    }
    case 'atwood': {
      const a=G*(q.m2-q.m1)/(q.m1+q.m2),T=2*G*q.m1*q.m2/(q.m1+q.m2);
      // Animate up to 0.55 m of travel; equal masses remain at rest for a finite timeline.
      duration=Math.abs(a)>1e-9?Math.sqrt(1.1/Math.abs(a)):3;clock='physical';pre={a,T};
      if(Math.abs(a)>1e-9)events=[{type:'end-of-shown-travel',time:duration}];break;
    }
    case 'chase': duration=2*q.v/q.a; clock='physical'; break;
    case 'train': {
      duration=q.tunnelTime;clock='physical';const p=q.pass/duration;
      stepBounds=[0,p/2,p,1-p,1];events=[{type:'rear-passes-observer',time:q.pass},{type:'head-leaves-tunnel',time:duration-q.pass},{type:'rear-leaves-tunnel',time:duration}];break;
    }
    case 'barrier': {
      const vx=Math.sqrt(q.L*10);duration=5*q.L/vx;clock='physical';stepBounds=[0,.2,.4,.6,1];
      events=[{type:'passes-A',time:2*q.L/vx},{type:'passes-B',time:3*q.L/vx}];break;
    }
    case 'ships': {
      const a=q.angle*Math.PI/180,rx=-q.vB*Math.sin(a),ry=q.vB*Math.cos(a)-q.vA;
      const tClosest=-q.d*rx/(rx*rx+ry*ry);duration=2*tClosest;clock='physical';timeUnit='h';break;
    }
    case 'variable-velocity': duration=Math.sqrt(3*q.v0/q.k);clock='physical';break;
    case 'cubic-velocity': {
      duration=4;clock='physical';
      // v is strictly decreasing for 0<t<4 for all allowed c: exactly one turn.
      const velocity=t=>t**3-9*t*t+q.c;let lo=0,hi=4;
      for(let i=0;i<64;i++){const mid=(lo+hi)/2;if(velocity(mid)>0)lo=mid;else hi=mid;}
      const turnTime=(lo+hi)/2,C=q.xref+128-4*q.c;
      const position=t=>t**4/4-3*t**3+q.c*t+C;
      pre={turnTime,C,minX:q.xref,maxX:position(turnTime)};
      const b=turnTime/duration;stepBounds=[0,b/2,b,(1+b)/2,1];
      events=[{type:'velocity-zero-turn',time:turnTime}];break;
    }
    case 'wall-bounce': {
      const a=q.angle*Math.PI/180,vx=q.v0*Math.cos(a),vy=q.v0*Math.sin(a),tWall=q.d/vx;
      duration=(vy+Math.sqrt(vy*vy+2*G*q.h))/G;clock='physical';
      if(tWall>=duration)throw new Error('Parameter range must hit the wall before landing');
      const p=tWall/duration;stepBounds=[0,p/2,p,(1+p)/2,1];
      events=[{type:'elastic-wall-impact',time:tWall,discontinuous:['vx'],before:{vx:-vx,vy:vy-G*tWall},after:{vx,vy:vy-G*tWall}}];break;
    }
    case 'two-incline': {
      const a=q.angle*Math.PI/180,acc=G*(.6*Math.sin(a)-q.mu*Math.cos(a));
      if(acc<=0)throw new Error('The illustrated two-incline model assumes B slides down');
      duration=Math.sqrt(2/acc);clock='physical';break;
    }
    case 'loaded-pulley': {
      const acc=((q.mA-2*q.mB)*10-q.F)/(q.mA+4*q.mB);
      duration=Math.abs(acc)>1e-9?Math.sqrt(1/Math.abs(acc)):3;clock='physical';break;
    }
    case 'incline': {const th=q.angle*Math.PI/180,a=Math.max(0,G*(Math.sin(th)-q.mu*Math.cos(th)));duration=a>1e-9?Math.sqrt(6/a):3;clock='physical';break;}
    case 'projectile': duration=(q.vy+Math.sqrt(q.vy*q.vy+2*10*q.y0))/10; clock='physical'; break;
    case 'friction': {
      const drive=Math.max(0,q.F-q.mu*q.m*G),a=drive/q.m;
      duration=a>1e-9?Math.sqrt(6/a):3;clock='physical';break;
    }
    case 'pulley': { const a=2*q.mB*10/(q.mA+4*q.mB);duration=Math.sqrt(1.4/a);clock='physical';break; }
    case 'energy': {
      const th=q.angle*Math.PI/180,s=q.h/Math.sin(th),a=G*Math.sin(th),v=Math.sqrt(2*G*q.h);
      const rampTime=Math.sqrt(2*s/a);duration=rampTime+v/(q.mu*G);clock='physical';
      const boundary=rampTime/duration;stepBounds=[0,boundary/2,boundary,(1+boundary)/2,1];break;
    }
    case 'rod': pre=rodSamples(q);duration=pre.duration;clock='physical';break;
  }
  function sample(progress) {
    const p=clamp(progress), t=p*duration;
    const common={p,t,duration,clock,timeUnit};
    switch(lesson.kind) {
      case 'dot-cross': {
        const A=[q.ax,q.ay,q.az],B=[1,-1,-1];
        const dot=A[0]-A[1]-A[2],cross=[A[2]-A[1],A[0]+A[2],-A[0]-A[1]];
        const magA=Math.hypot(...A),magB=Math.sqrt(3),area=Math.hypot(...cross);
        const angle=Math.acos(clamp(dot/(magA*magB),-1,1));
        return {...common,A,B,dot,cross,area,angle,orthogonalityA:A.reduce((x,v,i)=>x+v*cross[i],0),orthogonalityB:B.reduce((x,v,i)=>x+v*cross[i],0),
          readouts:[read('点积 A·B',dot,'','dot'),read('叉积 A×B',`(${cross.join(', ')})`,'','cross'),read('面积',area,'','area',3),read('夹角',angle*180/Math.PI,'°','dot',1)]};
      }
      case 'straight-car': {
        const x=q.v0*t+.5*q.a*t*t,v=q.v0+q.a*t;
        return {...common,x,v,a:q.a,endSpeed:pre.endSpeed,distance:q.distance,
          readouts:[read('当前位置',x,'m','position'),read('当前速度',v,'m/s','velocity'),read('到达时间',duration,'s','finish'),read('终点速度',pre.endSpeed,'m/s','finish')]};
      }
      case 'level-projectile': {
        const {vx,vy,range,maxHeight,runnerSpeed}=pre,x=vx*t,y=vy*t-.5*q.g*t*t;
        const runnerX=q.runnerStart+runnerSpeed*t,hasRunner=preset==='receiver';
        return {...common,x,y,vx,vy:vy-q.g*t,range,maxHeight,runnerX,runnerSpeed,hasRunner,
          readouts:[read('飞行时间',duration,'s','landing'),read('落点 R',range,'m','landing'),read('当前高度',y,'m','ball'),...(hasRunner?[read('跑者速度',runnerSpeed,'m/s','landing')]:[read('最高点',maxHeight,'m','trajectory')])]};
      }
      case 'projectile-elevation': {
        const {v0,vx,vy,g}=pre,x=vx*t,y=vy*t-.5*g*t*t;
        return {...common,v0,vx,vy:vy-g*t,x,y,targetX:q.distance,targetY:q.height,
          readouts:[read('所需初速度',v0,'m/s','velocity'),read('到达 B',duration,'s','target'),read('当前 x',x,'m','ball'),read('当前 y',y,'m','ball')]};
      }
      case 'projectiles-meet': {
        const {g,L}=pre,xA=q.v*t,yA=q.height-.5*g*t*t,xB=L,yB=2*q.v*t-.5*g*t*t;
        return {...common,L,xA,yA,xB,yB,meetingY:q.height-.5*g*duration*duration,
          readouts:[read('水平距离 L',L,'m','meeting'),read('相遇时间',duration,'s','meeting'),read('A 高度',yA,'m','ballA'),read('B 高度',yB,'m','ballB')]};
      }
      case 'atwood': {
        const {a,T}=pre,displacement=.5*a*t*t,speed=a*t;
        return {...common,a,T,displacement,speed,weight1:q.m1*G,weight2:q.m2*G,
          residual1:T-q.m1*G-q.m1*a,residual2:q.m2*G-T-q.m2*a,
          readouts:[read('加速度 a',a,'m/s²','accel'),read('绳张力 T',T,'N','tension'),read('右侧位移',displacement,'m','m2'),read('右侧速度',speed,'m/s','m2')]};
      }
      case 'vector': {
        const chosen=lesson.presets.find(x=>x.id===preset)||lesson.presets[0];
        const v=[[q.ax,q.ay,q.az],...chosen.others.map(a=>[...a])];
        const weights=v.map((_,i)=>i===0?clamp(p*4):i===1?clamp(p*4-1):clamp((p*4-2)*(v.length-2)-(i-2)));
        const R=[0,1,2].map(j=>v.reduce((sum,a)=>sum+a[j],0));
        const partial=[0,1,2].map(j=>v.reduce((sum,a,i)=>sum+a[j]*weights[i],0));
        return {...common,vectors:v,weights,R,partial,magnitude:Math.hypot(...R),showR:clamp(p*4-3),
          readouts:[read('合矢量',`(${R.map(x=>fixed(x,1)).join(', ')})`,'','R'),read('模长',Math.hypot(...R),'','R'),read('矢量数',v.length,'个','A')]};
      }
      case 'vector-metric': {
        const A=[q.ax,q.ay,q.az],B=[0,1,0],magnitude=Math.hypot(...A),dot=q.ay;
        const angle=Math.acos(clamp(dot/magnitude,-1,1));
        return {...common,A,B,magnitude,dot,angle,cosine:dot/magnitude,
          readouts:[read('矢量模长',magnitude,'','A',3),read('A·B',dot,'','B'),read('夹角 θ',angle*180/Math.PI,'°','angleMarker',1)]};
      }
      case 'chord-vector': {
        // AB=8 preserves the source's 2+6 total; the displayed circle is uniformly scaled.
        const a=q.angle*Math.PI/180,diameter=8/Math.sin(a);
        const A=[diameter*Math.cos(a)**2,diameter*Math.cos(a)*Math.sin(a)],B=[diameter,0];
        const P=add2(scale2(A,1-q.fraction),scale2(B,q.fraction));
        const AP=8*q.fraction,PB=8*(1-q.fraction);
        return {...common,A,B,P,diameter,AP,PB,lambda:q.fraction,coefficientA:1-q.fraction,coefficientB:q.fraction,
          readouts:[read('AP',AP,'','division'),read('PB',PB,'','division'),read('a 的系数',1-q.fraction,'','A'),read('b 的系数',q.fraction,'','B')]};
      }
      case 'quad-midpoint': {
        const Q=[-q.base/2,0],P=[q.base/2,0],M=[q.skew-q.top/2,2.65],N=[q.skew+q.top/2,2.35];
        const points=[midpoint(M,N),midpoint(N,P),midpoint(P,Q),midpoint(Q,M)];
        const O=midpoint(points[1],points[3]),b=sub2(N,M),d=sub2(Q,P),x=sub2(O,points[3]);
        return {...common,Q,P,M,N,points,O,b,d,x,residual:sub2(x,scale2(sub2(b,d),.25)),
          readouts:[read('上边 b',`(${b.map(v=>fixed(v,2)).join(', ')})`,'','B'),read('底边 d',`(${d.map(v=>fixed(v,2)).join(', ')})`,'','D'),read('半段 x',`(${x.map(v=>fixed(v,2)).join(', ')})`,'','result')]};
      }
      case 'triangle-centroid': {
        const L=[-2,0],R=[2,0],T=[q.tip,q.height],H=midpoint(L,R),E=midpoint(R,T);
        const G=scale2(add2(add2(L,R),T),1/3),A=sub2(T,L),lambda=preset==='full-side'?1:2,B=scale2(sub2(T,R),1/lambda),x=sub2(G,H);
        const expr=scale2(add2(A,scale2(B,lambda)),1/6);
        return {...common,L,R,T,H,E,G,A,B,x,lambda,m:1/6,n:lambda/6,coefficientSum:(1+lambda)/6,residual:sub2(x,expr),
          readouts:[read('B 的定义',lambda===2?'半边':'整边','','B'),read('m 与 n',lambda===2?'1/6, 1/3':'1/6, 1/6','','result'),read('m+n',lambda===2?'1/2':'1/3','','result'),read('重心段 x',`(${x.map(v=>fixed(v,2)).join(', ')})`,'','center')]};
      }
      case 'two-balls': {
        const g=10,r=1,rho=2*r/Math.sqrt(3),container=r+rho;
        const angle=Math.atan2(Math.sqrt(3)*(q.m1-q.m2),q.m1+q.m2),e=[Math.cos(angle),Math.sin(angle)],n=[-Math.sin(angle),Math.cos(angle)];
        const C1=sub2(scale2(n,-rho/2),scale2(e,r)),C2=add2(scale2(n,-rho/2),scale2(e,r));
        const n1=scale2(C1,-1/rho),n2=scale2(C2,-1/rho),N1=2*q.m1*g*Math.cos(angle),N2=2*q.m2*g*Math.cos(angle);
        const contact=q.m1*g*(Math.sqrt(3)*Math.cos(angle)-Math.sin(angle));
        const res1=add2(add2(scale2(n1,N1),scale2(e,-contact)),[0,-q.m1*g]);
        const res2=add2(add2(scale2(n2,N2),scale2(e,contact)),[0,-q.m2*g]);
        return {...common,r,rho,container,angle,e,C1,C2,n1,n2,N1,N2,contact,res1,res2,
          readouts:[read('倾角 α',angle*180/Math.PI,'°','angleMarker',1),read('球间接触力',contact,'N','contact'),read('壁反力 N₁',N1,'N','normal'),read('壁反力 N₂',N2,'N','normal')]};
      }
      case 'stacked-pulley': {
        const g=10,T=q.F/2,topRequired=T,groundRequired=q.F,topLimit=q.mu*q.m*g,groundLimit=q.mu*(q.M+q.m)*g;
        const maximum=Math.min(2*topLimit,groundLimit),balanced=q.F<=maximum+1e-9,limiting=2*topLimit<=groundLimit?'层间':'地面';
        const muRequired=Math.max(q.F/(2*q.m*g),q.F/((q.M+q.m)*g));
        return {...common,T,topRequired,groundRequired,topLimit,groundLimit,maximum,balanced,limiting,muRequired,
          residualTop:T-topRequired,residualBottom:T+topRequired-groundRequired,
          readouts:[read('绳张力 T',T,'N','tension'),read('最大静力拉力',maximum,'N','frictionTop'),read('最先达到极限',limiting,'','frictionGround'),read('静止可行',balanced?'是':'否','','appliedForce')]};
      }
      case 'cubic-velocity': {
        const x=t**4/4-3*t**3+q.c*t+pre.C,v=t**3-9*t*t+q.c,a=3*t*t-18*t;
        return {...common,x,v,a,C:pre.C,turnTime:pre.turnTime,minX:pre.minX,maxX:pre.maxX,
          readouts:[read('位置 x',x,'m','position'),read('速度 v',v,'m/s','velocity'),read('积分常数 C',pre.C,'m','position'),read('折返时刻',pre.turnTime,'s','turn')]};
      }
      case 'direction': {
        const direction=[-4,-2,2],length=Math.sqrt(24),unit=direction.map(x=>x/length),result=unit.map(x=>x*q.magnitude);
        return {...common,direction,length,unit,result,origin:[4,2,0],target:[0,0,2],
          readouts:[read('方向长度',length,'','direction'),read('指定模长',q.magnitude,'','result'),read('目标矢量',`(${result.map(x=>fixed(x,2)).join(', ')})`,'','result')]};
      }
      case 'sphere-cylinder': {
        const g=10,dx=Math.sqrt(q.r*q.r+2*q.R*q.r),distance=q.R+q.r,sin=q.R/distance,cos=dx/distance;
        const N=q.m*g/sin,T=N*cos,alpha=Math.asin(sin);
        return {...common,dx,distance,sin,cos,N,T,alpha,residualX:N*cos-T,residualY:N*sin-q.m*g,
          readouts:[read('绳张力 T',T,'N','tension'),read('接触法向力 N',N,'N','normal'),read('法线角 α',alpha*180/Math.PI,'°','geometry',1)]};
      }
      case 'train': {
        const v=q.length/(q.tunnelTime-q.pass),trainLength=v*q.pass,head=v*t,rear=head-trainLength;
        return {...common,v,trainLength,head,rear,observerPassed:p>=stepBounds[2],headExited:p>=stepBounds[3],
          readouts:[read('列车速度',v,'m/s','train'),read('车身长度',trainLength,'m','train'),read('车头位置',head,'m','train'),read('车尾位置',rear,'m','train')]};
      }
      case 'barrier': {
        const g=10,vx=Math.sqrt(q.L*g),vy=2.5*vx,speed=Math.hypot(vx,vy),x=vx*t,y=Math.max(0,vy*t-.5*g*t*t),currentVy=vy-g*t;
        return {...common,x,y,vx,vy:currentVy,initialVy:vy,speed,angle:Math.atan(2.5),apexHeight:3.125*q.L,
          readouts:[read('位置 x',x,'m','path'),read('高度 y',y,'m','path'),read('初速度',speed,'m/s','velocity'),read('发射角',Math.atan(2.5)*180/Math.PI,'°','velocity',1)]};
      }
      case 'beam': {
        const g=10,W1=q.m1*g,W2=q.m2*g,k=preset==='code'?2:4,RB=(W1+k*W2)/3,RA=W1+W2-RB;
        const stable=RA>=-1e-9&&RB>=-1e-9;
        return {...common,W1,W2,k,RA,RB,stable,residual:RA+RB-W1-W2,moment:3*q.b*RB-q.b*W1-k*q.b*W2,
          readouts:[read('左支座 R_A',RA,'N','RA'),read('右支座 R_B',RB,'N','RB'),read('载荷位置',`${k}b`,'','W2'),read('支座可接触',stable?'是':'否','','RA')]};
      }
      case 'equilibrium': {
        const a=q.angle*Math.PI/180,T=q.m2*G,N=q.m1*G-T*Math.sin(a),f=T*Math.cos(a),mu=f/N;
        return {...common,angle:a,T,N,f,mu,W1:q.m1*G,W2:q.m2*G,
          readouts:[read('绳张力 T',T,'N','tension'),read('法向力 N',N,'N','normal'),read('最小 μ',mu,'','friction',3)]};
      }
      case 'ladder': {
        const angle=q.angle*Math.PI/180,wall=q.weight/(2*Math.tan(angle)),floor=q.weight,friction=wall,mu=friction/floor;
        return {...common,angle,wall,floor,friction,mu,weight:q.weight,
          readouts:[read('墙面反力',wall,'N','wall'),read('地面摩擦',friction,'N','friction'),read('最小 μ',mu,'','friction',3)]};
      }
      case 'chase': {
        const car=.5*q.a*t*t, truck=q.v*t, end=q.v*duration;
        return {...common,car,truck,end,carV:q.a*t,truckV:q.v,carRatio:car/end,truckRatio:truck/end,
          readouts:[read('汽车位置',car,'m','car',1),read('卡车位置',truck,'m','truck',1),read('再次相遇',duration,'s','meeting',1)]};
      }
      case 'ships': {
        const angle=q.angle*Math.PI/180,bx=-q.vB*Math.sin(angle),by=q.vB*Math.cos(angle),rx=bx,ry=by-q.vA;
        const xA=0,yA=q.vA*t,xB=q.d+bx*t,yB=by*t,dx=xB-xA,dy=yB-yA;
        const closestTime=-q.d*rx/(rx*rx+ry*ry),closestDistance=q.d*Math.abs(ry)/Math.hypot(rx,ry);
        return {...common,angle,xA,yA,xB,yB,dx,dy,vAx:0,vAy:q.vA,vBx:bx,vBy:by,relativeVx:rx,relativeVy:ry,
          distance:Math.hypot(dx,dy),closestTime,closestDistance,
          readouts:[read('当前距离',Math.hypot(dx,dy),'km','separation'),read('最近距离',closestDistance,'km','closest'),read('最近时刻',closestTime,'h','closest',3)]};
      }
      case 'wall-bounce': {
        const angle=q.angle*Math.PI/180,vx0=q.v0*Math.cos(angle),vy0=q.v0*Math.sin(angle),tWall=q.d/vx0,bounced=p>=stepBounds[2];
        const x=bounced?Math.max(0,vx0*(t-tWall)):Math.max(0,q.d-vx0*t),y=Math.max(0,q.h+vy0*t-.5*G*t*t),vx=bounced?vx0:-vx0,vy=vy0-G*t;
        const wallHeight=q.h+vy0*tWall-.5*G*tWall*tWall,landingX=vx0*(duration-tWall);
        return {...common,angle,x,y,vx,vy,bounced,tWall,wallHeight,landingX,energy:.5*(vx*vx+vy*vy)+G*y,
          readouts:[read('距墙 x',x,'m','position'),read('高度 y',y,'m','position'),read('速度 (vx, vy)',`(${fixed(vx)}, ${fixed(vy)})`,'m/s','velocity'),read('撞墙高度',wallHeight,'m','impact')]};
      }
      case 'two-incline': {
        const angle=q.angle*Math.PI/180,N_A=q.m*G*Math.cos(angle),N_B=4*N_A,fA=q.mu*N_A,fB=q.mu*N_B;
        const a=G*(.6*Math.sin(angle)-q.mu*Math.cos(angle)),T=8*q.m*G*Math.sin(angle)/5,s=.5*a*t*t;
        return {...common,angle,N_A,N_B,fA,fB,a,T,s,v:a*t,residualA:T-q.m*G*Math.sin(angle)-fA-q.m*a,
          residualB:4*q.m*G*Math.sin(angle)-T-fB-4*q.m*a,
          readouts:[read('绳张力 T',T,'N','tension'),read('加速度',a,'m/s²','accel'),read('每侧位移',s,'m','constraint'),read('摩擦力 (A, B)',`(${fixed(fA)}, ${fixed(fB)})`,'N','friction')]};
      }
      case 'loaded-pulley': {
        const g=10,aA=((q.mA-2*q.mB)*g-q.F)/(q.mA+4*q.mB),aB=2*aA,T=q.mB*(g+aB),sA=.5*aA*t*t,sB=2*sA;
        return {...common,aA,aB,T,sA,sB,vA:aA*t,vB:aB*t,residualA:q.mA*g-q.F-2*T-q.mA*aA,residualB:T-q.mB*g-q.mB*aB,
          readouts:[read('A 向下加速度',aA,'m/s²','accel'),read('B 向上加速度',aB,'m/s²','accel'),read('绳张力 T',T,'N','tension'),read('A 向下位移',sA,'m','blockA')]};
      }
      case 'variable-velocity': {
        const x=q.v0*t-q.k*t**3/3,v=q.v0-q.k*t*t,a=-2*q.k*t,turnTime=Math.sqrt(q.v0/q.k);
        const maxX=q.v0*turnTime-q.k*turnTime**3/3;
        return {...common,x,v,a,turnTime,maxX,
          readouts:[read('位置 x',x,'m','position'),read('速度 v',v,'m/s','velocity'),read('加速度 a',a,'m/s²','accel'),read('折返时刻',turnTime,'s','turn')]};
      }
      case 'incline': {
        const angle=q.angle*Math.PI/180,N=q.m*G*Math.cos(angle),parallel=q.m*G*Math.sin(angle),limit=q.mu*N;
        const sliding=parallel>limit+1e-9,friction=sliding?limit:parallel,a=(parallel-friction)/q.m;
        return {...common,angle,N,parallel,limit,sliding,friction,a,s:.5*a*t*t,v:a*t,
          readouts:[read('法向力 N',N,'N','normal'),read('摩擦力',friction,'N','friction'),read('加速度',a,'m/s²','accel'),read('状态',sliding?'下滑':'静止','','position')]};
      }
      case 'projectile': {
        const g=10,x=.5*q.ax*t*t,y=q.y0+q.vy*t-.5*g*t*t,vx=q.ax*t,vy=q.vy-g*t;
        const range=.5*q.ax*duration**2,maxY=q.y0+q.vy*q.vy/(2*g);
        return {...common,x,y:Math.max(0,y),vx,vy,g,range,maxY,
          readouts:[read('水平位置 x',x,'m','position',1),read('高度 y',Math.max(0,y),'m','position',1),read('速率',Math.hypot(vx,vy),'m/s','velocity',1)]};
      }
      case 'friction': {
        const N=q.m*G,limit=q.mu*N,sliding=q.F>limit+1e-9,friction=sliding?limit:q.F,a=(q.F-friction)/q.m;
        return {...common,N,limit,sliding,friction,a,x:.5*a*t*t,v:a*t,
          readouts:[read('加速度',a,'m/s²','accel'),read('摩擦力',friction,'N','friction'),read('状态',sliding?'滑动':'静止','','force')]};
      }
      case 'pulley': {
        const g=10,aA=2*q.mB*g/(q.mA+4*q.mB),aB=2*aA,T=q.mA*aA,sA=.5*aA*t*t,sB=2*sA;
        return {...common,aA,aB,T,Tlower:T/2,sA,sB,vA:aA*t,vB:aB*t,
          readouts:[read('A 的加速度',aA,'m/s²','accel'),read('B 的加速度',aB,'m/s²','accel'),read('主绳张力 T',T,'N','tension')]};
      }
      case 'energy': {
        const th=q.angle*Math.PI/180,sRamp=q.h/Math.sin(th),a=G*Math.sin(th),tRamp=Math.sqrt(2*sRamp/a);
        const vB=Math.sqrt(2*G*q.h),atRamp=t<=tRamp,dt=Math.max(0,t-tRamp);
        const s=atRamp?.5*a*t*t:sRamp,x=atRamp?0:Math.min(q.h/q.mu,vB*dt-.5*q.mu*G*dt*dt);
        const y=atRamp?Math.max(0,q.h-s*Math.sin(th)):0,v=atRamp?a*t:Math.max(0,vB-q.mu*G*dt);
        const K=.5*v*v,U=G*y,heat=q.mu*G*x,E=G*q.h;
        return {...common,angle:th,sRamp,tRamp,atRamp,s,x,y,v,K,U,heat,E,stop:q.h/q.mu,residual:K+U+heat-E,
          readouts:[read('动能 K',K,'J','energy'),read('势能 U',U,'J','height'),read('摩擦耗散',heat,'J','friction'),read('停止距离',q.h/q.mu,'m','friction')]};
      }
      case 'rod': {
        const d=pre.data, i=Math.min(d.length-2,Math.floor(t/pre.dt)),lo=d[i],hi=d[i+1];
        const f=clamp((t-lo.t)/(hi.t-lo.t));
        const angle=lerp(lo.angle,hi.angle,f),omega=lerp(lo.omega,hi.omega,f),alpha=3*G/(2*q.L)*Math.cos(angle);
        const K=.5*pre.I*omega*omega,U=q.m*G*q.L/2*(1-Math.sin(angle));
        return {...common,angle,omega,alpha,I:pre.I,K,U,residual:K+U-q.m*G*q.L/2,
          readouts:[read('转角 θ',angle*180/Math.PI,'°','angular',1),read('角速度 ω',omega,'rad/s','angular'),read('角加速度 α',alpha,'rad/s²','torque')]};
      }
      case 'centroid': {
        const points=[{m:3,x:0,y:0},{m:4,x:0,y:3},{m:3,x:2,y:2},{m:2,x:4,y:0},{m:q.m5,x:4,y:3}];
        const weights=points.map((_,i)=>clamp(p*5-i));
        const M=points.reduce((a,v,i)=>a+v.m*weights[i],0),mx=points.reduce((a,v,i)=>a+v.m*v.x*weights[i],0),my=points.reduce((a,v,i)=>a+v.m*v.y*weights[i],0);
        const cg=M>1e-10?{x:mx/M,y:my/M}:null;
        return {...common,points,weights,M,mx,my,cg,
          readouts:[read('已计入质量',M,'kg','mass'),read('当前质心',cg?`(${fixed(cg.x)}, ${fixed(cg.y)})`:'—','m','center'),read('x 方向一阶矩',mx,'kg·m','position')]};
      }
      case 'cone': {
        const u=p,den=u-u*u+u**3/3,num=u*u/2-2*u**3/3+u**4/4;
        const M=Math.PI*q.r*q.r*q.h*den,zc=den>1e-10?q.h*num/den:0,total=Math.PI*q.r*q.r*q.h/3;
        return {...common,u,radius:q.r*(1-u),M,total,zc,target:q.h/4,
          readouts:[read('扫描高度',u*q.h,'m','slice'),read('累计质量',M,'kg','mass'),read('累计质心',zc,'m','center'),read('整体质心',q.h/4,'m','center')]};
      }
      case 'disk': {
        const u=p,M=q.m*u*u,I=.5*q.m*q.r*q.r*u**4,total=.5*q.m*q.r*q.r;
        return {...common,u,radius:q.r*u,M,I,total,
          readouts:[read('积分半径',q.r*u,'m','ring'),read('累计质量',M,'kg','mass'),read('累计惯量',I,'kg·m²','inertia'),read('完整惯量',total,'kg·m²','inertia')]};
      }
      default: throw new Error(`Unknown mechanics model: ${lesson.kind}`);
    }
  }
  return { lesson, parameters:q, preset, duration, clock, timeUnit, stepBounds, events, sample };
}

export function currentStep(lesson, progress, model) {
  const p=clamp(progress,0,1-1e-10),bounds=model?.stepBounds;
  if(bounds) return Math.min(lesson.steps.length-1,Math.max(0,bounds.findIndex((v,i)=>i>0 && p<v)-1));
  return Math.min(lesson.steps.length-1,Math.floor(p*lesson.steps.length));
}
