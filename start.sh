#!/bin/bash

# DTTP Project Startup Script (Docker-based)
# This script starts both the server (Docker) and client (Node.js) components

echo "🚀 Starting DTTP Project with Docker..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Check if environment files exist
if [ ! -f "server/.env" ]; then
    echo "❌ Error: server/.env file not found"
    echo "Please configure your server environment variables"
    exit 1
fi

if [ ! -f "client/.env.local" ]; then
    echo "❌ Error: client/.env.local file not found"
    echo "Please configure your client environment variables"
    exit 1
fi

echo "✅ Environment files found"

# Start server with Docker Compose
echo "🔧 Starting Docker containers..."
cd server
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "❌ Failed to start Docker containers"
    exit 1
fi
echo "✅ Docker containers started"

# Wait a moment for server to be healthy
echo "⏳ Waiting for server to be ready..."
sleep 10

# Check server health
if curl -f http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ Server is healthy"
else
    echo "⚠️  Server might still be starting up..."
fi

# Start client
echo "🌐 Starting Next.js client..."
cd ../client
npm run dev &
CLIENT_PID=$!
echo "Client started with PID: $CLIENT_PID"

echo ""
echo "🎉 DTTP Project is now running!"
echo "📱 Client: http://localhost:3000"
echo "🔗 API: http://localhost:8000"
echo "📋 API Docs: http://localhost:8000/docs"
echo "🐳 Docker containers: docker ps"
echo ""
echo "To stop the application:"
echo "  - Client: Press Ctrl+C"
echo "  - Server: cd server && docker-compose down"

# Wait for user to stop client
wait $CLIENT_PID
