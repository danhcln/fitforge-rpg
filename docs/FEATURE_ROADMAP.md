# Phase 3 status — 2026-10-12

Completed: local InBody CRUD/history, safe v3 migration/backups, null-safe BMI/fat/fat-free calculations, independent report-interval classifications, segmental visualization, charts, current/target integration and normalized avatar data mapping. No advanced avatar morphing, OCR, cloud integration, diagnosis or physical-change prediction is enabled. Phase 4 has not started. See [PHASE_3_REPORT.md](PHASE_3_REPORT.md) and [BODY_COMPOSITION.md](BODY_COMPOSITION.md); the original roadmap below is historical where it differs from the owner's Phase 3 scope.
# Phase 2 Status — 2026-10-11

✅ Local database, safe migrations, reactive stores, validated additive backup/restore, workout CRUD/drafts/history, four PR categories, real dashboard totals and automated tests are complete. The basic Epley engine moved into Phase 2 at the project owner's request. Phase 3 is now complete; see the status update above. See [PHASE_2_REPORT.md](PHASE_2_REPORT.md).

# Lộ Trình Phát Triển Tính Năng (Feature Roadmap)

Dự án: **FitForge RPG**  
Phiên bản hiện tại: **0.2.0-core-workout**

---

## Tổng Quan Các Giai Đoạn (Milestones Summary)

```
[Phase 1] Khung Giao Diện & Design System (HOÀN THÀNH)
    ↓
[Phase 2] Đồng Bộ IndexedDB & Xử Lý Dữ Liệu Ngoại Tuyến
    ↓
[Phase 3] Bộ Máy Tính Toán Thể Hình & Cầu Nối Biometrics
    ↓
[Phase 4] Mở Rộng Cơ Chế RPG & Hệ Thống Trang Bị 3D
    ↓
[Phase 5] Hỗ Trợ PWA, Âm Thanh & Rung Phản Hồi
    ↓
[Phase 6] Xuất Báo Cáo Huấn Luyện Viên & Sao Lưu Mã Hóa
```

---

## Chi Tiết Các Giai Đoạn Phát Triển

### Giai Đoạn 1: Khung Kiến Trúc & Hệ Thống Thiết Kế (Phase 1 — Foundation & Scaffold)
- **Trạng thái:** ✅ **ĐÃ HOÀN THÀNH**
- **Đơn vị thực hiện:** Frontend Architect
- **Hạng mục đã bàn giao:**
  - [x] Khởi tạo dự án Vite + React 19 + TypeScript + Tailwind CSS v4.
  - [x] Thiết lập hệ thống thiết kế Dark RPG Cyberpunk/Fitness.
  - [x] Xây dựng App Shell linh hoạt cho Desktop (Sidebar thu gọn) và Mobile (Thanh điều hướng đáy).
  - [x] Triển khai 7 trang nghiệp vụ với nhãn tiếng Việt chuẩn thể hình: Tổng quan, Nhân vật 3D, Luyện tập, Chỉ số InBody, Mục tiêu & Kế hoạch, Lịch sử & Kỷ lục, Cài đặt.
  - [x] Xây dựng khung nhìn 3D Canvas với nhân vật thủ tục (Procedural Humanoid) và thanh trượt điều chỉnh morph targets (Khối lượng cơ, Tỷ lệ mỡ, V-Taper, Hào quang).
  - [x] Tích hợp biểu đồ tiến trình Recharts.
  - [x] Khai báo hợp đồng kiểu dữ liệu TypeScript (`src/types/`) và cơ sở dữ liệu Dexie.js (`src/services/db/`).
  - [x] Kiểm thử 0 cảnh báo lint (`oxlint`) và 0 lỗi biên dịch (`npm run build`).

---

### Giai Đoạn 2: Lưu Trữ Cục Bộ & Đồng Bộ Hai Chiều (Phase 2 — Offline Persistence & Reactive State)
- **Mục tiêu:** Đảm bảo toàn bộ thao tác thêm, sửa, xóa trên giao diện được ghi đè bền vững vào IndexedDB.
- **Độ ưu tiên:** 🔴 Cao nhất (Critical)
- **Người thực hiện:** OpenAI Codex
- **Nhiệm vụ cụ thể:**
  - Tích hợp hook `useLiveQuery` từ `dexie-react-hooks` vào các view tiêu thụ dữ liệu.
  - Xây dựng transaction an toàn khi hoàn thành buổi tập (`saveWorkoutSession`): tự động cập nhật tổng volume, cộng XP cho user profile và tính lại chuỗi ngày tập (streak).
  - Triển khai tính năng nhập file JSON sao lưu (`Import Backup`) có kiểm tra tính hợp lệ của schema.
  - Bổ sung cơ chế tự động ghi nhật ký sửa đổi (audit log) cục bộ.

---

### Giai Đoạn 3: Bộ Máy Tính Toán Thể Hình & InBody (Phase 3 — Fitness Engine & Biometric Analytics)
- **Mục tiêu:** Tự động hóa các phép tính chuyên sâu phục vụ người tập gym chuyên nghiệp.
- **Độ ưu tiên:** 🟡 Cao (High)
- **Nhiệm vụ cụ thể:**
  - **Bộ tính 1RM nâng cao:** Tự động so sánh hiệp tập với lịch sử để thông báo kỷ lục mới (PR Flash Notification).
  - **Bộ phân tích quá tải lũy tiến (Progressive Overload Tracker):** Cảnh báo nếu buổi tập liên tiếp bị suy giảm tổng volume quá 15%.
  - **Ánh xạ tự động InBody sang 3D Morph:** Tự động tính toán các hệ số `fatMorph`, `muscleMorph`, `chestWidth`, `waistWidth` từ kết quả InBody mới nhất.
  - **Bộ tính chỉ số TDEE & Macro:** Cho phép người dùng nhập hệ số hoạt động thể chất (BMR x PAL) để khuyến nghị calo mục tiêu.

---

### Giai Đoạn 4: Game Hóa RPG & Tùy Biến Nhân Vật 3D (Phase 4 — RPG Mechanics & Avatar System)
- **Mục tiêu:** Tăng cường động lực rèn luyện thông qua cơ chế phần thưởng game hóa hấp dẫn.
- **Độ ưu tiên:** 🟢 Trung bình (Medium)
- **Nhiệm vụ cụ thể:**
  - **Cửa hàng trang bị RPG (Iron Forge Armory):** Cho phép người dùng dùng Vàng tích lũy từ các buổi tập để mua các loại đai lưng, băng quấn cổ tay và hiệu ứng hào quang mới.
  - **Cây kỹ năng thể hình (Fitness Skill Tree):** Mở khóa các danh hiệu đặc thù theo trường phái ("Chiến Binh Ngực Thép", "Titan Squat", "Bậc Thầy Kéo Đất").
  - **Hệ thống nhiệm vụ sinh ngẫu nhiên hàng ngày (Dynamic Daily Quests):** Tạo các thử thách như "Nâng tổng khối lượng 12,000kg" hoặc "Nghỉ dưới 90 giây giữa các hiệp".

---

### Giai Đoạn 5: Trải Nghiệm Ứng Dụng Ngoại Tuyến PWA (Phase 5 — PWA & Mobile Ergonomics)
- **Mục tiêu:** Mang lại trải nghiệm mượt mà như ứng dụng gốc trên điện thoại iOS và Android.
- **Độ ưu tiên:** 🟢 Trung bình (Medium)
- **Nhiệm vụ cụ thể:**
  - Cấu hình Service Worker bằng `vite-plugin-pwa` hỗ trợ cài đặt Add-to-Home-Screen (A2HS).
  - Bộ đếm thời gian nghỉ nổi (Floating Rest Timer) kèm rung phản hồi (`navigator.vibrate`) khi kết thúc giờ nghỉ.
  - Hỗ trợ phím tắt điều hướng nhanh trong lúc tay đeo găng tập gym (Large Touch Targets).

---

### Giai Đoạn 6: Xuất Báo Cáo & Bảo Mật Dữ Liệu (Phase 6 — Reports & Privacy Protection)
- **Mục tiêu:** Cung cấp báo cáo chuyên nghiệp để trao đổi với huấn luyện viên cá nhân (PT).
- **Độ ưu tiên:** ⚪ Thấp (Low / Polishing)
- **Nhiệm vụ cụ thể:**
  - Xuất báo cáo tổng kết chu kỳ tập luyện (Training Cycle Summary) dưới định dạng PDF in ấn.
  - Mã hóa bản sao lưu JSON bằng mật khẩu cá nhân sử dụng Web Crypto API (AES-GCM).
  - Tùy chọn xóa sạch toàn bộ dấu vết dữ liệu cá nhân (Complete Data Erasure).
