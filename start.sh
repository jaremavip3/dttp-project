#!/bin/bash

# DTTP Project Startup Script
# This script starts both the server and client components

echo "🚀 Starting DTTP Project..."

# Check if environment files exist
if [ ! -f "server/.env" ]; then
    echo "❌ Error: server/.env file not found"
    echo "Please copy server/.env.example to server/.env and configure your environment variables"
    exit 1
fi

if [ ! -f "client/.env.local" ]; then
    echo "❌ Error: client/.env.local file not found"
    echo "Please copy client/.env.example to client/.env.local and configure your environment variables"
    exit 1
fi

echo "✅ Environment files found"

# Start server in background
echo "🔧 Starting FastAPI server..."
cd server
python unified_server.py &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Wait a moment for server to start
sleep 3

# Start client
echo "🌐 Starting Next.js client..."
cd ../client
npm run dev &
CLIENT_PID=$!
echo "Client started with PID: $CLIENT_PID"

echo ""
echo "🎉 DTTP Project is now running!"
echo "📱 Client: http://localhost:3000"
echo "🔗 API: http://localhost:5000"
echo "📋 API Docs: http://localhost:5000/docs"
echo ""
echo "To stop the application, press Ctrl+C"

# Wait for user to stop
wait $CLIENT_PID $SERVER_PID
