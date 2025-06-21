#!/usr/bin/env python3
"""
Simple connection test script
"""

import sys
import os


def test_imports():
    """Test if all required packages are installed"""
    print("🔍 Testing imports...")

    try:
        import sqlalchemy

        print(f"✅ SQLAlchemy {sqlalchemy.__version__}")
    except ImportError:
        print("❌ SQLAlchemy not installed")
        return False

    try:
        import asyncpg

        print(f"✅ asyncpg {asyncpg.__version__}")
    except ImportError:
        print("❌ asyncpg not installed")
        return False

    try:
        import supabase

        print("✅ supabase installed")
    except ImportError:
        print("❌ supabase not installed")
        return False

    return True


def test_config():
    """Test database configuration"""
    print("\n🔧 Testing configuration...")

    try:
        from core.database import DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY

        print("✅ Database configuration loaded")
        print(f"   Database URL: {DATABASE_URL[:50]}...")
        print(f"   Supabase URL: {SUPABASE_URL}")
        print(f"   API Key length: {len(SUPABASE_ANON_KEY)} chars")
        return True
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        return False


def test_models():
    """Test SQLAlchemy models"""
    print("\n📋 Testing models...")

    try:
        from core.models import Image, ImageEmbedding, SearchLog

        print("✅ All models imported successfully")
        print(f"   Image table: {Image.__tablename__}")
        print(f"   Embeddings table: {ImageEmbedding.__tablename__}")
        print(f"   Search logs table: {SearchLog.__tablename__}")
        return True
    except Exception as e:
        print(f"❌ Models error: {e}")
        return False


def main():
    """Run all tests"""
    print("🧪 Testing Database Setup\n")

    success = True
    success &= test_imports()
    success &= test_config()
    success &= test_models()

    if success:
        print("\n✅ ALL TESTS PASSED!")
        print("🎉 Database setup is ready!")
        print("\n📝 Next steps:")
        print("1. Go to your Supabase Dashboard > SQL Editor")
        print("2. Run the SQL commands from the init_database.py output")
        print("3. Start the server with: python unified_server.py")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
