"use client";

import Header from "@/components/Header";
import Grid, { GridItem } from "@/components/Grid";
import SearchInput from "@/components/SearchInput";
import ModelSelector from "@/components/ModelSelector";
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

        {/* AI Search Loading State */}
        {isClipSearching && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              <div className="text-blue-700">
                <p className="font-medium">🤖 AI Search in Progress</p>
                <p className="text-sm text-blue-600">Searching with {selectedModel} model...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error state for products */}
        {productsError && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">⚠️ Failed to load products from database: {productsError}</p>
            <p className="text-yellow-600 text-sm mt-2">Using fallback products. Check server connection.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retry
            </button>
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

        {/* Show loading state or products, not both */}
        {isLoadingProducts ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <p className="text-gray-600 text-xl font-medium">Loading all products from database...</p>
            <p className="text-gray-500 text-sm mt-3">
              Please wait while we fetch all {products.length > 0 ? products.length : "300+"} products
            </p>
            <div className="mt-4 w-64 mx-auto bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        ) : (
          <>
            <div className={`relative ${isClipSearching ? "opacity-60 pointer-events-none" : ""}`}>
              <Grid>
                {filteredProducts.map((product) => (
                  <GridItem key={product.id} product={product} />
                ))}
              </Grid>

              {/* AI Search overlay when searching */}
              {isClipSearching && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                    <p className="text-blue-700 font-medium">Searching...</p>
                  </div>
                </div>
              )}
            </div>

            {filteredProducts.length === 0 && !isClipSearching && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
                <p className="text-gray-400 text-sm mt-2">
                  {searchQuery ? "Try a different search term or " : ""}
                  Try adjusting your filter criteria.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
