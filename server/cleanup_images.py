#!/usr/bin/env python3
"""
Clean up images that don't have embeddings from the database
"""

import sys
from pathlib import Path

# Add server directory to path
sys.path.append(str(Path(__file__).parent))

from supabase import create_client
from core.database import SUPABASE_URL, SUPABASE_ANON_KEY


def cleanup_images_without_embeddings():
    """Remove images that don't have embeddings for all models"""
    print("🧹 Cleaning up images without complete embeddings...")

    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    try:
        # Get all images
        images_result = supabase.table("images").select("*").execute()
        all_images = {img["id"]: img for img in images_result.data}

        # Get all embeddings
        embeddings_result = (
            supabase.table("image_embeddings").select("image_id, model_name").execute()
        )

        # Group embeddings by image_id
        image_embeddings = {}
        for emb in embeddings_result.data:
            image_id = emb["image_id"]
            model_name = emb["model_name"]

            if image_id not in image_embeddings:
                image_embeddings[image_id] = set()
            image_embeddings[image_id].add(model_name)

        # Find images without complete embeddings
        required_models = {"clip", "eva02", "dfn5b"}
        images_to_remove = []

        for image_id, image_data in all_images.items():
            existing_models = image_embeddings.get(image_id, set())
            missing_models = required_models - existing_models

            if missing_models:
                images_to_remove.append(
                    {
                        "id": image_id,
                        "filename": image_data["filename"],
                        "missing_models": list(missing_models),
                    }
                )

        if not images_to_remove:
            print("✅ All images have complete embeddings!")
            return True

        print(f"🗑️ Found {len(images_to_remove)} images to remove:")

        # Remove images and their partial embeddings
        removed_count = 0
        for image_info in images_to_remove:
            image_id = image_info["id"]
            filename = image_info["filename"]
            missing_models = image_info["missing_models"]

            try:
                # Remove embeddings for this image
                supabase.table("image_embeddings").delete().eq(
                    "image_id", image_id
                ).execute()

                # Remove the image
                supabase.table("images").delete().eq("id", image_id).execute()

                print(f"  🗑️ Removed: {filename} (missing: {', '.join(missing_models)})")
                removed_count += 1

            except Exception as e:
                print(f"  ❌ Error removing {filename}: {e}")

        print(f"\n✅ Successfully removed {removed_count} images")
        return True

    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        return False


def verify_cleanup():
    """Verify cleanup was successful"""
    print("\n🔍 Verifying cleanup...")

    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    try:
        # Check images
        images_result = supabase.table("images").select("*").execute()
        images_count = len(images_result.data)

        # Check embeddings
        embeddings_result = supabase.table("image_embeddings").select("*").execute()
        embeddings_count = len(embeddings_result.data)

        print(f"📸 Remaining images: {images_count}")
        print(f"🧠 Remaining embeddings: {embeddings_count}")

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

        # Verify all images have complete embeddings
        expected_embeddings = images_count * 3
        coverage = (
            (embeddings_count / expected_embeddings) * 100
            if expected_embeddings > 0
            else 0
        )

        print(
            f"📊 Coverage: {coverage:.1f}% ({embeddings_count}/{expected_embeddings})"
        )

        return coverage == 100.0

    except Exception as e:
        print(f"❌ Error verifying cleanup: {e}")
        return False


def main():
    """Main function"""
    print("🧹 Image Cleanup Script")
    print("=" * 40)

    success = cleanup_images_without_embeddings()

    if success:
        verification_success = verify_cleanup()
        if verification_success:
            print("\n✅ Cleanup completed successfully!")
            print("🎉 All remaining images have complete embeddings!")
        else:
            print("\n⚠️ Cleanup completed but some issues remain")
    else:
        print("\n❌ Cleanup failed")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
