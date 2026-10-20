# PokéSurvivor Auto Bot & Cheat Suite (Tampermonkey)

Tool tự động và hỗ trợ chơi toàn diện cho web game [PokéSurvivor](https://pokesurvivor.com/).

---

## 🌟 Tính Năng Chính (v1.1.0)

| Nhóm Tính Năng | Chức Năng | Chi Tiết Kỹ Thuật |
| :--- | :--- | :--- |
| **🎰 Gacha & Kho Tài Nguyên** | **Gacha Miễn Phí (0 Vé)** | Hook `Gacha.costOf` trả về chi phí 0 vé, mở khóa nút quay ngay cả khi tài khoản có 0 vé. |
| | **Tùy Chỉnh Tỉ Lệ 5★ Legendary** | Can thiệp mảng phân bổ `Gacha.RATES`: Tùy chọn 1.5% (mặc định), 25%, 50%, hoặc **100% (chỉ ra Pokémon Huyền Thoại/5★)**. |
| | **100% Ra Shiny** | Kích hoạt cờ nội bộ `Gacha.debugForceShiny(99999)`: Mọi lượt quay Gacha đều ra Pokémon Shiny lấp lánh. |
| | **Nạp Nhanh Xu & Vé** | Nạp ngay `+100,000 Xu` và `+999 Vé x1 + 99 Vé x10` trực tiếp vào save game. |
| | **Mở Khóa Full Pokédex** | Mở khóa toàn bộ 966+ loài Pokémon và toàn bộ dạng Shiny vào Pokédex chỉ với 1 click. |
| **⚡ Nâng Cấp (Upgrades)** | **Nâng Cấp 0 Xu (Free Upgrade)** | Hook `Upgrades.cost` trả về 0 xu cho mọi cấp độ nâng cấp. |
| | **Max Nâng Cấp Pokémon Đang Chọn** | Nâng kịch trần toàn bộ 13 chỉ số (HP, ATK, Tốc độ, Cooldown, Thủ, Hồi máu, Nam châm, EXP, Xu...) cho Pokémon xuất trận. |
| | **Max Nâng Cấp Tất Cả Pokémon** | Quét và nâng kịch trần toàn bộ chỉ số cho mọi Pokémon đang sở hữu trong save. |
| **🤖 Tự Động (Auto-Play)** | **Né Quái Thông Minh (Smart Kite)** | Tính toán vector phản lực từ các cụm quái gần nhất (bán kính 160px), giữ cự ly an toàn và kiting mượt mà qua hook `Input.axis()`. |
| | **Hút Toàn Bản Đồ (Global Magnet)** | Gọi trực tiếp hàm nội bộ `Pickups.pullAll()` để hút 100% ngọc kinh nghiệm, vàng, vé và vật phẩm. |
| | **Tự Động Nâng Cấp (Auto LevelUp)** | Nhận diện trạng thái `levelup` và tự động chọn thẻ kỹ năng tối ưu (`RunUI.pick(0)`). |
| | **Tự Chọn Partner Bond & Item** | Tự động chọn kỹ năng liên kết Pokémon đồng hành và mở rương trang bị. |
| | **Tự Chơi Lại (Auto Restart)** | Tự động nhấn nút thoát về menu khi kết thúc trận và bắt đầu vòng mới (`Flow.play()`). |
| **🛡️ Chiến Đấu (God Mode)** | **Bất Tử (God Mode)** | Duy trì `player.invuln = 10` và liên tục phục hồi `player.hp = player.maxHp`. |
| | **1-Hit Kill (Sát Thương x100)** | Nhân sát thương lên x100 (`player.atkMul = 100`), dọn quái tức thì. |
| | **Bắn Không Cooldown** | Giảm 95% thời gian hồi chiêu (`player.cdMul = 0.05`), xả chiêu liên thanh. |
| | **Tăng Tốc Game (Speed Hack)** | Tùy chỉnh tốc độ trận đấu: 1x, 1.5x, 2x, 3x, 5x qua `Game.debugSpeed()`. |
| | **Tăng Tốc Di Chuyển** | Tăng tốc độ chạy nhân vật: 1x, 1.5x, 2.0x. |
| **🎨 Giao Diện (Floating HUD)** | **Dashboard White-Blue Hiện Đại** | Giao diện kéo thả, thu nhỏ tiện lợi, hiển thị thời gian thực máu, số quái, cấp độ. |
| | **Phím Tắt Tiện Lợi (Hotkey)** | Bấm phím **`H`** trên bàn phím để ẩn/hiện menu bất cứ lúc nào. |

---

## 🚀 Hướng Dẫn Cài Đặt Vào Tampermonkey

### Cách 1: Cài đặt trực tiếp (Khuyên dùng - Tự động cập nhật)
Bấm vào đường link cài đặt trực tiếp bên dưới (Tampermonkey sẽ tự nhận diện và hiện bảng cài đặt):

👉 **[Cài Đặt Script Trực Tiếp (Raw UserScript)](https://raw.githubusercontent.com/nhoxboo/pokesurvivor-auto/main/pokesurvivor-auto.user.js)**

### Cách 2: Cài đặt thủ công
1. Cài đặt tiện ích mở rộng **Tampermonkey** trên trình duyệt (Chrome, Edge, Brave, Cốc Cốc, Firefox...).
2. Bấm vào biểu tượng Tampermonkey -> Chọn **"Create a new script..."** (Tạo script mới).
3. Xóa toàn bộ nội dung mặc định và dán toàn bộ code từ file `pokesurvivor-auto.user.js`.
4. Nhấn `Ctrl + S` để lưu.
5. Truy cập [https://pokesurvivor.com/](https://pokesurvivor.com/) và trải nghiệm.
