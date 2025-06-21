#!/usr/bin/env python3
"""
Migration script to move existing embeddings from file-based storage to database
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from typing import Dict
import numpy as np

# Add server directory to path
sys.path.append(str(Path(__file__).parent))

from core.database import get_async_session, init_database
from core.db_service import DatabaseService
from core.config import settings
from core.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)


async def migrate_embeddings():
    """Migrate embeddings from JSON files to database"""

    # Initialize database first
    await init_database()

    async with get_async_session() as session:
        # Check if we have test images to migrate
        if not os.path.exists(settings.IMAGES_PATH):
            logger.warning(f"⚠️ Images directory {settings.IMAGES_PATH} not found")
            return

        # Get all image files
        image_files = [
            f
            for f in os.listdir(settings.IMAGES_PATH)
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".avif", ".webp"))
        ]

        logger.info(f"📂 Found {len(image_files)} images to migrate")

        # Create image records first
        for image_file in image_files:
            image_path = os.path.join(settings.IMAGES_PATH, image_file)

            # Check if image already exists in database
            existing = await DatabaseService.get_image_by_filename(session, image_file)
            if existing:
                logger.info(f"⏭️ Image {image_file} already exists in database")
                continue

            # Create new image record
            image = await DatabaseService.create_image(
                session=session,
                filename=image_file,
                original_path=image_path,
                metadata={"migrated_from": "file_system"},
            )
            logger.info(f"✅ Created database record for {image_file}")

        # Migrate embeddings from JSON cache files
        embeddings_dir = settings.EMBEDDINGS_CACHE_DIR
        cache_files = {
            "clip": "clip_image_embeddings.json",
            "eva02": "eva02_enormous_image_embeddings.json",
            "dfn5b": "dfn5b_image_embeddings.json",
        }

        for model_name, cache_file in cache_files.items():
            cache_path = os.path.join(embeddings_dir, cache_file)

            if not os.path.exists(cache_path):
                logger.warning(f"⚠️ Cache file {cache_path} not found")
                continue

            logger.info(f"📥 Migrating {model_name} embeddings from {cache_file}")

            try:
                with open(cache_path, "r") as f:
                    cached_embeddings = json.load(f)

                migrated_count = 0
                for image_filename, embedding_list in cached_embeddings.items():
                    # Get image record
                    image = await DatabaseService.get_image_by_filename(
                        session, image_filename
                    )
                    if not image:
                        logger.warning(
                            f"⚠️ Image {image_filename} not found in database"
                        )
                        continue

                    # Convert embedding list to numpy array
                    embedding = np.array(embedding_list)

                    # Store embedding in database
                    await DatabaseService.store_embedding(
                        session=session,
                        image_id=str(image.id),
                        model_name=model_name,
                        embedding=embedding,
                        model_version="migrated_from_cache",
                    )
                    migrated_count += 1

                logger.info(f"✅ Migrated {migrated_count} {model_name} embeddings")

            except Exception as e:
                logger.error(f"❌ Failed to migrate {model_name} embeddings: {e}")

        logger.info("🎉 Migration completed!")


async def main():
    """Run the migration"""
    try:
        await migrate_embeddings()
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
