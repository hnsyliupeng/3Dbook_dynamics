# Skill 使用证据与限制

本会话环境不是原生 Claude Code/Codex 的 Slash Skill 调度器，**没有声称调用了不存在的 `/machine` 或 `/colorfigures` 系统命令**。这里安装并读取了两份实际 `SKILL.md`、依赖 API、示例和脚本，以当前 Agent 按其工作流编写、构建、运行及复查真实产物；以下列出完成和未完成的部分。项目还新增面向后续课程的 [mechanics-book-builder](../.claude/skills/mechanics-book-builder/SKILL.md)，它不能代替原技能本身。

## Colorfigures

- 官网：[april-zhu.com/colorfigures](https://april-zhu.com/colorfigures)；该沙箱下载官网 tar 时 TLS 失败。实际安装 [madearga/colorfigures](https://github.com/madearga/colorfigures) 的镜像，commit `3a520817c1cc4277954715e69d993e1f950da1b8`，目录 `.claude/skills/colorfigures/`。镜像声称保留官网 MIT 技能，但**无法证明与官网当前 tar 完全一致**。它的 `SKILL.md` 指定固定等轴视角与固定光照；本项目遵守该版本，不宣称插画可 360° 旋转。
- 实际阅读 `SKILL.md`、`assets/core.js` 中 `mountFigure` 和形状 API、`vending.html` 与 `washer.html` 示例、`scripts/build.py`。适配简报是“一个理想阿特伍德机：两块质量、一根绳、一个广义坐标；q 来自主书而非图形私有计时器”。完整建模脚本在 `content/skill-src/atwood-colorfigures.html`，实际使用 `mountFigure`、`box`、`cylX`、`rod`、`tag`、调色和墨线。
- 真正运行过官方 `build.py`，结果 `public/skill-artifacts/atwood-colorfigures.html` 包含 engine 与 MIT 许可。主书通过 `ColorfiguresAdapter.tsx` 的 v1 消息桥同步 q、速度、加速度、张力、质量、当前推导步及显示选项；HTTP 同源与单文件 `file://` 的不透明来源均实测，错误 origin/version/窗口被拒绝。切步会改变实际 SVG 中的质量高亮，位移改变时两质量实际反向移动且轮辐图形旋转。独立插画也已在 `file://` 阻断外网时实测，截图 `18-colorfigure-file.png`；其“Reset pose / Move to +0.2 m”仅改变演示姿态，不是独立模拟。
- 浏览器运行截图 [`screenshots/03-atwood-colorfigures-synced.png`](../screenshots/03-atwood-colorfigures-synced.png)、[`10-colorfigures-standalone.png`](../screenshots/10-colorfigures-standalone.png)，测试姿态按钮、错误/NaN 和同步；曾修正端点穿模并重拍。没有完成技能建议的所有 crop / 乱序交互审片，不能说完整通过其视觉审查清单。

## Machine

- 实际安装 [AirsupHQ/machine-skill](https://github.com/AirsupHQ/machine-skill) commit `e0bd066ac5beaf48512935de2fc0f0e55636853a`（MIT，Airsup），保存在 `.claude/skills/machine/`。读取完整 `SKILL.md`、`references/solvers.md`、`kit/lab-kit.js` 的 API，以及官方模板/样例和构建、截图脚本。阿特伍德机尺寸是教学设计尺寸，不冒充某款实测机器。
- 实际运行官方 `inline.mjs`，从 `content/skill-src/atwood-machine-uninlined.html` 构造 `machine-prototype.html`；真实 `Lab`、`GEO.rbox/tube/disc/extrude`、`MAT.paint/brass/steel` 与视图模式均来自 Skill。主书进一步在 `src/integrations/MachineSkillAdapter.ts` 直接导入同一个 kit 的 `GEO/MAT`，由 `src/visuals/MachineScene.tsx` 接收宿主物理快照。主书没有启动 Machine Lab 的第二套计时器。
- `npm run build:machine` 使用 esbuild 将上述真实 kit 和本地 Three 0.170 打包为 `public/skill-artifacts/atwood-machine-standalone.html`；Playwright 已通过 `file://`、阻断外网验证正反端点、等质量静止、4 s 观察结束、重播、滑块精度、X-ray 和真实运动，详见 `reports/machine-prototype-audit.json`（7/7）及 `screenshots/17a`–`17c`。此**独立**原型有自己的小求解器、参数滑块和时钟，不与书同步；主书版本才共享状态。
- 运行官方 `shot.mjs` 生成 [`11`](../screenshots/11-machine-skill-studio.png)–[`15`](../screenshots/15-machine-skill-mass-detail.png) 的整体、剖切、爆炸和两处细节。发现剖切中心错误后修复并复拍；这些 `11`–`15` 是先前版本的审片截图，主要记录相同几何/视图，而非本轮新版运行状态；新运行截图是 `17a`–`17c`。软件渲染环境中为取得图像关闭了重后处理和阴影。官方原型在该软件渲染环境约 **3 FPS**，未达到 Skill 文档所要求的 30 FPS，不能推断真实 GPU 性能。
- **未完成** Machine 文档规定的四轮完整审片、影片镜头与 MP4（本环境没有 ffmpeg），也没有物理故障/破坏求解器。没有虚构“无缺陷”审片结论、影片或性能达标；主书剖视是轮缘简化剖切，不等同完整制造级工程截面。

## 版本指纹（SHA-256）

| 文件 | SHA-256 |
|---|---|
| `.claude/skills/colorfigures/SKILL.md` | `1fec683c1de77975d981073f6e26bc4df4b7eea94b6df64714f97167ff8f1115` |
| `.claude/skills/colorfigures/assets/core.js` | `a871d6cec944addaeef78b1273adf2337c02e6094d8d38b1324a3a995120ee9a` |
| `.claude/skills/machine/SKILL.md` | `1f71d2c90c9b1c0cca4b7af526b5a9721cb039638e872fb959173a5ec533611c` |
| `.claude/skills/machine/kit/lab-kit.js` | `6b6bf13e2f146eb725547538ce9700b0926b63885528cf8ed5f7b85cadb7f236` |
| `public/skill-artifacts/atwood-colorfigures.html` | `878e6810e521323450e95ee8fb1666a2846438a9c5d4e53aae11d3c505c31fee` |
| `public/skill-artifacts/atwood-machine-standalone.html` | `42fb3faf9b47ede8d4cfb61a256133e5b40d963b8a38c045fa8e4f7a57a4d2a9` |
| `src/integrations/MachineSkillAdapter.ts` | `a88f40073e5ed533cac688de12d66753396d105bd77048094fb72a4a18e1dda2` |
| `machine-prototype.html` | `d659b558c36695ea096ba1f9b8aab821f0d6a7769724354b62695c24065113e9` |

| `standalone/atwood-book.html` | `b9152e4d6fa77889120e9d9ddbb2fc471e4a0a3e64dd2bc40cb966832617de93` |

重建命令见 [README](../README.md)。修改源、升级依赖或重新打包后，产物哈希可能改变，必须重新运行测试并更新本表。
