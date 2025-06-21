#!/bin/bash

echo "🎯 Multi-Model AI Search Server"
echo "=================================="
echo ""
echo "Starting 3 AI model servers..."
echo ""
echo "📍 Server URLs:"
echo "   CLIP:  http://localhost:5002"
echo "   EVA02: http://localhost:5003"
echo "   DFN5B: http://localhost:5004"
echo ""
echo "📚 API Documentation:"
echo "   CLIP:  http://localhost:5002/docs"
echo "   EVA02: http://localhost:5003/docs"
echo "   DFN5B: http://localhost:5004/docs"
echo ""
echo "🔄 Starting servers in background..."

# Change to server directory
cd "$(dirname "$0")"

# Start all servers in background
echo "🚀 Starting CLIP server on port 5002..."
python fastapi_clip_server.py &
CLIP_PID=$!

echo "🚀 Starting EVA02 server on port 5003..."
python siglip_fastapi_server.py &
EVA02_PID=$!

echo "🚀 Starting DFN5B server on port 5004..."
python dfn5b_fastapi_server.py &
DFN5B_PID=$!

echo ""
echo "✅ All servers started!"
echo "🔄 Servers are loading models... Please wait..."
echo ""
echo "Process IDs:"
echo "   CLIP:  $CLIP_PID"
echo "   EVA02: $EVA02_PID"
echo "   DFN5B: $DFN5B_PID"
echo ""
echo "To stop all servers, run:"
echo "   kill $CLIP_PID $EVA02_PID $DFN5B_PID"
echo ""
echo "Or press Ctrl+C and then run the kill command above"

# Function to handle cleanup
cleanup() {
    echo ""
    echo "🛑 Shutting down all servers..."
    kill $CLIP_PID $EVA02_PID $DFN5B_PID 2>/dev/null
    wait $CLIP_PID $EVA02_PID $DFN5B_PID 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Set up signal trap
trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait
