/**
 * Client-side caching utility for products and images
 */

// Cache configuration
const CACHE_CONFIG = {
  PRODUCTS: {
    key: "dttp_products_cache",
    ttl: 15 * 60 * 1000, // 15 minutes
  },
  BEST_SELLERS: {
    key: "dttp_best_sellers_cache",
    ttl: 30 * 60 * 1000, // 30 minutes
  },
  NEW_ARRIVALS: {
    key: "dttp_new_arrivals_cache",
    ttl: 30 * 60 * 1000, // 30 minutes
  },
  CATEGORIES: {
    key: "dttp_categories_cache",
    ttl: 60 * 60 * 1000, // 1 hour
  },
  SEARCH_RESULTS: {
    key: "dttp_search_cache",
    ttl: 10 * 60 * 1000, // 10 minutes
  },
};

export class CacheManager {
  /**
   * Check if we're in a browser environment with localStorage
   * @returns {boolean}
   */
  static isBrowser() {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  /**
   * Set data in cache with expiration
   * @param {string} cacheType - Type of cache (from CACHE_CONFIG)
   * @param {any} data - Data to cache
   * @param {string} [key] - Optional specific key (for search results)
   */
  static set(cacheType, data, key = null) {
    if (!this.isBrowser()) return;

    try {
      const config = CACHE_CONFIG[cacheType];
      if (!config) {
        console.warn(`Unknown cache type: ${cacheType}`);
        return;
      }

      const cacheKey = key ? `${config.key}_${key}` : config.key;
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl: config.ttl,
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn("Failed to set cache:", error);
    }
  }

  /**
   * Get data from cache if not expired
   * @param {string} cacheType - Type of cache (from CACHE_CONFIG)
   * @param {string} [key] - Optional specific key (for search results)
   * @returns {any|null} Cached data or null if expired/not found
   */
  static get(cacheType, key = null) {
    if (!this.isBrowser()) return null;

    try {
      const config = CACHE_CONFIG[cacheType];
      if (!config) {
        console.warn(`Unknown cache type: ${cacheType}`);
        return null;
      }

      const cacheKey = key ? `${config.key}_${key}` : config.key;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const cacheData = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now - cacheData.timestamp > cacheData.ttl) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn("Failed to get cache:", error);
      return null;
    }
  }

  /**
   * Clear specific cache type
   * @param {string} cacheType - Type of cache to clear
   */
  static clear(cacheType) {
    if (!this.isBrowser()) return;

    try {
      const config = CACHE_CONFIG[cacheType];
      if (!config) {
        console.warn(`Unknown cache type: ${cacheType}`);
        return;
      }

      // Clear main cache
      localStorage.removeItem(config.key);

      // Clear related search caches (for search results)
      if (cacheType === "SEARCH_RESULTS") {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(config.key)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.warn("Failed to clear cache:", error);
    }
  }

  /**
   * Clear all DTTP caches
   */
  static clearAll() {
    if (!this.isBrowser()) return;

    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("dttp_")) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Failed to clear all caches:", error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  static getStats() {
    const stats = {
      totalCaches: 0,
      totalSize: 0,
      cacheTypes: {},
    };

    if (!this.isBrowser()) return stats;

    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("dttp_")) {
          const data = localStorage.getItem(key);
          const size = new Blob([data]).size;

          stats.totalCaches++;
          stats.totalSize += size;

          // Determine cache type from key
          const cacheType =
            Object.keys(CACHE_CONFIG).find((type) => key.startsWith(CACHE_CONFIG[type].key)) || "unknown";

          if (!stats.cacheTypes[cacheType]) {
            stats.cacheTypes[cacheType] = { count: 0, size: 0 };
          }

          stats.cacheTypes[cacheType].count++;
          stats.cacheTypes[cacheType].size += size;
        }
      });

      // Format size in KB/MB
      stats.formattedSize =
        stats.totalSize < 1024 * 1024
          ? `${(stats.totalSize / 1024).toFixed(1)} KB`
          : `${(stats.totalSize / (1024 * 1024)).toFixed(1)} MB`;
    } catch (error) {
      console.warn("Failed to get cache stats:", error);
    }

    return stats;
  }

  /**
   * Check if cache is available (localStorage support)
   * @returns {boolean}
   */
  static isAvailable() {
    if (!this.isBrowser()) return false;

    try {
      const test = "__cache_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage information
   * @returns {Object} Storage usage stats
   */
  static getStorageInfo() {
    if (!this.isAvailable()) {
      return { used: 0, total: 0, available: 0 };
    }

    try {
      // Calculate current localStorage usage
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length;
        }
      }

      // Try to estimate storage quota (approximate)
      let total = 0;
      let available = 0;

      // Modern browsers support StorageManager API
      if ("storage" in navigator && "estimate" in navigator.storage) {
        // This is async, so we'll return a promise-based estimate
        // For now, return a rough estimate
        total = 10 * 1024 * 1024; // 10MB rough estimate
        available = total - used;
      } else {
        // Fallback: try to determine storage limit by testing
        total = 5 * 1024 * 1024; // 5MB conservative estimate
        available = total - used;
      }

      return {
        used: used,
        total: total,
        available: Math.max(0, available),
        usagePercent: total > 0 ? ((used / total) * 100).toFixed(2) : 0,
      };
    } catch (error) {
      console.warn("Failed to get storage info:", error);
      return { used: 0, total: 0, available: 0, usagePercent: 0 };
    }
  }

  /**
   * Generate cache key for search results
   * @param {string} query - Search query
   * @param {string} model - AI model used
   * @param {Object} filters - Applied filters
   * @returns {string} Cache key
   */
  static generateSearchKey(query, model = "clip", filters = {}) {
    const filterStr = JSON.stringify(filters);
    const hash = btoa(`${query}_${model}_${filterStr}`).replace(/[/+=]/g, "");
    return hash.substring(0, 32); // Limit key length
  }
}

// Export cache types for use in other modules
export const CACHE_TYPES = Object.keys(CACHE_CONFIG);
