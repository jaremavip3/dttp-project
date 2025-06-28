// AI Search Service for the unified multi-model server
// Enhanced with Next.js native caching strategies
import { CacheManager, CACHE_TYPES } from "@/utils/cache";
import clientClipService from "./clientClipService";

const UNIFIED_SERVER_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Available AI models (all served from unified server)
export const AI_MODELS = {
  "CLIENT-CLIP": {
    name: "CLIENT-CLIP",
    url: "local",
    endpoint: "/client-side",
    description: "CLIP-Base running locally in browser (Xenova/clip-vit-base-patch16)",
    isClientSide: true,
  },
  CLIP: {
    name: "CLIP",
    url: UNIFIED_SERVER_URL,
    endpoint: "/search/clip",
    description: "OpenAI CLIP - General purpose vision-language model",
    isClientSide: false,
  },
  EVA02: {
    name: "EVA02",
    url: UNIFIED_SERVER_URL,
    endpoint: "/search/eva02",
    description: "timm/eva02_large_patch14_clip_336.merged2b_s6b_b61k",
    isClientSide: false,
  },
  DFN5B: {
    name: "DFN5B",
    url: UNIFIED_SERVER_URL,
    endpoint: "/search/dfn5b",
    description: "DFN5B-CLIP ViT-H-14 by Apple",
    isClientSide: false,
  },
};

class ClipService {
  /**
   * Search for products using selected AI model with Next.js caching
   * @param {string} query - The search query text
   * @param {string} model - The model to use (e.g., 'CLIP', 'EVA02', 'DFN5B')
   * @param {number} topK - Number of top results to return
   * @param {boolean} useClientCache - Whether to use client-side cache (default: true)
   * @returns {Promise<Array>} Array of search results with similarity scores
   */
  static async searchImages(query, model = "CLIP", topK = 10, useClientCache = true) {
    const modelConfig = AI_MODELS[model];
    if (!modelConfig) {
      throw new Error(`Unknown model: ${model}. Available models: ${Object.keys(AI_MODELS).join(", ")}`);
    }

    // Generate cache key for client-side cache
    const cacheKey = CacheManager.generateSearchKey(query, model, { topK });

    // Try to get from client-side cache first (faster for repeated searches)
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
      // Use regular fetch for client-side requests
      const response = await fetch(`${modelConfig.url}${modelConfig.endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

      // Cache the result on client-side for immediate repeated access
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
   * @param {string} model - The model to check
   * @returns {Promise<Object>} Health status
   */
  static async checkServerHealth(model = "CLIP") {
    const modelConfig = AI_MODELS[model];
    if (!modelConfig) {
      throw new Error(`Unknown model: ${model}`);
    }

    try {
      // Use regular fetch for client-side requests
      const response = await fetch(`${modelConfig.url}/health/${model.toLowerCase()}`);

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
   * @returns {Promise<Object>} Health status for all models (transformed to object format)
   */
  static async getAllHealthStatuses() {
    try {
      // Use regular fetch for client-side requests
      const response = await fetch(`${UNIFIED_SERVER_URL}/health`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform the array of models to an object format expected by ModelSelector
      const modelHealth = {};

      if (data.models && Array.isArray(data.models)) {
        data.models.forEach((model) => {
          // Map server model names to client model names
          let clientModelName;
          switch (model.name.toLowerCase()) {
            case "clip":
              clientModelName = "CLIP";
              break;
            case "eva02":
              clientModelName = "EVA02";
              break;
            case "dfn5b":
              clientModelName = "DFN5B";
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
   * @param {string} query - The search query text
   * @param {string} model - The model to use
   * @param {number} topK - Number of results
   * @param {boolean} useClientCache - Whether to use client-side cache (default: true)
   * @returns {Promise<Object>} Formatted search results
   */
  static async searchProductsV2(query, model = "CLIP", topK = 10, useClientCache = true) {
    // Generate cache key for client-side cache
    const cacheKey = CacheManager.generateSearchKey(query, model, { topK });

    // Try to get from client-side cache first (faster for repeated searches)
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
      // Convert model name to lowercase for server compatibility
      const serverModel = model.toLowerCase();

      // Use regular fetch for client-side requests
      const response = await fetch(`${UNIFIED_SERVER_URL}/search-products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

      // Convert API products to client format
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

      // Cache the result on client-side for immediate repeated access
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
   * Search for products using selected AI model (legacy method - kept for backward compatibility)
   * @param {string} query - The search query text
   * @param {Array} products - Local products array (ignored in new version)
   * @param {string} model - The model to use (e.g., 'CLIP', 'EVA02', 'DFN5B')
   * @param {number} topK - Number of top results to return
   * @returns {Promise<Array>} Array of products with similarity scores
   */
  static async searchProducts(query, products, model = "CLIP", topK = 10) {
    // Use the new database-backed search method with caching enabled
    return this.searchProductsV2(query, model, topK, true);
  }

  /**
   * Upload an image to the server and generate embeddings
   * @param {File} imageFile - The image file to upload
   * @param {Array<string>} models - Models to generate embeddings for (optional)
   * @returns {Promise<Object>} Upload result with embeddings
   */
  static async uploadImage(imageFile, models = ["CLIP"]) {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("models", JSON.stringify(models));

      // Don't cache upload requests
      const response = await fetch(`${UNIFIED_SERVER_URL}/upload-image`, {
        method: "POST",
        body: formData,
        // No caching for uploads
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
   * @returns {Promise<Array>} Array of available images
   */
  static async getImages() {
    try {
      // Use regular fetch for client-side requests
      const response = await fetch(`${UNIFIED_SERVER_URL}/images`);

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
   * @returns {Promise<Object>} Database stats
   */
  static async getDatabaseStats() {
    try {
      // Use regular fetch for client-side requests
      const response = await fetch(`${UNIFIED_SERVER_URL}/stats`);

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
   * @returns {Promise<Object>} Generation result
   */
  static async generateEmbeddings() {
    try {
      // Don't cache generation requests
      const response = await fetch(`${UNIFIED_SERVER_URL}/generate-embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
   * @param {Array<string>} tags - Cache tags to revalidate
   */
  static async revalidateCacheTags(tags) {
    // This would be called from a Server Action
    // Example usage: ClipService.revalidateCacheTags(['products', 'ai-search'])
    if (typeof window === "undefined") {
      // Server-side only
      const { revalidateTag } = await import("next/cache");
      tags.forEach((tag) => revalidateTag(tag));
    }
  }

  /**
   * Search for products using client-side or server-side AI models
   * @param {string} query - The search query text
   * @param {Array} products - Available products (for client-side search)
   * @param {string} model - The model to use
   * @param {number} topK - Number of results to return
   * @param {boolean} useClientCache - Whether to use client-side cache
   * @returns {Promise<Object>} Search results
   */
  static async searchProductsV3(query, products = [], model = "CLIP", topK = 10, useClientCache = true) {
    const startTime = Date.now();
    
    // Check if this is a client-side model
    const modelConfig = AI_MODELS[model];
    if (!modelConfig) {
      throw new Error(`Unknown model: ${model}. Available models: ${Object.keys(AI_MODELS).join(", ")}`);
    }

    // Handle client-side CLIP model
    if (modelConfig.isClientSide && model === "CLIENT-CLIP") {
      try {
        console.log(`🤖 Using client-side CLIP search for: "${query}"`);
        
        const result = await clientClipService.searchProducts(query, products, topK);
        result.processingTime = Date.now() - startTime;
        
        return result;
      } catch (error) {
        console.warn(`⚠️ Client-side CLIP failed, falling back to server CLIP: ${error.message}`);
        // Fall back to server-side CLIP
        return this.searchProductsV2(query, "CLIP", topK, useClientCache);
      }
    }

    // Use existing server-side search for other models
    return this.searchProductsV2(query, model, topK, useClientCache);
  }

  /**
   * Get status of all available models (client-side and server-side)
   * @returns {Promise<Object>} Status of all models
   */
  static async getAllModelStatuses() {
    try {
      // Get server-side model statuses
      const serverStatuses = await this.getAllHealthStatuses();
      
      // Get client-side model status
      const clientClipStatus = clientClipService.getStatus();
      
      // Determine status based on loading/loaded state
      let status = "error";
      if (clientClipStatus.isLoading) {
        status = "loading";
      } else if (clientClipStatus.isLoaded) {
        // Model is healthy if loaded, even without embeddings
        status = "healthy";
      }
      
      // Combine statuses
      const allStatuses = {
        ...serverStatuses,
        "CLIENT-CLIP": {
          name: "CLIENT-CLIP",
          status: status,
          loaded: clientClipStatus.isLoaded,
          embeddings_count: clientClipStatus.embeddingsCount,
          model_info: `${clientClipStatus.modelName} (${clientClipStatus.modelSize})`,
          error: clientClipStatus.modelError,
          isClientSide: true,
          canRunLocally: clientClipStatus.canRunLocally,
          searchMode: clientClipStatus.searchMode
        }
      };

      return allStatuses;
    } catch (error) {
      console.error("Error getting model statuses:", error);
      return {};
    }
  }

  /**
   * Initialize client-side CLIP model
   * @returns {Promise<boolean>} Success status
   */
  static async initializeClientClip() {
    try {
      console.log('🚀 Initializing client-side CLIP model...');
      return await clientClipService.preload();
    } catch (error) {
      console.error('❌ Failed to initialize client-side CLIP:', error);
      return false;
    }
  }

  /**
   * Check if client-side CLIP is available and ready
   * @returns {boolean} Availability status
   */
  static isClientClipAvailable() {
    return clientClipService.isAvailable();
  }
}

export default ClipService;
