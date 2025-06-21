#!/usr/bin/env python3
"""
Simple Multi-Model Server Starter
Starts all 3 AI models using multiprocessing for better performance
"""

import multiprocessing
import uvicorn
import sys
import os
from pathlib import Path


def start_clip_server():
    """Start CLIP server on port 5002"""
    print("🚀 Starting CLIP server on port 5002...")
    os.chdir(Path(__file__).parent)
    uvicorn.run("fastapi_clip_server:app", host="0.0.0.0", port=5002, log_level="info")


def start_eva02_server():
    """Start EVA02 server on port 5003"""
    print("🚀 Starting EVA02 server on port 5003...")
    os.chdir(Path(__file__).parent)
    uvicorn.run(
        "siglip_fastapi_server:app", host="0.0.0.0", port=5003, log_level="info"
    )


def start_dfn5b_server():
    """Start DFN5B server on port 5004"""
    print("🚀 Starting DFN5B server on port 5004...")
    os.chdir(Path(__file__).parent)
    uvicorn.run("dfn5b_fastapi_server:app", host="0.0.0.0", port=5004, log_level="info")


def main():
    """Start all servers in parallel using multiprocessing"""
    print("🎯 Multi-Model AI Search Server")
    print("=" * 50)
    print("Starting 3 AI model servers in parallel...")
    print()
    print("📍 Server URLs:")
    print("   CLIP:  http://localhost:5002")
    print("   EVA02: http://localhost:5003")
    print("   DFN5B: http://localhost:5004")
    print()
    print("📚 API Documentation:")
    print("   CLIP:  http://localhost:5002/docs")
    print("   EVA02: http://localhost:5003/docs")
    print("   DFN5B: http://localhost:5004/docs")
    print()
    print("🔄 Starting servers... (This may take a few minutes)")
    print("Press Ctrl+C to stop all servers.")
    print()

    # Create processes for each server
    processes = []

    try:
        # Start CLIP server
        clip_process = multiprocessing.Process(target=start_clip_server)
        clip_process.start()
        processes.append(("CLIP", clip_process))

        # Start EVA02 server
        eva02_process = multiprocessing.Process(target=start_eva02_server)
        eva02_process.start()
        processes.append(("EVA02", eva02_process))

        # Start DFN5B server
        dfn5b_process = multiprocessing.Process(target=start_dfn5b_server)
        dfn5b_process.start()
        processes.append(("DFN5B", dfn5b_process))

        print("✅ All server processes started!")
        print("🔄 Servers are loading models... Please wait...")

        # Wait for all processes
        for name, process in processes:
            process.join()

    except KeyboardInterrupt:
        print("\n🛑 Shutting down all servers...")
        for name, process in processes:
            if process.is_alive():
                print(f"   Stopping {name} server...")
                process.terminate()
                process.join(timeout=5)
                if process.is_alive():
                    print(f"   Force killing {name} server...")
                    process.kill()
                    process.join()
        print("✅ All servers stopped")


if __name__ == "__main__":
    # Required for Windows multiprocessing
    multiprocessing.set_start_method("spawn", force=True)
    main()
