import test from 'node:test';
import assert from 'node:assert/strict';
import {APPLICATION_LESSONS} from '../app/src/application-lessons.js';
import {createModel, currentStep, defaultParameters} from '../app/src/models.js';

const lesson=id=>{const found=APPLICATION_LESSONS.find(l=>l.id===id);assert.ok(found,id);return found;};
const model=(id,parameters={},preset)=>createModel(lesson(id),parameters,preset);
const near=(actual,expected,tol=1e-8)=>assert.ok(Math.abs(actual-expected)<=tol,`${actual} != ${expected} (± ${tol})`);
const allSteps=(m,check,n=100)=>{for(let i=0;i<=n;i++)check(m.sample(i/n),i/n);};

// Cover corners, not just one slider at a time: the visual travel ranges and
// the physical validity constraints must still hold when controls are combined.
const corners=id=>{
  const l=lesson(id),sets=[defaultParameters(l)];
  for(const p of l.params){const next=[];for(const set of sets.slice(1).length?sets.slice(1):[{}])for(const v of [p.min,p.max])next.push({...set,[p.key]:v});sets.splice(1,sets.length,...next);}
  return sets;
};

test('新增应用均有原题、条件、独立装置步骤及精确来源',()=>{
  assert.ok(APPLICATION_LESSONS.length>=21);
  for(const l of APPLICATION_LESSONS){
    assert.ok(l.question.length>10,l.id);assert.ok(l.provenance.length>40,l.id);
    assert.equal(l.steps.length,4,l.id);assert.ok(l.sources.every(s=>s.cells.length),l.id);
    assert.ok(l.params.length>=1,l.id);
    for(const s of l.steps){assert.ok(s.formula&&s.detail);assert.ok(s.tags.length>=2);}
  }
});

test('可调参数的推导使用变量而不是把默认答案写死',()=>{
  assert.ok(!lesson('double-pulley-beam').steps[0].formula.includes('500'));
  assert.ok(!lesson('cart-two-strings').steps[3].formula.endsWith('=3'));
  assert.ok(lesson('peg-pendulum-flight').steps[2].formula.includes('x_C+'));
  assert.ok(lesson('large-angle-pendulum').steps[0].formula.includes('theta_0'));
  assert.ok(lesson('coupled-spring-carts').steps[0].formula.includes('x_{2,0}'));
  assert.ok(!lesson('earth-moon-orbit').steps[0].formula.includes('363300'));
});

test('500 N 双滑轮配重梁：力矩及两个方向的平衡，载荷和角度边界',()=>{
  let s=model('double-pulley-beam').sample(.5);
  near(s.W,200);near(s.T1,400);near(s.T2,200);near(s.Bx,-200*Math.sqrt(3));near(s.By,100);
  for(const q of corners('double-pulley-beam')){
    const m=model('double-pulley-beam',q);assert.equal(m.clock,'concept');
    allSteps(m,s=>{
      const load=q.load,angle=q.angle*Math.PI/180;
      near(s.T1,2*s.W);near(s.T2,s.W);near(s.Bx+s.T1*Math.cos(angle),0);
      near(s.By+s.T1*Math.sin(angle)+s.T2,load);
      near(s.T1*Math.sin(angle)/4+s.T2-load/2,0,1e-7);
      near(s.moment,0,1e-7);assert.ok(s.T1>0&&s.T2>0);
    },5);
  }
});

test('4m 推 m：两物体分别满足牛顿方程且始终同动',()=>{
  let s=model('pushing-two-blocks').sample(1);near(s.a,10);near(s.R,12);
  for(const q of corners('pushing-two-blocks')){
    const m=model('pushing-two-blocks',q);assert.ok(m.sample(0).a>0);
    allSteps(m,s=>{
      near(q.F-4*q.m*10*q.mu-s.R,4*q.m*s.a,1e-7);
      near(s.R-q.m*10*q.mu,q.m*s.a,1e-7);
      near(s.R,q.F/5);near(s.x,.5*s.a*s.t*s.t);near(s.v,s.a*s.t);
      assert.ok(s.R>0&&s.x>=0);
    },20);
  }
});

test('加速车双绳：45° 分力、张力比和全参数范围始终绷紧',()=>{
  let s=model('cart-two-strings').sample(.5);near(s.T1,15*Math.SQRT2);near(s.T2,5*Math.SQRT2);near(s.ratio,3);
  for(const q of corners('cart-two-strings')){
    const m=model('cart-two-strings',q);
    allSteps(m,s=>{
      near((s.T1+s.T2)/Math.SQRT2,q.m*q.a,1e-7);
      near((s.T1-s.T2)/Math.SQRT2,q.m*10,1e-7);
      assert.ok(s.T1>0&&s.T2>0);near(s.ratio,(q.a+10)/(q.a-10));
      near(s.x,.5*q.a*s.t*s.t);near(s.v,q.a*s.t);
    },20);
  }
});

test('3m 楔块与导轨：约束、两条受力方程与原题值',()=>{
  let s=model('guided-block-wedge').sample(1);near(s.a,Math.sqrt(3));near(s.ay,1);
  for(const q of corners('guided-block-wedge')){
    const m=model('guided-block-wedge',q);
    allSteps(m,s=>{
      near(s.ay,s.a*Math.tan(s.angle));near(s.drop,s.x*Math.tan(s.angle));
      near(s.N*Math.sin(s.angle),3*q.m*s.a,1e-7);
      near(q.m*10-s.N*Math.cos(s.angle),q.m*s.ay,1e-7);assert.ok(s.N>0);
    },20);
  }
});

test('台球：两维动量、动能、接触法线、事件连续和整个球桌范围',()=>{
  let s=model('elastic-billiards-2d').sample(1);near(s.v1,9.34172,1e-5);near(s.v2,2.52311,1e-5);near(s.phi,1.18266,1e-5);
  for(const q of corners('elastic-billiards-2d')){
    const m=model('elastic-billiards-2d',q),p=m.stepBounds[2],d=1e-8;
    const before=m.sample(p-d),at=m.sample(p),after=m.sample(p+d);
    assert.ok(!before.collided&&at.collided&&after.collided);
    near(Math.hypot(at.A[0]-at.B[0],at.A[1]-at.B[1]),2*at.r,1e-10);
    near((at.B[0]-at.A[0])/(2*at.r),at.n[0]);near((at.B[1]-at.A[1])/(2*at.r),at.n[1]);
    for(let j=0;j<2;j++){near(before.A[j],after.A[j],1e-5);near(before.B[j],after.B[j],1e-5);}
    // Smooth balls: each impulse must be parallel to the shared contact normal.
    near((q.v0-after.va[0])*at.n[1]-(-after.va[1])*at.n[0],0,1e-8);
    allSteps(m,s=>{
      near(.1*s.va[0]+.2*s.vb[0],.1*q.v0,1e-8);near(.1*s.va[1]+.2*s.vb[1],0,1e-8);
      near(.05*(s.va[0]**2+s.va[1]**2)+.1*(s.vb[0]**2+s.vb[1]**2),.05*q.v0**2,1e-8);
      assert.ok(Math.hypot(s.A[0]-s.B[0],s.A[1]-s.B[1])>=2*s.r-1e-8);
      // Rail inner faces x=±2.64,z=±1.64; sphere radius .15.
      for(const ball of [s.A,s.B]){assert.ok(Math.abs(ball[0])+s.r<2.64,`${JSON.stringify(q)} x=${ball[0]}`);assert.ok(Math.abs(ball[1])+s.r<1.64,`${JSON.stringify(q)} y=${ball[1]}`);}
    },200);
    assert.equal(currentStep(lesson('elastic-billiards-2d'),p,m),2);
  }
});

test('立方阻力：独立复算 Euler 每一步，RK4 渐近终端速度',()=>{
  for(const q of corners('cubic-drag-fall')){
    const m=model('cubic-drag-fall',q);let x=0,v=0;
    for(let i=0;i<=20;i++){
      const s=m.sample(i/20);near(s.xEuler,x,1e-10);near(s.vEuler,v,1e-10);
      near(s.a,9.8-q.c/q.m*s.v**3);near(s.terminal**3,q.m*9.8/q.c,1e-8);
      assert.ok(s.v>=0&&s.v<=s.terminal+1e-7);
      [x,v]=[x+v*.05,v+(9.8-q.c/q.m*v**3)*.05];
    }
  }
  const end=model('cubic-drag-fall').sample(1);near(end.xEuler,2.0427754028,1e-8);near(end.x,2.07945064735,1e-8);near(end.terminal,Math.cbrt(14.7));
});

test('碰钉摆：长度、机械能、碰钉及切向释放两事件的连续性',()=>{
  const s0=model('peg-pendulum-flight').sample(1);near(s0.vB,2*Math.sqrt(10));near(s0.vC,Math.sqrt(20*(1+Math.SQRT1_2)));near(s0.landingX,4.39,.01);
  for(const q of corners('peg-pendulum-flight')){
    const m=model('peg-pendulum-flight',q),eps=1e-8;
    for(const [i,phase] of [[1,'short'],[2,'flight']]){
      const p=m.stepBounds[i],before=m.sample(p-eps),at=m.sample(p),after=m.sample(p+eps);
      assert.equal(at.phase,phase);for(const k of ['x','y','vx','vy'])near(before[k],after[k],2e-5);
      assert.equal(currentStep(lesson('peg-pendulum-flight'),p,m),i);
    }
    allSteps(m,s=>{
      near(s.energy,20*q.R,6e-5);
      if(s.phase==='long')near(Math.hypot(s.x,s.y-2*q.R),2*q.R,1e-7);
      if(s.phase==='short')near(Math.hypot(s.x,s.y-q.R),q.R,1e-7);
      assert.ok(s.y>=0);
    });
    const c=m.sample(m.stepBounds[2]),alpha=q.angle*Math.PI/180;
    near(c.x,q.R*Math.cos(alpha),1e-7);near(c.y,q.R*(1-Math.sin(alpha)),1e-7);
    near(c.vx,c.vC*Math.sin(alpha),1e-7);near(c.vy,c.vC*Math.cos(alpha),1e-7);
    near(m.sample(1).y,0,1e-7);
    const flight=(c.vy+Math.sqrt(c.vy**2+20*c.y))/10;near(m.sample(1).x,c.x+c.vx*flight,1e-7);
  }
});

test('大角度刚杆摆：能量、方程、预设和小角近似',()=>{
  const l=lesson('large-angle-pendulum');
  for(const preset of l.presets){const m=model(l.id,preset.values,preset.id);near(m.sample(0).theta,3);near(m.sample(0).omega,0);near(m.duration,preset.id==='pagonis-8-7'?20:10);}
  for(const q of corners(l.id)){
    const m=model(l.id,q);
    allSteps(m,s=>{
      near(s.alpha,-9.8/q.L*Math.sin(s.theta));near(s.small,q.theta*Math.PI/180*Math.cos(Math.sqrt(9.8/q.L)*s.t));
      near(s.energy,9.8*q.L*(1-Math.cos(q.theta*Math.PI/180)),2e-4);
    },200);
  }
});

test('双车三弹簧：三个弹簧能量和方程；与闭式本征模独立对照',()=>{
  const l=lesson('coupled-spring-carts');
  for(const q of corners(l.id)){
    const m=model(l.id,q),E0=.5*(q.k2+3)*q.x2**2;
    allSteps(m,s=>{
      near(s.a1,-4*s.x1+q.k2*(s.x2-s.x1));near(q.m2*s.a2,-3*s.x2-q.k2*(s.x2-s.x1));
      near(s.energy,E0,1e-4);assert.ok(s.frequencies[0]>0&&s.frequencies[1]>s.frequencies[0]);
    },200);
  }
  // cos(sqrt(M^-1 K)t) x(0), evaluated by polynomial interpolation.
  const m=model(l.id),lambda1=m.sample(0).frequencies[0]**2,lambda2=m.sample(0).frequencies[1]**2;
  for(const t of [0,1,3,10,20]){
    const c1=Math.cos(Math.sqrt(lambda1)*t),c2=Math.cos(Math.sqrt(lambda2)*t),f1=(c2-c1)/(lambda2-lambda1),f0=(lambda2*c1-lambda1*c2)/(lambda2-lambda1),s=m.sample(t/m.duration);
    near(s.x1,-2*f1,1e-6);near(s.x2,f0+2.5*f1,1e-6);
  }
});

test('地球水星：Kepler 方程、焦点距离、比机械能、面积速度和源近日远日点',()=>{
  const mu=1.3271244e20;
  for(const q of corners('earth-mercury-orbits')){
    const m=model('earth-mercury-orbits',q),initial=m.sample(0),area=[initial.earth.areaRate,initial.mercury.areaRate];
    allSteps(m,s=>{
      for(const [i,o,a,e] of [[0,s.earth,s.aE,q.eEarth],[1,s.mercury,s.aM,q.eMercury]]){
        near(o.E-e*Math.sin(o.E),o.M,1e-9);near(Math.hypot(o.x,o.y)/o.r,1,1e-12);
        near((o.speed**2/2-mu/o.r)/(-mu/(2*a)),1,1e-11);
        near(o.areaRate/area[i],1,1e-11);assert.ok(o.r>=a*(1-e)-1e-3&&o.r<=a*(1+e)+1e-3);
      }
    });
    near(m.sample(1).earth.x,initial.earth.x,.001);near(m.sample(1).earth.y,initial.earth.y,.001);
  }
  const original=model('earth-mercury-orbits').sample(0);near(original.earth.r/1e9,147.5,1e-8);near(original.mercury.r/1e9,46,1e-8);
  near(original.aE*(1+5.1/300.1)/1e9,152.6,1e-8);near(original.aM*(1+24/116)/1e9,70,1e-8);
});

test('地月：源数据、两体周期、面积速度、近远地点与参数极值',()=>{
  let m=model('earth-moon-orbit'),s=m.sample(0);near(s.perigee/1000,363300);near(s.apogee/1000,405500);near(s.a/1000,384400);near(s.T/86400,27.28674,1e-5);
  for(const q of corners('earth-moon-orbit')){
    m=model('earth-moon-orbit',q);const start=m.sample(0),middle=m.sample(.5),end=m.sample(1);
    near(start.r,q.rp*1e6,.0001);near(middle.r,q.ra*1e6,.0001);near(end.r,start.r,.0001);assert.ok(start.speed>middle.speed);
    allSteps(m,s=>{
      near(s.E-s.e*Math.sin(s.E),s.M,1e-9);near(Math.hypot(s.x,s.y),s.r,.0001);
      near(s.areaRate/start.areaRate,1,1e-11);near((s.speed**2/2-s.mu/s.r)/(-s.mu/(2*s.a)),1,1e-11);
    });
  }
});
