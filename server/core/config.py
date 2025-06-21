"""
Server configuration settings
"""

from pydantic import BaseModel
from typing import List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings(BaseModel):
    # Server settings
    HOST: str = os.getenv("SERVER_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("SERVER_PORT", "5000"))

    # CORS settings
    ALLOWED_ORIGINS: List[str] = os.getenv("ALLOWED_ORIGINS", "*").split(",")

    # Model settings
    IMAGES_PATH: str = os.getenv("IMAGES_PATH", "../client/public/test_images")
    MODELS_CACHE_DIR: str = os.getenv("MODELS_CACHE_DIR", "./model_cache")
    EMBEDDINGS_CACHE_DIR: str = os.getenv("EMBEDDINGS_CACHE_DIR", "./embeddings_cache")

    # Performance settings
    MAX_WORKERS: int = int(os.getenv("MAX_WORKERS", "4"))
    ENABLE_MODEL_PARALLELISM: bool = (
        os.getenv("ENABLE_MODEL_PARALLELISM", "true").lower() == "true"
    )

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


# Create global settings instance
settings = Settings()

# Ensure directories exist
os.makedirs(settings.MODELS_CACHE_DIR, exist_ok=True)
os.makedirs(settings.EMBEDDINGS_CACHE_DIR, exist_ok=True)
