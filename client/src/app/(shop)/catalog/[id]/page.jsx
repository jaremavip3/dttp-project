import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";
import { products } from "@/data/products";
import { notFound } from "next/navigation";

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const product = products.find((p) => p.id === parseInt(resolvedParams.id));

  if (!product) {
    notFound();
  }

  // Get related products (same category, excluding current product)
  const relatedProducts = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="text-sm text-gray-600">
            <Link href="/catalog" className="hover:text-gray-900 transition-colors">
              Catalog
            </Link>
            <span className="mx-2">/</span>
            <span className="capitalize text-blue-600">{product.category}</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back to catalog */}
        <div className="mb-6">
          <Link
            href="/catalog"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Catalog
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image Section */}
          <div className="space-y-4">
            <div className="aspect-square relative bg-gray-100 rounded-xl overflow-hidden shadow-lg">
              <Image src={product.image} alt={product.name} fill className="object-cover" priority />
            </div>

            {/* Image info */}
            <div className="text-center text-sm text-gray-500">High-quality product image</div>
          </div>

          {/* Product Details Section */}
          <div className="space-y-8">
            {/* Title and Price */}
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">{product.name}</h1>
              <div className="flex items-center gap-4">
                <p className="text-3xl font-bold text-blue-600">${product.price}</p>
                <span className="text-sm text-gray-500 bg-green-50 text-green-700 px-2 py-1 rounded-full">
                  In Stock
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Description</h3>
              <p className="text-gray-600 leading-relaxed text-lg">{product.description}</p>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Category</h4>
                <Link
                  href={`/catalog?category=${product.category}`}
                  className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors capitalize"
                >
                  {product.category}
                </Link>
              </div>

              {/* Product ID */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Product ID</h4>
                <p className="text-gray-600 font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg">
                  #{product.id.toString().padStart(4, "0")}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors cursor-default"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 pt-4">
              <button className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg">
                Add to Cart
              </button>
              <button className="w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors">
                Add to Wishlist
              </button>
            </div>

            {/* Product Features */}
            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="w-8 h-8 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Quality Guaranteed</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Fast Shipping</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Easy Returns</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-16 border-t border-gray-200">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Related Products</h2>
              <p className="text-gray-600">More items from the {product.category} category</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} href={`/catalog/${relatedProduct.id}`} className="group">
                  <div className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 group-hover:border-blue-300">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
                      <Image
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-gray-600 font-semibold">${relatedProduct.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
