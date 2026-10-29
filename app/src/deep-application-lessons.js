// Further source exercises. Values absent from source code are identified as
// teaching assumptions, not represented as given textbook conditions.
const S=(title,formula,detail,tags)=>({title,formula,detail,tags});
const P=(key,label,value,min,max,step,unit='')=>({key,label,value,min,max,step,unit});
const A=(file,cells,note='')=>({file,cells,note});
const B=(file,cells,note='')=>({repo:'pagonis',file,cells,note});
const T=String.raw;

export const DEEP_APPLICATION_LESSONS=[
  {
    id:'car-speed-ratio',section:'dynamics',kind:'car-ratio',insertAfter:'car-constant-acceleration',
    title:'汽车过 A、B：由速度比求出发距离',eyebrow:'03 / 原题应用 · 道路行驶',
    question:'汽车从静止出发，10 s 内经过相距 1000 m 的 A、B，B 点速度是 A 点的 3 倍；出发点距 A 多远？',
    description:'汽车从出发点依次驶过 A、B；道路标记、速度和两个事件由同一个运动模型驱动。',
    idea:'匀加速且初速为零时，速度比就是从出发起的时间比。',
    provenance:'第一来源 02B2 单元 17–28：AB=1000 m、用时 10 s、vB=3vA，源码得 tA=5 s、a=10 m/s²、出发点至 A=125 m。题目图片文字将从静止出发与“恒速”并列，互相矛盾；源码实际使用匀加速，这里按源码和速度比求解。汽车尺寸相对道路放大以便观看；滑块为同类问题的扩展。',
    sources:[A('02B2 Kinematic Rectilinear Move.ipynb',[17,18,19,20,21,22,23,24,25,26,27,28],'原题、图示及匀加速计算；原文“恒速”与条件冲突')],
    params:[P('distance','A—B 距离 D',1000,500,1500,50,'m'),P('interval','A—B 时间 Δt',10,6,14,1,'s'),P('ratio','B/A 速度比 r',3,2,4,.5)],
    steps:[
      S('从静止出发',T`x=\tfrac12at^2,\qquad v=at`,'采用源码的恒定加速度，并以出发点为位置和时间原点。',['car','start']),
      S('由速度比求 A 点时刻',T`t_A=\frac{\Delta t}{r-1},\qquad t_B=t_A+\Delta t`,'默认 r=3，因此出发后 5 s 经过 A。',['pointA','velocity']),
      S('用 A—B 距离确定加速度',T`D=\tfrac12a(t_B^2-t_A^2)`,'默认 a=10 m/s²；汽车在 A、B 之间仍持续加速。',['car','finish']),
      S('求出发点到 A 的距离',T`x_A=\frac{D}{r^2-1}`,'默认 1000/(3²−1)=125 m；动画到 B 即结束。',['pointA','finish'])
    ]
  },
  {
    id:'two-stones-building',section:'dynamics',kind:'two-stones',insertAfter:'two-projectiles-meet',
    title:'两层楼同时下落的石块',eyebrow:'03 / 原题应用 · 高楼落体',
    question:'上层石块向下初速 4 m/s，下层石块自由落下；两者相距由 7 m 首次变为 3 m 要多久？',
    description:'沿楼体观察两块石头同时下落及间距变化，在第一次达到目标间距时停止。',
    idea:'两块石头受到相同重力加速度，竖直相对加速度为零。',
    provenance:'第一来源 02B2 单元 39–44：两楼层相距 7 m，下面静止释放，上面以 4 m/s 向下抛，g=10 m/s²，首次相距 3 m 的答案为 1 s。原题没有给建筑距地高度，演示补充下层高度 50 m，保证参数范围内两石均未落地；球体半径和楼体外观为示意，不模拟碰撞。',
    sources:[A('02B2 Kinematic Rectilinear Move.ipynb',[39,41,42,43,44],'楼层间距、初速度及首次相距 3 m')],
    params:[P('gap','初始高度差',7,6,9,.5,'m'),P('speed','上方初始下抛速度',4,3,6,.5,'m/s')],
    steps:[
      S('同时释放两石',T`y_A(0)=H,\quad y_B(0)=H+d`,'题图 d=7 m；H=50 m 只是为可见的落体过程补充。',['ballA','ballB']),
      S('写出两者的高度',T`y_A=H-\tfrac12gt^2,\quad y_B=H+d-ut-\tfrac12gt^2`,'上方初速度向下为 u；两者同时受到 g。',['ballB','velocity']),
      S('消去共同的重力位移',T`y_B-y_A=d-ut`,'截至首次达到 3 m 前，上方石块始终高于下方石块。',['ballA','separation']),
      S('求第一次间距为 3 m 的时刻',T`t_*=(d-3\,\mathrm m)/u`,'默认 t*=(7−3)/4=1 s；演示在该事件结束。',['separation','ballB'])
    ]
  },
  {
    id:'free-wedge-slider',section:'dynamics',kind:'free-wedge',insertAfter:'guided-block-wedge',
    title:'滑块下滑与可移动楔块反冲',eyebrow:'03 / 原题应用 · 运动约束',
    question:'光滑小块沿可移动楔面下滑时，楔块会怎样反冲？两者加速度是多少？',
    description:'滑块沿斜面运动，楔块在水平地面上反向移动，保持法向接触。',
    idea:'系统无水平外力，水平动量守恒；相对斜面位移决定滑块高度。',
    provenance:'Pagonis 例 8.5，Chapter 8 单元 5–6 给出可动楔和滑块的拉格朗日量、两条方程及加速度符号解，未给数值或装置图。本演示假设 M=3 kg、m=1 kg、α=30°、g=9.8 m/s²、静止释放及 SI 单位；地面和接触面无摩擦，楔不转动，示意轨道到达末端前结束。',
    sources:[B('Chapter8/Python_Codes_Chapter_8.ipynb',[5,6],'例 8.5 的楔块—滑块拉格朗日方程；数值为新增假设')],
    params:[P('M','楔块质量 M',3,2,5,.5,'kg'),P('m','滑块质量 m',1,.5,2,.5,'kg'),P('angle','斜面角 α',30,20,45,5,'°')],
    steps:[
      S('选择楔块与滑块坐标',T`x_{\rm block}=X+s\cos\alpha,\quad y_{\rm block}=H-s\sin\alpha`,'s 从斜面高处向低处量取；X 为楔块水平位移。',['wedge','blockA']),
      S('利用水平动量守恒',T`(M+m)\dot X+m\dot s\cos\alpha=0`,'系统从静止开始且没有水平外力；楔块向左反冲。',['wedge','accel']),
      S('列出沿斜面的方程',T`\ddot s+\ddot X\cos\alpha=g\sin\alpha`,'小块与斜面始终接触，忽略摩擦和转动。',['normal','blockA']),
      S('求两个加速度',T`\ddot s=\frac{(M+m)g\sin\alpha}{M+m\sin^2\alpha},\quad \ddot X=-\frac{m\cos\alpha}{M+m}\ddot s`,'原题为符号解；读数随质量和角度重新求解。',['accel','energy'])
    ]
  },
  {
    id:'damped-spring-cart',section:'dynamics',kind:'damped-cart',insertAfter:'large-angle-pendulum',
    title:'弹簧与阻尼器：欠阻尼到过阻尼',eyebrow:'03 / 原题应用 · 减振装置',
    question:'同一弹簧小车采用不同阻尼器时，何时振荡、何时不再越过平衡点？',
    description:'滑轨、弹簧和伸缩阻尼器同步运动；可比较欠阻尼、临界阻尼与过阻尼。',
    idea:'阻尼系数与临界值 2√(mk) 的大小决定运动类型。',
    provenance:'Pagonis 例 6.3、6.4，Chapter 6 单元 5–8：m=k=1，分别求 b=1、b=3 和临界 b=2 的通解。源码未给初始条件，动画新增 x(0)=1 m、v(0)=0、SI 单位和无摩擦滑轨；阻尼器外形是示意。三个预设保留源方程，初始位移及其他阻尼值为扩展。',
    sources:[B('Chapter6/Python_Codes_Chapter_6.ipynb',[5,6,7,8],'例 6.3 通解与 6.4 欠、临界、过阻尼参数')],
    params:[P('b','阻尼系数 b',1,.5,3.5,.1,'N·s/m'),P('x0','初始位移',1,.6,1.4,.1,'m')],
    presets:[{id:'under',label:'6.4 · 欠阻尼 b=1',values:{b:1,x0:1}},{id:'critical',label:'6.4 · 临界阻尼 b=2',values:{b:2,x0:1}},{id:'over',label:'6.4 · 过阻尼 b=3',values:{b:3,x0:1}}],
    steps:[
      S('释放被拉开的滑块',T`m=1,\quad k=1,\quad x(0)=x_0,\quad \dot x(0)=0`,'源码的积分常数未指定；这里明确采用静止释放。',['blockA','spring1']),
      S('加入与速度反向的阻尼',T`m\ddot x+b\dot x+kx=0`,'阻尼器和弹簧都连接墙与小车；阻尼力与速度方向相反。',['damper','velocity']),
      S('比较临界阻尼',T`b_c=2\sqrt{mk},\quad \gamma=\frac{b}{2m}`,'默认 m=k=1；b 小于、等于、大于 2 时分别为欠、临界、过阻尼。',['damper','spring1']),
      S('观察机械能耗散',T`\frac{dE}{dt}=-b\dot x^2\le0,\quad E=\tfrac12m\dot x^2+\tfrac12kx^2`,'读数显示剩余机械能；没有额外驱动或反弹。',['energy','blockA'])
    ]
  },
  {
    id:'driven-spring-resonance',section:'dynamics',kind:'driven-cart',insertAfter:'damped-spring-cart',
    title:'周期驱动的减振小车与共振',eyebrow:'03 / 原题应用 · 激振装置',
    question:'弹簧小车受到周期外力时，驱动频率怎样改变稳定振幅？',
    description:'电磁激振器、弹簧和阻尼器作用在小车上，比较瞬态运动与稳态振幅。',
    idea:'受迫振动是衰减的瞬态和持续的稳态之和；共振峰受阻尼限制。',
    provenance:'Pagonis 例 6.5，Chapter 6 单元 9–10：m=k=1、b=0.2、F₀=5、ω=3、x(0)=2、v(0)=0、t=0–80 s；例 6.6 单元 11–12 使用 F₀=1、γ=0.1、ω₀=1，比较 0.1–2.9 的驱动频率。这里用解析解并以 SI 展示；电磁激振器外观、位移视图缩放为新增示意。',
    sources:[B('Chapter6/Python_Codes_Chapter_6.ipynb',[9,10,11,12],'例 6.5 的初值问题及例 6.6 的稳态频率响应')],
    params:[P('F','外力幅值 F₀',5,1,5,1,'N'),P('omega','驱动角频率',3,.1,3.2,.1,'rad/s'),P('x0','初始位移',2,.5,2,.5,'m')],
    presets:[{id:'pagonis-6-5',label:'6.5 · F₀=5，ω=3',values:{F:5,omega:3,x0:2}},{id:'pagonis-6-6',label:'6.6 · 扫频起点 ω=0.1',values:{F:1,omega:.1,x0:1}}],
    steps:[
      S('给滑块初始条件',T`x(0)=x_0,\qquad \dot x(0)=0`,'例 6.5 默认 x₀=2 m；80 秒物理时间压缩显示。',['blockA','spring1']),
      S('施加周期驱动力',T`m\ddot x+b\dot x+kx=F_0\cos(\omega t)`,'外力箭头随同一时间变化；激振器为示意。',['actuator','force']),
      S('计算稳态振幅',T`A(\omega)=\frac{F_0}{\sqrt{(k-m\omega^2)^2+(b\omega)^2}}`,'调节驱动频率可以观察共振附近振幅增大。',['spring1','damper']),
      S('区分瞬态与稳态',T`x(t)=x_{\rm transient}(t)+A\cos(\omega t-\delta)`,'读数包含当前位移与理论稳态振幅；装置运动范围随最大位移缩放。',['energy','blockA'])
    ]
  },
  {
    id:'crank-driven-pendulum',section:'dynamics',kind:'crank-pendulum',insertAfter:'driven-spring-resonance',
    title:'曲柄转动支点驱动摆杆',eyebrow:'03 / 原题应用 · 曲柄摆',
    question:'当摆的支点沿圆周转动时，摆角如何随时间变化？',
    description:'电机转动曲柄，偏心支点带动轻杆摆；支点和摆球遵循同一数值解。',
    idea:'转动支点的加速度持续向摆输入或取出能量，不能按自由摆守恒能量求解。',
    provenance:'Pagonis 例 8.3，Chapter 8 单元 1–2：R=0.2、ω=2.5、l=1、g=9.8、θ(0)=1 rad、θ̇(0)=0，积分 0–20。源码给拉格朗日量、摆角方程和曲线，没有设备造型或单位；本演示假设 SI、电机恒速、无阻尼和可受压的刚性轻杆。',
    sources:[B('Chapter8/Python_Codes_Chapter_8.ipynb',[1,2],'例 8.3 的移动支点、摆方程及初始数据')],
    params:[P('R','曲柄半径 R',.2,.1,.3,.05,'m'),P('omega','曲柄角速度',2.5,1.5,3,.25,'rad/s')],
    steps:[
      S('让支点沿圆周运动',T`x_p=R\cos\omega t,\qquad y_p=R\sin\omega t`,'恒速曲柄的偏心点是摆的支点。',['drive','pivot']),
      S('由支点定位摆球',T`x=x_p+l\sin\theta,\quad y=y_p-l\cos\theta`,'杆长 l=1 m 不变；采用刚性杆以避免软绳松弛。',['pivot','ball']),
      S('求摆角运动方程',T`\ddot\theta=\frac{R\omega^2}{l}\cos(\theta-\omega t)-\frac{g}{l}\sin\theta`,'与源代码的数值微分方程一致，使用固定步长 RK4。',['pendulum','drive']),
      S('观察电机对摆的驱动',T`\theta(0)=1\ {\rm rad},\quad \dot\theta(0)=0`,'支点做功使摆的机械能不守恒；读数给出当前角度和角速度。',['velocity','ball'])
    ]
  },
  {
    id:'equal-spring-normal-modes',section:'dynamics',kind:'equal-spring-modes',insertAfter:'coupled-spring-carts',
    title:'两车三等弹簧：同相、反相与叠加',eyebrow:'03 / 原题应用 · 正常模态',
    question:'质量相同的两辆滑车连接三根相同弹簧；同相和反相振动的频率是多少？',
    description:'用同一套滑轨与三根弹簧切换原题反相、混合初态及同相模态。',
    idea:'两车位移之和与之差分别对应两个互不耦合的正常坐标。',
    provenance:'Pagonis 例 12.2、12.3、12.5、12.6(a)，Chapter 12 单元 3–10：m=k=a=1 时，12.2 的程序实际初值为 (a,−a,0,0)，12.3 实际为 (0,a,0,0)，尽管代码注释写了不同初值；按实际初值与输出复现。例 12.5/12.6 给出频率与本征向量；同相预设及 SI 单位是扩展，滑轨装置为示意。',
    sources:[B('Chapter12/Python_Codes_Chapter_12.ipynb',[3,4,5,6,7,8,9,10],'例 12.2/12.3 的实际初值与 12.5/12.6(a) 的等质量模态')],
    params:[P('m','每车质量 m',1,.5,2,.5,'kg'),P('k','每根弹簧 k',1,.5,2,.5,'N/m'),P('amplitude','位移幅值 a',1,.5,1.2,.1,'m')],
    presets:[{id:'anti',label:'12.2 · 反相初态',values:{m:1,k:1,amplitude:1}},{id:'mixed',label:'12.3 · 右车初始位移',values:{m:1,k:1,amplitude:1}},{id:'in-phase',label:'同相模态 · 扩展',values:{m:1,k:1,amplitude:1}}],
    steps:[
      S('按预设设置初位移',T`\dot x_1(0)=\dot x_2(0)=0`,'12.2 从 (a,−a) 开始，12.3 从 (0,a) 开始；以程序初值为准。',['blockA','blockB']),
      S('引入两个正常坐标',T`q_+=x_1+x_2,\qquad q_-=x_1-x_2`,'q₊ 描述同相，q₋ 描述反相，三根弹簧均参与受力。',['spring1','spring2']),
      S('求两个正常频率',T`\omega_+=\sqrt{k/m},\qquad \omega_-=\sqrt{3k/m}`,'例 12.5、12.6(a) 的正频率与对应的同相、反相向量。',['normalMode','spring3']),
      S('比较模式叠加',T`x_1=\frac{q_++q_-}{2},\quad x_2=\frac{q_+-q_-}{2}`,'混合初态同时含两个频率；机械能保持不变。',['energy','blockB'])
    ]
  },
  {
    id:'binary-stars-barycenter',section:'dynamics',kind:'binary-stars',insertAfter:'earth-mercury-orbits',
    title:'双星绕共同质心的椭圆运动',eyebrow:'03 / 原题应用 · 两体轨道',
    question:'两个质量为 1 和 2 的天体相互吸引时，为什么两者都会绕共同质心运动？',
    description:'同时显示双星、两条质心轨道和连线；始终保持中心质点不动。',
    idea:'先求两体相对轨道，再按质量比分配共同质心两侧的位置。',
    provenance:'Pagonis 例 9.1，Chapter 9 单元 1–2：m₁=1、m₂=2，G=1，初始相对位置 (1,0)、相对速度 (0,1)，时间 0–6；源码数值积分并绘两体轨道。此处用等价的开普勒方程，量为归一化模型单位，不对应真实双星历元；星体半径仅为视觉示意。',
    sources:[B('Chapter9/Python_Codes_Chapter_9.ipynb',[1,2],'例 9.1 的初始条件及相对、质心轨道')],
    params:[P('m2','第二天体质量 m₂',2,1.5,3,.5),P('v0','初始相对切向速度',1,.8,1.4,.1)],
    steps:[
      S('设置相对运动初始条件',T`\mathbf r(0)=(1,0),\quad \dot{\mathbf r}(0)=(0,v_0)`,'使用源例的 G=1 和 m₁=1；默认 m₂=2、v₀=1。',['starA','starB']),
      S('求二体相对轨道',T`\ddot{\mathbf r}=-\frac{G(m_1+m_2)}{r^3}\mathbf r`,'限定参数均为椭圆轨道，初始点为远心点。',['path','separation']),
      S('由质量比分配质心位置',T`\mathbf r_1=-\frac{m_2}{m_1+m_2}\mathbf r,\quad \mathbf r_2=\frac{m_1}{m_1+m_2}\mathbf r`,'两星始终位于质心两侧，且连线穿过质心。',['barycenter','starA']),
      S('检查质心与轨道周期',T`m_1\mathbf r_1+m_2\mathbf r_2=0,\quad T=2\pi\sqrt{a^3/\mu}`,'采用开普勒时间演化；星体大小为示意。',['barycenter','starB'])
    ]
  },
  {
    id:'jupiter-moons-mass',section:'dynamics',kind:'jupiter-moons',insertAfter:'binary-stars-barycenter',
    title:'四颗木卫星与木星质量估计',eyebrow:'03 / 原题应用 · 天文观测',
    question:'从四颗木卫星的轨道半径与周期，能否估计木星的质量？',
    description:'四颗卫星绕木星运动，旁边的散点和拟合线展示周期平方与半长轴立方。',
    idea:'开普勒第三定律的斜率等于 4π²/(GM)，可从观测数据反求中心天体质量。',
    provenance:'Pagonis 例 9.7，Chapter 9 单元 9–10：四组 a=(4.21700,6.71034,10.70412,18.82709)×10⁸ m、T=(1.7691,3.5512,7.1546,16.689) d，G=6.67408×10⁻¹¹；源码对 T² 与 a³ 做带截距线性拟合，得到木星质量约 1.898585×10²⁷ kg。源码仅给数据和拟合；卫星名称按数据识别，圆形共面轨道、初相位及物体半径为演示假设。',
    sources:[B('Chapter9/Python_Codes_Chapter_9.ipynb',[9,10],'例 9.7 木卫星轨道数据、线性拟合与木星质量')],
    params:[P('radiusScale','半长轴统一倍率',1,.85,1.15,.05),P('periodScale','周期统一倍率',1,.85,1.15,.05)],
    steps:[
      S('读取四组卫星数据',T`(a_i,T_i),\qquad i=1,2,3,4`,'默认使用源代码的四组半长轴和公转周期。',['jupiter','io']),
      S('比较周期与轨道尺度',T`T_i^2\propto a_i^3`,'展示假设为圆轨道，四颗卫星按各自源周期前进。',['galilean','path']),
      S('对四组数据做直线拟合',T`T^2=\beta a^3+c`,'拟合包含截距 c，与源代码 polyfit(...,1) 一致。',['fit','galilean']),
      S('根据拟合斜率求质量',T`M_J=\frac{4\pi^2}{G\beta}`,'默认结果约 1.898585×10²⁷ kg；倍率滑块是额外的灵敏度练习。',['fit','jupiter'])
    ]
  },
  {
    id:'triangle-lamina-centroid',section:'mass',kind:'triangle-lamina',insertAfter:'cone-centroid',
    title:'三角薄板：均匀与变密度质心',eyebrow:'04 / 原题应用 · 薄板质心',
    question:'同一三角薄板，密度均匀和密度随高度增加时，质心分别在哪里？',
    description:'从底部逐层累积三角形薄条，比较均匀薄板和上方更密的薄板。',
    idea:'质心是质量加权平均；密度上方较大时，质心向高处移动。',
    provenance:'Pagonis 例 4.4、4.6，Chapter 4 单元 3–4、7–8：底边 y=0，高 h=a/√2，x 在 [y−h,h−y]；4.4 为常面密度，4.6 使用 a=1、σ=2y，得 xG=0、yG=0.353553。假设 a 用米、4.6 的 σ 用 kg/m²；4.4 的 σ=1 kg/m²、板厚与支架是新增示意。动画进度表示积分上限而非物理时间。',
    sources:[B('Chapter4/Python_Codes_Chapter_4.ipynb',[3,4,7,8],'同一三角区域的均匀与 σ=2y 面密度质心')],
    params:[P('a','源参数 a',1,.6,1.4,.1,'m')],
    presets:[{id:'graded',label:'4.6 · 密度 σ=2y',values:{a:1}},{id:'uniform',label:'4.4 · 常面密度',values:{a:1}}],
    steps:[
      S('确定三角形积分区域',T`h=a/\sqrt2,\quad 0\le y\le h,\quad y-h\le x\le h-y`,'关于竖直中心线对称，因此 xG=0。',['lamina','geometry']),
      S('选取水平薄条',T`dA=2(h-y)\,dy,\qquad dm=\sigma(y)\,dA`,'选择常密度或源码的 σ=2y；高处颜色反映密度分布。',['slice','density']),
      S('累加质量与一阶矩',T`M=\int dm,\qquad Q_y=\int y\,dm`,'扫描线表示积分上限，读数显示已累加的质量。',['slice','mass']),
      S('计算完整薄板的质心',T`y_G=\frac{\int_0^h y\sigma(y)2(h-y)\,dy}{\int_0^h\sigma(y)2(h-y)\,dy}`,'常密度时 yG=h/3；σ=2y 时 yG=h/2。',['center','lamina'])
    ]
  }
];
