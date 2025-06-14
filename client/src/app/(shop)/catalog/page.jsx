"use client";

import Header from "@/components/Header";
import Grid, { GridItem } from "@/components/Grid";
import SearchInput from "@/components/SearchInput";
import { useFilters } from "./layout";

export default function CatalogPage() {
  const { filteredProducts, searchQuery, handleSearch, isClipSearching, clipError, clipResults } = useFilters();

  return (
    <div>
      <Header title="Catalog" />
      <div className="px-4">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search for products (e.g., 'warm jacket', 'casual outfit', 'winter clothes')..."
          isLoading={isClipSearching}
          error={clipError}
        />

        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredProducts.length} products
          {searchQuery && (
            <span className="ml-2 text-blue-600">
              for "{searchQuery}"
              {clipResults.length > 0 && <span className="ml-1 text-green-600">(AI-powered results)</span>}
            </span>
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
