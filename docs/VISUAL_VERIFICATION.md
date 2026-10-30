# 截图、视觉检查与已知限制

当前**只有阿特伍德机一个交互课程**；下列截图覆盖此课程的不同参数与两项技能产物，不代表其他章节已实现。`npm run test:e2e` 通过 Playwright 在 Linux 软件 WebGL 中重拍 `00`–`10` 和 `20` 系列；`16` 和 `18` 来自离线部署审计，`17a`–`17c` 来自独立 Machine 原型审计。`11`–`15` 为本轮之前 Machine 官方 `shot.mjs` 低开销几何审片，非新版状态截图。截图和测试不替代真实设备检查。

| 截图 | 复核内容 |
|---|---|
| [00-book-cover.png](../screenshots/00-book-cover.png) | 合上书的封面、重新打开按钮；运行状态保持暂停。 |
| [01-atwood-default-engineering.png](../screenshots/01-atwood-default-engineering.png) | 默认 a=3.27、T=13.08，工程模型、书页和曲线可见。 |
| [01b-atwood-derivation.png](../screenshots/01b-atwood-derivation.png) | 12 步导航、第 7 步偏导与实时数值、变量选择。 |
| [01c-source-and-licence.png](../screenshots/01c-source-and-licence.png) | 课程改编、05 π 因子、模型假设和 CC 许可证链接。 |
| [02-atwood-motion-and-scrub.png](../screenshots/02-atwood-motion-and-scrub.png) | 拖到 t=0.20 s；实际轮角、绳长和质量高度另由测试断言。 |
| [03-atwood-colorfigures-synced.png](../screenshots/03-atwood-colorfigures-synced.png) | 同时刻插画和宿主状态同步。 |
| [04-atwood-reversed-masses.png](../screenshots/04-atwood-reversed-masses.png) | 交换质量，加速度/位移反号。 |
| [05-atwood-equal-masses.png](../screenshots/05-atwood-equal-masses.png) | 等质量和零初速，位移保持零。 |
| [06-atwood-stop-and-cutaway.png](../screenshots/06-atwood-stop-and-cutaway.png) | 精确端点暂停、质量块净空和主书简化剖视。 |
| [07-atwood-verification-exercise.png](../screenshots/07-atwood-verification-exercise.png) | 换页暂停与答题反馈。 |
| [08-chapter-catalog.png](../screenshots/08-chapter-catalog.png) | 源教材的 13 个目录；只有一个互动项。 |
| [09-atwood-mobile.png](../screenshots/09-atwood-mobile.png) | 390 px 移动布局，无水平溢出；页面纵向堆叠。 |
| [10-colorfigures-standalone.png](../screenshots/10-colorfigures-standalone.png) | Colorfigures 构建产物的独立静态姿态。 |
| [16-standalone-file.png](../screenshots/16-standalone-file.png) | 完整单 HTML，`file://` + 阻断外网，插画和宿主状态/选择同步。 |
| [17a-machine-negative-stop.png](../screenshots/17a-machine-negative-stop.png), [17b-machine-positive-stop.png](../screenshots/17b-machine-positive-stop.png), [17c-machine-equal-observation.png](../screenshots/17c-machine-equal-observation.png) | 独立 Machine 原型：反向端点、正向端点、等质量 4 s 观察结束；该原型自带时钟。 |
| [18-colorfigure-file.png](../screenshots/18-colorfigure-file.png) | 独立 Colorfigures 直接 `file://` 运行，姿态按钮可用、无网络和 NaN；它不是另一个仿真时钟。 |
| [11-machine-skill-studio.png](../screenshots/11-machine-skill-studio.png) | Machine 原型整体、实时 a/T。 |
| [12-machine-skill-cutaway.png](../screenshots/12-machine-skill-cutaway.png) | Machine 原型剖视中心修正后的可见结果。 |
| [13-machine-skill-exploded.png](../screenshots/13-machine-skill-exploded.png) | Machine 原型爆炸视图；主书不提供爆炸模式。 |
| [14-machine-skill-axle-detail.png](../screenshots/14-machine-skill-axle-detail.png), [15-machine-skill-mass-detail.png](../screenshots/15-machine-skill-mass-detail.png) | 两处近景，用于检查连接和几何。 |

## 具名参数情形：逐项截图

以下 17 行均是**同一个理想课程**的参数分支，Playwright 使用页面滑块逐项设置，校验中间时刻的质量高度、绳段、轮角及末态，与独立参考对比并保存截图。切触和端点相关截图显示末态，其余显示中点。完整参数/时间/结果保存在 `reports/e2e-results.json` 的 `caseAudits`。

| 情形 | m₁ / m₂ (kg), g (m/s²), v₀ (m/s) | 首端点或观察窗 (s) | 截图 |
|---|---|---:|---|
| 默认 | 1 / 2, 9.81, 0 | 0.553001 | [20-01-default.png](../screenshots/20-01-default.png) |
| 质量交换 | 2 / 1, 9.81, 0 | 0.553001 | [20-02-reversed-masses.png](../screenshots/20-02-reversed-masses.png) |
| 等质量静止 | 2 / 2, 9.81, 0 | 4.000000（观察窗） | [20-03-equal-stationary.png](../screenshots/20-03-equal-stationary.png) |
| 等质量，初速 0.05 | 2 / 2, 9.81, 0.05 | 4.000000（观察窗） | [20-04-equal-moving-at-05.png](../screenshots/20-04-equal-moving-at-05.png) |
| 等质量匀速到正端点 | 2 / 2, 9.81, 1 | 0.500000 | [20-05-equal-moving-hits-positive-stop.png](../screenshots/20-05-equal-moving-hits-positive-stop.png) |
| 初速反向后折返 | 1 / 2, 9.81, -1 | 0.937736 | [20-06-initial-reversal.png](../screenshots/20-06-initial-reversal.png) |
| 反向质量与初速折返 | 2 / 1, 9.81, 1 | 0.937736 | [20-07-reverse-direction-with-initial-velocity.png](../screenshots/20-07-reverse-direction-with-initial-velocity.png) |
| 最大重力、质量极差 | 0.2 / 5, 20, 0 | 0.232737 | [20-08-maximum-gravity-and-unequal-masses.png](../screenshots/20-08-maximum-gravity-and-unequal-masses.png) |
| 最小重力、质量极差 | 5 / 0.2, 1, 0 | 1.040833 | [20-09-minimum-gravity.png](../screenshots/20-09-minimum-gravity.png) |
| 零速切触负端点 | 1 / 3, 2, -1 | 1.000000 | [20-10-tangential-endpoint-touch.png](../screenshots/20-10-tangential-endpoint-touch.png) |
| 恰在 4 s 触端点 | 1.5 / 1.7, 1, 0 | 4.000000 | [20-12-touch-exactly-at-observation-horizon.png](../screenshots/20-12-touch-exactly-at-observation-horizon.png) |
| 质量相减舍入的切触 | 4.3 / 4.4, 7.83, -0.3 | 3.333333 | [20-13-tangency-with-mass-cancellation.png](../screenshots/20-13-tangency-with-mass-cancellation.png) |
| 切触判别式正向舍入 | 0.2 / 0.3, 1.25, -0.5 | 2.000000 | [20-14-tangency-rounded-positive.png](../screenshots/20-14-tangency-rounded-positive.png) |
| 负端切触判别式负向舍入 | 0.2 / 1, 1.5, -1 | 1.000000 | [20-15-negative-tangency-with-rounding.png](../screenshots/20-15-negative-tangency-with-rounding.png) |
| 正端切触判别式舍入 | 1 / 0.2, 1.5, 1 | 1.000000 | [20-16-positive-tangency-with-rounding.png](../screenshots/20-16-positive-tangency-with-rounding.png) |
| 近切触但命中 | 0.2 / 1, 1.49, -1 | 0.924514 | [20-17-near-tangent-but-hits.png](../screenshots/20-17-near-tangent-but-hits.png) |
| 近切触未命中，折返后到正端 | 0.2 / 1, 1.51, -1 | 2.400565 | [20-18-near-tangent-but-misses.png](../screenshots/20-18-near-tangent-but-misses.png) |

另一个具名参考为质量相差约 `2×10⁻¹¹ kg` 的消减压力测试，小于滑块 `0.1 kg` 精度；只在物理/真实 3D 装配单元测试中运行，**没有冒充 UI 截图**。另有 100 组种子参数和 UI 网格边界组合用于批量数值测试，它们不是已制作课程，也没有逐组截图。

## 已发现并修复

1. 早期端点位置使质量块接近或穿过底座/轮缘；提高轮心和初始直绳长度后，将端点质量块与轮缘/底座的净空纳入 Vitest，并复拍端点图。
2. 时间轴整数/固定步长不能精确选中非整步终点；输入改为任意值、状态存储加分数步后可显示端点停止和重播。
3. Machine 原型剖切中心一度让关键质量消失；更正 `cut.center` 后重拍剖切。
4. 本轮发现源码/普通 dist 不能直接双击、相对路径子目录失败、完整单文件 `file://` 插画消息起初未同步；分别提供单文件、相对资源路径并针对 `null` 来源/窗口身份修复。
5. 修复初速小数显示、正反向说明、端点切触舍入及观察窗状态；图表明确区分已观察/预计算，当前推导步自动关联模型物件。

这些不是全场景、全角度或全参数的无碰撞证明。Colorfigures 的镜像技能是固定视角；工程模型可轨道旋转，但场景中的切面仅为简化轮缘。书页与纸雕动画是 CSS/SVG 效果，非完整可折叠 3D 书；无非理想物理、全章节或影片。

## 运行与性能

本次 `reports/e2e-results.json` 为 18/18，主页面恢复前台后约 28 次 rAF/s；这只是单次 headless 量测，可能因软件渲染和后台节流而显著波动，不证明物理设备达到 60 FPS。官方 Machine 独立原型的同环境审片约 3 FPS，即使关闭昂贵效果仍未达到其 Skill 的 30 FPS 要求；生产使用前需要真机 GPU 基准、画质降级策略和更多设备测试。生产构建中有大于 500 kB 的 JavaScript chunk，中文字体文件也较大，需要后续优化首屏加载。

Machine 所要求的四轮完整、多视图审片和影片尚未完成；Colorfigures 推荐的全部裁切/乱序截图亦未完成。不能仅凭这些截图宣称整个项目或技能完成。
