#!/usr/bin/env python3
"""
Test Supabase connection using the Python client
"""

import asyncio
from supabase import create_client


async def test_supabase_client():
    """Test Supabase client connection"""

    SUPABASE_URL = "https://owtqoapmmmupfmhyhsuz.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dHFvYXBtbW11cGZtaHloc3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTExMjAsImV4cCI6MjA2NjA4NzEyMH0.rmLrM3dogpwXKPo5K-M_Sq1PSTNsigGu2Ntby6v0zOk"

    try:
        print("🔌 Testing Supabase client connection...")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Test with a simple query
        result = supabase.table("images").select("*").limit(1).execute()
        print(f"✅ Supabase client connection successful!")
        print(f"   Response: {result}")

        return True

    except Exception as e:
        print(f"❌ Supabase client connection failed: {e}")
        return False


if __name__ == "__main__":
    asyncio.run(test_supabase_client())
