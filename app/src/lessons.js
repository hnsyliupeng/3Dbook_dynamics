// The examples below point to actual cells in the pinned upstream notebooks.
// Symbolic source examples use explicitly identified illustrative numerical controls.
const S = (title, formula, detail, tags) => ({ title, formula, detail, tags });
const P = (key, label, value, min, max, step, unit = '') => ({ key, label, value, min, max, step, unit });
const src = (file, cells, note = '') => ({ file, cells, note });

export const SECTIONS = [
  { id: 'vectors', number: '01', name: '矢量', en: 'VECTORS' },
  { id: 'statics', number: '02', name: '静力学', en: 'STATICS' },
  { id: 'dynamics', number: '03', name: '动力学', en: 'DYNAMICS' },
  { id: 'mass', number: '04', name: '质心与惯量', en: 'MASS & INERTIA' },
];

export const LESSONS = [
  {
    id:'vector-resultant', section:'vectors', kind:'vector', title:'三维矢量的合成', eyebrow:'01 / 矢量基础',
    question:'把几个空间矢量首尾相接，合矢量会指向哪里？',
    description:'把分量运算变成看得见的空间路径。切换同类型原题，观察矢量首尾相接与合矢量。',
    idea:'合矢量只取决于起点与终点，与矢量的排列顺序无关。',
    provenance:'01B1 单元 3–5、29–30 与 01B2 单元 2–16 的同类矢量合成题；每组选项使用源代码分量。修改滑块后不再是原始数值，场景统一按比例缩放。',
    sources:[src('01B1 Vectors Example.ipynb',[2,3,4,5,28,29,30],'两组同类原题'),src('01B2 Vectors Examples.ipynb',[2,3,4,7,8,9,12,13,14,15,16],'三组同类原题；按首尾相接统一演示')],
    params:[P('ax','A 的 x 分量',1,-30,30,'any'),P('ay','A 的 y 分量',2,-30,30,'any'),P('az','A 的 z 分量',2,-30,30,'any')],
    presets:[
      {id:'abc',label:'01B1 · 三维合矢量（模长 6）',values:{ax:1,ay:2,az:2},others:[[1,1,0],[2,1,0]]},
      {id:'five',label:'01B1 · 五个矢量（合矢量 2j）',values:{ax:0,ay:-2,az:0},others:[[2,2,2],[-2,2,0],[-2,0,0],[2,0,-2]]},
      {id:'four',label:'01B2 · 四个矢量（合矢量 3i）',values:{ax:1,ay:1,az:0},others:[[2,1,0],[-1,-1,0],[1,-1,0]]},
      {id:'symmetric',label:'01B2 · 对称矢量（合矢量 72i）',values:{ax:24,ay:10,az:0},others:[[24,0,0],[24,-10,0]]},
      {id:'triangle',label:'01B2 · 三角形（模长 2√7）',values:{ax:1,ay:Math.sqrt(3),az:0},others:[[2,Math.sqrt(3),0],[-2,Math.sqrt(3),0]]}
    ],
    steps:[
      S('先画第一个矢量','\\vec{A}=(A_x,A_y,A_z)','从原点沿三个坐标方向确定矢量 A。',['A']),
      S('把第二个矢量接在末端','\\vec{R}_2=\\vec{A}+\\vec{B}','平移不改变矢量的大小和方向；B 的起点接在 A 的终点。',['A','B']),
      S('继续首尾相接','\\vec{R}=\\sum_i\\vec{v}_i','第三段及其余矢量依次接上；每个坐标分量分别相加。',['C']),
      S('连接起点和终点','|\\vec{R}|=\\sqrt{R_x^2+R_y^2+R_z^2}','从起点指向终点的箭头就是合矢量；再由三个分量求模。',['R'])
    ]
  },
  {
    id:'vector-direction',section:'vectors',kind:'direction',title:'方向与大小确定矢量',eyebrow:'01 / 矢量基础',
    question:'知道方向和模长，怎样确定空间矢量的三个分量？',
    description:'从长方体对角线提取方向，单位化后再按指定模长缩放。',
    idea:'方向由单位矢量表示；乘以模长就得到所需矢量。',
    provenance:'01B1 单元 33–35：方向 (−4, −2, 2)，起点 (4, 2, 0)，给定模长 √6；源输出 P = (−2, −1, 1)。滑块改变模长时方向不变。',
    sources:[src('01B1 Vectors Example.ipynb',[33,34,35])],
    params:[P('magnitude','矢量模长',Math.sqrt(6),.5,4.5,'any')],
    steps:[
      S('从两点确定方向','\\vec d=\\vec B-\\vec A=(-4,-2,2)','起点 A = (4, 2, 0)，终点 B = (0, 0, 2)。',['pointA','pointB','direction']),
      S('将方向单位化','\\hat d=\\frac{\\vec d}{|\\vec d|}=\\frac{(-2,-1,1)}{\\sqrt6}','单位矢量的长度为 1，只负责表示方向。',['direction','unit']),
      S('乘以指定模长','\\vec P=M\\hat d','方向保持不变，模长由参数 M 决定。',['unit','result']),
      S('得到三个分量','\\vec P=\\frac{M}{\\sqrt6}(-2,-1,1)','默认 M = √6，与原题输出 (−2, −1, 1) 一致。',['result','pointA'])
    ]
  },
  {
    id:'two-load-beam',section:'statics',kind:'beam',title:'双载荷梁的支座反力',eyebrow:'02 / 静力平衡',
    question:'两块重物放在梁上，两端各承担多少？',
    description:'两个集中载荷、一个铰支座和一个滚动支座：用力与力矩平衡解出反力。',
    idea:'力矩平衡决定荷载如何在两个支座之间分配。',
    provenance:'03C2 单元 7–9 与 03B1 单元 38–41 使用相同的两载荷梁：3 kg、6 kg，g = 10 m/s²，位置分别为 b、2b，两端间距 3b。',
    sources:[src('03C2 Example Torque.ipynb',[6,7,8,9]),src('03B1 Static Rigig Body.ipynb',[37,38,39,40,41],'同一几何和载荷')],
    params:[P('m1','左侧质量',3,1,8,.5,'kg'),P('m2','右侧质量',6,1,10,.5,'kg'),P('b','等分间距 b',1,.5,2,.1,'m')],
    steps:[
      S('标出两处载荷','W_1=m_1g,\\quad W_2=m_2g','重力分别作用于距左端 b 和 2b 的位置。',['W1','W2']),
      S('建立竖直力平衡','R_A+R_B-W_1-W_2=0','梁保持静止，所有竖直力的代数和为零。',['RA','RB','W1','W2']),
      S('绕左支座取力矩','3bR_B-bW_1-2bW_2=0','左支座反力的力臂为零，方便直接求出右反力。',['moment','RB']),
      S('解出反力并验证','R_A=\\frac{2W_1+W_2}{3},\\quad R_B=\\frac{W_1+2W_2}{3}','将反力代回力与力矩方程，残差都应接近零。',['RA','RB'])
    ]
  },
  {
    id:'block-equilibrium',section:'statics',kind:'equilibrium',title:'斜拉绳与临界摩擦',eyebrow:'02 / 静力平衡',
    question:'悬挂的重物拉住木块，桌面至少需要多少摩擦？',
    description:'先隔离两个物体，再分解斜拉力；观察法向力和所需静摩擦系数如何变化。',
    idea:'斜向拉力减小法向力，也改变阻止滑动所需的摩擦系数。',
    provenance:'对应 03B1 单元 10–24 的符号题：轻绳、理想定滑轮、静止。源题未给数值；滑块初值仅为演示。',
    sources:[src('03B1 Static Rigig Body.ipynb',[10,12,13,15,16,17,18,19,20,21,22,23,24])],
    params:[P('m1','桌面物体质量',5,4,10,.5,'kg'),P('m2','悬挂物体质量',2,.5,3,.5,'kg'),P('angle','绳索仰角',25,10,45,1,'°')],
    steps:[
      S('先看悬挂物体','T=m_2g','悬挂物静止，向上的张力等于它的重力。',['tension','weight']),
      S('分解木块所受的拉力','T_x=T\\cos\\alpha,\\quad T_y=T\\sin\\alpha','把张力拆成水平分量和竖直分量。',['tension']),
      S('分别平衡竖直与水平方向','N=m_1g-T\\sin\\alpha,\\quad f_s=T\\cos\\alpha','向上的拉力分担了一部分重量，静摩擦抵消水平拉力。',['normal','friction','weight']),
      S('求临界静摩擦系数','\\mu_{\\min}=\\frac{T\\cos\\alpha}{m_1g-T\\sin\\alpha}','所需摩擦力等于极限静摩擦力时，得到防止滑动的最小系数。',['friction','normal'])
    ]
  },
  {
    id:'ladder-equilibrium',section:'statics',kind:'ladder',title:'靠墙梯子的平衡',eyebrow:'02 / 静力平衡',
    question:'梯脚为什么不会向右滑开？',
    description:'重力、墙面反力与地面摩擦形成平衡；以梯脚为转轴观察力矩。',
    idea:'以梯脚为支点取矩，就能看出墙反力与梯角的关系。',
    provenance:'03B6 单元 11–17：梯重 600 N，水平与竖直跨距为 4L、3L。墙面光滑，梯子均匀；角度滑块为同模型扩展。',
    sources:[src('03B6 Static Equilibrium.ipynb',[11,12,13,14,15,16,17])],
    params:[P('weight','梯子重力',600,300,900,50,'N'),P('angle','梯子与地面夹角',36.87,25,70,.01,'°')],
    steps:[
      S('辨认三个接触力','W,\\;N_{\\rm wall},\\;N_{\\rm floor},\\;f_s','重力通过梯子中点；光滑墙只提供水平反力。',['weight','wall','floor','friction']),
      S('水平与竖直力平衡','N_{\\rm floor}=W,\\quad f_s=N_{\\rm wall}','地面法向力抵消重力，摩擦力抵消墙的水平推力。',['floor','friction','wall']),
      S('以梯脚为转轴','N_{\\rm wall}L\\sin\\theta=\\frac{WL}{2}\\cos\\theta','力矩大小等于力乘以相应的垂直力臂。',['moment','weight','wall']),
      S('计算防滑条件','N_{\\rm wall}=\\frac{W}{2}\\cot\\theta,\\quad\\mu_{\\min}=\\frac12\\cot\\theta','原题几何为 3:4 时，墙反力和摩擦力均为 400 N。',['wall','friction'])
    ]
  },
  {
    id:'sphere-cylinder-equilibrium',section:'statics',kind:'sphere-cylinder',title:'球与圆柱的接触平衡',eyebrow:'02 / 静力平衡',
    question:'光滑球由水平绳拉住，在圆柱上平衡时绳张力是多少？',
    description:'从两个圆心和接触法线建立几何关系，再分解法向力与重力。',
    idea:'光滑圆面间的接触力沿两圆心连线，几何关系决定它的方向。',
    provenance:'04B1 单元 4–13：球半径 0.2 m、圆柱半径 0.3 m、球质量 1.8 kg、g = 10。按题图，水平绳与圆柱顶部相切且通过球心，故 sinα = R/(R+r)，T = 24 N；源代码误用 r/R，得到 9√5 N。',
    sources:[src('04B1 Rigid Boddy .ipynb',[4,5,6,7,8,9,10,11,12,13],'源代码几何角度与题图不符；此处按圆心距 R+r 求解')],
    params:[P('m','球的质量',1.8,.5,3,.1,'kg'),P('R','圆柱半径',.3,.2,.6,.05,'m'),P('r','球的半径',.2,.1,.3,.05,'m')],
    steps:[
      S('确定两个圆心','|OC|=R+r,\\quad y_C-y_O=R','水平绳与圆柱顶端相切并通过球心；圆心距为两半径之和。',['geometry','contact']),
      S('标出球的三个外力','\\vec N+\\vec T+m\\vec g=0','接触面光滑，法向力通过两圆心；张力水平向左。',['normal','tension','weight']),
      S('分解力的平衡','N\\sin\\alpha=mg,\\quad T=N\\cos\\alpha','竖直分量平衡重力，水平分量平衡绳张力。',['normal','tension']),
      S('由几何求出张力','T=mg\\frac{\\sqrt{r^2+2Rr}}{R}','原始尺寸给出 α = arcsin(3/5)，张力为 24 N。',['geometry','tension'])
    ]
  },
  {
    id:'car-chase',section:'dynamics',kind:'chase',title:'汽车追上卡车',eyebrow:'03 / 运动学',
    question:'静止起步的汽车，要多久才能再次追上匀速卡车？',
    description:'同一时刻观察两条运动曲线，用位置相等而不是速度相等寻找再次相遇。',
    idea:'相遇的条件是同一时刻的位置相同，而不是速度相同。',
    provenance:'02B1 单元 29–38：题面写 a = 1.5 m/s²，但代码实际使用 a = 3/5 m/s²，且输出 t = 50 s、x = 750 m。默认遵循代码和输出；可调到 1.5 对照题面。',
    sources:[src('02B1 Basic Examples .ipynb',[29,31,32,33,34,35,36,37,38])],
    params:[P('a','汽车加速度',.6,.3,2,.1,'m/s²'),P('v','卡车速度',15,5,25,1,'m/s')],
    steps:[
      S('同时从同一点出发','x_{\\rm car}(0)=x_{\\rm truck}(0)=0','汽车由静止起步，卡车从一开始保持匀速。',['car','truck']),
      S('写出各自的位置','x_{\\rm car}=\\frac12at^2,\\quad x_{\\rm truck}=vt','汽车的位移随时间平方增长，卡车的位移线性增长。',['car','truck']),
      S('令两者位置相同','\\frac12at^2=vt','这是用来预测相遇的条件，不表示当前帧已相遇；除去共同出发的 t = 0。',['meeting']),
      S('求再次相遇的时刻','t=\\frac{2v}{a},\\quad x=\\frac{2v^2}{a}','默认值按源代码得到 50 s、750 m。',['meeting','car','truck'])
    ]
  },
  {
    id:'train-through-tunnel',section:'dynamics',kind:'train',title:'列车通过隧道',eyebrow:'03 / 匀速运动',
    question:'列车经过站台上的人和穿过隧道，怎样求车长？',
    description:'以车头、车尾和隧道两端作为事件标记，观察完整通过的距离。',
    idea:'完全通过隧道时，车头走过的距离是隧道长加车身长。',
    provenance:'02B2 单元 2–7：列车经过人需 8 s，完全通过 160 m 隧道需 48 s，匀速。源输出 v = 4 m/s、车长 32 m。',
    sources:[src('02B2 Kinematic Rectilinear Move.ipynb',[2,3,4,5,6,7])],
    params:[P('pass','通过观察者时间',8,3,12,1,'s'),P('tunnelTime','通过隧道总时间',48,30,60,1,'s'),P('length','隧道长度',160,100,240,10,'m')],
    steps:[
      S('车头到达观察者','x_{\\rm head}(0)=0','把观察者放在隧道入口，车头进入隧道时开始计时。',['train','observer']),
      S('车尾经过观察者','L_{\\rm train}=v\\,t_p','经过一个固定点时，车头走过的距离等于车身长。',['train','observer']),
      S('车头穿越隧道','L_{\\rm tunnel}=v(t_T-t_p)','隧道口到出口的距离是隧道长度；此时车尾仍在隧道内。',['train','tunnel']),
      S('车尾离开隧道','v=\\frac{L_{\\rm tunnel}}{t_T-t_p},\\quad L_{\\rm train}=v t_p','默认原题：4 m/s 与 32 m。',['train','tunnel'])
    ]
  },
  {
    id:'ships-closest-approach',section:'dynamics',kind:'ships',title:'两船的最近距离',eyebrow:'03 / 相对运动',
    question:'两艘船沿不同方向匀速前进，什么时候距离最近？',
    description:'在海面上同步追踪两船，观察连接线长度变化；用相对速度确定最近时刻。',
    idea:'最近距离出现在相对位置与相对速度垂直的时刻。',
    provenance:'02B3 单元 14–26：A 在 B 西侧 20 km，A 以 40 km/h 向北，B 以 30 km/h 向北偏西 60°；源输出最近距离 50√13/13 km。动画单位为 km、h。',
    sources:[src('02B3 Kinematic Parabolic.ipynb',[14,16,17,18,19,20,21,22,23,24,25,26])],
    params:[P('d','初始东西间距',20,10,30,1,'km'),P('vA','A 船速度',40,20,60,2,'km/h'),P('vB','B 船速度',30,10,50,2,'km/h'),P('angle','B 船北偏西角',60,30,80,1,'°')],
    steps:[
      S('从初始位置出发','\\vec r_0=(d,0)','以向东和向北为坐标正方向；A 初始在西侧。',['shipA','shipB']),
      S('建立相对位置','\\vec r(t)=(d-v_B\\sin\\theta\\,t,\\,(v_B\\cos\\theta-v_A)t)','以 A 为参考观察 B；连线就是两船的相对位置。',['separation','velocity']),
      S('求最近时刻','\\vec r(t_*)\\cdot\\vec v_{\\rm rel}=0','距离平方的导数为零时，相对位置垂直于相对速度。',['closest','separation']),
      S('代回得到最短距离','d_{\\min}=\\frac{d|v_A-v_B\\cos\\theta|}{\\sqrt{(v_B\\sin\\theta)^2+(v_A-v_B\\cos\\theta)^2}}','默认原题结果为 50√13/13 km；继续前进后距离再次增大。',['closest','shipA','shipB'])
    ]
  },
  {
    id:'velocity-integration',section:'dynamics',kind:'variable-velocity',title:'变速运动与折返',eyebrow:'03 / 运动学',
    question:'速度先减小再变负，物体的位置会怎样变化？',
    description:'对非恒定速度积分，观察小车停止、折返和返回出发点的连续过程。',
    idea:'速度的符号决定运动方向，位移是速度对时间的积分。',
    provenance:'02C4 单元 18–30：v = 4 − 2t²、x(0) = 0，源代码给出 x = 4t − 2t³/3、a = −4t。演示以米和秒为单位，并允许调整系数。',
    sources:[src('02C4 Kinematic Diferential.ipynb',[18,19,20,21,22,23,24,25,26,27,28,29,30])],
    params:[P('v0','初始速度',4,2,8,.5,'m/s'),P('k','速度二次项系数',2,1,4,.25,'m/s³')],
    steps:[
      S('观察速度随时间变化','v(t)=v_0-kt^2','速度从正值逐渐减小，并最终变为负值。',['velocity']),
      S('积分得到位置','x(t)=v_0t-\\frac{k}{3}t^3','以出发点为 x = 0，速度曲线下面积就是位移。',['position','velocity']),
      S('寻找折返点','v(t_{\\rm turn})=0,\\quad t_{\\rm turn}=\\sqrt{v_0/k}','此时速度为零，物体改变运动方向。',['turn','velocity']),
      S('求瞬时加速度','a(t)=\\frac{dv}{dt}=-2kt','加速度连续变化，速度为负时小车向出发点返回。',['accel','position'])
    ]
  },
  {
    id:'accelerated-projectile',section:'dynamics',kind:'projectile',title:'有水平加速度的抛体',eyebrow:'03 / 运动学',
    question:'竖直上抛的同时受到水平加速度，轨迹会怎样？',
    description:'同时追踪位置、速度和加速度；与源 Notebook 的水平匀加速例题一致。',
    idea:'两个方向分别积分，同一个时间把它们连成轨迹。',
    provenance:'02B3 单元 4–8：x₀ = 0、y₀ = 50 m、vₓ₀ = 0、vᵧ₀ = 20 m/s、aₓ = 2 m/s²、g = 10 m/s²。源输出飞行时间 2 + √14 s。',
    sources:[src('02B3 Kinematic Parabolic.ipynb',[4,6,7,8])],
    params:[P('y0','初始高度',50,20,70,5,'m'),P('vy','初始竖直速度',20,5,30,1,'m/s'),P('ax','水平加速度',2,.5,4,.5,'m/s²')],
    steps:[
      S('从初始状态开始','x_0=0,\\ y_0,\\ v_{y0}','先确定高度与竖直初速度；这里初始水平速度为零。',['position','velocity']),
      S('两个方向分别积分','x=\\tfrac12a_xt^2,\\quad y=y_0+v_{y0}t-\\tfrac12gt^2','水平方向的加速度不为零，竖直方向只受重力。',['position','accel']),
      S('观察瞬时速度','v_x=a_xt,\\quad v_y=v_{y0}-gt','速度箭头随两个速度分量一起连续变化。',['velocity','path']),
      S('求落地时刻','t_{\\rm hit}=\\frac{v_{y0}+\\sqrt{v_{y0}^2+2gy_0}}{g}','取 y(t) = 0 的正根，轨迹只显示至第一次落地。',['path','position'])
    ]
  },
  {
    id:'projectile-over-barrier',section:'dynamics',kind:'barrier',title:'抛物线越过障碍物',eyebrow:'03 / 抛体运动',
    question:'抛体恰好经过障碍物顶部两端，初速度和角度是多少？',
    description:'从两端坐标反求抛射条件，再观察轨迹从障碍上方穿过。',
    idea:'两个同高点约束整条抛物线，顶点位于两点的正中间。',
    provenance:'02C2 单元 2–20：障碍顶点 A = (2L, 3L)、B = (3L, 3L)，源输出 tanα = 5/2、v₀ = √(29Lg)/2。L 的数值仅作演示，g 取 10 m/s²。',
    sources:[src('02C2 Kinematic Medium Example.ipynb',[2,3,4,5,8,9,12,14,16,17,18,19,20])],
    params:[P('L','长度单位 L',2,1,4,.25,'m')],
    steps:[
      S('读取障碍物的两端','A=(2L,3L),\\quad B=(3L,3L)','把发射点设为原点；两端高度相同。',['pointA','pointB','obstacle']),
      S('写出抛物线方程','y=x\\tan\\alpha-\\frac{gx^2}{2v_0^2\\cos^2\\alpha}','消去时间，再分别代入 A 和 B 的坐标。',['path','velocity']),
      S('轨迹通过两端','y(2L)=y(3L)=3L','两点之间的轨迹高于障碍物顶部；小球视为质点。',['pointA','pointB','path']),
      S('得到发射条件','\\tan\\alpha=\\frac52,\\quad v_0=\\frac{\\sqrt{29Lg}}2','原题只指定几何比例，L 滑块用于观察同类尺寸。',['velocity','path'])
    ]
  },
  {
    id:'projectile-wall-bounce',section:'dynamics',kind:'wall-bounce',title:'抛体与墙面的弹性反射',eyebrow:'03 / 运动学与碰撞',
    question:'小球撞上光滑墙后，落点会在哪里？',
    description:'先沿抛物线飞向墙面，在碰撞瞬间反转水平速度，再追踪落地。',
    idea:'理想光滑墙的弹性碰撞只反转法向速度，切向速度不变。',
    provenance:'02B3 单元 28–32：初速 7 m/s、向左上 60°、距墙 3 m、初高 1.5 m，g = 9.8 m/s²。源代码仅调用 xmax()，未实现墙面反射；这里按题面建模，墙后落点不使用该输出。',
    sources:[src('02B3 Kinematic Parabolic.ipynb',[28,30,31,32],'按图中弹性反射条件另行求解；源代码没有建模碰墙事件')],
    params:[P('v0','初始速率',7,6,9,.25,'m/s'),P('angle','向左上抛角',60,45,65,1,'°'),P('d','起点距墙',3,1,3,.1,'m'),P('h','起点高度',1.5,1,3,.1,'m')],
    steps:[
      S('分解初速度','v_{x0}=-v_0\\cos\\theta,\\quad v_{y0}=v_0\\sin\\theta','水平向左为负；竖直方向继续受到重力。',['velocity','position']),
      S('求撞墙时刻和高度','t_w=\\frac{d}{v_0\\cos\\theta},\\quad y_w=h+v_{y0}t_w-\\tfrac12gt_w^2','当前参数范围保证小球先撞墙、后落地。',['wallSurface','impact','path']),
      S('碰墙瞬间反转水平速度','v_x^+=-v_x^-,\\quad v_y^+=v_y^-','理想弹性反射保留速率；位置和竖直速度连续。',['wallSurface','velocity','impact']),
      S('求地面落点','x_{\\rm land}=v_0\\cos\\theta\\,(t_{\\rm land}-t_w)','落地时 y = 0；距离从墙面向右测量。',['path','position'])
    ]
  },
  {
    id:'friction-block',section:'dynamics',kind:'friction',title:'推力、摩擦与加速度',eyebrow:'03 / 牛顿第二定律',
    question:'推力增大后，木块什么时候开始运动？',
    description:'在同一个受力模型中观察静止与滑动，并同步显示合力、速度和位移。',
    idea:'先判断能否克服静摩擦，再用合力计算加速度。',
    provenance:'05A1 Dynamics Basic 单元 19–32：水平推力、重力、法向力与摩擦；源例为符号模型。滑块数值为演示设定，扩展了起动阈值。',
    sources:[src('05A1 Dynamics Basic.ipynb',[19,21,22,25,26,28,29,31,32]),src('05A2 Dynamics Forze by Acceleration.ipynb',[18,19,20,21,22,23],'同类水平受力')],
    params:[P('m','木块质量',5,2,10,.5,'kg'),P('F','水平推力',30,0,80,1,'N'),P('mu','摩擦系数',.2,0,.6,.02)],
    steps:[
      S('画出全部外力','N=mg','竖直方向没有加速度，因此法向力等于重力。',['weight','normal']),
      S('判断摩擦是否足够','f_s\\leq\\mu mg','这里用同一个系数表示最大静摩擦与动摩擦；低于阈值时木块静止。',['force','friction']),
      S('列水平运动方程','ma=F-f','滑动时 f = μmg；若尚未滑动，f = F，合力为零。',['force','friction','accel']),
      S('积分观察运动','v=at,\\quad x=\\tfrac12at^2','从静止开始，位移与速度由同一个加速度积分得到。',['accel','force'])
    ]
  },
  {
    id:'inclined-friction',section:'dynamics',kind:'incline',title:'斜面上的摩擦与运动',eyebrow:'03 / 受力与摩擦',
    question:'增大坡角，木块什么时候会开始下滑？',
    description:'把重力分解为平行与垂直斜面的分量，比较静摩擦极限与下滑趋势。',
    idea:'当沿坡重力超过最大静摩擦力，木块才会从静止开始滑动。',
    provenance:'04B3 单元 4–17：斜面上的重力、法向力和摩擦力，源题为符号模型。演示使用 μ静 = μ动 的简化，并补充静止判定；初值为示意。',
    sources:[src('04B3 Rigid Boddy Friction.ipynb',[4,5,6,7,8,9,10,11,12,13,14,15,16,17])],
    params:[P('m','木块质量',5,2,10,.5,'kg'),P('angle','斜面角度',30,10,50,1,'°'),P('mu','摩擦系数',.2,0,.6,.02)],
    steps:[
      S('分解重力','W_{\\parallel}=mg\\sin\\theta,\\quad W_{\\perp}=mg\\cos\\theta','沿坡分量使物体下滑，垂直分量由斜面支持。',['weight','normal']),
      S('确定法向力与摩擦','N=mg\\cos\\theta,\\quad f_s\\leq\\mu N','比较所需静摩擦力与摩擦极限；这里假设静、动摩擦系数相同。',['normal','friction']),
      S('判断是否下滑','a=\\max(0,\\,g(\\sin\\theta-\\mu\\cos\\theta))','沿坡重力不足时静止；滑动时由合力决定加速度。',['friction','accel']),
      S('沿斜面积分运动','v=at,\\quad s=\\tfrac12at^2','从静止释放，位置与速度由同一个加速度驱动。',['accel','position'])
    ]
  },
  {
    id:'two-incline-pulley',section:'dynamics',kind:'two-incline',title:'双斜面与滑轮约束',eyebrow:'03 / 约束动力学',
    question:'质量比为 1∶4 的两块物体在相同斜面上如何运动？',
    description:'两块物体由轻绳连接，沿斜面等距运动；同时观察张力和摩擦力。',
    idea:'两侧摩擦系数相同且均在滑动时，求出的绳张力与摩擦系数无关。',
    provenance:'05A3 单元 25–41：两侧等角 α、质量 m 与 4m、相同摩擦系数 μ，源输出 T = 8mg sinα/5。滑块数值为演示设定；限制参数确保 B 下滑、A 上滑。',
    sources:[src('05A3 Dynamics Pulley.ipynb',[25,27,28,29,30,31,32,34,35,36,37,38,39,40,41],'同一根绳经固定滑轮转向；滑动摩擦假设')],
    params:[P('m','A 的质量（B 为 4m）',2,1,4,.5,'kg'),P('angle','两侧斜面角度',30,20,45,1,'°'),P('mu','动摩擦系数',.1,0,.2,.01)],
    steps:[
      S('分析两块物体受力','N_A=mg\\cos\\theta,\\quad N_B=4mg\\cos\\theta','B 较重，沿右侧下滑；摩擦力始终反向。',['blockA','blockB','normal','friction']),
      S('由绳长得到加速度约束','s_A=s_B,\\quad a_A=a_B','轻绳不可伸长，经过定滑轮只改变方向。',['constraint','blockA','blockB']),
      S('沿各自运动方向列式','T-mg\\sin\\theta-\\mu N_A=ma','对 B 有 4mg sinθ − T − μN_B = 4ma。',['tension','friction','accel']),
      S('联立两式求张力','T=\\frac85mg\\sin\\theta','此结论依赖两侧角度及动摩擦系数相同；动画数值继续反映摩擦对加速度的影响。',['tension','accel'])
    ]
  },
  {
    id:'movable-pulley',section:'dynamics',kind:'pulley',title:'定滑轮与动滑轮',eyebrow:'03 / 约束动力学',
    question:'一个动滑轮，为什么让悬挂物的位移变成两倍？',
    description:'完整画出两根绳、滑轮与两个物体，先用绳长约束再联立牛顿方程。',
    idea:'绳长不变使 B 的位移与加速度都是 A 的两倍。',
    provenance:'05A3 单元 2–13：无摩擦、滑轮与绳质量忽略，mA = mB，g = 10 m/s²。默认各取 1 kg（原题只给质量相等），得到 aA = 4、aB = 8 m/s²。',
    sources:[src('05A3 Dynamics Pulley.ipynb',[2,3,4,5,6,7,8,9,10,11,12,13])],
    params:[P('mA','桌面物体 A',1,.5,3,.5,'kg'),P('mB','悬挂物体 B',1,.5,3,.5,'kg')],
    steps:[
      S('标出两根绳的张力','T_{\\rm lower}=\\tfrac12T','动滑轮无质量，两段下方绳索各承担主绳张力的一半。',['tension','blockA','blockB']),
      S('观察绳长约束','s_B=2s_A,\\quad a_B=2a_A','主绳让动滑轮移动 sA；下方两段绳长变化使 B 移动 2sA。',['constraint','blockA','blockB']),
      S('分别写牛顿方程','T=m_Aa_A,\\quad m_Bg-\\tfrac12T=m_Ba_B','A 沿桌面向右，B 竖直向下，均以运动方向为正。',['tension','accel']),
      S('联立求解','a_A=\\frac{2m_Bg}{m_A+4m_B},\\quad a_B=2a_A','等质量且 g = 10 时，aA = 4 m/s²。',['accel','constraint'])
    ]
  },
  {
    id:'loaded-moving-pulley',section:'dynamics',kind:'loaded-pulley',title:'外力作用下的动滑轮',eyebrow:'03 / 约束动力学',
    question:'动滑轮上再施加向上的外力，两端物体如何加速？',
    description:'一根绳绕过动滑轮和定滑轮；观察 A、B 反向且位移成倍的运动。',
    idea:'先由绳长约束确定加速度方向，再对两个物体分别列牛顿方程。',
    provenance:'05A3 单元 16–23 的图示包含额外向上的外力 T。源代码将 B 的重力方向写成 −π（水平），并在同向坐标下误写 aB = 2aA，输出不能用于该图；本演示按图修正。数值为演示设定，g = 10 m/s²。',
    sources:[src('05A3 Dynamics Pulley.ipynb',[16,17,18,19,20,21,22,23],'源代码重力方向及约束符号有冲突；此处使用重新推导的物理模型')],
    params:[P('mA','A 的质量',4,2,8,.5,'kg'),P('mB','B 的质量',1,.5,3,.5,'kg'),P('F','向上外力',5,0,25,1,'N')],
    steps:[
      S('画出受力与外力','m_Ag,\\quad F,\\quad 2T','两段承重绳分别提供张力 T，外力 F 在动滑轮轴上向上。',['blockA','appliedForce','tension']),
      S('追踪不可伸长的绳','s_B=2s_A,\\quad a_B=2a_A','约定 A 向下和 B 向上为正；两物体方向相反。',['constraint','blockA','blockB']),
      S('分别列出牛顿方程','m_Ag-F-2T=m_Aa_A,\\quad T-m_Bg=m_Ba_B','若解得负加速度，实际运动方向与约定正方向相反。',['tension','accel','appliedForce']),
      S('求加速度和张力','a_A=\\frac{(m_A-2m_B)g-F}{m_A+4m_B},\\quad T=m_B(g+2a_A)','参数范围内绳张力保持非负；A、B 均从静止开始。',['accel','constraint','tension'])
    ]
  },
  {
    id:'slope-energy',section:'dynamics',kind:'energy',title:'斜坡下滑与摩擦制动',eyebrow:'03 / 功与能',
    question:'从斜坡滑下后，物体会在粗糙地面走多远？',
    description:'一个完整过程连接无摩擦斜面与粗糙水平面，观察势能、动能和耗散能。',
    idea:'坡顶的重力势能，最终全部由水平面的摩擦耗散。',
    provenance:'07B01 单元 14–29：斜面无摩擦、水平面动摩擦系数 μ，物体由高度 H 静止下滑并最终停止。源题为符号解；参数为演示设定。',
    sources:[src('07B01 Energy in mparticle class.ipynb',[14,15,17,18,19,20,21,23,24,25,26,27,28,29])],
    params:[P('h','释放高度',3,1,5,.5,'m'),P('mu','水平摩擦系数',.3,.15,.6,.05),P('angle','斜面角度',35,25,55,1,'°')],
    steps:[
      S('坡顶只有重力势能','E_0=mgh','以水平地面为零势能面，物体从静止开始。',['height','energy']),
      S('下滑时势能转为动能','mgh=\\tfrac12mv^2+mgy','斜面无摩擦，机械能保持不变。',['height','velocity','energy']),
      S('水平面上摩擦做负功','W_f=-\\mu mgx','到达水平面后，摩擦力与运动方向相反。',['friction','energy']),
      S('求最终停止距离','L=\\frac{h}{\\mu}','动能耗尽时摩擦做功的绝对值等于最初的势能。',['friction','energy'])
    ]
  },
  {
    id:'falling-rod',section:'dynamics',kind:'rod',title:'从水平释放的均匀杆',eyebrow:'03 / 转动动力学',
    question:'松开铰接的杆，它的角加速度会一直不变吗？',
    description:'从初始力矩出发，数值积分杆从水平转到竖直的过程；角加速度随角度变化。',
    idea:'重力的力臂随转角缩短，所以角加速度不是常量。',
    provenance:'05B1 单元 21–25：均匀杆从水平位置静止释放，绕无摩擦端点转动，I = ML²/3。源题求初始角加速度；动画延伸至首次竖直。',
    sources:[src('05B1 Dynamics Torque.ipynb',[21,22,23,24,25])],
    params:[P('m','杆的质量',2,1,6,.5,'kg'),P('L','杆的长度',2,1,4,.25,'m')],
    steps:[
      S('确定转轴与重力','\\tau=mg\\frac L2\\cos\\theta','重力作用于中点；转过 θ 后，力臂是 (L/2)cosθ。',['weight','torque']),
      S('写出端点转动惯量','I=\\frac13mL^2','均匀细杆绕固定端的转动惯量为 mL²/3。',['inertia']),
      S('得到角加速度','\\ddot\\theta=\\frac{3g}{2L}\\cos\\theta','源题初始时 θ = 0，因此 α₀ = 3g/(2L)。',['torque','angular']),
      S('随转角连续积分','\\tfrac12 I\\omega^2+mg\\tfrac L2(1-\\sin\\theta)=mg\\tfrac L2','以数值积分展示角度和角速度，直到杆首次到达竖直。',['angular','weight'])
    ]
  },
  {
    id:'five-mass-center',section:'mass',kind:'centroid',title:'五个质点的质心',eyebrow:'04 / 质量分布',
    question:'五个质量不同的点，整体的平衡点在哪里？',
    description:'按顺序加入五个质点，质心随着加权平均连续移动。',
    idea:'质心是位置的质量加权平均，不是几何位置的简单平均。',
    provenance:'06A01 单元 3–8：五个质点的质量与坐标取自源代码，输出质心 (2, 33/17)。改变第五个质量可观察加权效应。',
    sources:[src('06A01 Mass Center Preliminar.ipynb',[3,5,6,7,8])],
    params:[P('m5','第五个质点质量',5,1,10,.5,'kg')],
    steps:[
      S('在坐标上放置质点','(m_i,x_i,y_i)','每个圆盘的位置与质量来自原题，面积只是视觉编码。',['mass','position']),
      S('求总质量','M=\\sum_i m_i','逐步加入质点，累计总质量。',['mass']),
      S('求坐标的一阶矩','M_x=\\sum_i m_ix_i,\\quad M_y=\\sum_i m_iy_i','质量越大，对合成位置的影响越大。',['position','mass']),
      S('得到质心','(x_G,y_G)=\\left(\\frac{M_x}{M},\\frac{M_y}{M}\\right)','原始参数下，G = (2, 33/17)。',['center'])
    ]
  },
  {
    id:'cone-centroid',section:'mass',kind:'cone',title:'圆锥的切片与质心',eyebrow:'04 / 质量分布',
    question:'均匀实心圆锥的质心，为什么靠近底面？',
    description:'用一片正在向上扫过的圆盘，观察各高度的质量贡献和累计质心。',
    idea:'越靠近底部的圆盘越大，质量集中在底部，所以质心在 h/4。',
    provenance:'06C01 单元 5–25：均匀密度的实心圆锥，以底面为 z = 0，解析结果 zcm = h/4。尺寸与密度为演示设定。',
    sources:[src('06C01 Mass Center 3D.ipynb',[5,6,7,8,9,10,11,16,18,19,20,21,22,23,24,25])],
    params:[P('h','圆锥高度',4,2,6,.5,'m'),P('r','底面半径',2,1,3,.25,'m')],
    steps:[
      S('把圆锥切成薄圆盘','r(z)=R(1-z/h)','从底面向顶点移动薄片，半径线性缩小。',['slice']),
      S('计算薄片质量','dm=\\rho\\pi R^2(1-z/h)^2\\,dz','质量贡献随截面面积变化；此处演示密度取 1 kg/m³。',['slice','mass']),
      S('累加质量与一阶矩','M=\\int_0^h dm,\\quad Mz_G=\\int_0^h z\\,dm','扫过的圆盘不断累加，标记显示已扫部分的质心。',['mass','center']),
      S('得到整体质心','z_G=\\frac{h}{4}','积分到顶点后，质心位于距底面四分之一高度处。',['center'])
    ]
  },
  {
    id:'disk-inertia',section:'mass',kind:'disk',title:'圆盘的转动惯量',eyebrow:'04 / 质量分布',
    question:'为什么远离转轴的质量，对转动更重要？',
    description:'把均匀圆盘拆成同心圆环，从中心向外累加转动惯量。',
    idea:'每个质量元按到转轴距离的平方计入转动惯量。',
    provenance:'06D01 单元 9–11：从半径 0 到 R 积分圆环，得到均匀实心薄圆盘绕中心轴的 I = MR²/2。尺寸为演示设定。',
    sources:[src('06D01 Inerce Moment 2D .ipynb',[8,9,10,11]),src('06B02 Mass Center Inertia.ipynb',[16,17,18,19],'同类圆柱同轴惯量'),src('06D02 Inerce Moment2.ipynb',[8,9,10,11],'同类圆环积分'),src('06D03 Inerce Moment3.ipynb',[8,9,10,11],'同类圆环积分')],
    params:[P('m','圆盘质量',4,1,8,.5,'kg'),P('r','圆盘半径',2,1,3,.25,'m')],
    steps:[
      S('把圆盘分成同心圆环','dm=\\frac{M}{\\pi R^2}2\\pi r\\,dr','圆环越靠外，周长和质量也越大。',['ring','mass']),
      S('每个质量元贡献惯量','dI=r^2dm','距中心的距离要平方后，才乘上质量。',['ring','inertia']),
      S('从中心积分到边缘','I=\\int_0^Rr^2\\,dm','动态圆环表示积分上限，数值显示已累加的惯量。',['ring','inertia']),
      S('得到完整圆盘的结果','I=\\frac12MR^2','比较半径滑块：半径加倍，转动惯量变为四倍。',['inertia'])
    ]
  }
];

export const TAG_LABELS = {
 A:'矢量 A',B:'矢量 B',C:'后续矢量',R:'合矢量', W1:'载荷 W₁',W2:'载荷 W₂',RA:'支反力 R_A',RB:'支反力 R_B',moment:'力矩',
 weight:'重力',wall:'墙面反力',floor:'地面反力',friction:'摩擦力',tension:'绳张力',normal:'法向力',
 car:'汽车',truck:'卡车',meeting:'相遇位置',position:'位置',velocity:'速度',accel:'加速度',path:'轨迹',force:'推力',
 blockA:'物体 A',blockB:'物体 B',constraint:'绳长约束',height:'高度',energy:'能量',inertia:'转动惯量',torque:'力矩',angular:'角运动',
 mass:'质量',center:'质心',slice:'截面薄片',ring:'同心圆环',turn:'折返点',
 shipA:'A 船',shipB:'B 船',separation:'相对位置',closest:'最近距离',impact:'碰撞点',
 direction:'方向',unit:'单位矢量',result:'目标矢量',pointA:'点 A',pointB:'点 B',geometry:'几何关系',contact:'接触点',train:'列车',tunnel:'隧道',observer:'观察者',obstacle:'障碍物',wallSurface:'光滑墙面',appliedForce:'外力 F'
};
export const TAG_COLORS = {
 A:'#278f86',B:'#dc7763',C:'#dda940',R:'#305f83',W1:'#df7863',W2:'#cc6d5e',RA:'#258f86',RB:'#258f86',moment:'#d19c4c',
 weight:'#d97d60',wall:'#538ba8',floor:'#258f86',friction:'#d2a044',tension:'#8a80b0',normal:'#528ca7',
 car:'#278f86',truck:'#d77c64',meeting:'#d0a048',position:'#4d8ba5',velocity:'#248f86',accel:'#dc9d43',path:'#b9a066',force:'#d87a64',
 blockA:'#278f86',blockB:'#d77c64',constraint:'#ba9864',height:'#668fa5',energy:'#278f86',inertia:'#8a80b0',torque:'#d49d4d',angular:'#278f86',
 mass:'#d77c64',center:'#238e84',slice:'#d7a047',ring:'#d7a047',turn:'#d7a047',
 shipA:'#278f86',shipB:'#d77c64',separation:'#d7a047',closest:'#8a80b0',impact:'#d7a047',
 direction:'#d19c4c',unit:'#8a80b0',result:'#278f86',pointA:'#278f86',pointB:'#d77c64',geometry:'#668fa5',contact:'#d19c4c',train:'#d77c64',tunnel:'#668fa5',observer:'#d19c4c',obstacle:'#668fa5',wallSurface:'#668fa5',appliedForce:'#d87a64'
};
