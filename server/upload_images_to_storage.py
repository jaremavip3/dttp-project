"""
Script to upload images to Supabase Storage and update image records
"""

import requests
import os
import json
from typing import List, Dict
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = "https://owtqoapmmmupfmhyhsuz.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dHFvYXBtbW11cGZtaHloc3V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMTEyMCwiZXhwIjoyMDY2MDg3MTIwfQ.7M5bqcV_bjHv0fe9sD4dZGyroqlTYJnkch3u7cspPvE"
BUCKET_NAME = "product-images"


def create_storage_bucket():
    """Create a storage bucket for product images"""
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json",
    }

    url = f"{SUPABASE_URL}/storage/v1/bucket"
    payload = {
        "id": BUCKET_NAME,
        "name": BUCKET_NAME,
        "public": True,
        "file_size_limit": 10485760,  # 10MB
        "allowed_mime_types": ["image/jpeg", "image/png", "image/webp", "image/avif"],
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 200:
        logger.info(f"✅ Created storage bucket: {BUCKET_NAME}")
        return True
    elif (
        response.status_code == 409
        or "already exists" in response.text.lower()
        or "duplicate" in response.text.lower()
    ):
        logger.info(f"✅ Storage bucket already exists: {BUCKET_NAME}")
        return True
    else:
        logger.error(
            f"❌ Failed to create bucket: {response.status_code} - {response.text}"
        )
        return False


def get_images_to_upload() -> List[Dict]:
    """Get all images that need to be uploaded to storage"""
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
    }

    url = f"{SUPABASE_URL}/rest/v1/images"
    params = {"select": "id,filename,original_path,storage_url", "order": "filename"}

    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200:
        images = response.json()
        # Filter images that don't have storage_url or have empty storage_url
        images_to_upload = [img for img in images if not img.get("storage_url")]
        logger.info(
            f"Found {len(images_to_upload)} images to upload (out of {len(images)} total)"
        )
        return images_to_upload
    else:
        logger.error(
            f"Failed to fetch images: {response.status_code} - {response.text}"
        )
        return []


def upload_image_to_storage(image_path: str, filename: str) -> str:
    """Upload an image to Supabase Storage"""

    if not os.path.exists(image_path):
        logger.warning(f"Image file not found: {image_path}")
        return None

    try:
        # Determine content type
        ext = Path(filename).suffix.lower()
        content_type_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".avif": "image/avif",
        }
        content_type = content_type_map.get(ext, "image/jpeg")

        headers = {
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "apikey": SUPABASE_SERVICE_KEY,
            "Content-Type": content_type,
        }

        # Read binary image data
        with open(image_path, "rb") as f:
            image_data = f.read()

        # Upload to storage
        url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{filename}"

        response = requests.post(url, headers=headers, data=image_data)

        if response.status_code == 200:
            # Return the public URL
            public_url = (
                f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{filename}"
            )
            logger.info(f"✅ Uploaded {filename} to storage ({len(image_data)} bytes)")
            return public_url
        else:
            logger.error(
                f"❌ Failed to upload {filename}: {response.status_code} - {response.text}"
            )
            return None

    except Exception as e:
        logger.error(f"❌ Error uploading {filename}: {e}")
        return None


def update_image_storage_url(image_id: str, filename: str, storage_url: str) -> bool:
    """Update image record with storage URL"""

    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json",
    }

    url = f"{SUPABASE_URL}/rest/v1/images"
    payload = {"storage_url": storage_url}
    params = {"id": f"eq.{image_id}"}

    response = requests.patch(url, headers=headers, params=params, json=payload)

    if response.status_code in [200, 204]:
        logger.info(f"✅ Updated storage URL for {filename}")
        return True
    else:
        logger.error(
            f"❌ Failed to update storage URL for {filename}: {response.status_code} - {response.text}"
        )
        return False


def main():
    """Main upload function"""
    logger.info("🚀 Starting image upload to Supabase Storage...")

    # Step 1: Create storage bucket
    if not create_storage_bucket():
        return

    # Step 2: Get images to upload
    images = get_images_to_upload()

    if not images:
        logger.info("No images need to be uploaded")
        return

    # Step 3: Upload all images
    uploaded_count = 0

    for i, image in enumerate(images):
        image_id = image["id"]
        filename = image["filename"]
        original_path = image["original_path"]

        logger.info(f"Processing {i+1}/{len(images)}: {filename}")

        if not original_path:
            logger.warning(f"No original path for {filename}")
            continue

        # Upload to storage
        storage_url = upload_image_to_storage(original_path, filename)

        if storage_url:
            # Update database record
            if update_image_storage_url(image_id, filename, storage_url):
                uploaded_count += 1

    logger.info(
        f"🎉 Successfully uploaded and updated {uploaded_count}/{len(images)} images"
    )

    if uploaded_count > 0:
        logger.info("✅ All images uploaded successfully!")
        logger.info(
            f"Images are accessible at: {SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/[filename]"
        )
    else:
        logger.error("❌ Upload failed - check the logs above for errors")


if __name__ == "__main__":
    main()
