"""
Database service for managing images and embeddings with vector similarity search
"""

import numpy as np
from typing import List, Optional, Dict, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, and_, desc
from sqlalchemy.orm import selectinload
from PIL import Image as PILImage
import os
import json
import logging
from datetime import datetime

from core.database import get_async_session, supabase
from core.models import Image, ImageEmbedding, SearchLog

logger = logging.getLogger(__name__)


class DatabaseService:
    """Service for managing images and embeddings in database"""

    @staticmethod
    async def create_image(
        session: AsyncSession,
        filename: str,
        original_path: Optional[str] = None,
        storage_url: Optional[str] = None,
        metadata: Optional[Dict] = None,
    ) -> Image:
        """Create a new image record"""

        # Get image dimensions if path exists
        width, height, format_type = None, None, None
        if original_path and os.path.exists(original_path):
            try:
                with PILImage.open(original_path) as img:
                    width, height = img.size
                    format_type = img.format
            except Exception as e:
                logger.warning(f"Could not read image metadata for {filename}: {e}")

        image = Image(
            filename=filename,
            original_path=original_path,
            storage_url=storage_url,
            width=width,
            height=height,
            format=format_type,
            image_metadata=json.dumps(metadata) if metadata else None,
        )

        session.add(image)
        await session.commit()
        await session.refresh(image)

        logger.info(f"✅ Created image record: {filename}")
        return image

    @staticmethod
    async def get_image_by_filename(
        session: AsyncSession, filename: str
    ) -> Optional[Image]:
        """Get image by filename"""
        result = await session.execute(select(Image).where(Image.filename == filename))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_images(session: AsyncSession) -> List[Image]:
        """Get all images with their embeddings"""
        result = await session.execute(
            select(Image).options(selectinload(Image.embeddings))
        )
        return result.scalars().all()

    @staticmethod
    async def store_embedding(
        session: AsyncSession,
        image_id: str,
        model_name: str,
        embedding: np.ndarray,
        model_version: Optional[str] = None,
    ) -> ImageEmbedding:
        """Store or update an embedding for an image"""

        # Check if embedding already exists
        existing = await session.execute(
            select(ImageEmbedding).where(
                and_(
                    ImageEmbedding.image_id == image_id,
                    ImageEmbedding.model_name == model_name,
                )
            )
        )
        existing_embedding = existing.scalar_one_or_none()

        if existing_embedding:
            # Update existing embedding
            existing_embedding.embedding = embedding.tolist()
            existing_embedding.embedding_dim = len(embedding)
            existing_embedding.model_version = model_version
            await session.commit()
            logger.info(f"🔄 Updated {model_name} embedding for image {image_id}")
            return existing_embedding
        else:
            # Create new embedding
            new_embedding = ImageEmbedding(
                image_id=image_id,
                model_name=model_name,
                model_version=model_version,
                embedding_dim=len(embedding),
                embedding=embedding.tolist(),
            )
            session.add(new_embedding)
            await session.commit()
            await session.refresh(new_embedding)
            logger.info(f"✅ Stored {model_name} embedding for image {image_id}")
            return new_embedding

    @staticmethod
    async def get_embeddings_by_model(
        session: AsyncSession, model_name: str
    ) -> List[ImageEmbedding]:
        """Get all embeddings for a specific model"""
        result = await session.execute(
            select(ImageEmbedding)
            .options(selectinload(ImageEmbedding.image))
            .where(ImageEmbedding.model_name == model_name)
        )
        return result.scalars().all()

    @staticmethod
    async def vector_similarity_search(
        session: AsyncSession,
        query_embedding: np.ndarray,
        model_name: str,
        top_k: int = 10,
        threshold: float = 0.0,
    ) -> List[Tuple[Image, float]]:
        """
        Perform vector similarity search using PostgreSQL arrays (basic implementation)
        Returns list of (Image, similarity_score) tuples

        Note: This uses basic array operations. For production, consider using pgvector extension
        with proper vector types for better performance.
        """

        # Convert numpy array to list for PostgreSQL
        query_vector = query_embedding.tolist()

        # Use a simpler approach with PostgreSQL array functions
        # This calculates dot product as similarity (assuming normalized embeddings)
        query = text(
            """
            WITH similarities AS (
                SELECT 
                    i.id, i.filename, i.storage_url, i.width, i.height, i.format,
                    i.metadata, i.created_at,
                    (
                        SELECT SUM(ie.embedding[i] * :query_embedding[i])
                        FROM generate_series(1, array_length(ie.embedding, 1)) AS i
                    ) as similarity_score
                FROM images i
                JOIN image_embeddings ie ON i.id = ie.image_id
                WHERE ie.model_name = :model_name
            )
            SELECT *
            FROM similarities
            WHERE similarity_score >= :threshold
            ORDER BY similarity_score DESC
            LIMIT :top_k
        """
        )

        try:
            result = await session.execute(
                query,
                {
                    "query_embedding": query_vector,
                    "model_name": model_name,
                    "threshold": threshold,
                    "top_k": top_k,
                },
            )

            results = []
            for row in result:
                # Reconstruct Image object
                image = Image(
                    id=row.id,
                    filename=row.filename,
                    storage_url=row.storage_url,
                    width=row.width,
                    height=row.height,
                    format=row.format,
                    image_metadata=row.image_metadata,
                    created_at=row.created_at,
                )
                similarity = (
                    float(row.similarity_score) if row.similarity_score else 0.0
                )
                results.append((image, similarity))

            return results

        except Exception as e:
            logger.error(
                f"❌ Vector search failed, falling back to Python-based search: {e}"
            )
            # Fallback to Python-based similarity calculation
            return await DatabaseService._python_vector_search(
                session, query_embedding, model_name, top_k, threshold
            )

    @staticmethod
    async def _python_vector_search(
        session: AsyncSession,
        query_embedding: np.ndarray,
        model_name: str,
        top_k: int = 10,
        threshold: float = 0.0,
    ) -> List[Tuple[Image, float]]:
        """
        Fallback Python-based vector similarity search
        """

        # Get all embeddings for the model
        embeddings = await DatabaseService.get_embeddings_by_model(session, model_name)

        similarities = []
        for embedding_obj in embeddings:
            if embedding_obj.image:
                # Calculate cosine similarity
                embedding_vector = np.array(embedding_obj.embedding)
                similarity = np.dot(query_embedding, embedding_vector)

                if similarity >= threshold:
                    similarities.append((embedding_obj.image, float(similarity)))

        # Sort by similarity (highest first) and take top_k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]

    @staticmethod
    async def log_search(
        session: AsyncSession,
        query_text: str,
        model_name: str,
        top_k: int,
        processing_time_ms: Optional[int] = None,
        results_count: Optional[int] = None,
        user_session: Optional[str] = None,
    ) -> SearchLog:
        """Log a search query for analytics"""

        search_log = SearchLog(
            query_text=query_text,
            model_name=model_name,
            top_k=top_k,
            processing_time_ms=processing_time_ms,
            results_count=results_count,
            user_session=user_session,
        )

        session.add(search_log)
        await session.commit()
        return search_log

    @staticmethod
    async def get_search_analytics(session: AsyncSession, limit: int = 100) -> Dict:
        """Get search analytics"""

        # Get recent searches
        recent_searches = await session.execute(
            select(SearchLog).order_by(desc(SearchLog.created_at)).limit(limit)
        )

        # Get model usage stats
        model_stats = await session.execute(
            text(
                """
                SELECT 
                    model_name,
                    COUNT(*) as search_count,
                    AVG(processing_time_ms) as avg_processing_time,
                    AVG(results_count) as avg_results_count
                FROM search_logs 
                WHERE created_at >= NOW() - INTERVAL '7 days'
                GROUP BY model_name
                ORDER BY search_count DESC
            """
            )
        )

        return {
            "recent_searches": [
                {
                    "query": log.query_text,
                    "model": log.model_name,
                    "created_at": log.created_at,
                    "processing_time_ms": log.processing_time_ms,
                }
                for log in recent_searches.scalars()
            ],
            "model_stats": [
                {
                    "model_name": row.model_name,
                    "search_count": row.search_count,
                    "avg_processing_time": (
                        float(row.avg_processing_time)
                        if row.avg_processing_time
                        else None
                    ),
                    "avg_results_count": (
                        float(row.avg_results_count) if row.avg_results_count else None
                    ),
                }
                for row in model_stats
            ],
        }
