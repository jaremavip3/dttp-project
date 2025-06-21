"""
Script to upload image binaries to Supabase using REST API
"""

import requests
import base64
import os
import json
from typing import List, Dict
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = "https://owtqoapmmmupfmhyhsuz.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dHFvYXBtbW11cGZtaHloc3V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMTEyMCwiZXhwIjoyMDY2MDg3MTIwfQ.7M5bqcV_bjHv0fe9sD4dZGyroqlTYJnkch3u7cspPvE"


def get_images_without_data() -> List[Dict]:
    """Get all images that need binary data upload"""
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json",
    }

    url = f"{SUPABASE_URL}/rest/v1/images"
    params = {"select": "id,filename,original_path,file_size", "order": "filename"}

    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200:
        images = response.json()
        logger.info(f"Found {len(images)} images in database")
        return images
    else:
        logger.error(
            f"Failed to fetch images: {response.status_code} - {response.text}"
        )
        return []


def upload_image_binary(image_id: str, filename: str, image_path: str) -> bool:
    """Upload binary image data to a specific image record"""

    if not os.path.exists(image_path):
        logger.warning(f"Image file not found: {image_path}")
        return False

    try:
        # Read binary image data
        with open(image_path, "rb") as f:
            image_data = f.read()

        # Encode as base64 for JSON transport
        image_base64 = base64.b64encode(image_data).decode("utf-8")

        headers = {
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "apikey": SUPABASE_SERVICE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

        # Update the image record with binary data
        url = f"{SUPABASE_URL}/rest/v1/images"
        payload = {"data": image_base64, "file_size": len(image_data)}

        params = {"id": f"eq.{image_id}"}

        response = requests.patch(url, headers=headers, params=params, json=payload)

        if response.status_code in [200, 204]:
            logger.info(
                f"✅ Uploaded binary data for {filename} ({len(image_data)} bytes)"
            )
            return True
        else:
            logger.error(
                f"❌ Failed to upload {filename}: {response.status_code} - {response.text}"
            )
            return False

    except Exception as e:
        logger.error(f"❌ Error uploading {filename}: {e}")
        return False


def main():
    """Main upload function"""
    logger.info("🚀 Starting image binary upload to Supabase...")

    # First, let's test if we can access the images endpoint
    logger.info("Testing Supabase connection...")
    images = get_images_without_data()

    if not images:
        logger.error("No images found or connection failed")
        return

    # Upload binary data for first few images as a test
    test_limit = 5
    uploaded_count = 0

    for i, image in enumerate(images[:test_limit]):
        image_id = image["id"]
        filename = image["filename"]
        original_path = image["original_path"]

        logger.info(f"Processing {i+1}/{min(len(images), test_limit)}: {filename}")

        if original_path and upload_image_binary(image_id, filename, original_path):
            uploaded_count += 1

    logger.info(
        f"🎉 Successfully uploaded binary data for {uploaded_count}/{test_limit} images"
    )

    if uploaded_count > 0:
        logger.info(
            "✅ Upload working! You can now upload all images by removing the test_limit"
        )
    else:
        logger.error("❌ Upload failed - check the logs above for errors")


if __name__ == "__main__":
    main()
