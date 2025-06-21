"""
DFN5B Model Manager
"""

import torch
import numpy as np
from PIL import Image
import open_clip
from models.base_model import BaseModelManager
import logging

logger = logging.getLogger(__name__)


class DFN5BModelManager(BaseModelManager):
    """Manager for Apple DFN5B model"""

    def __init__(self):
        super().__init__(model_name="DFN5B", cache_file="dfn5b_embeddings.json")

    async def load_model(self):
        """Load DFN5B model"""
        try:
            logger.info("📥 Loading DFN5B model (apple/DFN5B-CLIP-ViT-H-14)...")
            self.model, _, self.preprocess = open_clip.create_model_and_transforms(
                "hf-hub:apple/DFN5B-CLIP-ViT-H-14"
            )
            self.tokenizer = open_clip.get_tokenizer("hf-hub:apple/DFN5B-CLIP-ViT-H-14")
            self.model.eval()
            self.is_loaded = True
            logger.info("✅ DFN5B model loaded successfully!")

            # Load embeddings
            await self.load_image_embeddings()

        except Exception as e:
            logger.error(f"❌ Failed to load DFN5B model: {e}")
            raise

    async def encode_image(self, image: Image.Image) -> np.ndarray:
        """Encode image using DFN5B"""
        if not self.is_loaded:
            raise RuntimeError("DFN5B model not loaded")

        try:
            # Process image
            image_input = self.preprocess(image).unsqueeze(0)

            with torch.no_grad():
                image_features = self.model.encode_image(image_input)
                # Normalize features
                image_features /= image_features.norm(dim=-1, keepdim=True)
                embedding = image_features.squeeze().numpy()

            return embedding

        except Exception as e:
            logger.error(f"❌ DFN5B image encoding error: {e}")
            raise

    async def encode_text(self, text: str) -> np.ndarray:
        """Encode text using DFN5B"""
        if not self.is_loaded:
            raise RuntimeError("DFN5B model not loaded")

        try:
            # Process text
            text_input = self.tokenizer([text])

            with torch.no_grad():
                text_features = self.model.encode_text(text_input)
                # Normalize features
                text_features /= text_features.norm(dim=-1, keepdim=True)
                embedding = text_features.squeeze().numpy()

            return embedding

        except Exception as e:
            logger.error(f"❌ DFN5B text encoding error: {e}")
            raise

    def get_model_info(self) -> str:
        """Get DFN5B model information"""
        return "Apple DFN5B-CLIP-ViT-H-14"
