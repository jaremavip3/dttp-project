"use client";

import Filter from "@/components/Filter";
import { useProductFilters } from "@/hooks/useProductFilters";
import { createContext, useContext } from "react";

const FilterContext = createContext();

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}

export default function CatalogLayout({ children }) {
  const filterData = useProductFilters();

  return (
    <FilterContext.Provider value={filterData}>
      <div className="flex">
        <Filter
          selectedCategory={filterData.selectedCategory}
          selectedTags={filterData.selectedTags}
          searchQuery={filterData.searchQuery}
          onCategoryChange={filterData.handleCategoryChange}
          onTagToggle={filterData.handleTagToggle}
          onSearch={filterData.handleSearch}
        />
        <div className="flex-1">{children}</div>
      </div>
    </FilterContext.Provider>
  );
}
