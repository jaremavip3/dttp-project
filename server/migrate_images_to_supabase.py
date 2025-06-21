"""
Script to migrate images to Supabase with binary data storage
"""

import asyncio
import asyncpg
import os
import sys
from pathlib import Path
from PIL import Image as PILImage
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection
DATABASE_URL = (
    "postgresql://postgres:0012ACRacr@db.owtqoapmmmupfmhyhsuz.supabase.co:5432/postgres"
)


async def add_data_column():
    """Add data column to images table if it doesn't exist"""
    try:
        conn = await asyncpg.connect(DATABASE_URL)

        # Check if data column exists
        result = await conn.fetchval(
            """
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = 'images' AND column_name = 'data'
        """
        )

        if result == 0:
            logger.info("Adding data column to images table...")
            await conn.execute("ALTER TABLE images ADD COLUMN data bytea;")
            logger.info("✅ Data column added successfully")
        else:
            logger.info("✅ Data column already exists")

        await conn.close()
        return True

    except Exception as e:
        logger.error(f"❌ Failed to add data column: {e}")
        return False


async def upload_image_binaries():
    """Upload binary image data to existing image records"""
    try:
        conn = await asyncpg.connect(DATABASE_URL)

        # Get all images that don't have binary data yet
        images = await conn.fetch(
            """
            SELECT id, filename, original_path 
            FROM images 
            WHERE data IS NULL AND original_path IS NOT NULL
        """
        )

        logger.info(f"Found {len(images)} images to upload binary data for")

        uploaded_count = 0

        for image in images:
            image_id = image["id"]
            filename = image["filename"]
            original_path = image["original_path"]

            if os.path.exists(original_path):
                try:
                    # Read binary image data
                    with open(original_path, "rb") as f:
                        image_data = f.read()

                    # Update the record with binary data
                    await conn.execute(
                        """
                        UPDATE images 
                        SET data = $1, file_size = $2
                        WHERE id = $3
                    """,
                        image_data,
                        len(image_data),
                        image_id,
                    )

                    uploaded_count += 1
                    logger.info(
                        f"✅ Uploaded binary data for {filename} ({len(image_data)} bytes)"
                    )

                except Exception as e:
                    logger.error(f"❌ Failed to upload {filename}: {e}")
            else:
                logger.warning(f"⚠️  Original file not found: {original_path}")

        await conn.close()
        logger.info(f"🎉 Successfully uploaded binary data for {uploaded_count} images")
        return uploaded_count

    except Exception as e:
        logger.error(f"❌ Failed to upload image binaries: {e}")
        return 0


async def verify_migration():
    """Verify that images have been migrated successfully"""
    try:
        conn = await asyncpg.connect(DATABASE_URL)

        total_images = await conn.fetchval("SELECT COUNT(*) FROM images")
        images_with_data = await conn.fetchval(
            "SELECT COUNT(*) FROM images WHERE data IS NOT NULL"
        )

        logger.info(f"📊 Migration status:")
        logger.info(f"   Total images: {total_images}")
        logger.info(f"   Images with binary data: {images_with_data}")
        logger.info(
            f"   Migration progress: {images_with_data}/{total_images} ({100*images_with_data/total_images:.1f}%)"
        )

        await conn.close()

    except Exception as e:
        logger.error(f"❌ Failed to verify migration: {e}")


async def main():
    """Main migration function"""
    logger.info("🚀 Starting image migration to Supabase...")

    # Step 1: Add data column
    if not await add_data_column():
        sys.exit(1)

    # Step 2: Upload image binaries
    uploaded = await upload_image_binaries()
    if uploaded == 0:
        logger.warning("⚠️  No images were uploaded")

    # Step 3: Verify migration
    await verify_migration()

    logger.info("✅ Image migration completed!")


if __name__ == "__main__":
    asyncio.run(main())
