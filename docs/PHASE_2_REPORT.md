# Phase 2 — Core Development Report

Completed locally on `feature/phase-2-core-workout`, 2026-10-11. No push, pull request or merge was performed. Phase 3 has not started.

## Repository audit

The working tree was clean on `main`. Read `ARCHITECTURE.md`, `HANDOFF_TO_CODEX.md`, `FEATURE_ROADMAP.md`, package/config files, all domain types, stores, database, pages, shared components and avatar interfaces. The existing React/Vite/Zustand/Dexie architecture and dark Vietnamese RPG design were retained.

Baseline `npm.cmd run lint` and `npm.cmd run build` passed. The build already reported a large JS chunk. Findings: every store used fixture progress; workout weight/repetition cells were display-only; saves, measurements and goal edits were memory-only; settings had unchecked export and destructive demo reset; dashboard/history used fixture statistics and several hardcoded claims; there was no test runner or runtime backup validation, and strict TypeScript was not enabled.

## Implemented

- Non-destructive Dexie schema v2 migration; persistent profiles, reference exercise library, workout sessions, individual sets, PRs, measurements, goals and avatar/progression state. Local audit entries for entity edits, workout transactions and restore.
- New installations receive a level-1 neutral profile and exercise definitions, with empty workout/measurement/goal/quest progress. Exact legacy demo fixtures are retained and marked as demo; unknown/edited legacy records are preserved as real. Customized exercise definitions are never overwritten.
- Live database snapshots feed existing Zustand stores. The procedural 3D avatar, camera controls, design primitives, all seven routes and navigation remain. Avatar settings persist; no automatic biometric morphing.
- Workout creation, muscle-group/search filtering (including full body), exercise/set removal, editable kg/reps, completion toggles, editable name/date/split/notes, persistent drafts, refresh recovery, saved-workout editing and styled deletion confirmation. Edited drafts preserve the original until an atomic save. Invalid drafts keep the last valid saved version and display the error.
- Volume from completed sets; independent maximum-weight, reps-at-each-weight, per-exercise session-volume and Epley estimated-1RM PRs. Epley uses positive load and 1–10 integer reps. Warmups count toward volume/PRs; no assumed bodyweight load. PRs rebuild after edits/deletion.
- Atomic XP/level and unique calendar-day streak updates. Resaving awards the XP difference only; deletion reverses that workout's reward and rebuilds streak/records.
- Actual dashboard counts, completed-set totals, total volume, duration, recent workouts, exercise charts and PRs. Detailed workout history and exercise performance history are available on the workout/history pages. No data produces explicit empty states.
- Validated profile/measurement/goal forms; no invented measurement values. Versioned JSON export/restore supports v1 and v2. Restore validates nested shapes, enums, dates, numeric bounds, duplicate IDs and references before an atomic additive merge. Existing IDs win. Normalized sets/derived PRs rebuild; legacy PRs and audit entries are preserved. Demo reset has been removed.
- Strict TypeScript and Vitest + fake-indexeddb (the only new dependencies).

## Files

Created:

- `src/components/WorkoutHistory.tsx` — shared history, exercise chart and PR views.
- `src/services/db/DatabaseSync.tsx`, `defaults.ts`, `validation.ts`, `db.test.ts`.
- `src/services/workout/calculations.ts`, `calculations.test.ts`.
- `src/stores/useWorkoutStore.test.ts`.
- `src/test/setup.ts`, `fixtures.ts`; `vitest.config.ts`.
- `docs/PHASE_2_REPORT.md`, `docs/phase-2-dashboard.jpg`.

Modified:

- `package.json`, `package-lock.json`, `tsconfig.app.json`, `tsconfig.node.json`.
- `src/App.tsx`, `src/types/workout.ts`, `src/services/db/db.ts`.
- All five existing Zustand stores.
- All seven existing React pages.
- `src/components/ui/Modal.tsx` and the manual-mode label in `src/components/avatar/AvatarCanvas.tsx` (3D rendering unchanged).
- `README.md`, `docs/ARCHITECTURE.md`, `docs/HANDOFF_TO_CODEX.md`, `docs/FEATURE_ROADMAP.md`.

## Validation

- `npm.cmd run lint`: passed with no warnings.
- `npm.cmd run build`: passed; existing large-bundle advisory remains.
- `npm.cmd run test`: 39 tests passed in 3 files.
- Tests cover formulas/bounds, four PR categories/ties, empty/invalid input, persistence after database reconnect, queued store actions/drafts, safe migrations, round-trip/legacy/invalid backups, reference and conflict checks, transaction rollback, demo isolation, edits/deletions and XP idempotency.
- Browser smoke check: empty dashboard; exercise filter; create draft; edit kg/reps; mark completed; refresh/recover; complete 60 kg × 10 → volume 600 kg, Epley estimate 80 kg, 221 XP; edit to 70 kg × 10 → 700 kg/93.33 kg/225 XP; styled deletion confirmation; QA cleanup returns count/volume/XP/streak to zero. No application errors. Three.js emits its existing Clock deprecation warning.
- A timestamp-bound issue was found during the browser check, fixed, and covered by timestamped store fixtures. The native JavaScript confirmation was replaced by the existing styled Modal; the replacement was verified in-browser.

## Limits and operational notes

- Restore is intentionally additive: matching IDs are retained, including profile/avatar records. It does not replace newer local edits or provide conflict resolution. A backup from another installation can add another profile; the app currently uses the first non-demo profile, as a single-user application. A dedicated profile/conflict selector can be added later.
- Drafts autosave asynchronously. Wait for “Bản nháp đã lưu” before refreshing/closing. Invalid input is not persisted, and a pending/failed write triggers a browser exit warning. IndexedDB is scoped to browser profile and origin; changing localhost/127.0.0.1/port uses different storage.
- Exact unchanged demo fixtures can be identified during migration; the scaffold provided no provenance for edited records. Changed records are conservatively retained as real so actual user data is not lost. Demo rows remain available in backups; the progress UI excludes them.
- One active draft is shown/recovered. Simultaneous workout editing across multiple tabs is not supported as a collaboration workflow.
- PR rebuilds scan saved sessions; pagination/large-history optimization and bundle splitting are future performance work.
- No PWA/service worker, cloud backend, auth, external APIs or automatic InBody-to-avatar bridge were added. The local web server must serve app assets. Advanced quests/achievements, training-plan generation and nutrition calculations remain future work.

## Run locally (Windows)

Use Node.js 24 LTS and PowerShell:

```powershell
Set-Location D:\RPG
npm.cmd ci
npm.cmd run dev
```

Open the URL Vite prints (normally `http://localhost:5173`). Keep the same origin and browser profile for your saved records. Export JSON from Settings periodically. Production validation/preview:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run test
npm.cmd run preview
```

## Recommended Phase 3

Start with progressive-overload trends and clearly labeled PR notifications, then TDEE/macronutrient calculations and a carefully validated, explicitly illustrative InBody-to-avatar mapping. Add profile/backup conflict handling and larger-history performance checks before expanding RPG mechanics. PWA/rest timer and equipment/quest expansion remain in their later roadmap phases. These recommendations are not implemented in Phase 2.
