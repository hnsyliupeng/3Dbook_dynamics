---
name: mechanics-book-builder
description: Build a source-traceable, physically validated interactive analytical-mechanics lesson with a synchronized browser book, 3D model and figures. Use when adding a lesson from this project's pinned textbook.
---

# Mechanics Book Builder

Work from evidence, not plausible animation. The source is UNLaM `ComputationalAnalyticalMechanics` at the commit in `content/manifest/source-manifest.json`; read `docs/SOURCE_MAPPING.md`, `docs/LICENSES.md`, `docs/ARCHITECTURE.md` and `docs/PHYSICS_VALIDATION.md` first. This skill orchestrates a lesson; it does not replace the real Machine or Colorfigures skills.

## Required workflow

1. **Audit first.** Check out the exact source commit. Run `npm run audit`, `npm run build:lessons`, `npm run extract:equations` in the documented Python environment. Read the relevant original Notebook cells and identify inputs, coordinates, units, initial conditions, constraints, equations and outputs; run the source notebook where feasible. Record cell indices and hashes, not invented IDs. Treat the manifest's AST/TeX results as *unreviewed candidates*.
2. **Declare scope.** Separate Source-derived, Adapted and Extended work. Resolve sign conventions and source inconsistencies explicitly. Never fill missing textbook equations or initial values with guesses.
3. **Specify the model.** Implement a `PhysicsModel`, validity assumptions and dimensionally consistent forces. Add analytic/SymPy reference where possible and a genuinely independent numerical comparison. Define finite observation/event behavior and what happens at a boundary. Do not disguise friction, impacts, pulley inertia or slack as an ideal model.
4. **Compile the lesson.** Register a validated lesson in `src/lessons/` with source refs and a DAG of understandable derivation steps, variable-to-object bindings, numerical substitutions, exercises and tests. Unreviewed entries remain catalog-only.
5. **One clock.** Only `TimelineController`/`SnapshotStore` advances physical state. Forward/back step, seek, parameter reset, mode switches, page turns and replay must resolve to the same snapshot. Separate visual entrance effects from physical time. Add a properly versioned, source/origin-checked protocol for any iframe.
6. **Actually use both skills.** Read `.claude/skills/machine/SKILL.md` and `.claude/skills/colorfigures/SKILL.md`, their kit/API and examples; construct and run real artifacts using their scripts, save provenance and license, and feed main-book adapters from the shared state. Report if native skill dispatch or an official distribution is unavailable. Never claim an unrun video, review, solver or performance result.
7. **Visual review.** Capture each actual case: initial view, changed parameter, boundary and both modes. Inspect frames for impossible intersections, disappearing parts, unreadable labels and poor mobile layouts. Fix and retest; do not use old debug shots as current evidence. Record missing views, FPS limits and any incomplete prescribed skill-review rounds.
8. **Verify and deliver.** Run Vitest, Playwright and Python references, save machine-readable results, document all failures, mapping and licenses. Keep textbook clones/dependencies/build output out of git. Commit/push only as explicitly authorized and report the actual result. The original course is CC BY-NC-SA 4.0; Machine/Colorfigures MIT licenses do not remove the textbook's noncommercial/share-alike terms.
