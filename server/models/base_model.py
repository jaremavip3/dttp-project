"""
Base model manager class for all AI models
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple
import os
import json
import numpy as np
import asyncio
from PIL import Image
import logging
from core.config import settings
from core.database import get_async_session
from core.db_service import DatabaseService
from core.models import Image as DBImage

logger = logging.getLogger(__name__)


class SearchResult:
    def __init__(
        self,
        image: str,
        similarity: float,
        storage_url: str = None,
        metadata: Dict = None,
    ):
        self.image = image
        self.similarity = similarity
        self.storage_url = storage_url
        self.metadata = metadata or {}


class BaseModelManager(ABC):
    """Abstract base class for all model managers"""

    def __init__(self, model_name: str, cache_file: str):
        self.model_name = model_name
        self.cache_file = os.path.join(settings.EMBEDDINGS_CACHE_DIR, cache_file)
        self.model = None
        self.preprocess = None
        self.tokenizer = None
        self.image_embeddings = {}  # Keep for backward compatibility during transition
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
        # Get embedding count from database
        embedding_count = 0
        try:
            async with get_async_session() as session:
                embeddings = await DatabaseService.get_embeddings_by_model(
                    session, self.model_name
                )
                embedding_count = len(embeddings)
        except Exception as e:
            logger.warning(f"Could not get embedding count from database: {e}")
            embedding_count = len(self.image_embeddings)  # Fallback to cache

        return {
            "status": "healthy" if self.is_loaded else "not_loaded",
            "loaded": self.is_loaded,
            "embeddings_count": embedding_count,
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
        """Search for images similar to query text using database"""
        try:
            # Get text embedding
            text_embedding = await self.encode_text(query_text)

            # Try database search first
            try:
                async with get_async_session() as session:
                    results = await DatabaseService.vector_similarity_search(
                        session=session,
                        query_embedding=text_embedding,
                        model_name=self.model_name,
                        top_k=top_k,
                        threshold=0.0,
                    )

                    # Convert database results to SearchResult objects
                    search_results = []
                    for image, similarity in results:
                        metadata = {}
                        if image.image_metadata:
                            try:
                                metadata = json.loads(image.image_metadata)
                            except:
                                pass

                        search_results.append(
                            SearchResult(
                                image=image.filename,
                                similarity=similarity,
                                storage_url=image.storage_url,
                                metadata=metadata,
                            )
                        )

                    return search_results
            except Exception as db_error:
                logger.warning(
                    f"⚠️ Database search failed for {self.model_name}: {db_error}"
                )
                # Try Supabase REST API search
                return await self._supabase_search(query_text, text_embedding, top_k)

        except Exception as e:
            logger.error(f"❌ Search error with {self.model_name}: {e}")
            # Final fallback to file-based search
            return await self._fallback_file_search(query_text, top_k)

    async def _supabase_search(
        self, query_text: str, text_embedding: np.ndarray, top_k: int = 10
    ) -> List[SearchResult]:
        """Search using Supabase REST API with vector similarity"""
        try:
            from core.database import supabase
            import numpy as np

            logger.info(f"🔍 Performing Supabase REST API search for {self.model_name}")

            # Get all embeddings for this model
            embeddings_result = (
                supabase.table("image_embeddings")
                .select("embedding, images(filename, storage_url, image_metadata)")
                .eq("model_name", self.model_name)
                .execute()
            )

            if not embeddings_result.data:
                logger.warning(f"⚠️ No embeddings found for {self.model_name}")
                return []

            # Calculate similarities
            search_results = []
            # Normalize text embedding
            text_embedding = text_embedding / np.linalg.norm(text_embedding)

            for emb_data in embeddings_result.data:
                try:
                    # Get the embedding vector
                    image_embedding = np.array(emb_data["embedding"])
                    # Normalize image embedding
                    image_embedding = image_embedding / np.linalg.norm(image_embedding)

                    # Calculate cosine similarity using dot product (since vectors are normalized)
                    similarity = np.dot(text_embedding, image_embedding)

                    # Get image info
                    image_info = emb_data["images"]

                    # Parse metadata
                    metadata = {}
                    if image_info.get("image_metadata"):
                        try:
                            metadata = json.loads(image_info["image_metadata"])
                        except:
                            pass

                    search_results.append(
                        SearchResult(
                            image=image_info["filename"],
                            similarity=float(similarity),
                            storage_url=image_info.get("storage_url"),
                            metadata=metadata,
                        )
                    )

                except Exception as e:
                    logger.error(f"Error processing embedding: {e}")
                    continue

            # Sort by similarity and return top_k
            search_results.sort(key=lambda x: x.similarity, reverse=True)
            return search_results[:top_k]

        except Exception as e:
            logger.error(f"❌ Supabase search error: {e}")
            return []

    async def _fallback_file_search(
        self, query_text: str, top_k: int = 10
    ) -> List[SearchResult]:
        """Fallback to file-based search if database is unavailable"""
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
            logger.error(f"❌ Fallback search error with {self.model_name}: {e}")
            return []

    async def get_embeddings(self) -> Dict[str, np.ndarray]:
        """Get all image embeddings from database"""
        try:
            async with get_async_session() as session:
                embeddings = await DatabaseService.get_embeddings_by_model(
                    session, self.model_name
                )
                result = {}
                for embedding in embeddings:
                    if embedding.image:
                        result[embedding.image.filename] = np.array(embedding.embedding)
                return result
        except Exception as e:
            logger.error(f"❌ Failed to get embeddings from database: {e}")
            return self.image_embeddings  # Fallback to cache

    async def store_image_embedding(
        self, image_filename: str, embedding: np.ndarray, image_path: str = None
    ) -> bool:
        """Store an image and its embedding in the database"""
        try:
            async with get_async_session() as session:
                # Check if image exists in database
                image = await DatabaseService.get_image_by_filename(
                    session, image_filename
                )

                if not image:
                    # Create new image record
                    image = await DatabaseService.create_image(
                        session=session,
                        filename=image_filename,
                        original_path=image_path,
                        metadata={"processed_by": self.model_name},
                    )

                # Store embedding
                await DatabaseService.store_embedding(
                    session=session,
                    image_id=str(image.id),
                    model_name=self.model_name,
                    embedding=embedding,
                    model_version=self.get_model_info(),
                )

                return True

        except Exception as e:
            logger.error(f"❌ Failed to store embedding in database: {e}")
            return False

    async def process_and_store_image(self, image_path: str) -> bool:
        """Process an image and store its embedding in the database"""
        try:
            # Load and process image
            image = Image.open(image_path).convert("RGB")

            # Get embedding
            embedding = await self.encode_image(image)

            # Store in database
            image_filename = os.path.basename(image_path)
            success = await self.store_image_embedding(
                image_filename, embedding, image_path
            )

            if success:
                logger.info(
                    f"✅ Processed and stored {image_filename} with {self.model_name}"
                )

            return success

        except Exception as e:
            logger.error(f"❌ Failed to process image {image_path}: {e}")
            return False

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
