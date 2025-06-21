#!/usr/bin/env python3
"""
Populate database with existing images and embeddings using Supabase REST API
"""

import json
import os
import sys
from pathlib import Path
from PIL import Image as PILImage
import uuid

# Add server directory to path
sys.path.append(str(Path(__file__).parent))

from supabase import create_client
from core.database import SUPABASE_URL, SUPABASE_ANON_KEY
from core.config import settings


def populate_database():
    """Populate database with images and embeddings using REST API"""

    print("🚀 Populating database with existing images and embeddings...")

    # Initialize Supabase client
    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    # Process clothes directory
    clothes_path = "/Users/yaremapetrushchak/Downloads/clothes"
    if not os.path.exists(clothes_path):
        print(f"❌ Clothes directory not found: {clothes_path}")
        return False

    print(f"📂 Processing clothes directory: {clothes_path}")

    # Step 1: Add clothes images to database
    image_records = {}
    total_processed = 0

    # Walk through train and test directories
    for split in ["train", "test"]:
        split_path = os.path.join(clothes_path, split)
        if not os.path.exists(split_path):
            print(f"⚠️ Split directory not found: {split_path}")
            continue

        print(f"\n📂 Processing {split} split...")

        # Walk through category directories
        for category in os.listdir(split_path):
            category_path = os.path.join(split_path, category)
            if not os.path.isdir(category_path):
                continue

            print(f"  📂 Processing category: {category}")

            # Get all image files in this category
            image_files = [
                f
                for f in os.listdir(category_path)
                if f.lower().endswith((".png", ".jpg", ".jpeg", ".avif", ".webp"))
            ]

            # Process each image
            for idx, image_file in enumerate(sorted(image_files), 1):
                try:
                    original_path = os.path.join(category_path, image_file)

                    # Create new filename: category_split_number.extension
                    file_extension = Path(image_file).suffix
                    new_filename = f"{category}_{split}_{idx:02d}{file_extension}"

                    # Get image metadata
                    width, height, format_type = None, None, None
                    try:
                        with PILImage.open(original_path) as img:
                            width, height = img.size
                            format_type = img.format
                    except Exception as e:
                        print(f"    ⚠️ Could not read metadata for {image_file}: {e}")

                    # Create image record
                    image_data = {
                        "filename": new_filename,
                        "original_path": original_path,
                        "width": width,
                        "height": height,
                        "format": format_type,
                        "image_metadata": json.dumps(
                            {
                                "source": "clothes_dataset",
                                "category": category,
                                "split": split,
                                "original_filename": image_file,
                                "original_path": original_path,
                                "index": idx,
                                "migrated_from": "file_system",
                            }
                        ),
                    }

                    # Insert into database
                    result = supabase.table("images").insert(image_data).execute()

                    if result.data:
                        image_id = result.data[0]["id"]
                        image_records[new_filename] = image_id
                        total_processed += 1
                        print(f"    ✅ Added: {new_filename} (ID: {image_id})")
                    else:
                        print(f"    ❌ Failed to add: {new_filename}")

                except Exception as e:
                    print(f"    ❌ Error processing {image_file}: {e}")

    print(f"\n📊 Successfully added {len(image_records)} images to database")
    print(f"📊 Total images processed: {total_processed}")

    # Also process original test images if they exist
    test_images_path = (
        "/Users/yaremapetrushchak/code/dttp-project/client/public/test_images"
    )
    if os.path.exists(test_images_path):
        print(f"\n📂 Also processing original test images...")

        image_files = [
            f
            for f in os.listdir(test_images_path)
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".avif", ".webp"))
        ]

        for image_file in image_files:
            try:
                image_path = os.path.join(test_images_path, image_file)

                # Get image metadata
                width, height, format_type = None, None, None
                try:
                    with PILImage.open(image_path) as img:
                        width, height = img.size
                        format_type = img.format
                except Exception as e:
                    print(f"⚠️ Could not read metadata for {image_file}: {e}")

                # Create image record
                image_data = {
                    "filename": image_file,
                    "original_path": image_path,
                    "width": width,
                    "height": height,
                    "format": format_type,
                    "image_metadata": json.dumps(
                        {
                            "source": "original_test_images",
                            "migrated_from": "file_system",
                        }
                    ),
                }

                # Insert into database
                result = supabase.table("images").insert(image_data).execute()

                if result.data:
                    image_id = result.data[0]["id"]
                    image_records[image_file] = image_id
                    print(
                        f"✅ Added original test image: {image_file} (ID: {image_id})"
                    )
                else:
                    print(f"❌ Failed to add original test image: {image_file}")

            except Exception as e:
                print(f"❌ Error processing original test image {image_file}: {e}")

    # Step 2: Add embeddings from cache files
    embeddings_dir = (
        "/Users/yaremapetrushchak/code/dttp-project/server/embeddings_cache"
    )
    cache_files = {
        "clip": "clip_embeddings.json",
        "eva02": "eva02_embeddings.json",
        "dfn5b": "dfn5b_embeddings.json",
    }

    total_embeddings = 0

    for model_name, cache_file in cache_files.items():
        cache_path = os.path.join(embeddings_dir, cache_file)

        if not os.path.exists(cache_path):
            print(f"⚠️ Cache file not found: {cache_path}")
            continue

        print(f"\n📥 Processing {model_name} embeddings from {cache_file}")

        try:
            with open(cache_path, "r") as f:
                cached_embeddings = json.load(f)

            model_embeddings = 0
            for image_filename, embedding_list in cached_embeddings.items():
                if image_filename in image_records:
                    # Create embedding record
                    embedding_data = {
                        "image_id": image_records[image_filename],
                        "model_name": model_name,
                        "model_version": "migrated_from_cache",
                        "embedding_dim": len(embedding_list),
                        "embedding": embedding_list,
                    }

                    try:
                        result = (
                            supabase.table("image_embeddings")
                            .insert(embedding_data)
                            .execute()
                        )
                        if result.data:
                            model_embeddings += 1
                            total_embeddings += 1
                            print(
                                f"  ✅ Added {model_name} embedding for {image_filename}"
                            )
                        else:
                            print(
                                f"  ❌ Failed to add {model_name} embedding for {image_filename}"
                            )
                    except Exception as e:
                        print(
                            f"  ❌ Error adding {model_name} embedding for {image_filename}: {e}"
                        )
                else:
                    print(f"  ⚠️ Image {image_filename} not found in database")

            print(f"📊 Added {model_embeddings} {model_name} embeddings")

        except Exception as e:
            print(f"❌ Error processing {model_name} embeddings: {e}")

    print(f"\n🎉 Migration completed successfully!")
    print(f"📊 Final stats:")
    print(f"   Images: {len(image_records)}")
    print(f"   Embeddings: {total_embeddings}")
    print(
        f"   Models: {len([k for k in cache_files.keys() if os.path.exists(os.path.join(embeddings_dir, cache_files[k]))])}"
    )

    return True


def verify_population():
    """Verify the database was populated correctly"""
    print("\n🔍 Verifying database population...")

    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    try:
        # Check images
        images_result = supabase.table("images").select("*").execute()
        images_count = len(images_result.data)
        print(f"📸 Images in database: {images_count}")

        # Check embeddings
        embeddings_result = supabase.table("image_embeddings").select("*").execute()
        embeddings_count = len(embeddings_result.data)
        print(f"🧠 Embeddings in database: {embeddings_count}")

        # Check by model
        for model in ["clip", "eva02", "dfn5b"]:
            model_result = (
                supabase.table("image_embeddings")
                .select("*")
                .eq("model_name", model)
                .execute()
            )
            model_count = len(model_result.data)
            print(f"   {model.upper()}: {model_count} embeddings")

        return images_count > 0 and embeddings_count > 0

    except Exception as e:
        print(f"❌ Error verifying database: {e}")
        return False


def main():
    """Main function"""
    print("🗃️ Database Population Script")
    print("=" * 40)

    success = populate_database()

    if success:
        verification_success = verify_population()
        if verification_success:
            print("\n✅ Database successfully populated and verified!")
            print("\n🚀 You can now start the server and begin searching:")
            print("   python unified_server.py")
        else:
            print("\n⚠️ Database populated but verification failed")
    else:
        print("\n❌ Database population failed")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
