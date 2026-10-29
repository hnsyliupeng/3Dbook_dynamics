import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LESSONS, SECTIONS} from '../app/src/lessons.js';
import {createModel, currentStep, defaultParameters, G} from '../app/src/models.js';
const byId=id=>LESSONS.find(x=>x.id===id);
const near=(actual,expected,tol=1e-8)=>assert.ok(Math.abs(actual-expected)<=tol,`${actual} != ${expected} (±${tol})`);
const model=(id,q={},preset)=>createModel(byId(id),q,preset);

test('目录按知识顺序、源文件和单元均可追溯',()=>{
  const cat=JSON.parse(readFileSync('app/data/source-catalog.json','utf8'));
  const pagonis=JSON.parse(readFileSync('app/data/pagonis-catalog.json','utf8'));
  assert.equal(pagonis.notebooks.length,14);assert.equal(pagonis.mathematica.length,14);
  assert.equal(cat.notebooks.length,39);assert.equal(cat.notebooks.reduce((s,n)=>s+n.cellCount,0),1960);
  assert.equal(new Set(LESSONS.map(l=>l.id)).size,LESSONS.length);
  const order=LESSONS.map(l=>SECTIONS.findIndex(s=>s.id===l.section));assert.deepEqual(order,[...order].sort((a,b)=>a-b));
  for(const l of LESSONS){assert.ok(l.sources.length);assert.equal(l.steps.length,4);for(const s of l.sources){const repo=s.repo==='pagonis'?pagonis:cat,n=repo.notebooks.find(n=>n.file===s.file);assert.ok(n,`${l.id}: ${s.file}`);for(const i of s.cells){assert.ok(n.cells[i]?.type,`${s.file} cell ${i}`);if(!s.repo)assert.ok(n.cells[i]?.id,`${s.file} cell ${i} id`);}}}
});

test('所有默认和参数极值在整个进度范围内都是有限数、步骤边界有序',()=>{
  const check=(thing,path='')=>{if(typeof thing==='number')assert.ok(Number.isFinite(thing),path);else if(thing&&typeof thing==='object')for(const [k,v] of Object.entries(thing))check(v,`${path}.${k}`);};
  for(const l of LESSONS){const sets=[defaultParameters(l)];for(const p of l.params){sets.push({...sets[0],[p.key]:p.min},{...sets[0],[p.key]:p.max});}
    for(const q of sets){const m=createModel(l,q);check(m.duration,l.id);assert.ok(m.duration>0);assert.equal(m.stepBounds[0],0);assert.equal(m.stepBounds.at(-1),1);assert.ok(m.stepBounds.every((n,i,a)=>!i||n>a[i-1]));
      for(let i=0;i<=100;i++){const p=i/100;check(m.sample(p),`${l.id}@${p}`);const step=currentStep(l,p,m);assert.ok(step>=0&&step<l.steps.length);}
    }
  }
});

test('矢量两组原题与分量求和',()=>{
  let s=model('vector-resultant').sample(1);assert.deepEqual(s.R,[4,4,2]);near(s.magnitude,6);assert.deepEqual(s.partial,s.R);
  s=model('vector-resultant',{ax:0,ay:-2,az:0},'five').sample(1);assert.deepEqual(s.R,[0,2,0]);near(s.magnitude,2);
  s=model('vector-resultant',{ax:3,ay:-2,az:1}).sample(1);assert.deepEqual(s.R,[6,0,1]);
});

test('悬臂梁：题图与源码载荷位置分别平衡，并检查支座脱离',()=>{
  let s=model('two-load-beam',{},'image').sample(.8);near(s.RA,0);near(s.RB,90);near(s.residual,0);near(s.moment,0);assert.equal(s.stable,true);
  s=model('two-load-beam',{},'code').sample(.8);near(s.RA,40);near(s.RB,50);near(s.residual,0);near(s.moment,0);
  for(const m1 of [1,3,8])for(const m2 of [1,6,10])for(const b of [.5,1,2])for(const preset of ['image','code']){
    s=model('two-load-beam',{m1,m2,b},preset).sample(.5);near(s.residual,0);near(s.moment,0);assert.equal(s.stable,s.RA>=-1e-9&&s.RB>=-1e-9);
  }
  s=model('two-load-beam',{m1:1,m2:10},'image').sample(.8);assert.ok(s.RA<0);assert.equal(s.stable,false);
});

test('斜拉绳静力与梯子平衡',()=>{
  for(const m1 of [4,10])for(const m2 of [.5,3])for(const angle of [10,45]){
    const s=model('block-equilibrium',{m1,m2,angle}).sample(1);assert.ok(s.N>0);near(s.T,m2*G);near(s.f,s.T*Math.cos(s.angle));near(s.N+s.T*Math.sin(s.angle),m1*G);near(s.mu*s.N,s.f);
  }
  const s=model('ladder-equilibrium',{angle:Math.atan(3/4)*180/Math.PI}).sample(1);near(s.wall,400);near(s.floor,600);near(s.friction,400);near(s.mu,2/3);
});

test('汽车追赶：源代码输出与题面矛盾均可重现',()=>{
  let m=model('car-chase'),s=m.sample(1);near(m.duration,50);near(s.car,750);near(s.truck,750);
  m=model('car-chase',{a:1.5});s=m.sample(1);near(m.duration,20);near(s.car,300);near(s.truck,300);
  s=m.sample(.5);near(s.carV,15);assert.notEqual(s.car,s.truck); // equal velocity is not a meeting
});

test('原题抛体的飞行时间、射程及速度',()=>{
  const m=model('accelerated-projectile'),s=m.sample(1);near(m.duration,2+Math.sqrt(14));near(s.y,0);near(s.x,(2+Math.sqrt(14))**2);
  const p=.43,h=1e-5,a=m.sample(p-h),b=m.sample(p+h),c=m.sample(p);near((b.x-a.x)/(2*h*m.duration),c.vx,1e-6);near((b.y-a.y)/(2*h*m.duration),c.vy,1e-6);
});

test('推力低于静摩擦阈值时不产生错误运动',()=>{
  let s=model('friction-block',{m:5,F:5,mu:.2}).sample(1);assert.equal(s.sliding,false);near(s.a,0);near(s.friction,5);near(s.x,0);
  s=model('friction-block',{m:5,F:30,mu:.2}).sample(1);assert.equal(s.sliding,true);near(s.N,49);near(s.friction,9.8);near(s.a,4.04);near(s.x,3);
});

test('动滑轮两根绳的约束和两个牛顿方程',()=>{
  let m=model('movable-pulley'),s=m.sample(1);near(s.aA,4);near(s.aB,8);near(s.T,4);
  for(const mA of [.5,1,3])for(const mB of [.5,1,3])for(const p of [0,.25,.5,1]){
    s=model('movable-pulley',{mA,mB}).sample(p);near(s.sB,2*s.sA);near(s.aB,2*s.aA);near(s.T,mA*s.aA);near(mB*10-s.T/2,mB*s.aB);
  }
});

test('斜坡与摩擦阶段交界连续，能量守恒，推演分界跟随事件',()=>{
  const l=byId('slope-energy');
  for(const h of [1,3,5])for(const mu of [.15,.3,.6])for(const angle of [25,35,55]){
    const m=model('slope-energy',{h,mu,angle});for(let i=0;i<=100;i++)near(m.sample(i/100).residual,0,1e-7);
    const end=m.sample(1);near(end.x,h/mu,1e-7);near(end.v,0,1e-7);near(end.heat,G*h,1e-7);
    const transition=m.stepBounds[2];assert.equal(currentStep(l,transition-1e-7,m),1);assert.equal(currentStep(l,transition+1e-7,m),2);
    const before=m.sample(transition-1e-7),after=m.sample(transition+1e-7);near(before.y,after.y,1e-4);near(before.v,after.v,1e-4);
  }
});

test('均匀杆 RK4 解的能量和初始角加速度',()=>{
  for(const L of [1,2,4])for(const m of [1,6]){
    const mdl=model('falling-rod',{L,m}),initial=mdl.sample(0),end=mdl.sample(1);near(initial.alpha,3*G/(2*L));near(end.angle,Math.PI/2);near(end.alpha,0,1e-8);
    for(let i=0;i<=100;i++)near(mdl.sample(i/100).residual,0,1e-3);
  }
});

test('五质点、圆锥和圆盘的质量积分',()=>{
  let s=model('five-mass-center').sample(1);near(s.M,17);near(s.cg.x,2);near(s.cg.y,33/17);
  s=model('cone-centroid',{h:4,r:2}).sample(1);near(s.zc,1);near(s.M,Math.PI*16/3);
  for(const u of [.1,.4,.8,1]){s=model('cone-centroid',{h:4,r:2}).sample(u);const n=20000,du=u/n;let mass=0,moment=0;for(let i=0;i<n;i++){const x=(i+.5)*du,w=(1-x)**2*du;mass+=w;moment+=x*w;}near(s.zc,4*moment/mass,1e-7);}
  s=model('disk-inertia',{m:4,r:2}).sample(1);near(s.I,8);near(s.M,4);s=model('disk-inertia',{m:4,r:2}).sample(.5);near(s.M,1);near(s.I,.5);
});

test('非恒定速度积分、折返点与初始条件',()=>{
  const m=model('velocity-integration');const turn=m.sample(Math.sqrt(1/3));near(turn.t,Math.sqrt(2));near(turn.v,0,1e-7);near(turn.x,8*Math.sqrt(2)/3);near(m.sample(1).x,0,1e-8);
  const p=.33,h=1e-5,a=m.sample(p-h),b=m.sample(p+h),c=m.sample(p);near((b.x-a.x)/(2*h*m.duration),c.v,1e-7);near((b.v-a.v)/(2*h*m.duration),c.a,1e-7);
});

test('斜面摩擦正确区分静止和滑动',()=>{
  let s=model('inclined-friction',{m:5,angle:10,mu:.6}).sample(1);assert.equal(s.sliding,false);near(s.a,0);near(s.friction,s.parallel);near(s.s,0);
  s=model('inclined-friction',{m:5,angle:30,mu:.2}).sample(1);assert.equal(s.sliding,true);near(s.N,5*G*Math.cos(Math.PI/6));near(s.friction,.2*s.N);near(s.s,3);near(s.a,G*(.5-.2*Math.cos(Math.PI/6)));
});

test('所有矢量预设与源题输出一致',()=>{
  const l=byId('vector-resultant'),checks={
    abc:{R:[4,4,2],module:6},five:{R:[0,2,0],module:2},four:{R:[3,0,0],module:3},
    symmetric:{R:[72,0,0],module:72},triangle:{R:[1,3*Math.sqrt(3),0],module:2*Math.sqrt(7)},
    plane:{R:[3,4,0],module:5},practice:{R:[3,3,0],module:3*Math.sqrt(2)},plot:{R:[3,3,0],module:3*Math.sqrt(2)}
  };
  for(const p of l.presets){const s=createModel(l,{...defaultParameters(l),...p.values},p.id).sample(1);for(let i=0;i<3;i++)near(s.R[i],checks[p.id].R[i]);near(s.magnitude,checks[p.id].module);s.partial.forEach((v,i)=>near(v,s.R[i]));}
});

test('两船最近距离：与源输出一致且相对速度垂直于相对位置',()=>{
  const m=model('ships-closest-approach'),s=m.sample(.5);near(s.distance,50*Math.sqrt(13)/13);near(s.distance,s.closestDistance);near(s.dx*s.relativeVx+s.dy*s.relativeVy,0,1e-8);
  for(const d of [10,30])for(const vA of [20,60])for(const vB of [10,50])for(const angle of [30,80]){
    const mdl=model('ships-closest-approach',{d,vA,vB,angle}),middle=mdl.sample(.5);
    near(middle.dx*middle.relativeVx+middle.dy*middle.relativeVy,0,1e-7);assert.ok(middle.distance<=mdl.sample(0).distance+1e-8);assert.ok(middle.distance<=mdl.sample(1).distance+1e-8);
  }
});

test('弹性撞墙事件：位置连续、速度仅法向反向且能量守恒',()=>{
  for(const v0 of [6,7,9])for(const angle of [45,60,65])for(const d of [1,3])for(const h of [1,1.5,3]){
    const m=model('projectile-wall-bounce',{v0,angle,d,h}),event=m.events[0],p=event.time/m.duration,dt=1e-7;
    const before=m.sample(p-dt),at=m.sample(p),after=m.sample(p+dt),end=m.sample(1);
    assert.ok(p>0&&p<1);near(m.stepBounds[2],p);assert.equal(before.bounced,false);assert.equal(at.bounced,true);
    near(at.x,0,1e-8);near(before.x,after.x,1e-4);near(before.y,after.y,1e-4);near(before.vx,-after.vx);near(before.vy,after.vy,1e-4);near(before.energy,after.energy,1e-5);
    near(event.before.vx,-event.after.vx);near(event.before.vy,event.after.vy);near(end.y,0,1e-7);
    for(let i=0;i<=20;i++)near(m.sample(i/20).energy,m.sample(0).energy,1e-6);
  }
  const original=model('projectile-wall-bounce');near(original.events[0].time,6/7);near(original.sample(1).wallHeight,3*Math.sqrt(3)-2.1);near(original.sample(1).landingX,2.069801019116661);
});

test('双斜面：张力与源符号结果吻合，绳长约束和两侧动力方程成立',()=>{
  for(const m of [1,4])for(const angle of [20,30,45])for(const mu of [0,.1,.2]){
    const mdl=model('two-incline-pulley',{m,angle,mu}),s=mdl.sample(1);assert.ok(s.a>0);near(s.T,8*m*G*Math.sin(angle*Math.PI/180)/5);near(s.residualA,0);near(s.residualB,0);near(s.s,1);
  }
});

test('有外力动滑轮：双向运动、零加速度和绳张力均满足约束',()=>{
  for(const mA of [2,4,8])for(const mB of [.5,1,3])for(const F of [0,5,25]){
    const mdl=model('loaded-moving-pulley',{mA,mB,F});for(const p of [0,.25,.5,1]){const s=mdl.sample(p);near(s.aB,2*s.aA);near(s.sB,2*s.sA);near(s.residualA,0,1e-8);near(s.residualB,0,1e-8);assert.ok(s.T>=0);}
  }
  assert.ok(model('loaded-moving-pulley',{mA:2,mB:3,F:0}).sample(1).aA<0);
  const balanced=model('loaded-moving-pulley',{mA:4,mB:1,F:20}).sample(1);near(balanced.aA,0);near(balanced.sA,0);near(balanced.T,10);
});

test('由方向和模长构造源矢量，方向与模长均正确',()=>{
  let s=model('vector-direction').sample(1);s.result.forEach((x,i)=>near(x,[-2,-1,1][i]));near(Math.hypot(...s.result),Math.sqrt(6));near(Math.hypot(...s.unit),1);
  for(const magnitude of [.5,2,4.5]){s=model('vector-direction',{magnitude}).sample(.5);near(Math.hypot(...s.result),magnitude);for(let i=0;i<3;i++)near(s.result[i]/magnitude,s.unit[i]);}
});

test('光滑球圆柱：满足圆心几何与两个平衡方程',()=>{
  let s=model('sphere-cylinder-equilibrium').sample(1);near(s.dx,.4);near(s.N,30);near(s.T,24);near(s.sin,.6);
  for(const m of [.5,3])for(const R of [.2,.6])for(const r of [.1,.3]){
    s=model('sphere-cylinder-equilibrium',{m,R,r}).sample(.5);near(Math.hypot(s.dx,R),R+r);near(s.residualX,0);near(s.residualY,0);near(s.T,m*10*s.dx/R);
  }
});

test('列车通过人和隧道：时间、车长与源代码输出一致',()=>{
  let m=model('train-through-tunnel'),s=m.sample(1);near(s.v,4);near(s.trainLength,32);near(s.rear,160);near(m.events[0].time,8);near(m.events[1].time,40);
  for(const pass of [3,12])for(const tunnelTime of [30,60])for(const length of [100,240]){
    m=model('train-through-tunnel',{pass,tunnelTime,length});const s1=m.sample(m.stepBounds[2]),s2=m.sample(m.stepBounds[3]),s3=m.sample(1);
    near(s1.rear,0,1e-8);near(s2.head,length,1e-8);near(s3.rear,length,1e-8);assert.ok(s1.observerPassed&&s2.headExited);
  }
});

test('抛物线经过障碍两端，顶部不穿透且匹配源符号解',()=>{
  for(const L of [1,2,4]){
    const m=model('projectile-over-barrier',{L}),A=m.sample(.4),B=m.sample(.6),apex=m.sample(.5),end=m.sample(1);
    near(A.x,2*L);near(B.x,3*L);near(A.y,3*L);near(B.y,3*L);near(apex.y,3.125*L);near(end.y,0);near(A.speed,Math.sqrt(29*L*10)/2);near(Math.tan(A.angle),2.5);
    for(let i=40;i<=60;i++)assert.ok(m.sample(i/100).y>=3*L-1e-8);
  }
});


test('模长与夹角练习：点积、正交、分量构造',()=>{
  let s=model('vector-magnitude-angle',{},'magnitude').sample(1);near(s.magnitude,Math.sqrt(26));near(s.dot,-4);near(Math.cos(s.angle),-4/Math.sqrt(26));
  s=model('vector-magnitude-angle',{ax:1,ay:0,az:0},'orthogonal').sample(1);near(s.dot,0);near(s.angle,Math.PI/2);
  for(const ax of [1,6])for(const ay of [-4,0,4])for(const az of [0,3]){
    s=model('vector-magnitude-angle',{ax,ay,az}).sample(.5);near(s.magnitude,Math.sqrt(ax*ax+ay*ay+az*az));near(s.dot,ay);near(Math.cos(s.angle),ay/s.magnitude);
  }
});

test('圆弦分点：源题 2:6 以及圆和向量几何',()=>{
  let s=model('circle-chord-vector').sample(1);near(s.AP,2);near(s.PB,6);near(s.coefficientA,.75);near(s.coefficientB,.25);
  for(const fraction of [.1,.25,.5,.9])for(const angle of [35,60,75]){
    s=model('circle-chord-vector',{fraction,angle}).sample(.4);near(Math.hypot(s.A[0]-s.B[0],s.A[1]),8);near(s.AP+s.PB,8);
    near(Math.hypot(s.A[0]-s.diameter/2,s.A[1]),s.diameter/2); // A lies on the circle
    near(s.P[0],(1-fraction)*s.A[0]+fraction*s.B[0]);near(s.P[1],(1-fraction)*s.A[1]);
    near(s.A[0]*(s.A[0]-s.B[0])+s.A[1]*s.A[1],0,1e-7); // diameter subtends a right angle
  }
});

test('四边形中点：不要求上下边平行或左右对称',()=>{
  for(const top of [2.2,3.8])for(const base of [3,4.8])for(const skew of [-.6,.8]){
    const s=model('quadrilateral-midpoint-vector',{top,base,skew}).sample(.6);
    s.residual.forEach(v=>near(v,0));s.x.forEach((v,i)=>near(v,(s.b[i]-s.d[i])/4));
    s.O.forEach((v,i)=>{near(v,(s.points[0][i]+s.points[2][i])/2);near(v,(s.points[1][i]+s.points[3][i])/2);});
  }
});

test('三角形重心：题图半边与源码整边的两个解释',()=>{
  for(const tip of [-.8,.5,.8])for(const height of [2,3,4])for(const choice of ['half-side','full-side']){
    const s=model('triangle-centroid-vector',{tip,height},choice).sample(.8);
    const lambda=choice==='half-side'?2:1;assert.equal(s.lambda,lambda);near(s.coefficientSum,(1+lambda)/6);
    s.residual.forEach(v=>near(v,0));s.G.forEach((v,i)=>near(v,s.H[i]+(s.T[i]-s.H[i])/3));
    s.x.forEach((v,i)=>near(v,(s.A[i]+lambda*s.B[i])/6));
  }
});

test('叠块滑轮：等张力、两处静摩擦约束和反作用力',()=>{
  let s=model('stacked-blocks-pulley').sample(1);near(s.T,15);near(s.topLimit,17.5);near(s.groundLimit,47.5);near(s.maximum,35);assert.equal(s.limiting,'层间');assert.equal(s.balanced,true);
  s=model('stacked-blocks-pulley',{F:47.5}).sample(1);assert.equal(s.balanced,false);assert.ok(s.topRequired>s.topLimit);near(s.groundRequired,s.groundLimit);
  for(const m of [1,3.5,6])for(const M of [2,6,10])for(const mu of [.2,.5,.8])for(const F of [0,30,80]){
    s=model('stacked-blocks-pulley',{m,M,mu,F}).sample(.5);near(s.T,F/2);near(s.residualTop,0);near(s.residualBottom,0);near(s.maximum,mu*10*Math.min(2*m,m+M));
    assert.equal(s.balanced,F<=s.maximum+1e-9);near(s.muRequired,Math.max(F/(20*m),F/(10*(M+m))));
  }
});

test('三次速度积分：给定位置、唯一折返与时序边界',()=>{
  let m=model('cubic-velocity-initial-condition'),s=m.sample(1);near(s.C,94);near(s.x,6);near(s.v,-70);near(m.sample(0).x,94);near(m.sample(0).v,10);
  for(const c of [4,10,16])for(const xref of [0,6,20]){
    m=model('cubic-velocity-initial-condition',{c,xref});const turn=m.events[0].time/4;
    assert.ok(turn>0&&turn<1);near(m.stepBounds[2],turn);near(m.sample(turn).v,0,1e-9);near(m.sample(1).x,xref);assert.ok(m.sample(turn-.001).v>0);assert.ok(m.sample(turn+.001).v<0);
    const p=.57,h=1e-5,a=m.sample(p-h),b=m.sample(p+h),cur=m.sample(p);near((b.x-a.x)/(2*h*m.duration),cur.v,1e-6);near((b.v-a.v)/(2*h*m.duration),cur.a,1e-6);
  }
});

test('圆环中的两球：120° 几何、两球受力与重心力矩',()=>{
  for(const m1 of [.5,1,4])for(const m2 of [.5,1,4]){
    const s=model('two-balls-circular-container',{m1,m2}).sample(.6);
    near(Math.hypot(...s.C1),s.rho);near(Math.hypot(...s.C2),s.rho);
    near(Math.hypot(s.C1[0]-s.C2[0],s.C1[1]-s.C2[1]),2*s.r);
    near((s.C1[0]*s.C2[0]+s.C1[1]*s.C2[1])/(s.rho*s.rho),-.5);
    s.res1.forEach(v=>near(v,0,1e-8));s.res2.forEach(v=>near(v,0,1e-8));near(m1*s.C1[0]+m2*s.C2[0],0,1e-8);
    near(Math.tan(s.angle),Math.sqrt(3)*(m1-m2)/(m1+m2));assert.ok(s.contact>0);
  }
  near(model('two-balls-circular-container').sample(1).angle,0);
});

test('Pagonis 3.6 / 3.8 点积、叉积方向与面积',()=>{
  let s=model('vector-dot-cross').sample(1);near(s.dot,0);assert.deepEqual(s.cross,[-5,2,-7]);near(s.area,Math.sqrt(78));near(s.angle,Math.PI/2);
  for(const ax of [1,3,5])for(const ay of [1,4,5])for(const az of [-2,-1,1]){
    s=model('vector-dot-cross',{ax,ay,az}).sample(.5);near(s.orthogonalityA,0);near(s.orthogonalityB,0);
    near(s.area,Math.hypot(ax,ay,az)*Math.sqrt(3)*Math.sin(s.angle));
  }
});

test('汽车原图与源码冲突、匀速和 Pagonis 积分预设',()=>{
  let m=model('car-constant-acceleration',{},'accelerating'),s=m.sample(1);near(m.duration,3*Math.sqrt(5)-5);near(s.x,20);near(s.v,6*Math.sqrt(5));
  m=model('car-constant-acceleration',{v0:10,a:0,distance:20},'constant');s=m.sample(1);near(m.duration,2);near(s.v,10);
  m=model('car-constant-acceleration',{v0:1,a:9.8,distance:47.1},'pagonis');s=m.sample(1);near(m.duration,3);near(s.x,47.1);near(s.v,30.4);
  for(const v0 of [.5,10,20])for(const a of [0,.1,10])for(const distance of [15,20,60]){
    m=model('car-constant-acceleration',{v0,a,distance});s=m.sample(1);near(s.x,distance);near(s.v*s.v,v0*v0+2*a*distance);assert.ok(m.duration>0);
  }
});

test('同高度斜抛与 02C1 跑者接球',()=>{
  let m=model('level-projectile',{},'level80'),s=m.sample(1);near(m.duration,8);near(s.range,320*Math.sqrt(3));near(s.y,0);near(s.maxHeight,80);assert.equal(s.hasRunner,false);
  m=model('level-projectile',{v0:15,angle:45,g:10,runnerStart:25},'receiver');s=m.sample(1);near(m.duration,3*Math.SQRT2/2);near(s.range,22.5);near(s.runnerX,s.range);near(s.runnerSpeed,-5*Math.SQRT2/6);assert.equal(s.hasRunner,true);
  for(const v0 of [15,80,100])for(const angle of [20,45,60])for(const g of [9,10]){
    m=model('level-projectile',{v0,angle,g},'level80');s=m.sample(1);near(s.y,0);near(s.x,s.range);near(s.maxHeight,s.vy*s.vy/(2*g));
  }
});

test('指定高台的抛体逆解经过目标，并在参数极值保持可达',()=>{
  let m=model('projectile-to-elevation'),s=m.sample(1);near(s.v0,100/3);near(m.duration,3*Math.SQRT2);near(s.x,100);near(s.y,10);
  for(const distance of [80,100,140])for(const height of [5,10,20])for(const angle of [35,45,60]){
    m=model('projectile-to-elevation',{distance,height,angle});s=m.sample(1);near(s.x,distance);near(s.y,height);assert.ok(s.v0>0&&Number.isFinite(m.duration));
    for(let i=0;i<=20;i++)assert.ok(m.sample(i/20).y>=-1e-9);
  }
});

test('水平抛与竖直抛相遇的相对运动，事件前均未触地',()=>{
  let m=model('two-projectiles-meet'),s=m.sample(1);near(s.L,6);near(s.xA,s.xB);near(s.yA,s.yB);near(s.meetingY,9.1875);
  for(const height of [8,12,18])for(const v of [6,8,14]){
    m=model('two-projectiles-meet',{height,v});s=m.sample(1);near(s.L,height/2);near(s.xA,s.xB);near(s.yA,s.yB);assert.ok(s.yA>0);
    for(let i=0;i<=20;i++){s=m.sample(i/20);near(s.yA-s.yB,height-2*v*s.t);assert.ok(s.yA>=0&&s.yB>=0);}
  }
});

test('Pagonis 2.1 阿特伍德机：牛顿方程、绳长、反向与等质量',()=>{
  for(const m1 of [1,2,4])for(const m2 of [1,3,4]){
    const m=model('atwood-machine',{m1,m2});for(let i=0;i<=20;i++){
      const s=m.sample(i/20);near(s.residual1,0);near(s.residual2,0);near(s.a,9.8*(m2-m1)/(m1+m2));near(s.T,2*9.8*m1*m2/(m1+m2));
      if(m1===m2){near(s.a,0);near(s.displacement,0);near(s.speed,0);}else assert.ok(Math.abs(s.displacement)<=.55+1e-9);
    }
  }
});
