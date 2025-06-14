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
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-gray-600">Find what you're looking for</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group bg-white rounded-lg p-8 text-center hover:shadow-lg transition-all duration-300 border border-gray-100"
            >
              <div className="text-4xl mb-4">{category.icon}</div>
              <h3 className="font-medium text-gray-900 mb-2 group-hover:text-gray-600 transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-gray-500">{category.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
