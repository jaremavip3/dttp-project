// ВИПРАВЛЕНИЙ clipService.js - додайте ngrok header до всіх fetch запитів

// AI Search Service for the unified multi-model server
// Enhanced with Next.js native caching strategies
import { CacheManager, CACHE_TYPES } from "@/utils/cache";

const UNIFIED_SERVER_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Available AI models (all served from unified server)
export const AI_MODELS = {
  CLIP: {
    name: "CLIP",
    url: UNIFIED_SERVER_URL,
    endpoint: "/search/clip",
    description: "OpenAI CLIP - General purpose vision-language model",
  },
  EVA02: {
    name: "EVA02",
    url: UNIFIED_SERVER_URL,
    endpoint: "/search/eva02",
    description: "timm/eva02_large_patch14_clip_336.merged2b_s6b_b61k",
  },
};

class ClipService {
  /**
   * Search for products using selected AI model with Next.js caching
   */
  static async searchImages(query, model = "CLIP", topK = 10, useClientCache = true) {
    const modelConfig = AI_MODELS[model];
    if (!modelConfig) {
      throw new Error(`Unknown model: ${model}. Available models: ${Object.keys(AI_MODELS).join(", ")}`);
    }

    const cacheKey = CacheManager.generateSearchKey(query, model, { topK });

    if (useClientCache && CacheManager.isAvailable()) {
      const cached = CacheManager.get(CACHE_TYPES.SEARCH_RESULTS, cacheKey);
      if (cached) {
        return {
          ...cached,
          fromCache: true,
          cacheType: "client",
        };
      }
    }

    try {
      // ✅ ДОДАЙТЕ NGROK HEADER
      const response = await fetch(`${modelConfig.url}${modelConfig.endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true", // 🔥 КЛЮЧОВЕ ВИПРАВЛЕННЯ
        },
        body: JSON.stringify({
          query: query,
          top_k: topK,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const result = {
        ...data,
        model: model,
        fromCache: false,
        cacheType: "none",
      };

      if (useClientCache && CacheManager.isAvailable()) {
        CacheManager.set(CACHE_TYPES.SEARCH_RESULTS, result, cacheKey);
      }

      return result;
    } catch (error) {
      console.error(`Error searching with ${model}:`, error);
      throw error;
    }
  }

  /**
   * Check server health for a specific model
   */
  static async checkServerHealth(model = "CLIP") {
    const modelConfig = AI_MODELS[model];
    if (!modelConfig) {
      throw new Error(`Unknown model: ${model}`);
    }

    try {
      // ✅ ДОДАЙТЕ NGROK HEADER
      const response = await fetch(`${modelConfig.url}/health/${model.toLowerCase()}`, {
        headers: {
          "ngrok-skip-browser-warning": "true", // 🔥 КЛЮЧОВЕ ВИПРАВЛЕННЯ
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error checking ${model} server health:`, error);
      throw error;
    }
  }

  /**
   * Get all server health statuses
   */
  static async getAllHealthStatuses() {
    try {
      // ✅ ДОДАЙТЕ NGROK HEADER
      const response = await fetch(`${UNIFIED_SERVER_URL}/health`, {
        headers: {
          "ngrok-skip-browser-warning": "true", // 🔥 КЛЮЧОВЕ ВИПРАВЛЕННЯ
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const modelHealth = {};

      if (data.models && Array.isArray(data.models)) {
        data.models.forEach((model) => {
          let clientModelName;
          switch (model.name.toLowerCase()) {
            case "clip":
              clientModelName = "CLIP";
              break;
            case "eva02":
              clientModelName = "EVA02";
              break;
            default:
              clientModelName = model.name.toUpperCase();
          }

          modelHealth[clientModelName] = {
            name: clientModelName,
            status: model.status,
            loaded: model.loaded,
            embeddings_count: model.embeddings_count,
            model_info: model.model_info,
            error: model.status !== "healthy" ? `Model ${model.status}` : null,
          };
        });
      }

      return modelHealth;
    } catch (error) {
      console.error("Error checking overall server health:", error);
      throw error;
    }
  }

  /**
   * Search for products using selected AI model and return formatted results
   */
  static async searchProductsV2(query, model = "CLIP", topK = 10, useClientCache = true) {
    const cacheKey = CacheManager.generateSearchKey(query, model, { topK });

    if (useClientCache && CacheManager.isAvailable()) {
      const cached = CacheManager.get(CACHE_TYPES.SEARCH_RESULTS, cacheKey);
      if (cached) {
        return {
          ...cached,
          fromCache: true,
          cacheType: "client",
        };
      }
    }

    try {
      const serverModel = model.toLowerCase();

      // ✅ ДОДАЙТЕ NGROK HEADER
      const response = await fetch(`${UNIFIED_SERVER_URL}/search-products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true", // 🔥 КЛЮЧОВЕ ВИПРАВЛЕННЯ
        },
        body: JSON.stringify({
          query: query,
          model: serverModel,
          top_k: topK,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const products =
        data.products?.map((product) => ({
          id: product.id || product.filename,
          name: product.name || product.filename?.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          image: product.image_url || product.image,
          similarity: product.similarity_score || product.similarity || product.score,
          category: product.category,
          tags: product.tags || [],
          price: product.price || Math.round((Math.random() * 50 + 20) * 100) / 100,
          description: product.description || `${product.category || "Product"} item`,
        })) || [];

      const result = {
        query: data.query,
        products: products,
        totalImages: data.total_results,
        model: model,
        modelInfo: data.model || AI_MODELS[model].name,
        fromCache: false,
        cacheType: "server",
      };

      if (useClientCache && CacheManager.isAvailable()) {
        CacheManager.set(CACHE_TYPES.SEARCH_RESULTS, result, cacheKey);
      }

      return result;
    } catch (error) {
      console.error(`Error searching products with ${model}:`, error);
      throw error;
    }
  }

  /**
   * Search for products using selected AI model (legacy method)
   */
  static async searchProducts(query, products, model = "CLIP", topK = 10) {
    return this.searchProductsV2(query, model, topK, true);
  }

  /**
   * Upload an image to the server and generate embeddings
   */
  static async uploadImage(imageFile, models = ["CLIP"]) {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("models", JSON.stringify(models));

      // ✅ ДОДАЙТЕ NGROK HEADER (для FormData немає Content-Type)
      const response = await fetch(`${UNIFIED_SERVER_URL}/upload-image`, {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true", // 🔥 КЛЮЧОВЕ ВИПРАВЛЕННЯ
        },
        body: formData,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  /**
   * Get available images from the server
   */
  static async getImages() {
    try {
      // ✅ ДОДАЙТЕ NGROK HEADER
      const response = await fetch(`${UNIFIED_SERVER_URL}/images`, {
        headers: {
          "ngrok-skip-browser-warning": "true", // 🔥 КЛЮЧОВЕ ВИПРАВЛЕННЯ
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.images || [];
    } catch (error) {
      console.error("Error getting images:", error);
      return [];
    }
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats() {
    try {
      // ✅ ДОДАЙТЕ NGROK HEADER
      const response = await fetch(`${UNIFIED_SERVER_URL}/stats`, {
        headers: {
          "ngrok-skip-browser-warning": "true", // 🔥 КЛЮЧОВЕ ВИПРАВЛЕННЯ
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting database stats:", error);
      return { total_images: 0, total_embeddings: 0 };
    }
  }

  /**
   * Generate embeddings for all models
   */
  static async generateEmbeddings() {
    try {
      // ✅ ДОДАЙТЕ NGROK HEADER
      const response = await fetch(`${UNIFIED_SERVER_URL}/generate-embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true", // 🔥 КЛЮЧОВЕ ВИПРАВЛЕННЯ
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error generating embeddings:`, error);
      throw error;
    }
  }

  /**
   * Revalidate cache tags (for use in Server Actions)
   */
  static async revalidateCacheTags(tags) {
    if (typeof window === "undefined") {
      const { revalidateTag } = await import("next/cache");
      tags.forEach((tag) => revalidateTag(tag));
    }
  }
}

export default ClipService;
