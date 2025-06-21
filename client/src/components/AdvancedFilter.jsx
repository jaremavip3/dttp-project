"use client";

import { useState } from "react";
import { filterStructure } from "@/data/products";

export default function AdvancedFilter({ onFilterSelect, activeFilters = [] }) {
  const [activeTab, setActiveTab] = useState("sale");
  const [openSections, setOpenSections] = useState({
    "women-sale": true,
    "men-sale": true,
    "women-new": true,
    "men-new": true,
    "women-featured": true,
    "women-clothing": true,
    "men-featured": true,
    "men-clothing": true,
  });

  // Safety check for SSR
  if (!filterStructure || typeof filterStructure !== "object") {
    return (
      <div className="w-80 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-hidden">
        <div className="p-4">
          <div className="text-center py-8">
            <div className="animate-pulse bg-gray-200 h-4 rounded mb-2"></div>
            <div className="animate-pulse bg-gray-200 h-4 rounded mb-2"></div>
            <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleFilterClick = (filter) => {
    onFilterSelect(filter);
  };

  const isFilterActive = (filterId) => {
    return activeFilters.some((f) => f.id === filterId);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-hidden">
      {/* Filter Navigation */}
      <div className="border-b border-gray-200 bg-white p-2">
        <div className="space-y-1">
          {filterStructure &&
            Object.entries(filterStructure).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === key
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="mr-3 text-lg">{category.icon}</span>
                {category.name}
              </button>
            ))}
        </div>
      </div>

      {/* Filter Content */}
      <div className="p-4 max-h-[calc(100vh-280px)] overflow-y-auto">
        {filterStructure && filterStructure[activeTab] && filterStructure[activeTab].sections && (
          <div className="space-y-4">
            {Object.entries(filterStructure[activeTab].sections).map(([sectionKey, section]) => (
              <div key={sectionKey} className="border border-gray-200 rounded-lg">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full px-4 py-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
                >
                  {section.name}
                  <svg
                    className={`w-5 h-5 transform transition-transform ${openSections[sectionKey] ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Section Items */}
                {openSections[sectionKey] && (
                  <div className="px-4 py-2 space-y-1">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleFilterClick(item)}
                        className={`w-full text-left px-3 py-2 text-sm rounded transition-all duration-200 ${
                          isFilterActive(item.id)
                            ? "bg-blue-100 text-blue-800 font-medium border border-blue-200 shadow-sm"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        {item.name}
                        {isFilterActive(item.id) && <span className="float-right text-blue-600">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Active Filters</h4>
            <button
              onClick={() => onFilterSelect({ type: "clear-all" })}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {activeFilters.map((filter) => (
              <span
                key={filter.id}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
              >
                {filter.name}
                <button
                  onClick={() => onFilterSelect({ ...filter, type: "remove" })}
                  className="ml-1 hover:text-blue-600 font-medium"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
