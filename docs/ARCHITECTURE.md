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
  rightArmKg: number
  rightArmPercent: number
  leftArmKg: number
  leftArmPercent: number
  trunkKg: number
  trunkPercent: number
  rightLegKg: number
  rightLegPercent: number
  leftLegKg: number
  leftLegPercent: number
}

export interface BodyMeasurement {
  id: string
  date: string
  weightKg: number
  smmKg: number          // Skeletal Muscle Mass (Khối lượng cơ xương)
  pbfPercent: number     // Percent Body Fat (Tỷ lệ mỡ)
  bmi: number
  bodyFatMassKg: number
  bmrKcal: number
  visceralFatLevel: number
  bodyWaterKg: number
  boneMassKg: number
  inBodyScore?: number
  segmentalLean: SegmentalLean
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

## 6. Chiến Lược Lưu Trữ Cục Bộ (Local-First Persistence Strategy)

### 6.1. Dexie.js Schema
Lớp lưu trữ tại `src/services/db/db.ts` khai báo các bảng:
- `users`: ID, level
- `exercises`: ID, muscleGroup, equipment
- `workoutSessions`: ID, date, splitType
- `personalRecords`: ID, exerciseId, achievedDate
- `bodyMeasurements`: ID, date
- `goals`: ID, category
- `characterStates`: ID, userId
- `achievements`: ID, code, category, unlocked
- `quests`: ID, frequency, isCompleted

### 6.2. Cơ Chế Khởi Tạo & Sao Lưu
1. **Tự động gieo dữ liệu (Auto-seeding):** Khi mở ứng dụng lần đầu, `db.seedInitialData()` kiểm tra bảng `users`. Nếu rỗng, nạp toàn bộ bộ mock data chuẩn tiếng Việt.
2. **Xuất file sao lưu (JSON Backup):** `db.exportFullBackup()` trích xuất toàn bộ dữ liệu ra file `.json` để người dùng lưu vào ổ đĩa.
3. **Làm mới dữ liệu mẫu (Reset Demo):** `db.resetToDemoState()` hỗ trợ môi trường thử nghiệm sạch.

---

## 7. Hệ Thống Trạng Thái (Zustand Stores)

- **`useUserStore`:** Quản lý thông tin chiến binh, kinh nghiệm, tự động tăng cấp (Level Up) khi XP vượt ngưỡng, tính toán vàng và năng lượng.
- **`useWorkoutStore`:** Quản lý danh mục bài tập, buổi tập đang diễn ra (`activeSession`), thêm hiệp tập, đánh dấu hoàn thành, tính toán Volume (kg) và trao thưởng XP.
- **`useCharacterStore`:** Lưu trữ trạng thái 3D, chuyển đổi giữa Thể trạng hiện tại và Mục tiêu, điều chỉnh các tham số morph parameters.
- **`useInBodyStore`:** Quản lý danh sách các phiếu đo InBody và tự động cập nhật phiếu mới nhất vào biểu đồ.
- **`useQuestStore`:** Xử lý cơ chế nhận thưởng (Claim reward) cho nhiệm vụ hàng ngày/tuần và mở khóa huy hiệu.
