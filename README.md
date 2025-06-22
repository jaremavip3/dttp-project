# DTTP Multi-Model AI Search Project

A full-stack AI-powered semantic search system comparing multiple state-of-the-art vision-language models (CLIP, EVA02, DFN5B).

## 📚 Documentation

For comprehensive project architecture, design decisions, and technical explanations, see:
**[PROJECT_EXPLANATION.md](./PROJECT_EXPLANATION.md)**

## 🏗️ Quick Overview

```
dttp-project/
├── client/                    # Next.js frontend (React 19 + Tailwind)
├── server/                    # FastAPI backend with 3 AI models
└── PROJECT_EXPLANATION.md     # Complete project documentation
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies for client
cd client && npm install && cd ..
```

### 2. Start AI Server

```bash
cd server
python unified_server.py
# Server runs at: http://localhost:5000
```

### 3. Start Client Application

```bash
cd client
npm run dev
# Client runs at: http://localhost:3000
```

## 🔧 API Endpoints

- **Search**: `POST /search/{model}` - Search with CLIP, EVA02, or DFN5B
- **Upload**: `POST /images/upload` - Upload images and generate embeddings
- **Stats**: `GET /database/stats` - Database statistics
- **Models**: `GET /models` - Available AI models

## 📊 Models

| Model     | Strengths               | Best For             |
| --------- | ----------------------- | -------------------- |
| **CLIP**  | Fast, reliable baseline | General search       |
| **EVA02** | Superior accuracy       | High-quality results |
| **DFN5B** | Latest Apple technology | Cutting-edge search  |

## 🎯 Features

- **Multi-Model Search**: Compare 3 AI models side-by-side
- **PostgreSQL Storage**: Scalable database for embeddings
- **Real-time Search**: Instant results with caching
- **Modern UI**: Next.js + Tailwind CSS interface
- **Production Ready**: FastAPI + async architecture

---

For detailed architecture and technical decisions, see [PROJECT_EXPLANATION.md](./PROJECT_EXPLANATION.md)
