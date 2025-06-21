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
    products,
    isLoadingProducts,
    productsError,
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

        {/* Loading state for products */}
        {isLoadingProducts && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products from database...</p>
          </div>
        )}

        {/* Error state for products */}
        {productsError && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">⚠️ Failed to load products from database: {productsError}</p>
            <p className="text-yellow-600 text-sm mt-2">Using fallback products. Check server connection.</p>
          </div>
        )}

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
          {filteredProducts.length > 0 && filteredProducts.length < products.length && (
            <span className="ml-2 text-gray-500">(filtered from {products.length} total)</span>
          )}
          {!isLoadingProducts && <span className="ml-2 text-green-600">📊 Database: {products.length} items</span>}
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
