# CLIP Search Server
# Requirements: transformers, flask, flask-cors, torch, pillow, numpy

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import numpy as np
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch

app = Flask(__name__)
CORS(app)

# Initialize CLIP model
print("Loading CLIP model...")
model = CLIPModel.from_pretrained("openai/clip-vit-large-patch14")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-large-patch14")
print("CLIP model loaded successfully!")

# Path to images
IMAGES_PATH = "client/public/test_images"
EMBEDDINGS_CACHE_PATH = "image_embeddings.json"

# Global variable to store image embeddings
image_embeddings = {}


def load_image_embeddings():
    """Load pre-computed image embeddings from cache or compute them"""
    global image_embeddings

    if os.path.exists(EMBEDDINGS_CACHE_PATH):
        print("Loading cached image embeddings...")
        with open(EMBEDDINGS_CACHE_PATH, "r") as f:
            cached_data = json.load(f)
            # Convert lists back to numpy arrays
            image_embeddings = {k: np.array(v) for k, v in cached_data.items()}
        print(f"Loaded {len(image_embeddings)} cached embeddings")
    else:
        print("Computing image embeddings...")
        compute_image_embeddings()


def compute_image_embeddings():
    """Compute embeddings for all images in test_images folder"""
    global image_embeddings

    if not os.path.exists(IMAGES_PATH):
        print(f"Images path {IMAGES_PATH} does not exist!")
        return

    image_files = [
        f
        for f in os.listdir(IMAGES_PATH)
        if f.lower().endswith((".png", ".jpg", ".jpeg", ".avif", ".webp"))
    ]

    print(f"Found {len(image_files)} images to process")

    for image_file in image_files:
        try:
            image_path = os.path.join(IMAGES_PATH, image_file)

            # Load and process image
            image = Image.open(image_path).convert("RGB")

            # Process image with CLIP
            inputs = processor(images=image, return_tensors="pt")

            with torch.no_grad():
                image_features = model.get_image_features(**inputs)
                # Normalize features
                image_features = image_features / image_features.norm(
                    dim=-1, keepdim=True
                )
                embedding = image_features.squeeze().numpy()

            # Store embedding
            image_embeddings[image_file] = embedding

            print(f"Processed: {image_file}")

        except Exception as e:
            print(f"Error processing {image_file}: {e}")

    # Save embeddings to cache
    cache_data = {k: v.tolist() for k, v in image_embeddings.items()}
    with open(EMBEDDINGS_CACHE_PATH, "w") as f:
        json.dump(cache_data, f)

    print(f"Computed and cached {len(image_embeddings)} image embeddings")


def search_images(query_text, top_k=10):
    """Search for images similar to query text"""
    if not image_embeddings:
        return []

    # Get text embedding
    inputs = processor(text=[query_text], return_tensors="pt", padding=True)

    with torch.no_grad():
        text_features = model.get_text_features(**inputs)
        # Normalize features
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        text_embedding = text_features.squeeze().numpy()

    # Calculate similarities
    similarities = []
    for image_name, image_embedding in image_embeddings.items():
        similarity = np.dot(text_embedding, image_embedding)
        similarities.append({"image": image_name, "similarity": float(similarity)})

    # Sort by similarity (highest first)
    similarities.sort(key=lambda x: x["similarity"], reverse=True)

    return similarities[:top_k]


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify(
        {
            "status": "healthy",
            "model_loaded": model is not None,
            "embeddings_count": len(image_embeddings),
        }
    )


@app.route("/search", methods=["POST"])
def search():
    """Search endpoint for text-to-image similarity"""
    try:
        data = request.get_json()

        if not data or "query" not in data:
            return jsonify({"error": "Query text is required"}), 400

        query_text = data["query"].strip()
        top_k = data.get("top_k", 10)

        if not query_text:
            return jsonify({"error": "Query text cannot be empty"}), 400

        # Search for similar images
        results = search_images(query_text, top_k)

        return jsonify(
            {
                "query": query_text,
                "results": results,
                "total_images": len(image_embeddings),
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/recompute", methods=["POST"])
def recompute_embeddings():
    """Recompute image embeddings (useful if images are updated)"""
    try:
        # Remove cache file
        if os.path.exists(EMBEDDINGS_CACHE_PATH):
            os.remove(EMBEDDINGS_CACHE_PATH)

        # Recompute embeddings
        compute_image_embeddings()

        return jsonify(
            {
                "message": "Embeddings recomputed successfully",
                "embeddings_count": len(image_embeddings),
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Load or compute image embeddings on startup
    load_image_embeddings()

    # Start server
    print("Starting CLIP search server on http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=True)
