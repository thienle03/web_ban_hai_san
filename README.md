# 📦 **Seafood E-Commerce – Fullstack Web Project**

Dự án xây dựng hệ thống **website bán hải sản** gồm đầy đủ tính năng người dùng, người bán và admin.
Backend sử dụng **Node.js + Express + MongoDB**, frontend thuần **HTML/CSS/JavaScript**, chia tách thành hai phần độc lập.

---

## 🏗 **Cấu trúc dự án**

```
web_ban_hai_san/
│── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── controllers/
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env (bỏ qua khi commit)
│
│── frontend/
│   ├── Page/
│   ├── login-page/
│   ├── cart-page/
│   ├── seller-page/
│   ├── admin/
│   ├── news/
│   ├── styles/
│   └── script.js
│
└── .gitignore
```

---

# 🚀 **1. Cài đặt & chạy Backend**

## 📌 **Yêu cầu**

- Node.js ≥ 18
- MongoDB Atlas hoặc MongoDB local
- Git

## 📁 Cài dependency

```bash
cd backend
npm install
```

## ⚙️ Tạo file `.env`

Tạo file `.env` trong thư mục **backend**:

```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?appName=Cluster0
PORT=5000
JWT_SECRET=your_secret_key
```

📌 Lưu ý:

- Không để lộ `.env` (đã thêm vào `.gitignore`)
- Nếu password có ký tự đặc biệt → cần encode URL

## ▶️ Chạy server

```bash
npm run dev
```

Nếu thành công sẽ thấy:

```
🚀 Server running on port 5000
✅ MongoDB connected
```

---

# 🌐 **2. Chạy Frontend**

Frontend là các file HTML/CSS/JS thuần.

Cách chạy nhanh nhất:

### Cách 1 — Dùng Live Server (VSCode)

Bấm chuột phải **index.html** → “Open with Live Server”.

### Cách 2 — Dùng live-server CLI

```bash
npm install -g live-server
live-server frontend/Page
```

---

# 👥 **3. Chức năng hệ thống**

## 👤 Người dùng (User)

- Đăng ký / đăng nhập
- Xem sản phẩm
- Thêm giỏ hàng
- Thanh toán
- Xem lịch sử đơn hàng
- Xem tin tức
- Quản lý hồ sơ cá nhân

## 🏪 Người bán (Seller)

- Dashboard & thống kê
- Quản lý sản phẩm (CRUD)
- Quản lý đơn hàng
- Xem doanh thu & biểu đồ (chart.js)

## 🛠 Admin

- Quản lý tất cả người dùng
- Quản lý sản phẩm
- Quản lý đơn hàng
- Quản lý seller
- Theo dõi hệ thống qua dashboard

---

# 🔐 **4. API Backend chính**

| Method | Endpoint             | Mô tả                        |
| ------ | -------------------- | ---------------------------- |
| POST   | `/api/auth/register` | Đăng ký user / seller        |
| POST   | `/api/auth/login`    | Đăng nhập                    |
| GET    | `/api/products`      | Lấy danh sách sản phẩm       |
| POST   | `/api/products`      | Thêm sản phẩm (seller/admin) |
| POST   | `/api/orders`        | Tạo đơn                      |
| GET    | `/api/orders/user`   | Lịch sử đơn hàng user        |
| GET    | `/api/admin/users`   | Admin quản lý user           |

> Toàn bộ API dùng JWT để xác thực.

---

# 🧪 **5. Tài khoản mẫu**

Nếu bạn tạo tài khoản admin trong database:

```
Email: ad@gmail.com
Password: 123456
Role: admin
```

User & Seller có thể đăng ký trực tiếp từ giao diện frontend.

---

# 🗂 **6. Công nghệ sử dụng**

### **Backend**

- Node.js, Express.js
- MongoDB, Mongoose
- JWT, bcryptjs
- Multer, Cloudinary
- CORS

### **Frontend**

- HTML5, CSS3, JavaScript
- Chart.js
- Fetch API
- LocalStorage

---

# 📖 **7. Chạy thử toàn hệ thống**

1. Bật backend:

   ```
   npm run dev
   ```

2. Mở frontend → login-page → đăng nhập
3. Hệ thống tự redirect theo role:

   - user → Page/index.html
   - seller → seller-page/dashboard/index.html
   - admin → admin/dashboard/index.html

---

# 🧹 **8. Git Ignore**

Dự án đã cấu hình `.gitignore` để tránh đẩy:

- node_modules
- .env
- uploads
- file hệ thống (DS_Store, Thumbs.db)
- build/dist
