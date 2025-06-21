#!/usr/bin/env python3
"""
Simple database connection test
"""

import asyncio
import asyncpg
import os


async def test_connection():
    """Test basic database connection"""

    # Test connection parameters
    host = "db.owtqoapmmmupfmhyhsuz.supabase.co"
    port = 5432
    user = "postgres"
    password = "0012ACRacr"
    database = "postgres"

    print(f"Testing connection to {host}:{port}")

    try:
        # Test basic connection
        conn = await asyncpg.connect(
            host=host, port=port, user=user, password=password, database=database
        )

        print("✅ Connection successful!")

        # Test a simple query
        result = await conn.fetchval("SELECT version()")
        print(f"Database version: {result}")

        await conn.close()

    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print(f"Error type: {type(e)}")


if __name__ == "__main__":
    asyncio.run(test_connection())
