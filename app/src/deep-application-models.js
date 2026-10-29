/** Further source-grounded models. The 3D scene only consumes sample(t).
 * Pure state functions use SI where stated; the binary example uses G=1. */
const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
const fmt=(v,d=2)=>Number.isFinite(v)?String(Number(v.toFixed(d))):'—';
const read=(label,value,unit,tag,d=2)=>({label,value:typeof value==='number'?fmt(value,d):value,unit,tag});
const defaults=l=>Object.fromEntries(l.params.map(p=>[p.key,p.value]));
const DAY=86400;
const kinds=new Set(['car-ratio','two-stones','free-wedge','damped-cart','driven-cart','crank-pendulum','equal-spring-modes','binary-stars','jupiter-moons','triangle-lamina']);

// Exact homogeneous solution of m*x'' + b*x' + k*x=0, including the
// numerically important critical-damping limit.
function homogeneous(x0,v0,m,b,k,t){
  const beta=b/(2*m),w0sq=k/m,disc=w0sq-beta*beta;
  if(Math.abs(disc)<1e-10){
    const B=v0+beta*x0,e=Math.exp(-beta*t);
    return {x:e*(x0+B*t),v:e*(B-beta*(x0+B*t))};
  }
  if(disc>0){
    const w=Math.sqrt(disc),B=(v0+beta*x0)/w,c=Math.cos(w*t),s=Math.sin(w*t),e=Math.exp(-beta*t),inner=x0*c+B*s;
    return {x:e*inner,v:e*(-x0*w*s+B*w*c-beta*inner)};
  }
  const d=Math.sqrt(-disc),l1=-beta+d,l2=-beta-d,c1=(v0-l2*x0)/(l1-l2),c2=x0-c1;
  return {x:c1*Math.exp(l1*t)+c2*Math.exp(l2*t),v:l1*c1*Math.exp(l1*t)+l2*c2*Math.exp(l2*t)};
}
function driven(q,t){
  const b=.2,k=1,m=1,w=q.omega,D=(k-m*w*w)**2+(b*w)**2;
  const xp0=q.F*(k-m*w*w)/D,vp0=q.F*b*w*w/D;
  const transient=homogeneous(q.x0-xp0,-vp0,m,b,k,t),c=Math.cos(w*t),s=Math.sin(w*t);
  const xp=q.F*((k-m*w*w)*c+b*w*s)/D,vp=q.F*w*(-(k-m*w*w)*s+b*w*c)/D;
  return {x:transient.x+xp,v:transient.v+vp,steady:xp,amplitude:q.F/Math.sqrt(D),force:q.F*c};
}
function rk4Step(y,t,h,fun){
  const plus=(y,k,f)=>y.map((x,i)=>x+f*k[i]);
  const k1=fun(y,t),k2=fun(plus(y,k1,h/2),t+h/2),k3=fun(plus(y,k2,h/2),t+h/2),k4=fun(plus(y,k3,h),t+h);
  return y.map((x,i)=>x+h*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);
}
function integrate(y0,duration,step,fun){
  const n=Math.ceil(duration/step),h=duration/n,rows=[y0];let y=y0;
  for(let i=0;i<n;i++){y=rk4Step(y,i*h,h,fun);rows.push(y);}
  return {rows,h,duration};
}
function at(data,t){
  const i=Math.min(data.rows.length-2,Math.floor(clamp(t,0,data.duration)/data.h));
  const f=clamp((t-i*data.h)/data.h);
  return data.rows[i].map((v,j)=>v+(data.rows[i+1][j]-v)*f);
}
function relativeKepler(t,mu,r0,v0){
  const a=1/(2/r0-v0*v0/mu),e=r0/a-1,n=Math.sqrt(mu/(a*a*a));
  let mean=(Math.PI+n*t)%(2*Math.PI),E=mean;
  for(let i=0;i<20;i++)E-=(E-e*Math.sin(E)-mean)/(1-e*Math.cos(E));
  const b=Math.sqrt(1-e*e),edot=n/(1-e*Math.cos(E));
  const x=-a*(Math.cos(E)-e),y=-a*b*Math.sin(E),vx=a*Math.sin(E)*edot,vy=-a*b*Math.cos(E)*edot;
  return {a,e,E,x,y,vx,vy,r:Math.hypot(x,y),period:2*Math.PI/n,energy:.5*(vx*vx+vy*vy)-mu/Math.hypot(x,y),h:x*vy-y*vx};
}
function fitLine(x,y){
  const mx=x.reduce((s,a)=>s+a,0)/x.length,my=y.reduce((s,a)=>s+a,0)/y.length;
  const slope=x.reduce((s,a,i)=>s+(a-mx)*(y[i]-my),0)/x.reduce((s,a)=>s+(a-mx)**2,0);
  return {slope,intercept:my-slope*mx};
}
export function createDeepApplicationModel(lesson,input={},preset='abc'){
  if(!kinds.has(lesson.kind))return null;
  if(preset==='abc'&&lesson.presets?.length)preset=lesson.presets[0].id;
  const q={...defaults(lesson),...input};let duration=6,clock='physical',timeUnit='s',stepBounds=[0,.25,.5,.75,1],events=[],pre={};
  switch(lesson.kind){
    case 'car-ratio':{
      const tA=q.interval/(q.ratio-1),tB=tA+q.interval,a=2*q.distance/(tB*tB-tA*tA),xA=.5*a*tA*tA,xB=xA+q.distance,vA=a*tA,vB=a*tB;
      duration=tB;const p=tA/tB;stepBounds=[0,p/2,p,(1+p)/2,1];events=[{type:'passes-A',time:tA},{type:'passes-B',time:tB}];pre={tA,tB,a,xA,xB,vA,vB};break;
    }
    case 'two-stones':{
      duration=(q.gap-3)/q.speed;events=[{type:'first-3m-separation',time:duration}];pre={height:50,g:10};break;
    }
    case 'free-wedge':{
      const angle=q.angle*Math.PI/180,sin=Math.sin(angle),cos=Math.cos(angle),as=(q.M+q.m)*9.8*sin/(q.M+q.m*sin*sin),aX=-q.m*cos*as/(q.M+q.m);
      const s0=.35,L=2.2,travel=1.4;duration=Math.sqrt(2*travel/as);events=[{type:'end-of-shown-slope',time:duration}];
      pre={angle,sin,cos,as,aX,L,s0,travel,energy0:q.m*9.8*(L-s0)*sin};break;
    }
    case 'damped-cart':duration=16;pre={m:1,k:1,bCritical:2,regime:q.b<2-1e-9?'欠阻尼':q.b>2+1e-9?'过阻尼':'临界阻尼'};break;
    case 'driven-cart':{
      duration=80;let maxAbs=0;for(let i=0;i<=2000;i++)maxAbs=Math.max(maxAbs,Math.abs(driven(q,duration*i/2000).x));
      pre={maxAbs:maxAbs*1.01};break;
    }
    case 'crank-pendulum':{
      duration=20;const L=1,g=9.8,fun=([theta,w],t)=>[w,q.R*q.omega*q.omega/L*Math.cos(theta-q.omega*t)-g/L*Math.sin(theta)];
      pre={L,g,track:integrate([1,0],duration,.004,fun)};break;
    }
    case 'equal-spring-modes':{
      duration=preset==='anti'?5.5:10;const a=q.amplitude;
      const [x1,x2]=preset==='mixed'?[0,a]:preset==='in-phase'?[a,a]:[a,-a];
      const wp=Math.sqrt(q.k/q.m),wm=Math.sqrt(3*q.k/q.m);
      pre={x1,x2,wp,wm,plus:x1+x2,minus:x1-x2,energy0:.5*q.k*(x1*x1+(x2-x1)**2+x2*x2)};break;
    }
    case 'binary-stars':duration=6;timeUnit='τ';pre={mu:1+q.m2};break;
    case 'jupiter-moons':{
      const G=6.67408e-11,axis=[4.21700e8,6.71034e8,10.70412e8,18.82709e8].map(x=>x*q.radiusScale),period=[1.7691,3.5512,7.1546,16.689].map(x=>x*q.periodScale);
      const x=axis.map(a=>a**3),y=period.map(t=>(t*DAY)**2),fit=fitLine(x,y),mass=4*Math.PI**2/(G*fit.slope);
      pre={G,axis,period,x,y,fit,mass,phases:[0,.95,2.25,3.6]};timeUnit='d';duration=period[3];events=[{type:'outer-moon-orbit',time:duration}];break;
    }
    case 'triangle-lamina':clock='concept';pre={h:q.a/Math.sqrt(2)};break;
  }
  function sample(progress){
    const p=clamp(progress),t=p*duration,base={p,t,duration,clock,timeUnit};
    switch(lesson.kind){
      case 'car-ratio':{
        const {tA,tB,a,xA,xB,vA,vB}=pre,x=.5*a*t*t,v=a*t;
        return {...base,x,v,a,xA,xB,vA,vB,tA,tB,passedA:p>=stepBounds[2],
          readouts:[read('当前位置',x,'m','car'),read('当前速度',v,'m/s','velocity'),read('出发至 A',xA,'m','pointA'),read('到达 A 时刻',tA,'s','pointA')]};
      }
      case 'two-stones':{
        const {height:H,g}=pre,yA=H-.5*g*t*t,yB=H+q.gap-q.speed*t-.5*g*t*t,vA=-g*t,vB=-q.speed-g*t,gap=yB-yA;
        return {...base,H,g,yA,yB,vA,vB,gap,target:3,eventTime:duration,residual:gap-(q.gap-q.speed*t),
          readouts:[read('两石间距',gap,'m','separation'),read('上石速度',vB,'m/s','ballB'),read('下石速度',vA,'m/s','ballA'),read('首次达到 3 m',duration,'s','separation')]};
      }
      case 'free-wedge':{
        const {angle,sin,cos,as,aX,L,s0,energy0}=pre,s=.5*as*t*t,ds=as*t,X=.5*aX*t*t,dX=aX*t;
        const x=X+s*cos,y=(L-s0-s)*sin,vx=dX+ds*cos,vy=-ds*sin,N=q.m*(9.8-as*sin)/cos;
        const energy=.5*q.M*dX*dX+.5*q.m*(vx*vx+vy*vy)+q.m*9.8*y,P=(q.M+q.m)*dX+q.m*ds*cos;
        return {...base,angle,s,s0,L,X,x,y,ds,dX,vx,vy,as,aX,N,P,energy,residualEnergy:energy-energy0,residualWedge:q.M*aX+N*sin,residualBlock:q.m*(-as*sin)+q.m*9.8-N*cos,
          readouts:[read('滑块沿面加速度',as,'m/s²','blockA'),read('楔块水平加速度',aX,'m/s²','wedge'),read('法向力',N,'N','normal'),read('楔块位移',X,'m','wedge')]};
      }
      case 'damped-cart':{
        const {m,k,bCritical,regime}=pre,{x,v}=homogeneous(q.x0,0,m,q.b,k,t),a=(-q.b*v-k*x)/m,E=.5*m*v*v+.5*k*x*x,E0=.5*k*q.x0*q.x0;
        return {...base,x,v,a,E,E0,loss:E0-E,regime,bCritical,residual:m*a+q.b*v+k*x,
          readouts:[read('滑块位移',x,'m','blockA',3),read('当前速度',v,'m/s','velocity',3),read('运动类型',regime,'','damper'),read('剩余机械能',E,'J','energy',3)]};
      }
      case 'driven-cart':{
        const d=driven(q,t),a=d.force-.2*d.v-d.x,E=.5*(d.v*d.v+d.x*d.x),power=d.force*d.v-.2*d.v*d.v;
        return {...base,...d,a,E,power,maxAbs:pre.maxAbs,residual:a+.2*d.v+d.x-d.force,
          readouts:[read('当前位移',d.x,'m','blockA',3),read('驱动力',d.force,'N','force',3),read('稳态振幅',d.amplitude,'m','spring1',3),read('系统机械能',E,'J','energy',3)]};
      }
      case 'crank-pendulum':{
        const {L,g,track}=pre,[theta,angularVelocity]=at(track,t),phase=q.omega*t,pivotX=q.R*Math.cos(phase),pivotY=q.R*Math.sin(phase);
        const x=pivotX+L*Math.sin(theta),y=pivotY-L*Math.cos(theta),vx=-q.R*q.omega*Math.sin(phase)+L*Math.cos(theta)*angularVelocity,vy=q.R*q.omega*Math.cos(phase)+L*Math.sin(theta)*angularVelocity;
        const alpha=q.R*q.omega*q.omega/L*Math.cos(theta-phase)-g/L*Math.sin(theta);
        return {...base,L,g,theta,angularVelocity,alpha,phase,pivotX,pivotY,x,y,vx,vy,energy:.5*(vx*vx+vy*vy)+g*y,
          readouts:[read('摆角 θ',theta*180/Math.PI,'°','pendulum',1),read('摆角速度',angularVelocity,'rad/s','velocity',3),read('支点 x',pivotX,'m','pivot',3),read('支点 y',pivotY,'m','pivot',3)]};
      }
      case 'equal-spring-modes':{
        const {wp,wm,plus,minus,energy0}=pre,qp=plus*Math.cos(wp*t),qm=minus*Math.cos(wm*t),vp=-plus*wp*Math.sin(wp*t),vm=-minus*wm*Math.sin(wm*t);
        const x1=(qp+qm)/2,x2=(qp-qm)/2,v1=(vp+vm)/2,v2=(vp-vm)/2,a1=q.k/q.m*(x2-2*x1),a2=q.k/q.m*(x1-2*x2);
        const energy=.5*q.m*(v1*v1+v2*v2)+.5*q.k*(x1*x1+(x2-x1)**2+x2*x2);
        return {...base,x1,x2,v1,v2,a1,a2,qp,qm,wp,wm,energy,residual:energy-energy0,
          readouts:[read('左车位移',x1,'m','blockA',3),read('右车位移',x2,'m','blockB',3),read('同相角频率',wp,'rad/s','normalMode',3),read('反相角频率',wm,'rad/s','normalMode',3)]};
      }
      case 'binary-stars':{
        const rel=relativeKepler(t,pre.mu,1,q.v0),factorA=-q.m2/(1+q.m2),factorB=1/(1+q.m2);
        const A=[factorA*rel.x,factorA*rel.y],B=[factorB*rel.x,factorB*rel.y],vA=[factorA*rel.vx,factorA*rel.vy],vB=[factorB*rel.vx,factorB*rel.vy];
        return {...base,...rel,mu:pre.mu,A,B,vA,vB,barycenter:[A[0]+q.m2*B[0],A[1]+q.m2*B[1]],
          readouts:[read('两星间距',rel.r,'','separation',3),read('轨道偏心率',rel.e,'','path',3),read('轨道周期',rel.period,'τ','path',3),read('质量比 m₂/m₁',q.m2,'','starB')]};
      }
      case 'jupiter-moons':{
        const {G,axis,period,x,y,fit,mass,phases}=pre;
        const moons=axis.map((a,i)=>{const phase=phases[i]+2*Math.PI*t/period[i];return {a,period:period[i],phase,x:a*Math.cos(phase),y:a*Math.sin(phase)};});
        return {...base,G,axis,period,fit,mass,moons,xData:x,yData:y,
          readouts:[read('拟合木星质量',mass/1e27,'×10²⁷ kg','fit',5),read('木卫一周期',period[0],'d','io',4),read('木卫四周期',period[3],'d','galilean',3),read('经过天数',t,'d','path',2)]};
      }
      case 'triangle-lamina':{
        const {h}=pre,s=p*h,graded=preset!=='uniform';
        const mass=graded?2*h*s*s-4*s**3/3:2*h*s-s*s;
        const moment=graded?4*h*s**3/3-s**4:h*s*s-2*s**3/3;
        const totalMass=graded?2*h**3/3:h*h,fullY=graded?h/2:h/3,yCenter=mass>1e-14?moment/mass:0;
        return {...base,h,s,graded,mass,moment,totalMass,fullY,yCenter,width:2*(h-s),
          readouts:[read('积分上限 y',s,'m','slice',3),read('累计质量',mass,'kg','mass',3),read('累计质心 y',yCenter,'m','center',3),read('完整质心 yG',fullY,'m','center',3)]};
      }
    }
  }
  return {lesson,parameters:q,preset,duration,clock,timeUnit,stepBounds,events,sample};
}
