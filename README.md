# VTSongBo - Hệ Thống Quản Lý Vật Tư Song Bộ

Hệ thống quản lý kho vật tư song bộ cho nhà máy.

## Tech Stack

**Frontend:**
- React + TypeScript
- Vite
- TailwindCSS (hoặc UI library)

**Backend:**
- Node.js 18+
- Express.js
- PostgreSQL 16
- Docker & Docker Compose

## Cấu trúc dự án

```
├── backend/           # Backend API (Express + Node.js)
├── src/              # Frontend source (React + TypeScript)
├── docker-compose.yaml
└── README.md
```

## Khởi chạy dự án

### 1. Clone repository

```bash
git clone https://github.com/phuoctrieu/vattusongbo.git
cd vattusongbo
```

### 2. Chạy với Docker Compose

```bash
docker-compose up -d
```

Dịch vụ sẽ chạy tại:
- **Frontend**: http://localhost:8088
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

### 3. Development

#### Backend:
```bash
cd backend
npm install
cp env.example .env
npm run dev
```

#### Frontend:
```bash
npm install
npm run dev
```

## Database Schema

Database sẽ được tự động khởi tạo khi chạy Docker. Các bảng chính:
- `users` - Người dùng
- `warehouses` - Kho
- `suppliers` - Nhà cung cấp
- `inventory` - Vật tư
- `stock_history` - Lịch sử nhập/xuất
- `borrow_return` - Mượn/Trả

## Đóng góp

```bash
git add .
git commit -m "Your message"
git push origin main
```

## License

MIT
