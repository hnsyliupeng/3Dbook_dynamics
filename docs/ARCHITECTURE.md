# 架构、数据流与状态边界

## 真实范围

本仓库把来源审计、一个可运行课程和之后扩展用的接口分开。`LessonCompiler` 目前仅注册 `atwood-ideal`；其余目录是来源索引，不会被自动转成虚构仿真。`TeachingDirector` 提供教学阶段名称，不是自动教学规划器。

## 模块

| 模块 | 职责 |
|---|---|
| `scripts/scan_repository.py` | 固定 commit 文件哈希、PDF 文字摘要、LaTeX 计数、Notebook cells/AST/输出 MIME；并非科学证明。 |
| `scripts/build_lessons.py`, `extract_equations.py` | 13 章目录、34 个模型候选索引及 TeX 原文/有界 Lark 候选；未审核项不注册。 |
| `src/lessons/atwood/lesson.ts` | 来源、假设、初值、约束、求解器、12 步推导 DAG、变量/物体绑定和练习；分类为 Adapted。 |
| `src/math/` | 推导依赖图和 KaTeX；UI 为每一步计算实时数值，并不声称对任意 TeX 自动求解。 |
| `src/physics/` | 理想模型、解析解、有限时间边界、通用 RK4 和物理快照；不依赖 React/Three。 |
| `src/simulation/` | `SnapshotStore` 固定步长检查点 + 末端分数步、`TimelineController`、墙钟转换和 React hook。 |
| `src/book/`, `src/app/` | 可交互封面、展示状态、页面切换与 UI 组合；封面/书页是 CSS，不是仿真的物体。 |
| `src/integrations/MachineSkillAdapter.ts`, `src/visuals/MachineScene.tsx` | 真实 Machine kit 建模，Three 场景、OrbitControls、选取及简化剖视；每帧读快照，不自己积分。 |
| `src/integrations/ColorfiguresAdapter.tsx` | 自包含 Skill iframe 的安全消息桥；图形状态来自相同宿主快照。 |
| `src/ui/` | 公式、参数、时间轴、图表/CSV、来源与章节对话框。 |

## 单一时钟

`SimulationClock` 将帧间墙钟时间转为固定 `1/120 s` 的仿真步数；长时间后台暂停的单帧被限制在 0.1 s，**不会假装补算全部墙钟时间**。`SnapshotStore` 在参数变化时重新生成 RK4 检查点；任意时刻用最近检查点加一个分数 RK4 步，因此可以精确定位非整数步长的行程端点。`TimelineController` 负责播放、暂停、重置、±一步和 seek。曲线、数值显示、轮角 `−q/R`、直绳长度和两种视觉模式读取同一份快照。渲染帧只更新表现，纸雕升起动画不驱动物理。

求解区间从 0 到首次触碰 `q=±0.5 m`，或未触碰时到 4 s。端点是观察事件，显示碰前状态，**不是冲量/碰撞求解器**。暂停、关闭书和切换页面会停止时钟；重开书保留所处时间。修改参数重建 `SnapshotStore` 并回到 `t=0`。背景标签页可能减速，不做实时保证。

## 书与课堂

书封面、书页阴影、翻页和线稿/模型出现是 CSS/SVG 呈现。页面状态定义在 `BookEngine.ts`；12 种 `TeachingPhase` 中只有认识、推导实验和验证三页的映射正在使用。书的物理折页、可变折痕和与任何模型相连的通用纸雕系统尚未建立。原始 13 章均在目录中，但仅 `04Constraints` 的一个阿特伍德理想改编可点击。

## iframe 消息协议 v1

主书与 `public/skill-artifacts/atwood-colorfigures.html` 同源通信，`channel="mechanics-book"`，`version=1`。双方校验 `event.origin`、发送窗口、channel 和 version；插画对参数、数值有限性和 q 边界进行检查。

| 方向 | 消息 | 作用 |
|---|---|---|
| 图 → 主书 | `VIEW_READY` | iframe 就绪后请求最近快照，父窗口也会在 `onLoad` 发送。 |
| 主书 → 图 | `SET_STATE` | 快照、参数、力/约束显示和选择状态；播放由主书单独负责。 |
| 图 → 主书 | `STATE_UPDATED` | 图形已应用状态的确认；现用于测试/可观察性，不影响主时钟。 |
| 图 → 主书 | `SELECT_PART` | 仅允许 `m1`/`m2` 选择，触发父侧公式绑定。 |

独立插画提供静态姿态按钮；嵌入时按钮隐藏，不维护独立物理时钟。`machine-prototype.html` 和离线 `atwood-machine-standalone.html` 是单独的 Skill 演示，**自身有局部计时器，并不加入这个同步协议**。

## 扩展新章节时

先固定源 SHA 与 cell 引用，记录真实坐标、参数、假设、约束、方程和初值；需要执行并独立复核源输出。再实现独立 `PhysicsModel`、数值/解析基准、`MechanicsLesson` 和可验证的可视适配器，登记真实许可证、截图及测试。不要把 `model-inventory.json` 中的 AST/字面量候选当作物理参数或直接生成“已完成”的课程。
