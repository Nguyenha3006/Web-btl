# 🗂️ Flashcard Spaced Repetition App

Ứng dụng học tập thông minh dựa trên phương pháp **Lặp lại ngắt quãng (Spaced Repetition)** giúp tối ưu hóa khả năng ghi nhớ từ vựng, thuật ngữ hoặc kiến thức môn học.

---

## 🚀 Tính năng cốt lõi (Core Features)

### 1. Xác thực người dùng (Authentication)
* Đăng ký tài khoản mới.
* Đăng nhập hệ thống bảo mật bằng **JWT (JSON Web Token)** hoặc **Session**.
* Bảo vệ các tuyến đường (Protected Routes) yêu cầu đăng nhập.

### 2. Quản lý Flashcard (CRUD & Decks)
* Tạo, sửa, xóa các bộ thẻ (Decks).
* Thêm, sửa, xóa các thẻ flashcard bên trong từng bộ thẻ.

### 3. Trình học thông minh (Learning Mode)
* Lật thẻ (Flip card) để xem mặt trước (Câu hỏi/Từ khóa) và mặt sau (Câu trả lời/Định nghĩa).
* Đánh giá mức độ thuộc bài sau mỗi lượt: **Easy**, **Medium**, **Hard**.

### 4. Thuật toán Lặp lại ngắt quãng (Spaced Repetition)
Hệ thống tự động tính toán thời gian ôn tập tiếp theo dựa trên lựa chọn của bạn:
* 🔴 **Hard:** Ôn lại sau 1 ngày.
* 🟡 **Medium:** Ôn lại sau 3 ngày.
* 🟢 **Easy:** Ôn lại sau 7 ngày.

*Hệ thống sử dụng `node-cron` để tự động quét và kiểm tra các thẻ đến hạn (Due cards) vào lúc 00:00 mỗi ngày.*

### 5. Hệ thống thông báo (Notification)
* **Giao diện:** Hiển thị số lượng thẻ cần ôn tập ngay khi đăng nhập (Ví dụ: *"You have 12 cards to review"*).
* **Mở rộng:** Gửi email nhắc nhở học tập hàng ngày.

---

## 🏗️ Kiến trúc & Công nghệ sử dụng (Tech Stack)

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla JS hoặc React) / EJS Template Engine.
* **Backend:** Node.js, Express.js (Xây dựng RESTful API).
* **Database:** MongoDB + Mongoose (hoặc MySQL tùy thuộc vào yêu cầu của môn học).
* **Task Scheduling:** `node-cron` (Lập lịch quét data hàng ngày).

---

## 📁 Cấu trúc thư mục dự án (Project Structure)

```text
project/
│
├── client/                 # Giao diện người dùng (Frontend)
│   ├── views/              # Các file giao diện (EJS/HTML)
│   ├── public/             # CSS, Hình ảnh, Assets tĩnh
│   └── scripts/            # Logic JavaScript xử lý ở Frontend
│
├── server/                 # Xử lý Logic và API (Backend)
│   ├── models/             # Định nghĩa cấu trúc Database (Schema)
│   ├── routes/             # Định tuyến các API Endpoints
│   ├── controllers/        # Xử lý logic nghiệp vụ chi tiết
│   ├── middleware/         # Kiểm tra quyền truy cập (Auth Middleware, v.v.)
│   └── cron/               # Cấu hình Node-cron chạy ngầm tự động
│
├── app.js                  # File chạy chính của ứng dụng Server
└── package.json            # Cấu hình dự án và quản lý các thư viện (Dependencies)
