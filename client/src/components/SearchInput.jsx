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
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-sm transition-all duration-200 hover:border-gray-300"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Searching...
            </span>
          ) : (
            "Search"
          )}
        </button>
      </form>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded border border-orange-200">
          {error}
        </div>
      )}

      {/* AI search examples */}
      {!error && !query && (
        <div className="mt-2 text-xs text-gray-500">
          <div className="text-center mb-1">Try AI search examples:</div>
          <div className="flex flex-wrap justify-center gap-1">
            <button
              onClick={() => setQuery("warm winter jacket")}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            >
              "warm winter jacket"
            </button>
            <button
              onClick={() => setQuery("casual outfit")}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            >
              "casual outfit"
            </button>
            <button
              onClick={() => setQuery("formal wear")}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            >
              "formal wear"
            </button>
          </div>
        </div>
      )}

      {/* Simple AI indicator when searching */}
      {!error && query && <div className="mt-2 text-xs text-gray-500 text-center">AI-powered search</div>}
    </div>
  );
}
