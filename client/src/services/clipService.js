// AI Search Service for the unified multi-model server
const UNIFIED_SERVER_URL = "http://localhost:5000";

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
  DFN5B: {
    name: "DFN5B",
    url: UNIFIED_SERVER_URL,
    endpoint: "/search/dfn5b",
    description: "DFN5B-CLIP ViT-H-14 by Apple",
  },
};

export class ClipService {
  /**
   * Search for products using selected AI model
   * @param {string} query - The search query text
   * @param {string} model - The model to use (e.g., 'CLIP', 'EVA02', 'DFN5B')
   * @param {number} topK - Number of top results to return
   * @returns {Promise<Array>} Array of search results with similarity scores
   */
  static async searchImages(query, model = "CLIP", topK = 10) {
    const modelConfig = AI_MODELS[model];
    if (!modelConfig) {
      throw new Error(`Unknown model: ${model}. Available models: ${Object.keys(AI_MODELS).join(", ")}`);
    }

    try {
      // Use the unified server endpoint
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
      return {
        ...data,
        model: model,
      };
    } catch (error) {
      console.error(`Error searching with ${model}:`, error);
      throw error;
    }
  }

  /**
   * Check if specified AI server is healthy and ready
   * @param {string} model - The model to check (e.g., 'CLIP', 'EVA02', 'DFN5B')
   * @returns {Promise<Object>} Health check response
   */
  static async healthCheck(model = "CLIP") {
    const modelConfig = AI_MODELS[model];
    if (!modelConfig) {
      throw new Error(`Unknown model: ${model}`);
    }

    try {
      const response = await fetch(`${modelConfig.url}/health`);

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
   * Check health of all available models
   * @returns {Promise<Object>} Health status for all models
   */
  static async checkAllModels() {
    const results = {};

    for (const [modelKey, modelConfig] of Object.entries(AI_MODELS)) {
      try {
        const health = await this.healthCheck(modelKey);
        results[modelKey] = {
          status: "healthy",
          ...health,
          name: modelConfig.name,
        };
      } catch (error) {
        results[modelKey] = {
          status: "error",
          error: error.message,
          name: modelConfig.name,
        };
      }
    }

    return results;
  }

  /**
   * Map image filename to product ID
   * This helper maps the image filenames returned by CLIP to product IDs
   * @param {string} imageFilename - The image filename from CLIP results
   * @returns {number|null} The corresponding product ID or null if not found
   */
  static mapImageToProductId(imageFilename) {
    // Map image filenames to product IDs based on our product data
    const imageToProductMap = {
      "cardigan.avif": 1,
      "dress.jpeg": 2,
      "gloves.jpeg": 3,
      "hat.jpeg": 4,
      "jacket.jpeg": 5,
      "pants.jpeg": 6,
      "seater.jpeg": 7,
      "shirt.jpeg": 8,
      "shoes.jpeg": 9,
      "t-shirt.jpeg": 10,
    };

    return imageToProductMap[imageFilename] || null;
  }

  /**
   * Search for products and return product objects with similarity scores
   * @param {string} query - The search query text
   * @param {Array} products - Array of product objects
   * @param {string} model - The model to use (e.g., 'CLIP', 'EVA02', 'DFN5B')
   * @param {number} topK - Number of top results to return
   * @returns {Promise<Array>} Array of products with similarity scores
   */
  static async searchProducts(query, products, model = "CLIP", topK = 10) {
    try {
      const clipResults = await this.searchImages(query, model, topK);

      const productsWithScores = clipResults.results
        .map((result) => {
          const productId = this.mapImageToProductId(result.image);
          const product = products.find((p) => p.id === productId);

          if (product) {
            return {
              ...product,
              similarityScore: result.similarity,
              clipImage: result.image,
            };
          }
          return null;
        })
        .filter(Boolean); // Remove null entries

      return {
        query: clipResults.query,
        products: productsWithScores,
        totalImages: clipResults.total_images,
        model: model,
        modelInfo: clipResults.model_info || AI_MODELS[model].name,
      };
    } catch (error) {
      console.error(`Error searching products with ${model}:`, error);
      throw error;
    }
  }
}
