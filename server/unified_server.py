"""
Multi-Model AI Search Server
A unified FastAPI server managing CLIP, EVA02, and DFN5B models
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
import asyncio
import logging
import os
from datetime import datetime

# Import model managers
from models.clip_model import CLIPModelManager
from models.eva02_model import EVA02ModelManager  
from models.dfn5b_model import DFN5BModelManager
from core.config import settings
from core.logging_config import setup_logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Global model managers
model_managers: Dict[str, Any] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting Multi-Model AI Search Server")
    
    # Initialize model managers
    model_managers["clip"] = CLIPModelManager()
    model_managers["eva02"] = EVA02ModelManager()
    model_managers["dfn5b"] = DFN5BModelManager()
    
    # Load models asynchronously
    load_tasks = []
    for name, manager in model_managers.items():
        logger.info(f"📥 Loading {name.upper()} model...")
        task = asyncio.create_task(manager.load_model())
        load_tasks.append(task)
    
    # Wait for all models to load
    try:
        await asyncio.gather(*load_tasks)
        logger.info("✅ All models loaded successfully!")
    except Exception as e:
        logger.error(f"❌ Failed to load models: {e}")
        raise
    
    yield
    
    # Cleanup
    logger.info("🔄 Shutting down server...")
    for manager in model_managers.values():
        await manager.cleanup()
    logger.info("✅ Server shutdown complete")

# Initialize FastAPI app
app = FastAPI(
    title="Multi-Model AI Search Server",
    description="Unified server for CLIP, EVA02, and DFN5B semantic search models",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class SearchRequest(BaseModel):
    query: str
    model: str = "clip"  # Default to CLIP
    top_k: Optional[int] = 10

class SearchResult(BaseModel):
    image: str
    similarity: float

class SearchResponse(BaseModel):
    query: str
    model: str
    results: List[SearchResult]
    total_images: int
    processing_time_ms: float

class ModelHealth(BaseModel):
    name: str
    status: str
    loaded: bool
    embeddings_count: int
    model_info: str

class HealthResponse(BaseModel):
    server_status: str
    models: List[ModelHealth]
    uptime_seconds: float
    total_embeddings: int

class ModelListResponse(BaseModel):
    available_models: List[str]
    default_model: str
    
# Track server start time
server_start_time = datetime.now()

@app.get("/", response_model=dict)
async def root():
    """Root endpoint with server information"""
    return {
        "message": "Multi-Model AI Search Server",
        "version": "2.0.0",
        "available_models": list(model_managers.keys()),
        "endpoints": {
            "search": "/search",
            "health": "/health", 
            "models": "/models",
            "search_model": "/search/{model}",
            "health_model": "/health/{model}",
            "recompute": "/recompute",
            "docs": "/docs"
        },
        "architecture": "Unified FastAPI server with multiple model managers"
    }

@app.get("/models", response_model=ModelListResponse)
async def list_models():
    """List available models"""
    return ModelListResponse(
        available_models=list(model_managers.keys()),
        default_model="clip"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Overall health check for all models"""
    models_health = []
    total_embeddings = 0
    
    for name, manager in model_managers.items():
        health = await manager.get_health()
        models_health.append(ModelHealth(
            name=name,
            status=health["status"],
            loaded=health["loaded"],
            embeddings_count=health["embeddings_count"],
            model_info=health["model_info"]
        ))
        total_embeddings += health["embeddings_count"]
    
    uptime = (datetime.now() - server_start_time).total_seconds()
    
    return HealthResponse(
        server_status="healthy",
        models=models_health,
        uptime_seconds=uptime,
        total_embeddings=total_embeddings
    )

@app.get("/health/{model}", response_model=ModelHealth)
async def model_health_check(model: str):
    """Health check for specific model"""
    if model not in model_managers:
        raise HTTPException(status_code=404, detail=f"Model '{model}' not found")
    
    manager = model_managers[model]
    health = await manager.get_health()
    
    return ModelHealth(
        name=model,
        status=health["status"],
        loaded=health["loaded"],
        embeddings_count=health["embeddings_count"],
        model_info=health["model_info"]
    )

@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """Search using specified model"""
    return await search_with_model(request.model, request)

@app.post("/search/{model}", response_model=SearchResponse)
async def search_with_model(model: str, request: SearchRequest):
    """Search using specific model"""
    if model not in model_managers:
        raise HTTPException(status_code=404, detail=f"Model '{model}' not found")
    
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        start_time = datetime.now()
        manager = model_managers[model]
        
        # Perform search
        results = await manager.search(request.query, request.top_k)
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return SearchResponse(
            query=request.query,
            model=model,
            results=results,
            total_images=len(await manager.get_embeddings()),
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        logger.error(f"Search error with {model}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recompute")
async def recompute_embeddings(background_tasks: BackgroundTasks):
    """Recompute embeddings for all models"""
    async def recompute_all():
        for name, manager in model_managers.items():
            logger.info(f"🔄 Recomputing embeddings for {name}")
            await manager.recompute_embeddings()
            logger.info(f"✅ Completed recomputing embeddings for {name}")
    
    background_tasks.add_task(recompute_all)
    
    return {
        "message": "Recomputing embeddings for all models in background",
        "models": list(model_managers.keys()),
        "status": "started"
    }

@app.post("/recompute/{model}")
async def recompute_model_embeddings(model: str, background_tasks: BackgroundTasks):
    """Recompute embeddings for specific model"""
    if model not in model_managers:
        raise HTTPException(status_code=404, detail=f"Model '{model}' not found")
    
    manager = model_managers[model]
    
    async def recompute_single():
        logger.info(f"🔄 Recomputing embeddings for {model}")
        await manager.recompute_embeddings()
        logger.info(f"✅ Completed recomputing embeddings for {model}")
    
    background_tasks.add_task(recompute_single)
    
    return {
        "message": f"Recomputing embeddings for {model} in background",
        "model": model,
        "status": "started"
    }

if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 Starting Multi-Model AI Search Server")
    uvicorn.run(
        "unified_server:app",
        host="0.0.0.0",
        port=5000,
        reload=False,  # Disable reload in production
        log_level="info"
    )
