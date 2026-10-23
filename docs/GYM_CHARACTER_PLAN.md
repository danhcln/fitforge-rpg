# Kế hoạch nhân vật gym hoạt hình 3D

Ngày nghiên cứu: 22/10/2026. Bản đầu đã triển khai; xem [kết quả và giới hạn](ATHLETE_IMPLEMENTATION.md). Các mục dưới đây giữ lại làm kế hoạch gốc và hướng mở rộng.
Lựa chọn của người dùng: **Hoạt hình 3D, màu sắc kiểu game**.

## Hướng đề xuất

Tạo một nhân vật trưởng thành phong cách hoạt hình thể thao: mặt thân thiện, tóc tạo khối, vai/ngực/tay rõ, tỷ lệ có kiểm soát; áo ba lỗ, quần short, giày tập. Màu xanh ngọc, xanh đậm, điểm nhấn cam phù hợp FitForge. Dùng cơ thể Regular làm gốc; tăng cơ vừa phải, không mặc định mọi người đều có dáng lực sĩ.

Thử Quaternius Universal Base Characters trước. Kiểm tra mẫu thực tế trong gói miễn phí trước khi chốt; trang tác giả phân biệt bản Standard và Source, nên không giả định toàn bộ model, kiểu tóc và file .blend đều miễn phí. Nếu thiếu mẫu phù hợp, dựng từ MPFB với cùng định hướng hoạt hình.

## Hiện trạng đã kiểm tra

- Nhánh feature/phase-5-rpg-planning, commit 83b04f8.
- Trên trang /character: đầu có mảng kéo dài, thân dưới thành khối giống váy; toàn thân gần như cùng màu.
- public/models/gym_avatar_v3.glb: 19.158 đỉnh, 36.972 tam giác, một mesh, một material.
- Không có texture, UV, skin/skeleton hoặc animation trong GLB. Chỉ có POSITION; code tính normals khi nạp.
- 8 shape keys là macro MPFB, không phải bộ chỉnh các nhóm cơ gym.
- Helper geometry chưa được loại bỏ là giả thuyết mạnh cần kiểm tra trong Blender, chưa xác nhận bằng việc mở source .blend.
- Repo hiện không có source .blend của model. Việc làm đẹp cần công việc asset trong Blender, ngoài chỉnh code React.
- Adapter GLB hiện chủ động tắt tự động biến dạng theo buổi tập; dữ liệu tiến trình chưa tương đương cơ chế morph hình thể hoàn chỉnh.

## Nguồn tham khảo đã tìm

| Nguồn | Mục đích trong dự án | Điều cần biết |
| --- | --- | --- |
| [Quaternius Universal Base Characters](https://quaternius.com/packs/universalbasecharacters) | Nguồn mẫu hoạt hình ưu tiên, tham khảo tỷ lệ và tóc | Tác giả nêu humanoid rig, trung bình 13k tam giác, FBX/glTF, CC0. Phạm vi gói miễn phí khác Source. Không thấy cam kết sẵn morph tăng cơ. |
| [MPFB2 GitHub](https://github.com/makehumancommunity/mpfb2) | Phương án tạo base người và khảo sát morph | [Giấy phép](https://github.com/makehumancommunity/mpfb2/blob/master/LICENSE.md) phân biệt code GPL và asset đi kèm CC0; asset cộng đồng cần kiểm tra riêng. |
| [MPFB Export Copy](https://static.makehumancommunity.org/mpfb/docs/exporting/export_copy.html) | Chuẩn hóa bản xuất, bỏ helper, xử lý mask và modifier | Bake modelling keys sẽ mất bộ key đó; cần giữ source và xây bộ morph game riêng có cùng topology. |
| [TalkingHead: MPFB → GLB](https://github.com/met4citizen/TalkingHead/blob/main/blender/MPFB/MPFB.md) | Tham khảo quy trình xuất nhân vật có mặt, vật liệu, rig | Chỉ tham khảo pipeline; không cần thêm hệ thống nói chuyện vào game. |
| [Three.js skinning + morph example](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_animation_skinning_morph.html) | Tham khảo chạy animation và morph cùng nhau | Có [demo tương tác](https://threejs.org/examples/webgl_animation_skinning_morph.html); không phải asset vận động viên. |
| [Mixamo FAQ chính thức](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) | Nguồn rig/animation dự phòng | Cần Adobe ID. Chỉ cân nhắc khi thiếu clip; không phụ thuộc dịch vụ khi game chạy. |

## Các mốc triển khai

### 1. Mẫu ngoại hình đầu tiên

Chọn một base trưởng thành, kiểm tra giấy phép/gói tải, nhập Blender. Làm mặt, mắt, chân mày, tóc, đồ tập và giày; phân biệt vật liệu da/tóc/vải. Ưu tiên màu phẳng có đổ bóng mềm, texture nhỏ nếu cần. Tạo ảnh trước, bên, sau và góc 3/4.

Đưa bản GLB tĩnh vào game ngay để xem trong ánh sáng thực tế của ứng dụng. Camera căn theo kích thước model; đủ đầu và chân trên desktop/mobile. Chỉ chuyển sang mốc 2 khi hình dáng đã đạt phong cách người dùng chọn.

**Nghiệm thu:** nhìn rõ mặt và hai chân; không có mảng helper/tóc/váy dư, hốc mắt tối bất thường hay bề mặt giống sáp. Có đồ tập hoàn chỉnh và dáng đứng tự nhiên.

### 2. Nhân vật có sức sống

Hoàn thiện humanoid rig, skin weights và pose nghỉ. Thêm idle/thở nhẹ, chớp mắt, động tác ăn mừng ngắn. Kiểm tra vai, khuỷu tay, hông và đầu gối khi gập. Chuẩn hóa rest pose khi chuyển animation từ nguồn khác; không giả định mọi clip dùng chung được ngay.

**Nghiệm thu:** bàn chân bám sàn, không trượt/lơ lửng; không xuyên áo hoặc biến dạng khớp rõ rệt; chuyển động không giật khi đổi clip.

### 3. Bộ biến đổi hình thể gym

V1 ưu tiên 4 điều khiển: cơ tổng thể, mỡ cơ thể, vai/ngực, chân. Mở rộng tiếp thành ngực, vai, tay, lưng, đùi, bắp chân khi asset đạt chất lượng. Shape keys phải có cùng số/thứ tự đỉnh; không morph trực tiếp giữa hai model Regular/Superhero khác topology.

Tạo ba preset để kiểm tra: ít cơ, cân đối, nhiều cơ; kiểm tra độc lập các mức mỡ. Không scale cả người để giả tăng cơ. Quần áo phải có morph tương ứng hoặc phương pháp bám thân đã được kiểm thử. Test từng key và tổ hợp ở 0/0,5/1 để phát hiện xuyên mesh.

**Nghiệm thu:** vùng cần đổi biến đổi rõ, mặt và chiều dài tay/chân không méo; kết hợp cơ/mỡ không làm vỡ hình; áo quần theo sát thân.

### 4. Tích hợp FitForge

- AvatarModel: hỗ trợ nhiều mesh, rig, vật liệu và morph của cả thân/quần áo; tạo instance riêng khi so sánh hai avatar.
- CharacterViewer/CameraControls: căn khung tự động, bóng tiếp xúc mềm, ánh sáng làm rõ khối, góc trước/sau/bên.
- AvatarCustomizationPanel: chỉ hiện các tùy chỉnh hoạt động, dùng tên thân thiện; thông tin export/MPFB chuyển sang vùng phát triển.
- Lưu cấu hình theo model ID và phiên bản; preset macro của GLB cũ không áp dụng vào model mới.
- Kết nối số đo vào nhóm morph đã kiểm thử, có chuyển động nội suy. Thể trạng đo, mô phỏng mục tiêu và bản chỉnh thủ công giữ nguồn riêng.
- Giữ XP cho tiến trình RPG/trang phục/hiệu ứng. Không tự suy luận tập một buổi tương đương tăng cơ thật.

**Nghiệm thu:** reload giữ ngoại hình; đổi model không lỗi preset; sửa/chọn phiếu cập nhật đúng nguồn; hai avatar so sánh không ảnh hưởng lẫn nhau; mất WebGL vẫn dùng được phần ghi tập.

### 5. Tối ưu và bàn giao

Mục tiêu ban đầu, cần đo trên máy thật: khoảng 15–30k tam giác cho nhân vật kèm trang phục, GLB dưới 8 MB, texture tối đa 1–2K nếu dùng; ưu tiên 60 FPS trên máy người dùng và tối thiểu 30 FPS trên thiết bị di động kiểm thử. Điều chỉnh theo kết quả đo, không coi đây là kết quả đã đạt.

Kiểm tra GLB thiếu tài nguyên, normals, UV khi có texture, morph names, rig và animation. Render ở Blender và trình duyệt để so sánh. Kiểm tra desktop/mobile, xoay/zoom, tải lại, đổi preset và dữ liệu cũ. Chạy test/build/lint khi tích hợp code.

Bàn giao: source .blend có thể sửa, GLB runtime, texture cần thiết, script/thiết lập export, ảnh các góc, bảng tên morph, license/nguồn asset và ghi nhận hiệu năng. Giữ riêng source chỉnh sửa và bản xuất đã bake.

## Phạm vi ưu tiên

Bản đầu: một nhân vật hoàn thiện, một bộ đồ tập, idle, vài màu da/tóc/quần áo, 4 morph chính. Giới tính/kiểu tóc bổ sung, nhiều trang phục và hoạt cảnh squat/curl là các mốc sau. Hoạt cảnh cầm tạ cần xử lý bàn tay bám dụng cụ và tiếp xúc sàn riêng.

Mốc bắt đầu được đề xuất là một nhân vật đẹp đứng trong game với bộ đồ tập hoàn chỉnh. Chất lượng silhouette, mặt và vật liệu quyết định việc chọn asset; không triển khai hàng chục thanh trượt trước khi mốc này đạt.
