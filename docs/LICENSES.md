# 版权、来源和许可证

本文件是工程归属说明，不是法律意见。完整许可证文本保存在 [`licenses/`](../licenses/) 及各技能目录。

## 原教材及改编内容

原作：[Computational Analytical Mechanics](https://github.com/unlam/ComputationalAnalyticalMechanics)，作者 **Víctor A. Bettachini**，**Universidad Nacional de La Matanza (UNLaM)**，版本 `387f2df07e70ba3bdff2c66460c04f6ae6ba2055`。原仓库以 [Creative Commons Attribution–NonCommercial–ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/) 提供，原文完整副本为 [`licenses/COURSE-CC-BY-NC-SA-4.0.txt`](../licenses/COURSE-CC-BY-NC-SA-4.0.txt)。

本项目保存源 Notebook 的文本化提取和元数据、部分公式/表述，并将 04/05 的阿特伍德材料改编成中文、交互推导和理想模型；与原作不同的约定及改动记录于 [SOURCE_MAPPING.md](SOURCE_MAPPING.md)。分发时应保留署名、来源、许可链接、修改说明并遵守相同方式共享。**商业用途不得仅凭技能 MIT 许可推定已获授权**；如使用不符合 CC 非商业条件，应另向权利人确认并获得许可。

此仓库中的课程改编不因为下列 MIT 代码而变成 MIT。项目新编代码目前没有由仓库权利人单独指定通用开源许可证；如需在上述许可证以外复用，请先确认授权。此说明不改变上游任何既有许可。

## 引入的真实 Skill

- **Machine Skill**，Air Supply Technologies Inc. (Airsup)，MIT，固定源 commit `e0bd066ac5beaf48512935de2fc0f0e55636853a`：[`licenses/MACHINE-MIT.txt`](../licenses/MACHINE-MIT.txt) 及 [`.claude/skills/machine/LICENSE`](../.claude/skills/machine/LICENSE)。本项目使用其 kit、脚本与示例；不可将其对代码的 MIT 授权扩展到课程内容。
- **Colorfigures**，April Zhu；基于 April Zhu 的 iso-glow 和 Tolga Cohce 的 iso-figure，MIT：[`.claude/skills/colorfigures/LICENSE`](../.claude/skills/colorfigures/LICENSE) 和 [`licenses/COLORFIGURES-MIT.txt`](../licenses/COLORFIGURES-MIT.txt)。本项目从声称为官方技能镜像的 [madearga/colorfigures](https://github.com/madearga/colorfigures) commit `3a520817c1cc4277954715e69d993e1f950da1b8` 取得；与官网当前 tar 的内容一致性**未验证**。来源和实际工作流详见 [SKILLS_USAGE.md](SKILLS_USAGE.md)。
- 两个自包含 HTML 均在文件内保留对应 MIT 版权及许可文字和教材归属信息；在分发整书时仍须附完整教材许可证及其他依赖许可。

## 其他依赖与字体

Three.js MIT：[`licenses/THREE-MIT.txt`](../licenses/THREE-MIT.txt)；KaTeX MIT：[`licenses/KATEX-MIT.txt`](../licenses/KATEX-MIT.txt)。DM Sans、Instrument Serif、IBM Plex Mono、Noto Sans SC 的 SIL OFL 1.1 文本分别见 `licenses/FONT-*-OFL.txt`。React、Vite、Lucide、Playwright 及其他 npm/Python 依赖使用各自包内声明的许可；请对发布所含依赖重新核验，`package-lock.json` 和 `requirements-lock.txt` 用于确定版本。

**Every Joule 仅作为体验/视觉方向参考**，未复制其代码、图像、音频或模型；不声称它对本项目提供授权。
