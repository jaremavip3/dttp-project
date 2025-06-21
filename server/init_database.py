#!/usr/bin/env python3
"""
Database initialization script for the multi-model AI search server
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add server directory to path
sys.path.append(str(Path(__file__).parent))

from core.database import init_database, close_database
from core.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)


async def main():
    """Initialize the database with required extensions and tables"""
    try:
        logger.info("🚀 Initializing database...")
        await init_database()
        logger.info("✅ Database initialization completed successfully!")

    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        sys.exit(1)

    finally:
        await close_database()


if __name__ == "__main__":
    asyncio.run(main())
