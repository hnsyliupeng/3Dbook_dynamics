import { DEEP_APPLICATION_LESSONS } from './deep-application-lessons.js';
// Source-specific application problems. Values below are taken from the cited
// cells; deliberately added visual/physical assumptions are stated explicitly.
const S=(title,formula,detail,tags)=>({title,formula,detail,tags});
const P=(key,label,value,min,max,step,unit='')=>({key,label,value,min,max,step,unit});
const A=(file,cells,note='')=>({file,cells,note});
const B=(file,cells,note='')=>({repo:'pagonis',file,cells,note});

export const APPLICATION_LESSONS=[
  {
    id:'double-pulley-beam',section:'statics',kind:'cabled-beam',insertBefore:'two-load-beam',figure:'double-pulley-beam',
    title:'500 N 梁与两组滑轮配重',eyebrow:'02 / 原题应用 · 建筑支承',
    question:'均匀梁重 500 N，斜绳为 30°、配重分别为 2W 和 W；求 W 与铰支座反力。',
    description:'复现原题的铰支梁、两只定滑轮、两条绳索及不同配重；逐步建立力与力矩平衡。',
    idea:'先对铰点取矩消去支座力，再分别求水平和竖直反力。',
    provenance:'第一来源 03B1 单元 28–32：原图给均匀梁重 500 N、斜绳 30°、作用点 L/4、梁端作用 W，另一配重 2W。轻绳、理想定滑轮、铰接且系统静止。原题 W 是力而非质量。默认计算 W=200 N、2W=400 N、B_x=−200√3 N、B_y=100 N；滑块变化为扩展。题图取自用户提供的截图。',
    sources:[A('03B1 Static Rigig Body.ipynb',[28,29,30,31,32],'题图与对铰点力矩')],
    params:[P('load','梁重',500,250,750,25,'N'),P('angle','斜绳与梁夹角',30,20,55,5,'°')],
    steps:[
      S('标出梁重与铰支座','G>0,\\quad x_G=L/2','原题 G=500 N；梁自重作用在中点，B 为固定铰支座。',['hinge','weight']),
      S('由理想滑轮确定两绳张力','T_{\\rm incline}=2W,\\quad T_{\\rm end}=W','左侧悬挂 2W，右侧悬挂 W；绳与梁接触点为 L/4。',['ropeUpper','ropeLower']),
      S('以 B 点取力矩','2W\\sin\\alpha\\cdot L/4+W L-G L/2=0','默认 α=30°，解得 W=200 N；梁长 L 被约去。',['moment','ropeUpper']),
      S('分别求支座的水平和竖直力','B_x=-2W\\cos\\alpha,\\quad B_y=G-W-2W\\sin\\alpha','默认 Bₓ≈−346.41 N，Bᵧ=100 N；负号表示水平反力向左。',['hinge','weight'])
    ]
  },
  {
    id:'pushing-two-blocks',section:'dynamics',kind:'pushing-blocks',insertAfter:'friction-block',figure:'pushing-blocks',
    title:'水平推力推动 4m 与 m 两块',eyebrow:'03 / 原题应用 · 货物推运',
    question:'两块质量为 4m 与 m 的物体在粗糙地面上被水平力 F 推动，加速度和接触力是多少？',
    description:'推力、两块货物、地面摩擦及块间接触共同呈现在运动的 3D 装置中。',
    idea:'整体方程给加速度；隔离右侧小块得到接触力。',
    provenance:'第一来源 03C2 单元 22–32、03B1 单元 200–210：题图为 4m、m、推力 F 和同一摩擦系数 μ。03C2 的正确结果 a=F/(5m)−μg；03B1 输出的符号不同，不能照用。示意默认 m=1 kg、F=60 N、μ=0.2、g=10；原题为符号题，数值是新增示例。参数范围确保从静止即滑动，μ 同时用作静、动摩擦系数。',
    sources:[A('03C2 Example Torque.ipynb',[22,24,26,27,28,29,30,31,32],'同题图及正确的整体方程'),A('03B1 Static Rigig Body.ipynb',[200,202,204,205,206,207,208,209,210],'旧源码输出符号与题图不一致')],
    params:[P('m','小块质量 m',1,.5,1.5,.1,'kg'),P('F','推力 F',60,40,100,5,'N'),P('mu','摩擦系数 μ',.2,0,.5,.05)],
    steps:[
      S('合并两个物体','M=4m+m=5m','两块始终接触，沿水平方向具有相同加速度。',['blockA','blockB']),
      S('扣除两处地面摩擦','F_{\\rm net}=F-4\\mu mg-\\mu mg','两块均在粗糙地面上滑动，摩擦方向与运动相反。',['appliedForce','friction']),
      S('求共同加速度','a=\\frac{F}{5m}-\\mu g','默认 a=10 m/s²；参数范围保证 F 大于最大静摩擦。',['accel','blockA']),
      S('隔离小块求接触力','R-\\mu mg=ma\\quad\\Rightarrow\\quad R=F/5','默认接触力 R=12 N；动画位移由同一加速度计算。',['contact','blockB'])
    ]
  },
  {
    id:'cart-two-strings',section:'dynamics',kind:'cart-strings',insertAfter:'pushing-two-blocks',figure:'trolley-strings',
    title:'加速小车中的双绳拉力',eyebrow:'03 / 原题应用 · 车载载荷',
    question:'小车向右加速 20 m/s²，1 kg 重物相对小车静止，两根 45° 绳的张力比是多少？',
    description:'车轮、立柱、双绳与载荷一起运动；实时显示两根绳的张力与车体位移。',
    idea:'重物竖直方向平衡，水平方向则随车加速；两根绳只能受拉。',
    provenance:'第一来源 05A2 单元 25–35，原题明确 m=1 kg、a=20 m/s²、g=10 m/s²、两绳与水平成 45°，源码 T₁=15√2 N、T₂=5√2 N，T₁/T₂=3。用户拼图中的红色手写标记不作为题设；此处采用完整题干及源码得到的比值 3。仅允许 a>g，保证两条绳均绷紧；滑块数值是扩展。',
    sources:[A('05A2 Dynamics Forze by Acceleration.ipynb',[25,26,27,28,29,30,31,32,33,34,35],'完整题干及源结果：比值为 3')],
    params:[P('m','载荷质量',1,.5,3,.5,'kg'),P('a','小车加速度',20,11,30,1,'m/s²')],
    steps:[
      S('随车观察重物','a_x=a,\\qquad a_y=0','重物相对车体位置固定，但相对于地面向右加速。',['mass','accel']),
      S('竖直方向平衡','(T_1-T_2)\\sin45^\\circ=mg','上绳提供向上的分量，下绳拉向右下。',['ropeUpper','ropeLower']),
      S('水平方向应用牛顿定律','(T_1+T_2)\\cos45^\\circ=ma','两绳的水平分量一起使载荷与车同速加速。',['ropeUpper','accel']),
      S('计算拉力比并验证绷紧','\\frac{T_1}{T_2}=\\frac{a+g}{a-g}','默认 T₁=15√2 N、T₂=5√2 N、比值为 3；a>g 时下绳张力为正。',['ropeUpper','ropeLower'])
    ]
  },
  {
    id:'guided-block-wedge',section:'dynamics',kind:'guided-wedge',insertAfter:'cart-two-strings',figure:'wedge-guide',
    title:'竖直导轨滑块与 3m 楔块',eyebrow:'03 / 原题应用 · 光滑约束',
    question:'质量 m 的滑块只能竖直下降，推动质量 3m 的光滑楔块；楔块向右的加速度是多少？',
    description:'固定导轨、下落滑块和运动楔块保持接触；同时显示法向力与两者加速度。',
    idea:'斜面接触把滑块的竖直位移与楔块的水平位移约束起来。',
    provenance:'第一来源 05A2 单元 37–43：题图明确滑块 m、楔块 3m，均光滑。原源码创建楔块时没有设置质量 3m，其输出误按 m 求解；本演示按题图重新列牛顿方程，a楔=g sinα cosα/(3 cos²α+sin²α)。题图未给数值；默认 α=30°、m=1 kg、g=10 是示例。导轨和地面无摩擦，忽略楔块转动。',
    sources:[A('05A2 Dynamics Forze by Acceleration.ipynb',[37,39,40,41,42,43],'原图 3m；原代码未把楔块设为 3m')],
    params:[P('angle','楔角 α',30,20,50,5,'°'),P('m','滑块质量',1,.5,3,.5,'kg')],
    steps:[
      S('识别光滑约束','M_{\\rm wedge}=3m,\\qquad y=-x\\tan\\alpha+\\text{常数}','竖直导轨固定，楔块沿地面水平运动，两者始终接触。',['wedge','guide']),
      S('列出两个运动方程','mg-N\\cos\\alpha=m a_y,\\quad N\\sin\\alpha=3m a_x','aᵧ 为向下的加速度，aₓ 为楔块向右的加速度。',['normal','wedge']),
      S('应用接触约束','a_y=a_x\\tan\\alpha','斜面向右移动多少，滑块就沿竖直导轨下降相应高度。',['guide','contact']),
      S('解出楔块与滑块加速度','a_x=\\frac{g\\sin\\alpha\\cos\\alpha}{3\\cos^2\\alpha+\\sin^2\\alpha}','默认 aₓ=√3 m/s²、aᵧ=1 m/s²。源码忽略 3m，不能把其数值当成题图答案。',['accel','wedge'])
    ]
  },
  {
    id:'elastic-billiards-2d',section:'dynamics',kind:'billiards',insertAfter:'projectile-wall-bounce',
    title:'台球平面弹性碰撞',eyebrow:'03 / 原题应用 · 碰撞',
    question:'0.1 kg 球以 10 m/s 撞击静止的 0.2 kg 球，前者偏转 30°；碰后速度和散射角是多少？',
    description:'球桌上的两个球在指定碰撞几何下接触、分离并留下各自轨迹。',
    idea:'同时使用两个方向的动量守恒和动能守恒。',
    provenance:'Pagonis 例 4.2，Chapter 4 单元 1–2：m₁=0.1 kg、m₂=0.2 kg、v₀=10 m/s、θ=π/6，数值解 v₁≈9.34172 m/s、v₂≈2.52311 m/s、φ≈1.18266 rad。源代码未注明单位，这里假设 SI；Notebook 给出守恒方程而非球桌外观；场景额外假设光滑球、无旋转和水平桌面，并由动量变化方向确定接触法线。球半径为示意；展示在碰到桌边之前结束，不模拟库边碰撞。',
    sources:[B('Chapter4/Python_Codes_Chapter_4.ipynb',[1,2],'例 4.2 的三个守恒方程与数值解')],
    params:[P('v0','入射速度',10,8,12,.5,'m/s'),P('angle','入射球偏转角',30,15,60,5,'°')],
    steps:[
      S('撞击前：靶球静止','\\vec p_{\\rm before}=m_1v_0\\,\\hat x','两球在光滑水平桌面上运动，初始只有入射球有动量。',['ballA','ballB']),
      S('预测接触几何','m_1v_0=m_1v_1\\cos\\theta+m_2v_2\\cos\\phi','入射球此时正在接近；下一步骤分界点相切。接触法线依据冲量方向确定。',['impact','ballA']),
      S('垂直方向动量守恒','m_1v_1\\sin\\theta=m_2v_2\\sin\\phi','两球散向入射方向的两侧。',['ballA','ballB']),
      S('加入动能守恒','m_1v_0^2=m_1v_1^2+m_2v_2^2','默认 v₁≈9.342 m/s、v₂≈2.523 m/s、φ≈67.76°。',['velocity','path'])
    ]
  },
  {
    id:'cubic-drag-fall',section:'dynamics',kind:'cubic-drag',insertAfter:'atwood-machine',
    title:'立方阻力下落：欧拉法与数值解',eyebrow:'03 / 原题应用 · 阻力模型',
    question:'3 kg 物体从静止下落，阻力为 2v³；0.05 s 欧拉步长会带来多大的误差？',
    description:'并列显示欧拉法与精细 RK4 解的下落位置，数值同步比较。',
    idea:'同一物理模型可用不同积分方法求解；离散步长影响结果。',
    provenance:'Pagonis 例 2.8、2.9，Chapter 2 单元 13–16：m=3 kg、g=9.8 m/s²、c=2，初始 x=v=0；2.8 使用显式欧拉 Δt=0.05 s，2.9 使用 odeint，计算 0–1 s。源代码未注明单位，这里假设 SI；本演示精细 RK4 近似 odeint 并对欧拉点线性插值；并排透明落塔是新增示意，阻力仅在此向下下落问题中取 cv³。',
    sources:[B('Chapter2/Python_Codes_Chapter_2.ipynb',[13,14,15,16],'例 2.8 欧拉法与例 2.9 ODE 积分')],
    params:[P('m','质量 m',3,2,4,.5,'kg'),P('c','阻力系数 c',2,1,3,.25,'kg·s/m²')],
    steps:[
      S('从静止开始下落','x(0)=0,\\qquad v(0)=0','向下取正；重力与立方速度阻力方向相反。',['ballA','ballB']),
      S('列出运动微分方程','\\dot x=v,\\qquad \\dot v=g-\\frac{c}{m}v^3','两侧装置的物理参数完全相同。',['weight','friction']),
      S('采用原题的欧拉步进','x_{n+1}=x_n+v_n\\Delta t,\\quad v_{n+1}=v_n+a_n\\Delta t','左侧步长 0.05 s；两步之间线性插值用于显示。',['ballA','velocity']),
      S('与精细数值解比较','v_{\\rm terminal}=\\sqrt[3]{mg/c}','右侧采用固定小步长 RK4，读数显示位移差；终端速度并非 1 s 时的瞬时速度。',['ballB','velocity'])
    ]
  },
  {
    id:'peg-pendulum-flight',section:'dynamics',kind:'peg-flight',insertAfter:'slope-energy',figure:'peg-projectile',
    title:'摆球碰钉后释放并飞出',eyebrow:'03 / 原题应用 · 摆与抛体',
    question:'长 2R 的摆从水平释放，在最低点碰到 R 处的钉，随后以给定角度脱离：落点在哪里？',
    description:'演示摆下、绳碰钉、短摆继续上升、在 C 点释放与抛物线落地四个真实事件。',
    idea:'碰钉前后速度连续；释放前靠能量，释放后按重力抛体计算。',
    provenance:'第一来源 02C3 单元 2–8：题图 A→B 摆长 2R，在 B 接触距上支点 R 的钉，C 的几何高度为 R−R sinα。源代码 vB=2√(Rg)、vC=√[2Rg(1+sinα)]。题图 α 是短绳与水平的夹角，所以脱离切线与水平的夹角是 90°−α；源码却把 α 当作发射角，只有 45° 时一致。这里按题图几何，在指定 C 点设置理想释放机构；R=1 m、α=45°、g=10 为示例。',
    sources:[A('02C3 Kinematic Advance Example.ipynb',[2,3,4,5,6,7,8],'源图/能量公式；脱离速度角按切线修正')],
    params:[P('R','短摆半径 R',1,.7,1.3,.1,'m'),P('angle','短绳与水平夹角 α',45,30,65,5,'°')],
    steps:[
      S('从水平位置释放长摆','L_1=2R,\\quad v_B=2\\sqrt{Rg}','A 到 B 用非线性摆方程积分；在 B 点与钉接触。',['pendulum','ball']),
      S('绕钉转动并到达 C 点','L_2=R,\\quad v_C=\\sqrt{2Rg(1+\\sin\\alpha)}','碰钉瞬间速度不变；C 的高度为 R(1−sinα)。',['contact','pendulum']),
      S('在 C 沿切线释放','\\beta=90^\\circ-\\alpha,\\quad x=x_C+v_C\\cos\\beta\\,\\tau','假设释放机构在指定角度松开，之后只受重力。',['velocity','ball']),
      S('求落点','0=R(1-\\sin\\alpha)+v_C\\sin\\beta\\,\\tau-\\tfrac12g\\tau^2','地面落点由正的飞行时间计算；曲线从 C 点连续开始。',['path','velocity'])
    ]
  },
  {
    id:'large-angle-pendulum',section:'dynamics',kind:'nonlinear-pendulum',insertAfter:'peg-pendulum-flight',
    title:'大角度摆：非线性运动',eyebrow:'03 / 原题应用 · 摆钟',
    question:'摆长 0.5 m，初始角度 3 rad，静止释放；大角度摆动还符合小角度近似吗？',
    description:'刚性细杆摆随非线性方程摆动，并比较小角度公式和机械能。',
    idea:'初始角度接近倒立时必须保留 sinθ，不能简单用 θ 代替。',
    provenance:'Pagonis 例 6.2，Chapter 6 单元 3–4：L=0.5 m、g=9.8 m/s²、θ(0)=3 rad、角速度 0、t=0–10 s；例 8.7 的 Hamilton 方程为同一理想摆，参数 L=1 m、m=1 kg、θ(0)=3 rad、t=0–20 s。源代码未注明单位，这里假设 SI；采用刚性无质量杆而非只能受拉的绳，避免大角度从静止释放时绳索松弛；忽略阻尼。',
    sources:[B('Chapter6/Python_Codes_Chapter_6.ipynb',[3,4],'例 6.2 非线性摆'),B('Chapter8/Python_Codes_Chapter_8.ipynb',[7,8],'例 8.7 同一摆的 Hamilton 表述')],
    params:[P('L','摆长 L',.5,.3,1,.1,'m'),P('theta','初始角度',3*180/Math.PI,10,175,'any','°')],
    presets:[{id:'pagonis-6-2',label:'Pagonis 6.2 · 0.5 m / 10 s',values:{L:.5,theta:3*180/Math.PI}},{id:'pagonis-8-7',label:'Pagonis 8.7 · 1 m / 20 s',values:{L:1,theta:3*180/Math.PI}}],
    steps:[
      S('按源条件释放','\\theta(0)=\\theta_0,\\quad \\dot\\theta(0)=0','原题 θ₀=3 rad，接近 172°，不是小幅摆动。',['pendulum','ball']),
      S('保留非线性重力矩','\\ddot\\theta=-\\frac{g}{L}\\sin\\theta','刚性细杆可受压和受拉；本例不是松弛的软绳。',['weight','pendulum']),
      S('比较小角度近似','\\theta_{\\rm small}=\\theta_0\\cos(\\sqrt{g/L}\\,t)','近似曲线只作为对照；真实摆球遵循非线性数值解。',['angular','ball']),
      S('检查机械能','E=\\tfrac12mL^2\\dot\\theta^2+mgL(1-\\cos\\theta)','质量取 1 kg 以显示能量；固定步长 RK4 解与时间轴同步。',['energy','pendulum'])
    ]
  },
  {
    id:'coupled-spring-carts',section:'dynamics',kind:'coupled-springs',insertAfter:'large-angle-pendulum',
    title:'两辆小车与三根耦合弹簧',eyebrow:'03 / 原题应用 · 振动系统',
    question:'两个质量分别为 1 kg 和 2 kg 的滑块由三根弹簧连接，第二块初始位移 1 m，怎样相互带动？',
    description:'轨道、滑块、三根动态弹簧及同步位移读数，展示振动能量交换。',
    idea:'中间弹簧的伸长量是两块的位移差，不是某一个滑块的位移。',
    provenance:'Pagonis 例 12.1，Chapter 12 单元 1–2：k₁=4、k₂=2、k₃=3 N/m，m₁=1、m₂=2 kg，x₁(0)=0、x₂(0)=1 m、初速均为零，积分到 20 s。Notebook 未注明单位，这里假设 SI；只给出微分方程与曲线，滑轨和小车外观是示意，忽略阻尼与摩擦。',
    sources:[B('Chapter12/Python_Codes_Chapter_12.ipynb',[1,2],'例 12.1 的参数、初始条件和耦合方程')],
    params:[P('m2','右侧质量 m₂',2,1,3,.5,'kg'),P('k2','中间弹簧 k₂',2,1,4,.5,'N/m'),P('x2','右侧初位移',1,.4,1.2,.1,'m')],
    steps:[
      S('给右侧小车初始位移','x_1(0)=0,\\quad x_2(0)=x_{2,0},\\quad v_1(0)=v_2(0)=0','原题 x₂(0)=1；两端固定，x₁、x₂ 是相对平衡位置的位移。',['blockA','blockB']),
      S('列出左车方程','m_1\\ddot x_1=-k_1x_1+k_2(x_2-x_1)','中间弹簧根据两车相对位移推拉。',['spring1','spring2']),
      S('列出右车方程','m_2\\ddot x_2=-k_3x_2-k_2(x_2-x_1)','原题 k₁=4、k₂=2、k₃=3 N/m。',['spring2','spring3']),
      S('观察两车能量交换','E=\\tfrac12m_1v_1^2+\\tfrac12m_2v_2^2+U_{\\rm springs}','使用固定步长 RK4，读数与车、弹簧长度同步。',['energy','blockB'])
    ]
  },
  {
    id:'earth-mercury-orbits',section:'dynamics',kind:'planet-orbits',insertAfter:'falling-rod',
    title:'地球与水星绕太阳运行',eyebrow:'03 / 原题应用 · 行星轨道',
    question:'利用近日点、远日点数据，地球与水星的椭圆轨道和公转周期有何不同？',
    description:'两个行星在同一比例轨道上运动；离太阳近时更快，水星在一年内绕行多次。',
    idea:'近日点和远日点确定半长轴、偏心率；开普勒方程决定随时间的位置。',
    provenance:'Pagonis 例 9.4，Chapter 9 单元 5–6：地球近日/远日 147.5、152.6×10⁹ m；水星 46、70×10⁹ m。源码仅绘制轨道形状；演示增加太阳引力参数 μ=1.3271244×10²⁰ m³/s² 和开普勒时间演化，假定共面、无摄动。天体半径大幅放大；初始均在各自近日点仅为示意。',
    sources:[B('Chapter9/Python_Codes_Chapter_9.ipynb',[5,6],'例 9.4 的近日点/远日点与轨道形状')],
    params:[P('eEarth','地球偏心率',5.1/300.1,.005,.05,'any'),P('eMercury','水星偏心率',24/116,.05,.35,'any')],
    steps:[
      S('从近日与远日距离求轨道','a=(r_{\\min}+r_{\\max})/2,\\quad e=(r_{\\max}-r_{\\min})/(r_{\\max}+r_{\\min})','默认按源近远日点确定轨道；调整偏心率后距离相应改变。',['earth','mercury']),
      S('太阳位于椭圆焦点','r=\\frac{a(1-e^2)}{1+e\\cos\\nu}','太阳不在椭圆几何中心；天体外观与半径为示意。',['sun','path']),
      S('引入真实的时间演化','E-e\\sin E=\\sqrt{\\mu/a^3}\\,t','源码未计算动画，采用补充的太阳 μ 并解开普勒方程。',['earth','velocity']),
      S('比较两颗行星周期','T=2\\pi\\sqrt{a^3/\\mu}','水星轨道更小，公转更快；时轴单位为天。',['mercury','path'])
    ]
  },
  {
    id:'earth-moon-orbit',section:'dynamics',kind:'moon-orbit',insertAfter:'earth-mercury-orbits',
    title:'月球近地点、远地点与周期',eyebrow:'03 / 原题应用 · 地月系统',
    question:'月球近地点 363300 km、远地点 405500 km；偏心率和公转周期是多少？',
    description:'地球位于焦点，月球按开普勒方程公转；实时显示距离、速度和经过的天数。',
    idea:'近远地点确定轨道形状，两体引力参数确定周期和速度。',
    provenance:'Pagonis 例 9.5，Chapter 9 单元 7–8：近地点 0.3633×10⁹ m，远地点 0.4055×10⁹ m，地球质量 5.9724×10²⁴ kg、月球质量 0.07346×10²⁴ kg、G=6.673×10⁻¹¹。源码计算 e 与周期并画静态椭圆；动态位置通过开普勒方程补充。显示的是地月相对轨道，忽略太阳摄动；地月半径为视觉放大。',
    sources:[B('Chapter9/Python_Codes_Chapter_9.ipynb',[7,8],'例 9.5 地月距离、两体质量与周期')],
    params:[P('rp','近地点',363.3,350,380,.1,'千 km'),P('ra','远地点',405.5,390,420,.1,'千 km')],
    steps:[
      S('确定近地点与远地点','r_p<r_a,\\quad r(0)=r_p','原题 rₚ=363300 km、rₐ=405500 km；地月中心距随位置变化。',['earth','moon']),
      S('求轨道形状','a=\\frac{r_p+r_a}{2},\\quad e=\\frac{r_a-r_p}{r_a+r_p}','默认 a=384400 km，e≈0.0549。',['path','earth']),
      S('按两体引力求周期','T=2\\pi\\sqrt{\\frac{a^3}{G(M_E+M_M)}}','默认约 27.29 天；源代码也使用地月质量之和。',['moon','velocity']),
      S('用开普勒方程演化','E-e\\sin E=2\\pi t/T,\\quad r=a(1-e\\cos E)','近地点速度最大、远地点速度最小；时轴单位为天。',['moon','path'])
    ]
  }
];
APPLICATION_LESSONS.push(...DEEP_APPLICATION_LESSONS);
