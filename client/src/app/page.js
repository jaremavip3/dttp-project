"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProductService from "@/services/productService";

// Lazy load heavy components
const Features = dynamic(() => import("@/components/Features"), {
  loading: () => <LoadingSpinner size="large" text="Loading features..." />,
});
const Testimonials = dynamic(() => import("@/components/Testimonials"), {
  loading: () => <LoadingSpinner size="large" text="Loading testimonials..." />,
});
const Newsletter = dynamic(() => import("@/components/Newsletter"), {
  loading: () => <LoadingSpinner size="large" text="Loading newsletter..." />,
});

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Pre-warm the API connection
        const warmupPromise = fetch(process.env.NEXT_PUBLIC_API_URL + '/health', {
          method: 'HEAD',
        }).catch(() => {}); // Ignore errors

        // Fetch all sections in parallel with optimized error handling
        const [featuredResponse, bestSellersResponse, newArrivalsResponse] = await Promise.allSettled([
          ProductService.fetchProducts({ per_page: 8 }), // General featured products
          ProductService.fetchBestSellers(8),
          ProductService.fetchNewArrivals(8),
        ]);

        // Handle featured products
        if (featuredResponse.status === 'fulfilled') {
          const convertedFeatured = featuredResponse.value.products.map((product) =>
            ProductService.convertToClientProduct(product)
          );
          setFeaturedProducts(convertedFeatured);
        }

        // Handle best sellers
        if (bestSellersResponse.status === 'fulfilled') {
          setBestSellers(bestSellersResponse.value);
        }

        // Handle new arrivals
        if (newArrivalsResponse.status === 'fulfilled') {
          setNewArrivals(newArrivalsResponse.value);
        }

        // Wait for warmup to complete
        await warmupPromise;
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Memoize sections to prevent unnecessary re-renders
  const memoizedSections = useMemo(
    () => ({
      featured: featuredProducts,
      bestSellers: bestSellers,
      newArrivals: newArrivals,
    }),
    [featuredProducts, bestSellers, newArrivals]
  );

  return (
    <div>
      <Header title="Home" />

      {/* Hero Section */}
      <HeroSection />

      {/* Loading State */}
      {loading && (
        <LoadingSpinner size="large" text="Loading products..." />
      )}

      {/* Error State */}
      {error && (
        <div className="py-16 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-800">Failed to load products: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Product Sections */}
      {!loading && !error && (
        <>
          {/* Featured Products */}
          {featuredProducts.length > 0 && (
            <div className="py-12 sm:py-16 px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8 sm:mb-12">
                  <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2 sm:mb-4">Featured Products</h2>
                  <p className="text-gray-600 text-sm sm:text-base">Handpicked favorites from our collection</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  {featuredProducts.slice(0, 4).map((product) => (
                    <div key={product.id} className="group cursor-pointer">
                      <div className="aspect-square relative mb-3 sm:mb-4 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={product.image || product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base">${product.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category Grid */}
          <CategoryGrid />

          {/* Best Sellers */}
          {bestSellers.length > 0 && (
            <div className="py-12 sm:py-16 px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8 sm:mb-12">
                  <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2 sm:mb-4">Best Sellers</h2>
                  <p className="text-gray-600 text-sm sm:text-base">Most popular items from our collection</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  {bestSellers.slice(0, 4).map((product) => (
                    <div key={product.id} className="group cursor-pointer">
                      <div className="aspect-square relative mb-3 sm:mb-4 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={product.image || product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base">${product.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* New Arrivals */}
          {newArrivals.length > 0 && (
            <div className="py-12 sm:py-16 px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8 sm:mb-12">
                  <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2 sm:mb-4">New Arrivals</h2>
                  <p className="text-gray-600 text-sm sm:text-base">Latest additions to our collection</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  {newArrivals.slice(0, 4).map((product) => (
                    <div key={product.id} className="group cursor-pointer">
                      <div className="aspect-square relative mb-3 sm:mb-4 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={product.image || product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base">${product.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Features */}
      <Features />

      {/* Testimonials */}
      <Testimonials />

      {/* Newsletter */}
      <Newsletter />
    </div>
  );
}
