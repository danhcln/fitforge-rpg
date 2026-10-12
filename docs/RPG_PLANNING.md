# Phase 5 contracts: progression, planning and nutrition

## Progression ownership

Dexie version 4 adds `progressionEvents`, `trainingPlans`, `nutritionEntries` and `nutritionSettings`. Older tables and body records remain intact. The application still has one active local profile; legacy workouts have no user-owner field, so the migration associates their awards with the first real profile in stable database order. Other existing profiles retain their XP through their own baseline event.

Progression is derived from an append-only event ledger. Events record user, source ID, kind, revision, signed XP/gold deltas and timestamp. A unique deterministic primary key and a serial IndexedDB transaction prevent repeat awards on resave, refresh or simultaneous claims. Migration writes a baseline carry balance plus original completed-workout awards; it does not recalculate old `xpEarned` fields or reset profiles. Zero-award legacy workouts are supported. If a correction to inconsistent legacy balances would create debt, an explicit floor-adjustment event restores zero rather than withholding future earned XP.

Newly saved completed workouts earn `200 + min(200, round(completed volume × 0.035))` XP. Drafts earn zero. An edit appends only the difference from that session's ledger balance; deletion appends a reversal. Profile level and XP are recomputed from ledger totals. Level 1 costs 1,000 XP; each following level threshold is the prior threshold multiplied by 1.25 and rounded. General profile edits preserve ledger-controlled XP, level and gold.

Workouts, PRs, sets, progression, quest recalculation, plan completion corrections and the audit entry commit atomically. XP, Level, quests and rewards never feed `BodyCompositionToAvatar` or write to InBody readings or manual physique parameters.

## Quests and achievements

System quest IDs contain kind and local calendar period. Dates use the browser's local timezone; weeks run Monday–Sunday. Current periods refresh on startup, workout writes, restore and at date rollover while the app is open. Workout-based progress excludes demo, draft and future-dated records.

| Quest | Evidence | Reward | Limit |
| --- | --- | --- | --- |
| Workout day | One or more completed sessions on the date | 50 XP, 5 gold | Once per date; additional sessions do not increase quest reward |
| Weekly consistency | Three distinct training days in the week | 150 XP, 15 gold | Once per week; no consecutive-day requirement |
| Recovery | Explicit personal confirmation of recovery check-in | 30 XP, 5 gold | Once per week; no exercise or eating requirement |

Claims require the current period and a system-generated quest. Claimed workout quest awards are reconciled when workouts move or are deleted; losing the evidence reverses the award. Regaining it restores the same entitlement, never an additional claim. A recovery confirmation persists as a self-reported check-in. Missing a quest has no penalty.

Achievements recognize the first saved workout, a 5% increase over the first eligible estimated exercise 1RM, cumulative 10,000 kg volume without a deadline, and two weeks with three distinct training days each. Estimated 1RM retains Phase 2's Epley range of 1–10 repetitions. No achievement uses body measurements, calorie restriction, weight loss, or hydration quantity. New achievements grant cosmetic titles and accent colors, with zero XP/gold to avoid secondary load-chasing incentives.

An earned achievement's date and cosmetic entitlement remain in history after a workout correction; current progress can decrease. Unlocks are recorded once in the event ledger. History shows actual saved achievements and the most recent 50 progression events; the full ledger is in backups.

## Training calendar

One plan per user and Monday week uses a deterministic ID. Seven dated slots support Full Body (three sessions), Upper/Lower (four), Push/Pull/Legs (three) or Custom (initially rest slots). These are editable scheduling templates, not personalized training prescriptions. No exercise or load is automatically inferred. Users choose exercises, sets (1–10), reps (1–50) and load (0–500 kg), with zero load as a neutral starting input.

Templates and edits remain an explicit preview until Save. Saving a plan grants no XP. Opening a saved day creates incomplete workout sets and optional `planId`/`plannedDate` metadata. Finishing it on the planned date links the session atomically if the slot is free. Existing completed sessions can also be linked manually by date. Completed calendar slots cannot be reopened from the planner. A workout moved to another date or deleted clears its completion links; rest days remain separate.

Optional overload suggestions require two saved sessions with comparable completed non-warmup sets. The suggestion is one extra repetition at the same load, only below 30 reps. The user must explicitly choose the suggestion, review the draft and save it; nothing increases in a workout automatically. No physical outcome or timeline is promised.

## Nutrition journal and age policy

Each food/drink row records date, meal, name, portion description, optional protein/carbohydrate/fat grams, optional labeled energy and water quantity. Nullable nutrient inputs mean unknown rather than a guessed value. Daily and weekly summaries sum only known logged values, report missing coverage and do not represent the whole diet. Food logging, hydration and nutrition settings award no XP.

Age is an optional user-reported journal preference, independent from historical report ages. Unknown ages and users below 18 cannot enable energy entry. They receive balanced-nutrition education, and Goals hides restrictive calorie/macro and physique target creation controls. No calorie deficit, weight-loss target, macro prescription, TDEE calculator or physique optimization generator is implemented for anyone in this phase. Adult energy logging is opt-in and takes user-entered label data; it is not an estimated requirement. Existing historical energy facts remain stored but hidden if age/energy preferences no longer allow display. Editing other food fields can preserve such historical values without generating new energy entries.

Balanced-food variety, regular meals, sleep/recovery and water guidance is static and works offline. The educational source is [CDC: healthy routines for children and teens](https://www.cdc.gov/healthy-weight-growth/tips-parents-caregivers/index.html), checked on 2026-10-12. It is linked as optional reading; there is no API call. Hydration reminders are optional in-app text, with no required volume, notification permission or reward for drinking more. No gain/loss timeline is guaranteed.

## Cosmetics and compatibility

Character rewards update only profile title or `appearance.accentColor`, and preserve character morphs, manual previews, measurements and other customization. The Phase 4 geometry and mapping are unchanged. Rendering uses the requested lightweight shirtless/shorts base with existing colors; old clothing enum values remain stored/readable for backward compatibility but do not create a clothing system in Phase 5.

## Backup and validation

JSON export version 4 includes the four new tables and all prior logical tables. Restore still supports versions 1–3, reconstructs set/PR rows, and preserves existing IDs. New table validation checks exact shapes, finite bounds, dates, enums, user/exercise references, complete seven-day calendars and optional energy settings. Version-4 ledger totals must agree with backed-up profiles and source entitlements before any write. Invalid backups fail atomically.

During merge, existing destination rows win. Event revisions for an already-present workout/quest source are skipped to prevent stale backups from undoing current corrections. New workout sources receive their saved entitlement once. The migration bridge accounts for older backups without a ledger. New source rows and their events are merged in one transaction; derived quests, XP and PRs are refreshed afterward. No deletion or reset occurs during migration/restore.

Backups containing Phase 5 fields require Phase 5 or later to restore. Storage remains scoped to browser profile and origin. The application serves assets locally; service workers, cloud sync, background notifications and large-history optimization remain outside this phase.
