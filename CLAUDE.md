# Nishkriti App — Builder Instructions

You are working inside the **builder** instance for the Nishkriti mobile app. Planning, design, and specifications are produced by a separate planner instance and live in `/Users/anand/Code/new-nishkriti-app/documents/`. Your job is to execute one phase at a time according to its execution brief.

## Canonical paths

| Path                                                                    | Purpose                                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `/Users/anand/Code/new-nishkriti-app/nishkriti-app/`                    | This project. The Expo + TypeScript app.                           |
| `/Users/anand/Code/new-nishkriti-app/documents/specs/`                  | Authoritative specs. **Read these — never modify them from here.** |
| `/Users/anand/Code/new-nishkriti-app/documents/specs/execution-briefs/` | One brief per phase (EB-A through EB-I).                           |
| `/Users/anand/Code/new-nishkriti-app/audit/`                            | Phase 1 reverse-engineering docs (reference only).                 |

## Spec map (read before doing X)

Before doing X, read Y first. Read **only** the sections relevant to your phase — don't burn context on the whole spec set.

| Doing...                                        | Read first                                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Anything in `src/services/supabase.ts` or auth  | `documents/specs/SECURITY-SPEC.md` §2 (auth) and `documents/specs/DATA-LAYER.md` §2            |
| Engine work (`src/engine/**`)                   | `documents/specs/APP-ENGINE-CONTEXT.md`, `documents/specs/ARCHITECTURE.md` §1.1 (constraint 4) |
| TanStack Query hooks                            | `documents/specs/DATA-LAYER.md` §5                                                             |
| Zustand stores                                  | `documents/specs/DATA-LAYER.md` §6                                                             |
| Realtime subscriptions                          | `documents/specs/DATA-LAYER.md` §7                                                             |
| Forms / validation                              | `documents/specs/SECURITY-SPEC.md` §4                                                          |
| File uploads                                    | `documents/specs/SECURITY-SPEC.md` §3 (PHI) and `documents/specs/APP-API-SURFACE.md` §6        |
| Tests                                           | `documents/specs/TESTING-STRATEGY.md` (full document for first pass)                           |
| CI / quality gates                              | `documents/specs/TESTING-STRATEGY.md` §8–10 and `documents/specs/ARCHITECTURE.md` §8           |
| Anything touching the doctor approval invariant | `documents/APP-CONTEXT.md` §2 (re-read every time)                                             |

## Hard rules — violations are merge blockers

1. **Doctor approval is enforced at the database via RLS.** The app trusts RLS — never client-side bypasses. See `APP-CONTEXT.md` §2.
2. **JWT tokens live ONLY in `expo-secure-store`.** Never `AsyncStorage`. Not even as a fallback. Not even for testing. Phase 1 had this bug — do not reintroduce it.
3. **Zero `as any`. Zero `@ts-ignore`.** TypeScript strict mode is non-negotiable. Use `unknown` and narrow.
4. **No direct `@supabase/supabase-js` imports outside `src/services/supabase.ts`.** Enforced by ESLint `no-restricted-imports`.
5. **No direct `fetch` outside `src/services/apiClient.ts`.** Enforced by ESLint `no-restricted-syntax`.
6. **`SUPABASE_SERVICE_ROLE` must NEVER appear in this repo** — backend-only. Enforced by ESLint regex.
7. **`.env.local` is gitignored. `.env.example` is committed with empty values.**
8. **PHI never reaches `console.log`, analytics events, error reports, or deep links.** See `SECURITY-SPEC.md` §3.

## Commit convention

Conventional Commits with a scope from this whitelist (enforced by `commitlint`):

```
engine, queue, auth, ci, deps, test, design, a11y, data, agents, chore, scaffold, docs
```

Examples:

- `feat(engine): add rule 23 for post-meal BP threshold`
- `fix(queue): restore optimistic approval on 5xx retry`
- `chore(scaffold): init expo project`
- `chore(deps): install runtime and dev dependencies`
- `test(data): add smoke test for supabase client import`

## Quality gates (every PR)

Before opening a PR to any phase branch:

```bash
pnpm tsc --noEmit         # TypeScript strict
pnpm eslint .             # zero errors, zero warnings
pnpm prettier --check .   # zero formatting deltas
pnpm vitest run           # all tests pass
```

Pre-commit hook runs `lint-staged` + `tsc --noEmit` automatically. **Do not bypass with `--no-verify`** unless a hook itself is broken — fix the underlying issue first.

## Branching

- `main` — protected, deployable.
- `phase-{letter}/{name}` — long-lived branch per execution brief.
- Short-lived topic branches inside a phase: `phase-{letter}/{name}-{topic}`.
- Phase branch merges to `main` only when its EB exit criteria are green AND the Simplify Security Reviewer (Anthropic) has passed.

## Deferred decisions (resolve in the listed phase)

| Decision                          | Phase             | Notes                                                                                                                                                                                                                                                       |
| --------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useCheckInStore` PHI persistence | phase-d           | Spec recommends clear-on-background instead of `AsyncStorage` to avoid PHI on disk. See `SECURITY-SPEC.md` §3.3 and `DATA-LAYER.md` §6.2. The store itself doesn't exist yet (not listed in EB-A §4.2); decide when phase-d implements the check-in wizard. |
| Sentry wiring                     | phase-g           | `errorService.ts` currently logs to `console.error`. Wire Sentry SDK with `beforeSend`/`beforeBreadcrumb` PHI scrubbing per `SECURITY-SPEC.md` §3.4.                                                                                                        |
| Real `database.types.ts`          | phase-a (revisit) | Currently a permissive placeholder. Regenerate via `pnpm run types:db` once the dev Supabase project schema is finalized.                                                                                                                                   |
| Reanimated babel plugin           | phase-c           | If/when the design system uses gestures or animated components, add `react-native-worklets/plugin` to `babel.config.js`.                                                                                                                                    |

## Phase-by-phase order

A → B → C → D → E → F → G → H → I

Each phase has an execution brief at `documents/specs/execution-briefs/EB-{letter}-{name}.md`. Read the brief end-to-end before starting. Do not pull work from future phases.

## Slash commands & ECC tooling

This builder runs through Claude Code with the `everything-claude-code` plugin installed. Useful skills/commands:

- `/code-review` (or invoke `code-reviewer` agent) before opening a PR
- `/security-scan` (AgentShield) — required before merging to `main`
- `database-reviewer` agent — invoke for any RLS/schema PR
- `typescript-reviewer` agent — invoke for any non-trivial TS change

## What this phase (A) produced

Phase-a built the substrate, not features. Specifically:

- Expo SDK 54 scaffold with TypeScript strict mode
- Supabase client with `expo-secure-store` adapter (per DATA-LAYER §2.1)
- Zustand `useAuthStore` (full), `useThemeStore` (full), `useConnectivityStore` (stub) per DATA-LAYER §6
- Theme tokens scaffold with `ThemeContext` (real palettes land in phase-c)
- Typed error classes + PHI-scrubbing logger in `errorService.ts`
- ESLint, Prettier, TypeScript strict, Vitest, Husky, commitlint all wired
- CI workflow with lint+typecheck → unit+integration → build-check → maestro (gated)
- Smoke test that asserts the Supabase client is importable

Phase-a does **not** produce screens, navigation, components, engine code, or services beyond the stubs in EB-A §4.2.
