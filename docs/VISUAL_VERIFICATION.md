# 截图、视觉检查与已知限制

当前**只有阿特伍德机一个交互算例**；下列截图覆盖此算例的不同参数和两项技能产物，不代表其他章节已实现。`npm run test:e2e` 通过 Playwright 在 Linux 软件 WebGL 中重拍 `00`–`10`；`11`–`15` 来自 Machine 官方 `shot.mjs` 工作流（低开销设置）。截图和测试不替代真实设备检查。

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
| [11-machine-skill-studio.png](../screenshots/11-machine-skill-studio.png) | Machine 原型整体、实时 a/T。 |
| [12-machine-skill-cutaway.png](../screenshots/12-machine-skill-cutaway.png) | Machine 原型剖视中心修正后的可见结果。 |
| [13-machine-skill-exploded.png](../screenshots/13-machine-skill-exploded.png) | Machine 原型爆炸视图；主书不提供爆炸模式。 |
| [14-machine-skill-axle-detail.png](../screenshots/14-machine-skill-axle-detail.png), [15-machine-skill-mass-detail.png](../screenshots/15-machine-skill-mass-detail.png) | 两处近景，用于检查连接和几何。 |

## 已发现并修复

1. 早期端点位置使质量块接近或穿过底座/轮缘；提高轮心和初始直绳长度后，将端点质量块与轮缘/底座的净空纳入 Vitest，并复拍端点图。
2. 时间轴整数/固定步长不能精确选中非整步终点；输入改为任意值、状态存储加分数步后可显示端点停止和重播。
3. Machine 原型剖切中心一度让关键质量消失；更正 `cut.center` 后重拍剖切。

这些不是全场景、全角度或全参数的无碰撞证明。Colorfigures 的镜像技能是固定视角；工程模型可轨道旋转，但场景中的切面仅为简化轮缘。书页与纸雕动画是 CSS/SVG 效果，非完整可折叠 3D 书；无非理想物理、全章节或影片。

## 运行与性能

本次 `reports/e2e-results.json` 为 15/15，主页面恢复前台后约 56 次 rAF/s；这只是单次 headless 量测，可能因软件渲染和后台节流而显著波动，不证明物理设备达到 60 FPS。官方 Machine 独立原型的同环境审片约 3 FPS，即使关闭昂贵效果仍未达到其 Skill 的 30 FPS 要求；生产使用前需要真机 GPU 基准、画质降级策略和更多设备测试。生产构建中有大于 500 kB 的 JavaScript chunk，中文字体文件也较大，需要后续优化首屏加载。

Machine 所要求的四轮完整、多视图审片和影片尚未完成；Colorfigures 推荐的全部裁切/乱序截图亦未完成。不能仅凭这些截图宣称整个项目或技能完成。
