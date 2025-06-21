#!/bin/bash

# Start the DTTP FastAPI server

echo "🔧 Starting DTTP FastAPI Server..."

# Check if environment file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "Please copy .env.example to .env and configure your environment variables"
    exit 1
fi

echo "✅ Environment file found"
echo "📡 Starting server..."

python unified_server.py
