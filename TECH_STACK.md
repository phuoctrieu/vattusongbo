# 🚀 Deployment Guide - NMTĐ Sông Bồ (Shared Database)

Tài liệu này hướng dẫn thêm ứng dụng Sông Bồ vào file `docker-compose.yml` gốc, sử dụng lại Database **đã có sẵn** của hệ thống.

---

## 1. Cấu trúc thư mục

```text
my-smart-factory/                  <-- ROOT (Chứa docker-compose.yml GỐC)
│
├── docker-compose.yml             <-- File cấu hình chung cho toàn bộ hệ thống
│
├── vattusongbo/                   <-- Folder dự án Sông Bồ
│   ├── Dockerfile
│   ├── ...
│   └── vattusongbo/               <-- Folder con chứa Backend
│       ├── backend_api/
│       └── init.sql
└── ...
```

---

## 2. Cập nhật `docker-compose.yml`

Hãy **thêm** 2 service bên dưới vào file `docker-compose.yml` hiện có của bạn (giữ nguyên service `postgres` cũ, không tạo mới):

```yaml
services:
  # ... (Các service cũ của bạn: postgres, app khá c...)

  # ==========================================
  # APP: QUẢN LÝ VẬT TƯ SÔNG BỒ
  # ==========================================

  # 1. Backend API
  songbo_backend:
    # Trỏ vào thư mục backend nằm sâu bên trong
    build: ./vattusongbo/vattusongbo/backend_api
    container_name: songbo_backend
    restart: always
    ports:
      - "8090:8000" # Port API
    environment:
      # Kết nối vào service 'postgres' ĐÃ CÓ SẴN trong file compose này
      - DATABASE_URL=postgresql://root_user:root_password@postgres:5432/factory_db
    depends_on:
      - postgres # Đợi service postgres gốc khởi động
    networks:
      - factory-network

  # 2. Frontend UI
  songbo_frontend:
    build: 
      context: ./vattusongbo
      dockerfile: Dockerfile
    container_name: songbo_frontend
    restart: always
    ports:
      - "8088:80" # Port Web truy cập
    environment:
      - VITE_USE_REAL_BACKEND=true
    depends_on:
      - songbo_backend
    networks:
      - factory-network

# Đảm bảo network trùng với network của postgres hiện tại
networks:
  factory-network:
    external: true # Nếu network đã được tạo trước đó
    # Hoặc driver: bridge (nếu chung file compose)
```

---

## 3. Lưu ý về Database

Vì dùng chung Database `postgres` có sẵn, file `init.sql` của dự án này có thể sẽ không tự chạy (do thư mục data đã tồn tại).

Backend (Python) đã được lập trình để **tự động tạo bảng** (Table) khi khởi động. Tuy nhiên, bạn cần đảm bảo Database tên là `factory_db` đã tồn tại.

Nếu Backend báo lỗi không tìm thấy DB, hãy chạy lệnh sau một lần duy nhất:

```bash
# Truy cập vào container postgres đang chạy
docker exec -it factory_postgres psql -U root_user -c "CREATE DATABASE factory_db;"
```
