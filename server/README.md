# AI Server

FastAPI server running CLIP, EVA02, and DFN5B models for semantic search.

## Quick Start

```bash
python unified_server.py
# Server at: http://localhost:5000
```

## API Endpoints

- `POST /search/{model}` - Search with specific model (clip, eva02, dfn5b)
- `POST /images/upload` - Upload images and generate embeddings
- `GET /health` - Server health check
- `GET /docs` - API documentation

## Architecture

```
server/
├── unified_server.py     # Main FastAPI app
├── core/                 # Configuration
├── models/               # AI model managers
└── embeddings_cache/     # Cached embeddings
```

For detailed documentation see [../PROJECT_EXPLANATION.md](../PROJECT_EXPLANATION.md)
