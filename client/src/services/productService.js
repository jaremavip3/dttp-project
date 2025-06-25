/**
 * Product service for fetching products from the database-backed API
 * Enhanced with Next.js native caching + client-side caching for optimal performance
 */

import { CacheManager, CACHE_TYPES } from "@/utils/cache";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ProductService {
  /**
   * Fetch products from the API with pagination and filtering
   * Enhanced with Next.js native caching + client-side cache
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.per_page - Items per page (default: 50)
   * @param {string} options.category - Filter by category
   * @param {string} options.split - Filter by split (train/test)
   * @param {boolean} options.useClientCache - Whether to use client-side cache (default: true)
   * @returns {Promise<Object>} Products response with products array, total, page info
   */
  static async fetchProducts({ page = 1, per_page = 50, category = null, split = null, useClientCache = true } = {}) {
    // Generate cache key based on parameters for client-side cache
    const cacheKey = `page_${page}_per_${per_page}_cat_${category || "all"}_split_${split || "all"}`;

    // Try to get from client-side cache first (fastest for repeated requests)
    if (useClientCache && CacheManager.isAvailable()) {
      const cached = CacheManager.get(CACHE_TYPES.PRODUCTS, cacheKey);
      if (cached) {
        return {
          ...cached,
          fromCache: true,
          cacheType: "client",
        };
      }
    }

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

      // Use Next.js fetch with appropriate caching strategy
      const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
        // Cache products for 15 minutes - balance between freshness and performance
        next: {
          revalidate: 900,
          tags: [
            "products",
            `products-page-${page}`,
            ...(category ? [`products-category-${category}`] : []),
            ...(split ? [`products-split-${split}`] : []),
          ],
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const result = {
        ...data,
        fromCache: false,
        cacheType: "server",
      };

      // Cache the result on client-side for immediate repeated access
      if (useClientCache && CacheManager.isAvailable()) {
        CacheManager.set(CACHE_TYPES.PRODUCTS, result, cacheKey);
      }

      return result;
    } catch (error) {
      console.error("Error fetching products:", error);

      // Check if it's a network error (server not available)
      if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
        throw new Error("Unable to connect to server. Please ensure the API server is running.");
      }

      throw error;
    }
  }

  /**
   * Fetch all products (with automatic pagination)
   * @param {Object} options - Query options
   * @param {string} options.category - Filter by category
   * @param {string} options.split - Filter by split (train/test)
   * @param {number} options.maxItems - Maximum items to fetch (default: 1000)
   * @param {boolean} options.useClientCache - Whether to use client-side cache (default: true)
   * @returns {Promise<Array>} Array of all products
   */
  static async fetchAllProducts({ category = null, split = null, maxItems = 1000, useClientCache = true } = {}) {
    // Generate cache key for all products
    const cacheKey = `all_cat_${category || "all"}_split_${split || "all"}_max_${maxItems}`;

    // Try to get from client-side cache first
    if (useClientCache && CacheManager.isAvailable()) {
      const cached = CacheManager.get(CACHE_TYPES.PRODUCTS, cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Fetch all products in a single request for better performance
      const response = await ProductService.fetchProducts({
        page: 1,
        per_page: maxItems, // Request all items at once
        category,
        split,
        useClientCache: false, // Don't cache the internal request
      });

      const result = response.products;

      // Cache the complete result on client-side
      if (useClientCache && CacheManager.isAvailable()) {
        CacheManager.set(CACHE_TYPES.PRODUCTS, result, cacheKey);
      }

      return result;
    } catch (error) {
      console.error("Error fetching all products:", error);
      throw error;
    }
  }

  /**
   * Fetch best sellers products (using popular categories)
   * Enhanced with Next.js caching for better performance
   * @param {number} limit - Number of products to fetch
   * @param {boolean} useClientCache - Whether to use client-side cache (default: true)
   * @returns {Promise<Array>} Array of best seller products
   */
  static async fetchBestSellers(limit = 8, useClientCache = true) {
    // Try to get from client-side cache first
    if (useClientCache && CacheManager.isAvailable()) {
      const cached = CacheManager.get(CACHE_TYPES.BEST_SELLERS);
      if (cached && cached.length >= limit) {
        return cached.slice(0, limit);
      }
    }

    try {
      // Try dedicated endpoint first
      try {
        const response = await fetch(`${API_BASE_URL}/products/best-sellers?limit=${limit}`, {
          // Cache best sellers for 1 hour (they change less frequently)
          next: {
            revalidate: 3600,
            tags: ["best-sellers", "products", "featured-products"],
          },
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.products || data;

          // Cache on client-side
          if (useClientCache && CacheManager.isAvailable()) {
            CacheManager.set(CACHE_TYPES.BEST_SELLERS, result);
          }

          return result.slice(0, limit);
        }
      } catch (endpointError) {
        // Fallback to category-based approach
      }

      // Fallback to category-based approach
      const popularCategories = ["shirt", "dress", "shoes", "jacket"];
      const products = [];

      for (const category of popularCategories) {
        if (products.length >= limit) break;

        const response = await ProductService.fetchProducts({
          category,
          per_page: Math.ceil(limit / popularCategories.length),
          useClientCache: false, // Don't cache individual category fetches
        });

        const convertedProducts = response.products.map((product) => ({
          ...ProductService.convertToClientProduct(product),
          isBestSeller: true,
          price: Math.round((Math.random() * 50 + 30) * 100) / 100, // Random price 30-80
        }));

        products.push(...convertedProducts);
      }

      const result = products.slice(0, limit);

      // Cache the result
      if (useClientCache && CacheManager.isAvailable()) {
        CacheManager.set(CACHE_TYPES.BEST_SELLERS, result);
      }

      return result;
    } catch (error) {
      console.error("Error fetching best sellers:", error);
      return [];
    }
  }

  /**
   * Fetch new arrivals products (using test split for "newer" items)
   * @param {number} limit - Number of products to fetch
   * @param {boolean} useClientCache - Whether to use client-side cache (default: true)
   * @returns {Promise<Array>} Array of new arrival products
   */
  static async fetchNewArrivals(limit = 8, useClientCache = true) {
    // Try to get from client-side cache first
    if (useClientCache && CacheManager.isAvailable()) {
      const cached = CacheManager.get(CACHE_TYPES.NEW_ARRIVALS);
      if (cached && cached.length >= limit) {
        return cached.slice(0, limit);
      }
    }

    try {
      // Try dedicated endpoint first
      try {
        const response = await fetch(`${API_BASE_URL}/products/new-arrivals?limit=${limit}`, {
          // Cache new arrivals for 30 minutes
          next: {
            revalidate: 1800,
            tags: ["new-arrivals", "products", "featured-products"],
          },
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.products || data;

          // Cache on client-side
          if (useClientCache && CacheManager.isAvailable()) {
            CacheManager.set(CACHE_TYPES.NEW_ARRIVALS, result);
          }

          return result.slice(0, limit);
        }
      } catch (endpointError) {
        // Fallback to split-based approach
      }

      // Fallback approach using test split
      const response = await ProductService.fetchProducts({
        split: "test", // Use test split as "new arrivals"
        per_page: limit,
        useClientCache: false, // Don't cache individual fetch
      });

      const products = response.products.map((product) => ({
        ...ProductService.convertToClientProduct(product),
        isNew: true,
        price: Math.round((Math.random() * 40 + 25) * 100) / 100, // Random price 25-65
      }));

      // Cache the result
      if (useClientCache && CacheManager.isAvailable()) {
        CacheManager.set(CACHE_TYPES.NEW_ARRIVALS, products);
      }

      return products;
    } catch (error) {
      console.error("Error fetching new arrivals:", error);
      return [];
    }
  }

  /**
   * Fetch available categories
   * @param {boolean} useClientCache - Whether to use client-side cache (default: true)
   * @returns {Promise<Array>} Array of category names
   */
  static async fetchCategories(useClientCache = true) {
    // Try to get from client-side cache first
    if (useClientCache && CacheManager.isAvailable()) {
      const cached = CacheManager.get(CACHE_TYPES.CATEGORIES);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/products/categories`, {
        // Cache categories for 1 hour (they change infrequently)
        next: {
          revalidate: 3600,
          tags: ["categories", "products-metadata"],
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const categories = data.categories || [];

      // Cache the result
      if (useClientCache && CacheManager.isAvailable()) {
        CacheManager.set(CACHE_TYPES.CATEGORIES, categories);
      }

      return categories;
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
    if (!apiProduct) return null;

    const metadata = apiProduct.metadata || {};

    return {
      id: apiProduct.id || apiProduct.filename,
      name: apiProduct.name || apiProduct.filename?.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Unnamed Product",
      image: apiProduct.image_url || apiProduct.image,
      category: apiProduct.category || metadata.category || "uncategorized",
      tags: [
        ...(apiProduct.tags || []),
        ...(apiProduct.category ? [apiProduct.category] : []),
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

  /**
   * Clear caches (useful for testing or data updates)
   * @param {string} type - Type of cache to clear, or null for all
   */
  static clearCache(type = null) {
    if (!CacheManager.isAvailable()) return;

    if (type) {
      CacheManager.clear(type);
    } else {
      CacheManager.clearAll();
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  static getCacheStats() {
    return CacheManager.getStats();
  }

  /**
   * Revalidate Next.js cache tags (for use in Server Actions)
   * @param {Array<string>} tags - Cache tags to revalidate
   */
  static async revalidateCacheTags(tags) {
    // This would be called from a Server Action
    if (typeof window === "undefined") {
      // Server-side only
      const { revalidateTag } = await import("next/cache");
      tags.forEach((tag) => revalidateTag(tag));
    }
  }
}

export default ProductService;
