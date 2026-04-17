# Nishkriti — Build Status

**Last updated:** 2026-04-17
**Current phase:** B (Engine) — 🟡 implementation complete, PR #2 in draft
**Next phase:** C (Design system)
**Current branch:** `phase-b/engine` → draft PR #2 (https://github.com/NishkritiCure/nishkriti-app/pull/2)

---

## 1. Phase roadmap

| Phase | Brief                | Status                                       |
| ----- | -------------------- | -------------------------------------------- |
| **A** | `EB-A-foundation`    | ✅ merged (#1, squash at `4cc0bac`)          |
| **B** | `EB-B-engine`        | 🟡 **PR #2 draft, CI green, awaiting merge** |
| **C** | `EB-C-design-system` | ⏳ pending                                   |
| **D** | `EB-D-patient-shell` | ⏳ pending                                   |
| **E** | `EB-E-doctor-shell`  | ⏳ pending                                   |
| **F** | `EB-F-prescription`  | ⏳ pending                                   |
| **G** | `EB-G-integration`   | ⏳ pending                                   |
| **H** | `EB-H-learning`      | ⏳ pending                                   |
| **I** | `EB-I-polish`        | ⏳ pending                                   |

---

## 2. Phase B — Engine (🟡 complete, awaiting merge)

### 2.1 What it produced

Fallback TypeScript rule engine at `src/engine/` — pure library, zero IO, runs when the Python backend is unreachable and produces a daily plan for the doctor's approval queue.

**Modules (9 files, ~1 700 lines of engine code):**

- `types.ts` — canonical type surface. `GeneratedPlan` exactly matches the `plan` body of `POST /v1/daily-plans/fallback-submit` (10 snake_case fields per MOCK-DATA-SPEC.md Part 2).
- `engineConfig.ts` — `mergeEngineLayers` with CSS-cascade semantics, primary-condition priority, and version-ID pass-through into `MergedRules.version_snapshot`.
- `ruleEvaluator.ts` — data-driven rule interpreter with `window_days` guards, aspirational-rule gating by `data_source`, per-metric rule-group exports for TESTING-STRATEGY §3.1 test layout.
- `macroCalculator.ts` — Mifflin-St Jeor BMR → TDEE multipliers → 10 diet-type splits → carb adjustment with `ABSOLUTE_MIN_G` (20) + `CRITICAL_FLOOR_G` (30) + diet-type override cascade.
- `mealSelector.ts` — 12-step filter pipeline + patient-seeded SHA-256 variety hash (`js-sha256`, RN-safe).
- `exerciseSelector.ts` — rest-day triggers + difficulty cap + patient-seeded pick 3 + intensity/duration/type + post-meal walks + water target.
- `reasoningBuilder.ts` — doctor-facing + patient-facing reasoning; locale-free output for Python-engine parity.
- `adaptiveEngine.ts` — `generate(inputs)` orchestrator. Returns `EngineResult` envelope: `{ plan, reasoning, rules_fired, engine_version_snapshot, doctor_flag_raised, doctor_flag_reason? }`. Enforces 7 safety invariants from APP-ENGINE-CONTEXT §14 before return; throws typed `EngineError` codes on violation.
- `index.ts` — barrel export.

**Service layer extension:** `EngineError` now carries a typed `engineCode: EngineErrorCode` so phase-d's `engineService` can map codes to user-safe messages without string parsing.

**New dependency:** `js-sha256@0.11.1` (pure JS, zero transitive deps, RN-safe).

### 2.2 Tests

- **272 tests total** — 271 passing, 1 parity skipped (awaiting backend fixture artifact).
- Boundary-value catalog from TESTING-STRATEGY §3.3 covered below / at / above for every band (FBS, BP, weight delta, energy, sleep, adherence).
- 10 diet types × hand-calculated macro expectations (`__tests__/macros.test.ts`).
- Full meal + exercise filter pipeline coverage (fallback chain, difficulty cap, rest-day triggers, allergies, cuisine soft filter, safety invariants).
- **21 golden JSON fixtures** at `src/engine/__tests__/fixtures/engine/*.json` covering every scenario required by TESTING-STRATEGY §3.6.
- Parity harness at `integration/parity.test.ts` gated by `ENGINE_PARITY_ARTIFACT` env var.

### 2.3 Commits on `phase-b/engine`

```
9939b7e feat(engine): implement 6-module fallback rule engine with 100% coverage
244f8bd feat(engine): add canonical type surface + js-sha256 dep
(branched from 4cc0bac — phase-a merged to main)
```

### 2.4 Quality gates (all green)

| Gate                         | Status                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm tsc --noEmit`          | ✅ strict + `exactOptionalPropertyTypes`                                                                                        |
| `pnpm eslint .`              | ✅ zero errors, zero warnings                                                                                                   |
| `pnpm prettier --check .`    | ✅ clean                                                                                                                        |
| `pnpm vitest run`            | ✅ 271 pass / 1 skip / 272 total                                                                                                |
| `pnpm vitest run --coverage` | ✅ **engine 100%** on lines/statements/functions/branches (CI threshold)                                                        |
| CI workflow on PR #2         | ✅ 4/4 required checks pass (secret-scan, lint-and-typecheck, unit-and-integration, build-check) + maestro skipping as designed |

### 2.5 EB-B §6 exit criteria

- [x] All 6 engine modules compiled and exported from `src/engine/index.ts`
- [x] `GeneratedPlan` type matches MOCK-DATA-SPEC.md Part 2 fallback-submit `plan` body exactly
- [x] `engineConfig.mergeEngineLayers` returns merged rules AND preserves source version IDs for `engine_version_snapshot`
- [x] `adaptiveEngine.generate()` returns the full EngineResult envelope phase-d will POST
- [x] Every rule tested at exact boundary values (below / at / above)
- [x] Every diet type has a macro test with hand-calculated expectations
- [x] Meal selector filter + fallback chain fully tested
- [x] Exercise selector + rest-day triggers fully tested
- [x] ≥ 20 golden fixtures committed and passing (21 present)
- [x] Parity suite wired up (placeholder in place, skip-when-artifact-missing gate)
- [x] Engine branch coverage = 100% — enforced by vitest.config.ts threshold
- [x] `pnpm tsc --noEmit` and `pnpm eslint .` pass
- [x] Engine has zero dependencies on React, Expo, or any IO module
- [x] BUILD-STATUS.md updated (this file)
- [ ] **Simplify Security Reviewer passes** — runs at PR ready-for-review time
- [ ] **PR #2 merged to `main`**

### 2.6 Outstanding dependency on backend

The Python backend must publish `engine-fixtures-v{n}.json.zip` from its CI so `parity.test.ts` can cross-check TS output vs Python output per APP-ENGINE-CONTEXT §18. Gate: `ENGINE_PARITY_ARTIFACT` env var at the artifact path. Harness is fully scaffolded — no app-side code changes needed once backend publishes.

### 2.7 Review notes

A consolidated multi-perspective review (8 reviewer agents, 3 P0 / 11 P1 / 20 P2 / 18 P3 findings) lives at `.claude/PRPs/reviews/pr-2-phase-b-engine.md` for future reference. The findings were deferred by the product owner — none are currently blocking merge.

---

## 3. What's left to close Phase B

1. **Flip PR #2 from draft → ready for review**
2. **Run Simplify Security Reviewer (AgentShield)** — per CLAUDE.md, required before merge to `main`
3. **Merge PR #2** (squash, per phase-a convention — one commit per phase on main)
4. **Branch `phase-c/design-system` from fresh `main`** to start phase-c

That's it. The engine itself is exit-criteria-complete. Everything blocking merge is procedural, not code.
