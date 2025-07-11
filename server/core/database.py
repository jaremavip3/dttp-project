"""
Database configuration and connection setup for Supabase
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from supabase import create_client, Client
import asyncpg
from typing import AsyncGenerator
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Database configuration from environment variables
DATABASE_HOST = os.getenv("DATABASE_HOST")
DATABASE_PORT = os.getenv("DATABASE_PORT", "5432")
DATABASE_USER = os.getenv("DATABASE_USER", "postgres")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
DATABASE_NAME = os.getenv("DATABASE_NAME", "postgres")

# Validate required environment variables
required_vars = [
    ("SUPABASE_URL", SUPABASE_URL),
    ("SUPABASE_ANON_KEY", SUPABASE_ANON_KEY),
    ("SUPABASE_SERVICE_KEY", SUPABASE_SERVICE_KEY),
    ("DATABASE_HOST", DATABASE_HOST),
    ("DATABASE_PASSWORD", DATABASE_PASSWORD),
]

missing_vars = [var_name for var_name, var_value in required_vars if not var_value]
if missing_vars:
    raise ValueError(
        f"Missing required environment variables: {', '.join(missing_vars)}"
    )

# Construct database URLs
DATABASE_URL = f"postgresql+asyncpg://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"
DIRECT_DB_URL = f"postgresql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"

# SQLAlchemy setup
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

# Supabase client for file storage and real-time features
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Get async database session"""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_database():
    """Test database connection and verify tables exist"""
    try:
        print("🔌 Testing Supabase connection...")
        print(f"   Host: db.owtqoapmmmupfmhyhsuz.supabase.co")
        print(f"   Database: postgres")

        # Test basic connection using SQLAlchemy
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"✅ Connection successful! PostgreSQL version: {version}")

            # Check if our tables exist
            tables_check = await conn.execute(
                text(
                    """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('images', 'image_embeddings', 'search_logs')
                ORDER BY table_name
            """
                )
            )

            existing_tables = [row[0] for row in tables_check.fetchall()]
            print(f"✅ Found tables: {existing_tables}")

            if len(existing_tables) == 3:
                print("✅ All required tables are present!")
            else:
                print(
                    "⚠️ Some tables may be missing. Expected: ['images', 'image_embeddings', 'search_logs']"
                )

        # Test if pgvector is available
        try:
            async with engine.begin() as conn:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                print("✅ pgvector extension is available")
        except Exception as e:
            print(f"⚠️ pgvector extension not available (this is optional): {e}")

        print("✅ Database initialization completed!")

    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        print("💡 Troubleshooting:")
        print("   - Check if your Supabase project is active")
        print("   - Verify the database password is correct")
        print("   - Ensure your IP is allowlisted in Supabase Network settings")
        raise

    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")
        print("\n💡 TROUBLESHOOTING:")
        print("   1. Ensure your Supabase project is active")
        print("   2. Check if the password '0012ACRacr' is correct")
        print("   3. Your IP might need to be allowlisted in Supabase Network settings")
        print("   4. Try running the SQL commands manually in Supabase SQL Editor:")
        print()
        print_manual_setup_instructions()
        raise


def print_manual_setup_instructions():
    """Print manual setup instructions"""
    print("🔧 MANUAL SETUP: Go to Supabase Dashboard > SQL Editor and run:")
    print("=" * 60)
    print("-- Enable pgvector extension")
    print("CREATE EXTENSION IF NOT EXISTS vector;")
    print()
    print("-- Create images table")
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
    print()
    print("-- Create image_embeddings table")
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
    print()
    print("-- Create search_logs table")
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
    print("=" * 60)


async def close_database():
    """Close database connections"""
    await engine.dispose()
