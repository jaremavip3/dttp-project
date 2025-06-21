#!/usr/bin/env python3
"""
Multi-Model AI Search Server
Starts all 3 CLIP-based models (CLIP, EVA02, DFN5B) together
"""

import asyncio
import multiprocessing
import subprocess
import sys
import os
import signal
import time
from pathlib import Path

# Server configurations
SERVERS = [
    {
        "name": "CLIP",
        "file": "fastapi_clip_server.py",
        "port": 5002,
        "description": "OpenAI CLIP model",
    },
    {
        "name": "EVA02",
        "file": "siglip_fastapi_server.py",
        "port": 5003,
        "description": "EVA02 Large model (timm/eva02_large_patch14_clip_336.merged2b_s6b_b61k)",
    },
    {
        "name": "DFN5B",
        "file": "dfn5b_fastapi_server.py",
        "port": 5004,
        "description": "Apple DFN5B model",
    },
]

# Global list to track server processes
server_processes = []


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    print("\n🛑 Shutting down all servers...")
    for process in server_processes:
        if process.poll() is None:  # Process is still running
            print(f"   Terminating process {process.pid}")
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print(f"   Force killing process {process.pid}")
                process.kill()

    print("✅ All servers stopped")
    sys.exit(0)


def start_server(server_config):
    """Start a single server"""
    name = server_config["name"]
    file = server_config["file"]
    port = server_config["port"]
    description = server_config["description"]

    print(f"🚀 Starting {name} server on port {port}")
    print(f"   Model: {description}")
    print(f"   File: {file}")

    try:
        # Start the server process
        process = subprocess.Popen(
            [sys.executable, file],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1,
        )

        server_processes.append(process)

        # Monitor server startup
        startup_timeout = 60  # 60 seconds timeout
        start_time = time.time()

        while time.time() - start_time < startup_timeout:
            if process.poll() is not None:
                # Process has terminated
                output, _ = process.communicate()
                print(f"❌ {name} server failed to start:")
                print(output)
                return False

            time.sleep(1)

        print(f"✅ {name} server started successfully")
        return True

    except Exception as e:
        print(f"❌ Failed to start {name} server: {e}")
        return False


def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")

    required_packages = [
        "fastapi",
        "uvicorn",
        "open_clip_torch",
        "torch",
        "pillow",
        "numpy",
        "transformers",
    ]

    missing_packages = []

    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)

    if missing_packages:
        print(f"❌ Missing required packages: {', '.join(missing_packages)}")
        print("💡 Install them with: pip install -r requirements_fastapi.txt")
        return False

    print("✅ All dependencies are installed")
    return True


def main():
    """Main function to start all servers"""
    print("🎯 Multi-Model AI Search Server")
    print("=" * 50)

    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Check dependencies
    if not check_dependencies():
        sys.exit(1)

    # Check if we're in the right directory
    current_dir = Path.cwd()
    if not (current_dir / "fastapi_clip_server.py").exists():
        print("❌ Server files not found in current directory")
        print("💡 Make sure you're running this from the server/ directory")
        sys.exit(1)

    print(f"\n📂 Working directory: {current_dir}")
    print(f"🌐 Starting {len(SERVERS)} AI model servers...\n")

    # Start all servers
    successful_starts = 0

    for server_config in SERVERS:
        if start_server(server_config):
            successful_starts += 1
        else:
            print(f"❌ Failed to start {server_config['name']} server")

    if successful_starts == 0:
        print("❌ No servers started successfully")
        sys.exit(1)

    print(f"\n🎉 Successfully started {successful_starts}/{len(SERVERS)} servers")
    print("\n📍 Server URLs:")
    for server_config in SERVERS:
        port = server_config["port"]
        name = server_config["name"]
        print(f"   {name}: http://localhost:{port}")

    print(f"\n📚 API Documentation:")
    for server_config in SERVERS:
        port = server_config["port"]
        name = server_config["name"]
        print(f"   {name}: http://localhost:{port}/docs")

    print("\n🔄 All servers are running. Press Ctrl+C to stop all servers.")

    try:
        # Keep the main process alive and monitor server processes
        while True:
            time.sleep(1)

            # Check if any server has died
            for i, process in enumerate(server_processes[:]):
                if process.poll() is not None:
                    server_name = SERVERS[i]["name"]
                    print(f"⚠️  {server_name} server has stopped unexpectedly")
                    server_processes.remove(process)

            # If all servers have stopped, exit
            if not server_processes:
                print("❌ All servers have stopped")
                break

    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)


if __name__ == "__main__":
    main()
