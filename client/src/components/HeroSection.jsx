"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="bg-gray-50 py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-light text-gray-900 mb-6">Discover Your Style</h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Curated fashion essentials with AI-powered search. Find exactly what you're looking for.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/catalog"
            className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Shop Collection
          </Link>
          <Link
            href="/catalog"
            className="border border-gray-300 text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Try AI Search
          </Link>
        </div>
      </div>
    </section>
  );
}
