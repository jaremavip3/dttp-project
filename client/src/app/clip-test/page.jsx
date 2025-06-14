"use client";

import { useState } from "react";
import { ClipService } from "@/services/clipService";

export default function ClipTestPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await ClipService.searchImages(query, 5);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">CLIP Test Page</h1>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query (e.g., 'warm jacket', 'casual shirt')"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Results for "{results.query}" ({results.total_images} total images)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.results.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center overflow-hidden">
                  <img src={`/test_images/${result.image}`} alt={result.image} className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">{result.image}</p>
                  <p className="text-sm text-gray-600">Similarity: {Math.round(result.similarity * 100)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
