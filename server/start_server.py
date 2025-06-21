#!/usr/bin/env python3
"""
Start the unified multi-model AI search server
"""

import sys
import os
import asyncio
import logging

# Add the server directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def main():
    """Main function to start the unified server"""
    print("🎯 Multi-Model AI Search Server v2.0")
    print("=" * 50)
    print("🚀 Starting unified server with 3 AI models...")
    print()
    print("📍 Server URL: http://localhost:5000")
    print("📚 API Documentation: http://localhost:5000/docs")
    print()
    print("🤖 Available Models:")
    print("   • CLIP  - OpenAI foundational model")
    print("   • EVA02 - Advanced vision transformer")
    print("   • DFN5B - Apple's latest multimodal model")
    print()
    print("🔄 Loading models... (This may take a few minutes)")
    print("Press Ctrl+C to stop the server.")
    print()

    try:
        import uvicorn
        from unified_server import app
        
        # Run the server
        config = uvicorn.Config(
            app=app,
            host="0.0.0.0",
            port=5000,
            log_level="info",
            reload=False  # Disable reload for production
        )
        
        server = uvicorn.Server(config)
        await server.serve()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")
        print("✅ Server stopped")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
