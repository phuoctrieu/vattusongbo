#!/bin/bash

# Script để setup và chạy dự án VTSongBo

echo "🔍 Checking for existing factory_postgres container..."

if docker ps -a | grep -q factory_postgres; then
    echo "✅ Found existing factory_postgres container"
    echo ""
    echo "📋 Choose an option:"
    echo "1. Use existing postgres container (recommended if it has data)"
    echo "2. Remove old container and create new one"
    echo ""
    read -p "Enter your choice (1 or 2): " choice
    
    if [ "$choice" = "2" ]; then
        echo "🗑️  Stopping and removing old containers..."
        docker stop factory_postgres songbo_backend songbo_frontend vattusongbo_backend vattusongbo_frontend 2>/dev/null || true
        docker rm factory_postgres songbo_backend songbo_frontend vattusongbo_backend vattusongbo_frontend 2>/dev/null || true
        echo "✅ Cleanup complete!"
        echo ""
        echo "🚀 Starting with full docker-compose (including postgres)..."
        docker-compose -f docker-compose.full.yaml up -d --build
    else
        echo "🚀 Starting backend and frontend only (using existing postgres)..."
        docker-compose up -d --build
    fi
else
    echo "❌ No existing postgres container found"
    echo "🚀 Starting full stack (postgres + backend + frontend)..."
    docker-compose -f docker-compose.full.yaml up -d --build
fi

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "📊 Checking status..."
docker ps | grep -E "factory_postgres|vattusongbo"

echo ""
echo "✅ Done! Services are running at:"
echo "   - Frontend: http://localhost:8088"
echo "   - Backend:  http://localhost:3001"
echo "   - Database: localhost:5432"
echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo "   docker logs factory_postgres"
