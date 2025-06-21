"use client";

import Header from "@/components/Header";
import Grid, { GridItem } from "@/components/Grid";
import SearchInput from "@/components/SearchInput";
import ModelSelector from "@/components/ModelSelector";
import { products } from "@/data/products";
import { useFilters } from "./layout";

export default function CatalogPage() {
  const {
    filteredProducts,
    searchQuery,
    handleSearch,
    isClipSearching,
    clipError,
    clipResults,
    selectedModel,
    lastSearchModel,
    handleModelChange,
  } = useFilters();

  return (
    <div>
      <Header title="Catalog" />
      <div className="px-4">
        {/* AI Model Selector */}
        <div className="max-w-4xl mx-auto mb-6">
          <ModelSelector selectedModel={selectedModel} onModelChange={handleModelChange} className="mb-4" />
        </div>

        <SearchInput
          onSearch={handleSearch}
          placeholder="Search products with AI semantic search..."
          isLoading={isClipSearching}
          error={clipError}
        />

        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredProducts.length} products
          {searchQuery && (
            <span className="ml-2 text-blue-600">
              for "{searchQuery}"
              {clipResults.length > 0 && lastSearchModel && (
                <span className="ml-1 text-green-600">(AI results from {lastSearchModel})</span>
              )}
            </span>
          )}
          {filteredProducts.length > 0 && filteredProducts.length < 10 && (
            <span className="ml-2 text-gray-500">(filtered from {products.length} total)</span>
          )}
        </div>

        <Grid>
          {filteredProducts.map((product) => (
            <GridItem key={product.id} product={product} />
          ))}
        </Grid>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchQuery ? "Try a different search term or " : ""}
              Try adjusting your filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
