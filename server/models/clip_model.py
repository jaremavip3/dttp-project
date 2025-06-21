"""
CLIP Model Manager
"""

import torch
import numpy as np
from PIL import Image
from transformers import CLIPModel, CLIPProcessor
from models.base_model import BaseModelManager
import logging

logger = logging.getLogger(__name__)


class CLIPModelManager(BaseModelManager):
    """Manager for OpenAI CLIP model"""

    def __init__(self):
        super().__init__(model_name="clip", cache_file="clip_embeddings.json")
        self.processor = None

    async def load_model(self):
        """Load CLIP model"""
        try:
            logger.info("📥 Loading CLIP model...")
            self.model = CLIPModel.from_pretrained("openai/clip-vit-large-patch14")
            self.processor = CLIPProcessor.from_pretrained(
                "openai/clip-vit-large-patch14"
            )
            self.model.eval()
            self.is_loaded = True
            logger.info("✅ CLIP model loaded successfully!")

            # Load embeddings
            await self.load_image_embeddings()

        except Exception as e:
            logger.error(f"❌ Failed to load CLIP model: {e}")
            raise

    async def encode_image(self, image: Image.Image) -> np.ndarray:
        """Encode image using CLIP"""
        if not self.is_loaded:
            raise RuntimeError("CLIP model not loaded")

        try:
            # Process image
            inputs = self.processor(images=image, return_tensors="pt")

            with torch.no_grad():
                image_features = self.model.get_image_features(**inputs)
                # Normalize features
                image_features = image_features / image_features.norm(
                    dim=-1, keepdim=True
                )
                embedding = image_features.squeeze().numpy()

            return embedding

        except Exception as e:
            logger.error(f"❌ CLIP image encoding error: {e}")
            raise

    async def encode_text(self, text: str) -> np.ndarray:
        """Encode text using CLIP"""
        if not self.is_loaded:
            raise RuntimeError("CLIP model not loaded")

        try:
            # Process text
            inputs = self.processor(text=[text], return_tensors="pt", padding=True)

            with torch.no_grad():
                text_features = self.model.get_text_features(**inputs)
                # Normalize features
                text_features = text_features / text_features.norm(dim=-1, keepdim=True)
                embedding = text_features.squeeze().numpy()

            return embedding

        except Exception as e:
            logger.error(f"❌ CLIP text encoding error: {e}")
            raise

    def get_model_info(self) -> str:
        """Get CLIP model information"""
        return "OpenAI CLIP ViT-Large-Patch14"
