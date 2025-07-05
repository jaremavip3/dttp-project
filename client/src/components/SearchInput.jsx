"use client";

import { useState, useRef, useEffect } from "react";

export default function SearchInputComponent({
  onSearch,
  placeholder = 'Try: "summer vibes", "black and red", "cozy winter"...',
  isLoading = false,
  error = null,
}) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGlowActive, setIsGlowActive] = useState(true);
  const inputRef = useRef(null);
  const inactivityTimeout = useRef(null);

  // Reset inactivity timer on any user interaction
  const resetInactivityTimer = () => {
    if (!isGlowActive) {
      setIsGlowActive(true);
    }

    // Clear existing timeout
    if (inactivityTimeout.current) {
      clearTimeout(inactivityTimeout.current);
    }

    // Set new timeout for 10 seconds
    inactivityTimeout.current = setTimeout(() => {
      setIsGlowActive(false);
    }, 10000);
  };

  // Initialize inactivity timer and cleanup on unmount
  useEffect(() => {
    resetInactivityTimer();

    return () => {
      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current);
      }
    };
  }, []);

  const handleSearch = (searchQuery) => {
    resetInactivityTimer();
    if (searchQuery.trim()) {
      setIsSearching(true);
      onSearch(searchQuery.trim());

      // Reset searching state after a delay
      setTimeout(() => {
        setIsSearching(false);
      }, 1000);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    resetInactivityTimer();
  };

  const handleFocus = () => {
    setIsFocused(true);
    resetInactivityTimer();
  };

  const handleBlur = () => {
    setIsFocused(false);
    resetInactivityTimer();
  };

  const handleKeyDown = (e) => {
    resetInactivityTimer();
    if (e.key === "Enter") {
      handleSearch(query);
    }
  };

  const handleClear = () => {
    setQuery("");
    resetInactivityTimer();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Enhanced visual state - now includes glow active state
  const isEnhanced = (isFocused || isLoading || isSearching) && isGlowActive;

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 px-4 sm:px-0">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full px-4 py-3 sm:py-2 pr-16 sm:pr-20 border rounded-lg text-sm sm:text-base transition-all duration-300 search-input-glow
            ${isLoading ? "bg-gray-50 cursor-wait border-gray-300" : "bg-white border-gray-300"}
            ${isSearching ? "search-input-searching" : ""}
            ${isEnhanced ? "search-input-enhanced border-blue-400" : ""}
            ${isFocused ? "ring-2 ring-blue-500 ring-opacity-50" : ""}
            focus:outline-none focus:border-transparent
          `}
          disabled={isLoading}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
          {query && !isLoading && (
            <button
              onClick={handleClear}
              className="p-2 sm:p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 touch-manipulation min-w-[32px] sm:min-w-[24px] flex items-center justify-center transition-all duration-200 rounded-full"
              type="button"
            >
              <span className="text-sm">✕</span>
            </button>
          )}
          <button
            onClick={() => handleSearch(query)}
            disabled={isLoading || !query.trim()}
            className={`p-2 sm:p-1 touch-manipulation min-w-[32px] sm:min-w-[24px] flex items-center justify-center transition-all duration-200 rounded-full
              ${
                isLoading || !query.trim()
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              }
              ${isSearching ? "text-blue-700 bg-blue-100 shadow-lg" : ""}
            `}
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

      {/* Help text with fade-in animation */}
      <div className={`mt-2 text-center transition-opacity duration-300 ${isFocused ? "opacity-100" : "opacity-75"}`}>
        <p className="text-xs text-gray-500">
          {isFocused ? (
            <span className="text-blue-600 font-medium">
              <span className="sparkle-animation">✨</span> AI is ready to understand your search! Try: "vintage denim",
              "elegant evening", "cozy autumn"
            </span>
          ) : (
            '💡 Try describing styles, colors, or moods: "vintage denim", "elegant evening", "cozy autumn"'
          )}
        </p>
      </div>

      {error && <p className="mt-2 text-sm text-red-600 text-center px-4">{error}</p>}
    </div>
  );
}
