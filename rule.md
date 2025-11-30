# Yêu cầu tạo backend Express + Node.js + PostgreSQL + Docker

Hãy tạo cho tôi **một backend hoàn chỉnh** dùng Express + Node.js, kết nối đến PostgreSQL chạy trong Docker của VPS tôi. Backend phải xuất ra **tất cả mã nguồn đầy đủ**, gồm: code Express, kết nối PostgreSQL, mẫu AI API, Dockerfile, docker-compose.yml, và `.env.example`.

## 1. Công nghệ sử dụng
- Node.js (18+)
- Express.js
- PostgreSQL (pg)
- dotenv
- cors
- body-parser hoặc express.json()
- Dockerfile
- docker-compose.yml

---

## 2. Thông tin kết nối PostgreSQL
Trên VPS tôi đã có container Postgres đang chạy với thông tin:

- Host: `postgres`
- Port: `5432`
- Database: `factory_db`
- Username: `root_user`
- Password: `root_password`

---

## 3. Cấu trúc thư mục yêu cầu
Tạo project với cấu trúc chuẩn node JS
---

## 4. Yêu cầu chức năng

### 4.1. Kết nối PostgreSQL
Tạo `src/config/db.js` dùng `pg.Pool`:
- Pool tự kết nối lại khi mất kết nối.
- Export pool.
## 5 Cấu hình container docker postgres như sau:
version: '3.8'

services:
  # --- DATABASE CHUNG (PostgreSQL) ---
  postgres:
    image: postgres:16-alpine
    container_name: factory_postgres
    restart: always
    environment:
      POSTGRES_USER: root_user
      POSTGRES_PASSWORD: root_password
      POSTGRES_DB: factory_db
    volumes:
      - ./postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U root_user -d factory_db"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - factory-network


##6 Hạn chế việc tạo file MD hướng dẫn đễ đỡ tốn token của tôi
## Khi tạo xong, tôi muốn đẩy lên github với thông tin như sau:
https://github.com/phuoctrieu/vattusongbo.git
usename: phuoctrieu
