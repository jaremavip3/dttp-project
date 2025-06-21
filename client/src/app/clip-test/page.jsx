"use client";

import { useState } from "react";
import { AI_MODELS } from "@/services/clipService";
import ClipService from "@/services/clipService";
import ModelSelector from "@/components/ModelSelector";

export default function ClipTestPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState("CLIP");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await ClipService.searchImages(query, selectedModel, 5);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Model Comparison Test</h1>

      {/* Model Selector */}
      <div className="mb-6">
        <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
      </div>

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
            {loading ? "Searching..." : `Search with ${AI_MODELS[selectedModel]?.name || selectedModel}`}
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
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-3">
              Search Results - {AI_MODELS[selectedModel]?.name || selectedModel}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
              <div>
                <strong>Query:</strong> "{results.query}"
              </div>
              <div>
                <strong>Model:</strong> {results.model_info || results.model}
              </div>
              <div>
                <strong>Total Images:</strong> {results.total_images}
              </div>
              <div>
                <strong>Results:</strong> {results.results.length}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.results.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center overflow-hidden">
                  <img
                    src={`http://localhost:8000/images/${result.image}`}
                    alt={result.image}
                    className="w-full h-full object-cover"
                  />
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
