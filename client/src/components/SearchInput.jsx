"use client";

import { useState } from "react";

export default function SearchInput({
  onSearch,
  placeholder = "Enter your search query...",
  isLoading = false,
  error = null,
}) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Error message */}
      {error && <div className="mt-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded border">{error}</div>}

      {/* CLIP indicator */}
      {!error && <div className="mt-2 text-xs text-gray-500 text-center">🧠 AI-powered semantic search enabled</div>}
    </div>
  );
}
