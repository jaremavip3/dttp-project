#!/bin/bash

# Database Setup Script for Multi-Model AI Search Server

echo "🚀 Setting up database for Multi-Model AI Search Server..."

# Check if we're in the server directory
if [ ! -f "unified_server.py" ]; then
    echo "❌ Please run this script from the server directory"
    exit 1
fi

# Install required packages
echo "📦 Installing required packages..."
pip install -r requirements_fastapi.txt

# Initialize database
echo "🏗️ Initializing database..."
python init_database.py

if [ $? -ne 0 ]; then
    echo "❌ Database initialization failed"
    exit 1
fi

# Migrate embeddings from existing cache files
echo "📁 Migrating existing embeddings to database..."
python migrate_embeddings.py

if [ $? -ne 0 ]; then
    echo "⚠️ Migration completed with warnings (this is normal if no cache files exist)"
else
    echo "✅ Migration completed successfully"
fi

echo "🎉 Database setup complete!"
echo ""
echo "You can now start the server with:"
echo "python unified_server.py"
echo ""
echo "Or use the start script:"
echo "python start_server.py"
