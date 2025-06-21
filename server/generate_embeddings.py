#!/usr/bin/env python3
"""
Generate embeddings for all images in the database that don't have embeddings yet
"""

import json
import os
import sys
from pathlib import Path
import asyncio
from PIL import Image as PILImage
import io
import base64

# Add server directory to path
sys.path.append(str(Path(__file__).parent))

from supabase import create_client
from core.database import SUPABASE_URL, SUPABASE_ANON_KEY
from core.config import settings
from models.clip_model import CLIPModelManager
from models.eva02_model import EVA02ModelManager
from models.dfn5b_model import DFN5BModelManager


class EmbeddingGenerator:
    def __init__(self):
        self.supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        self.models = {}

    async def initialize_models(self):
        """Initialize all model managers"""
        print("🤖 Initializing AI models...")

        try:
            # Initialize CLIP
            print("  📎 Loading CLIP model...")
            self.models["clip"] = CLIPModelManager()
            await self.models["clip"].load_model()
            print("  ✅ CLIP model loaded")

            # Initialize EVA02
            print("  🧠 Loading EVA02 model...")
            self.models["eva02"] = EVA02ModelManager()
            await self.models["eva02"].load_model()
            print("  ✅ EVA02 model loaded")

            # Initialize DFN5B
            print("  🔬 Loading DFN5B model...")
            self.models["dfn5b"] = DFN5BModelManager()
            await self.models["dfn5b"].load_model()
            print("  ✅ DFN5B model loaded")

            print("🎉 All models initialized successfully!")
            return True

        except Exception as e:
            print(f"❌ Error initializing models: {e}")
            return False

    def get_images_without_embeddings(self):
        """Get all images that don't have embeddings for all models"""
        print("🔍 Finding images without embeddings...")

        try:
            # Get all images
            images_result = self.supabase.table("images").select("*").execute()
            all_images = {img["id"]: img for img in images_result.data}

            # Get all embeddings
            embeddings_result = (
                self.supabase.table("image_embeddings")
                .select("image_id, model_name")
                .execute()
            )

            # Group embeddings by image_id and model
            image_embeddings = {}
            for emb in embeddings_result.data:
                image_id = emb["image_id"]
                model_name = emb["model_name"]

                if image_id not in image_embeddings:
                    image_embeddings[image_id] = set()
                image_embeddings[image_id].add(model_name)

            # Find images missing embeddings
            missing_embeddings = []
            model_names = ["clip", "eva02", "dfn5b"]

            for image_id, image_data in all_images.items():
                existing_models = image_embeddings.get(image_id, set())
                missing_models = set(model_names) - existing_models

                if missing_models:
                    missing_embeddings.append(
                        {
                            "image_id": image_id,
                            "image_data": image_data,
                            "missing_models": list(missing_models),
                        }
                    )

            print(f"📊 Found {len(missing_embeddings)} images needing embeddings")
            return missing_embeddings

        except Exception as e:
            print(f"❌ Error finding images without embeddings: {e}")
            return []

    async def generate_embedding_for_image(self, image_path, model_name):
        """Generate embedding for a single image using specified model"""
        try:
            model_manager = self.models[model_name]

            # Load and preprocess image
            with PILImage.open(image_path) as img:
                # Convert to RGB if needed
                if img.mode != "RGB":
                    img = img.convert("RGB")

                # Generate embedding using the correct method name
                embedding = await model_manager.encode_image(img)
                return embedding.tolist() if hasattr(embedding, "tolist") else embedding

        except Exception as e:
            print(f"    ❌ Error generating {model_name} embedding: {e}")
            return None

    async def process_image(self, image_info):
        """Generate embeddings for a single image"""
        image_id = image_info["image_id"]
        image_data = image_info["image_data"]
        missing_models = image_info["missing_models"]

        filename = image_data["filename"]
        original_path = image_data["original_path"]

        print(f"🖼️ Processing {filename}...")

        if not os.path.exists(original_path):
            print(f"    ⚠️ Image file not found: {original_path}")
            return

        # Generate embeddings for missing models
        for model_name in missing_models:
            try:
                print(f"    🧠 Generating {model_name} embedding...")

                embedding = await self.generate_embedding_for_image(
                    original_path, model_name
                )

                if embedding is not None:
                    # Store embedding in database
                    embedding_data = {
                        "image_id": image_id,
                        "model_name": model_name,
                        "model_version": f"{model_name}_v1.0",
                        "embedding_dim": len(embedding),
                        "embedding": embedding,
                    }

                    result = (
                        self.supabase.table("image_embeddings")
                        .insert(embedding_data)
                        .execute()
                    )

                    if result.data:
                        print(f"    ✅ Stored {model_name} embedding")
                    else:
                        print(f"    ❌ Failed to store {model_name} embedding")
                else:
                    print(f"    ❌ Failed to generate {model_name} embedding")

            except Exception as e:
                print(f"    ❌ Error with {model_name} embedding: {e}")

    async def generate_all_embeddings(self):
        """Generate embeddings for all images missing them"""
        print("🚀 Starting embedding generation process...")

        # Initialize models
        if not await self.initialize_models():
            return False

        # Get images without embeddings
        missing_images = self.get_images_without_embeddings()

        if not missing_images:
            print("🎉 All images already have embeddings!")
            return True

        print(f"📋 Processing {len(missing_images)} images...")

        # Process images in batches to avoid memory issues
        batch_size = 10
        total_processed = 0

        for i in range(0, len(missing_images), batch_size):
            batch = missing_images[i : i + batch_size]
            print(
                f"\n📦 Processing batch {i//batch_size + 1}/{(len(missing_images) + batch_size - 1)//batch_size}"
            )

            for image_info in batch:
                await self.process_image(image_info)
                total_processed += 1

                if total_processed % 50 == 0:
                    print(
                        f"📊 Progress: {total_processed}/{len(missing_images)} images processed"
                    )

        print(f"\n🎉 Completed embedding generation!")
        print(f"📊 Processed {total_processed} images")

        return True

    def verify_embeddings(self):
        """Verify that embeddings were generated correctly"""
        print("\n🔍 Verifying embedding generation...")

        try:
            # Get all images
            images_result = self.supabase.table("images").select("*").execute()
            total_images = len(images_result.data)

            # Get all embeddings
            embeddings_result = (
                self.supabase.table("image_embeddings").select("*").execute()
            )
            total_embeddings = len(embeddings_result.data)

            print(f"📸 Total images: {total_images}")
            print(f"🧠 Total embeddings: {total_embeddings}")

            # Check by model
            for model in ["clip", "eva02", "dfn5b"]:
                model_result = (
                    self.supabase.table("image_embeddings")
                    .select("*")
                    .eq("model_name", model)
                    .execute()
                )
                model_count = len(model_result.data)
                print(f"   {model.upper()}: {model_count} embeddings")

            # Calculate expected vs actual
            expected_embeddings = total_images * 3  # 3 models per image
            coverage = (
                (total_embeddings / expected_embeddings) * 100
                if expected_embeddings > 0
                else 0
            )

            print(
                f"📊 Coverage: {coverage:.1f}% ({total_embeddings}/{expected_embeddings})"
            )

            return coverage >= 95  # Consider successful if 95%+ coverage

        except Exception as e:
            print(f"❌ Error verifying embeddings: {e}")
            return False


async def main():
    """Main function"""
    print("🧠 Embedding Generation Script")
    print("=" * 40)

    generator = EmbeddingGenerator()

    try:
        success = await generator.generate_all_embeddings()

        if success:
            verification_success = generator.verify_embeddings()
            if verification_success:
                print("\n✅ Embedding generation completed successfully!")
                print("\n🚀 All images now have embeddings and are ready for search!")
            else:
                print(
                    "\n⚠️ Embedding generation completed but verification shows some missing embeddings"
                )
        else:
            print("\n❌ Embedding generation failed")
            return 1

    except KeyboardInterrupt:
        print("\n⏹️ Process interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
