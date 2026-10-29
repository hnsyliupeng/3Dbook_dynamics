# 已补充的 21 个具体应用算例

这些项目包含独立题目、数值模型、推演步骤、可调参数和同步 3D 装置。点击案例即可离线打开；GUI 证据包含每步截图和一段压缩动态预览。**本表不代表两个来源已全部实施。** 笔记本代码未给出的外形、数值或物理假设均在每个案例的「查看来源与说明」中披露。

## 静力学

| 题目与装置 | 原始依据 | 默认条件和检验 | 可视化证据 |
| --- | --- | --- | --- |
| [500 N 梁与两组滑轮配重](../cases/double-pulley-beam.html) | 第一来源 `03B1` 单元 28–32；可对照用户题图 | 梁长 L、配重 2W 与 W，斜绳在 L/4；默认 W=200 N、梁的水平反力 −200√3 N、竖直反力 100 N | [步骤 2 截图](qa/screenshots/double-pulley-beam/step-2.png) · [动态演示](qa/animations/double-pulley-beam.gif) |

## 动力学

| 题目与装置 | 原始依据 | 默认条件和检验 | 可视化证据 |
| --- | --- | --- | --- |
| [汽车经过 A、B 的速度比](../cases/car-speed-ratio.html) | 第一来源 `02B2` 单元 17–28 | AB=1000 m、Δt=10 s、vB/vA=3；按源码匀加速求出发点至 A 为 125 m；题面“恒速”与静止起步矛盾 | [步骤 2 截图](qa/screenshots/car-speed-ratio/step-2.png) · [动态演示](qa/animations/car-speed-ratio.gif) |
| [两层楼同时下落的石块](../cases/two-stones-building.html) | 第一来源 `02B2` 单元 39–44 | 高度差 7 m、上石下抛 4 m/s、g=10；首次相距 3 m 为 1 s。绝对楼高 50 m 是额外假设 | [步骤 3 截图](qa/screenshots/two-stones-building/step-3.png) · [动态演示](qa/animations/two-stones-building.gif) |
| [4m 与 m 货物推运](../cases/pushing-two-blocks.html) | 第一来源 `03C2` 单元 22–32，另比照 `03B1` 单元 200–210；可对照用户题图 | `F=60 N、m=1 kg、μ=0.2` 为新增示例；`a=10 m/s²、R=12 N`；两块分别满足牛顿定律 | [步骤 2 截图](qa/screenshots/pushing-two-blocks/step-2.png) · [动态演示](qa/animations/pushing-two-blocks.gif) |
| [加速小车双绳](../cases/cart-two-strings.html) | 第一来源 `05A2` 单元 25–35；可对照用户题图 | 1 kg、20 m/s²、45°；两绳均绷紧，`T₁/T₂=3` | [步骤 2 截图](qa/screenshots/cart-two-strings/step-2.png) · [动态演示](qa/animations/cart-two-strings.gif) |
| [导轨滑块与 3m 楔块](../cases/guided-block-wedge.html) | 第一来源 `05A2` 单元 37–43；可对照用户题图 | 图示质量为 3m，源代码未设 3m；按图独立求解。默认 30° 时楔块加速度 √3 m/s² | [步骤 2 截图](qa/screenshots/guided-block-wedge/step-2.png) · [动态演示](qa/animations/guided-block-wedge.gif) |
| [滑块下滑与可移动楔块反冲](../cases/free-wedge-slider.html) | Pagonis 例 8.5、Chapter 8 单元 5–6 | 源题为符号解；默认 M=3 kg、m=1 kg、α=30°、静止释放是新增假设，检验接触、水平动量与能量 | [步骤 3 截图](qa/screenshots/free-wedge-slider/step-3.png) · [动态演示](qa/animations/free-wedge-slider.gif) |
| [台球平面弹性碰撞](../cases/elastic-billiards-2d.html) | Pagonis 例 4.2、Chapter 4 单元 1–2 | `m₁=0.1 kg、m₂=0.2 kg、v₀=10 m/s、θ=30°`；动量和动能守恒；球桌及无旋转是附加假设 | [步骤 2 截图](qa/screenshots/elastic-billiards-2d/step-2.png) · [动态演示](qa/animations/elastic-billiards-2d.gif) |
| [立方阻力下落](../cases/cubic-drag-fall.html) | Pagonis 例 2.8/2.9、Chapter 2 单元 13–16 | `m=3 kg、g=9.8、c=2`；0.05 s 显式欧拉步进与精细 RK4 比较 | [步骤 2 截图](qa/screenshots/cubic-drag-fall/step-2.png) · [动态演示](qa/animations/cubic-drag-fall.gif) |
| [摆球碰钉后飞出](../cases/peg-pendulum-flight.html) | 第一来源 `02C3` 单元 2–8；可对照用户题图 | 长摆 2R、短摆 R；按题图 α 计算切线方向；C 点人为释放是额外假设 | [步骤 2 截图](qa/screenshots/peg-pendulum-flight/step-2.png) · [动态演示](qa/animations/peg-pendulum-flight.gif) |
| [大角度摆](../cases/large-angle-pendulum.html) | Pagonis 例 6.2/8.7、Chapter 6 单元 3–4、Chapter 8 单元 7–8 | `θ₀=3 rad`，保留 `sin θ`；原题 0.5 m / 10 s 与 1 m / 20 s 两种预设，使用可受压的刚杆 | [步骤 2 截图](qa/screenshots/large-angle-pendulum/step-2.png) · [动态演示](qa/animations/large-angle-pendulum.gif) |
| [弹簧与阻尼器的三种运动](../cases/damped-spring-cart.html) | Pagonis 例 6.3/6.4、Chapter 6 单元 5–8 | m=k=1、b=1/2/3 比较欠阻尼、临界阻尼及过阻尼；初始位移与装置外形为新增假设 | [步骤 2 截图](qa/screenshots/damped-spring-cart/step-2.png) · [动态演示](qa/animations/damped-spring-cart.gif) |
| [周期激振与共振小车](../cases/driven-spring-resonance.html) | Pagonis 例 6.5/6.6、Chapter 6 单元 9–12 | 默认 m=k=1、b=0.2、F₀=5、ω=3、x₀=2、v₀=0；稳态振幅与驱动、位移同步显示 | [步骤 2 截图](qa/screenshots/driven-spring-resonance/step-2.png) · [动态演示](qa/animations/driven-spring-resonance.gif) |
| [曲柄驱动的移动支点摆](../cases/crank-driven-pendulum.html) | Pagonis 例 8.3、Chapter 8 单元 1–2 | 默认 R=0.2、ω=2.5、l=1、g=9.8、θ₀=1；用固定步长 RK4 积分，刚性轻杆及电机外形是新增假设 | [步骤 2 截图](qa/screenshots/crank-driven-pendulum/step-2.png) · [动态演示](qa/animations/crank-driven-pendulum.gif) |
| [两辆车与三根弹簧](../cases/coupled-spring-carts.html) | Pagonis 例 12.1、Chapter 12 单元 1–2 | `k₁=4、k₂=2、k₃=3、m₁=1、m₂=2`，初始 x₂=1；机械能与本征模验证 | [步骤 2 截图](qa/screenshots/coupled-spring-carts/step-2.png) · [动态演示](qa/animations/coupled-spring-carts.gif) |
| [两车三等弹簧与正常模态](../cases/equal-spring-normal-modes.html) | Pagonis 例 12.2/12.3/12.5/12.6(a)、Chapter 12 单元 3–10 | 同相 √(k/m)、反相 √(3k/m)；源码注释与实际初值冲突，按代码及输出并提供三个预设 | [步骤 3 截图](qa/screenshots/equal-spring-normal-modes/step-3.png) · [动态演示](qa/animations/equal-spring-normal-modes.gif) |
| [地球和水星绕日](../cases/earth-mercury-orbits.html) | Pagonis 例 9.4、Chapter 9 单元 5–6 | 近远日点来自源代码；额外增加太阳 μ、共面无摄动及 Kepler 时间演化；天体放大 | [步骤 2 截图](qa/screenshots/earth-mercury-orbits/step-2.png) · [动态演示](qa/animations/earth-mercury-orbits.gif) |
| [双星绕共同质心](../cases/binary-stars-barycenter.html) | Pagonis 例 9.1、Chapter 9 单元 1–2 | G=1、m₁=1、m₂=2，源相对初态 (1,0)、(0,1)；检验质心、角动量和能量，星体半径为视觉放大 | [步骤 2 截图](qa/screenshots/binary-stars-barycenter/step-2.png) · [动态演示](qa/animations/binary-stars-barycenter.gif) |
| [四颗木卫星估计木星质量](../cases/jupiter-moons-mass.html) | Pagonis 例 9.7、Chapter 9 单元 9–10 | 保留四组轨道半长轴、周期与带截距线性拟合；默认质量约 1.898585×10²⁷ kg。圆轨道、相位与星体尺寸是示意 | [步骤 3 截图](qa/screenshots/jupiter-moons-mass/step-3.png) · [动态演示](qa/animations/jupiter-moons-mass.gif) |
| [月球近远地点与周期](../cases/earth-moon-orbit.html) | Pagonis 例 9.5、Chapter 9 单元 7–8 | 近地点 363300 km、远地点 405500 km、两体周期约 27.29 天；演示地月相对轨道 | [步骤 2 截图](qa/screenshots/earth-moon-orbit/step-2.png) · [动态演示](qa/animations/earth-moon-orbit.gif) |

## 质心与惯量

| 题目与装置 | 原始依据 | 默认条件和检验 | 可视化证据 |
| --- | --- | --- | --- |
| [均匀与变密度三角薄板](../cases/triangle-lamina-centroid.html) | Pagonis 例 4.4/4.6、Chapter 4 单元 3–4、7–8 | a=1 时，σ=2y 的 yG≈0.353553 m；也有常密度预设。薄板和支架为示意，进度代表积分上限 | [步骤 4 截图](qa/screenshots/triangle-lamina-centroid/step-4.png) · [动态演示](qa/animations/triangle-lamina-centroid.gif) |

帧差扫描只是自动辅助，不等于人工逐帧审查；动态预览为 17 帧压缩 GIF。详细测试和其他案例见 [GUI 验证画廊](qa/gallery.html)、[第一来源清单](source-coverage.md)、[第二来源清单](pagonis-coverage.md)及 [Pagonis 逐例目录](pagonis-examples.md)。
