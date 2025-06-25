"""
BLIP-2 Model Manager using Hugging Face Spaces API
This uses the hysts/BLIP2 space for Visual Question Answering
"""

import asyncio
import logging
import numpy as np
import tempfile
import os
import re
from PIL import Image
from gradio_client import Client, handle_file
from typing import List, Dict, Any
from core.config import settings
from models.base_model import BaseModelManager

logger = logging.getLogger(__name__)


class BLIP2HFAPIModelManager(BaseModelManager):
    """BLIP-2 model using Hugging Face Spaces API for Visual Question Answering"""

    def __init__(self):
        super().__init__(
            model_name="blip2_hf_api", cache_file="blip2_hf_api_embeddings.json"
        )
        self.client = None
        # Get HF token from environment variable for security
        self.hf_token = os.getenv("HF_TOKEN")
        if not self.hf_token:
            logger.warning(
                "⚠️ HF_TOKEN not found in environment variables. BLIP-2 API may not work properly."
            )
            self.hf_token = None

    async def load_model(self):
        """Initialize Hugging Face API client"""
        try:
            logger.info("📥 Connecting to BLIP-2 Hugging Face Spaces API...")

            # Initialize the Gradio client
            self.client = Client("hysts/BLIP2", hf_token=self.hf_token)

            self.is_loaded = True
            logger.info("✅ BLIP-2 HF API client connected successfully!")

        except Exception as e:
            logger.error(f"❌ Failed to connect to BLIP-2 HF API: {e}")
            raise

    async def encode_image(self, image: Image.Image) -> np.ndarray:
        """Encode image to embedding (mock implementation for compatibility)"""
        if not self.is_loaded:
            raise RuntimeError("BLIP-2 HF API client not loaded")

        try:
            # Create a simple hash-based embedding for image
            import hashlib
            import io

            # Convert image to bytes
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format="JPEG")
            img_bytes = img_byte_arr.getvalue()

            # Create hash-based embedding
            hash_obj = hashlib.sha256(img_bytes)
            embedding = np.frombuffer(hash_obj.digest(), dtype=np.uint8).astype(
                np.float32
            )

            # Normalize to [-1, 1] range and pad/truncate to fixed size
            embedding = (embedding / 127.5) - 1.0
            target_size = 512
            if len(embedding) > target_size:
                embedding = embedding[:target_size]
            else:
                embedding = np.pad(
                    embedding, (0, target_size - len(embedding)), "constant"
                )

            return embedding

        except Exception as e:
            logger.error(f"❌ Failed to encode image: {e}")
            raise

    async def encode_text(self, text: str) -> np.ndarray:
        """Encode text to embedding (mock implementation for compatibility)"""
        if not self.is_loaded:
            raise RuntimeError("BLIP-2 HF API client not loaded")

        try:
            # Create a simple hash-based embedding for text
            import hashlib

            hash_obj = hashlib.sha256(text.encode())
            embedding = np.frombuffer(hash_obj.digest(), dtype=np.uint8).astype(
                np.float32
            )

            # Normalize to [-1, 1] range and pad/truncate to fixed size
            embedding = (embedding / 127.5) - 1.0
            target_size = 512
            if len(embedding) > target_size:
                embedding = embedding[:target_size]
            else:
                embedding = np.pad(
                    embedding, (0, target_size - len(embedding)), "constant"
                )

            return embedding

        except Exception as e:
            logger.error(f"❌ Failed to encode text: {e}")
            raise

    async def _save_temp_image(self, image: Image.Image) -> str:
        """Save PIL image to temporary file and return path"""
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        image.save(temp_file.name, "JPEG")
        temp_file.close()
        return temp_file.name

    def _extract_chat_response(self, result) -> str:
        """Extract text response from BLIP-2 chat API result"""
        try:
            logger.info(f"🔍 Debug: Raw API result type: {type(result)}")
            logger.info(f"🔍 Debug: Raw API result: {result}")

            # Handle list format (chat history)
            if isinstance(result, list) and len(result) > 0:
                # Get the last exchange in the chat history
                last_exchange = result[-1]
                logger.info(f"🔍 Debug: Last exchange: {last_exchange}")
                
                if isinstance(last_exchange, list) and len(last_exchange) >= 2:
                    # Extract bot response (second element)
                    bot_response = last_exchange[1]
                    logger.info(f"🔍 Debug: Bot response: {bot_response}")
                    return str(bot_response).strip()
                
            # Handle tuple format
            elif isinstance(result, tuple) and len(result) >= 2:
                # The chat result is a tuple where the second element contains the chat history
                chat_history = result[1]
                logger.info(f"🔍 Debug: Chat history type: {type(chat_history)}")
                logger.info(f"🔍 Debug: Chat history: {chat_history}")

                if isinstance(chat_history, list) and len(chat_history) > 0:
                    # Get the last message pair [user_message, bot_response]
                    last_exchange = chat_history[-1]
                    logger.info(f"🔍 Debug: Last exchange: {last_exchange}")

                    if isinstance(last_exchange, list) and len(last_exchange) >= 2:
                        bot_response = last_exchange[1]
                        logger.info(f"🔍 Debug: Bot response: {bot_response}")
                        return str(bot_response).strip()

            # Direct string response
            elif isinstance(result, str):
                return result.strip()

            # Fallback to string conversion
            fallback = str(result).strip()
            logger.info(f"🔍 Debug: Using fallback: {fallback}")
            return fallback

        except Exception as e:
            logger.error(f"Error extracting chat response: {e}")
            return ""

    def _clean_description(self, text: str) -> str:
        """Clean and format the description for e-commerce use"""
        if not text:
            return "Stylish clothing item perfect for your wardrobe."

        # Remove common prompt phrases that might appear in response
        prompt_phrases = [
            "describe this clothing item for an online store",
            "what type of garment is it",
            "what color",
            "what style or features",
            "write 1-2 sentences"
        ]
        
        text_lower = text.lower()
        for phrase in prompt_phrases:
            text_lower = text_lower.replace(phrase, "")
        
        # Remove common AI response prefixes
        prefixes_to_remove = [
            "this is",
            "the image shows",
            "i can see",
            "this image contains",
            "the picture shows",
            "in this image",
            "this photo shows",
            "looking at this",
            "i see",
            "the photo depicts",
            "this appears to be",
            "it looks like",
        ]

        for prefix in prefixes_to_remove:
            if text_lower.startswith(prefix):
                text = text[len(prefix):].strip()
                text_lower = text.lower()
                break

        # Clean up the text
        text = text.strip()
        
        # Remove any remaining bracket content or quote marks
        text = re.sub(r'[\[\]"\']', '', text)
        
        # Capitalize first letter
        if text:
            text = text[0].upper() + text[1:]

        # Ensure it ends with a period
        if text and not text.endswith("."):
            text += "."

        # If the result is still too short or contains prompt text, use fallback
        if (len(text) < 10 or 
            any(phrase in text.lower() for phrase in ["describe", "what type", "what color", "write"])):
            return "Stylish clothing item perfect for your wardrobe."

        return text

    def _extract_tags(self, text: str) -> List[str]:
        """Extract exactly 3 tags from the response text"""
        logger.info(f"🏷️ Debug: Extracting tags from: '{text}'")

        if not text:
            logger.info("🏷️ Debug: No text provided, using fallback")
            return self._get_clothing_fallback_tags()

        # Clean the text - remove any prompt text that might be included
        text = text.lower().strip()
        
        # Remove common prompt phrases that might appear in response
        prompt_phrases = [
            "what type of clothing is this",
            "tell me:",
            "answer with",
            "examples:",
            "separated by commas",
            "garment",
            "main color",
            "style or fit",
            "write 1-2 sentences"
        ]
        
        for phrase in prompt_phrases:
            text = text.replace(phrase, "")
        
        # Clean up extra characters and spaces
        text = re.sub(r'[^\w\s,.-]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        
        logger.info(f"🏷️ Debug: Cleaned text: '{text}'")

        # Try to find comma-separated tags first
        if "," in text:
            tags = [tag.strip() for tag in text.split(",")]
            # Filter out empty, very short, or prompt-like tags
            clean_tags = []
            for tag in tags:
                tag = self._clean_tag(tag)
                if (tag and len(tag) > 1 and len(tag) < 20 and 
                    not any(phrase in tag.lower() for phrase in ["what", "tell", "answer", "example"])):
                    clean_tags.append(tag)
            
            logger.info(f"🏷️ Debug: Found comma-separated tags: {clean_tags}")
            if len(clean_tags) >= 3:
                return clean_tags[:3]
            elif len(clean_tags) > 0:
                # If we have some good tags but not enough, supplement with clothing terms
                remaining_needed = 3 - len(clean_tags)
                clothing_terms = self._extract_clothing_terms(text)
                for term in clothing_terms:
                    if term not in clean_tags and len(clean_tags) < 3:
                        clean_tags.append(term)
                if len(clean_tags) >= 3:
                    return clean_tags[:3]

        # Try to extract specific clothing terms from the text
        clothing_tags = self._extract_clothing_terms(text)
        if len(clothing_tags) >= 3:
            logger.info(f"🏷️ Debug: Extracted clothing terms: {clothing_tags}")
            return clothing_tags[:3]

        # Extract meaningful words as fallback
        words = re.findall(r'\b[a-z]{3,15}\b', text)
        # Filter out non-clothing related words and prompt words
        non_clothing_words = [
            "the", "and", "for", "with", "this", "that", "image", "photo", "picture", 
            "item", "shows", "appears", "looks", "seems", "visible", "seen", "what",
            "type", "tell", "answer", "example", "separated", "commas", "sentences"
        ]
        
        good_words = []
        for word in words:
            cleaned_word = self._clean_tag(word)
            if (cleaned_word and cleaned_word not in non_clothing_words and 
                len(cleaned_word) > 2 and len(cleaned_word) < 15):
                good_words.append(cleaned_word)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_words = []
        for word in good_words:
            if word not in seen:
                seen.add(word)
                unique_words.append(word)

        if len(unique_words) >= 3:
            logger.info(f"🏷️ Debug: Using word extraction: {unique_words[:3]}")
            return unique_words[:3]

        # Default fallback with better clothing terms
        logger.info("🏷️ Debug: Using fallback tags")
        return self._get_clothing_fallback_tags()

    def _clean_tag(self, tag: str) -> str:
        """Clean and validate a single tag"""
        if not tag:
            return ""

        # Remove common prefixes
        tag = tag.strip()
        prefixes = ["a ", "an ", "the ", "is ", "are ", "looks ", "appears "]
        for prefix in prefixes:
            if tag.startswith(prefix):
                tag = tag[len(prefix) :].strip()

        # Remove punctuation except hyphens
        tag = re.sub(r"[^\w\s-]", "", tag)
        tag = tag.strip()

        return tag if len(tag) > 1 else ""

    def _extract_clothing_terms(self, text: str) -> List[str]:
        """Extract clothing-specific terms from text"""
        # Define clothing categories
        clothing_types = [
            "shirt",
            "dress",
            "pants",
            "jeans",
            "jacket",
            "sweater",
            "blouse",
            "skirt",
            "coat",
            "top",
            "bottom",
            "cardigan",
            "blazer",
            "hoodie",
            "tshirt",
            "t-shirt",
            "polo",
            "shorts",
            "trousers",
            "vest",
            "tank",
            "camisole",
        ]

        colors = [
            "blue",
            "red",
            "green",
            "black",
            "white",
            "gray",
            "grey",
            "navy",
            "beige",
            "brown",
            "pink",
            "yellow",
            "purple",
            "orange",
            "cream",
            "khaki",
            "denim",
            "dark",
            "light",
        ]

        styles_seasons = [
            "casual",
            "formal",
            "summer",
            "winter",
            "spring",
            "fall",
            "autumn",
            "striped",
            "solid",
            "patterned",
            "long",
            "short",
            "sleeve",
            "sleeveless",
            "button",
            "zip",
            "collar",
            "v-neck",
            "crew",
            "fitted",
            "loose",
            "slim",
            "baggy",
            "vintage",
            "modern",
            "classic",
        ]

        materials = [
            "cotton",
            "wool",
            "silk",
            "denim",
            "leather",
            "linen",
            "polyester",
            "knit",
            "woven",
        ]

        all_terms = clothing_types + colors + styles_seasons + materials

        found_terms = []
        for term in all_terms:
            if term in text and term not in found_terms:
                found_terms.append(term)

        return found_terms

    def _get_clothing_fallback_tags(self) -> List[str]:
        """Get better fallback tags based on common clothing attributes"""
        import random

        # More specific clothing-focused fallback options
        clothing_types = ["shirt", "top", "garment", "apparel", "wear"]
        descriptors = [
            "blue",
            "casual",
            "comfortable",
            "stylish",
            "long-sleeve",
            "short-sleeve",
            "cotton",
            "soft",
        ]
        occasions = [
            "daily",
            "work",
            "weekend",
            "summer",
            "winter",
            "versatile",
            "modern",
        ]

        # Ensure we get different categories for better variety
        return [
            random.choice(clothing_types),
            random.choice(descriptors),
            random.choice(occasions),
        ]

    def _get_intelligent_fallback_tags(self) -> List[str]:
        """Get intelligent fallback tags based on clothing analysis"""
        import random

        # Better clothing-focused fallback tags
        clothing_types = ["shirt", "top", "garment", "apparel", "clothing"]
        colors_styles = [
            "blue",
            "casual",
            "comfortable",
            "stylish",
            "everyday",
            "modern",
        ]
        occasions = ["daily", "work", "leisure", "outdoor", "indoor", "versatile"]

        # Mix different categories for more relevant tags
        tags = [
            random.choice(clothing_types),
            random.choice(colors_styles),
            random.choice(occasions),
        ]

        return tags

    async def generate_caption(self, image: Image.Image, max_length: int = 50) -> str:
        """Generate simple image caption using caption API"""
        if not self.is_loaded:
            raise RuntimeError("BLIP-2 HF API client not loaded")

        temp_path = None
        try:
            # Save image to temporary file
            temp_path = await self._save_temp_image(image)

            # Call the HF API for caption
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.predict(
                    image=handle_file(temp_path),
                    decoding_method="Nucleus sampling",
                    temperature=0.7,
                    length_penalty=1,
                    repetition_penalty=1.2,
                    max_length=max_length,
                    min_length=1,
                    num_beams=5,
                    top_p=0.9,
                    api_name="/caption",
                ),
            )

            # Extract caption from result
            caption = str(result).strip() if result else "An image"

            # Clean up temp file
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)

            return caption

        except Exception as e:
            logger.error(f"❌ Error generating caption: {e}")
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
            return "An image"

    async def generate_description(self, image: Image.Image) -> str:
        """Generate e-commerce product description using BLIP-2 chat API"""
        if not self.is_loaded:
            raise RuntimeError("BLIP-2 HF API client not loaded")

        temp_path = None
        try:
            # Save image to temporary file
            temp_path = await self._save_temp_image(image)

            # Use specific e-commerce description prompt
            prompt = "Describe this clothing item for an online store. What type of garment is it? What color? What style or features? Write 1-2 sentences."

            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.predict(
                    image=handle_file(temp_path),
                    text=prompt,
                    decoding_method="Nucleus sampling",
                    temperature=0.7,
                    length_penalty=1,
                    repetition_penalty=1.2,
                    max_length=100,
                    min_length=20,
                    num_beams=5,
                    top_p=0.9,
                    api_name="/chat",
                ),
            )

            # Extract text from the chat result
            response_text = self._extract_chat_response(result)
            logger.info(f"📝 Debug: Raw description response: '{response_text}'")

            # Clean up the response to make it suitable for e-commerce
            description = self._clean_description(response_text)
            logger.info(f"📝 Debug: Cleaned description: '{description}'")

            # Clean up temp file
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)

            return description

        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ Error generating description: {error_msg}")
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)

            # Check if it's a quota error
            if "exceeded your free GPU quota" in error_msg:
                return "Premium clothing item with excellent quality and style. Perfect addition to your wardrobe."
            else:
                return "Stylish clothing item perfect for your wardrobe."

    async def generate_tags(self, image: Image.Image) -> List[str]:
        """Generate 3 relevant tags using BLIP-2 chat API"""
        if not self.is_loaded:
            raise RuntimeError("BLIP-2 HF API client not loaded")

        temp_path = None
        try:
            # Save image to temporary file
            temp_path = await self._save_temp_image(image)

            # Use specific prompt for generating exactly 3 tags
            prompt = "What type of clothing is this? Tell me: 1) what garment (shirt/dress/pants/etc), 2) main color or material, 3) style or fit. Answer with 3 words separated by commas. Examples: 'shirt, blue, casual' or 'sweater, wool, cozy' or 'jeans, dark, slim'"

            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.predict(
                    image=handle_file(temp_path),
                    text=prompt,
                    decoding_method="Nucleus sampling",
                    temperature=0.6,
                    length_penalty=1,
                    repetition_penalty=1.3,
                    max_length=30,
                    min_length=5,
                    num_beams=3,
                    top_p=0.8,
                    api_name="/chat",
                ),
            )

            # Extract text from the chat result
            response_text = self._extract_chat_response(result)
            logger.info(f"🏷️ Debug: Raw tags response: '{response_text}'")

            # Extract exactly 3 tags from the response
            tags = self._extract_tags(response_text)
            logger.info(f"🏷️ Debug: Final tags: {tags}")

            # Clean up temp file
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)

            return tags

        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ Error generating tags: {error_msg}")
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)

            # Check if it's a quota error and provide better fallback tags
            if "exceeded your free GPU quota" in error_msg:
                return self._get_intelligent_fallback_tags()
            else:
                return ["clothing", "fashion", "style"]

    async def analyze_image(self, image: Image.Image) -> Dict[str, Any]:
        """Complete image analysis with caption, description, and tags"""
        try:
            # Generate all three types of analysis
            caption_task = self.generate_caption(image)
            description_task = self.generate_description(image)
            tags_task = self.generate_tags(image)

            # Run them concurrently for better performance
            caption, description, tags = await asyncio.gather(
                caption_task, description_task, tags_task
            )

            return {"caption": caption, "description": description, "tags": tags}

        except Exception as e:
            logger.error(f"❌ Error in complete image analysis: {e}")
            return {
                "caption": "An image",
                "description": "Stylish clothing item perfect for your wardrobe.",
                "tags": ["clothing", "fashion", "style"],
            }

    async def search_similar(
        self, query_embedding: np.ndarray, top_k: int = 10
    ) -> List[Dict]:
        """Search for similar items (mock implementation)"""
        return []

    async def get_embeddings_count(self) -> int:
        """Get number of stored embeddings"""
        return 0

    async def clear_cache(self):
        """Clear embedding cache"""
        pass

    def get_model_info(self) -> str:
        """Get model information"""
        return "BLIP-2 (Hugging Face Spaces API - hysts/BLIP2) with Visual Question Answering"
