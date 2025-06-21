# Database Integration for Multi-Model AI Search Server

This document describes the database integration for storing images and embeddings using Supabase (PostgreSQL with pgvector support).

## Overview

The system now uses a PostgreSQL database (via Supabase) to store:

- **Images**: Metadata about images including filename, dimensions, format, etc.
- **Embeddings**: Vector embeddings from CLIP, EVA02, and DFN5B models
- **Search logs**: Analytics data for search queries

## Database Schema

### Images Table

```sql
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL UNIQUE,
    original_path VARCHAR(500),
    storage_url VARCHAR(500),
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    format VARCHAR(50),
    metadata TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
```

### Image Embeddings Table

```sql
CREATE TABLE image_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID REFERENCES images(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(200),
    embedding_dim INTEGER NOT NULL,
    embedding FLOAT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(image_id, model_name)
);
```

### Search Logs Table

```sql
CREATE TABLE search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text TEXT NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    top_k INTEGER DEFAULT 10,
    processing_time_ms INTEGER,
    results_count INTEGER,
    user_session VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Setup Instructions

### 1. Prerequisites

- Supabase account and project
- Python 3.8+
- Required packages (see requirements_fastapi.txt)

### 2. Database Configuration

Update the database connection settings in `core/database.py`:

```python
SUPABASE_URL = "https://your-project.supabase.co"
DATABASE_URL = "postgresql+asyncpg://postgres:password@db.your-project.supabase.co:5432/postgres"
```

### 3. Initialize Database

Run the setup script:

```bash
cd server
chmod +x setup_database.sh
./setup_database.sh
```

Or manually:

```bash
# Install dependencies
pip install -r requirements_fastapi.txt

# Initialize database
python init_database.py

# Migrate existing embeddings (optional)
python migrate_embeddings.py
```

## API Endpoints

### Image Management

- `POST /images/upload` - Upload new image and generate embeddings
- `GET /images` - List all images with pagination
- `GET /database/stats` - Get database statistics

### Embedding Management

- `POST /embeddings/generate/{model}` - Generate embeddings for all images
- `POST /search/{model}` - Search using vector similarity

### Example Usage

#### Upload Image

```javascript
const formData = new FormData();
formData.append("file", imageFile);
formData.append("models", "clip,eva02");

const response = await fetch("/images/upload", {
  method: "POST",
  body: formData,
});
```

#### Search Images

```javascript
const response = await fetch("/search/clip", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "red dress",
    top_k: 10,
  }),
});
```

## Vector Similarity Search

The system uses PostgreSQL array operations for vector similarity search. For production deployments, consider:

1. **pgvector Extension**: Install pgvector for optimized vector operations
2. **Indexing**: Create proper indexes for vector columns
3. **Normalization**: Ensure embeddings are normalized for cosine similarity

### pgvector Integration (Advanced)

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Alter table to use vector type
ALTER TABLE image_embeddings
ADD COLUMN embedding_vector vector(512);  -- Adjust dimension as needed

-- Create vector index
CREATE INDEX ON image_embeddings
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100);
```

## Performance Considerations

1. **Embedding Storage**: Embeddings are stored as PostgreSQL arrays (FLOAT[])
2. **Search Performance**: Python fallback is used if database search fails
3. **Caching**: Model managers maintain backward compatibility with file-based caching
4. **Indexing**: Proper indexes are created for common query patterns

## Migration from File-based Storage

The migration script (`migrate_embeddings.py`) handles:

1. Creating image records for existing images
2. Converting JSON embeddings to database format
3. Preserving original file paths for reference

## Monitoring and Analytics

- Search queries are logged in `search_logs` table
- Database statistics available via `/database/stats` endpoint
- Model usage analytics tracked per search

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check Supabase URL and credentials
2. **Extension Missing**: Ensure pgvector is available (optional but recommended)
3. **Memory Issues**: Large embeddings may require connection pooling adjustments

### Debugging

Enable SQL query logging:

```python
# In core/database.py
engine = create_async_engine(DATABASE_URL, echo=True)
```

## Future Enhancements

1. **Supabase Storage**: Store image files in Supabase Storage
2. **Real-time Updates**: Use Supabase real-time features
3. **Advanced Indexing**: Implement proper vector indexes with pgvector
4. **Caching Layer**: Add Redis for frequently accessed embeddings
5. **Batch Processing**: Optimize bulk embedding generation

## Security Considerations

1. **Row Level Security**: Implement RLS policies in Supabase
2. **API Keys**: Secure Supabase service keys
3. **File Validation**: Validate uploaded image files
4. **Rate Limiting**: Implement rate limiting for uploads and searches
