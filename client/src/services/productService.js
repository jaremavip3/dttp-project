/**
 * ВИПРАВЛЕНИЙ Product service з ngrok headers
 * Product service for fetching products from the database-backed API
 * Enhanced with Next.js native caching + client-side caching for optimal performance
 */

import { CacheManager, CACHE_TYPES } from "@/utils/cache";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ProductService {
  /**
   * Fetch products from the API with pagination and filtering
   */
  static async fetchProducts({ page = 1, per_page = 50, category = null, split = null, useClientCache = true } = {}) {
    const cacheKey = `page_${page}_per_${per_page}_cat_${category || "all"}_split_${split || "all"}`;

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

      // ✅ ДОДАЙТЕ NGROK HEADER
      const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
        headers: {
          "ngrok-skip-browser-warning": "true", // 🔥 КЛЮЧОВЕ ВИПРАВЛЕННЯ
        },
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

      if (useClientCache && CacheManager.isAvailable()) {
        CacheManager.set(CACHE_TYPES.PRODUCTS, result, cacheKey);
      }

      return result;
    } catch (error) {
      console.error("Error fetching products:", error);

      if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
        throw new Error("Unable to connect to server. Please ensure the API server is running.");
      }

      throw error;
    }
  }

  /**
   * Fetch all products (with automatic pagination)
   */
  static async fetchAllProducts({ category = null, split = null, maxItems = 1000, useClientCache = true } = {}) {
    const cacheKey = `all_cat_${category || "all"}_split_${split || "all"}_max_${maxItems}`;

    if (useClientCache && CacheManager.isAvailable()) {
      const cached = CacheManager.get(CACHE_TYPES.PRODUCTS, cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await ProductService.fetchProducts({
        page: 1,
        per_page: maxItems,
        category,
        split,
        useClientCache: false,
      });

      const result = response.products;

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
   */
  static async fetchBestSellers(limit = 8, useClientCache = true) {
    if (useClientCache && CacheManager.isAvailable()) {
      const cached = CacheManager.get(CACHE_TYPES.BEST_SELLERS);
      if (cached && cached.length >= limit) {
        return cached.slice(0, limit);
      }
    }

    try {
      // Try dedicated endpoint first
      try {
        // ✅ ДОДАЙТЕ NGROK HEADER
        const response = await fetch(`${API_BASE_URL}/products/best-sellers?limit=${limit}`, {
          headers: {
            "ngrok-skip-browser-warning": "true", // 🔥 КЛЮЧОВЕ ВИПРАВЛЕННЯ
          },
          next: {
            revalidate: 3600,
            tags: ["best-sellers", "products", "featured-products"],
          },
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.products || data;

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
          useClientCache: false,
        });

        const convertedProducts = response.products.map((product) => ({
          ...ProductService.convertToClientProduct(product),
          isBestSeller: true,
          price: Math.round((Math.random() * 50 + 30) * 100) / 100,
        }));

        products.push(...convertedProducts);
      }

      const result = products.slice(0, limit);

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
   */
  static async fetchNewArrivals(limit = 8, useClientCache = true) {
    if (useClientCache && CacheManager.isAvailable()) {
      const cached = CacheManager.get(CACHE_TYPES.NEW_ARRIVALS);
      if (cached && cached.length >= limit) {
        return cached.slice(0, limit);
      }
    }

    try {
      // Try dedicated endpoint first
      try {
        // ✅ ДОДАЙТЕ NGROK HEADER
        const response = await fetch(`${API_BASE_URL}/products/new-arrivals?limit=${limit}`, {
          headers: {
            "ngrok-skip-browser-warning": "true", // 🔥 КЛЮЧОВЕ ВИПРАВЛЕННЯ
          },
          next: {
            revalidate: 1800,
            tags: ["new-arrivals", "products", "featured-products"],
          },
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.products || data;

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
        split: "test",
        per_page: limit,
        useClientCache: false,
      });

      const products = response.products.map((product) => ({
        ...ProductService.convertToClientProduct(product),
        isNew: true,
        price: Math.round((Math.random() * 40 + 25) * 100) / 100,
      }));

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
   */
  static async fetchCategories(useClientCache = true) {
    if (useClientCache && CacheManager.isAvailable()) {
      const cached = CacheManager.get(CACHE_TYPES.CATEGORIES);
      if (cached) {
        return cached;
      }
    }

    try {
      // ✅ ДОДАЙТЕ NGROK HEADER
      const response = await fetch(`${API_BASE_URL}/products/categories`, {
        headers: {
          "ngrok-skip-browser-warning": "true", // 🔥 КЛЮЧОВЕ ВИПРАВЛЕННЯ
        },
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
      isNew: apiProduct.split === "train",
      isOnSale: false,
      isBestSeller: false,
      price: 29.99,
      metadata: apiProduct.metadata,
    };
  }

  /**
   * Clear caches (useful for testing or data updates)
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
   */
  static getCacheStats() {
    return CacheManager.getStats();
  }

  /**
   * Revalidate Next.js cache tags (for use in Server Actions)
   */
  static async revalidateCacheTags(tags) {
    if (typeof window === "undefined") {
      const { revalidateTag } = await import("next/cache");
      tags.forEach((tag) => revalidateTag(tag));
    }
  }
}

export default ProductService;
