"use client";

import { useState, useEffect } from "react";
import { Button } from "@/uiLibrary/components/button";
import { RefreshCw, Trash2, Info, TrendingUp, AlertCircle } from "lucide-react";

export default function CacheManagement() {
  const [stats, setStats] = useState(null);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    updateCacheData();
    const interval = setInterval(updateCacheData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const updateCacheData = () => {
    // Basic localStorage stats
    if (typeof window !== "undefined" && localStorage) {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith("dttp_"));
      setStats({
        available: true,
        totalEntries: keys.length,
        keys: keys,
      });
    } else {
      setStats({ available: false });
    }
    setLastUpdate(new Date());
  };

  const handleClearCache = () => {
    setIsRevalidating(true);
    try {
      if (typeof window !== "undefined" && localStorage) {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("dttp_")) {
            localStorage.removeItem(key);
          }
        });
      }
      console.log("Client cache cleared");
    } catch (error) {
      console.error("Error clearing cache:", error);
    } finally {
      setIsRevalidating(false);
      setTimeout(updateCacheData, 1000);
    }
  };

  const handleLogAnalysis = () => {
    console.group("🔍 Cache Analysis");
    console.log("📊 Cache Stats:", stats);
    console.log("🕒 Last Update:", lastUpdate);
    console.groupEnd();
  };

  if (!stats?.available) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Cache Not Available</span>
          </div>
          <p className="text-red-700 mt-2">
            Local storage is not available. Client-side caching is disabled. Next.js server-side caching is still
            active.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cache Management</h2>
          <p className="text-gray-600">Monitor and control your hybrid caching strategy</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={updateCacheData}
            disabled={isRevalidating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRevalidating ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogAnalysis} className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Log Analysis
          </Button>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Cache Overview
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">{stats.totalEntries}</div>
            <p className="text-sm text-blue-700">Total Cache Entries</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">Active</div>
            <p className="text-sm text-green-700">Cache Status</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-900">Hybrid</div>
            <p className="text-sm text-purple-700">Cache Strategy</p>
          </div>
        </div>
      </div>

      {/* Cache Configuration */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Cache Configuration</h3>
        <div className="text-sm space-y-2 text-gray-700">
          <div>
            <strong>Strategy:</strong> Hybrid (Client + Next.js Server)
          </div>
          <div>
            <strong>Client TTL:</strong> 5-60 minutes (varies by data type)
          </div>
          <div>
            <strong>Server Cache:</strong> Variable (5min - 1hr)
          </div>
          <div>
            <strong>Last Updated:</strong> {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Cache Keys */}
      {stats.keys && stats.keys.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Cached Keys</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats.keys.map((key, index) => (
              <div key={index} className="bg-gray-50 rounded p-2 text-sm font-mono">
                {key}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Cache Actions</h3>
        <div className="flex gap-4">
          <Button
            onClick={handleClearCache}
            disabled={isRevalidating}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className={`h-4 w-4 ${isRevalidating ? "animate-spin" : ""}`} />
            Clear Client Cache
          </Button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium text-blue-900">Cache Management Info</div>
              <p className="text-blue-800">
                This interface manages client-side localStorage cache only. Next.js server-side caching is handled
                automatically and provides additional performance benefits across all users.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
