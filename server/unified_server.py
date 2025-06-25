"""
Multi-Model AI Search Server
A unified FastAPI server managing CLIP, EVA02, and DFN5B models with database-backed embeddings
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
import asyncio
import logging
import os
import tempfile
import shutil
from datetime import datetime
from PIL import Image as PILImage
import uuid
import io

# Import model managers
from models.clip_model import CLIPModelManager
from models.eva02_model import EVA02ModelManager
from models.dfn5b_model import DFN5BModelManager
from models.blip2_hf_api_model import BLIP2HFAPIModelManager
from core.config import Settings
from core.logging_config import setup_logging
from core.database import (
    get_async_session,
    init_database,
    close_database,
    async_session_maker,
)
from core.db_service import DatabaseService
from core.models import Image as DBImage
from sqlalchemy import select, func

# Initialize settings
settings = Settings()

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Global model managers
model_managers: Dict[str, Any] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting Multi-Model AI Search Server")

    # Initialize database (optional - can fallback to file-based for development)
    try:
        await init_database()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.warning(f"⚠️ Database initialization failed: {e}")
        logger.info("🔄 Server will continue with file-based fallback for development")
        # Don't raise here - let the server start without database

    # Initialize model managers
    model_managers["clip"] = CLIPModelManager()
    model_managers["eva02"] = EVA02ModelManager()
    model_managers["dfn5b"] = DFN5BModelManager()
    model_managers["blip2"] = BLIP2HFAPIModelManager()

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
    await close_database()
    logger.info("✅ Server shutdown complete")


# Initialize FastAPI app
app = FastAPI(
    title="Multi-Model AI Search Server",
    description="Unified server for CLIP, EVA02, and DFN5B semantic search models",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
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
    storage_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


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


class ImageUploadResponse(BaseModel):
    success: bool
    message: str
    image_id: str
    filename: str
    embeddings_generated: List[str]


class ImageInfo(BaseModel):
    id: str
    filename: str
    storage_url: Optional[str]
    width: Optional[int]
    height: Optional[int]
    format: Optional[str]
    created_at: datetime
    embeddings_available: List[str]


class ImageListResponse(BaseModel):
    images: List[ImageInfo]
    total_count: int


class DatabaseStatsResponse(BaseModel):
    total_images: int
    total_embeddings: int
    embeddings_by_model: Dict[str, int]
    storage_size_mb: Optional[float]


class ProductResponse(BaseModel):
    id: str
    name: str
    filename: str
    image_url: str
    category: Optional[str] = None
    split: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ProductsListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    per_page: int


class ProductSearchResult(BaseModel):
    """Product with AI search similarity score"""

    id: str
    name: str
    filename: str
    image_url: str
    category: Optional[str] = None
    split: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    similarity_score: float
    search_rank: int


class ProductSearchResponse(BaseModel):
    """AI-powered product search response"""

    query: str
    model: str
    products: List[ProductSearchResult]
    total_results: int
    processing_time_ms: float


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
            "docs": "/docs",
        },
        "architecture": "Unified FastAPI server with multiple model managers",
    }


@app.get("/models", response_model=ModelListResponse)
async def list_models():
    """List available models"""
    return ModelListResponse(
        available_models=list(model_managers.keys()), default_model="clip"
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Overall health check for all models"""
    models_health = []
    total_embeddings = 0

    for name, manager in model_managers.items():
        health = await manager.get_health()
        models_health.append(
            ModelHealth(
                name=name,
                status=health["status"],
                loaded=health["loaded"],
                embeddings_count=health["embeddings_count"],
                model_info=health["model_info"],
            )
        )
        total_embeddings += health["embeddings_count"]

    uptime = (datetime.now() - server_start_time).total_seconds()

    return HealthResponse(
        server_status="healthy",
        models=models_health,
        uptime_seconds=uptime,
        total_embeddings=total_embeddings,
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
        model_info=health["model_info"],
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
        search_results = await manager.search(request.query, request.top_k)

        # Convert SearchResult objects to Pydantic models
        results = []
        for result in search_results:
            results.append(
                SearchResult(
                    image=result.image,
                    similarity=result.similarity,
                    storage_url=getattr(result, "storage_url", None),
                    metadata=getattr(result, "metadata", {}),
                )
            )

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return SearchResponse(
            query=request.query,
            model=model,
            results=results,
            total_images=len(await manager.get_embeddings()),
            processing_time_ms=processing_time,
        )

    except Exception as e:
        logger.error(f"Search error with {model}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search-products", response_model=ProductSearchResponse)
async def search_products(request: SearchRequest):
    """AI-powered product search that returns full product information"""
    return await search_products_with_model(request.model, request)


@app.post("/search-products/{model}", response_model=ProductSearchResponse)
async def search_products_with_model(model: str, request: SearchRequest):
    """AI-powered product search using specific model with full product information"""
    if model not in model_managers:
        raise HTTPException(status_code=404, detail=f"Model '{model}' not found")

    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        start_time = datetime.now()

        # Step 1: Perform AI search
        manager = model_managers[model]
        search_results = await manager.search(request.query, request.top_k)

        if not search_results:
            return ProductSearchResponse(
                query=request.query,
                model=model,
                products=[],
                total_results=0,
                processing_time_ms=(datetime.now() - start_time).total_seconds() * 1000,
            )

        # Step 2: Get filenames from search results
        result_filenames = [result.image for result in search_results]

        # Step 3: Fetch product information for these images
        products_with_scores = []

        # Try database first
        if async_session_maker:
            try:
                async for session in get_async_session():
                    # Query products by filename
                    result = await session.execute(
                        select(DBImage).where(DBImage.filename.in_(result_filenames))
                    )
                    images = result.scalars().all()

                    # Create filename to image mapping
                    image_map = {img.filename: img for img in images}

                    # Build results in search order
                    for rank, search_result in enumerate(search_results):
                        image = image_map.get(search_result.image)
                        if image:
                            # Extract metadata
                            metadata = image.image_metadata or {}
                            category_name = metadata.get("category", "unknown")
                            split_name = metadata.get("split", "unknown")

                            # Generate display name
                            display_name = image.filename
                            if category_name != "unknown":
                                display_name = f"{category_name.title()}"
                                if "index" in metadata:
                                    display_name += f" #{metadata['index']}"

                            # Generate image URL
                            if hasattr(image, "storage_url") and image.storage_url:
                                image_url = image.storage_url
                            else:
                                image_url = f"/images/{image.filename}"

                            products_with_scores.append(
                                ProductSearchResult(
                                    id=str(image.id),
                                    name=display_name,
                                    filename=image.filename,
                                    image_url=image_url,
                                    category=category_name,
                                    split=split_name,
                                    metadata=metadata,
                                    similarity_score=search_result.similarity,
                                    search_rank=rank + 1,
                                )
                            )
                    break

            except Exception as db_error:
                logger.warning(f"Database query failed for product search: {db_error}")

        # Fallback: Use Supabase REST API
        if not products_with_scores:
            try:
                from core.database import supabase

                # Get products for the search result filenames
                for rank, search_result in enumerate(search_results):
                    filename = search_result.image
                    result = (
                        supabase.table("images")
                        .select("*")
                        .eq("filename", filename)
                        .execute()
                    )

                    if result.data and len(result.data) > 0:
                        image_data = result.data[0]

                        # Parse metadata
                        metadata_raw = image_data.get("image_metadata", {})
                        if isinstance(metadata_raw, str):
                            import json

                            try:
                                metadata = json.loads(metadata_raw)
                            except json.JSONDecodeError:
                                metadata = {}
                        else:
                            metadata = metadata_raw or {}

                        category_name = metadata.get("category", "unknown")
                        split_name = metadata.get("split", "unknown")

                        # Generate display name
                        display_name = image_data["filename"]
                        if category_name != "unknown":
                            display_name = f"{category_name.title()}"
                            if "index" in metadata:
                                display_name += f" #{metadata['index']}"

                        # Generate image URL
                        if image_data.get("storage_url"):
                            image_url = image_data["storage_url"]
                        else:
                            image_url = f"/images/{image_data['filename']}"

                        products_with_scores.append(
                            ProductSearchResult(
                                id=str(image_data["id"]),
                                name=display_name,
                                filename=image_data["filename"],
                                image_url=image_url,
                                category=category_name,
                                split=split_name,
                                metadata=metadata,
                                similarity_score=search_result.similarity,
                                search_rank=rank + 1,
                            )
                        )

            except Exception as api_error:
                logger.warning(
                    f"Supabase REST API query failed for product search: {api_error}"
                )

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return ProductSearchResponse(
            query=request.query,
            model=model,
            products=products_with_scores,
            total_results=len(products_with_scores),
            processing_time_ms=processing_time,
        )

    except Exception as e:
        logger.error(f"Product search error with {model}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Database and Image Management Endpoints


@app.post("/images/upload", response_model=ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    generate_embeddings: bool = True,
    models: Optional[str] = None,  # Comma-separated list of models, e.g., "clip,eva02"
):
    """Upload an image and optionally generate embeddings"""

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Save uploaded file temporarily
    temp_file = None
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=f"_{file.filename}"
        ) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"

        # Store image in database
        async with get_async_session() as session:
            image = await DatabaseService.create_image(
                session=session,
                filename=unique_filename,
                original_path=temp_path,
                metadata={"original_filename": file.filename, "uploaded": True},
            )

        embeddings_generated = []

        if generate_embeddings:
            # Determine which models to use
            if models:
                model_list = [m.strip() for m in models.split(",")]
            else:
                model_list = list(model_managers.keys())

            # Generate embeddings for specified models
            for model_name in model_list:
                if model_name in model_managers:
                    try:
                        manager = model_managers[model_name]
                        success = await manager.process_and_store_image(temp_path)
                        if success:
                            embeddings_generated.append(model_name)
                        else:
                            logger.warning(
                                f"Failed to generate {model_name} embedding for {unique_filename}"
                            )
                    except Exception as e:
                        logger.error(f"Error generating {model_name} embedding: {e}")

        # Clean up temporary file
        if temp_file and os.path.exists(temp_path):
            os.unlink(temp_path)

        return ImageUploadResponse(
            success=True,
            message=f"Image uploaded successfully with {len(embeddings_generated)} embeddings",
            image_id=str(image.id),
            filename=unique_filename,
            embeddings_generated=embeddings_generated,
        )

    except Exception as e:
        # Clean up on error
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/images", response_model=ImageListResponse)
async def list_images(limit: int = 100, offset: int = 0):
    """List all images in the database"""
    try:
        async with get_async_session() as session:
            images = await DatabaseService.get_all_images(session)

            # Convert to response format
            image_infos = []
            for image in images[offset : offset + limit]:
                embeddings_available = [emb.model_name for emb in image.embeddings]
                image_infos.append(
                    ImageInfo(
                        id=str(image.id),
                        filename=image.filename,
                        storage_url=image.storage_url,
                        width=image.width,
                        height=image.height,
                        format=image.format,
                        created_at=image.created_at,
                        embeddings_available=embeddings_available,
                    )
                )

            return ImageListResponse(images=image_infos, total_count=len(images))

    except Exception as e:
        logger.error(f"Error listing images: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/database/stats", response_model=DatabaseStatsResponse)
async def get_database_stats():
    """Get database statistics"""
    try:
        async with get_async_session() as session:
            images = await DatabaseService.get_all_images(session)

            total_images = len(images)
            total_embeddings = sum(len(img.embeddings) for img in images)

            # Count embeddings by model
            embeddings_by_model = {}
            for image in images:
                for embedding in image.embeddings:
                    model_name = embedding.model_name
                    embeddings_by_model[model_name] = (
                        embeddings_by_model.get(model_name, 0) + 1
                    )

            return DatabaseStatsResponse(
                total_images=total_images,
                total_embeddings=total_embeddings,
                embeddings_by_model=embeddings_by_model,
                storage_size_mb=None,  # Could calculate this if needed
            )

    except Exception as e:
        logger.error(f"Error getting database stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/embeddings/generate/{model}")
async def generate_embeddings_for_model(
    model: str, background_tasks: BackgroundTasks, force_regenerate: bool = False
):
    """Generate embeddings for all images using specified model"""
    if model not in model_managers:
        raise HTTPException(status_code=404, detail=f"Model '{model}' not found")

    async def generate_embeddings():
        try:
            async with get_async_session() as session:
                images = await DatabaseService.get_all_images(session)
                manager = model_managers[model]

                processed = 0
                skipped = 0

                for image in images:
                    try:
                        # Check if embedding already exists
                        existing_embeddings = [
                            emb for emb in image.embeddings if emb.model_name == model
                        ]

                        if existing_embeddings and not force_regenerate:
                            skipped += 1
                            continue

                        # Process image if it has a valid path
                        if image.original_path and os.path.exists(image.original_path):
                            success = await manager.process_and_store_image(
                                image.original_path
                            )
                            if success:
                                processed += 1

                    except Exception as e:
                        logger.error(f"Error processing image {image.filename}: {e}")

                logger.info(
                    f"✅ Embedding generation completed for {model}: {processed} processed, {skipped} skipped"
                )

        except Exception as e:
            logger.error(f"❌ Error generating embeddings for {model}: {e}")

    background_tasks.add_task(generate_embeddings)

    return {
        "message": f"Generating embeddings for {model} in background",
        "model": model,
        "force_regenerate": force_regenerate,
        "status": "started",
    }


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
        "status": "started",
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
        "status": "started",
    }


@app.get("/images/{image_filename}")
async def serve_image(image_filename: str):
    """Serve an image by redirecting to Supabase Storage or from database/file fallback"""
    try:
        # First try to get storage URL from database
        if async_session_maker:
            try:
                async for session in get_async_session():
                    result = await session.execute(
                        select(DBImage).where(DBImage.filename == image_filename)
                    )
                    image_record = result.scalar_one_or_none()

                    if image_record and image_record.storage_url:
                        # Redirect to Supabase Storage
                        from fastapi.responses import RedirectResponse

                        return RedirectResponse(
                            url=image_record.storage_url, status_code=302
                        )

                    # If no storage URL but has binary data, serve from database
                    if (
                        image_record
                        and hasattr(image_record, "data")
                        and image_record.data
                    ):
                        # Determine content type based on file extension
                        content_type = "image/jpeg"  # default
                        if image_filename.lower().endswith(".png"):
                            content_type = "image/png"
                        elif image_filename.lower().endswith(".webp"):
                            content_type = "image/webp"
                        elif image_filename.lower().endswith(".avif"):
                            content_type = "image/avif"
                        elif image_filename.lower().endswith(".gif"):
                            content_type = "image/gif"

                        # Return the image data from database
                        return StreamingResponse(
                            io.BytesIO(image_record.data),
                            media_type=content_type,
                            headers={"Cache-Control": "public, max-age=3600"},
                        )
                    break  # Exit the async for loop
            except Exception as db_error:
                logger.warning(
                    f"Database query failed for image {image_filename}: {db_error}"
                )

        # Fallback: Try Supabase REST API to get storage URL
        try:
            from core.database import supabase

            result = (
                supabase.table("images")
                .select("storage_url")
                .eq("filename", image_filename)
                .execute()
            )

            if (
                result.data
                and len(result.data) > 0
                and result.data[0].get("storage_url")
            ):
                from fastapi.responses import RedirectResponse

                return RedirectResponse(
                    url=result.data[0]["storage_url"], status_code=302
                )
        except Exception as api_error:
            logger.warning(
                f"Supabase REST API query failed for image {image_filename}: {api_error}"
            )

        # Fallback: Try to serve from file system
        fallback_path = os.path.join("../client/public/test_images", image_filename)
        if os.path.exists(fallback_path):
            # Determine content type based on file extension
            content_type = "image/jpeg"  # default
            if image_filename.lower().endswith(".png"):
                content_type = "image/png"
            elif image_filename.lower().endswith(".webp"):
                content_type = "image/webp"
            elif image_filename.lower().endswith(".avif"):
                content_type = "image/avif"
            elif image_filename.lower().endswith(".gif"):
                content_type = "image/gif"

            # Read and return the image file
            with open(fallback_path, "rb") as image_file:
                image_data = image_file.read()

            return StreamingResponse(
                io.BytesIO(image_data),
                media_type=content_type,
                headers={"Cache-Control": "public, max-age=3600"},
            )

        # If no image found anywhere
        raise HTTPException(
            status_code=404, detail=f"Image '{image_filename}' not found"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving image {image_filename}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/products", response_model=ProductsListResponse)
async def get_products(
    page: int = 1,
    per_page: int = 50,
    category: Optional[str] = None,
    split: Optional[str] = None,
):
    """Get products/images from the database with pagination and filtering"""
    try:
        # Try to get from database first
        if async_session_maker:
            try:
                async for session in get_async_session():
                    # Build query
                    query = select(DBImage)

                    # Apply filters
                    if category:
                        query = query.where(
                            DBImage.image_metadata["category"].astext == category
                        )
                    if split:
                        query = query.where(
                            DBImage.image_metadata["split"].astext == split
                        )

                    # Get total count
                    count_query = select(func.count(DBImage.id))
                    if category:
                        count_query = count_query.where(
                            DBImage.image_metadata["category"].astext == category
                        )
                    if split:
                        count_query = count_query.where(
                            DBImage.image_metadata["split"].astext == split
                        )

                    total_result = await session.execute(count_query)
                    total = total_result.scalar()

                    # Apply pagination
                    offset = (page - 1) * per_page
                    query = query.offset(offset).limit(per_page)

                    result = await session.execute(query)
                    images = result.scalars().all()

                    # Convert to ProductResponse
                    products = []
                    for image in images:
                        # Extract category from metadata or filename
                        metadata = image.image_metadata or {}
                        category_name = metadata.get("category", "unknown")
                        split_name = metadata.get("split", "unknown")

                        # Generate a display name
                        display_name = image.filename
                        if category_name != "unknown":
                            display_name = f"{category_name.title()}"
                            if "index" in metadata:
                                display_name += f" #{metadata['index']}"

                        # Generate image URL - prefer storage URL if available
                        if hasattr(image, "storage_url") and image.storage_url:
                            image_url = image.storage_url
                        else:
                            image_url = f"/images/{image.filename}"

                        products.append(
                            ProductResponse(
                                id=str(image.id),
                                name=display_name,
                                filename=image.filename,
                                image_url=image_url,
                                category=category_name,
                                split=split_name,
                                metadata=metadata,
                            )
                        )

                    return ProductsListResponse(
                        products=products, total=total, page=page, per_page=per_page
                    )
                    break
            except Exception as db_error:
                logger.warning(f"Database query failed for products: {db_error}")

        # Fallback: Use Supabase REST API
        try:
            from core.database import supabase

            # Build Supabase query
            query = supabase.table("images").select("*")

            # Apply filters
            if category:
                query = query.eq("image_metadata->>category", category)
            if split:
                query = query.eq("image_metadata->>split", split)

            # Get total count for pagination
            count_response = supabase.table("images").select("id", count="exact")
            if category:
                count_response = count_response.eq(
                    "image_metadata->>category", category
                )
            if split:
                count_response = count_response.eq("image_metadata->>split", split)

            count_result = count_response.execute()
            total = count_result.count

            # Apply pagination
            offset = (page - 1) * per_page
            query = query.range(offset, offset + per_page - 1)

            response = query.execute()

            # Convert to ProductResponse
            products = []
            for image_data in response.data:
                # Parse metadata if it's a JSON string
                metadata_raw = image_data.get("image_metadata", {})
                if isinstance(metadata_raw, str):
                    import json

                    try:
                        metadata = json.loads(metadata_raw)
                    except json.JSONDecodeError:
                        metadata = {}
                else:
                    metadata = metadata_raw or {}

                category_name = metadata.get("category", "unknown")
                split_name = metadata.get("split", "unknown")

                # Generate a display name
                display_name = image_data["filename"]
                if category_name != "unknown":
                    display_name = f"{category_name.title()}"
                    if "index" in metadata:
                        display_name += f" #{metadata['index']}"

                # Generate image URL - prefer storage URL if available
                if image_data.get("storage_url"):
                    image_url = image_data["storage_url"]
                else:
                    image_url = f"/images/{image_data['filename']}"

                products.append(
                    ProductResponse(
                        id=str(image_data["id"]),
                        name=display_name,
                        filename=image_data["filename"],
                        image_url=image_url,
                        category=category_name,
                        split=split_name,
                        metadata=metadata,
                    )
                )

            return ProductsListResponse(
                products=products, total=total, page=page, per_page=per_page
            )

        except Exception as api_error:
            logger.warning(f"Supabase REST API query failed for products: {api_error}")

        # Final fallback: return empty list
        return ProductsListResponse(products=[], total=0, page=page, per_page=per_page)

    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/products/categories")
async def get_categories():
    """Get available product categories from the database"""
    try:
        if async_session_maker:
            try:
                async for session in get_async_session():
                    # Query distinct categories from metadata
                    query = select(
                        func.distinct(DBImage.image_metadata["category"].astext)
                    ).where(DBImage.image_metadata["category"].astext.isnot(None))
                    result = await session.execute(query)
                    categories = [cat for cat in result.scalars().all() if cat]

                    return {"categories": sorted(categories)}
                    break
            except Exception as db_error:
                logger.warning(f"Database query failed for categories: {db_error}")

        # Fallback
        return {"categories": []}

    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """Analyze uploaded image using BLIP-2 to generate description and tags"""
    try:
        # Check if BLIP-2 model is available
        if "blip2" not in model_managers:
            raise HTTPException(status_code=503, detail="BLIP-2 model not available")

        blip2_manager = model_managers["blip2"]

        if not blip2_manager.is_loaded:
            raise HTTPException(status_code=503, detail="BLIP-2 model not loaded")

        # Read and process the uploaded file
        contents = await file.read()

        # Open image
        try:
            image = PILImage.open(io.BytesIO(contents)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")

        # Generate analysis using BLIP-2
        analysis = await blip2_manager.analyze_image(image)

        return {"success": True, "analysis": analysis, "filename": file.filename}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing image: {e}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")


@app.post("/generate-description")
async def generate_description(file: UploadFile = File(...)):
    """Generate product description for uploaded image using BLIP-2"""
    try:
        # Check if BLIP-2 model is available
        if "blip2" not in model_managers:
            raise HTTPException(status_code=503, detail="BLIP-2 model not available")

        blip2_manager = model_managers["blip2"]

        if not blip2_manager.is_loaded:
            raise HTTPException(status_code=503, detail="BLIP-2 model not loaded")

        # Read and process the uploaded file
        contents = await file.read()

        # Open image
        try:
            image = PILImage.open(io.BytesIO(contents)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")

        # Generate description using BLIP-2
        description = await blip2_manager.generate_description(image)

        return {"success": True, "description": description, "filename": file.filename}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating description: {e}")
        raise HTTPException(
            status_code=500, detail=f"Description generation failed: {str(e)}"
        )


@app.post("/generate-tags")
async def generate_tags(file: UploadFile = File(...)):
    """Generate product tags for uploaded image using BLIP-2"""
    try:
        # Check if BLIP-2 model is available
        if "blip2" not in model_managers:
            raise HTTPException(status_code=503, detail="BLIP-2 model not available")

        blip2_manager = model_managers["blip2"]

        if not blip2_manager.is_loaded:
            raise HTTPException(status_code=503, detail="BLIP-2 model not loaded")

        # Read and process the uploaded file
        contents = await file.read()

        # Open image
        try:
            image = PILImage.open(io.BytesIO(contents)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")

        # Generate tags using BLIP-2
        tags = await blip2_manager.generate_tags(image)

        return {"success": True, "tags": tags, "filename": file.filename}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating tags: {e}")
        raise HTTPException(status_code=500, detail=f"Tag generation failed: {str(e)}")


# Run the server
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
