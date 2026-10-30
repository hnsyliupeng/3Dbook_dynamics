# 教材来源清单与映射

## 基线与审计范围

- 原作：Víctor A. Bettachini，Universidad Nacional de La Matanza；[Computational Analytical Mechanics](https://github.com/unlam/ComputationalAnalyticalMechanics)，教材许可 CC BY-NC-SA 4.0，详见 [LICENSES.md](LICENSES.md)。
- 固定 commit：`387f2df07e70ba3bdff2c66460c04f6ae6ba2055`。`content/manifest/source-manifest.json` 逐项记录 213 个源文件的路径、大小和 SHA-256；不是教材整仓拷贝。
- 13 个实际章节目录、34 个 Notebook（其中 32 个在章节目录，另有 2 个 `reference/academical` 文档）、29 个 PDF、19 个 `.tex`。没有独立 `11` 或 `14` 章节目录。
- 所有 Notebook 的原始代码/Markdown、纯文本输出、源 cell 哈希、输出 MIME 和附件名已描述性抽取到 `content/lessons/source/`；二进制图片/附件不复制，引用原固定版本。Notebook 缺少原生 cell ID 时使用 **零基** `index:n` 与内容哈希，绝不伪造源 ID。PDF 均尝试提取文本并保存页数、文本哈希和前 350 字符，0 个提取错误；LaTeX 保存字符数和数学片段数量。PDF/LaTeX 的完整语义和版式并未逐项审校。
- 34 份各有记录：`notebook-inventory.json`（索引）、`model-inventory.json`（符号声明、数字字面量、求解调用、图片输出和 Markdown 数学**候选**及 cell 引用）、`equation-index.json`（数学原文及尝试解析状态）。字面量可能不是物理参数；候选不是已经审核的模型。
- Markdown 中识别到 1,247 个数学片段、775 个唯一候选；208 个唯一候选被 SymPy Lark 解析但**未验证**，385 个不支持、182 个过复杂而保留原文。解析会产生 SymPy 弃用警告。两处 Python AST 失败均是 `13OscillationsMDOF/vieux/transverseOscillations.ipynb` 的 `index:33`、`index:38` 中 `%%capture` Jupyter 魔法，不是成功解析。

## 章节 → Notebook → 交互状态

以下文件名均相对于表中目录；完整路径、标题、依赖及逐 cell 内容见上述 manifest。**“索引”不等于已完成互动课或已验证物理模型。**

| 章 | 实际目录 | Notebook（按文件名） | 状态 |
|---|---|---|---|
| 01 | `01Vector` | `vectorKinematics.ipynb` | 索引；未实现交互课程 |
| 02 | `02Energy` | `gravitationalPotentialEnergy.ipynb`, `kineticEnergy.ipynb` | 索引；未实现交互课程 |
| 03 | `03EulerLagrange` | `elasticPotentialEnergy.ipynb`, `eulerLagrangePendulums.ipynb`, `euler_lagrange_base.ipynb`, `rotatingParts.ipynb` | 索引；未实现交互课程 |
| 04 | `04Constraints` | `atwoodConstraint.ipynb`, `constraintsFunction.ipynb`, `solvingLinearSystems.ipynb` | 阿特伍德理想改编 1 节可运行；其余索引 |
| 05 | `05Simulation` | `atwoodSimulationSolved.ipynb`, `pendulumFreeSimulSolved.ipynb` | 索引；未实现交互课程 |
| 06 | `06ConstraintForces` | `constraintIdealPendulum.ipynb`, `forcesConstraint.ipynb`, `nonHolonomicSystems.ipynb`, `rollingForcesConstraint.ipynb` | 索引；未实现交互课程 |
| 07 | `07Nonconservative` | `linkedCylinders_Help.ipynb`, `nonconservative.ipynb` | 索引；未实现交互课程 |
| 08 | `08InertiaTensor` | `angular_momentum_torque.ipynb`, `carbonMonoxide_inertiaTensor.ipynb`, `inertiaTensor.ipynb` | 索引；未实现交互课程 |
| 09 | `09DistributedMass` | `distributedMass.ipynb`, `inertiaTensorcube.ipynb` | 索引；未实现交互课程 |
| 10 | `10EulerRotation` | `flywheel.ipynb`, `misalignedGear.ipynb`, `rotationEuler.ipynb` | 索引；未实现交互课程 |
| 12 | `12OscillationsSDOF` | `arbitrarySDOF.ipynb`, `harmonicSDOF.ipynb`, `oscillationsSDOF.ipynb` | 索引；未实现交互课程 |
| 13 | `13OscillationsMDOF` | `oscillationsMDOF.ipynb`, `vieux/transverseOscillations.ipynb` | 索引；未实现交互课程 |
| 15 | `15FinalProject` | `projectRigid.ipynb` | 索引；未实现交互课程 |

教材另外有 `reference/academical/methodology.ipynb`、`reference/academical/subjectMatter.ipynb`，不伪装成章节或可运行算例。`content/manifest/lesson-catalog.json` 是 UI 使用的目录。

## 本节从何而来

| 本书内容 | 固定源引用 | 分类与修改 |
|---|---|---|
| 阿特伍德机图景、固定绳长 `y₁+y₂+πR−ℓ=0` | [04Constraints/atwoodConstraint.ipynb](https://github.com/unlam/ComputationalAnalyticalMechanics/blob/387f2df07e70ba3bdff2c66460c04f6ae6ba2055/04Constraints/atwoodConstraint.ipynb)，`index:7–8` | Source-derived 的约束思想；页面、图和尺寸由本项目绘制。 |
| 理想质量块动能、势能、欧拉–拉格朗日方程、加速度 | 同上 `index:13,18,23,26–35` | Adapted：源以第一质量向下为正；本书 q 为第二质量向下为正、势能零点重选，滑轮无质量。 |
| 原滑轮有质量及无滑移约束 | 同上 `index:39–61` | 已审阅、原 Notebook 可执行；本切片**不**提供转动惯量模型。 |
| 数值求解思路及时间响应 | [05Simulation/atwoodSimulationSolved.ipynb](https://github.com/unlam/ComputationalAnalyticalMechanics/blob/387f2df07e70ba3bdff2c66460c04f6ae6ba2055/05Simulation/atwoodSimulationSolved.ipynb)，`index:11,24,37,40,53,60,69` | 作为来源研究与独立复现；浏览器 RK4、端点和本书参数为适配/扩展，不声称执行源模型。 |
| 绳张力、能量残差、端点、参数 UI、曲线和练习 | 牛顿受力与本项目扩展；见 `src/lessons/atwood/lesson.ts` | Adapted / Extended，不标成源 Notebook 现成的交互功能。 |

### 为什么没有沿用 05 的 π

原 `05` cell `index:11` 是 `ẋ₁/R − θ̇/π = 0`，因此 cell `index:24` 导出 `θ̇=πẋ₁/R`；cell `index:37` 结果为 `2g(m₁−m₂)/(π²M+2m₁+2m₂)`。原参数 `m₁=8 kg, m₂=1 kg, M=4 kg, g=9.81, x₀=25, v₀=−10` 的源运算完整执行，并独立复现 `a=2.389418598`、`x(10)=44.470930`、`v(10)=13.894186`。本书要求的是**无质量**滑轮、标准无滑移及 q=m₂ 向下正，故公式不同；这不是对原 Notebook 结果的忠实复刻，也不判断源作者意图。结果见 `reports/source-notebook-execution.json` 与 `content/references/physics-reference.json`。

## 使用与重建

`README.md` 给出 checkout、审计、来源 Notebook 完整运行和验证命令。源仓库未提交，`content/source/` 被忽略；将新章节变成交互课程前，必须逐 cell 审核并记录对应方程、状态、参数、初值及参考，不能只从候选索引推断。
