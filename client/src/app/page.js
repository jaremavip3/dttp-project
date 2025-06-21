"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import ProductService from "@/services/productService";

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

        // Fetch all sections in parallel
        const [
          featuredResponse,
          bestSellersResponse,
          newArrivalsResponse
        ] = await Promise.all([
          ProductService.fetchProducts({ per_page: 8 }), // General featured products
          ProductService.fetchBestSellers(8),
          ProductService.fetchNewArrivals(8)
        ]);

        // Convert featured products to client format
        const convertedFeatured = featuredResponse.products.map(product => 
          ProductService.convertToClientProduct(product)
        );

        setFeaturedProducts(convertedFeatured);
        setBestSellers(bestSellersResponse);
        setNewArrivals(newArrivalsResponse);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div>
      <Header title="Home" />

      {/* Hero Section */}
      <HeroSection />

      {/* Loading State */}
      {loading && (
        <div className="py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-900 border-t-transparent mx-auto">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
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
            <div className="py-16 px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-light text-gray-900 mb-4">Featured Products</h2>
                  <p className="text-gray-600">Handpicked favorites from our collection</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {featuredProducts.slice(0, 4).map((product) => (
                    <div key={product.id} className="group cursor-pointer">
                      <div className="aspect-square relative mb-4 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={product.image || product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-gray-600">${product.price}</p>
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
            <div className="py-16 px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-light text-gray-900 mb-4">Best Sellers</h2>
                  <p className="text-gray-600">Most popular items from our collection</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {bestSellers.slice(0, 4).map((product) => (
                    <div key={product.id} className="group cursor-pointer">
                      <div className="aspect-square relative mb-4 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={product.image || product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-gray-600">${product.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* New Arrivals */}
          {newArrivals.length > 0 && (
            <div className="py-16 px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-light text-gray-900 mb-4">New Arrivals</h2>
                  <p className="text-gray-600">Latest additions to our collection</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {newArrivals.slice(0, 4).map((product) => (
                    <div key={product.id} className="group cursor-pointer">
                      <div className="aspect-square relative mb-4 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={product.image || product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-gray-600">${product.price}</p>
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
