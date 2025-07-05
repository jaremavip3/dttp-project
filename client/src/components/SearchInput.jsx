"use client";

import { useState } from "react";

export default function SearchInputComponent({
  onSearch,
  placeholder = "Enter your search query...",
  isLoading = false,
  error = null,
}) {
  const [query, setQuery] = useState("");

  const handleSearch = (searchQuery) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 px-4 sm:px-0">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(query);
            }
          }}
          placeholder={placeholder}
          className={`w-full px-4 py-3 sm:py-2 pr-16 sm:pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
            isLoading ? "bg-gray-50 cursor-wait" : ""
          }`}
          disabled={isLoading}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
          {query && !isLoading && (
            <button
              onClick={handleClear}
              className="p-2 sm:p-1 text-gray-400 hover:text-gray-600 touch-manipulation min-w-[32px] sm:min-w-[24px] flex items-center justify-center"
              type="button"
            >
              <span className="text-sm">✕</span>
            </button>
          )}
          <button
            onClick={() => handleSearch(query)}
            disabled={isLoading || !query.trim()}
            className="p-2 sm:p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-400 touch-manipulation min-w-[32px] sm:min-w-[24px] flex items-center justify-center"
            type="button"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            ) : (
              <span className="text-sm">🔍</span>
            )}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600 text-center px-4">{error}</p>}
    </div>
  );
}
