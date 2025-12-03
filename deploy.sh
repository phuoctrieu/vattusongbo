#!/bin/bash

# =============================================
# 🚀 SÔNG BỒ ERP - SCRIPT TRIỂN KHAI LÊN VPS
# =============================================
# Chạy script này trên VPS Ubuntu 22.04/24.04
# Usage: chmod +x deploy.sh && ./deploy.sh
# =============================================

set -e

echo "============================================="
echo "🚀 BẮT ĐẦU TRIỂN KHAI SÔNG BỒ ERP"
echo "============================================="

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# BƯỚC 1: CẬP NHẬT HỆ THỐNG
# ============================================
echo -e "${YELLOW}[1/5] Cập nhật hệ thống...${NC}"
sudo apt update && sudo apt upgrade -y

# ============================================
# BƯỚC 2: CÀI ĐẶT DOCKER
# ============================================
echo -e "${YELLOW}[2/5] Cài đặt Docker...${NC}"

# Kiểm tra nếu Docker đã được cài
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker đã được cài đặt${NC}"
else
    # Cài đặt Docker theo hướng dẫn chính thức
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Thêm user hiện tại vào group docker
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✓ Docker đã được cài đặt thành công${NC}"
fi

# ============================================
# BƯỚC 3: CÀI ĐẶT DOCKER COMPOSE
# ============================================
echo -e "${YELLOW}[3/5] Kiểm tra Docker Compose...${NC}"

if docker compose version &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose đã sẵn sàng${NC}"
else
    echo -e "${RED}✗ Docker Compose chưa được cài đặt${NC}"
    exit 1
fi

# ============================================
# BƯỚC 4: TẠO FILE .ENV (NẾU CHƯA CÓ)
# ============================================
echo -e "${YELLOW}[4/5] Kiểm tra cấu hình...${NC}"

if [ ! -f .env ]; then
    echo -e "${YELLOW}Tạo file .env với cấu hình mặc định...${NC}"
    cat > .env << EOF
# Database Configuration
DB_USER=root_user
DB_PASSWORD=your_secure_password_here
DB_NAME=factory_db

# Domain Configuration (for SSL)
DOMAIN=vattu.pisunset.com
EOF
    echo -e "${GREEN}✓ File .env đã được tạo${NC}"
    echo -e "${RED}⚠ QUAN TRỌNG: Hãy sửa DB_PASSWORD trong file .env trước khi chạy!${NC}"
fi

# ============================================
# BƯỚC 5: BUILD VÀ KHỞI CHẠY
# ============================================
echo -e "${YELLOW}[5/5] Build và khởi chạy containers...${NC}"

# Dừng containers cũ nếu có
docker compose down 2>/dev/null || true

# Build và chạy
docker compose -f docker-compose.prod.yaml up -d --build

# Đợi containers khởi động
echo "Đợi containers khởi động..."
sleep 10

# Khởi tạo dữ liệu mặc định
echo -e "${YELLOW}Khởi tạo dữ liệu mặc định...${NC}"
curl -X POST http://localhost:8000/init-data 2>/dev/null || echo "Backend chưa sẵn sàng, bỏ qua init-data"

# ============================================
# HOÀN TẤT
# ============================================
echo ""
echo "============================================="
echo -e "${GREEN}🎉 TRIỂN KHAI HOÀN TẤT!${NC}"
echo "============================================="
echo ""
echo "📋 THÔNG TIN TRUY CẬP:"
echo "   - Ứng dụng: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_VPS_IP')"
echo "   - Nginx Proxy Manager: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_VPS_IP'):81"
echo "     + Email: admin@example.com"
echo "     + Password: changeme"
echo ""
echo "📋 BƯỚC TIẾP THEO - CẤU HÌNH SSL:"
echo "   1. Truy cập Nginx Proxy Manager (port 81)"
echo "   2. Đổi mật khẩu admin"
echo "   3. Thêm Proxy Host mới:"
echo "      - Domain: vattu.pisunset.com"
echo "      - Forward Hostname: songbo_frontend"
echo "      - Forward Port: 80"
echo "      - Bật SSL và Force SSL"
echo ""
echo "📋 TÀI KHOẢN MẶC ĐỊNH:"
echo "   - Username: admin"
echo "   - Password: admin123"
echo ""
echo -e "${YELLOW}⚠ LƯU Ý: Hãy đổi mật khẩu admin ngay sau khi đăng nhập!${NC}"
echo "============================================="

