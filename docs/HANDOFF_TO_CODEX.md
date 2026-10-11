# Phase 2 Implementation Update — 2026-10-11

Phase 2 is implemented. See [PHASE_2_REPORT.md](PHASE_2_REPORT.md) and sections 6–9 of [ARCHITECTURE.md](ARCHITECTURE.md) for the current contracts. The scaffold handoff below is historical; mock seeding and destructive reset are no longer supported. InBody morphing, advanced analytics, dynamic RPG mechanics, rest timer and PWA remain future work.

# Tài Liệu Bàn Giao Kỹ Thuật (Handoff to OpenAI Codex)

> **Dành cho:** OpenAI Codex / Kỹ sư triển khai logic nghiệp vụ  
> **Dự án:** FitForge RPG — Ứng Dụng Game Hóa Rèn Luyện Thể Hình 3D Cục Bộ  
> **Người bàn giao:** Frontend Architect  
> **Trạng thái giàn giáo:** Hoàn thiện 100% Scaffold, Design System, 7 Tuyến Trang, 0 Lỗi Lint, 0 Lỗi Build.

---

## 1. Nhiệm Vụ Của Codex (Mission for Codex)

Kiến trúc sư giao diện đã hoàn tất toàn bộ giàn giáo (scaffold), hệ thống thiết kế (design system), điều hướng 7 trang, khung nhìn nhân vật 3D procedural, các hợp đồng kiểu dữ liệu TypeScript và mô hình lưu trữ Dexie.js.

**Trách nhiệm chính của OpenAI Codex là:**
1. Triển khai logic nghiệp vụ sâu (business logic).
2. Kết nối đồng bộ hai chiều giữa Zustand stores và Dexie IndexedDB (`dexie-react-hooks`).
3. Hoàn thiện bộ máy tính toán thể hình (1RM calculations, Volume surges, Calo & Macro splits).
4. Ánh xạ dữ liệu InBody sang các tham số morph target 3D của nhân vật.
5. Triển khai cấu hình PWA (Progressive Web App) cho phép cài đặt ngoại tuyến.

---

## 2. Quy Tắc Bắt Buộc (Critical Invariants)

Khi tiếp quản và mở rộng mã nguồn, Codex **BẮT BUỘC** tuân thủ các nguyên tắc sau:

1. **Ngôn ngữ:**
   - **Giao diện người dùng (UI Labels, Toasts, Descriptions):** Tiếng Việt chuẩn xác, mang phong cách thể hình và RPG hào khí.
   - **Mã nguồn (Code Identifiers, Variables, Types, Comments):** Tiếng Anh 100%.
2. **Không Đám Mây / Không API Có Phí:**
   - Không được tích hợp Firebase, Supabase, AWS hay các dịch vụ đám mây yêu cầu xác thực.
   - Không dùng bất kỳ API AI hoặc phần cứng InBody độc quyền nào có tính phí.
3. **Bản Quyền & Tuyên Bố Miễn Trừ 3D:**
   - Giữ nguyên thông điệp cảnh báo trên khung nhìn 3D: *"Mô hình thủ tục 3D minh họa thể trạng RPG - Không phản ánh chính xác cấu trúc giải phẫu y khoa."*
   - Nếu thay thế bằng mô hình GLB trong tương lai, mô hình phải là mã nguồn mở / giấy phép tự do (CC0 / MIT).
4. **Không CDN Ngoài Lúc Chạy:**
   - Tất cả thư viện phải được cài đặt qua `npm` trong `package.json`. Không sử dụng thẻ `<script src="https://cdn...">`.

---

## 3. Bản Đồ Thành Phần & Điểm Kết Nối (Codebase Map)

### 3.1. Điểm Truy Cập Trạng Thái (Stores)
Tất cả các store đều nằm tại `src/stores/`:
- `useUserStore`: Quản lý cấp độ (`level`), kinh nghiệm (`currentXp`, `nextLevelXp`), vàng (`gold`), năng lượng (`energy`), chuỗi ngày (`streakDays`).
- `useWorkoutStore`: Quản lý danh mục bài tập (`exercises`), phiên tập đang diễn ra (`activeSession`), lịch sử các buổi tập (`sessions`), và kỷ lục cá nhân (`personalRecords`).
- `useCharacterStore`: Quản lý chế độ xem (`mode: 'current' | 'goal'`), bộ tham số morph (`currentBody`, `goalBody`), trang bị nhân vật và hào quang.
- `useInBodyStore`: Quản lý danh sách các kỳ đo InBody (`measurements`) và phiếu đo mới nhất (`latestMeasurement`).
- `useQuestStore`: Quản lý nhiệm vụ ngày/tuần (`quests`) và danh hiệu (`achievements`).

### 3.2. Cơ Sở Dữ Liệu Cục Bộ (Dexie DB)
- Tệp định nghĩa: `src/services/db/db.ts`
- Thể hiện: `import { db } from '@/services/db'`
- Phương thức có sẵn:
  - `db.seedInitialData()`: Khởi tạo hồ sơ trung tính và bài tập còn thiếu; không ghi đè dữ liệu.
  - `db.exportFullBackup()`: Trích xuất toàn bộ dữ liệu ra JSON để tải về.
  - `db.importBackup(unknown)`: Kiểm tra và bổ sung bản sao lưu; giữ nguyên các ID đã tồn tại.

---

## 4. Hướng Dẫn Triển Khai Logic Chi Tiết Cho Codex

### Bước 1: Kết Nối Dexie Live Query với Zustand Store
Hiện tại, các Zustand store đang nạp dữ liệu khởi tạo từ `src/mock/mockData.ts`. Codex cần liên kết với Dexie IndexedDB:
```typescript
// Mẫu gợi ý cho useWorkoutStore hoặc hook đồng bộ
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'

export function useLiveWorkouts() {
  return useLiveQuery(() => db.workoutSessions.toArray(), [])
}
```
Mỗi khi người dùng tạo buổi tập mới qua `finishSession()`, Codex cần gọi thêm `await db.workoutSessions.put(newSession)`.

### Bước 2: Công Thức Ước Tính Kỷ Lục 1RM (Personal Records Engine)
Triển khai công thức Epley hoặc Brzycki trong `useWorkoutStore` khi người dùng hoàn thành một set tập:
$$\text{Estimated 1RM} = \text{Trọng lượng (kg)} \times \left(1 + \frac{\text{Số lần (reps)}}{30}\right)$$
Nếu giá trị tính toán lớn hơn kỷ lục hiện có trong `db.personalRecords`, tự động ghi nhận PR mới và mở khóa thành tích tương ứng trong `useQuestStore`.

### Bước 3: Ánh Xạ Phiếu InBody Sang Tham Số 3D Morph (Biometric to 3D Bridge)
Codex cần hoàn thiện hàm chuyển đổi từ `BodyMeasurement` sang `BodyMorphParameters`:
```typescript
export function computeMorphFromInBody(measurement: BodyMeasurement): BodyMorphParameters {
  // Chuẩn hóa tỷ lệ mỡ (PBF): 6% -> fatMorph 0.0, 30% -> fatMorph 0.8
  const fatMorph = Math.max(0.05, Math.min(0.85, (measurement.pbfPercent - 6) / 24))

  // Chuẩn hóa khối lượng cơ (SMM): 25kg -> 0.2, 42kg -> 1.0
  const muscleMorph = Math.max(0.2, Math.min(1.0, (measurement.smmKg - 25) / 17))

  return {
    heightCm: 175,
    fatMorph,
    muscleMorph,
    chestWidth: 1.0 + muscleMorph * 0.25,
    shoulderWidth: 1.0 + muscleMorph * 0.3,
    waistWidth: 0.8 + fatMorph * 0.35 - muscleMorph * 0.1,
    armThickness: 1.0 + muscleMorph * 0.28,
    legThickness: 1.0 + muscleMorph * 0.22,
    definition: Math.max(0.1, 1.0 - fatMorph * 1.2),
  }
}
```

### Bước 4: Bộ Đếm Thời Gian Nghỉ Hiệp (Rest Timer)
Tại `src/pages/WorkoutPage.tsx`:
- Bổ sung thanh đồng hồ đếm ngược (Floating Rest Timer) khi người dùng hoàn thành một hiệp tập (dựa trên `exercise.defaultRestSeconds`).
- Sử dụng Web Audio API (âm thanh beep ngắn) và `navigator.vibrate?.([200, 100, 200])` để thông báo hết giờ nghỉ.

### Bước 5: Cấu Hình PWA Ngoại Tuyến (Offline Support)
- Cài đặt `vite-plugin-pwa`.
- Khai báo file `manifest.webmanifest` trong `public/`.
- Cấu hình Cache-first strategy cho tài sản tĩnh và IndexedDB cho dữ liệu động.

---

## 5. Lệnh Chạy Kiểm Thử & Vận Hành Cục Bộ

Codex có thể sử dụng các lệnh sau trong thư mục `d:\RPG`:

```bash
# Khởi chạy máy chủ phát triển cục bộ (Local Dev Server)
npm run dev

# Kiểm tra cú pháp và chất lượng mã nguồn (Linter)
npm run lint

# Biên dịch sản phẩm kiểm tra tính toàn vẹn (Production Build)
npm run build

# Xem trước bản biên dịch sản phẩm (Preview Production Build)
npm run preview
```

> **Ghi chú quan trọng trên Windows PowerShell:** Nếu gặp lỗi hạn chế thực thi script `.ps1`, luôn sử dụng tiền tố lệnh `npm.cmd` hoặc `npx.cmd`.
