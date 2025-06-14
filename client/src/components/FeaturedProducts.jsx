"use client";

import Link from "next/link";
import Image from "next/image";

export default function FeaturedProducts({ products, title = "Featured Products" }) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-600">Handpicked favorites from our collection</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.slice(0, 4).map((product) => (
            <Link key={product.id} href={`/catalog/${product.id}`} className="group cursor-pointer">
              <div className="aspect-square relative mb-4 overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.isNew && (
                  <span className="absolute top-3 left-3 bg-black text-white text-xs px-2 py-1 rounded">New</span>
                )}
                {product.isOnSale && (
                  <span className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded">Sale</span>
                )}
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900 mb-2 group-hover:text-gray-600 transition-colors">
                  {product.name}
                </h3>
                <div className="flex justify-center gap-2">
                  {product.isOnSale && product.originalPrice ? (
                    <>
                      <span className="text-gray-500 line-through">${product.originalPrice}</span>
                      <span className="text-red-600 font-medium">${product.price}</span>
                    </>
                  ) : (
                    <span className="text-gray-900 font-medium">${product.price}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/catalog"
            className="inline-flex items-center text-gray-900 hover:text-gray-600 transition-colors font-medium"
          >
            View All Products
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
