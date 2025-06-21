#!/usr/bin/env python3
"""
Test Supabase database connection and query images
"""

import sys
from pathlib import Path

# Add server directory to path
sys.path.append(str(Path(__file__).parent))

from supabase import create_client
from core.database import SUPABASE_URL, SUPABASE_ANON_KEY


def test_database_connection():
    """Test Supabase REST API connection"""
    print("🔌 Testing Supabase REST API connection...")

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

        # Test basic connection by getting a few images
        print("📋 Fetching sample images...")
        result = supabase.table("images").select("*").limit(5).execute()

        if result.data:
            print(f"✅ Successfully connected! Found {len(result.data)} sample images:")
            for img in result.data:
                # Parse metadata safely
                metadata = img.get("image_metadata", "{}")
                if isinstance(metadata, str):
                    try:
                        import json

                        metadata = json.loads(metadata)
                    except:
                        metadata = {}

                category = metadata.get("category", "unknown")
                print(f"  - {img['filename']} (Category: {category})")

            # Check total count
            total_result = supabase.table("images").select("*", count="exact").execute()
            print(f"📊 Total images in database: {total_result.count}")

            # Check embeddings
            embeddings_result = (
                supabase.table("image_embeddings").select("*", count="exact").execute()
            )
            print(f"🧠 Total embeddings in database: {embeddings_result.count}")

            return True
        else:
            print("❌ Connected but no data found")
            return False

    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


def test_search_endpoint():
    """Test a sample search using REST API"""
    print("\n🔍 Testing database search...")

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

        # Get some images with embeddings for a specific model
        result = (
            supabase.table("image_embeddings")
            .select("image_id, model_name, images(filename, image_metadata)")
            .eq("model_name", "clip")
            .limit(3)
            .execute()
        )

        if result.data:
            print(f"✅ Found {len(result.data)} CLIP embeddings:")
            for emb in result.data:
                img_data = emb["images"]
                metadata = img_data.get("image_metadata", {})
                if isinstance(metadata, str):
                    import json

                    try:
                        metadata = json.loads(metadata)
                    except:
                        metadata = {}
                category = metadata.get("category", "unknown")
                print(f"  - {img_data['filename']} (Category: {category})")
            return True
        else:
            print("❌ No embeddings found")
            return False

    except Exception as e:
        print(f"❌ Search test failed: {e}")
        return False


if __name__ == "__main__":
    print("🧪 Database Connection Test")
    print("=" * 40)

    # Test basic connection
    connection_ok = test_database_connection()

    if connection_ok:
        # Test search capability
        search_ok = test_search_endpoint()

        if search_ok:
            print("\n✅ Database is ready for use!")
            print("💡 The server should be able to access the full dataset.")
        else:
            print("\n⚠️ Database connected but search issues detected.")
    else:
        print("\n❌ Database connection failed.")
        print("💡 Server will continue with file-based fallback.")
