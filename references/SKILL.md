---
name: mechanics-anatomy-case-author
summary: Convert ONE verified source notebook case into one model-driven, synchronized Anatomy-style 3D Book page.
---

# Mechanics Anatomy Book · Case Author Skill

## Source gate
1. Read entire upstream `.ipynb` notebook; group contiguous markdown, figures, code and outputs by individual exercise.
2. Create unique `caseId`, exact source path and cell ids; distinguish theory cells from worked problems.
3. Extract body geometry, supports, constraints, loading, initial/boundary conditions, dimensions and units. Mark uncertainty; never invent original-case values.
4. Build the mathematical model as a pure function `solve(params, t)` before rendering anything. Add `precompute(params, dt)` to obtain numerical state samples and event jumps.
5. Validate with original notebook output, dimensional analysis, conservation and residual checks. **Do not** proceed to verified status if mismatched.

## Animation and derivation contract
- `derivationScript[]` has `{stepId,tStart,tEnd,latex,parts,highlight,visual:{highlightObjects},narration,detail}`.
- `timeSeries[]` contains physical state for fixed `t` and clearly denotes event discontinuities.
- One authoritative `SyncController` maps elapsed time to state interpolation, formula step, highlights and gauges. No independent CSS animation or separate timer for physics.
- `ParameterBus` recalculates a complete new snapshot and preserves normalized progress.
- 3D structures use named parts, real boundary constraints, camera orbit, orthographic/perspective and optional cut/explode. Diagram magnification must be explicitly labeled.
- PBR/hand-ink material choice affects appearance, not physics.
- Overlay: step buttons + mechanism window + live quantitative gauges + one sentence of mechanism insight.
- Offer bidirectional tag-to-term selection, accessible keyboard navigation, pure text mode.
- Deterministic `seek(t)` and `?render` mode permit frame-by-frame capture.

## Mandatory automated acceptance
- Source inputs and outputs exactly matched.
- For every step, every `highlight` tag has a named visible element in scene.
- Scrub 0-100% across steps; check equation, scene, gauges and plot index.
- Verify time-dependent values against numerical differentiation / conservation and boundary conditions.
- Vary each parameter across min/mid/max and recheck validity + current normalized progress preservation.
- Check geometry correctness and constraints (e.g., pin vs roller, pulley rope length, no penetration).
- Render midpoint of every step in a browser and inspect text clipping; analyze frame-to-frame pixel change for jumps.
- Produce `.html`, `.json`, PNG stills, `.mp4` optional, and a machine-readable QA report.

Never mark an AI-inferred topic prototype as a verified reproduction of a specific upstream exercise.
