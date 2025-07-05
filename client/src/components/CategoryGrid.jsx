"use client";

import Link from "next/link";

const categories = [
  {
    name: "Women",
    href: "/catalog?filter=women",
    description: "Explore women's fashion",
    icon: "👩",
  },
  {
    name: "Men",
    href: "/catalog?filter=men",
    description: "Discover men's styles",
    icon: "👨",
  },
  {
    name: "New Arrivals",
    href: "/catalog?filter=new",
    description: "Latest additions",
    icon: "✨",
  },
  {
    name: "Sale",
    href: "/catalog?filter=sale",
    description: "Special offers",
    icon: "🏷️",
  },
];

export default function CategoryGrid() {
  return (
    <section className="py-12 sm:py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2 sm:mb-4">Shop by Category</h2>
          <p className="text-gray-600 text-sm sm:text-base">Find what you're looking for</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group bg-white rounded-lg p-4 sm:p-6 lg:p-8 text-center hover:shadow-lg transition-all duration-300 border border-gray-100"
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 lg:mb-4">{category.icon}</div>
              <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 group-hover:text-gray-600 transition-colors text-sm sm:text-base">
                {category.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{category.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
