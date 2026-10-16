# Body Composition Contract — Phase 3

## Reported values and unavailable inputs

`BodyMeasurement` stores values transcribed from the report in kg, cm, percent, kcal and device visceral-fat levels. These are **device-reported readings**, including any estimates the device itself produces; the application does not claim direct laboratory measurement. `bmi` is the original reported BMI. `heightCm` is a separate input.

New forms write `measurementVersion: 3`, date, height, weight, SMM, PBF and body-fat-mass keys. Unavailable numeric readings are explicitly `null`, never zero. At least one core numeric reading is required; a wholly empty report is rejected. This reconciles the core field contract with reports that lack some readings. Optional BMR, visceral fat, water, bone minerals, score, age at measurement, each segmental kg/percent and references can be missing independently. Legacy records may omit height and retain all original readings.

Bounds are input sanity limits, **not** health classifications: height 40–250 cm, weight >0–1000 kg, PBF 0–100%, age 0–120 years, optional reported BMI >0–200, BMR >0–10000 kcal. Finite numeric types are mandatory. SMM, fat, water, bone minerals and segmental mass cannot exceed an available body weight. When all five segmental masses exist, their sum cannot exceed weight. Segmental percentages allow 0–300% as device-relative ratios, not body-fat percentages. Invalid dates, unknown fields, wrong units and malformed references are rejected before writes.

## Calculation and history provenance

- BMI = weight / (heightCm / 100)^2, calculated only when both inputs exist and are positive.
- Calculated fat mass = weight × PBF / 100. Kept separate from reported fat mass; disagreement is preserved rather than silently corrected.
- Fat-free mass = weight minus reported fat mass when available, otherwise minus calculated fat mass. This is labelled calculated with the basis shown. It is not SMM.
- Comparisons use current minus previous for weight, SMM, PBF (percentage points), reported fat mass and **height-derived BMI**. Missing either operand gives no comparison, not zero.
- Body history is ordered by measurement date, then ID for deterministic same-day ties; no intra-day measurement time is collected. Latest/previous use this same order. Legacy BMI is displayed as a reported value but cannot fill a height-derived chart gap.
- Four independent linear charts show weight, SMM, PBF and derived BMI. Missing readings create gaps; interpolation is a visual line between known adjacent observations, not a predicted measurement.

The BMI formula follows [CDC's calculation definition](https://www.cdc.gov/bmi/about/index.html). No CDC adult category thresholds are imported into the app. Segmental lean tissue includes more than skeletal muscle; see [InBody's professional result-sheet guide](https://uk.inbody.com/wp-content/uploads/2018/08/The_Professional_s_Guide_to_the_InBody_Result_Sheet.pdf). These sources support interpretation of the inputs, not the artistic avatar scales below.

## Device reference classification

`references` is a metric-specific optional map for weight, SMM, PBF, reported fat mass and derived BMI. Each interval has inclusive `min`/`max`, the exact unit (`kg`, `%` or `kg/m²`), a source label transcribed from the report and scope `individual` or `adult`. Values below the lower bound are low, within both bounds normal, above the upper bound high. Invalid/absent references or unavailable readings yield unclassified. Each result explains its metric, interval, unit and source.

There are no universal muscle/fat/BMI thresholds, no SMM-from-BMI estimation and no relationship between classifications and game level. Adult reference intervals are suppressed below 18 and when age is unknown. An individual interval must be explicitly selected only when the report provides an interval applicable to the person measured. The form defaults to adult scope to avoid treating an unknown-age adult interval as personal by accident. No pediatric percentile or medical diagnosis engine is implemented.

## BodyCompositionToAvatar v1

`BodyCompositionToAvatar` returns `version`, mode, source ID, seven normalized values, renderer-compatible parameters, unavailable-input labels and `approximate: true`. It is a preparation interface for Phase 4; **the existing renderer still uses independent saved manual customization in Phase 3**. Measured mapping never writes `CharacterState.currentBody` or `goalBody`, equipment, aura, or skin settings.

All scales below are **arbitrary artistic rendering assumptions**, not normal ranges or anatomical calibration:

| Parameter | Raw visual proxy before clamping to 0–1 |
| --- | --- |
| Overall volume | (weight / height-metres³) / 30 |
| SMM representation | (SMM / weight) / 0.7 |
| Fat representation | PBF / 60 |
| Arms | ((left-arm lean + right-arm lean) / weight) / 0.16 |
| Legs | ((left-leg lean + right-leg lean) / weight) / 0.5 |
| Trunk | (trunk lean / weight) / 0.65 |
| Upper-body muscle representation | Mean of SMM, arms and trunk normalized proxies |
| Lower-body muscle representation | Mean of SMM and legs normalized proxies |

Unavailable dependencies produce a neutral 0.5 **with explicit missing-input metadata**, not an inferred reading. Paired limbs need both readings; one absent limb is not doubled. Normalized values stay finite within 0–1. Renderer dimensions are `0.75 + normalized * 0.5`, safely inside the existing 0.5–2 bounds; height is clamped to 80–250 cm (175 cm neutral if unavailable); definition is clamped SMM representation × (1 − fat representation).

Current mapping comes only from the latest real report. Goal mapping comes from a selected real, incomplete saved goal's targets; zero in legacy numeric goal fields means unset. Goal height reuses current measured height solely for visual scale and target BMI. Target fat mass is calculated from target weight/PBF and labelled calculated. Segmental goal inputs remain absent; current segments are not assumed to grow into a target body. This is neither a physical-change prediction nor anatomically accurate reconstruction. User selection is session-only, defaulting to earliest goal deadline then ID after reload.

## Persistence and restoration

Dexie version 3 adds the body `source` index only. It does not rewrite readings, invent heights, assign derived BMI to old device fields or delete records. Existing v1→v2 provenance migration still tags only exact scaffold fixtures as demo. New measurement saves/edits/deletes are transactions with audit entries; editing a missing/deleted record fails instead of resurrecting it. Demo rows cannot be edited into real reports, and demo deletion through the real-record service is ignored.

JSON exports use version 3. Restore accepts versions 1, 2 and 3; measurements use the dedicated runtime validator. The established additive, all-tables transaction remains: every row validates before any write, duplicate incoming IDs reject the backup, existing IDs always win, and derived workout sets/PRs are rebuilt without rewarding XP again. Derived body calculations and avatar mappings are recomputed from sources instead of stored in backups. Manual character settings are backed up unchanged.
