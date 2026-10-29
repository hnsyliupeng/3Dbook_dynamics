# 已补充的 11 个具体应用算例

这些项目包含独立题目、数值模型、推演步骤、可调参数和同步 3D 装置。点击案例即可离线打开；GUI 证据包含每步截图和一段压缩动态预览。**本表不代表两个来源已全部实施。** 笔记本代码未给出的外形、数值或物理假设均在每个案例的「查看来源与说明」中披露。

## 静力学

| 题目与装置 | 原始依据 | 默认条件和检验 | 可视化证据 |
| --- | --- | --- | --- |
| [500 N 梁与两组滑轮配重](../cases/double-pulley-beam.html) | 第一来源 `03B1` 单元 28–32；可对照用户题图 | 梁长 L、配重 2W 与 W，斜绳在 L/4；默认 W=200 N、梁的水平反力 −200√3 N、竖直反力 100 N | [步骤 2 截图](qa/screenshots/double-pulley-beam/step-2.png) · [动态演示](qa/animations/double-pulley-beam.gif) |

## 动力学

| 题目与装置 | 原始依据 | 默认条件和检验 | 可视化证据 |
| --- | --- | --- | --- |
| [4m 与 m 货物推运](../cases/pushing-two-blocks.html) | 第一来源 `03C2` 单元 22–32，另比照 `03B1` 单元 200–210；可对照用户题图 | `F=60 N、m=1 kg、μ=0.2` 为新增示例；`a=10 m/s²、R=12 N`；两块分别满足牛顿定律 | [步骤 2 截图](qa/screenshots/pushing-two-blocks/step-2.png) · [动态演示](qa/animations/pushing-two-blocks.gif) |
| [加速小车双绳](../cases/cart-two-strings.html) | 第一来源 `05A2` 单元 25–35；可对照用户题图 | 1 kg、20 m/s²、45°；两绳均绷紧，`T₁/T₂=3` | [步骤 2 截图](qa/screenshots/cart-two-strings/step-2.png) · [动态演示](qa/animations/cart-two-strings.gif) |
| [导轨滑块与 3m 楔块](../cases/guided-block-wedge.html) | 第一来源 `05A2` 单元 37–43；可对照用户题图 | 图示质量为 3m，源代码未设 3m；按图独立求解。默认 30° 时楔块加速度 √3 m/s² | [步骤 2 截图](qa/screenshots/guided-block-wedge/step-2.png) · [动态演示](qa/animations/guided-block-wedge.gif) |
| [台球平面弹性碰撞](../cases/elastic-billiards-2d.html) | Pagonis 例 4.2、Chapter 4 单元 1–2 | `m₁=0.1 kg、m₂=0.2 kg、v₀=10 m/s、θ=30°`；动量和动能守恒；球桌及无旋转是附加假设 | [步骤 2 截图](qa/screenshots/elastic-billiards-2d/step-2.png) · [动态演示](qa/animations/elastic-billiards-2d.gif) |
| [立方阻力下落](../cases/cubic-drag-fall.html) | Pagonis 例 2.8/2.9、Chapter 2 单元 13–16 | `m=3 kg、g=9.8、c=2`；0.05 s 显式欧拉步进与精细 RK4 比较 | [步骤 2 截图](qa/screenshots/cubic-drag-fall/step-2.png) · [动态演示](qa/animations/cubic-drag-fall.gif) |
| [摆球碰钉后飞出](../cases/peg-pendulum-flight.html) | 第一来源 `02C3` 单元 2–8；可对照用户题图 | 长摆 2R、短摆 R；按题图 α 计算切线方向；C 点人为释放是额外假设 | [步骤 2 截图](qa/screenshots/peg-pendulum-flight/step-2.png) · [动态演示](qa/animations/peg-pendulum-flight.gif) |
| [大角度摆](../cases/large-angle-pendulum.html) | Pagonis 例 6.2/8.7、Chapter 6 单元 3–4、Chapter 8 单元 7–8 | `θ₀=3 rad`，保留 `sin θ`；原题 0.5 m / 10 s 与 1 m / 20 s 两种预设，使用可受压的刚杆 | [步骤 2 截图](qa/screenshots/large-angle-pendulum/step-2.png) · [动态演示](qa/animations/large-angle-pendulum.gif) |
| [两辆车与三根弹簧](../cases/coupled-spring-carts.html) | Pagonis 例 12.1、Chapter 12 单元 1–2 | `k₁=4、k₂=2、k₃=3、m₁=1、m₂=2`，初始 x₂=1；机械能与本征模验证 | [步骤 2 截图](qa/screenshots/coupled-spring-carts/step-2.png) · [动态演示](qa/animations/coupled-spring-carts.gif) |
| [地球和水星绕日](../cases/earth-mercury-orbits.html) | Pagonis 例 9.4、Chapter 9 单元 5–6 | 近远日点来自源代码；额外增加太阳 μ、共面无摄动及 Kepler 时间演化；天体放大 | [步骤 2 截图](qa/screenshots/earth-mercury-orbits/step-2.png) · [动态演示](qa/animations/earth-mercury-orbits.gif) |
| [月球近远地点与周期](../cases/earth-moon-orbit.html) | Pagonis 例 9.5、Chapter 9 单元 7–8 | 近地点 363300 km、远地点 405500 km、两体周期约 27.29 天；演示地月相对轨道 | [步骤 2 截图](qa/screenshots/earth-moon-orbit/step-2.png) · [动态演示](qa/animations/earth-moon-orbit.gif) |

帧差扫描只是自动辅助，不等于人工逐帧审查；动态预览为 17 帧压缩 GIF。详细测试和其他案例见 [GUI 验证画廊](qa/gallery.html)、[第一来源清单](source-coverage.md)、[第二来源清单](pagonis-coverage.md)及 [Pagonis 逐例目录](pagonis-examples.md)。
