"""
Server configuration settings
"""

from pydantic import BaseModel
from typing import List
import os

class Settings(BaseModel):
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = ["*"]  # In production, specify exact origins
    
    # Model settings
    IMAGES_PATH: str = "../client/public/test_images"
    MODELS_CACHE_DIR: str = "./model_cache"
    EMBEDDINGS_CACHE_DIR: str = "./embeddings_cache"
    
    # Performance settings
    MAX_WORKERS: int = 4
    ENABLE_MODEL_PARALLELISM: bool = True
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Create global settings instance
settings = Settings()

# Ensure directories exist
os.makedirs(settings.MODELS_CACHE_DIR, exist_ok=True)
os.makedirs(settings.EMBEDDINGS_CACHE_DIR, exist_ok=True)
