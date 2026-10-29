/** Pure, deterministic mechanics models. A normalized progress maps to exactly one state. */
export const G = 9.8;
export const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const fixed = (v, digits = 2) => Number.isFinite(v) ? Number(v.toFixed(digits)).toString() : '—';
const read = (label, value, unit, tag, digits = 2) => ({ label, value: typeof value === 'number' ? fixed(value, digits) : value, unit, tag });
export const defaultParameters = lesson => Object.fromEntries(lesson.params.map(p => [p.key, p.value]));
const lerp = (a,b,t) => a+(b-a)*t;

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
  const q = {...defaultParameters(lesson),...input};
  let duration=6, clock='concept', timeUnit='s', stepBounds=[0,.25,.5,.75,1], events=[];
  let pre;
  switch(lesson.kind) {
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
      case 'vector': {
        const chosen=lesson.presets.find(x=>x.id===preset)||lesson.presets[0];
        const v=[[q.ax,q.ay,q.az],...chosen.others.map(a=>[...a])];
        const weights=v.map((_,i)=>i===0?clamp(p*4):i===1?clamp(p*4-1):clamp((p*4-2)*(v.length-2)-(i-2)));
        const R=[0,1,2].map(j=>v.reduce((sum,a)=>sum+a[j],0));
        const partial=[0,1,2].map(j=>v.reduce((sum,a,i)=>sum+a[j]*weights[i],0));
        return {...common,vectors:v,weights,R,partial,magnitude:Math.hypot(...R),showR:clamp(p*4-3),
          readouts:[read('合矢量',`(${R.map(x=>fixed(x,1)).join(', ')})`,'','R'),read('模长',Math.hypot(...R),'','R'),read('矢量数',v.length,'个','C')]};
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
        const g=10,W1=q.m1*g,W2=q.m2*g,RA=(2*W1+W2)/3,RB=(W1+2*W2)/3;
        return {...common,W1,W2,RA,RB,residual:RA+RB-W1-W2,moment:3*q.b*RB-q.b*W1-2*q.b*W2,
          readouts:[read('左支反力 R_A',RA,'N','RA'),read('右支反力 R_B',RB,'N','RB'),read('合力残差',RA+RB-W1-W2,'N','moment',4)]};
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
