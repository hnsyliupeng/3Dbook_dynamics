import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {DEEP_APPLICATION_LESSONS} from '../app/src/deep-application-lessons.js';
import {createModel,defaultParameters,currentStep} from '../app/src/models.js';
const l=id=>{const item=DEEP_APPLICATION_LESSONS.find(v=>v.id===id);assert.ok(item,id);return item;};
const model=(id,q={},preset)=>createModel(l(id),q,preset);
const near=(x,y,tol=1e-8)=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=tol,`${x} != ${y} ± ${tol}`);
const corners=id=>l(id).params.reduce((sets,p)=>sets.flatMap(q=>[{...q,[p.key]:p.min},{...q,[p.key]:p.max}]),[{}]);
const sampleEach=(m,fn,n=100)=>{for(let i=0;i<=n;i++)fn(m.sample(i/n),i/n);};
// Independent fixed-step RK4, used to check the closed-form and event models.
function integrate(y0,end,step,fn){
  const n=Math.ceil(end/step),h=end/n;let y=[...y0];
  const add=(a,b,c)=>a.map((v,i)=>v+c*b[i]);
  for(let i=0;i<n;i++){
    const t=i*h,k1=fn(y,t),k2=fn(add(y,k1,h/2),t+h/2),k3=fn(add(y,k2,h/2),t+h/2),k4=fn(add(y,k3,h),t+h);
    y=y.map((v,j)=>v+h*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6);
  }return y;
}

test('新增应用步骤中的 40 个公式均可由 KaTeX 严格解析',()=>{
  for(const lesson of DEEP_APPLICATION_LESSONS)for(const step of lesson.steps)
    assert.doesNotThrow(()=>katex.renderToString(step.formula,{throwOnError:true,strict:'error'}),`${lesson.id} / ${step.title}`);
});

test('速度比逆问题：原题 OA=125 m，过 A 与 B 事件和所有角点',()=>{
  const m=model('car-speed-ratio'),s=m.sample(1);near(s.xA,125);near(s.tA,5);near(s.a,10);near(s.vA,50);near(s.vB,150);near(s.x,1125);
  for(const q of corners('car-speed-ratio')){
    const m=model('car-speed-ratio',q),a=m.sample(m.stepBounds[2]),b=m.sample(1);
    near(a.x,a.xA);near(b.x-a.x,q.distance);near(b.t-a.t,q.interval);near(b.v/a.v,q.ratio);near(a.xA,q.distance/(q.ratio**2-1));
    assert.equal(currentStep(l('car-speed-ratio'),m.stepBounds[2],m),2);
    sampleEach(m,s=>{near(s.x,.5*s.a*s.t**2);near(s.v,s.a*s.t);assert.ok(s.x>=0&&s.x<=s.xB+1e-8);},20);
  }
});

test('两石第一次相距 3 m：共同重力抵消且限定时间内均未落地',()=>{
  let m=model('two-stones-building');near(m.duration,1);near(m.sample(1).gap,3);
  for(const q of corners('two-stones-building')){
    const m=model('two-stones-building',q);near(m.duration,(q.gap-3)/q.speed);near(m.sample(1).gap,3);
    sampleEach(m,(s,p)=>{near(s.yB-s.yA,q.gap-q.speed*s.t);near(s.vB-s.vA,-q.speed);assert.ok(s.yA>0&&s.yB>0);if(p<1)assert.ok(s.gap>3);});
  }
});

test('可动楔与滑块：源符号加速度、水平动量、能量及法向力',()=>{
  for(const q of [{M:3,m:1,angle:30},...corners('free-wedge-slider')]){
    const m=model('free-wedge-slider',q),z=m.sample(0),ang=q.angle*Math.PI/180;
    const expectedS=(q.M+q.m)*9.8*Math.sin(ang)/(q.M+q.m*Math.sin(ang)**2),expectedX=-q.m*Math.cos(ang)/(q.M+q.m)*expectedS;
    near(z.as,expectedS);near(z.aX,expectedX);
    sampleEach(m,s=>{near(s.P,0,1e-7);near(s.residualEnergy,0,1e-7);near(s.residualWedge,0,1e-7);near(s.residualBlock,0,1e-7);near(s.x,s.X+s.s*Math.cos(ang));near(s.y,(s.L-s.s0-s.s)*Math.sin(ang));assert.ok(s.N>0&&s.s+s.s0<s.L);});
  }
});

test('欠阻尼、临界阻尼、过阻尼：源通解、ODE、耗散和边界连续',()=>{
  const cases=[['under',1,'欠阻尼'],['critical',2,'临界阻尼'],['over',3,'过阻尼']];
  for(const [preset,b,regime] of cases){
    const m=model('damped-spring-cart',{b,x0:1},preset);near(m.sample(0).x,1);near(m.sample(0).v,0);assert.equal(m.sample(0).regime,regime);
    let previous=Infinity;sampleEach(m,s=>{near(s.residual,0,1e-12);assert.ok(s.E<=previous+1e-9);assert.ok(s.E>=0&&s.loss>=-1e-9);previous=s.E;},300);
    for(const t of [1,4,8]){const exact=integrate([1,0],t,.002,([x,v])=>[v,-b*v-x]);const s=m.sample(t/m.duration);near(s.x,exact[0],1e-9);near(s.v,exact[1],1e-9);}
  }
  for(const q of corners('damped-spring-cart'))sampleEach(model('damped-spring-cart',q),s=>{assert.ok(s.E>=0&&s.E<=s.E0+1e-8);near(s.residual,0,1e-12);});
  const critical=model('damped-spring-cart',{b:2}).sample(.2);for(const b of [1.999999,2.000001])near(model('damped-spring-cart',{b}).sample(.2).x,critical.x,1e-6);
});

test('周期激振：解析解与独立 RK4、6.5 源值及稳态幅值',()=>{
  const original=model('driven-spring-resonance'),s=original.sample(0);near(s.x,2);near(s.v,0);near(s.amplitude,5/Math.sqrt(64+.36));near(s.force,5);
  for(const q of [{F:5,omega:3,x0:2},{F:1,omega:.1,x0:1},{F:3,omega:1,x0:1},...corners('driven-spring-resonance')]){
    const m=model('driven-spring-resonance',q);const at0=m.sample(0);near(at0.x,q.x0,1e-10);near(at0.v,0,1e-10);
    for(const t of [1,7.3,20]){const n=integrate([q.x0,0],t,.002,([x,v],t)=>[v,-.2*v-x+q.F*Math.cos(q.omega*t)]),s=m.sample(t/80);near(s.x,n[0],2e-8);near(s.v,n[1],2e-8);}
    sampleEach(m,s=>{near(s.residual,0,1e-10);assert.ok(Math.abs(s.x)<=s.maxAbs+1e-6);},200);
  }
});

test('偏心曲柄支点摆：轨迹方程、杆长和独立高精度积分',()=>{
  for(const q of [{R:.2,omega:2.5},...corners('crank-driven-pendulum')]){
    const m=model('crank-driven-pendulum',q);let s=m.sample(0);near(s.theta,1);near(s.angularVelocity,0);near(s.pivotX,q.R);near(s.pivotY,0);
    sampleEach(m,s=>{near(Math.hypot(s.x-s.pivotX,s.y-s.pivotY),1,1e-9);near(s.pivotX,q.R*Math.cos(q.omega*s.t));near(s.pivotY,q.R*Math.sin(q.omega*s.t));near(s.alpha,q.R*q.omega**2*Math.cos(s.theta-q.omega*s.t)-9.8*Math.sin(s.theta));},80);
    for(const t of [3.7,10,20]){
      const ref=integrate([1,0],t,.0008,([theta,w],t)=>[w,q.R*q.omega**2*Math.cos(theta-q.omega*t)-9.8*Math.sin(theta)]);s=m.sample(t/20);
      near(s.theta,ref[0],3e-5);near(s.angularVelocity,ref[1],5e-5);
    }
  }
});

test('等弹簧正常模态：反相、混合及同相预设与能量',()=>{
  for(const q of [{m:1,k:1,amplitude:1},...corners('equal-spring-normal-modes')])for(const preset of ['anti','mixed','in-phase']){
    const m=model('equal-spring-normal-modes',q,preset),first=m.sample(0),a=q.amplitude;
    if(preset==='anti'){near(first.x1,a);near(first.x2,-a);}else if(preset==='mixed'){near(first.x1,0);near(first.x2,a);}else{near(first.x1,a);near(first.x2,a);}
    near(first.v1,0);near(first.v2,0);near(first.wp,Math.sqrt(q.k/q.m));near(first.wm,Math.sqrt(3*q.k/q.m));
    sampleEach(m,s=>{near(s.residual,0,1e-7);near(q.m*s.a1,q.k*(s.x2-2*s.x1));near(q.m*s.a2,q.k*(s.x1-2*s.x2));if(preset==='anti')near(s.x1,-s.x2);if(preset==='in-phase')near(s.x1,s.x2);});
  }
  // 12.3's source output is the superposition of the two normal frequencies.
  const t=2,s=model('equal-spring-normal-modes',{m:1,k:1,amplitude:1},'mixed').sample(t/10);
  near(s.x1,(Math.cos(t)-Math.cos(Math.sqrt(3)*t))/2);near(s.x2,(Math.cos(t)+Math.cos(Math.sqrt(3)*t))/2);
});

test('双星：相对轨道初值、质心、面积速度和能量守恒',()=>{
  for(const q of [{m2:2,v0:1},...corners('binary-stars-barycenter')]){
    const m=model('binary-stars-barycenter',q),start=m.sample(0);near(start.x,1);near(start.y,0,1e-14);near(start.vx,0,1e-14);near(start.vy,q.v0);assert.ok(start.e>0&&start.e<1);
    sampleEach(m,s=>{near(s.A[0]+q.m2*s.B[0],0,1e-10);near(s.A[1]+q.m2*s.B[1],0,1e-10);near(s.h,q.v0,1e-9);near(s.energy,-(1+q.m2)/(2*s.a),1e-8);assert.ok(s.r>=2*s.a-1-1e-8&&s.r<=1+1e-8);},300);
  }
  const m=model('binary-stars-barycenter'),ref=integrate([1,0,0,1],1,.0002,([x,vx,y,vy])=>{const r=Math.hypot(x,y),f=-3/r**3;return [vx,f*x,vy,f*y]});const s=m.sample(1/6);
  near(s.x,ref[0],1e-6);near(s.vx,ref[1],1e-6);near(s.y,ref[2],1e-6);near(s.vy,ref[3],1e-6);
});

test('四木卫星：保留拟合截距，源质量及倍率维度',()=>{
  const s=model('jupiter-moons-mass').sample(0);near(s.mass/1e27,1.89858509859859,1e-10);near(s.fit.slope/1e-16,3.115575361541545,1e-12);
  assert.notEqual(s.fit.intercept,0);assert.equal(s.moons.length,4);near(s.period[0],1.7691);near(s.axis[3],18.82709e8);
  for(const q of corners('jupiter-moons-mass')){
    const m=model('jupiter-moons-mass',q),a=m.sample(0);near(a.mass/s.mass,q.radiusScale**3/q.periodScale**2,1e-11);
    sampleEach(m,r=>{for(const moon of r.moons)near(Math.hypot(moon.x,moon.y),moon.a,1e-6);});
  }
});

test('非均匀三角薄板：质量和一阶矩与独立积分一致',()=>{
  for(const q of [{a:1},...corners('triangle-lamina-centroid')])for(const preset of ['graded','uniform']){
    const m=model('triangle-lamina-centroid',q,preset),end=m.sample(1),h=q.a/Math.sqrt(2);near(end.fullY,preset==='graded'?h/2:h/3);near(end.yCenter,end.fullY);
    for(const p of [.1,.4,1]){
      const s=m.sample(p),n=10000,dy=s.s/n;let mass=0,moment=0;
      for(let i=0;i<n;i++){const y=(i+.5)*dy,density=preset==='graded'?2*y:1,dm=density*2*(h-y)*dy;mass+=dm;moment+=y*dm;}
      near(s.mass,mass,1e-8);near(s.moment,moment,1e-8);near(s.yCenter,moment/mass,1e-7);
    }
  }
  near(model('triangle-lamina-centroid',{a:1},'graded').sample(1).fullY,.3535533905932738);
});
