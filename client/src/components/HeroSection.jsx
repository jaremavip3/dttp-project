"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="bg-gray-50 py-12 sm:py-16 lg:py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-4 sm:mb-6 leading-tight">
          Discover Your Style
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
          Curated fashion essentials with AI-powered search. Find exactly what you're looking for.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
          <Link
            href="/catalog"
            className="bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium text-center"
          >
            Shop Collection
          </Link>
          <Link
            href="/catalog"
            className="border border-gray-300 text-gray-900 px-6 sm:px-8 py-3 sm:py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
          >
            Try AI Search
          </Link>
        </div>
      </div>
    </section>
  );
}
