"use client";

import { useState, useMemo } from "react";
import { products } from "@/data/products";
import { ClipService } from "@/services/clipService";

export function useProductFilters() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [clipResults, setClipResults] = useState([]);
  const [isClipSearching, setIsClipSearching] = useState(false);
  const [clipError, setClipError] = useState(null);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleTagToggle = (tag) => {
    if (tag === "all") {
      setSelectedTags([]);
      return;
    }

    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    setClipError(null);

    if (query.trim()) {
      setIsClipSearching(true);
      try {
        const clipSearchResults = await ClipService.searchProducts(query, products);
        setClipResults(clipSearchResults.products);
      } catch (error) {
        console.error("CLIP search failed:", error);
        setClipError("CLIP search unavailable - using text search instead");
        setClipResults([]);
      } finally {
        setIsClipSearching(false);
      }
    } else {
      setClipResults([]);
    }
  };

  const filteredProducts = useMemo(() => {
    // If we have CLIP results and a search query, use CLIP results as the base
    let baseProducts = products;

    if (searchQuery && clipResults.length > 0) {
      // Use CLIP results as base, but still apply other filters
      baseProducts = clipResults;
    }

    return baseProducts.filter((product) => {
      // Category filter
      const categoryMatch = selectedCategory === "all" || product.category === selectedCategory;

      // Tags filter - if no tags selected, show all; if tags selected, product must have at least one matching tag
      const tagsMatch = selectedTags.length === 0 || selectedTags.some((tag) => product.tags.includes(tag));

      // Text search filter (fallback when CLIP is not available or no results)
      const textSearchMatch =
        !searchQuery ||
        (!clipResults.length &&
          (product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))));

      return categoryMatch && tagsMatch && (clipResults.length > 0 || textSearchMatch);
    });
  }, [selectedCategory, selectedTags, searchQuery, clipResults]);

  return {
    selectedCategory,
    selectedTags,
    searchQuery,
    filteredProducts,
    clipResults,
    isClipSearching,
    clipError,
    handleCategoryChange,
    handleTagToggle,
    handleSearch,
  };
}
