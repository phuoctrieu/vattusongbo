# =============================================
# Stage 1: Build ReactJS Application
# =============================================
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files first (cache layer)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code (exclude backend folder)
COPY . .

# Build production - BẮT BUỘC set VITE_USE_REAL_BACKEND=true để dùng API thực
ENV VITE_API_BASE_URL=/api
ENV VITE_USE_REAL_BACKEND=true
RUN npm run build

# =============================================
# Stage 2: Serve with Nginx
# =============================================
FROM nginx:alpine

# Copy built files from stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
