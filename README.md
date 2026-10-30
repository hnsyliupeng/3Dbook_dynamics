# Mechanics in Motion · 分析力学交互书

一本基于 UNLaM《[Computational Analytical Mechanics](https://github.com/unlam/ComputationalAnalyticalMechanics)》的浏览器交互书原型。**当前完成的是一个经过验证的阿特伍德机垂直切片，而不是全部教材章节。** 目录展示原仓库的 13 个章节目录，其中只有一节可运行；12 步指这一节的推导步骤，不是另外 12 个已完成章节。

![阿特伍德机交互书](screenshots/01-atwood-default-engineering.png)

## 快速开始

需要 **Node.js 22.12 或更新版本**（已测 22.22.3）、npm 和支持 WebGL 的浏览器。首次安装需要联网，运行中的书不依赖 CDN。

```bash
npm ci
npm run dev
```

打开终端显示的地址；在 Arena 环境直接使用本会话的 **LIVE PREVIEW**。另可运行 `npm run build && npm run preview` 查看生产构建。Vite 绑定 `0.0.0.0`，允许 `.e2b.app` 预览域；它是开发服务器，不应作为开放公网的生产服务。

## 现在能做什么

- 合上/打开书，三页式理论、推导实验和验证；书页是 **CSS 透视、分层和过渡**，模型是独立的实时 Three.js 画布，不是完整的 WebGL 实体书或物理纸雕引擎。
- 12 个有依赖关系的公式步骤、KaTeX 渲染、实时数值代入和变量/模型高亮；一条共享状态同步模型、公式、力矢量、曲线与时间轴。
- 修改 `m₁`、`m₂`、`g`、初速度；播放、暂停、重置、前进/后退单步、任意定位和变速；修改参数会暂停并从初始状态重算。
- 工程模式使用真实 Machine Skill `GEO`/`MAT` 生成可旋转模型；手绘模式使用真实 Colorfigures 引擎并经同源消息协议接收同一状态。显示力与绳约束、简化滑轮剖视、曲线/CSV 和一题即时反馈。
- 可运行的独立产物：`public/skill-artifacts/atwood-colorfigures.html` 和 `public/skill-artifacts/atwood-machine-standalone.html`。它们可单独打开；**独立 Machine 原型有自己的时钟，不与主书同步**。主书中的 Machine 模型则只使用宿主时钟。

## 理想模型与源教材的区别

以 `q` 为质量块 `m₂` **向下**的位移，假设轻绳不可伸长、无滑移，无质量滑轮、无轴摩擦：

\[
 a=\frac{(m_2-m_1)g}{m_1+m_2},\qquad T_{\rm rope}=\frac{2m_1m_2g}{m_1+m_2}.
\]

默认 `m₁=1 kg, m₂=2 kg, g=9.81 m/s², q₀=v₀=0`，得到 **a = 3.27 m/s²、T = 13.08 N**。绳轮角度与位移相连；在 `|q|=0.5 m` 首次到达端点时暂停，保留碰前速度，**没有模拟碰撞或碰后运动**。这是对第 04 章的理想模型改编，并非完全复刻源 05 仿真：原 05 的无滑移关系含一个 `π` 因子且有转动惯量；区别及原值复现见 [来源映射](docs/SOURCE_MAPPING.md) 和 [物理验证](docs/PHYSICS_VALIDATION.md)。

## 测试与重建

```bash
npm test                 # Vitest：物理与时间轴
npm run test:e2e         # Playwright：真实 Chromium + WebGL + 截图（Linux x64）
npm run build            # 类型检查与生产构建
npm audit                # npm 依赖安全检查；不是下面的教材审计
```

截至本次运行，Vitest **11/11**，Playwright **15/15**，构建成功；`npm audit` 当时为 0 个已知漏洞（漏洞数据库会变化）。E2E 在 Linux x64 使用 `@sparticuz/chromium` 与软件 WebGL，需要 `tar`；可用 `CHROMIUM_PATH` 指定 Chromium。结果在 [reports/e2e-results.json](reports/e2e-results.json)，截图索引在 [视觉复核](docs/VISUAL_VERIFICATION.md)。这不是实际设备或 GPU 的性能保证。

Python 审计、基准和原 Notebook 重建（测试过 Python 3.11.2）：

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements-lock.txt
mkdir -p content/source
git clone https://github.com/unlam/ComputationalAnalyticalMechanics.git content/source/ComputationalAnalyticalMechanics
git -C content/source/ComputationalAnalyticalMechanics checkout --detach 387f2df07e70ba3bdff2c66460c04f6ae6ba2055
# 默认读取上述路径；也可设置 COURSE_SOURCE 指向同一 commit 的已有克隆
npm run audit             # 213 个源文件、Notebook/PDF/LaTeX 描述性扫描
npm run build:lessons     # 课程和模型候选索引
npm run extract:equations # 保留原文的有界 SymPy Lark 候选解析
npm run execute:source    # 完整执行两份阿特伍德原始 Notebook，不修改源文件
npm run validate:python   # SymPy 推导 + SciPy 四例和源 05 数值复现
```

可选重建真实技能产物：

```bash
python .claude/skills/colorfigures/scripts/build.py content/skill-src/atwood-colorfigures.html public/skill-artifacts/atwood-colorfigures.html
cp content/skill-src/atwood-machine-uninlined.html machine-prototype.html
node .claude/skills/machine/scripts/inline.mjs machine-prototype.html
npm run build:machine     # 将 Machine kit 和 Three 打包成可 file:// 打开的独立文件
```

锁文件针对已测环境；不同 OS/CPU 可能需要不同 Python wheels 或本机浏览器。原教材克隆、`node_modules`、`.venv` 和 `dist` 不提交。截图及审计产物作为可核查证据保留。

## 文档与诚实边界

- [架构、数据流、状态协议](docs/ARCHITECTURE.md)
- [教材文件、Notebook 和公式来源映射](docs/SOURCE_MAPPING.md)
- [SymPy/SciPy 和原 Notebook 执行结果](docs/PHYSICS_VALIDATION.md)
- [真实技能来源、调用、产物及未完成项](docs/SKILLS_USAGE.md)
- [视觉截图、复核与性能限制](docs/VISUAL_VERIFICATION.md)
- [版权与许可证](docs/LICENSES.md)

尚未实现其他 12 个章节的交互课程、非理想滑轮/摩擦/碰撞、多模型通用 DAE、真正可折叠的物理纸雕书、Machine 规定的四轮完整审片与影片；Colorfigures 镜像版本为固定视角。课程原作和改编内容遵循 **CC BY-NC-SA 4.0**，未经许可不得作不符合非商业条件的发布；各技能自身另为 MIT，不能因此豁免课程许可。
