# Nishkriti — Build Status

**Last updated:** 2026-04-18
**Current phase:** C (Design system) — 🟡 implementation complete, PR #3 ready for review
**Next phase:** D (Patient shell)
**Current branch:** `phase-c/design-system` → PR #3

---

## 1. Phase roadmap

| Phase | Brief                | Status                                                                  |
| ----- | -------------------- | ----------------------------------------------------------------------- |
| **A** | `EB-A-foundation`    | ✅ merged (#1, squash at `4cc0bac`)                                     |
| **B** | `EB-B-engine`        | ✅ merged (#2, squash at `2275f85`) — followup debt tracked below       |
| **C** | `EB-C-design-system` | 🟡 **PR #3 ready** — 55 components, 585 tests, AgentShield run (see §6) |
| **D** | `EB-D-patient-shell` | ⏳ blocked on phase-b-followup landing (see §3)                         |
| **E** | `EB-E-doctor-shell`  | ⏳ pending                                                              |
| **F** | `EB-F-prescription`  | ⏳ pending (scope shifted to audio upload per `BACKEND-CONTRACT.md`)    |
| **G** | `EB-G-integration`   | ⏳ pending                                                              |
| **H** | `EB-H-learning`      | ⏳ pending                                                              |
| **I** | `EB-I-polish`        | ⏳ pending                                                              |

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

## 3. Phase-B followup debt (must land before Phase D)

PR #2 merged with known findings from the multi-perspective review at [.claude/PRPs/reviews/pr-2-phase-b-engine.md](.claude/PRPs/reviews/pr-2-phase-b-engine.md). A `phase-b/followup` branch will land the items below **before Phase D begins** (Phase D is the first consumer of the engine wire contract, so the shape has to be stable before it writes a line of code).

### Blockers for Phase D

- **P0.1 — Hardcoded rule IDs → tags.** Add `tags: readonly string[]` to `ProtocolRule`, migrate `DR002/DR003/DR004/DR005/PC002/PC003` literals in `adaptiveEngine.ts`, `macroCalculator.ts`, `mealSelector.ts` to tag branches. Preserves the "90% JSONB-only changes" design invariant.
- **P0.2 — PHI leakage paths.** Strip rendered biomarker templates from `doctor_flag_reason`, `PostMealWalk.reason`, safety-invariant error messages, and `calculateAge` errors. Expand `PHI_KEY_PATTERN` in `errorService.ts` to cover `doctor_flag_reason`, `energy_level`, `hip_cm`, etc.
- **P0.3 — Split `GeneratedPlan` (wire, IDs-only) vs `HydratedPlan` (UI, embedded).** Engine emits `meal_id` / `exercise_ids[]`; Phase D hydrates from the TanStack library cache. Also requires a corresponding edit to `documents/specs/MOCK-DATA-SPEC.md` Part 2 (`POST /v1/daily-plans/fallback-submit` `plan` body). **The MOCK-DATA-SPEC edit requires a backend-planner handshake** — the planner will raise the proposed shape through the user before changing the spec.

### Not blocking Phase C

Phase C is pure view components. They accept hydrated shapes and never import engine types. The P0.3 change is transparent to everything built in Phase C.

### Optional in followup, welcome if scope permits

- P1.1 (`window_days` guards on `bpAvg`/`adherenceCount`), P1.2 (null-energy default), P1.3 (diet-preference fallback), P1.4 (discriminated `ProtocolRule`), P1.5 (version_snapshot staleness), P1.6 (`roundHalfUp` TS/Python parity), P1.7 (3 regression tests), P1.8 (`hasBannedIngredient` Set hoist), P1.11 (dead `isRestDay` branch).

---

## 4. Procedural requirement carried into PR #3

- **AgentShield / Simplify Security Reviewer was skipped for PR #2** — product owner accepted the tradeoff. It is a **non-negotiable merge gate for PR #3 (Phase C)**. Run the `security-reviewer` agent or the `/security-scan` skill, paste findings into the PR body, resolve any Critical/High before merge. Documented as an exit criterion in `EB-C-design-system.md` §6.

---

## 5. Open decision for the backend planner (via the user)

- **P0.3 wire shape.** Propose: change `MealPlanEntry.item: MealLibraryRow` → `MealPlanEntry.meal_id: string` + `meal_external_id: string`; `WorkoutPlan.exercises: ExerciseLibraryRow[]` → `WorkoutPlan.exercise_ids: readonly string[]`. Rationale: 15–25 KB wire bloat per plan, staleness risk between fetch and submit, and coupling between engine and library internals. The hydrated shape lives on the client (`HydratedPlan` with embedded rows), not in the wire contract. **Awaiting backend-planner sign-off before amending MOCK-DATA-SPEC Part 2.**

---

## 6. Phase C — Design System (🟡 PR #3 ready)

### 6.1 What it produced

Complete theme + component library for all subsequent phases. Everything in
`EB-C-design-system.md` §4.2 in-scope list is implemented, tested, and
exported through `src/components/index.ts` so phase-d/e consume it as a
single dependency.

**Theme** (`src/theme/`):

- `colors.ts` — flat Phase-1 token set, light + dark. Key parity enforced by
  test. `ink2`/`ink3` + light-mode semantic colours nudged from Phase-1 to
  pass WCAG AA on the darker card surfaces — inline comments record exactly
  which values moved and why.
- `typography.ts` — 16 named text styles per APP-DESIGN-REFERENCE §4 (Lora
  italic + medium for display/headings, DM Sans for body, DM Mono for
  labels). `scaleFont()` caps at 1.5× for dynamic-type survivability.
- `spacing.ts` — 4-point grid identity map.
- `radius.ts` — `{ none, sm, md, lg, xl, pill }`.
- `shadows.ts` — `card` + `phone` elevation tokens.
- `motion.ts` — durations + cubic-bezier easings as plain data (decoupled
  from Reanimated at module-load time).
- `createStyles.ts` — hook factory, memoised per theme identity.
- `ThemeContext.tsx` — renamed `theme.colors → theme.palette` per EB-C §4.1;
  exposes `mode` + `setMode` for consumers.
- `brand.ts` — non-reactive brand assets (logo gradient stops, SVG path
  data, viewBox) so the "no hex literals outside src/theme" rule stays
  global.
- `__tests__/colors.test.ts` — CI gate: text-on-surface contrast matrix,
  WCAG AA minimum, tested per palette.

**Hooks** (`src/hooks/`):

- `useReducedMotion.ts` — wraps `AccessibilityInfo` with a listener so
  every animated component can collapse to static variants.

**Components** (`src/components/`): 55 components + barrels.

| Folder        | Count | Notables                                                                                                                                               |
| ------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `branding/`   | 2     | NishkritiLogo (4-stop gradient, crosshair mask, Reanimated 4 pulse), ECGPulse (6-step cycle per §7.4, reduced-motion aware).                           |
| `primitives/` | 13    | Button, Text, Card, Input, Checkbox, Switch, Badge, Tag, Avatar, IconButton, Stepper, PriorityBadge, OriginBadge.                                      |
| `molecules/`  | 14    | FieldRow, MetricCard, StatusPill, Pill, Toast, ToastHost, Divider, Spacer, SectionCap, ReasoningBox, NSlider, ThemeToggle, WizardStepper, BannerAlert. |
| `layout/`     | 4     | Screen, Section, SafeScreen, KeyboardAvoidingScreen.                                                                                                   |
| `feedback/`   | 11    | Skeleton + 6 per-screen variants, EmptyState, ErrorState, LoadingState, ErrorBoundary.                                                                 |
| `modals/`     | 5     | ConfirmSheet, InfoSheet, DrillDownModal, BatchApproveSheet, MealSwapPicker.                                                                            |
| `composites/` | 10    | CheckInStep, MealCard, SupplementRow, ApprovalQueueCard, PatientRosterRow, ExerciseCard, MessageBubble, ProgressTimelineRow, PhaseCard, ChartCard.     |

**Dev-only surface** (`src/screens/dev/`):

- `KitchenSinkScreen.tsx` — visual catalogue of every component in both
  light and dark mode, wired through `RootNavigator` via a dynamic
  `require(...)` behind `__DEV__` so Metro's production dead-code
  elimination drops the entire module graph (including fixture strings).

**ESLint guardrails added:**

- Hex-colour-literal ban outside `src/theme/**` and test files.
- `src/components/**` cannot import from `@/engine`, `@/services`,
  `@/queries`, or `@/stores` (with a narrow escape for test files).
- `no-console` is now `error` globally, with one narrow override for
  `src/services/errorService.ts` (the intentional logging surface that
  phase-g wires to Sentry).

### 6.2 Test harness notes

Vitest + jsdom for component tests (opt-in via
`// @vitest-environment jsdom` directive per file). `react-native` aliased
to `react-native-web` for the vitest module graph only — production Metro
bundle is unaffected. Inline Reanimated mock in `__tests__/setup.rn.ts`
plus a local `__tests__/__mocks__/react-native-safe-area-context.tsx` stub
(the real package ships Flow-annotated source that Vitest cannot parse).

### 6.3 Quality gates (all green)

| Gate                      | Status                                                                 |
| ------------------------- | ---------------------------------------------------------------------- |
| `pnpm tsc --noEmit`       | ✅ strict + `exactOptionalPropertyTypes`                               |
| `pnpm eslint .`           | ✅ zero errors, zero warnings                                          |
| `pnpm prettier --check .` | ✅ clean                                                               |
| `pnpm vitest run`         | ✅ 585 tests (584 pass, 1 engine-parity skip carried from phase-b)     |
| Component test coverage   | ✅ ≥ 4 tests per component across primitives/molecules/composites/etc. |
| Colour-contrast CI gate   | ✅ every text-on-surface pair passes WCAG AA 4.5:1 in both palettes    |
| A11y matrix test          | ✅ dynamic-type cap, reduced-motion, touch-target audit                |

### 6.4 EB-C §6 exit criteria

- [x] Every in-scope component built and exported from the barrel
- [x] No Phase-F-deferred component (PrescriptionUploadCard, ExtractionReviewForm) built
- [x] Every component has a test file with ≥ 4 tests
- [x] Light + dark snapshots committed for every component with a themed appearance
- [x] NishkritiLogo + ECGPulse use Reanimated 4 and respect `useReducedMotion`
- [x] Kitchen-sink screen renders every in-scope component, gated behind `__DEV__`
- [x] Contrast-ratio test passes for every text-on-surface pair (CI-blocking)
- [x] Every interactive element has `accessibilityLabel` + `accessibilityRole`
- [x] Touch targets ≥ 44pt enforced at component level
- [x] Dynamic-type scale helper verified in a11y matrix (caps at 1.5×)
- [x] Reduced-motion behaviour verified in a11y matrix
- [x] No component imports `@/engine`, `@/services`, `@/queries`, `@/stores`
- [x] AgentShield / Simplify Security Reviewer run; 2 High findings resolved (PHI-free default a11y labels, `no-console` tightened); 2 Medium tracked as followups
- [x] BUILD-STATUS.md updated (this file)
- [ ] PR #3 merged to `main`
- [ ] Manual VoiceOver + TalkBack smoke noted in PR body

### 6.5 Followup debt deferred out of Phase C

- **M3 (reviewer Medium #3)** — `useThemeStore` persists via `AsyncStorage`
  but its ESLint ban is per-file; add a `src/stores/**` guard that flags
  AsyncStorage on any store file except the theme store, so future
  PHI-containing stores can't silently land on unprotected storage.
- **M4 (reviewer Medium #4)** — already mitigated by the dynamic-require
  for `KitchenSinkScreen`; leave a reminder in phase-d/e to keep dev-only
  routes behind the same pattern.
- Both findings are low-risk and non-blocking. Tracked for phase-g (the
  security-hardening pass).
