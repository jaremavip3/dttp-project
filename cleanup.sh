#!/bin/bash

# Script to clean up legacy files from the DTTP project
# This removes files that were used during development but are no longer needed

echo "Starting DTTP project cleanup..."

# Legacy server files (individual model servers)
echo "Removing legacy server files..."
rm -f /Users/yaremapetrushchak/code/dttp-project/server/dfn5b_fastapi_server.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/eva02_fastapi_server.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/siglip_fastapi_server.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/fastapi_clip_server.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/start_all_servers.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/main_server.py

# Legacy migration and setup scripts (keep init_database.py for reference)
echo "Removing legacy migration scripts..."
rm -f /Users/yaremapetrushchak/code/dttp-project/server/init_supabase_simple.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/upload_images_to_storage.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/upload_images_rest_api.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/migrate_images_to_supabase.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/cleanup_images.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/migrate_embeddings.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/populate_database.py

# Test files (development only)
echo "Removing test files..."
rm -f /Users/yaremapetrushchak/code/dttp-project/server/test_connection.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/test_supabase_client.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/test_database_connection.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/test_setup.py
rm -f /Users/yaremapetrushchak/code/dttp-project/server/test_complete_setup.py

# Legacy embedding files
echo "Removing legacy embedding files..."
rm -f /Users/yaremapetrushchak/code/dttp-project/dfn5b_image_embeddings.json
rm -f /Users/yaremapetrushchak/code/dttp-project/eva02_enormous_image_embeddings.json
rm -f /Users/yaremapetrushchak/code/dttp-project/image_embeddings.json

# Legacy Python files from root directory
echo "Removing legacy Python files from root..."
rm -f /Users/yaremapetrushchak/code/dttp-project/clip_server.py
rm -f /Users/yaremapetrushchak/code/dttp-project/compare_models.py
rm -f /Users/yaremapetrushchak/code/dttp-project/comparison_analysis.py
rm -f /Users/yaremapetrushchak/code/dttp-project/debug_dependency_imports.py
rm -f /Users/yaremapetrushchak/code/dttp-project/debug_gloves.py
rm -f /Users/yaremapetrushchak/code/dttp-project/debug_imports.py
rm -f /Users/yaremapetrushchak/code/dttp-project/debug_siglip2.py
rm -f /Users/yaremapetrushchak/code/dttp-project/diagnose_siglip2.py
rm -f /Users/yaremapetrushchak/code/dttp-project/investigate_scoring.py
rm -f /Users/yaremapetrushchak/code/dttp-project/test_forward_approach.py

# Legacy requirements files (keep the main one)
echo "Removing legacy requirements files..."
rm -f /Users/yaremapetrushchak/code/dttp-project/requirements_fastapi.txt

# Legacy server files from root
echo "Removing legacy server files from root..."
rm -f /Users/yaremapetrushchak/code/dttp-project/server/server.js

echo "Cleanup completed!"
echo ""
echo "Remaining important files:"
echo "- /server/unified_server.py (main server)"
echo "- /server/core/ (database and configuration)"
echo "- /server/models/ (AI model classes)"
echo "- /server/.env (environment variables)"
echo "- /client/ (Next.js frontend)"
echo "- requirements.txt (Python dependencies)"
echo ""
echo "Note: Some files like init_database.py and generate_embeddings.py were kept for reference."
