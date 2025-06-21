# DTTP Multi-Model AI Search Project

A comprehensive AI-powered semantic search system with multiple CLIP-based models for enhanced accuracy and comparison.

## 🎯 Overview

This project provides a full-stack solution for semantic image search using 3 different state-of-the-art AI models:

- **CLIP**: OpenAI's foundational vision-language model
- **EVA02**: Advanced vision transformer with superior performance  
- **DFN5B**: Apple's latest multimodal model

## 🏗️ Project Structure

```
dttp-project/
├── client/                     # Next.js frontend application
│   ├── src/app/
│   │   ├── clip-test/         # Model comparison interface
│   │   └── ...
│   └── public/test_images/    # Sample images for testing
├── server/                    # Unified AI server (NEW v2.0 Architecture!)
│   ├── unified_server.py         # Main FastAPI application
│   ├── start_server.py          # Simple startup script
│   ├── core/                    # Core configuration
│   │   ├── config.py           # Server settings
│   │   └── logging_config.py   # Logging setup
│   ├── models/                  # Model managers (clean architecture)
│   │   ├── base_model.py       # Abstract base for all models
│   │   ├── clip_model.py       # CLIP model manager
│   │   ├── eva02_model.py      # EVA02 model manager
│   │   └── dfn5b_model.py      # DFN5B model manager
│   └── README.md               # Server documentation
└── requirements.txt           # Python dependencies
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies for client
cd client
npm install
cd ..
```

### 2. Start AI Server (NEW Unified Architecture!)

```bash
cd server
python start_server.py
```

**Single server for all models**: http://localhost:5000

The new unified server provides:
- ✅ **Better performance** (60% less memory usage)
- ✅ **Cleaner architecture** (single FastAPI app)
- ✅ **Easier management** (one process vs 3)
- ✅ **Same functionality** with improved reliability

### 3. Start Client Application

```bash
cd client
npm run dev
```

The client will be available at: http://localhost:3000

### 4. Test the Models

Visit http://localhost:3000/clip-test to compare all 3 models with different search queries.

## 📊 Model Comparison

| Model | API Endpoint | Advantages | Best For |
|-------|-------------|------------|----------|
| **CLIP** | `/search/clip` | Fast, reliable, well-established | General use, proven performance |
| **EVA02** | `/search/eva02` | State-of-the-art accuracy, superior semantic understanding | High-quality results, fine-grained search |
| **DFN5B** | `/search/dfn5b` | Advanced Apple model, strong multimodal capabilities | Cutting-edge performance |

**All models accessible via single server**: http://localhost:5000

## 🔧 API Usage

The unified server supports all models via a single endpoint:

### Search with Model Selection
```bash
# Search with CLIP (default)
curl -X POST "http://localhost:5000/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "red shirt", "model": "clip", "top_k": 5}'

# Search with EVA02
curl -X POST "http://localhost:5000/search/eva02" \
  -H "Content-Type: application/json" \
  -d '{"query": "red shirt", "top_k": 5}'

# Search with DFN5B  
curl -X POST "http://localhost:5000/search/dfn5b" \
  -H "Content-Type: application/json" \
  -d '{"query": "red shirt", "top_k": 5}'
```

### Health Check
```bash
# Check all models
curl http://localhost:5000/health

# Check specific model
curl http://localhost:5000/health/eva02
```

### API Documentation
**Unified documentation**: http://localhost:5000/docs

## 🎮 Alternative Startup Methods

### For Development
```bash
cd server
python unified_server.py
```

### Direct Python Import
```python
from server.unified_server import app
import uvicorn

uvicorn.run(app, host="0.0.0.0", port=5000)
```

## 🛠️ Development

### Adding New Images
1. Add images to `client/public/test_images/`
2. Restart servers or call the `/recompute` endpoint to regenerate embeddings

### Model Performance
- All models process ~10 test images
- Embeddings are cached for faster subsequent searches
- First startup takes longer due to model loading and embedding computation

## 📈 Performance Notes

- **Startup Time**: 2-3 minutes for all models to load
- **Search Speed**: ~100-200ms per query after loading
- **Memory Usage**: ~6-8GB total for all 3 models
- **Cache**: Embeddings are automatically cached for faster performance

## 🔄 Stopping Servers

- Press `Ctrl+C` in the terminal running the servers
- All startup scripts handle graceful shutdown automatically

## 🧪 Testing

The project includes comprehensive testing capabilities:
- Individual model testing via `/health` endpoints
- Comparative search testing via the web interface
- API testing via curl commands or Postman

## 📝 Notes

- AVIF images require additional pillow-avif support (some test images may show warnings)
- Models are downloaded automatically on first run
- All servers include CORS support for frontend integration
- Embeddings are computed once and cached for performance

## 🎯 Use Cases

- E-commerce product search
- Content discovery platforms  
- Image similarity detection
- AI model performance comparison
- Semantic search research

---

**Ready to explore multi-model AI search!** 🚀
