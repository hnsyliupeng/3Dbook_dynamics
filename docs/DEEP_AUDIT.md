# 深度审查结论：独立运行、推导与同步

本报告范围是**现已实现的一个理想阿特伍德机课程**和两个 Skill 成品；并不把教材目录/候选索引当成已完成课程。结果来自本次固定代码、Linux x64、Chromium 软件 WebGL，不能外推到所有浏览器或真实 GPU。

## 1. HTML 是否真正独立

| 入口 | 实测结果 | 说明 |
|---|---|---|
| [`standalone/atwood-book.html`](../standalone/atwood-book.html) | **通过**：直接 `file://`、阻断外网 | 单文件内含主书 JS/CSS/字体、插画和许可。实测时间轴、q/速度/张力、公式步骤、插画质量的反向移动和轮辐变化、双向选择，以及错误来源/版本/窗口的合成消息拒绝。 |
| `dist/` 静态根目录 | **通过**：阻断外网 | 需要先构建并由静态服务器提供完整目录，不需要应用后端。 |
| `dist/` 嵌套子目录 | **通过**：阻断外网 | 构建资源使用相对路径。 |
| 源码 `index.html` / 常规 `dist/index.html` 直接双击 | **不支持** | Chromium 拒绝其 `file://` 模块/CSS；请使用上面的完整单文件，而非把空白页当成功。 |
| [`atwood-colorfigures.html`](../public/skill-artifacts/atwood-colorfigures.html) | **通过**：直接 `file://`、阻断外网 | 姿态按钮有效，无 NaN；它只是插画姿态，不是独立动力学求解器。 |
| [`atwood-machine-standalone.html`](../public/skill-artifacts/atwood-machine-standalone.html) | **通过**：直接 `file://`、阻断外网 | 有自己的求解器和时钟，**不与主书同步**；已单独验证运行、正反端点、等质量、4 s 观察窗、重播、滑块和 X-ray。 |

修复前基线与修复后记录分别为 [`reports/standalone-baseline.json`](../reports/standalone-baseline.json)、[`reports/standalone-audit.json`](../reports/standalone-audit.json)；独立 Machine 另见 [`reports/machine-prototype-audit.json`](../reports/machine-prototype-audit.json)（7/7）。`file://` 在 Chromium 消息中来源为 `null`，不能仅靠该来源认证；实现同时检查消息通道、版本及对端窗口。模拟恶意消息被拒绝并不构成全面安全审计。

## 2. 推导和数值是否正确

- 12 个**实际显示**的理想模型 LaTeX 与人工审阅式逐项匹配，并由 SymPy 验证约束、坐标/速度、动能、势能、拉格朗日量、偏导、欧拉–拉格朗日方程、加速度、张力、时间解和能量守恒：[`reports/derivation-audit.json`](../reports/derivation-audit.json)。范围不包含未实现的源教材推导。
- 参考采用 mpmath 70 位计算首触边时刻、独立 SciPy RK45 计算轨迹：18 个具名情形与 100 个固定种子 UI 参数组，各 9 个采样（共 1,062 状态）。Vitest 比对 RK4、解析值、加速度、张力、能量与边界。
- 所定义的 UI 网格中，2,366 个在 4 s 内的精确切触组合及其反向对称，以及 16,026 个相邻非切触组合及其反向对称，用整数有理数判别式独立核查。这不是连续实数空间的穷举。
- 主书浏览器测试逐一校验 12 步在默认状态下的实时代入；另外在反向初速、相反方向和等质量非零初速 3 种状态下再次核对全部 36 个实际代入：[`reports/live-derivation-audit.json`](../reports/live-derivation-audit.json)。按显示位数允许半个末位，避免不同求解器在舍入平局两侧相差一个末位。
- 默认 `m₁=1, m₂=2, g=9.81, v₀=0` 得 `a=3.27 m/s²`、`T=13.08 N`。原 05 Notebook 带滑轮惯量且无滑移关系包含 `π`，**不是**本书的无质量滑轮模型；来源、原结果与差异见 [SOURCE_MAPPING.md](SOURCE_MAPPING.md)、[PHYSICS_VALIDATION.md](PHYSICS_VALIDATION.md)。

## 3. 动画和推导是否同步

主书的时间轴、公式、曲线、Machine 模型及 Colorfigures 共用同一物理快照；模型每帧不独立积分。12 个推导步各自把关联物体和变量送到两个视觉模式，切步不改变时间；手动选择可覆盖自动高亮。展开动画期间物理控制禁用，避免尚未展开时推进物理。

- 单元测试检查真实 3D 质量位置、每段绳长度、轮角、重力/张力箭头方向及长度、速度/加速度方向和步高亮。浏览器另验证实际插画 SVG 随状态改变、两质量的移动方向和轮辐变化。
- 曲线光标跟随当前时间；**实线是已观察轨迹、虚线是预计算预测**，CSV 则包含完整预计算轨迹。单步、拖动、暂停、重播及切页/合书暂停均有浏览器测试。
- 到 `q=±0.5 m` 的首次触碰即暂停并保留碰前速度（含零速切触）；未触边时在 4 s 结束观察。**没有计算碰撞、反弹或碰后状态。**

## 4. 案例与未实现内容

17 个具名情形可通过 UI 参数复现，每个都有单独截图，包括等质量静止/匀速、正反质量、初速折返、极值、端点切触及近切触；清单和参数见 [VISUAL_VERIFICATION.md](VISUAL_VERIFICATION.md)。另一具名近等质量数值压力案例的质量差约 `2×10⁻¹¹ kg`，低于滑块 `0.1 kg` 精度，**仅程序测试，没有伪造 UI 截图**。100 个随机种子组和网格枚举只是测试样本，不是额外课程。

尚未制作其余 12 个章节的交互课程、04 的其他 Notebook 案例、原 05 带惯量模型及非理想摩擦/绳松弛/碰撞等。具体逐 Notebook 状态见 [SOURCE_MAPPING.md](SOURCE_MAPPING.md)；原仓库没有独立的 11、14 目录。CSS/SVG 翻页与纸雕是视觉表现，不是完整可折叠物理书。Colorfigures 镜像与官网 tar 的当前一致性未证实；Machine 完整四轮审片/影片未完成，软件 WebGL 性能也不达其推荐标准。教材及改编受 CC BY-NC-SA 4.0 限制，详见 [LICENSES.md](LICENSES.md)。

## 5. 可复核命令

`npm test` 21/21；`npm run test:e2e` 18/18；`npm run test:derivations` 36/36；`npm run test:machine` 7/7。先运行 `npm run build`、`npm run build:standalone` 再运行 `npm run test:standalone`。Python 环境安装 `requirements-lock.txt` 后运行 `npm run audit:derivations` 重建符号/数值参考。测试需要 `@sparticuz/chromium` 或设置 `CHROMIUM_PATH`，并不替代真机检查。`npm audit` 本次为 0 个已知漏洞，结果会随数据库变化。
