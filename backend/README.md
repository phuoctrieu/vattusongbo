# VTSongBo Backend API

Backend API cho hệ thống quản lý vật tư song bộ nhà máy sử dụng Express.js + PostgreSQL.

## Cấu trúc dự án

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # Cấu hình kết nối PostgreSQL
│   ├── controllers/           # Business logic
│   ├── routes/                # API routes
│   ├── middleware/            # Express middleware
│   ├── scripts/               # Utility scripts
│   └── server.js              # Entry point
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Khởi chạy

### Development (Local)

```bash
cd backend
npm install
cp env.example .env
# Chỉnh sửa .env với thông tin phù hợp
npm run dev
```

### Production (Docker)

```bash
docker-compose up -d
```

## API Endpoints

- **Auth**: `/api/users/login`, `/api/users/register`
- **Users**: `/api/users`
- **Warehouses**: `/api/warehouses`
- **Suppliers**: `/api/suppliers`
- **Inventory**: `/api/inventory`
- **Stock**: `/api/stock`
- **Borrow/Return**: `/api/borrow-return`
- **Reports**: `/api/reports`

Chi tiết API documentation xem tại: `http://localhost:3001/`

