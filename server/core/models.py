"""
Database models for images and embeddings
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    ForeignKey,
    Index,
    Boolean,
    Numeric,
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from core.database import Base


class Image(Base):
    """Image metadata table"""

    __tablename__ = "images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False, unique=True)
    original_path = Column(String(500), nullable=True)  # Original file path
    storage_url = Column(String(500), nullable=True)  # Supabase storage URL
    file_size = Column(Integer, nullable=True)  # File size in bytes
    width = Column(Integer, nullable=True)  # Image width
    height = Column(Integer, nullable=True)  # Image height
    format = Column(String(50), nullable=True)  # Image format (JPEG, PNG, etc.)
    image_metadata = Column(
        Text, nullable=True
    )  # JSON metadata (renamed to avoid conflict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to embeddings and products
    embeddings = relationship(
        "ImageEmbedding", back_populates="image", cascade="all, delete-orphan"
    )
    products = relationship(
        "Product", back_populates="image", cascade="all, delete-orphan"
    )

    # Index for fast filename lookups
    __table_args__ = (
        Index("idx_images_filename", "filename"),
        Index("idx_images_created_at", "created_at"),
    )


class ImageEmbedding(Base):
    """Image embeddings table with pgvector support"""

    __tablename__ = "image_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_id = Column(
        UUID(as_uuid=True), ForeignKey("images.id", ondelete="CASCADE"), nullable=False
    )
    model_name = Column(String(100), nullable=False)  # 'clip', 'eva02', 'dfn5b'
    model_version = Column(String(200), nullable=True)  # Model version/config info
    embedding_dim = Column(Integer, nullable=False)  # Embedding dimension

    # Store embedding as PostgreSQL array (will use pgvector for similarity search)
    embedding = Column(ARRAY(float), nullable=False)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to image
    image = relationship("Image", back_populates="embeddings")

    # Indexes for fast similarity search and lookups
    __table_args__ = (
        Index("idx_embeddings_image_model", "image_id", "model_name"),
        Index("idx_embeddings_model", "model_name"),
        Index("idx_embeddings_created_at", "created_at"),
        # Unique constraint to prevent duplicate embeddings
        Index("idx_unique_image_model", "image_id", "model_name", unique=True),
    )


class Product(Base):
    """Product information table"""

    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_id = Column(
        UUID(as_uuid=True), ForeignKey("images.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)  # Price with 2 decimal places
    category = Column(String(100), nullable=False)
    subcategory = Column(String(100), nullable=True)
    gender = Column(String(20), nullable=True)  # women, men, unisex
    tags = Column(ARRAY(String), nullable=True)  # Array of tags
    is_on_sale = Column(Boolean, default=False)
    is_new = Column(Boolean, default=False)
    product_metadata = Column(Text, nullable=True)  # JSON metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to image
    image = relationship("Image", back_populates="products")

    # Indexes for fast queries
    __table_args__ = (
        Index("idx_products_category", "category"),
        Index("idx_products_gender", "gender"),
        Index("idx_products_price", "price"),
        Index("idx_products_created_at", "created_at"),
        Index("idx_products_name", "name"),
    )


class SearchLog(Base):
    """Search query logging for analytics"""

    __tablename__ = "search_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query_text = Column(Text, nullable=False)
    model_name = Column(String(100), nullable=False)
    top_k = Column(Integer, nullable=False, default=10)
    processing_time_ms = Column(Integer, nullable=True)
    results_count = Column(Integer, nullable=True)
    user_session = Column(String(255), nullable=True)  # For tracking user sessions
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Indexes for analytics
    __table_args__ = (
        Index("idx_search_logs_model", "model_name"),
        Index("idx_search_logs_created_at", "created_at"),
        Index("idx_search_logs_query", "query_text"),
    )
