import { APPLICATION_LESSONS } from './application-lessons.js';
// The examples below point to actual cells in the pinned upstream notebooks.
// Symbolic source examples use explicitly identified illustrative numerical controls.
const S = (title, formula, detail, tags) => ({ title, formula, detail, tags });
const P = (key, label, value, min, max, step, unit = '') => ({ key, label, value, min, max, step, unit });
const src = (file, cells, note = '') => ({ file, cells, note });
const srcP = (file, cells, note = '') => ({ repo:'pagonis', file, cells, note });

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
    provenance:'01B1 单元 3–5、23–25、29–30，01B2 单元 2–16 及 01A1 单元 3–4 的同类矢量合成；每组选项使用对应源题分量。修改滑块后不再是原始数值，场景统一按比例缩放。',
    sources:[src('01B1 Vectors Example.ipynb',[2,3,4,5,23,24,25,28,29,30],'三组同类原题'),src('01B2 Vectors Examples.ipynb',[2,3,4,7,8,9,12,13,14,15,16],'三组同类原题；按首尾相接统一演示'),src('01A1 Vectors Comprension.ipynb',[1,3,4],'二维绘图与加法练习')],
    params:[P('ax','A 的 x 分量',1,-30,30,'any'),P('ay','A 的 y 分量',2,-30,30,'any'),P('az','A 的 z 分量',2,-30,30,'any')],
    presets:[
      {id:'abc',label:'01B1 · 三维合矢量（模长 6）',values:{ax:1,ay:2,az:2},others:[[1,1,0],[2,1,0]]},
      {id:'five',label:'01B1 · 五个矢量（合矢量 2j）',values:{ax:0,ay:-2,az:0},others:[[2,2,2],[-2,2,0],[-2,0,0],[2,0,-2]]},
      {id:'four',label:'01B2 · 四个矢量（合矢量 3i）',values:{ax:1,ay:1,az:0},others:[[2,1,0],[-1,-1,0],[1,-1,0]]},
      {id:'symmetric',label:'01B2 · 对称矢量（合矢量 72i）',values:{ax:24,ay:10,az:0},others:[[24,0,0],[24,-10,0]]},
      {id:'triangle',label:'01B2 · 三角形（模长 2√7）',values:{ax:1,ay:Math.sqrt(3),az:0},others:[[2,Math.sqrt(3),0],[-2,Math.sqrt(3),0]]},
      {id:'plane',label:'01B1 · 平面合矢量（模长 5）',values:{ax:2,ay:3,az:0},others:[[1,1,0]]},
      {id:'practice',label:'01A1 · 加法练习（3, 3）',values:{ax:1,ay:4,az:0},others:[[2,-1,0]]},
      {id:'plot',label:'01A1 · 绘图示例（3, 3）',values:{ax:2,ay:1,az:0},others:[[1,2,0]]}
    ],
    steps:[
      S('先画第一个矢量','\\vec{A}=(A_x,A_y,A_z)','从原点沿三个坐标方向确定矢量 A。',['A']),
      S('把第二个矢量接在末端','\\vec{R}_2=\\vec{A}+\\vec{B}','平移不改变矢量的大小和方向；B 的起点接在 A 的终点。',['A','B']),
      S('完成分量求和','\\vec{R}=\\sum_i\\vec{v}_i','如有更多矢量则继续首尾相接；每个坐标分量分别相加。',['A','B']),
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
    id:'vector-magnitude-angle',section:'vectors',kind:'vector-metric',title:'矢量模长与夹角',eyebrow:'01 / 矢量运算',
    question:'三个分量如何决定矢量长度？又怎样求与另一个方向的夹角？',
    description:'在同一坐标系中观察长度、点积与夹角；切换模长练习和正交练习。',
    idea:'点积把分量计算与两矢量夹角联系起来。',
    provenance:'01A1 单元 4 的两个练习：u=(3,−4,1) 的模长及 v=(1,0)、w=(0,1) 的夹角；01A2 单元 4、12、14 的构造与点积说明；Pagonis 例 1.1 展示 (1,1,1) 与单位轴。为统一展示，取 B=(0,1,0) 为参照；B 不属于第一道模长练习。',
    sources:[src('01A1 Vectors Comprension.ipynb',[0,4],'模长、点积定义及两道练习'),src('01A2 Vector with Python.ipynb',[3,4,12,14],'分量构造与点积的说明'),srcP('Chapter1/Python_codes_Chapter_1.ipynb',[1,2],'例 1.1 的空间分量与单位轴')],
    params:[P('ax','A 的 x 分量',3,1,6,.5),P('ay','A 的 y 分量',-4,-4,4,.5),P('az','A 的 z 分量',1,0,3,.5)],
    presets:[
      {id:'magnitude',label:'01A1 · 模长练习 u=(3,−4,1)',values:{ax:3,ay:-4,az:1}},
      {id:'orthogonal',label:'01A1 · 正交夹角练习',values:{ax:1,ay:0,az:0}},
      {id:'components',label:'01A2 · 分量构造 (1,2,3)',values:{ax:1,ay:2,az:3}},
      {id:'pagonis-1-1',label:'Pagonis 1.1 · 空间矢量 (1,1,1)',values:{ax:1,ay:1,az:1}}
    ],
    steps:[
      S('从分量构造矢量','\\vec A=(A_x,A_y,A_z)','默认练习取 A=(3,−4,1)；三个方向使用同一尺度。',['A']),
      S('用勾股定理求模','|\\vec A|=\\sqrt{A_x^2+A_y^2+A_z^2}','原题的模长是 √26。参数范围保证 A 不为零。',['A']),
      S('与参照矢量求点积','\\vec A\\cdot\\vec B=A_y,\\qquad\\vec B=(0,1,0)','B 是单位参考方向；正交练习切换为 A=(1,0,0)。',['A','B']),
      S('由点积确定夹角','\\theta=\\arccos\\!\\left(\\frac{\\vec A\\cdot\\vec B}{|\\vec A||\\vec B|}\\right)','正交预设中点积为零，夹角为 90°。',['B','angleMarker'])
    ]
  },
  {
    id:'vector-dot-cross',section:'vectors',kind:'dot-cross',title:'点积、叉积与空间法向',eyebrow:'01 / 矢量运算',
    question:'两个空间矢量是否垂直？它们张成平面的法向指向哪里？',
    description:'同时观察两个矢量、张成的平行四边形与右手定则确定的法向。',
    idea:'点积刻画夹角，叉积的方向垂直于两个输入矢量、模长等于张成面积。',
    provenance:'Pagonis Chapter 3 例 3.6、3.8：A=(3,4,−1)、B=(1,−1,−1)，点积为 0，叉积为 (−5,2,−7)。Notebook 只给出向量代码；平面、箭头和调整 A 的参数是教学可视化。三个坐标轴构成右手系。',
    sources:[srcP('Chapter3/Python_Codes_Chapter_3.ipynb',[7,8,9,10],'例 3.6 点积、例 3.8 叉积；同一对向量')],
    params:[P('ax','A 的 x 分量',3,1,5,1),P('ay','A 的 y 分量',4,1,5,1),P('az','A 的 z 分量',-1,-2,1,1)],
    steps:[
      S('画出两个空间矢量','\\vec A=(A_x,A_y,A_z),\\quad\\vec B=(1,-1,-1)','两个矢量从同一原点出发；坐标轴为右手系。',['A','B']),
      S('点积判断夹角','\\vec A\\cdot\\vec B=A_x-A_y-A_z','默认原题为 0，因此两矢量垂直。',['dot','A','B']),
      S('叉积确定法向','\\vec A\\times\\vec B=(A_z-A_y,\\,A_x+A_z,\\,-A_x-A_y)','按 A 到 B 的顺序使用右手定则；交换顺序会反向。',['cross']),
      S('叉积模长是面积','|\\vec A\\times\\vec B|=|\\vec A||\\vec B|\\sin\\theta','平行四边形面积与法向量大小数值相同。',['area','cross'])
    ]
  },
  {
    id:'circle-chord-vector',section:'vectors',kind:'chord-vector',title:'圆内弦的分点矢量',eyebrow:'01 / 矢量几何',
    question:'弦被分成 2∶6 时，起点到分点的矢量怎样表示？',
    description:'圆、直径与弦按同一尺度绘制；移动分点，观察线性组合的系数。',
    idea:'线段上的点是两个端点的位置矢量的加权平均。',
    provenance:'01B1 单元 10–12：弦两段长度 2 与 6，O→A=a，O→B=b，求 O→P=x。源题只给相对位置；图中角度和圆直径为示意参数，默认分点比例保留原题。',
    sources:[src('01B1 Vectors Example.ipynb',[10,11,12],'根据图示与源方程建立分点关系')],
    params:[P('fraction','AP / AB',.25,.1,.9,.05),P('angle','OA 与直径夹角',60,35,75,5,'°')],
    steps:[
      S('辨认圆与弦','\\overrightarrow{OA}=\\vec a,\\quad\\overrightarrow{OB}=\\vec b','O 与 B 是直径端点；A 位于圆上，P 位于弦 AB 上。',['chord','A','B']),
      S('表示弦的方向','\\overrightarrow{AB}=\\vec b-\\vec a','从 A 到 B 的矢量是两个位置矢量之差。',['A','B','chord']),
      S('按比例走到分点','\\overrightarrow{AP}=\\lambda(\\vec b-\\vec a)','原题 AP:PB=2:6，所以 λ=AP/AB=1/4。',['division','chord']),
      S('得到分点位置矢量','\\vec x=(1-\\lambda)\\vec a+\\lambda\\vec b','原题为 x=(3a+b)/4；滑块可检验其他分点。',['result','division'])
    ]
  },
  {
    id:'quadrilateral-midpoint-vector',section:'vectors',kind:'quad-midpoint',title:'四边形中点与半段矢量',eyebrow:'01 / 矢量几何',
    question:'任意四边形中点连线的一半，能否只用上下两边表示？',
    description:'连接四边的中点，观察中点四边形、交点与两段相等的矢量。',
    idea:'中点相减使左右两边的形状消去，关系不要求原四边形是平行四边形。',
    provenance:'01B1 单元 14、16–20：四边形各边中点构成平行四边形，图中左中点至交点为 x，上边 b，底边 d 从右向左。由源码方程得 x=(b−d)/4。滑块为保留拓扑的示意形状。',
    sources:[src('01B1 Vectors Example.ipynb',[14,16,17,18,19,20],'以闭合多边形和中点方程化简')],
    params:[P('top','上边水平跨度',3,2.2,3.8,.2),P('base','底边跨度',4,3,4.8,.2),P('skew','顶部横向偏移',.3,-.6,.8,.1)],
    steps:[
      S('连接四边中点','P_i=\\frac{V_i+V_{i+1}}2','四条淡色线构成中点平行四边形，O 是其对角线交点。',['geometry','center']),
      S('取上下两条有向边','\\vec b=\\overrightarrow{MN},\\quad\\vec d=\\overrightarrow{PQ}','注意 d 从右向左，方向与上边不同。',['B','D']),
      S('用中点差表示整段','\\overrightarrow{P_4P_2}=\\frac{\\vec b-\\vec d}{2}','交点 O 将 P₄P₂ 平分；本关系不依赖其他边。',['geometry','center']),
      S('得到半段矢量','\\vec x=\\overrightarrow{P_4O}=\\frac{\\vec b-\\vec d}{4}','改变四边形形状，数值关系仍保持成立。',['result','center'])
    ]
  },
  {
    id:'triangle-centroid-vector',section:'vectors',kind:'triangle-centroid',title:'三角形重心与矢量定义',eyebrow:'01 / 矢量几何',
    question:'从底边中点指向重心的矢量，如何用两条边表示？',
    description:'显示三角形中线与重心，切换“B 为半边”和“B 为整边”两种定义。',
    idea:'同一个几何关系，必须先明确每个矢量的起点和终点。',
    provenance:'01B2 单元 19–25：原题图 B 的箭头从右顶点指到对边中点，辅助图把右边两半都标为 B，因此按图 x=(A+2B)/6、m+n=1/2。源代码输出 1/3，相当于 B 表示整条右边；提供第二预设明确对照。',
    sources:[src('01B2 Vectors Examples.ipynb',[19,20,21,22,23,24,25],'原题图的半边定义与源码隐含的整边定义不同')],
    params:[P('tip','顶点横向偏移',.5,-.8,.8,.1),P('height','三角形高度',3,2,4,.2)],
    presets:[{id:'half-side',label:'按题图：B 是半条右边',values:{tip:.5,height:3}},{id:'full-side',label:'按源码输出：B 是整条右边',values:{tip:.5,height:3}}],
    steps:[
      S('连接顶点与对边中点','G=\\frac{L+R+T}{3}','重心 G 位于中线上，距离底边中点 H 为整条中线的三分之一。',['geometry','center']),
      S('分辨 B 的两种定义','\\overrightarrow{RT}=\\lambda\\vec B','题图 B 指向右边中点时 λ=2；若 B 指整条边则 λ=1。',['A','B']),
      S('由边矢量表示中线','\\overrightarrow{HT}=\\frac{\\vec A+\\lambda\\vec B}{2}','A 从左下顶点指向顶点；两个预设的几何中线相同。',['A','B','geometry']),
      S('求重心段与系数之和','\\vec x=\\frac{\\vec A+\\lambda\\vec B}{6}','题图半边定义 m+n=1/2；源码整边定义 m+n=1/3。',['result','center'])
    ]
  },
  {
    id:'two-load-beam',section:'statics',kind:'beam',title:'悬臂梁的双载荷与支座反力',eyebrow:'02 / 静力平衡',
    question:'两块重物作用在有悬伸段的梁上，两处支座各承担多少？',
    description:'原图的 6 kg 载荷位于支座外侧；切换预设可对照源码把它放在跨内的位置。',
    idea:'载荷位置决定力矩；支座能否提供所需方向的反力也必须检查。',
    provenance:'03C2 单元 6–9、03B1 单元 35–41：两份题图均为 A=0、3 kg 在 b、B=3b、6 kg 在梁端 4b；源码却将 6 kg 写在 2b。默认按题图得 R_A=0、R_B=90 N；源码位置预设得 40 N 和 50 N。仅考虑无自重刚性梁、竖直单向支承；若计算反力为负，则无附加约束时不能保持接触。',
    sources:[src('03C2 Example Torque.ipynb',[6,7,8,9],'图中 6 kg 在 4b，代码力的位置为 2b'),src('03B1 Static Rigig Body.ipynb',[35,37,38,39,40,41],'同一题图和相同代码位置差异')],
    params:[P('m1','左侧质量',3,1,8,.5,'kg'),P('m2','右侧质量',6,1,10,.5,'kg'),P('b','等分间距 b',1,.5,2,.1,'m')],
    presets:[{id:'image',label:'按题图：6 kg 位于 4b 梁端',values:{m1:3,m2:6,b:1}},{id:'code',label:'按源码：6 kg 位于 2b 跨内',values:{m1:3,m2:6,b:1}}],
    steps:[
      S('标出两处载荷','W_1=m_1g,\\quad W_2=m_2g','第一处在 b；第二处在题图的 4b，或源码预设的 2b。',['W1','W2']),
      S('建立竖直力平衡','R_A+R_B=W_1+W_2','梁保持静止时，竖直力的代数和为零。',['RA','RB','W1','W2']),
      S('绕左支座取力矩','3bR_B=bW_1+k bW_2','题图 k=4；源码 k=2。左支座反力的力臂为零。',['moment','RB']),
      S('计算反力并检查接触','R_B=\\frac{W_1+kW_2}{3},\\quad R_A=W_1+W_2-R_B','反力为负时，单向支座不能拉住梁，需要额外约束才可维持静止。',['RA','RB'])
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
    id:'two-balls-circular-container',section:'statics',kind:'two-balls',title:'圆环内两球的静力平衡',eyebrow:'02 / 接触与平衡',
    question:'两球在圆形容器中互相接触，连心线的倾角由什么决定？',
    description:'按圆心夹角 120° 构造两球与圆环，分别平衡两球，再改变质量比较倾角。',
    idea:'外壁反力沿球心与圆环中心连线，球间作用力大小相等、方向相反。',
    provenance:'03B3 单元 2–28：两球、圆环中心夹角 120°，求倾角与质量关系。按图中相同半径、球与球及光滑壁同时接触建模；固定半径为示意。源码第一球壁反力角为 α+30°，第二球写成 α+120°，两法线只差 90°，与题图 120° 不符。本页按两法线相差 120° 重新平衡，等质量时 α=0°。',
    sources:[src('03B3 Static Rigid Balls.ipynb',[2,3,4,6,7,8,9,10,11,12,13,14,16,17,18,19,20,21,22,23,24,25,26,27,28],'第二球法线角按 120° 几何修正')],
    params:[P('m1','左球质量 m₁',1,.5,4,.5,'kg'),P('m2','右球质量 m₂',1,.5,4,.5,'kg')],
    steps:[
      S('建立圆心和接触几何','\\angle C_1OC_2=120^\\circ,\\quad |C_1C_2|=2r','两球半径相同，均与光滑圆环相切并互相接触。',['geometry','ball1','ball2']),
      S('分别画出受力','\\vec N_i+\\vec R_i+m_i\\vec g=0','壁反力沿半径指向圆心；球间接触力沿连心线，互为反作用力。',['normal','contact','weight']),
      S('沿连心线分解','R=m_1g(\\sqrt3\\cos\\alpha-\\sin\\alpha)','另一球给出 R=m₂g(√3 cosα+sinα)；两球接触力大小相等。',['contact','normal']),
      S('求平衡倾角','\\tan\\alpha=\\frac{\\sqrt3(m_1-m_2)}{m_1+m_2}','质量相等时连心线水平；质量不同后平衡位置随之改变。',['angleMarker','ball1','ball2'])
    ]
  },
  {
    id:'stacked-blocks-pulley',section:'statics',kind:'stacked-pulley',title:'叠块、动滑轮与临界摩擦',eyebrow:'02 / 静力平衡',
    question:'两块叠放的物体被动滑轮拉住，哪一处会先滑动？',
    description:'分别检查上、下块间与地面两处静摩擦极限，并保留理想滑轮的等张力约束。',
    idea:'临界条件取决于最先失效的接触面，而不是把两个摩擦力简单相加。',
    provenance:'03B2 单元 9–17：m=3.5 kg、M=6 kg、两接触面的 μs=0.5、g=10。源代码把两接触面的极限直接相加，得到 F=47.5 N；按题图叠块、理想轻绳动滑轮及作用反作用，层间会在 F=35 N 先达到极限。超过极限时本页只显示静止所需摩擦，不模拟滑动后的动力学。',
    sources:[src('03B2 Static Blocks and Tension.ipynb',[9,10,11,12,13,14,15,16,17],'考虑底块承受上块法向力和两段绳张力相等')],
    params:[P('m','上块质量 m',3.5,1,6,.5,'kg'),P('M','下块质量 M',6,2,10,.5,'kg'),P('mu','静摩擦系数',.5,.2,.8,.05),P('F','向右拉力 F',30,0,80,1,'N')],
    steps:[
      S('理想动滑轮的张力','F=2T','轻绳两段张力相等；轮无质量，因此每段 T=F/2。',['appliedForce','tension']),
      S('检查上块的水平平衡','f_{\\rm top}^{\\rm req}=T,\\quad f_{\\rm top}^{\\max}=\\mu_smg','上块受到向右的绳张力和向左的层间静摩擦。',['blockA','frictionTop','tension']),
      S('检查下块和地面','f_{\\rm ground}^{\\rm req}=2T,\\quad f_{\\rm ground}^{\\max}=\\mu_s(M+m)g','下块还受到上块反向施加的摩擦；地面法向力承受两块总重。',['blockB','frictionGround','frictionTop']),
      S('比较两处极限','F_{\\max}=\\mu_sg\\min(2m,M+m)','默认题图先由层间达到 35 N；超限时静止模型不再成立。',['frictionTop','frictionGround','appliedForce'])
    ]
  },
  {
    id:'car-constant-acceleration',section:'dynamics',kind:'straight-car',title:'汽车从 A 到 B：匀速与匀加速',eyebrow:'03 / 基础运动学',
    question:'已知初速度、加速度和路程，汽车经过终点需要多久？',
    description:'真实比例道路与汽车沿同一时间轴前进；切换原图、匀速及第二来源的积分例。',
    idea:'先用位移方程求到达时间，再由同一个时间计算终点速度。',
    provenance:'02B1 单元 20–27 图示 v₀=10 m/s、a=2 m/s²、AB=20 m；代码却输出 x=10t、v=10，未反映加速度，故按题图与运动方程修正。单元 13–17 为 10 m/s 匀速行驶 20 m。Pagonis 例 1.3、1.4 给出 v=v₀+at 及 v₀=1、a=9.8、积分至 3 s；其原代码未指定汽车，汽车是数值演示。',
    sources:[src('02B1 Basic Examples .ipynb',[13,14,15,16,17,20,21,22,23,24,25,26,27],'图示匀速、匀加速；单元 22–23 的输出忽略了题图加速度'),srcP('Chapter1/Python_codes_Chapter_1.ipynb',[5,6,7,8],'例 1.3、1.4 求速度；本演示进一步对速度积分，3 s 时位移 47.1 m')],
    params:[P('v0','初速度 v₀',10,.5,20,.5,'m/s'),P('a','加速度 a',2,0,10,.1,'m/s²'),P('distance','A—B 距离',20,15,60,.1,'m')],
    presets:[{id:'accelerating',label:'02B1 · 题图匀加速',values:{v0:10,a:2,distance:20}},{id:'constant',label:'02B1 · 匀速通过 20 m',values:{v0:10,a:0,distance:20}},{id:'pagonis',label:'Pagonis 1.4 · 积分至 3 s',values:{v0:1,a:9.8,distance:47.1}}],
    steps:[
      S('设置起点和初速度','x(0)=0,\\quad v(0)=v_0','把 A 设为原点；以汽车中心的位置作为质点坐标。',['car','start']),
      S('建立匀加速位移','x(t)=v_0t+\\tfrac12at^2','同一时刻的速度与位置共同控制车轮、车身和读数。',['car','position']),
      S('求到达 B 的时刻','D=v_0t_B+\\tfrac12at_B^2','取正根；a=0 时自动退化为 t_B=D/v₀。',['finish','position']),
      S('计算末速度','v(t)=v_0+at,\\quad v_B=v_0+at_B','默认题图：t_B=3√5−5 s，v_B=6√5 m/s。',['velocity','finish'])
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
    id:'cubic-velocity-initial-condition',section:'dynamics',kind:'cubic-velocity',title:'三次速度与给定时刻的位置',eyebrow:'03 / 变速运动',
    question:'已知速度是时间的三次函数，如何利用 t=4 s 时的位置求轨迹？',
    description:'对速度积分并代入已知位置，沿轨道追踪折返点和当前状态。',
    idea:'速度的积分还差一个常数；给定任意时刻的位置才能确定它。',
    provenance:'03B2 单元 1–6、03B4 与 03B5 单元 1–6 实际包含同一运动学题：v=t³−9t²+10，x(4)=6，x=t⁴/4−3t³+10t+94。后两个文件名虽写静力学，内容与此运动学题重复。',
    sources:[src('03B2 Static Blocks and Tension.ipynb',[1,4,5,6],'同一速度积分题'),src('03B4 Static Bars and Ladders.ipynb',[1,3,4,5,6],'含 x(4)=6 的重复版本'),src('03B5 Static Pulleys and Tension.ipynb',[1,3,4,5,6],'与 03B4 的该题重复')],
    params:[P('c','速度常数项 c',10,4,16,1,'m/s'),P('xref','t=4 s 时的位置',6,0,20,1,'m')],
    steps:[
      S('读取给定速度','v(t)=t^3-9t^2+c','默认 c=10；演示时段为 0 到 4 秒。',['velocity','car']),
      S('积分得到位置','x(t)=\\frac{t^4}{4}-3t^3+ct+C','积分常数 C 尚未确定；速度过零处是折返点。',['position','turn']),
      S('代入给定时刻的位置','C=x(4)+128-4c','原题 x(4)=6、c=10，因此 C=94；这是已知条件，不是当前时刻。',['position','car']),
      S('追踪位置和折返','\\dot x=v(t),\\quad a(t)=3t^2-18t','车辆由正向运动到速度为零，再沿反方向运动。',['car','velocity','turn'])
    ]
  },
  {
    id:'level-projectile',section:'dynamics',kind:'level-projectile',title:'同高度斜抛与跑者接球',eyebrow:'03 / 基础抛体',
    question:'斜抛物体落回同一高度时，飞行多久、落点在哪里？',
    description:'合并截图中的基础斜抛与 02C1 跑者接球题，跟踪抛体和接球者的位置。',
    idea:'水平匀速、竖直匀加速；接球者的水平位置必须在落地时与小球重合。',
    provenance:'默认 80 m/s、30° 来自用户提供的 image-3 截图；未在固定版本 Notebook 中定位到该图的完整题干，图中未给 g，演示假设 10 m/s²。02C1 单元 9–16 的跑者题：v₀=15 m/s、45°、初距 25 m、g=10，落点 22.5 m，跑者向左约 1.18 m/s。其余结果由上述假设和运动方程计算，不冒充源码的原题数值。',
    sources:[src('02C1 Kinematic Basic Example.ipynb',[9,11,12,13,14,15,16,31,33,34,35,36],'单元 9–16 接球题；31–36 给同高度抛体时间的通式')],
    params:[P('v0','初速度 v₀',80,15,100,1,'m/s'),P('angle','发射角',30,20,60,1,'°'),P('g','重力加速度',10,9,10,.1,'m/s²'),P('runnerStart','跑者初距（接球）',25,20,40,1,'m')],
    presets:[{id:'level80',label:'用户截图 · 80 m/s、30°',values:{v0:80,angle:30,g:10,runnerStart:25}},{id:'receiver',label:'02C1 · 跑者接球',values:{v0:15,angle:45,g:10,runnerStart:25}}],
    steps:[
      S('分解初速度','v_{0x}=v_0\\cos\\theta,\\quad v_{0y}=v_0\\sin\\theta','水平速度不变，竖直速度受重力影响。',['ball','velocity']),
      S('分别积分两个方向','x=v_0\\cos\\theta\\,t,\\quad y=v_0\\sin\\theta\\,t-\\tfrac12gt^2','轨迹上每一点都与当前时间及读数同步。',['ball','trajectory']),
      S('求飞行时间与落点','t_f=\\frac{2v_0\\sin\\theta}{g},\\quad R=\\frac{v_0^2\\sin2\\theta}{g}','两式适用于落点和发射点同高、无空气阻力。',['landing','trajectory']),
      S('落点与接球条件','v_{\\rm 跑}=(R-D)/t_f','仅接球预设包含跑者：其速度为有符号量，负值表示向左。',['landing','ball'])
    ]
  },
  {
    id:'projectile-to-elevation',section:'dynamics',kind:'projectile-elevation',title:'抛体到达高台',eyebrow:'03 / 基础抛体',
    question:'以已知角度抛出，恰好经过远处较高的 B 点需要多大初速度？',
    description:'保留题图的水平距离与高台高度，观察轨迹穿过指定目标。',
    idea:'把共同的飞行时间从水平和竖直运动方程中消去。',
    provenance:'02C1 单元 2–7：θ=45°、B 水平距离 100 m、比 A 高 10 m、g=10 m/s²；代码给出 v₀=100/3 m/s、t=3√2 s。演示只到达 B 时刻，不推断后续碰撞或落地。球的显示半径为示意，模型按质点计算。',
    sources:[src('02C1 Kinematic Basic Example.ipynb',[2,3,4,5,6,7],'100 m 水平距离、10 m 高差与 45°')],
    params:[P('distance','水平距离 D',100,80,140,5,'m'),P('height','高差 H',10,5,20,1,'m'),P('angle','发射角',45,35,60,1,'°')],
    steps:[
      S('建立目标坐标','(x_B,y_B)=(D,H)','从 A 点发射，B 点高于 A。',['target','launch']),
      S('写出平面运动方程','x=v_0\\cos\\theta\\,t,\\quad y=v_0\\sin\\theta\\,t-\\tfrac12gt^2','忽略空气阻力，g=10 m/s²。',['ball','trajectory']),
      S('用目标坐标求初速','v_0=\\sqrt{\\frac{gD^2}{2\\cos^2\\theta(D\\tan\\theta-H)}}','参数范围保证 D tanθ > H，目标可以到达。',['velocity','target']),
      S('计算到达时间','t_B=\\frac{D}{v_0\\cos\\theta}','默认结果为 100/3 m/s 和 3√2 s。',['ball','target'])
    ]
  },
  {
    id:'two-projectiles-meet',section:'dynamics',kind:'projectiles-meet',title:'水平抛出与竖直上抛相遇',eyebrow:'03 / 基础抛体',
    question:'A 从 12 m 高处水平抛出，B 以两倍速度竖直上抛，相遇处的水平距离是多少？',
    description:'同时播放两球运动，直到第一次相遇；重力项在相对竖直位置中消去。',
    idea:'相同的重力加速度使相对加速度为零，故相遇时间可直接由初始高差求出。',
    provenance:'02C1 单元 18–29：初始高差 H=12 m，A 水平速度 V、B 竖直速度 2V、g=10 m/s²，求水平距离 L=6 m。源题未给 V；演示默认 V=8 m/s 并限制参数使两球在地面上方相遇，球半径仅作示意。演示在相遇瞬间停止，不模拟碰撞后的运动。',
    sources:[src('02C1 Kinematic Basic Example.ipynb',[18,20,21,22,23,24,25,26,27,28,29],'12 m 高差、V 与 2V，同步抛出')],
    params:[P('height','初始高差 H',12,8,18,1,'m'),P('v','水平速度 V',8,6,14,.5,'m/s')],
    steps:[
      S('同时释放两球','\\vec r_A(0)=(0,H),\\quad\\vec r_B(0)=(L,0)','A 水平抛出；B 以 2V 竖直向上。',['ballA','ballB']),
      S('写出竖直位置','y_A=H-\\tfrac12gt^2,\\quad y_B=2Vt-\\tfrac12gt^2','两者的重力位移相同。',['ballA','ballB']),
      S('求相遇时间','y_A=y_B\\Rightarrow t_*=H/(2V)','默认 H=12 m；V 是题图未给出的可调示意值。',['meeting','trajectory']),
      S('求水平距离','L=Vt_*=H/2','默认结果 L=6 m；仅模拟至相遇，不模拟碰撞结果。',['meeting','ballA','ballB'])
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
    provenance:'04B3 单元 4–17：斜面上的重力、法向力和摩擦力，源题为符号模型。Pagonis 例 2.2 给出下滑时的运动方程，此演示取其初速为零特例。演示使用 μ静 = μ动 的简化，并补充静止判定；初值为示意。',
    sources:[src('04B3 Rigid Boddy Friction.ipynb',[4,5,6,7,8,9,10,11,12,13,14,15,16,17]),srcP('Chapter2/Python_Codes_Chapter_2.ipynb',[3,4],'例 2.2 的下滑运动方程；静止判定为本演示补充')],
    params:[P('m','木块质量',5,2,10,.5,'kg'),P('angle','斜面角度',30,10,50,1,'°'),P('mu','摩擦系数',.2,0,.6,.02)],
    steps:[
      S('分解重力','W_{\\parallel}=mg\\sin\\theta,\\quad W_{\\perp}=mg\\cos\\theta','沿坡分量使物体下滑，垂直分量由斜面支持。',['weight','normal']),
      S('确定法向力与摩擦','N=mg\\cos\\theta,\\quad f_s\\leq\\mu N','比较所需静摩擦力与摩擦极限；这里假设静、动摩擦系数相同。',['normal','friction']),
      S('判断是否下滑','a=\\max(0,\\,g(\\sin\\theta-\\mu\\cos\\theta))','沿坡重力不足时静止；滑动时由合力决定加速度。',['friction','accel']),
      S('沿斜面积分运动','v=at,\\quad s=\\tfrac12at^2','从静止释放，位置与速度由同一个加速度驱动。',['accel','position'])
    ]
  },
  {
    id:'atwood-machine',section:'dynamics',kind:'atwood',title:'阿特伍德机：两重物与定滑轮',eyebrow:'03 / 牛顿第二定律',
    question:'两端重物不同，系统会如何加速？绳张力又是多少？',
    description:'两重物通过轻绳与定滑轮相连，重物、绳长、加速度和张力一起变化。',
    idea:'理想轻绳不可伸长：一侧上升多少，另一侧就下降多少。',
    provenance:'Pagonis Chapter 2 例 2.1 单元 1–2：代码联立 m₁g−T=−m₁a 与 m₂g−T=m₂a，得到 a=g(m₂−m₁)/(m₁+m₂)、T=2gm₁m₂/(m₁+m₂)。原 Notebook 没给质量或装置图，质量默认值、无质量滑轮与实验架是明确的理想化示意。两质量相等时从静止释放不会运动。',
    sources:[srcP('Chapter2/Python_Codes_Chapter_2.ipynb',[1,2],'例 2.1 的两体方程及符号解；质量数值为示意')],
    params:[P('m1','左侧质量 m₁',2,1,4,.5,'kg'),P('m2','右侧质量 m₂',3,1,4,.5,'kg')],
    steps:[
      S('确定绳长约束','y_1+y_2=\\mathrm{const}','两端从静止释放，位移大小相等、方向相反。',['rope','m1','m2']),
      S('分别列牛顿方程','T-m_1g=m_1a,\\quad m_2g-T=m_2a','规定右侧向下为正；a 为负意味着左侧下降。',['weight1','weight2','tension']),
      S('求系统加速度','a=\\frac{(m_2-m_1)g}{m_1+m_2}','理想滑轮、轻绳不计质量与摩擦。',['accel','rope']),
      S('求绳中张力','T=\\frac{2m_1m_2g}{m_1+m_2}','两端张力相等；等质量时 a=0，系统保持静止。',['tension','m1','m2'])
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
    provenance:'06C01 单元 5–25：均匀密度的实心圆锥，以底面为 z = 0，解析结果 zcm = h/4。Pagonis 例 4.5 从顶点向底面计量，得到 3h/4，物理位置相同；尺寸与密度为演示设定。',
    sources:[src('06C01 Mass Center 3D.ipynb',[5,6,7,8,9,10,11,16,18,19,20,21,22,23,24,25]),srcP('Chapter4/Python_Codes_Chapter_4.ipynb',[5,6],'例 4.5 以顶点为 z=0，结果 3h/4，等价于距底面 h/4')],
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

// Insert new exercises at the relevant concept, preserving the vector →
// statics → dynamics → mass order instead of appending a random list.
for (const lesson of APPLICATION_LESSONS) {
  const key=lesson.insertBefore||lesson.insertAfter;
  const i=LESSONS.findIndex(x=>x.id===key);
  if(i<0)throw new Error(`Unknown application insertion point ${key}`);
  LESSONS.splice(i+(lesson.insertAfter?1:0),0,lesson);
}

export const TAG_LABELS = {
 hinge:'铰支座 B',ropeUpper:'上方／斜绳',ropeLower:'下方／端绳',wedge:'楔块',guide:'竖直导轨',pendulum:'摆杆／摆绳',spring1:'左弹簧',spring2:'中间弹簧',spring3:'右弹簧',earth:'地球',moon:'月球',sun:'太阳',mercury:'水星',
 dot:'点积',cross:'叉积',area:'张成面积',start:'起点 A',finish:'终点 B',trajectory:'轨迹',landing:'落点',ball:'小球',ballA:'A 球',ballB:'B 球',launch:'发射点',target:'目标 B',runner:'跑者',rope:'轻绳',m1:'质量 m₁',m2:'质量 m₂',weight1:'m₁ 重力',weight2:'m₂ 重力',
 A:'矢量 A',B:'矢量 B',C:'后续矢量',R:'合矢量', W1:'载荷 W₁',W2:'载荷 W₂',RA:'支反力 R_A',RB:'支反力 R_B',moment:'力矩',
 weight:'重力',wall:'墙面反力',floor:'地面反力',friction:'摩擦力',tension:'绳张力',normal:'法向力',
 car:'汽车',truck:'卡车',meeting:'相遇位置',position:'位置',velocity:'速度',accel:'加速度',path:'轨迹',force:'推力',
 blockA:'物体 A',blockB:'物体 B',constraint:'绳长约束',height:'高度',energy:'能量',inertia:'转动惯量',torque:'力矩',angular:'角运动',
 mass:'质量',center:'质心',slice:'截面薄片',ring:'同心圆环',turn:'折返点',
 shipA:'A 船',shipB:'B 船',separation:'相对位置',closest:'最近距离',impact:'碰撞点',
 ball1:'左球 m₁',ball2:'右球 m₂',D:'底边 d',chord:'弦 AB',division:'弦上分点',angleMarker:'夹角 θ',frictionTop:'层间摩擦',frictionGround:'地面摩擦',direction:'方向',unit:'单位矢量',result:'目标矢量',pointA:'点 A',pointB:'点 B',geometry:'几何关系',contact:'接触点',train:'列车',tunnel:'隧道',observer:'观察者',obstacle:'障碍物',wallSurface:'光滑墙面',appliedForce:'外力 F'
};
export const TAG_COLORS = {
 hinge:'#3b8f86',ropeUpper:'#887db4',ropeLower:'#c77b60',wedge:'#d6a363',guide:'#688ca0',pendulum:'#4d8d89',spring1:'#d29c58',spring2:'#8a80b0',spring3:'#d29c58',earth:'#488baa',moon:'#b9a98d',sun:'#d6a044',mercury:'#a8826c',
 dot:'#668fa5',cross:'#8a80b0',area:'#668fa5',start:'#278f86',finish:'#dc7763',trajectory:'#d19c4c',landing:'#d19c4c',ball:'#dc7763',ballA:'#278f86',ballB:'#dc7763',launch:'#278f86',target:'#668fa5',runner:'#278f86',rope:'#8a80b0',m1:'#278f86',m2:'#dc7763',weight1:'#dc7763',weight2:'#dc7763',
 A:'#278f86',B:'#dc7763',C:'#dda940',R:'#305f83',W1:'#df7863',W2:'#cc6d5e',RA:'#258f86',RB:'#258f86',moment:'#d19c4c',
 weight:'#d97d60',wall:'#538ba8',floor:'#258f86',friction:'#d2a044',tension:'#8a80b0',normal:'#528ca7',
 car:'#278f86',truck:'#d77c64',meeting:'#d0a048',position:'#4d8ba5',velocity:'#248f86',accel:'#dc9d43',path:'#b9a066',force:'#d87a64',
 blockA:'#278f86',blockB:'#d77c64',constraint:'#ba9864',height:'#668fa5',energy:'#278f86',inertia:'#8a80b0',torque:'#d49d4d',angular:'#278f86',
 mass:'#d77c64',center:'#238e84',slice:'#d7a047',ring:'#d7a047',turn:'#d7a047',
 shipA:'#278f86',shipB:'#d77c64',separation:'#d7a047',closest:'#8a80b0',impact:'#d7a047',
 ball1:'#278f86',ball2:'#d77c64',D:'#d19c4c',chord:'#668fa5',division:'#d19c4c',angleMarker:'#8a80b0',frictionTop:'#d19c4c',frictionGround:'#d87a64',direction:'#d19c4c',unit:'#8a80b0',result:'#278f86',pointA:'#278f86',pointB:'#d77c64',geometry:'#668fa5',contact:'#d19c4c',train:'#d77c64',tunnel:'#668fa5',observer:'#d19c4c',obstacle:'#668fa5',wallSurface:'#668fa5',appliedForce:'#d87a64'
};
