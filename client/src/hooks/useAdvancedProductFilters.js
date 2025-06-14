"use client";

import { useState, useMemo } from "react";
import { products } from "@/data/products";
import { ClipService } from "@/services/clipService";

export function useAdvancedProductFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clipResults, setClipResults] = useState([]);
  const [isClipSearching, setIsClipSearching] = useState(false);
  const [clipError, setClipError] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);

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

  const handleFilterSelect = (filter) => {
    if (filter.type === "clear-all") {
      setActiveFilters([]);
      return;
    }

    if (filter.type === "remove") {
      setActiveFilters((prev) => prev.filter((f) => f.id !== filter.id));
      return;
    }

    // Add new filter if not already active
    setActiveFilters((prev) => {
      const exists = prev.some((f) => f.id === filter.id);
      if (exists) {
        return prev.filter((f) => f.id !== filter.id); // Toggle off
      } else {
        return [...prev, filter]; // Add new
      }
    });
  };

  const filteredProducts = useMemo(() => {
    let baseProducts = products;

    // Use CLIP results if available and search query exists
    if (searchQuery && clipResults.length > 0) {
      baseProducts = clipResults;
    }

    return baseProducts.filter((product) => {
      // Text search filter (fallback when CLIP is not available)
      const textSearchMatch =
        !searchQuery ||
        clipResults.length > 0 ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Advanced filter logic
      const advancedFilterMatch =
        activeFilters.length === 0 ||
        activeFilters.every((filter) => {
          switch (filter.type) {
            case "gender":
              return product.gender === filter.value || product.gender === "unisex";

            case "gender-sale":
              return (product.gender === filter.value || product.gender === "unisex") && product.isOnSale;

            case "gender-new":
              return (product.gender === filter.value || product.gender === "unisex") && product.isNew;

            case "gender-bestseller":
              return (product.gender === filter.value || product.gender === "unisex") && product.isBestSeller;

            case "category-gender":
              const [category, gender] = filter.value.split("-");
              return product.category === category && (product.gender === gender || product.gender === "unisex");

            case "category-gender-sale":
              const [catSale, genderSale] = filter.value.split("-");
              return (
                product.category === catSale &&
                (product.gender === genderSale || product.gender === "unisex") &&
                product.isOnSale
              );

            case "category-gender-new":
              const [catNew, genderNew] = filter.value.split("-");
              return (
                product.category === catNew &&
                (product.gender === genderNew || product.gender === "unisex") &&
                product.isNew
              );

            case "subcategory-gender":
              const [subcat, subGender] = filter.value.split("-");
              return product.subcategory === subcat && (product.gender === subGender || product.gender === "unisex");

            case "subcategory-gender-sale":
              const [subcatSale, subcatGenderSale] = filter.value.split("-");
              return (
                product.subcategory === subcatSale &&
                (product.gender === subcatGenderSale || product.gender === "unisex") &&
                product.isOnSale
              );

            case "subcategory-gender-new":
              const [subcatNew, subcatGenderNew] = filter.value.split("-");
              return (
                product.subcategory === subcatNew &&
                (product.gender === subcatGenderNew || product.gender === "unisex") &&
                product.isNew
              );

            default:
              return true;
          }
        });

      return textSearchMatch && advancedFilterMatch;
    });
  }, [searchQuery, clipResults, activeFilters]);

  return {
    searchQuery,
    filteredProducts,
    clipResults,
    isClipSearching,
    clipError,
    activeFilters,
    handleSearch,
    handleFilterSelect,
  };
}
