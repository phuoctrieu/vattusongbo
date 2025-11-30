#!/bin/bash

# Script khởi tạo database schema cho VTSongBo Backend

echo "🔄 Waiting for PostgreSQL to be ready..."
sleep 5

echo "🔄 Running database initialization..."
node /app/src/scripts/initDb.js

echo "✅ Database initialization complete"
echo "🚀 Starting application..."
exec npm start

