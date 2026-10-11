# Phase 3 — InBody & Body Composition Engine

Local measurement creation, editing, confirmed deletion, nullable report readings, body calculations, report-based classifications, four history charts and current/target comparisons are implemented. [Phase 3 report](docs/PHASE_3_REPORT.md) lists verification and limitations; [body contract](docs/BODY_COMPOSITION.md) documents provenance, migrations and artistic avatar mapping. The existing procedural renderer still uses separate manual customization; measured morphing starts only in Phase 4.
# Phase 2 — Core Workout Tracking

Local-first workout tracking is implemented. See [the Phase 2 report](docs/PHASE_2_REPORT.md) for audit results, migration/restore rules, tests and deferred work. Existing navigation, dark RPG components and the procedural 3D avatar are preserved. Avatar parameters remain manual in this phase.

On Windows: `npm.cmd ci`, `npm.cmd run dev`, `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd run test`. Use Node.js 24 LTS. Keep the same browser profile and origin to access your local records.

# 🏋️‍♂️ FitForge RPG — Game Hóa Luyện Tập & Thể Hình 3D Cá Nhân

> **Ứng dụng rèn luyện thể hình RPG cục bộ (Local-First Fitness Gamification Web App)**  
> Người dùng tập luyện ngoài đời thực, ghi nhận lịch sử nâng tạ và chỉ số InBody thực tế để phát triển và tiến hóa nhân vật 3D trong game.

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black?logo=three.js)](https://threejs.org/)
[![Dexie.js](https://img.shields.io/badge/Dexie-IndexedDB-14b8a6)](https://dexie.com/)

---

## 🌟 Tính Năng Nổi Bật (Key Features)

1. **Khung Nhìn 3D Nhân Vật Động (3D Procedural Avatar Viewport):**
   - Mô hình người thủ tục (Three.js + React Three Fiber + Drei) không phụ thuộc CDN bên ngoài.
   - Chế độ so sánh kép: **Thể Trạng Hiện Tại (Current Body)** vs **Mục Tiêu Thể Hình (Goal Body)**.
   - Thanh trượt morph targets thời gian thực: Phát triển cơ bắp (Hypertrophy), Lớp mỡ (Fat Layer), Độ rộng vai/ngực, Vòng eo V-Taper, Hào quang RPG.
   - Tích hợp xoay góc nhìn 360° (OrbitControls), tự động xoay và nút đặt lại góc máy.
   - *Minh bạch y khoa:* Huy hiệu tuyên bố miễn trừ giải phẫu y tế chuẩn mực.

2. **7 Phân Hệ Trang Nghiệp Vụ Hoàn Chỉnh:**
   - **Tổng Quan (Dashboard):** Thống kê cân nặng, cơ xương (SMM), tỷ lệ mỡ (PBF), chuỗi ngày (Streak 🔥), xem trước nhân vật 3D, tổng volume, số buổi tập, hiệp hoàn thành và XP từ buổi tập.
   - **Nhân Vật 3D (Character):** Khung nhìn 3D mở rộng, bộ điều khiển morph targets, trang bị hỗ trợ (Đai lưng, Băng quấn cổ tay, Băng gối, Hào quang) và danh sách skin.
   - **Luyện Tập (Workout):** Thư viện bài tập phân nhóm cơ (Ngực, Lưng, Chân, Vai, Tay, Bụng), giao diện ghi nhận hiệp tập đang diễn ra (Sets, Reps, Weight kg), tính tổng volume và tích lũy EXP.
   - **Chỉ Số InBody (Body Analysis):** Phân tích BMI, SMM, PBF, BMR, Mỡ nội tạng, phân tích khối lượng cơ phân đoạn (Tay T/P, Thân mình, Chân T/P), biểu mẫu nhập phiếu InBody mới.
   - **Mục Tiêu & Kế Hoạch (Goals & Planning):** Đặt mục tiêu tăng cơ giảm mỡ, phân bổ Macros dinh dưỡng hàng ngày (Calo, Protein, Carb, Fat, Nước), mục tiêu số buổi tập mỗi tuần.
   - **Lịch Sử & Danh Hiệu (History & Achievements):** Biểu đồ xu hướng tiến trình thể hình (Recharts), đền kỷ lục cá nhân (PR từ buổi tập thực tế: trọng lượng, số lần tại trọng lượng, volume, 1RM ước tính), bảng vinh danh huy hiệu RPG 4 cấp độ.
   - **Cài Đặt & Dữ Liệu (Settings):** Quản lý trạng thái IndexedDB, xuất file sao lưu JSON (Export Backup), nhập JSON có kiểm tra và giữ nguyên dữ liệu khi trùng ID.

3. **Triết Lý Thiết Kế Cục Bộ (Local-First & Privacy):**
   - Không máy chủ backend, không xác thực đám mây, không API thu phí.
   - Dữ liệu thuộc quyền kiểm soát 100% của người dùng trên trình duyệt (Dexie IndexedDB).
   - Nhãn giao diện tiếng Việt tự nhiên, mã nguồn và biến định danh chuẩn tiếng Anh.

---

## 🛠️ Ngăn Xếp Công Nghệ (Tech Stack)

- **Frontend Core:** React 19, TypeScript, Vite 8
- **Styling:** Tailwind CSS v4, custom Cyberpunk/Dark RPG design tokens
- **3D Graphics:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **Charts:** Recharts
- **State Management:** Zustand
- **Local Persistence:** Dexie.js (IndexedDB)
- **Icons:** Lucide React
- **Routing:** React Router DOM v7

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

Yêu cầu môi trường: **Node.js 20+** hoặc **Node.js 24+** và **npm**.

```bash
# 1. Sao chép kho lưu trữ
git clone https://github.com/hgb1625/fitforge-rpg.git
cd fitforge-rpg

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Khởi chạy máy chủ phát triển cục bộ
npm run dev

# 4. Kiểm tra chất lượng mã nguồn
npm run lint

# 5. Biên dịch bản sản xuất
npm run build
```

---

## 📚 Tài Liệu Kỹ Thuật (Architecture & Documentation)

Dự án cung cấp bộ 3 tài liệu kiến trúc chuyên sâu tại thư mục `docs/`:

- 📐 **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md):** Bản thiết kế kiến trúc toàn diện, cây thư mục, hợp đồng kiểu dữ liệu và cơ chế 3D procedural.
- 🤝 **[docs/HANDOFF_TO_CODEX.md](docs/HANDOFF_TO_CODEX.md):** Hướng dẫn bàn giao triển khai logic chuyên sâu cho OpenAI Codex (Live query, công thức 1RM, InBody-to-Morph bridge).
- 🗺️ **[docs/FEATURE_ROADMAP.md](docs/FEATURE_ROADMAP.md):** Lộ trình 6 giai đoạn phát triển tính năng (IndexedDB sync, Progressive Overload, PWA, PDF Coach Reports).

---

## 📜 Giấy Phép (License)

Dự án được phân phối dưới giấy phép **MIT License**.
