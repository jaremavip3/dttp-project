// CLIP Service for communicating with the Python CLIP server
const CLIP_SERVER_URL = "http://localhost:5001";

export class ClipService {
  /**
   * Search for products using CLIP semantic similarity
   * @param {string} query - The search query text
   * @param {number} topK - Number of top results to return
   * @returns {Promise<Array>} Array of search results with similarity scores
   */
  static async searchImages(query, topK = 10) {
    try {
      const response = await fetch(`${CLIP_SERVER_URL}/search`, {
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
      return data;
    } catch (error) {
      console.error("Error searching with CLIP:", error);
      throw error;
    }
  }

  /**
   * Check if CLIP server is healthy and ready
   * @returns {Promise<Object>} Health check response
   */
  static async healthCheck() {
    try {
      const response = await fetch(`${CLIP_SERVER_URL}/health`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error checking CLIP server health:", error);
      throw error;
    }
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
   * @param {number} topK - Number of top results to return
   * @returns {Promise<Array>} Array of products with similarity scores
   */
  static async searchProducts(query, products, topK = 10) {
    try {
      const clipResults = await this.searchImages(query, topK);

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
      };
    } catch (error) {
      console.error("Error searching products with CLIP:", error);
      throw error;
    }
  }
}
