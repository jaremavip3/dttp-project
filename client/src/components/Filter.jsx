"use client";

import { categories, filterTags } from "@/data/products";

export default function Filter({
  selectedCategory,
  selectedTags,
  searchQuery,
  onCategoryChange,
  onTagToggle,
  onSearch,
}) {
  return (
    <div className="w-64 p-4 border-r border-gray-200">
      <h3 className="font-semibold mb-4">Filters</h3>
      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filterTags.map((tag) => (
              <label key={tag.id} className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 mr-2"
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => onTagToggle(tag.id)}
                />
                <span className="text-sm text-gray-700">{tag.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {(selectedCategory !== "all" || selectedTags.length > 0 || searchQuery) && (
          <button
            onClick={() => {
              onCategoryChange("all");
              selectedTags.forEach((tag) => onTagToggle(tag));
              if (searchQuery) onSearch("");
            }}
            className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
