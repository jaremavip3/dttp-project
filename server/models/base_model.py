"""
Base model manager class for all AI models
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any
import os
import json
import numpy as np
import asyncio
from PIL import Image
import logging
from core.config import settings

logger = logging.getLogger(__name__)


class SearchResult:
    def __init__(self, image: str, similarity: float):
        self.image = image
        self.similarity = similarity


class BaseModelManager(ABC):
    """Abstract base class for all model managers"""

    def __init__(self, model_name: str, cache_file: str):
        self.model_name = model_name
        self.cache_file = os.path.join(settings.EMBEDDINGS_CACHE_DIR, cache_file)
        self.model = None
        self.preprocess = None
        self.tokenizer = None
        self.image_embeddings = {}
        self.is_loaded = False

    @abstractmethod
    async def load_model(self):
        """Load the AI model"""
        pass

    @abstractmethod
    async def encode_image(self, image: Image.Image) -> np.ndarray:
        """Encode a single image to embedding"""
        pass

    @abstractmethod
    async def encode_text(self, text: str) -> np.ndarray:
        """Encode text to embedding"""
        pass

    async def get_health(self) -> Dict[str, Any]:
        """Get health status of the model"""
        return {
            "status": "healthy" if self.is_loaded else "not_loaded",
            "loaded": self.is_loaded,
            "embeddings_count": len(self.image_embeddings),
            "model_info": self.get_model_info(),
        }

    @abstractmethod
    def get_model_info(self) -> str:
        """Get model information string"""
        pass

    async def load_image_embeddings(self):
        """Load pre-computed image embeddings from cache or compute them"""
        if os.path.exists(self.cache_file):
            logger.info(f"📥 Loading cached {self.model_name} embeddings...")
            try:
                with open(self.cache_file, "r") as f:
                    cached_data = json.load(f)
                    # Convert lists back to numpy arrays
                    self.image_embeddings = {
                        k: np.array(v) for k, v in cached_data.items()
                    }
                logger.info(
                    f"✅ Loaded {len(self.image_embeddings)} cached {self.model_name} embeddings"
                )
            except Exception as e:
                logger.error(f"❌ Failed to load cached embeddings: {e}")
                await self.compute_image_embeddings()
        else:
            logger.info(f"🔄 Computing {self.model_name} image embeddings...")
            await self.compute_image_embeddings()

    async def compute_image_embeddings(self):
        """Compute embeddings for all images in test_images folder"""
        if not os.path.exists(settings.IMAGES_PATH):
            logger.warning(f"⚠️ Images path {settings.IMAGES_PATH} does not exist!")
            return

        image_files = [
            f
            for f in os.listdir(settings.IMAGES_PATH)
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".avif", ".webp"))
        ]

        logger.info(
            f"🔄 Found {len(image_files)} images to process with {self.model_name}"
        )

        for image_file in image_files:
            try:
                image_path = os.path.join(settings.IMAGES_PATH, image_file)

                # Load and process image
                image = Image.open(image_path).convert("RGB")

                # Get embedding using the specific model's method
                embedding = await self.encode_image(image)

                # Store embedding
                self.image_embeddings[image_file] = embedding

                logger.debug(f"✅ Processed {image_file} with {self.model_name}")

            except Exception as e:
                logger.warning(
                    f"⚠️ Error processing {image_file} with {self.model_name}: {e}"
                )

        # Save embeddings to cache
        await self.save_embeddings_cache()

        logger.info(
            f"✅ Computed and cached {len(self.image_embeddings)} {self.model_name} embeddings"
        )

    async def save_embeddings_cache(self):
        """Save embeddings to cache file"""
        try:
            cache_data = {k: v.tolist() for k, v in self.image_embeddings.items()}
            with open(self.cache_file, "w") as f:
                json.dump(cache_data, f)
        except Exception as e:
            logger.error(f"❌ Failed to save embeddings cache: {e}")

    async def search(self, query_text: str, top_k: int = 10) -> List[SearchResult]:
        """Search for images similar to query text"""
        if not self.image_embeddings:
            logger.warning(f"⚠️ No embeddings available for {self.model_name}")
            return []

        try:
            # Get text embedding
            text_embedding = await self.encode_text(query_text)

            # Calculate similarities
            similarities = []
            for image_name, image_embedding in self.image_embeddings.items():
                # Cosine similarity (both embeddings should be normalized)
                similarity = np.dot(text_embedding, image_embedding)
                similarities.append(
                    SearchResult(image=image_name, similarity=float(similarity))
                )

            # Sort by similarity (highest first)
            similarities.sort(key=lambda x: x.similarity, reverse=True)

            return similarities[:top_k]

        except Exception as e:
            logger.error(f"❌ Search error with {self.model_name}: {e}")
            return []

    async def get_embeddings(self) -> Dict[str, np.ndarray]:
        """Get all image embeddings"""
        return self.image_embeddings

    async def recompute_embeddings(self):
        """Recompute all embeddings"""
        # Clear existing embeddings
        self.image_embeddings = {}

        # Remove cache file
        if os.path.exists(self.cache_file):
            os.remove(self.cache_file)

        # Recompute
        await self.compute_image_embeddings()

    async def cleanup(self):
        """Cleanup resources"""
        logger.info(f"🧹 Cleaning up {self.model_name} model")
        self.model = None
        self.preprocess = None
        self.tokenizer = None
        self.image_embeddings = {}
        self.is_loaded = False
