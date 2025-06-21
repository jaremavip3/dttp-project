"use client";

import { useState, useEffect } from "react";
import { CacheManager, CACHE_TYPES } from "@/utils/cache";

export default function CacheManager() {
  const [cacheStats, setCacheStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshStats = () => {
    if (CacheManager.isAvailable()) {
      const stats = CacheManager.getStats();
      setCacheStats(stats);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleClearCache = (cacheType) => {
    if (cacheType === "ALL") {
      CacheManager.clearAll();
    } else {
      CacheManager.clear(cacheType);
    }
    refreshStats();
  };

  if (!CacheManager.isAvailable()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Cache Not Available</h3>
        <p className="text-yellow-700">
          Local storage is not available in your browser. Caching features are disabled.
        </p>
      </div>
    );
  }

  if (!cacheStats) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">Loading cache statistics...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Cache Management</h3>
        <button
          onClick={refreshStats}
          className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{cacheStats.totalCaches}</div>
          <div className="text-sm text-blue-700">Total Caches</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{cacheStats.formattedSize}</div>
          <div className="text-sm text-green-700">Total Size</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{Object.keys(cacheStats.cacheTypes).length}</div>
          <div className="text-sm text-purple-700">Cache Types</div>
        </div>
      </div>

      {/* Cache Types Details */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Cache Details</h4>

        {cacheStats &&
          cacheStats.cacheTypes &&
          Object.entries(cacheStats.cacheTypes).map(([type, stats]) => (
            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{type}</div>
                <div className="text-sm text-gray-600">
                  {stats.count} items • {(stats.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                onClick={() => handleClearCache(type)}
                className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
              >
                Clear
              </button>
            </div>
          ))}

        {Object.keys(cacheStats.cacheTypes).length === 0 && (
          <div className="text-center py-4 text-gray-500">No cached data found</div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">Last updated: {lastUpdated}</div>
          <button
            onClick={() => handleClearCache("ALL")}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium"
          >
            Clear All Cache
          </button>
        </div>
      </div>

      {/* Cache Benefits Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h5 className="font-medium text-blue-900 mb-1">Cache Benefits</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Faster loading of previously viewed products</li>
          <li>• Reduced server requests and bandwidth usage</li>
          <li>• Improved offline browsing experience</li>
          <li>• Quicker search results for repeated queries</li>
        </ul>
      </div>
    </div>
  );
}
