/**
 * Cache monitoring and management utilities
 * For debugging and optimizing the hybrid caching strategy
 */

import { CacheManager } from "./cache";

export class CacheMonitor {
  /**
   * Get comprehensive cache statistics
   * @returns {Object} Detailed cache statistics
   */
  static getDetailedStats() {
    if (!CacheManager.isAvailable()) {
      return {
        available: false,
        message: "Cache not available (localStorage not supported or disabled)",
      };
    }

    const stats = CacheManager.getStats();
    const storage = CacheManager.getStorageInfo();

    return {
      available: true,
      clientCache: {
        ...stats,
        storage,
        totalSizeKB: storage.used ? Math.round(storage.used / 1024) : "Unknown",
        availableSizeKB: storage.available ? Math.round(storage.available / 1024) : "Unknown",
      },
      nextjsCache: {
        // Next.js cache stats would require server-side implementation
        message: "Next.js cache is handled server-side - check Network tab for cache hits",
      },
    };
  }

  /**
   * Get cache entries by type
   * @param {string} type - Cache type to inspect
   * @returns {Object} Cache entries for the type
   */
  static inspectCacheType(type) {
    if (!CacheManager.isAvailable()) return null;

    const allKeys = Object.keys(localStorage);
    const typeKeys = allKeys.filter((key) => key.startsWith(`cache_${type}_`));

    const entries = {};
    typeKeys.forEach((key) => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        const cacheKey = key.replace(`cache_${type}_`, "");
        entries[cacheKey] = {
          createdAt: new Date(data.timestamp),
          expiresAt: new Date(data.timestamp + data.ttl),
          isExpired: Date.now() > data.timestamp + data.ttl,
          size: JSON.stringify(data).length,
          dataPreview: Array.isArray(data.data)
            ? `Array(${data.data.length})`
            : typeof data.data === "object"
            ? `Object(${Object.keys(data.data).length} keys)`
            : String(data.data).substring(0, 50) + "...",
        };
      } catch (error) {
        entries[key] = { error: "Failed to parse cache entry" };
      }
    });

    return entries;
  }

  /**
   * Performance metrics for cache effectiveness
   * @returns {Object} Performance metrics
   */
  static getPerformanceMetrics() {
    const stats = this.getDetailedStats();

    if (!stats.available) return stats;

    const { clientCache } = stats;
    const hitRate =
      clientCache.hits > 0 ? ((clientCache.hits / (clientCache.hits + clientCache.misses)) * 100).toFixed(2) : "0.00";

    return {
      available: true,
      hitRate: `${hitRate}%`,
      totalRequests: clientCache.hits + clientCache.misses,
      cacheSizeUtilization:
        clientCache.storage.used && clientCache.storage.total
          ? `${((clientCache.storage.used / clientCache.storage.total) * 100).toFixed(2)}%`
          : "Unknown",
      recommendations: this.generateRecommendations(clientCache),
    };
  }

  /**
   * Generate cache optimization recommendations
   * @param {Object} stats - Cache statistics
   * @returns {Array<string>} Recommendations
   */
  static generateRecommendations(stats) {
    const recommendations = [];

    const hitRate = stats.hits > 0 ? (stats.hits / (stats.hits + stats.misses)) * 100 : 0;

    if (hitRate < 50) {
      recommendations.push("Cache hit rate is low - consider increasing TTL for frequently accessed data");
    }

    if (stats.storage.used && stats.storage.total && stats.storage.used / stats.storage.total > 0.8) {
      recommendations.push("Cache storage is nearly full - consider implementing cache size limits");
    }

    if (stats.totalEntries > 100) {
      recommendations.push("Large number of cache entries - consider implementing LRU eviction");
    }

    if (recommendations.length === 0) {
      recommendations.push("Cache performance looks good!");
    }

    return recommendations;
  }

  /**
   * Export cache configuration for debugging
   * @returns {Object} Current cache configuration
   */
  static exportConfiguration() {
    return {
      ttl: {
        products: CacheManager.DEFAULT_TTL,
        categories: CacheManager.DEFAULT_TTL,
        bestSellers: CacheManager.DEFAULT_TTL,
        newArrivals: CacheManager.DEFAULT_TTL,
        searchResults: CacheManager.DEFAULT_TTL,
      },
      nextjs: {
        products: "15 minutes (900s)",
        searchResults: "5 minutes (300s)",
        categories: "1 hour (3600s)",
        bestSellers: "1 hour (3600s)",
        newArrivals: "30 minutes (1800s)",
        healthChecks: "1-2 minutes (60-120s)",
      },
      strategy: "Hybrid (Client-side + Next.js server-side)",
      fallbacks: "Client cache -> Next.js cache -> API request",
    };
  }

  /**
   * Clear all caches and reset metrics
   */
  static resetAll() {
    CacheManager.clearAll();
    console.log("All caches cleared and metrics reset");
  }

  /**
   * Log cache analysis to console (useful for debugging)
   */
  static logAnalysis() {
    console.group("🔍 Cache Analysis");

    const stats = this.getDetailedStats();
    console.log("📊 Detailed Stats:", stats);

    const performance = this.getPerformanceMetrics();
    console.log("⚡ Performance Metrics:", performance);

    const config = this.exportConfiguration();
    console.log("⚙️ Configuration:", config);

    console.groupEnd();
  }
}

export default CacheMonitor;
