# 🚀 Sông Bồ ERP - Tài liệu Kỹ thuật & Triển khai

Tài liệu này mô tả kiến trúc hệ thống và hướng dẫn triển khai ứng dụng lên VPS sử dụng Docker.

## 🔐 Thông tin đăng nhập mặc định

| Tài khoản | Mật khẩu | Vai trò |
|-----------|----------|---------|
| `admin`   | `adminSB` | ADMIN  |

> **Lưu ý:** Sau khi triển khai, hãy gọi API `/init-data` để khởi tạo dữ liệu mặc định.

## 1. Kiến trúc Hệ thống (Architecture)

Mô hình: **Client-Server** kết hợp **Reverse Proxy**.

*   **Frontend (ReactJS + Vite):**
    *   Chạy trong container Nginx.
    *   Nginx phục vụ file tĩnh và đóng vai trò Reverse Proxy.
    *   Gọi API thông qua đường dẫn tương đối `/api/...`.
*   **Backend (Python FastAPI):**
    *   Chạy trong container Python.
    *   Expose port 8000 (nội bộ).
    *   Xử lý logic nghiệp vụ và kết nối Database.
*   **Database (PostgreSQL):**
    *   Lưu trữ dữ liệu bền vững.

---

## 2. Docker Compose Configuration

Dưới đây là cấu hình chuẩn để tích hợp vào `docker-compose.yml`:

```yaml
services:
  # --- 1. Database (Dùng chung hoặc tạo mới) ---
  postgres:
    image: postgres:15-alpine
    container_name: songbo_postgres
    restart: always
    environment:
      POSTGRES_USER: root_user
      POSTGRES_PASSWORD: root_password
      POSTGRES_DB: factory_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  # --- 2. Backend API ---
  songbo_backend:
    build: ./backend_api # Trỏ vào thư mục chứa code Python
    container_name: songbo_backend
    restart: always
    environment:
      - DATABASE_URL=postgresql://root_user:root_password@postgres:5432/factory_db
    networks:
      - app-network
    depends_on:
      - postgres

  # --- 3. Frontend (Nginx) ---
  songbo_frontend:
    build: . # Trỏ vào thư mục chứa code React và Dockerfile
    container_name: songbo_frontend
    restart: always
    ports:
      - "80:80" # Mở port 80 ra internet
    networks:
      - app-network
    depends_on:
      - songbo_backend

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
```

---

## 3. PROMPT MẪU ĐỂ TRIỂN KHAI LÊN VPS (Cho AI Agent)

Bạn hãy copy toàn bộ nội dung dưới đây và gửi cho AI (như ChatGPT, Claude, hoặc AI hỗ trợ DevOps) để yêu cầu họ triển khai dự án này lên VPS của bạn.

```markdown
# YÊU CẦU: TRIỂN KHAI DỰ ÁN DOCKER LÊN VPS LINUX

Tôi có một dự án Fullstack (ReactJS + FastAPI + PostgreSQL) đã được đóng gói bằng Docker. Tôi muốn bạn hướng dẫn tôi hoặc viết script để deploy dự án này lên VPS (Ubuntu 22.04).

## THÔNG TIN DỰ ÁN:
1. **Frontend:** ReactJS (Vite), build ra static files, được phục vụ bởi Nginx container. Nginx có config proxy `/api` sang backend.
2. **Backend:** Python FastAPI, chạy port 8000 trong mạng nội bộ Docker.
3. **Database:** PostgreSQL.
4. **Cấu trúc thư mục:**
   /app
   ├── docker-compose.yml
   ├── nginx.conf
   ├── package.json
   ├── vite.config.ts
   ├── ... (các file React)
   └── backend_api/
       ├── main.py
       ├── requirements.txt
       └── Dockerfile

## NHIỆM VỤ CỦA BẠN:
Hãy đóng vai một kỹ sư DevOps chuyên nghiệp và thực hiện các bước sau:

**Bước 1: Chuẩn bị VPS**
- Viết các lệnh để update OS, cài đặt Docker và Docker Compose bản mới nhất trên Ubuntu.

**Bước 2: Thiết lập Project**
- Giả sử tôi đã upload code lên đó (hoặc qua Git clone).
- Hãy tạo giúp tôi file `Dockerfile` cho Frontend (Multi-stage build: Build Node.js -> Copy sang Nginx).

**Bước 3: Cấu hình SSL & Domain (Quan trọng)**
- Tôi muốn dùng domain `vattu.pisunset.com` (từ cloudfare)
- Hãy sửa file `docker-compose.yml` để thêm service **Nginx Proxy Manager** hoặc dùng **Certbot** để tự động cấp chỉ SSL miễn phí (HTTPS).
- Cấu hình để Port 80 và 443 của VPS trỏ vào ứng dụng.


---

## 4. Frontend Dockerfile (Tham khảo)

Để AI hoạt động tốt ở Bước 2 trong Prompt trên, đây là nội dung Dockerfile chuẩn cho Frontend:

```dockerfile
# Stage 1: Build
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Biến môi trường này quan trọng để build trỏ đúng API khi chạy production
ENV VITE_USE_REAL_BACKEND=true 
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Lưu ý không tạo ra nhiều file .md để tiết kiệm token