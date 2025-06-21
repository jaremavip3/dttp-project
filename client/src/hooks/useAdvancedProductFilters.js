"use client";

import { useState, useMemo, useEffect } from "react";
import { products as fallbackProducts } from "@/data/products";
import ClipService from "@/services/clipService";
import ProductService from "@/services/productService";

export function useAdvancedProductFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clipResults, setClipResults] = useState([]);
  const [isClipSearching, setIsClipSearching] = useState(false);
  const [clipError, setClipError] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [selectedModel, setSelectedModel] = useState("EVA02");
  const [lastSearchModel, setLastSearchModel] = useState(null);

  // New state for database products
  const [products, setProducts] = useState(fallbackProducts);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);

  // Load products from API on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true);
        setProductsError(null);

        // Fetch all products from the database
        const apiProducts = await ProductService.fetchAllProducts({ maxItems: 500 });

        // Convert to client format
        const clientProducts = apiProducts.map(ProductService.convertToClientProduct);

        setProducts(clientProducts);
      } catch (error) {
        console.error("Failed to load products from API:", error);
        setProductsError(error.message);
        // Show a user-friendly error message
        if (error.message.includes("Unable to connect to server")) {
          setProductsError("Unable to connect to the API server. Please ensure it is running on port 8000.");
        } else {
          setProductsError(error.message);
        }
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    setClipError(null);

    if (query.trim()) {
      setIsClipSearching(true);
      try {
        const clipSearchResults = await ClipService.searchProducts(query, products, selectedModel);
        setClipResults(clipSearchResults.products);
        setLastSearchModel(selectedModel);
      } catch (error) {
        console.error(`${selectedModel} search failed:`, error);
        if (error.message.includes("Unable to connect to")) {
          setClipError(`AI search server is not available. Please ensure the server is running on port 8000.`);
        } else {
          setClipError(`${selectedModel} search unavailable - using text search instead`);
        }
        setClipResults([]);
        setLastSearchModel(null);
      } finally {
        setIsClipSearching(false);
      }
    } else {
      setClipResults([]);
      setLastSearchModel(null);
    }
  };

  const handleModelChange = (model) => {
    setSelectedModel(model);
    // Re-run search with new model if there's an active query
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
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
  }, [searchQuery, clipResults, activeFilters, products]);

  return {
    searchQuery,
    filteredProducts,
    clipResults,
    isClipSearching,
    clipError,
    activeFilters,
    selectedModel,
    lastSearchModel,
    handleSearch,
    handleFilterSelect,
    handleModelChange,
    // New properties for database products
    products,
    isLoadingProducts,
    productsError,
  };
}
