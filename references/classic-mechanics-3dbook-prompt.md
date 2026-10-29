# 任务：构建「公式推演 ⟷ 3D动画」强同步的经典力学 3D Book

## 核心目标
将经典力学问题（静力学、动力学、运动学、功与能、动量、刚体）转化为可翻页的 3D Book。
每一页实现公式逐步推演与 3D 物理动画的严格时间轴同步：推演步骤与动画状态一一对应，双向驱动，实时高亮映射。

## 参考技能与仓库
- Colorfigures (april-zhu.com/colorfigures)：可旋转、透视、标签、交互的手绘/等距 3D 物体
- Every Joule (iamtechartist/every-joule-lesson1)：3D 书本隐喻 + 页面弹出场景 + 能量可视化
- Machine-skill (AirsupHQ/machine-skill)：真实尺寸、物理求解器驱动、可剖切/爆炸的 photoreal 单 HTML 仿真
- aldotb/Solve-classic-mechanics-problems-with-python：SymPy/Atb 符号逐步推导 + 数值求解

## 核心约束（必须全部满足）
1. 公式推演与 3D 动画必须共享同一时间轴，严格同步。不允许先推完公式再播动画，也不允许动画跑完再显示公式。
2. 每一个推导步骤对应一个明确的动画状态区间。步骤切换时动画平滑过渡到对应物理瞬间。
3. 当前高亮的方程项必须在 3D 场景中有对应可视化元素同步高亮（力矢量、速度箭头、能量条、轨迹段、加速度等）。
4. 用户拖动时间轴、单步前进/后退或修改参数时，公式进度与动画进度必须同时回退/前进到同一时刻。
5. 参数改变后重新求解，同步关系依然成立，当前相对进度保持不变。

## 总体架构
```
BookShell（封面、书脊、页边、物理翻页动画）
└── PageManager（每页 = 一个完整力学问题）
    ├── DerivationTrack（公式推演时间轴）
    ├── AnimationTrack（3D 场景时间轴）
    ├── SyncController（强制两轨对齐的唯一时间源）
    ├── ParameterBus（参数变更同时驱动两轨重算）
    └── SceneRuntime（共享相机、灯光、后处理、剖切、爆炸、标签、高亮）
+ SolverBridge（SymPy 符号逐步结果 + 数值时间序列）
+ AI Skill Layer（生成完整同步页面）
```

## 同步机制（核心实现）
每个问题必须定义 DerivationScript（有序列表）：
```json
[
  {
    "stepId": "1",
    "tStart": 0.0,
    "tEnd": 0.8,
    "latex": "\\vec{F}_{net} = m\\vec{a}",
    "highlight": ["F_net", "a"],
    "visual": {
      "showForce": true,
      "showAccel": true,
      "energyMode": null,
      "highlightObjects": ["forceArrow", "accelArrow"]
    },
    "narration": "牛顿第二定律"
  },
  {
    "stepId": "2",
    "tStart": 0.8,
    "tEnd": 1.6,
    "latex": "mg - T = ma",
    "highlight": ["mg", "T", "a"],
    "visual": {
      "showGravity": true,
      "showTension": true,
      "showAccel": true,
      "highlightObjects": ["gravityArrow", "tensionArrow", "accelArrow"]
    },
    "narration": "沿绳方向力分解"
  }
]
```

SyncController 以固定帧率驱动：
- 当前时间 t → 定位 DerivationScript 所处步骤
- 更新公式面板（当前步骤高亮 + 已完成步骤淡化 + 未到达步骤隐藏）
- 驱动 3D 场景插值到对应物理状态（位置、速度、力、能量）
- 同步高亮 visual.highlightObjects 中的元素
- 时间轴控件双向绑定：拖动即同时改变公式进度与动画进度

## 页面内部强制布局
- 左侧 35%：公式推演面板（步骤列表、当前高亮、可展开中间推导、LaTeX 渲染）
- 右侧 65%：3D 场景（可交互、可剖切、可爆炸）
- 底部：统一时间轴 + 播放/暂停/单步前进/单步后退 + 参数滑块区
- 公式项与 3D 元素使用同一颜色映射，支持点击反向定位

## 书本容器
- 硬封面 + 圆角书脊 + 页边厚度指示
- 物理翻页（单页/多页、拖拽释放、弯曲变形）
- 状态：关闭（封面）→ 打开（左公式面板 + 右 3D 场景）
- 无障碍：纯文本版本 + 键盘操作 + 教师注释层
- 技术：单 canvas + DOM overlay，WebGL 2 / Three.js r170+

## 场景与可视化
| 问题类型 | 必须同步可视化的元素 |
|---------|---------------------|
| 运动学 | 位置点、速度矢量、加速度矢量、轨迹历史、时间标记 |
| 静力学 | 所有力矢量、力矩箭头、平衡指示器、支点 |
| 动力学 | 张力/摩擦力/重力、加速度、约束运动路径 |
| 功与能 | 动能条、势能条、机械能守恒指示、做功路径积分可视化 |
| 刚体 | 角速度、角动量、惯性主轴、瞬时转轴 |

几何与材质：
- Colorfigures 风格：程序化手绘线条 + 等距/透视 + 半透明透视 + 部件高亮标签
- Machine-skill 风格：真实比例实体、PBR、剖面 cap（双面材质 + 平面裁剪）
- 统一：所有部件命名、可点击高亮、可 explode，并与公式项颜色映射

动态要求：
- requestAnimationFrame + 固定步长积分或预计算时间序列插值
- 拖拽物体改变初始条件 → 重新求解 → 保持当前相对进度重播
- 慢动作、暂停、单步、参数扫
- 矢量场/轨迹用 BufferGeometry 实时更新
- 当前推导步骤对应的可视化元素必须高亮（颜色/发光/粗细变化）

## 求解器与数据流
1. 离线：用 aldotb 风格 Jupyter + SymPy 生成
   - 符号逐步推导（每一步的 latex + 中间变量 + 高亮项）
   - 数值时间序列（位置、速度、力、能量，固定 dt）
   - 导出 JSON：{ derivationScript, timeSeries, parameters, colorMap }
2. 前端加载 JSON 后：
   - DerivationTrack 使用 derivationScript
   - AnimationTrack 使用 timeSeries 插值
   - SyncController 统一时间源
3. 参数改变时：
   - 重新请求求解器（或本地轻量求解）
   - 重新生成 timeSeries + 必要时更新 derivationScript 中的数值
   - 保持当前相对进度（百分比）不变

## AI 生成工作流（SKILL.md 结构）
1. 输入：经典力学问题描述 + 目标课标点
2. 研究：提取完整符号推导步骤（必须逐步，不可跳步）与关键参数范围
3. 生成 DerivationScript（每步含 tStart/tEnd/latex/highlight/visual/narration）
4. 生成几何（Colorfigures 手绘风格或 Machine-skill photoreal 风格）
5. 绑定求解器并输出 timeSeries + colorMap
6. 组装单 HTML：内联 runtime + SyncController + 数据 + 公式面板
7. 验证：自动检查「任意时刻公式步骤与动画状态是否一致」+ 高亮映射正确性

## 技术选型
- 渲染：Three.js r170+（与 Machine-skill 一致）
- 数学：前端 math.js + KaTeX；后端 SymPy
- UI：原生 DOM + CSS（玻璃态控件）
- 资产：程序化几何为主
- 性能：单场景控制在 100k–600k 三角形
- 导出：每个问题一个自包含 HTML（内联 runtime + 数据）
- 视频：参考 Machine-skill 的 record.mjs（Playwright + ffmpeg）

## 输出交付物
- 每个问题/章节一个自包含 HTML
- 必须包含：
  - 完整 DerivationScript
  - 与之严格对齐的 timeSeries
  - SyncController 实现
  - 参数实时重算能力
  - 公式高亮 ↔ 视觉元素高亮双向映射
  - 颜色映射表
- 支持键盘：空格播放/暂停，← → 单步，R 重置
- 支持 Colorfigures 手绘风格与 Machine photoreal 风格切换

## 验收标准（硬性）
- 拖动时间轴到任意位置，公式当前步骤与 3D 场景物理状态必须对应
- 单步前进时，公式与动画同时进入下一步
- 改变参数后，重新播放时同步关系仍然成立
- 当前高亮公式项在场景中有明确对应可视化且同步高亮
- 无任何「先推完公式再播动画」或「动画跑完再出公式」的行为
- 点击公式项可反向高亮对应 3D 元素，点击 3D 元素可定位到对应公式步骤
```
