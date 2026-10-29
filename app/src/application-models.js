import { createDeepApplicationModel } from './deep-application-models.js';
/** Source-grounded application models. All 3D state and readouts derive from
 * the same normalized physical time; static equilibrium uses a concept clock. */
const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
const fmt=(v,d=2)=>Number.isFinite(v)?String(Number(v.toFixed(d))):'—';
const read=(label,value,unit,tag,d=2)=>({label,value:typeof value==='number'?fmt(value,d):value,unit,tag});
const lerp=(a,b,f)=>a+(b-a)*f;
const G=9.8, DAY=86400;
const defaults=l=>Object.fromEntries(l.params.map(p=>[p.key,p.value]));
const kinds=new Set(['cabled-beam','pushing-blocks','cart-strings','guided-wedge','billiards','cubic-drag','peg-flight','nonlinear-pendulum','coupled-springs','planet-orbits','moon-orbit']);

function rk4Step(y,dt,f){
  const add=(a,b,k)=>a.map((v,i)=>v+k*b[i]);
  const k1=f(y),k2=f(add(y,k1,dt/2)),k3=f(add(y,k2,dt/2)),k4=f(add(y,k3,dt));
  return y.map((v,i)=>v+dt*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);
}
function integrate(y0,duration,dt,f){
  const n=Math.ceil(duration/dt),h=duration/n,data=[y0];let y=y0;
  for(let i=0;i<n;i++){y=rk4Step(y,h,f);data.push(y);}
  return {data,h,duration};
}
function at(data,t){
  const x=clamp(t,0,data.duration)/data.h,i=Math.min(data.data.length-2,Math.floor(x)),f=clamp(x-i);
  return data.data[i].map((v,j)=>lerp(v,data.data[i+1][j],f));
}
function toAngle(initial,target,length,g=10){
  const dt=.001,fun=([angle,w])=>[w,-g/length*Math.sin(angle)];
  let state=initial,t=0;const rows=[{t,state}];
  for(let i=0;i<30000;i++){
    const next=rk4Step(state,dt,fun);
    if(next[0]>=target){
      const f=(target-state[0])/(next[0]-state[0]);
      t+=f*dt;state=state.map((v,j)=>lerp(v,next[j],f));state[0]=target;rows.push({t,state});return {rows,duration:t};
    }
    t+=dt;state=next;rows.push({t,state});
  }
  throw new Error('Pendulum did not reach event angle');
}
function eventAt(track,t){
  t=clamp(t,0,track.duration);let lo=0,hi=track.rows.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(track.rows[mid].t<=t)lo=mid;else hi=mid;}
  const a=track.rows[lo],b=track.rows[hi],f=(t-a.t)/(b.t-a.t);
  return a.state.map((v,j)=>lerp(v,b.state[j],f));
}
function kepler(tSec,a,e,mu){
  const n=Math.sqrt(mu/(a*a*a)),M=((n*tSec)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);
  let E=M;for(let i=0;i<8;i++)E-=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
  const b=Math.sqrt(1-e*e),x=a*(Math.cos(E)-e),y=a*b*Math.sin(E),r=a*(1-e*Math.cos(E));
  const vx=-a*n*Math.sin(E)/(1-e*Math.cos(E)),vy=a*n*b*Math.cos(E)/(1-e*Math.cos(E));
  return {E,M,x,y,r,vx,vy,speed:Math.hypot(vx,vy),areaRate:(x*vy-y*vx)/2};
}
function pegPre(q){
  const R=q.R,g=10,alpha=q.angle*Math.PI/180,target=Math.PI/2-alpha;
  const long=toAngle([-Math.PI/2,0],0,2*R,g),vB=2*Math.sqrt(R*g);
  const short=toAngle([0,vB/R],target,R,g),vC=Math.sqrt(2*R*g*(1+Math.sin(alpha)));
  const xC=R*Math.cos(alpha),yC=R*(1-Math.sin(alpha)),vxC=vC*Math.sin(alpha),vyC=vC*Math.cos(alpha);
  const flight=(vyC+Math.sqrt(vyC*vyC+2*g*yC))/g,duration=long.duration+short.duration+flight;
  return {R,g,alpha,long,short,vB,vC,xC,yC,vxC,vyC,flight,duration,tB:long.duration,tC:long.duration+short.duration,landingX:xC+vxC*flight};
}

export function createApplicationModel(lesson,input={},preset='abc'){
  const deep=createDeepApplicationModel(lesson,input,preset);
  if(deep)return deep;
  if(!kinds.has(lesson.kind))return null;
  const q={...defaults(lesson),...input};let duration=6,clock='physical',timeUnit='s',stepBounds=[0,.25,.5,.75,1],events=[],pre={};
  switch(lesson.kind){
    case 'cabled-beam':clock='concept';break;
    case 'pushing-blocks':pre.a=q.F/(5*q.m)-q.mu*10;duration=Math.sqrt(2*1.4/pre.a);events=[{type:'end-of-shown-travel',time:duration}];break;
    case 'cart-strings':duration=Math.sqrt(2*1.1/q.a);break;
    case 'guided-wedge':{
      const angle=q.angle*Math.PI/180,a=10*Math.sin(angle)*Math.cos(angle)/(3*Math.cos(angle)**2+Math.sin(angle)**2);
      pre={angle,a,ay:a*Math.tan(angle),N:3*q.m*a/Math.sin(angle)};duration=Math.sqrt(2*.7/a);break;
    }
    case 'billiards':{
      const m1=.1,m2=.2,r=.15,th=q.angle*Math.PI/180;
      const v1=q.v0*(m1*Math.cos(th)+Math.sqrt(m2*m2-m1*m1*Math.sin(th)**2))/(m1+m2);
      const aV=[v1*Math.cos(th),v1*Math.sin(th)],bV=[m1/m2*(q.v0-aV[0]),-m1/m2*aV[1]];
      const impulse=[q.v0-aV[0],-aV[1]],norm=Math.hypot(...impulse),n=impulse.map(v=>v/norm);
      const impact=[-2*r*n[0],-2*r*n[1]],startX=-1.8,tHit=(impact[0]-startX)/q.v0;
      // Stop before either ball touches a cushion: this model only solves the
      // ball-ball collision, not a subsequent table-cushion impact.
      const safeTime=(pos,vel,limit)=>Math.abs(vel)<1e-12?Infinity:(vel>0?(limit-pos)/vel:(-limit-pos)/vel);
      const after=Math.min(.25,.98*safeTime(impact[0],aV[0],2.47),.98*safeTime(impact[1],aV[1],1.47),.98*safeTime(0,bV[0],2.47),.98*safeTime(0,bV[1],1.47));
      duration=tHit+after;const p=tHit/duration;stepBounds=[0,p/2,p,(1+p)/2,1];
      events=[{type:'elastic-impact',time:tHit}];pre={m1,m2,r,th,v1,aV,bV,n,impact,startX,tHit,v2:Math.hypot(...bV),phi:Math.atan2(-bV[1],bV[0])};break;
    }
    case 'cubic-drag':{
      duration=1;const ode=([x,v])=>[v,G-q.c/q.m*v**3];
      const continuous=integrate([0,0],duration,.001,ode),rows=[[0,0]];let state=[0,0];
      for(let i=0;i<20;i++){const [x,v]=state;state=[x+v*.05,v+(G-q.c/q.m*v**3)*.05];rows.push(state);}
      pre={continuous,euler:{data:rows,h:.05,duration:1},terminal:Math.cbrt(q.m*G/q.c)};break;
    }
    case 'peg-flight':{
      pre=pegPre(q);duration=pre.duration;const b=pre.tB/duration,c=pre.tC/duration;
      stepBounds=[0,b,c,(1+c)/2,1];events=[{type:'catches-peg',time:pre.tB},{type:'released-at-C',time:pre.tC},{type:'ground-impact',time:duration}];break;
    }
    case 'nonlinear-pendulum':{
      duration=preset==='pagonis-8-7'?20:10;
      const theta=q.theta*Math.PI/180,ode=([x,v])=>[v,-G/q.L*Math.sin(x)];
      pre={data:integrate([theta,0],duration,.0015,ode),theta,E0:G*q.L*(1-Math.cos(theta))};break;
    }
    case 'coupled-springs':{
      duration=20;const ode=([x1,v1,x2,v2])=>[v1,-4*x1+q.k2*(x2-x1),v2,(q.k2*(x1-x2)-3*x2)/q.m2];
      const data=integrate([0,0,q.x2,0],duration,.002,ode),E0=.5*(q.k2+3)*q.x2*q.x2;
      const trace=(4+q.k2)+(3+q.k2)/q.m2,det=((4+q.k2)*(3+q.k2)-q.k2*q.k2)/q.m2;
      pre={data,E0,frequencies:[Math.sqrt((trace-Math.sqrt(trace*trace-4*det))/2),Math.sqrt((trace+Math.sqrt(trace*trace-4*det))/2)]};break;
    }
    case 'planet-orbits':{
      const mu=1.3271244e20,aE=150.05e9,aM=58e9,TE=2*Math.PI*Math.sqrt(aE**3/mu),TM=2*Math.PI*Math.sqrt(aM**3/mu);
      duration=TE/DAY;timeUnit='d';pre={mu,aE,aM,TE,TM};events=[{type:'earth-completes-one-orbit',time:duration}];break;
    }
    case 'moon-orbit':{
      const rp=q.rp*1e6,ra=q.ra*1e6,a=(rp+ra)/2,e=(ra-rp)/(ra+rp),mu=6.673e-11*(5.9724e24+.07346e24),T=2*Math.PI*Math.sqrt(a**3/mu);
      duration=T/DAY;timeUnit='d';pre={rp,ra,a,e,mu,T};events=[{type:'apogee',time:duration/2},{type:'perigee',time:duration}];break;
    }
  }
  function sample(progress){
    const p=clamp(progress),t=p*duration,base={p,t,duration,clock,timeUnit};
    switch(lesson.kind){
      case 'cabled-beam':{
        const angle=q.angle*Math.PI/180,W=q.load*.5/(1+.5*Math.sin(angle)),T1=2*W,T2=W,Bx=-T1*Math.cos(angle),By=q.load-T2-T1*Math.sin(angle);
        return {...base,angle,W,T1,T2,Bx,By,residualX:Bx+T1*Math.cos(angle),residualY:By+T1*Math.sin(angle)+T2-q.load,moment:T1*Math.sin(angle)/4+T2-q.load/2,
          readouts:[read('配重 W',W,'N','ropeLower'),read('斜绳张力',T1,'N','ropeUpper'),read('铰点 Bₓ',Bx,'N','hinge'),read('铰点 Bᵧ',By,'N','hinge')]};
      }
      case 'pushing-blocks':{
        const a=pre.a,x=.5*a*t*t,v=a*t,R=q.F/5,f1=4*q.mu*q.m*10,f2=q.mu*q.m*10;
        return {...base,a,x,v,R,f1,f2,residualA:q.F-f1-R-4*q.m*a,residualB:R-f2-q.m*a,
          readouts:[read('共同加速度',a,'m/s²','accel'),read('块间接触力',R,'N','contact'),read('当前速度',v,'m/s','velocity'),read('共同位移',x,'m','blockA')]};
      }
      case 'cart-strings':{
        const T1=q.m*(q.a+10)/Math.SQRT2,T2=q.m*(q.a-10)/Math.SQRT2,x=.5*q.a*t*t,v=q.a*t;
        return {...base,T1,T2,ratio:T1/T2,x,v,residualX:(T1+T2)/Math.SQRT2-q.m*q.a,residualY:(T1-T2)/Math.SQRT2-q.m*10,
          readouts:[read('上绳 T₁',T1,'N','ropeUpper'),read('下绳 T₂',T2,'N','ropeLower'),read('张力比 T₁/T₂',T1/T2,'','ropeUpper'),read('车体位移',x,'m','accel')]};
      }
      case 'guided-wedge':{
        const {angle,a,ay,N}=pre,x=.5*a*t*t,drop=x*Math.tan(angle),v=a*t;
        return {...base,angle,a,ay,N,x,drop,v,residualWedge:N*Math.sin(angle)-3*q.m*a,residualSlider:q.m*10-N*Math.cos(angle)-q.m*ay,
          readouts:[read('楔块加速度',a,'m/s²','accel'),read('滑块下降加速度',ay,'m/s²','guide'),read('法向力 N',N,'N','normal'),read('楔块位移',x,'m','wedge')]};
      }
      case 'billiards':{
        const {tHit,impact,startX,aV,bV,n,m1,m2,r,v1,v2,phi}=pre,collided=p>=stepBounds[2];
        const dt=Math.max(0,t-tHit),A=collided?[impact[0]+aV[0]*dt,impact[1]+aV[1]*dt]:[startX+q.v0*t,impact[1]],B=[bV[0]*dt,bV[1]*dt];
        const va=collided?aV:[q.v0,0],vb=collided?bV:[0,0],px=m1*va[0]+m2*vb[0],py=m1*va[1]+m2*vb[1],energy=.5*m1*(va[0]**2+va[1]**2)+.5*m2*(vb[0]**2+vb[1]**2);
        return {...base,A,B,va,vb,r,n,impact,collided,tHit,v1,v2,phi,px,py,energy,residualPx:px-m1*q.v0,residualPy:py,residualEnergy:energy-.5*m1*q.v0*q.v0,
          readouts:[read('碰后球 1 速度',v1,'m/s','ballA',3),read('碰后球 2 速度',v2,'m/s','ballB',3),read('球 2 散射角 φ',phi*180/Math.PI,'°','path',2),read('状态',collided?'已碰撞':'接近中','','impact')]};
      }
      case 'cubic-drag':{
        const [x,v]=at(pre.continuous,t),[xEuler,vEuler]=at(pre.euler,t),a=G-q.c/q.m*v**3;
        return {...base,x,v,xEuler,vEuler,a,terminal:pre.terminal,displacementError:xEuler-x,
          readouts:[read('欧拉位移',xEuler,'m','ballA',3),read('RK4 位移',x,'m','ballB',3),read('位移差',xEuler-x,'m','velocity',3),read('终端速度',pre.terminal,'m/s','friction',3)]};
      }
      case 'peg-flight':{
        const {R,g,alpha,long,short,tB,tC,vB,vC,xC,yC,vxC,vyC,landingX}=pre;let x,y,vx,vy,angle,phase;
        if(p<stepBounds[1]){const [th,w]=eventAt(long,t);angle=th;x=2*R*Math.sin(th);y=2*R*(1-Math.cos(th));vx=2*R*Math.cos(th)*w;vy=2*R*Math.sin(th)*w;phase='long';}
        else if(p<stepBounds[2]){const [th,w]=eventAt(short,t-tB);angle=th;x=R*Math.sin(th);y=R*(1-Math.cos(th));vx=R*Math.cos(th)*w;vy=R*Math.sin(th)*w;phase='short';}
        else {const tau=t-tC;x=xC+vxC*tau;y=yC+vyC*tau-.5*g*tau*tau;vx=vxC;vy=vyC-g*tau;angle=null;phase='flight';}
        const E=.5*(vx*vx+vy*vy)+g*y;
        return {...base,phase,angle,x,y:Math.max(0,y),vx,vy,vB,vC,xC,yC,vxC,vyC,landingX,tB,tC,energy:E,residual:E-2*g*R,
          readouts:[read('当前速度',Math.hypot(vx,vy),'m/s','velocity'),read('B 点速度',vB,'m/s','contact'),read('C 点速度',vC,'m/s','pendulum'),read('B 至落点',landingX,'m','path')]};
      }
      case 'nonlinear-pendulum':{
        const [theta,omega]=at(pre.data,t),alpha=-G/q.L*Math.sin(theta),small=pre.theta*Math.cos(Math.sqrt(G/q.L)*t),K=.5*q.L*q.L*omega*omega,U=G*q.L*(1-Math.cos(theta));
        return {...base,theta,omega,alpha,small,K,U,energy:K+U,residual:K+U-pre.E0,
          readouts:[read('角度 θ',theta*180/Math.PI,'°','angular',1),read('角速度',omega,'rad/s','velocity'),read('小角度近似',small*180/Math.PI,'°','angular',1),read('机械能',K+U,'J','energy')]};
      }
      case 'coupled-springs':{
        const [x1,v1,x2,v2]=at(pre.data,t),a1=-4*x1+q.k2*(x2-x1),a2=(q.k2*(x1-x2)-3*x2)/q.m2;
        const energy=.5*v1*v1+.5*q.m2*v2*v2+2*x1*x1+.5*q.k2*(x2-x1)**2+1.5*x2*x2;
        return {...base,x1,v1,x2,v2,a1,a2,energy,residual:energy-pre.E0,frequencies:pre.frequencies,
          readouts:[read('左车位移 x₁',x1,'m','blockA'),read('右车位移 x₂',x2,'m','blockB'),read('系统机械能',energy,'J','energy'),read('中弹簧形变量',x2-x1,'m','spring2')]};
      }
      case 'planet-orbits':{
        const {aE,aM,mu,TE,TM}=pre,earth=kepler(t*DAY,aE,q.eEarth,mu),mercury=kepler(t*DAY,aM,q.eMercury,mu);
        return {...base,earth,mercury,aE,aM,periodEarth:TE/DAY,periodMercury:TM/DAY,mercuryRevolutions:t*DAY/TM,
          readouts:[read('地日距离',earth.r/1e9,'百万 km','earth',1),read('水日距离',mercury.r/1e9,'百万 km','mercury',1),read('水星周期',TM/DAY,'天','mercury',1),read('水星已绕行',t*DAY/TM,'圈','path',2)]};
      }
      case 'moon-orbit':{
        const {a,e,mu,T,rp,ra}=pre,orb=kepler(t*DAY,a,e,mu);
        return {...base,...orb,a,e,mu,T,perigee:rp,apogee:ra,
          readouts:[read('地月中心距',orb.r/1000,'km','moon',0),read('月球速度',orb.speed/1000,'km/s','velocity',3),read('偏心率',e,'','path',4),read('公转周期',T/DAY,'天','earth',2)]};
      }
    }
  }
  return {lesson,parameters:q,preset,duration,clock,timeUnit,stepBounds,events,sample};
}
