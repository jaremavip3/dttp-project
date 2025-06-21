"""
EVA02 Model Manager
"""

import torch
import numpy as np
from PIL import Image
import open_clip
from models.base_model import BaseModelManager
import logging

logger = logging.getLogger(__name__)


class EVA02ModelManager(BaseModelManager):
    """Manager for EVA02 model"""

    def __init__(self):
        super().__init__(model_name="EVA02", cache_file="eva02_embeddings.json")

    async def load_model(self):
        """Load EVA02 model"""
        try:
            logger.info(
                "📥 Loading EVA02 model (timm/eva02_large_patch14_clip_336.merged2b_s6b_b61k)..."
            )
            self.model, _, self.preprocess = open_clip.create_model_and_transforms(
                "EVA02-L-14-336", pretrained="merged2b_s6b_b61k"
            )
            self.tokenizer = open_clip.get_tokenizer("EVA02-L-14-336")
            self.model.eval()
            self.is_loaded = True
            logger.info("✅ EVA02 model loaded successfully!")

            # Load embeddings
            await self.load_image_embeddings()

        except Exception as e:
            logger.error(f"❌ Failed to load EVA02 model: {e}")
            raise

    async def encode_image(self, image: Image.Image) -> np.ndarray:
        """Encode image using EVA02"""
        if not self.is_loaded:
            raise RuntimeError("EVA02 model not loaded")

        try:
            # Process image
            image_input = self.preprocess(image).unsqueeze(0)

            with torch.no_grad():
                image_features = self.model.encode_image(image_input)
                # Normalize features
                image_features = image_features / image_features.norm(
                    dim=-1, keepdim=True
                )
                embedding = image_features.squeeze().numpy()

            return embedding

        except Exception as e:
            logger.error(f"❌ EVA02 image encoding error: {e}")
            raise

    async def encode_text(self, text: str) -> np.ndarray:
        """Encode text using EVA02"""
        if not self.is_loaded:
            raise RuntimeError("EVA02 model not loaded")

        try:
            # Process text
            text_tokens = self.tokenizer([text])

            with torch.no_grad():
                text_features = self.model.encode_text(text_tokens)
                # Normalize features
                text_features = text_features / text_features.norm(dim=-1, keepdim=True)
                embedding = text_features.squeeze().numpy()

            return embedding

        except Exception as e:
            logger.error(f"❌ EVA02 text encoding error: {e}")
            raise

    def get_model_info(self) -> str:
        """Get EVA02 model information"""
        return "EVA02-L-14-336 (timm/eva02_large_patch14_clip_336.merged2b_s6b_b61k)"
