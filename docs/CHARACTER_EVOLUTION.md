# Phase 5 compatibility update — 2026-10-12

The Phase 4 mapping and geometry remain intact. Phase 5 adds earned cosmetic title/accent hooks and renders a lightweight shirtless/shorts base; legacy clothing choices remain stored but are not rendered as complex clothing. Database/backup version is now 4. See [RPG_PLANNING.md](RPG_PLANNING.md) for persistence/reward semantics. Earlier Phase 4 contracts below describe their implementation-time version and remain applicable to physique ownership and normalized mapping.

# Character evolution contract — Phase 4

## Sources and ownership

`BodyCompositionToAvatar` v1 remains the Phase 3 source of current and goal mappings. `services/character/evolution.ts` adapts its seven normalized proxies into renderer parameters. These are artistic scales, not physiological norms, exact anatomy, or future predictions. Segmental lean includes more than muscle. Missing readings use the existing neutral mapping and are disclosed in the interface.

Current Body uses the latest actual measurement by date, then ID for equal dates. A live Dexie update recomputes the visualization after a measurement is saved or edited. Selecting an earlier checkpoint changes only a transient preview ID. Comparison uses two immutable saved records and displays right minus left differences for weight, SMM, PBF, fat mass and calculated BMI. Deleted selections fall back to latest. The Dashboard always uses latest rather than the Character page's historical selection.

Goal Preview uses the selected body goal from the Phase 3 `goalBodies` mapping. Unspecified target readings retain Phase 3 semantics; no selected goal gives a neutral preview. The interface labels this as a hypothetical simulation with no guaranteed outcome. Goal selection and historical selection are session preferences; reloading returns to latest/default goal selection.

## Persistence and compatibility

`CharacterState.visualSource` is an optional persisted `measurement | manual` preference, defaulting to measurement for older records. Existing `currentBody` and `goalBody` remain independent manual previews. Returning to measurement visualization does not destroy these previews. Manual reset copies the active derived mapping into the manual preview only. No character action writes to `bodyMeasurements`, goals, workouts or XP.

`CharacterState.appearance` stores preset, skin/clothing/accent colors and training/suit/shorts variation. Presets change appearance only. Older characters use Forge appearance without overwriting their saved fields. Optional normalized fields extend `BodyMorphParameters`; legacy fields remain supported. The seven normalized parameters are `overallVolume`, `upperBodyMuscle`, `lowerBodyMuscle`, `armProportion`, `legProportion`, `trunkProportion`, and the existing `fatMorph`.

Dexie schema and JSON backup version remain 3: no tables, keys or indexes change, and no migration rewrites existing records. Validation accepts optional Phase 4 fields, enforces enums and hex colors, and rejects non-finite or out-of-range saved values. Old backups remain readable. A backup containing new character fields requires Phase 4 or later to restore; older application validators reject unknown fields. Additive restore still preserves ID collisions rather than overwriting records.

## Rendering and bounds

`clampMorph` bounds normalized fields to 0–1, legacy width/thickness multipliers to 0.5–2, and input height to 80–250 cm. These are input safety bounds. The renderer further limits visual height scaling to 0.8–1.25 and local dimensions to conservative ranges to preserve coherent proportions; it is not a calibrated height or circumference reconstruction.

`smoothMorph` interpolates with `1 - exp(-8 × delta)`, caps frame delta at 0.1 seconds and safely handles invalid numbers. A frame updates mesh transforms directly, without React state changes or rebuilding geometries. Smooth ellipsoids with stylized pectoral surfaces, articulated limbs, a visor and clothing share the existing procedural component API. R3F owns and disposes declarative geometry/material resources. Comparison uses one canvas for both bodies. DPR is capped at 1.5.

OrbitControls supports unrestricted horizontal rotation, bounded vertical rotation, zoom buttons, automatic rotation and reset. The responsive viewport wraps controls on narrow screens. WebGL 2 is probed with immediate probe-context release. Unsupported contexts, renderer errors and context loss show a fallback while measurement/history controls remain usable. Reload after graphics support is restored; there is no automatic GPU recovery loop.

XP, Level and workout rewards are absent from mapping inputs. Existing aura and gear preferences remain cosmetic. Workouts alone never alter the measured physique.

## Verification and scope

Tests cover mapping integration, clamping and interpolation, current/goal/manual sources, historical selection, missing/deleted data, demo filtering, customization persistence, validated backups and XP independence. Phase 2/3 suites continue to run. Browser QA covers desktop and 390 px mobile layouts, date comparison, camera controls, goal switching and refresh persistence. The browser has no renderer errors; an upstream Three.Clock deprecation warning remains.

No medical diagnosis, anatomy reconstruction, external asset download, cloud service or Phase 5 game mechanics were added. The avatar remains an intentionally stylized segmented humanoid. Offline local records and locally served assets are preserved; installing a service worker/PWA remains future work.
