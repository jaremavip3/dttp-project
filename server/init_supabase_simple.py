#!/usr/bin/env python3
"""
Simple database initialization using Supabase client
"""

import asyncio
import sys
from pathlib import Path
import os

# Add server directory to path
sys.path.append(str(Path(__file__).parent))

from supabase import create_client, Client
from core.logging_config import setup_logging

setup_logging()

# Use Supabase client to create tables
SUPABASE_URL = "https://owtqoapmmmupfmhyhsuz.supabase.co"
SUPABASE_SERVICE_KEY = "sbp_9d62295c4a6a6f0173b60501ee80384a9d64abca"


async def init_via_supabase():
    """Initialize database using Supabase REST API"""
    try:
        print("🚀 Initializing database via Supabase API...")

        # Create Supabase client with service key for admin operations
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        print("📦 Creating images table...")
        # Create images table
        images_sql = """
        CREATE TABLE IF NOT EXISTS images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            filename VARCHAR(255) NOT NULL UNIQUE,
            original_path VARCHAR(500),
            storage_url VARCHAR(500),
            file_size INTEGER,
            width INTEGER,
            height INTEGER,
            format VARCHAR(50),
            image_metadata TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ
        );
        """

        result = supabase.rpc("exec_sql", {"sql": images_sql}).execute()
        print("✅ Images table created")

        print("📦 Creating image_embeddings table...")
        # Create image_embeddings table
        embeddings_sql = """
        CREATE TABLE IF NOT EXISTS image_embeddings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            image_id UUID REFERENCES images(id) ON DELETE CASCADE,
            model_name VARCHAR(100) NOT NULL,
            model_version VARCHAR(200),
            embedding_dim INTEGER NOT NULL,
            embedding FLOAT[] NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(image_id, model_name)
        );
        """

        result = supabase.rpc("exec_sql", {"sql": embeddings_sql}).execute()
        print("✅ Image embeddings table created")

        print("📦 Creating search_logs table...")
        # Create search_logs table
        logs_sql = """
        CREATE TABLE IF NOT EXISTS search_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            query_text TEXT NOT NULL,
            model_name VARCHAR(100) NOT NULL,
            top_k INTEGER DEFAULT 10,
            processing_time_ms INTEGER,
            results_count INTEGER,
            user_session VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """

        result = supabase.rpc("exec_sql", {"sql": logs_sql}).execute()
        print("✅ Search logs table created")

        print("📦 Creating indexes...")
        # Create indexes
        indexes_sql = """
        CREATE INDEX IF NOT EXISTS idx_images_filename ON images(filename);
        CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);
        CREATE INDEX IF NOT EXISTS idx_embeddings_image_model ON image_embeddings(image_id, model_name);
        CREATE INDEX IF NOT EXISTS idx_embeddings_model ON image_embeddings(model_name);
        CREATE INDEX IF NOT EXISTS idx_search_logs_model ON search_logs(model_name);
        CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at);
        """

        result = supabase.rpc("exec_sql", {"sql": indexes_sql}).execute()
        print("✅ Indexes created")

        print("📦 Trying to enable pgvector extension...")
        try:
            pgvector_sql = "CREATE EXTENSION IF NOT EXISTS vector;"
            result = supabase.rpc("exec_sql", {"sql": pgvector_sql}).execute()
            print("✅ pgvector extension enabled")
        except Exception as e:
            print(f"⚠️ pgvector extension not available (this is optional): {e}")

        print("🎉 Database initialization completed successfully!")

    except Exception as e:
        print(f"❌ Failed to initialize via Supabase API: {e}")
        print("💡 Let's try SQL Editor approach instead...")
        print_sql_commands()


def print_sql_commands():
    """Print SQL commands that can be run manually in Supabase SQL Editor"""
    print("\n" + "=" * 60)
    print("🔧 MANUAL SETUP: Copy and paste these commands in Supabase SQL Editor")
    print("=" * 60)

    print("\n-- 1. Enable pgvector extension (optional)")
    print("CREATE EXTENSION IF NOT EXISTS vector;")

    print("\n-- 2. Create images table")
    print(
        """CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL UNIQUE,
    original_path VARCHAR(500),
    storage_url VARCHAR(500),
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    format VARCHAR(50),
    image_metadata TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);"""
    )

    print("\n-- 3. Create image_embeddings table")
    print(
        """CREATE TABLE IF NOT EXISTS image_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID REFERENCES images(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(200),
    embedding_dim INTEGER NOT NULL,
    embedding FLOAT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(image_id, model_name)
);"""
    )

    print("\n-- 4. Create search_logs table")
    print(
        """CREATE TABLE IF NOT EXISTS search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text TEXT NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    top_k INTEGER DEFAULT 10,
    processing_time_ms INTEGER,
    results_count INTEGER,
    user_session VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);"""
    )

    print("\n-- 5. Create indexes")
    print(
        """CREATE INDEX IF NOT EXISTS idx_images_filename ON images(filename);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);
CREATE INDEX IF NOT EXISTS idx_embeddings_image_model ON image_embeddings(image_id, model_name);
CREATE INDEX IF NOT EXISTS idx_embeddings_model ON image_embeddings(model_name);
CREATE INDEX IF NOT EXISTS idx_search_logs_model ON search_logs(model_name);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at);"""
    )

    print("\n" + "=" * 60)


if __name__ == "__main__":
    asyncio.run(init_via_supabase())
