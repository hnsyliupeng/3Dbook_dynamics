# 理想阿特伍德机：模型与验证

## 约定

`q` 是 m₂ 向下的位移，m₁ 同时向上同样的距离。绳长固定，滑轮无质量和轴摩擦，绳无质量、不可伸长、不滑动，两个质量均为正，`g>0`。这是源 04 章节的**理想改编**，不是带惯量/摩擦模型。以初始位置为势能零点：

```text
l1 = l1(0) - q, l2 = l2(0) + q,  l1 + l2 + πR = constant
K = (m1 + m2) qdot² / 2,             V = (m1 - m2) g q
L = K - V,                           (m1 + m2) qddot = (m2 - m1) g
T_rope = m1(g + qddot) = 2 m1 m2 g/(m1 + m2)
q(t) = v0 t + a t²/2,                qdot(t) = v0 + a t
```

默认 `m1=1 kg, m2=2 kg, g=9.81 m/s², q(0)=v(0)=0`，因此 `a=3.27 m/s²`、`T_rope=13.08 N`。势能和动能使用不同符号 `V` 和 `K`，绳张力记作 `T_rope`。展示采用半径 `R=0.22 m`、初始直绳各 `0.75 m`，在 `q=±0.50 m` 首次停止。滑轮中心高度 `1.75 m`、质量块高 `0.22 m`；自动净空测试确保端点不会穿过底座或轮缘。位移决定滑轮角 `−q/R`。滑轮实体是教学可视化，理想计算**不计入其转动惯量**。

## 独立参考与测试

- `scripts/validate_physics.py` 使用 SymPy 从 `L` 得到欧拉–拉格朗日方程，并用 SciPy `solve_ivp` 的 RK45 与解析式对比四种情形。输出 `content/references/physics-reference.json`。浏览器采用固定步长 RK4，与 SciPy 算法不同，另以 Vitest 比较解析值、边界、净空和能量。
- `scripts/execute_source_notebooks.py` 用 nbclient/ipykernel 完整执行固定 SHA 的两份**未经改写**的源 Notebook。`04Constraints/atwoodConstraint.ipynb` 27/27 个代码 cell、`05Simulation/atwoodSimulationSolved.ipynb` 34/34 个代码 cell 通过；执行日志及选定原输出在 `reports/source-notebook-execution.json`。这不表示执行了其余 32 份 Notebook。
- `tests/physics/atwood.test.ts`：11/11。`reports/e2e-results.json`：15/15；同步测试读取实际 WebGL canvas 公开的轮角、质量高度、绳段长度，并检查 iframe 的 q 和错误来源拒绝。浏览器测试是指定样例，不是形式化证明。

| 情形 | a (m/s²) | 张力 (N) | 结束时刻 (s) | SciPy vs 解析位移最大误差 |
|---|---:|---:|---:|---:|
| 默认 1 kg / 2 kg | 3.27 | 13.08 | 0.553001 | 1.665×10⁻¹⁶ m |
| 两侧各 2 kg、静止初速 | 0 | 19.62 | 4（观察窗） | 0 |
| 2 kg / 1 kg、反向 | −3.27 | 13.08 | 0.553001 | 1.665×10⁻¹⁶ m |
| 默认质量，v₀=−1 m/s，先反向后折返 | 3.27 | 13.08 | 0.937736 | 7.216×10⁻¹⁶ m |

SciPy 四例最大能量漂移约 `8×10⁻¹⁵ J`，只表示所测理想常加速度问题中的浮点误差，不保证其他模型精度。

## 与原 05 Notebook 的有意区别

固定版本 `05Simulation/atwoodSimulationSolved.ipynb` 的 cell `index:11` 写 `ẋ₁/R − θ̇/π = 0`，cell `index:24` 得 `θ̇=πẋ₁/R`；带 `I=MR²/2` 后 cell `index:37` 得 `a₁=2g(m₁−m₂)/(π²M+2m₁+2m₂)`。这与常见无滑移关系及本课程理想模型不一致，**未悄悄抹掉 π**。原 `m₁=8, m₂=1, M=4, g=9.81, x₀=25, v₀=−10` 复现 `a₁=2.389418598 m/s², x₁(10)=44.470930 m, v₁(10)=13.894186 m/s`。原 04 中第一块质量向下为正；本书选择第二块向下为正，公式符号相应变换。详见 [SOURCE_MAPPING.md](SOURCE_MAPPING.md)。

## 边界

没有绳松弛、弹性、滑移、摩擦、有惯量滑轮、接触碰撞或碰后恢复；这些物理必须重新建模，不得沿用本公式冒充非理想仿真。图表能量在人为端点停止处只展示碰前值。力箭头长度具有统一视觉比例，不是 CAD 尺寸或有限元解。课程参数和几何为教学设定，不能宣称是某一台真实仪器的实测规格。
