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
  assert.equal(cat.notebooks.length,39);assert.equal(cat.notebooks.reduce((s,n)=>s+n.cellCount,0),1960);
  assert.equal(new Set(LESSONS.map(l=>l.id)).size,LESSONS.length);
  const order=LESSONS.map(l=>SECTIONS.findIndex(s=>s.id===l.section));assert.deepEqual(order,[...order].sort((a,b)=>a-b));
  for(const l of LESSONS){assert.ok(l.sources.length);assert.equal(l.steps.length,4);for(const s of l.sources){const n=cat.notebooks.find(n=>n.file===s.file);assert.ok(n,`${l.id}: ${s.file}`);for(const i of s.cells)assert.ok(n.cells[i]?.id,`${s.file} cell ${i}`);}}
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

test('两载荷梁力平衡与力矩平衡',()=>{
  let s=model('two-load-beam').sample(.8);near(s.RA,40);near(s.RB,50);near(s.residual,0);near(s.moment,0);
  for(const m1 of [1,3,8])for(const m2 of [1,6,10])for(const b of [.5,1,2]){s=model('two-load-beam',{m1,m2,b}).sample(.5);near(s.residual,0);near(s.moment,0);}
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
    symmetric:{R:[72,0,0],module:72},triangle:{R:[1,3*Math.sqrt(3),0],module:2*Math.sqrt(7)}
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
