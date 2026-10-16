# Phase 5 implementation update — 2026-10-12

The current progression, planning and nutrition contracts are [RPG_PLANNING.md](RPG_PLANNING.md). Dexie/backup v4 adds an append-only progression ledger, weekly plans, food entries and journal preferences with additive migration. Workout/quest rewards and level progress are transactional and reconciled after corrections; cosmetics never change physique. The existing character geometry now renders a simple shirtless/shorts base while retaining legacy customization data. Prior phase updates and scaffold examples below are historical where superseded.

# Phase 4 implementation update — 2026-10-12

The current character contract is [CHARACTER_EVOLUTION.md](CHARACTER_EVOLUTION.md). The existing Phase 3 mapping now drives current/goal avatars and historical comparisons. Appearance and manual previews persist independently in optional character fields; schema/backup version stays 3 without record rewrites. Fixed procedural geometry uses bounded, smoothed transforms, a responsive single-canvas comparison, camera controls and WebGL fallback. XP never feeds physique mapping. Prior implementation updates and scaffold examples below are historical where superseded.

# Phase 3 implementation update — 2026-10-12

The current body-engine contract is documented in [BODY_COMPOSITION.md](BODY_COMPOSITION.md) and [PHASE_3_REPORT.md](PHASE_3_REPORT.md). Dexie/backup version 3 is additive and supports old reports/backups. Body calculations, references and normalized current/goal mappings are live derived state; procedural avatar customization stays independent and manual. Historical scaffold examples below must not be used as medical classification or physical-change prediction rules.
# FitForge RPG — Kiến Trúc Hệ Thống (Architecture Blueprint)

## 1. Tổng Quan Hệ Thống (System Overview)

**FitForge RPG** là ứng dụng web cá nhân cục bộ (local-first web application) kết hợp giữa quản lý rèn luyện thể hình thực tế (gym progression tracking) và cơ chế game hóa RPG 3D (3D gamification). 

Người dùng tập luyện ngoài đời thực, ghi nhận buổi tập, cập nhật các chỉ số phân tích thành phần cơ thể thực tế (InBody gồm SMM, PBF, phân đoạn cơ), từ đó nhân vật 3D trong game được cập nhật và tiến hóa hình thể tương ứng.

### Triết Lý Thiết Kế Cốt Lõi:
1. **Local-First (Ưu tiên cục bộ):** 100% dữ liệu được lưu trữ trực tiếp trên thiết bị người dùng thông qua IndexedDB (sử dụng Dexie.js). Không có backend, không yêu cầu xác thực đám mây (cloud auth), không phụ thuộc API trả phí.
2. **Vietnamese UI / English Identifiers:** Nhãn giao diện người dùng, thông báo và thuật ngữ hiển thị là tiếng Việt tự nhiên, chuẩn thể hình. Toàn bộ mã nguồn, kiểu dữ liệu, biến, hàm và kiến trúc sử dụng tiếng Anh chuẩn.
3. **Medical & Anatomical Disclaimer:** Mô hình 3D procedural hiện tại là hình tượng hóa minh họa phong cách RPG, không tuyên bố là mô phỏng giải phẫu y khoa chính xác.
4. **Modularity & Codex-Ready:** Phân tách rõ ràng giữa App Shell, UI Design System, 3D Avatar Viewport, State Management (Zustand), Domain Types, Database Schema và Mock Data.

---

## 2. Ngăn Xếp Công Nghệ (Tech Stack)

| Phân hệ | Công nghệ | Phiên bản / Chi tiết |
|---|---|---|
| **Core Framework** | React + TypeScript + Vite | React 19, TS 6.0, Vite 8 |
| **Styling & Design System** | Tailwind CSS v4 + Custom RPG Tokens | Dark-mode Cyberpunk / Fitness Forge |
| **3D Rendering** | Three.js + React Three Fiber + Drei | `@react-three/fiber`, `@react-three/drei`, `three` |
| **Biometric & Progress Charts** | Recharts | Biểu đồ vùng (Area), cột (Bar), đường (Line) |
| **Client State Management** | Zustand | Single-responsibility stores (`useUserStore`, `useWorkoutStore`, v.v.) |
| **Local-First Storage** | Dexie.js (IndexedDB) | Lưu trữ offline, hỗ trợ Export / Import JSON sao lưu |
| **Icons** | Lucide React | Hệ thống icon SVG nhất quán, nhẹ |
| **Routing** | React Router DOM v7 | Nested routes bên trong `AppShell` |

---

## 3. Cấu Trúc Thư Mục Dự Án (Directory Structure)

```
d:/RPG/
├── docs/
│   ├── ARCHITECTURE.md          # Tài liệu kiến trúc toàn diện (tài liệu này)
│   ├── HANDOFF_TO_CODEX.md      # Hướng dẫn chi tiết bàn giao cho OpenAI Codex
│   └── FEATURE_ROADMAP.md       # Lộ trình phát triển 6 giai đoạn
├── public/
│   └── favicon.svg              # App icon
├── src/
│   ├── components/
│   │   ├── avatar/              # 3D Avatar Viewport & Morphing System
│   │   │   ├── AvatarCanvas.tsx         # R3F Canvas, Lighting, Controls, Disclaimer
│   │   │   ├── ProceduralCharacter.tsx  # Mô hình nhân vật 3D thủ tục bằng Three.js
│   │   │   ├── AvatarControls.tsx       # Bộ thanh trượt điều khiển morph targets
│   │   │   └── index.ts
│   │   ├── layout/              # App Shell & Navigation
│   │   │   ├── AppShell.tsx             # Shell bao bọc TopBar, Sidebar, MobileNav
│   │   │   ├── TopBar.tsx               # Thanh HUD hiển thị Level, XP, Gold, Streak, Energy
│   │   │   ├── Sidebar.tsx              # Thanh điều hướng Desktop (hỗ trợ thu gọn)
│   │   │   ├── MobileNav.tsx            # Điều hướng đáy ngón tay cái cho Mobile
│   │   │   ├── navItems.ts              # Định nghĩa 7 tuyến đường chính
│   │   │   └── index.ts
│   │   └── ui/                  # Design System Primitives (shadcn/ui style)
│   │       ├── Badge.tsx                # Nhãn trạng thái RPG (cyan, gold, purple, danger)
│   │       ├── Button.tsx               # Nút tương tác với các biến thể RPG glow
│   │       ├── Card.tsx                 # Khung nội dung bo góc, kính mờ (glassmorphism)
│   │       ├── Input.tsx                # Ô nhập liệu có đơn vị đo (kg, %, kcal)
│   │       ├── Modal.tsx                # Cửa sổ pop-up / dialog
│   │       ├── Progress.tsx             # Thanh đo tiến độ / XP / năng lượng chuyển sắc
│   │       ├── Tabs.tsx                 # Chuyển đổi tab điều hướng nội bộ
│   │       └── index.ts
│   ├── lib/
│   │   └── utils.ts             # Tiện ích cn (clsx + tailwind-merge), định dạng ngày VN
│   ├── mock/                    # Dữ liệu mẫu chuẩn hóa tiếng Việt
│   │   ├── mockData.ts          # Mock User, Exercises, Workouts, InBody, Goals, PRs
│   │   └── index.ts
│   ├── pages/                   # 7 Màn hình cốt lõi theo đề bài
│   │   ├── DashboardPage.tsx            # 1. Tổng quan thể hình & RPG
│   │   ├── CharacterPage.tsx            # 2. Nhân vật 3D (Hiện tại vs Mục tiêu)
│   │   ├── WorkoutPage.tsx              # 3. Thư viện bài tập & Ghi nhận hiệp tập
│   │   ├── BodyAnalysisPage.tsx         # 4. Phân tích InBody & Cơ phân đoạn
│   │   ├── GoalsPlanningPage.tsx        # 5. Mục tiêu thể hình, Macros & Lịch tuần
│   │   ├── HistoryAchievementsPage.tsx  # 6. Biểu đồ xu hướng, PRs & Huy hiệu
│   │   ├── SettingsPage.tsx             # 7. Quản lý IndexedDB, Sao lưu JSON
│   │   └── index.ts
│   ├── services/
│   │   └── db/                  # Tầng tương tác cơ sở dữ liệu IndexedDB
│   │       ├── db.ts                    # Dexie class schema, initial seeding, export/import
│   │       └── index.ts
│   ├── stores/                  # Zustand State Management Stores
│   │   ├── useUserStore.ts              # Quản lý User Profile, XP, Gold, Level Up
│   │   ├── useWorkoutStore.ts           # Quản lý phiên tập đang diễn ra, exercises, PRs
│   │   ├── useCharacterStore.ts         # Quản lý Current/Goal Morph parameters
│   │   ├── useInBodyStore.ts            # Quản lý lịch sử và phiếu đo InBody mới
│   │   ├── useQuestStore.ts             # Quản lý nhiệm vụ ngày/tuần và thành tích
│   │   └── index.ts
│   ├── types/                   # Hợp đồng kiểu dữ liệu TypeScript (Domain Interfaces)
│   │   ├── user.ts                      # UserProfile, AvatarClass
│   │   ├── workout.ts                   # Exercise, WorkoutSet, WorkoutSession, PersonalRecord
│   │   ├── inbody.ts                    # SegmentalLean, BodyMeasurement
│   │   ├── goal.ts                      # Goal, TrainingSplitPlan
│   │   ├── character.ts                 # CharacterState, BodyMorphParameters, CharacterEquipment
│   │   ├── achievement.ts               # Achievement, Quest
│   │   └── index.ts
│   ├── App.tsx                  # Root Routing & DB Seeding lifecycle
│   ├── index.css                # Tailwind base, dark palette, glowing accents
│   └── main.tsx                 # Điểm khởi chạy React
├── package.json
├── tsconfig.app.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Tầng Dữ Liệu & Hợp Đồng TypeScript (Domain Models)

Toàn bộ các thực thể cốt lõi được định nghĩa chặt chẽ tại `src/types/`:

### 4.1. Người Dùng & Game RPG (`UserProfile`)
```typescript
export interface UserProfile {
  id: string
  name: string
  title: string
  level: number
  currentXp: number
  nextLevelXp: number
  gold: number
  gems: number
  energy: number
  maxEnergy: number
  streakDays: number
  lastActiveDate: string
  avatarClass: 'Juggernaut' | 'Aesthetic' | 'Powerlifter' | 'All-Rounder'
  createdAt: string
}
```

### 4.2. Luyện Tập & Kỷ Lục (`WorkoutSession`, `Exercise`, `PersonalRecord`)
```typescript
export interface Exercise {
  id: string
  nameVi: string
  nameEn: string
  muscleGroup: 'Ngực' | 'Lưng' | 'Chân' | 'Vai' | 'Tay' | 'Bụng' | 'Toàn thân'
  secondaryMuscles?: string[]
  equipment: 'Tạ đơn' | 'Tạ đòn' | 'Máy tập' | 'Dây cáp' | 'Bodyweight'
  instructionsVi?: string
  defaultRestSeconds: number
}

export interface WorkoutSet {
  id: string
  setNumber: number
  weightKg: number
  reps: number
  rpe?: number
  completed: boolean
  isWarmup?: boolean
  isPr?: boolean
}

export interface WorkoutSession {
  id: string
  date: string
  name: string
  splitType: string
  durationMinutes: number
  totalVolumeKg: number
  xpEarned: number
  exercises: {
    exerciseId: string
    exerciseName: string
    muscleGroup: MuscleGroup
    sets: WorkoutSet[]
  }[]
  notes?: string
}

export interface PersonalRecord {
  id: string
  exerciseId: string
  exerciseName: string
  maxWeightKg: number
  reps: number
  estimated1RM: number
  achievedDate: string
  previousWeightKg?: number
}
```

### 4.3. Chỉ Số Thể Trạng InBody & Phân Đoạn Cơ (`BodyMeasurement`, `SegmentalLean`)
```typescript
export interface SegmentalLean {
  rightArmKg?: number | null
  rightArmPercent?: number | null
  leftArmKg?: number | null
  leftArmPercent?: number | null
  trunkKg?: number | null
  trunkPercent?: number | null
  rightLegKg?: number | null
  rightLegPercent?: number | null
  leftLegKg?: number | null
  leftLegPercent?: number | null
}
export type BodyMetric = 'weightKg' | 'smmKg' | 'pbfPercent' | 'bodyFatMassKg' | 'bmi'
export interface DeviceReference {
  min: number
  max: number
  unit: 'kg' | '%' | 'kg/m²'
  label: string
  scope: 'individual' | 'adult'
}
export interface BodyMeasurement {
  id: string
  date: string
  /** Version 3 records unavailable core inputs as null. Legacy rows may omit height. */
  measurementVersion?: 3
  heightCm?: number | null
  weightKg?: number | null
  smmKg?: number | null
  pbfPercent?: number | null
  bodyFatMassKg?: number | null
  /** BMI transcribed from the device, never overwritten by derived BMI. */
  bmi?: number | null
  bmrKcal?: number | null
  visceralFatLevel?: number | null
  bodyWaterKg?: number | null
  boneMassKg?: number | null
  inBodyScore?: number | null
  ageYears?: number | null
  segmentalLean?: SegmentalLean
  references?: Partial<Record<BodyMetric, DeviceReference>>
  notes?: string
}
```

### 4.4. Trạng Thái Nhân Vật 3D (`CharacterState`, `BodyMorphParameters`)
```typescript
export interface BodyMorphParameters {
  heightCm: number
  fatMorph: number        // 0 (rất nét 6%) đến 1 (mỡ cao 35%)
  muscleMorph: number     // 0 (cơ ít) đến 1 (hypertrophy tối đa)
  chestWidth: number      // Hệ số co giãn ngực 0.8 - 1.4
  shoulderWidth: number   // Hệ số co giãn vai 0.8 - 1.4
  waistWidth: number      // Hệ số vòng eo 0.7 - 1.3 (V-Taper)
  armThickness: number    // Hệ số bắp tay 0.8 - 1.5
  legThickness: number    // Hệ số đùi 0.8 - 1.5
  definition: number      // Độ nét cơ bắp
}

export interface CharacterState {
  id: string
  userId: string
  mode: 'current' | 'goal'
  currentBody: BodyMorphParameters
  goalBody: BodyMorphParameters
  equippedGear: {
    headgear?: string
    wristWraps?: string
    liftingBelt?: string
    kneeSleeves?: string
    auraColor?: string
  }
  auraUnlocked: boolean
  unlockedSkins: string[]
}
```

---

## 5. Kiến Trúc 3D Avatar Viewport

### 5.1. Mô Hình Thủ Tục (Procedural Humanoid Pipeline)
Do ứng dụng không dựa vào CDN bên ngoài hoặc tài sản GLB thương mại có bản quyền, mô hình nhân vật được kiến trúc thủ tục thông qua Three.js và `@react-three/fiber`:
- **Hình học cơ bản:** Đầu (`sphereGeometry`), Cổ (`cylinderGeometry`), Ngực (`boxGeometry`), Bụng eo (`boxGeometry`), Đai lưng tập tạ, Vai, Cánh tay, Cẳng tay, Đùi, Băng gối, Bắp chân, Bàn chân và Bục đứng Neon Podium.
- **Biến đổi hình học theo thời gian thực (Morph targets mapping):**
  - Khối lượng cơ bắp `muscleMorph` làm tăng kích thước vai, ngực, bắp tay và đùi.
  - Lớp mỡ `fatMorph` làm tăng độ dày vùng bụng và eo (`waistFactor`), làm giảm tỷ lệ V-Taper.
  - Chế độ `isGoalMode` kích hoạt tông màu hào quang rực rỡ (Amber Gold) so với chế độ hiện tại (Teal Cyan).
- **Idle Animation:** Sử dụng hook `useFrame` để tạo nhịp thở phập phồng tự nhiên ở lồng ngực và chuyển động nâng nhẹ theo thời gian thực.
- **Controls:** `OrbitControls` cho phép người dùng xoay 360 độ, zoom gần/xa, kèm nút chuyển đổi tự động xoay và nút reset góc nhìn.

### 5.2. Tuyên Bố Miễn Trừ Trách Nhiệm Y Tế (Disclaimer Contract)
Trên mọi khung nhìn 3D Canvas, một huy hiệu cảnh báo luôn hiển thị:
> *"⚠️ Mô hình thủ tục 3D minh họa thể trạng RPG - Không phản ánh chính xác cấu trúc giải phẫu y khoa."*

---

## 6. Phase 2 — Local Persistence (implemented 2026-10-11)

The database remains `FitForgeRPG_DB`. Version 1 is retained verbatim so existing installations can upgrade. Version 2 adds `workoutSets` (`id`, `sessionId`, `exerciseId`, compound session/exercise index), `auditLog`, and session status/source indexes. Sessions still embed their sets for compatibility; normalized rows are synchronized in the same transaction. Qualified normalized set IDs prevent collisions between legacy sessions. `WorkoutSession` adds optional `source`, `status`, `startedAt`, and `editOf`; old completed sessions remain readable.

The migration never clears original tables. Only records that exactly match the original scaffold fixtures are marked `source: demo`; changed/unknown records are kept as real. Original profiles, measurements, goals, avatars and PR rows remain stored. An untouched demo profile gets a separate level-1 local profile. Exercise definitions are reference data, not progress. Initialization adds missing exercise IDs and never replaces customized exercises. No demo history, measurements, goals, achievements or quest progress are seeded into new installations.

`saveDraft` persists valid in-progress sessions without granting XP. An edit uses a separate draft with `editOf`, preserving the original until save. `saveWorkout` validates input/references and atomically writes the session, individual sets, derived records, profile XP/level, calendar-day streak and audit entry; it removes an editing draft within that transaction. Re-saving awards only the XP difference, not the whole reward again. Deletion reverses workout XP, removes sets and rebuilds PRs/streak. XP is `round(completed volume * 0.035) + 200`. Calendar dates use the browser's local timezone; a gap of more than one day resets the active streak. Empty/uncompleted workouts cannot be finalized. Zero weight is allowed for bodyweight exercises; no artificial bodyweight load is assumed.

PRs are rebuilt from real completed sessions, including after edits/deletion. Records have `kind`, `value`, `weightKg` (for repetition records), `sessionId`, and achieved date. Four independent kinds are maximum weight, most repetitions at each weight, exercise volume in one session, and Epley estimated 1RM. Only completed sets count; warmups count. Epley is `weight * (1 + reps / 30)` for positive load and 1–10 integer repetitions. Larger repetition counts contribute to weight/repetition/volume records but do not produce an estimate. Equal records retain the first workout in deterministic chronological order.

## 7. Reactive State and Validation

Dexie is the source of truth. `DatabaseSync` reads a consistent live snapshot through `dexie-react-hooks` into the existing Zustand stores. User/workout/InBody/quest stores start with empty or neutral state, not mock progress. Workout drafts recover once at app load; subsequent live snapshots never replace in-flight form edits. Writes are queued, save failures are displayed, and the tracker warns on navigation while a draft write is pending. Avatar controls remain procedural/manual and persist their settings; automatic InBody morphing is deferred.

`validation.ts` checks nested entity shapes, supported enum values, dates, finite/nonnegative values, bounds, set IDs and references. Runtime validation is necessary even with strict TypeScript because backup files are untrusted. Phase 3 measurement forms support unavailable readings as null; dedicated body validation preserves reported values without inventing height or missing water/bone/segment readings. Goal and profile edits persist through validated services. RPG quests/achievements are empty on fresh installations; further mechanics are deferred.

## 8. Backup Contract

`exportFullBackup()` returns a consistent version-3 JSON snapshot of all logical entity tables (the user array keeps its legacy `user` key) plus audit entries. Individual set rows and cached derived PRs are reconstructed from embedded workout data. `importBackup(unknown)` accepts version 1, 2 or 3, validates every table and nested record before any write, rejects duplicate IDs/missing exercise or character/profile references, and merges all new IDs in one transaction. Existing IDs always win, including profile/avatar conflicts. This is an additive restore, not replacement or conflict resolution; profile changes with an existing ID must be made through the profile editor. No imported workout awards XP a second time. Legacy PR rows are preserved; derived PR rows are rebuilt. Demo backups cannot overwrite real records. The destructive demo-reset API/UI has been removed. The file picker rejects files above 20 MB.

## 9. Verification

Vitest uses `fake-indexeddb` with isolated test databases. Tests cover completed-set volume, Epley bounds, independent PR detection, empty/invalid inputs, draft/workout persistence after reconnect, queued store operations, migration preservation, validated backup round trips, conflicts, demo separation, transaction rollback, edits/deletion and XP idempotency. Run `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd run test`.

Use a consistent browser profile and origin (scheme/host/port) when running locally: IndexedDB is scoped to that origin. Export a backup before changing origins or browser profiles. This phase does not add a service worker; Vite assets still need to be served locally.

## 10. Phase 3 Body Composition Integration

`services/bodyComposition/calculations.ts` provides null-safe formulas, provenance, differences and metric-specific classification; `validation.ts` validates report shapes, units and reference intervals. `BodyCompositionToAvatar.ts` provides the documented clamped mapping interface for Phase 4. No renderer or workout/PR calculation module is replaced.

`DatabaseSync` reads measurements and active real goals in its consistent transaction snapshot, updates `useInBodyStore`, and populates `useCharacterStore.measuredBody`/`goalBodies` separately from persisted manual `character.currentBody`/`goalBody`. Real reports are sorted by date then ID; same-day ties are deterministic. The selected body goal is session state. Shared `BodyOverview`, `BodyHistoryCharts`, `BodyTargets` and `TargetComparison` components connect Dashboard, Body Analysis, History, Goals and Character without hardcoded progress. Body Analysis adds validated create/edit forms, reference entry, segmental visual display, chronological table and a confirmation dialog before deletion.

Database version 3 adds the body `source` index without changing stored measurements. Measurement writes and deletion include audit entries atomically. Backup version 3 accepts v1/v2/v3 and retains additive conflict behavior. See the body contract for explicit unavailable fields, legacy BMI provenance, nonmedical references and arbitrary artistic avatar scales.
