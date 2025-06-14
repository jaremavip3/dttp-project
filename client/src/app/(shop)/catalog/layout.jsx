"use client";

import AdvancedFilter from "@/components/AdvancedFilter";
import { useAdvancedProductFilters } from "@/hooks/useAdvancedProductFilters";
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
  const filterData = useAdvancedProductFilters();

  return (
    <FilterContext.Provider value={filterData}>
      <div className="flex">
        <AdvancedFilter onFilterSelect={filterData.handleFilterSelect} activeFilters={filterData.activeFilters} />
        <div className="flex-1">{children}</div>
      </div>
    </FilterContext.Provider>
  );
}
