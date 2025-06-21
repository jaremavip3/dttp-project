/**
 * Product service for fetching products from the database-backed API
 */

const API_BASE_URL = "http://localhost:8000";

export class ProductService {
  /**
   * Fetch products from the API with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.per_page - Items per page (default: 50)
   * @param {string} options.category - Filter by category
   * @param {string} options.split - Filter by split (train/test)
   * @returns {Promise<Object>} Products response with products array, total, page info
   */
  static async fetchProducts({ page = 1, per_page = 50, category = null, split = null } = {}) {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("per_page", per_page.toString());

      if (category) {
        params.append("category", category);
      }

      if (split) {
        params.append("split", split);
      }

      const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  /**
   * Fetch all products (with automatic pagination)
   * @param {Object} options - Query options
   * @param {string} options.category - Filter by category
   * @param {string} options.split - Filter by split (train/test)
   * @param {number} options.maxItems - Maximum items to fetch (default: 1000)
   * @returns {Promise<Array>} Array of all products
   */
  static async fetchAllProducts({ category = null, split = null, maxItems = 1000 } = {}) {
    try {
      const allProducts = [];
      let page = 1;
      const per_page = 50; // Reasonable page size

      while (allProducts.length < maxItems) {
        const response = await this.fetchProducts({
          page,
          per_page,
          category,
          split,
        });

        if (response.products.length === 0) {
          break; // No more products
        }

        allProducts.push(...response.products);

        // If we got less than per_page items, we've reached the end
        if (response.products.length < per_page) {
          break;
        }

        page++;
      }

      return allProducts.slice(0, maxItems);
    } catch (error) {
      console.error("Error fetching all products:", error);
      throw error;
    }
  }

  /**
   * Fetch available categories
   * @returns {Promise<Array>} Array of category names
   */
  static async fetchCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/products/categories`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }

  /**
   * Convert API product to client-side product format
   * This ensures compatibility with existing client code
   * @param {Object} apiProduct - Product from API
   * @returns {Object} Client-formatted product
   */
  static convertToClientProduct(apiProduct) {
    const metadata = apiProduct.metadata || {};

    return {
      id: apiProduct.id, // Use the UUID from database as unique ID
      name: apiProduct.name,
      filename: apiProduct.filename,
      image: apiProduct.image_url, // Use the image URL directly (now points to Supabase Storage)
      category: apiProduct.category || "general",
      subcategory: apiProduct.category || "general", // Use category as subcategory for now
      gender: "unisex", // Default since we don't have gender in our dataset
      tags: [
        apiProduct.category || "general",
        apiProduct.split || "unknown",
        ...(metadata.source ? [metadata.source] : []),
      ].filter(Boolean),
      description: `${apiProduct.category || "Item"} from ${apiProduct.split || "dataset"} dataset`,
      isNew: apiProduct.split === "train", // Mark train items as "new"
      isOnSale: false,
      isBestSeller: false,
      price: 29.99, // Default price since we don't have pricing data
      metadata: apiProduct.metadata,
    };
  }
}

export default ProductService;
