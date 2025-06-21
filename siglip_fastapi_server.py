# EVA02 FastAPI Search Server
# Requirements: fastapi, uvicorn, open_clip_torch, timm, torch, pillow, numpy

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import numpy as np
import torch
from PIL import Image
from typing import List, Optional
from contextlib import asynccontextmanager
import open_clip

# Global variables
model = None
preprocess = None
tokenizer = None
image_embeddings = {}


# Lifespan manager for startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global model, preprocess, tokenizer
    print(
        "Loading EVA02 model (timm/eva02_large_patch14_clip_336.merged2b_s6b_b61k)..."
    )
    model, _, preprocess = open_clip.create_model_and_transforms(
        "EVA02-L-14-336", pretrained="merged2b_s6b_b61k"
    )
    tokenizer = open_clip.get_tokenizer("EVA02-L-14-336")
    model.eval()
    print("EVA02 model loaded successfully!")

    # Load image embeddings
    load_image_embeddings()

    yield

    # Shutdown (cleanup if needed)
    print("Shutting down...")


# Initialize FastAPI app with lifespan manager
app = FastAPI(
    title="EVA02 Semantic Search API",
    description="AI-powered semantic product search using EVA02 CLIP model",
    version="2.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to images
IMAGES_PATH = "client/public/test_images"
EMBEDDINGS_CACHE_PATH = "eva02_image_embeddings.json"


# Pydantic models for request/response
class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 10


class SearchResult(BaseModel):
    image: str
    similarity: float


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total_images: int
    model_info: str = "timm/eva02_large_patch14_clip_336.merged2b_s6b_b61k"


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    embeddings_count: int
    model_name: str = "EVA02 (timm/eva02_large_patch14_clip_336.merged2b_s6b_b61k)"


class RecomputeResponse(BaseModel):
    message: str
    embeddings_count: int
    model_used: str = "timm/eva02_large_patch14_clip_336.merged2b_s6b_b61k"


def load_image_embeddings():
    """Load pre-computed image embeddings from cache or compute them"""
    global image_embeddings

    if os.path.exists(EMBEDDINGS_CACHE_PATH):
        print("Loading cached EVA02 image embeddings...")
        with open(EMBEDDINGS_CACHE_PATH, "r") as f:
            cached_data = json.load(f)
            # Convert lists back to numpy arrays
            image_embeddings = {k: np.array(v) for k, v in cached_data.items()}
        print(f"Loaded {len(image_embeddings)} cached EVA02 embeddings")
    else:
        print("Computing EVA02 image embeddings...")
        compute_image_embeddings()


def compute_image_embeddings():
    """Compute embeddings for all images in test_images folder using EVA02"""
    global image_embeddings

    if not os.path.exists(IMAGES_PATH):
        print(f"Images path {IMAGES_PATH} does not exist!")
        return

    image_files = [
        f
        for f in os.listdir(IMAGES_PATH)
        if f.lower().endswith((".png", ".jpg", ".jpeg", ".avif", ".webp"))
    ]

    print(f"Found {len(image_files)} images to process with EVA02")

    for image_file in image_files:
        try:
            image_path = os.path.join(IMAGES_PATH, image_file)

            # Load and process image
            image = Image.open(image_path).convert("RGB")

            # Process image with EVA02
            image_input = preprocess(image).unsqueeze(0)

            with torch.no_grad():
                # Get image embeddings from EVA02
                image_features = model.encode_image(image_input)
                # Normalize features
                image_features = image_features / image_features.norm(
                    dim=-1, keepdim=True
                )
                embedding = image_features.squeeze().numpy()

            # Store embedding
            image_embeddings[image_file] = embedding

            print(f"Processed with EVA02: {image_file}")

        except Exception as e:
            print(f"Error processing {image_file} with EVA02: {e}")

    # Save embeddings to cache
    cache_data = {k: v.tolist() for k, v in image_embeddings.items()}
    with open(EMBEDDINGS_CACHE_PATH, "w") as f:
        json.dump(cache_data, f)

    print(f"Computed and cached {len(image_embeddings)} EVA02 image embeddings")


def search_images(query_text: str, top_k: int = 10) -> List[SearchResult]:
    """Search for images similar to query text using EVA02"""
    if not image_embeddings:
        return []

    # Get text embedding using EVA02
    text_tokens = tokenizer([query_text])

    with torch.no_grad():
        text_features = model.encode_text(text_tokens)
        # Normalize features
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        text_embedding = text_features.squeeze().numpy()

    # Calculate similarities using cosine similarity
    similarities = []
    for image_name, image_embedding in image_embeddings.items():
        # Both embeddings are already normalized, so dot product = cosine similarity
        similarity = np.dot(text_embedding, image_embedding)
        similarities.append(
            SearchResult(image=image_name, similarity=float(similarity))
        )

    # Sort by similarity (highest first)
    similarities.sort(key=lambda x: x.similarity, reverse=True)

    return similarities[:top_k]


@app.get("/", response_model=dict)
async def root():
    """Root endpoint with API information"""
    return {
        "message": "EVA02 Semantic Search API",
        "model": "timm/eva02_large_patch14_clip_336.merged2b_s6b_b61k",
        "version": "2.0.0",
        "improvements": [
            "State-of-the-art vision transformer architecture",
            "Superior zero-shot performance",
            "Better semantic understanding",
            "Optimized for large-scale datasets",
        ],
        "endpoints": {
            "health": "/health",
            "search": "/search",
            "recompute": "/recompute",
            "docs": "/docs",
        },
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        model_loaded=model is not None,
        embeddings_count=len(image_embeddings),
    )


@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """Search endpoint for text-to-image similarity using EVA02"""
    try:
        query_text = request.query.strip()

        if not query_text:
            raise HTTPException(status_code=400, detail="Query text cannot be empty")

        # Search for similar images
        results = search_images(query_text, request.top_k)

        return SearchResponse(
            query=query_text, results=results, total_images=len(image_embeddings)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recompute", response_model=RecomputeResponse)
async def recompute_embeddings():
    """Recompute image embeddings using EVA02 (useful if images are updated)"""
    try:
        # Remove cache file
        if os.path.exists(EMBEDDINGS_CACHE_PATH):
            os.remove(EMBEDDINGS_CACHE_PATH)

        # Recompute embeddings
        compute_image_embeddings()

        return RecomputeResponse(
            message="EVA02 embeddings recomputed successfully",
            embeddings_count=len(image_embeddings),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/compare-models", response_model=dict)
async def compare_models():
    """Compare EVA02 vs CLIP models"""
    return {
        "eva02": {
            "model": "timm/eva02_large_patch14_clip_336.merged2b_s6b_b61k",
            "advantages": [
                "State-of-the-art vision transformer architecture",
                "Excellent performance on fine-grained classification",
                "Better semantic understanding and localization",
                "Optimized for large-scale visual recognition",
                "Strong zero-shot transfer capabilities",
            ],
            "parameters": "1B+",
            "image_resolution": "336x336",
        },
        "clip": {
            "model": "openai/clip-vit-large-patch14",
            "advantages": [
                "Well established and tested",
                "Large community and resources",
                "Proven performance",
            ],
            "parameters": "427M",
            "image_resolution": "224x224",
        },
        "recommendation": "EVA02 for superior performance and accuracy",
    }


if __name__ == "__main__":
    import uvicorn

    print("Starting EVA02 FastAPI search server on http://localhost:5003")
    uvicorn.run(
        "siglip_fastapi_server:app",
        host="0.0.0.0",
        port=5003,
        reload=True,
        log_level="info",
    )
