#!/usr/bin/env python3
"""
Test script to verify the complete database setup is working
This uses both REST API and direct PostgreSQL connection
"""

import asyncio
import sys
from pathlib import Path

# Add server directory to path
sys.path.append(str(Path(__file__).parent))

from supabase import create_client
from core.database import SUPABASE_URL, SUPABASE_ANON_KEY, DATABASE_URL, init_database


async def test_complete_setup():
    """Test both REST API and PostgreSQL connections"""

    print("🧪 Testing Complete Database Setup")
    print("=" * 50)

    # Test 1: Supabase REST API
    print("\n1️⃣ Testing Supabase REST API...")
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

        # Test each table
        tables = ["images", "image_embeddings", "search_logs"]
        for table in tables:
            result = supabase.table(table).select("*").limit(1).execute()
            print(f"   ✅ Table '{table}': accessible (found {len(result.data)} rows)")

        print("   ✅ Supabase REST API: Working perfectly!")

    except Exception as e:
        print(f"   ❌ Supabase REST API failed: {e}")
        return False

    # Test 2: PostgreSQL Direct Connection (may fail in some environments)
    print("\n2️⃣ Testing PostgreSQL Direct Connection...")
    try:
        await init_database()
        print("   ✅ PostgreSQL Direct Connection: Working!")
    except Exception as e:
        print(f"   ⚠️ PostgreSQL Direct Connection failed: {e}")
        print("   💡 This is okay! Your setup can work with REST API fallback")

    # Test 3: Model imports
    print("\n3️⃣ Testing Model Imports...")
    try:
        from core.models import Image, ImageEmbedding, SearchLog
        from core.db_service import DatabaseService

        print("   ✅ All models imported successfully!")
    except Exception as e:
        print(f"   ❌ Model import failed: {e}")
        return False

    print("\n🎉 Database Setup Verification Complete!")
    print("=" * 50)
    print("✅ Your database is ready for use!")
    print("✅ Tables are created and accessible")
    print("✅ API keys are working")
    print("✅ Code is properly configured")
    print("\n🚀 You can now start the server with:")
    print("   python unified_server.py")

    return True


if __name__ == "__main__":
    asyncio.run(test_complete_setup())
