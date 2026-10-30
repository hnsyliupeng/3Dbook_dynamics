import { DEFAULT_PARAMETERS, FIXED_DT, HORIZON_S, RADIUS_M, TRAVEL_M } from '../../physics/atwood'
export type SourceClassification = 'Source-derived' | 'Adapted' | 'Extended'
export interface DerivationStep {
  id: string; number: string; title: string; latex: string; explanation: string; source: string
  mathematicalDependencies: string[]; variableBindings: string[]; physicalObjectBindings: string[]
  activationCondition: string; numericalSubstitution: string; verification: string
}
export interface MechanicsLesson {
  id: string; title: string; chapter: string; classification: SourceClassification
  source: { repository: string; commit: string; notebooks: string[]; cellIds: string[] }
  model: {
    coordinates: {id:string; positiveDirection:string; unit:string}[]
    parameters: typeof DEFAULT_PARAMETERS; assumptions: string[]
    initialConditions: {q:number;v:number}; constraints: string[]; equations: string[]
    solver: { method:string; stepSeconds:number; horizonSeconds:number; travelLimitMetres:number }
  }
  visual: {cameraPresets:string[];forceVectors:boolean;motionTrails:boolean;cutaway:boolean;explode:boolean;radiusMetres:number}
  derivation: DerivationStep[]; charts: string[]; exercises: string[]; skillArtifacts: string[]
}
const repo = 'https://github.com/unlam/ComputationalAnalyticalMechanics'
const commit = '387f2df07e70ba3bdff2c66460c04f6ae6ba2055'
const step = (s: Omit<DerivationStep,'activationCondition'|'numericalSubstitution'>): DerivationStep => ({
  ...s, activationCondition: `selected:${s.id}`, numericalSubstitution: `snapshot:${s.id}`,
})
export const atwoodLesson: MechanicsLesson = {
  id: 'atwood-ideal', title: 'Atwood’s Machine', chapter: '04 / 05', classification: 'Adapted',
  source: { repository: repo, commit,
    notebooks: ['04Constraints/atwoodConstraint.ipynb', '05Simulation/atwoodSimulationSolved.ipynb'],
    cellIds: ['index:7','index:8','index:13','index:18','index:23','index:26','index:28','index:32','index:33','index:35','index:39','index:40','index:60','index:69'] },
  model: {
    coordinates:[{id:'q',positiveDirection:'m2 downward',unit:'m'}], parameters:DEFAULT_PARAMETERS,
    assumptions:['不可伸长的轻绳','无质量滑轮','无摩擦、无滑移','质量块未发生碰撞'],
    initialConditions:{q:0,v:DEFAULT_PARAMETERS.v0},
    constraints:['l1 + l2 + πR = constant','pulley angle = -q/R in the engineering view'],
    equations:['L = 1/2 (m1+m2) qdot² + (m2-m1) g q','(m1+m2) qdd = (m2-m1) g','T_rope = 2 m1 m2 g/(m1+m2)'],
    solver:{method:'classical fixed-step RK4, independent analytic comparison',stepSeconds:FIXED_DT,horizonSeconds:HORIZON_S,travelLimitMetres:TRAVEL_M},
  },
  visual:{cameraPresets:['isometric'],forceVectors:true,motionTrails:false,cutaway:true,explode:false,radiusMetres:RADIUS_M},
  charts:['q(t)','qdot(t)','energy(t)','numerical error(t)'],
  exercises:['Predict the motion for equal masses and zero initial velocity.'],
  skillArtifacts:['public/skill-artifacts/atwood-colorfigures.html','src/integrations/MachineSkillAdapter.ts','machine-prototype.html'],
  derivation: [
    step({ id:'constraint',number:'01',title:'一条绳，一种运动',latex:String.raw`\ell_1+\ell_2+\pi R=L`,
      explanation:'不可伸长的绳子建立了两个质量块之间的约束。',source:'04Constraints/atwoodConstraint.ipynb#index:7-8',
      mathematicalDependencies:[],variableBindings:['q','R'],physicalObjectBindings:['rope','m1','m2'],verification:'两段直绳长度之和恒定。' }),
    step({ id:'coordinate',number:'02',title:'选择广义坐标',latex:String.raw`q=\ell_2-\ell_{2,0},\qquad \ell_1=\ell_{1,0}-q`,
      explanation:'选择 m₂ 向下为正：q 增加时 m₁ 向上、m₂ 向下；q 减小时方向相反。',source:'04Constraints/atwoodConstraint.ipynb#index:13,18',
      mathematicalDependencies:['constraint'],variableBindings:['q'],physicalObjectBindings:['rope','m1','m2'],verification:'独立自由度为 1。' }),
    step({ id:'velocity',number:'03',title:'位置对时间求导',latex:String.raw`\dot y_1=\dot q,\qquad \dot y_2=-\dot q`,
      explanation:'这里 y₁、y₂ 都以竖直向上为正；两块质量的速率相同。',source:'04Constraints/atwoodConstraint.ipynb#index:13,23',
      mathematicalDependencies:['coordinate'],variableBindings:['qdot'],physicalObjectBindings:['m1','m2'],verification:'速度方向相反，大小相等。' }),
    step({ id:'kinetic',number:'04',title:'建立动能',latex:String.raw`T_{\rm kin}=\tfrac12(m_1+m_2)\dot q^2`,
      explanation:'两个质量块的平动动能相加；理想滑轮没有转动惯量。',source:'04Constraints/atwoodConstraint.ipynb#index:23',
      mathematicalDependencies:['velocity'],variableBindings:['m1','m2','qdot'],physicalObjectBindings:['m1','m2'],verification:'动能的单位为 J。' }),
    step({ id:'potential',number:'05',title:'建立势能',latex:String.raw`V=(m_1-m_2)gq`,
      explanation:'以初始位置为势能零点，m₁ 上升时势能增加，m₂ 下降时势能减少。',source:'04Constraints/atwoodConstraint.ipynb#index:26',
      mathematicalDependencies:['coordinate'],variableBindings:['m1','m2','q'],physicalObjectBindings:['m1','m2'],verification:'势能零点可任意选取。' }),
    step({ id:'lagrangian',number:'06',title:'写下拉格朗日量',latex:String.raw`\mathcal L=\tfrac12(m_1+m_2)\dot q^2+(m_2-m_1)gq`,
      explanation:'将动能与势能组合：L = T − V。',source:'04Constraints/atwoodConstraint.ipynb#index:27-28',
      mathematicalDependencies:['kinetic','potential'],variableBindings:['q','qdot','m1','m2'],physicalObjectBindings:['m1','m2'],verification:'L = T − V。' }),
    step({ id:'partials',number:'07',title:'计算偏导与全导数',latex:String.raw`\frac{\partial\mathcal L}{\partial q}=(m_2-m_1)g,\quad \frac{d}{dt}\frac{\partial\mathcal L}{\partial\dot q}=(m_1+m_2)\ddot q`,
      explanation:'质量与重力加速度为常数；下方两个数值在当前仿真解上分别计算。',source:'04Constraints/atwoodConstraint.ipynb#index:32',
      mathematicalDependencies:['lagrangian'],variableBindings:['qdot','a','m1','m2'],physicalObjectBindings:['m1','m2'],verification:'左右两项的单位均为 N。' }),
    step({ id:'euler',number:'08',title:'欧拉—拉格朗日方程',latex:String.raw`\frac{d}{dt}\frac{\partial\mathcal L}{\partial\dot q}-\frac{\partial\mathcal L}{\partial q}=0`,
      explanation:'代入偏导，得到 (m₁ + m₂)q̈ = (m₂ − m₁)g。',source:'04Constraints/atwoodConstraint.ipynb#index:32-35',
      mathematicalDependencies:['partials'],variableBindings:['q','qdot','a'],physicalObjectBindings:['m1','m2'],verification:'正方向是 m₂ 向下。' }),
    step({ id:'acceleration',number:'09',title:'求解加速度',latex:String.raw`a=\ddot q=\frac{(m_2-m_1)g}{m_1+m_2}`,
      explanation:'两侧质量相等时加速度为零；交换质量，加速度反向。',source:'04Constraints/atwoodConstraint.ipynb#index:35,39',
      mathematicalDependencies:['euler'],variableBindings:['a','m1','m2'],physicalObjectBindings:['m1','m2'],verification:'默认参数 a = 3.27 m/s²。' }),
    step({ id:'tension',number:'10',title:'绳索中的张力',latex:String.raw`T_{\rm rope}=m_1(g+a)=\frac{2m_1m_2g}{m_1+m_2}`,
      explanation:'将 m₁ 的竖直受力代入；张力与动能使用不同符号。',source:'Adapted: Newton force balance',
      mathematicalDependencies:['acceleration'],variableBindings:['a','m1','m2'],physicalObjectBindings:['rope','m1'],verification:'默认参数张力为 13.08 N。' }),
    step({ id:'solution',number:'11',title:'时间上的解',latex:String.raw`q(t)=v_0t+\tfrac12at^2,\qquad \dot q(t)=v_0+at`,
      explanation:'q(0) 取零。数值积分和解析表达式独立计算，再在同一时刻比较。',source:'05Simulation/atwoodSimulationSolved.ipynb#index:40,69 (adapted ideal model)',
      mathematicalDependencies:['acceleration'],variableBindings:['q','qdot','a'],physicalObjectBindings:['m1','m2'],verification:'适用于端点之前的理想运动。' }),
    step({ id:'validation',number:'12',title:'检查能量与约束',latex:String.raw`T_{\rm kin}+V=\tfrac12(m_1+m_2)v_0^2`,
      explanation:'没有非保守力，机械能保持初始值；端点仅暂停，不计算碰撞后的能量。',source:'Extended: energy conservation check',
      mathematicalDependencies:['kinetic','potential','solution'],variableBindings:['q','qdot','m1','m2'],physicalObjectBindings:['m1','m2','rope'],verification:'同一状态同时驱动曲线和模型。' }),
  ],
}
