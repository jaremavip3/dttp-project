"use client";

import { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { filterStructure } from "@/data/products";

export default function AdvancedFilter({ onFilterSelect, activeFilters = [] }) {
  const [activeTab, setActiveTab] = useState("sale");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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

  // Corner snapping state
  const [currentCorner, setCurrentCorner] = useState("bottom-right");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragMoved, setHasDragMoved] = useState(false);
  const nodeRef = useRef(null); // For react-draggable

  // Define corner positions with proper padding
  const getCornerPosition = (corner) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 20;
    const navbarHeight = 64; // h-16 = 64px
    const bottomPadding = 100; // Extra space for mobile navigation
    const buttonSize = 56; // Button size (w-14 h-14)

    // Available height is viewport minus navbar
    const availableHeight = viewportHeight - navbarHeight;

    const positions = {
      "top-left": { x: padding, y: padding },
      "top-right": { x: viewportWidth - buttonSize - padding, y: padding },
      "bottom-left": { x: padding, y: availableHeight - buttonSize - bottomPadding },
      "bottom-right": { x: viewportWidth - buttonSize - padding, y: availableHeight - buttonSize - bottomPadding },
    };

    return positions[corner] || positions["bottom-right"];
  };

  // Find closest corner based on current position
  const findClosestCorner = (x, y) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    if (x < centerX && y < centerY) return "top-left";
    if (x >= centerX && y < centerY) return "top-right";
    if (x < centerX && y >= centerY) return "bottom-left";
    return "bottom-right";
  };

  // Initialize position and handle resize
  useEffect(() => {
    const updatePosition = () => {
      if (!isDragging) {
        const newPosition = getCornerPosition(currentCorner);
        setPosition(newPosition);
      }
    };

    // Initial position
    updatePosition();

    // Handle window resize
    const handleResize = () => {
      if (!isDragging) {
        updatePosition();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentCorner, isDragging]);

  // Handle drag start
  const handleDragStart = (e, data) => {
    setIsDragging(true);
    setHasDragMoved(false);
  };

  // Handle drag (detect if user actually moved the element)
  const handleDrag = (e, data) => {
    if (!hasDragMoved) {
      setHasDragMoved(true);
    }
  };

  // Handle drag stop with corner snapping
  const handleDragStop = (e, data) => {
    const wasDragging = hasDragMoved;

    setIsDragging(false);
    setHasDragMoved(false);

    if (wasDragging) {
      // Find closest corner and snap to it
      const closestCorner = findClosestCorner(data.x, data.y);
      setCurrentCorner(closestCorner);

      // Set position to the exact corner
      const cornerPosition = getCornerPosition(closestCorner);
      setPosition(cornerPosition);
    } else {
      // This was a click, not a drag
      setTimeout(() => {
        toggleMobileFilter();
      }, 50);
    }
  };

  // Handle click (backup for when drag doesn't work)
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const toggleMobileFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

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

  // Safety check for SSR
  if (!filterStructure || typeof filterStructure !== "object") {
    return (
      <div className="hidden lg:block w-80 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-hidden">
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

  const FilterContent = () => (
    <>
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
      <div className="p-4 max-h-[calc(100vh-280px)] lg:max-h-[calc(100vh-280px)] overflow-y-auto">
        {filterStructure && filterStructure[activeTab] && filterStructure[activeTab].sections && (
          <div className="space-y-4">
            {Object.entries(filterStructure[activeTab].sections).map(([sectionKey, section]) => (
              <div key={sectionKey} className="border border-gray-200 rounded-lg">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full px-4 py-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between touch-manipulation"
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
                        className={`w-full text-left px-3 py-2 text-sm rounded transition-all duration-200 touch-manipulation ${
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
              className="text-xs text-blue-600 hover:text-blue-800 font-medium touch-manipulation"
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
                  className="ml-1 hover:text-blue-600 font-medium touch-manipulation"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Filter Button - Draggable with Corner Snapping */}
      <div className="lg:hidden fixed top-16 left-0 right-0 bottom-0 pointer-events-none z-40">
        <Draggable
          nodeRef={nodeRef}
          position={position}
          onStart={handleDragStart}
          onDrag={handleDrag}
          onStop={handleDragStop}
          bounds="parent"
          allowAnyClick={false}
          allowMobileScroll={false}
        >
          <div
            ref={nodeRef}
            className="absolute w-14 h-14 cursor-move select-none pointer-events-auto"
            style={{
              transition: isDragging ? "none" : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <button
              onClick={handleClick}
              className={`w-full h-full bg-white border border-gray-300 rounded-full shadow-lg touch-manipulation transition-all duration-200 flex items-center justify-center ${
                isDragging ? "scale-110 shadow-xl ring-2 ring-blue-200" : "hover:shadow-xl hover:scale-105"
              }`}
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </button>

            {/* Corner indicator */}
            <div
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-300 ${
                isDragging ? "bg-blue-500" : "bg-gray-400"
              }`}
            />
          </div>
        </Draggable>
      </div>

      {/* Mobile Filter Modal Overlay */}
      {isFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={toggleMobileFilter}></div>
          <div className="absolute top-0 left-0 w-80 max-w-[80vw] h-full bg-white shadow-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={toggleMobileFilter} className="text-gray-500 hover:text-gray-700 touch-manipulation">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-full overflow-hidden">
              <FilterContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Filter Sidebar */}
      <div className="hidden lg:block w-80 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-hidden">
        <FilterContent />
      </div>
    </>
  );
}
