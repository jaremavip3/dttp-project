export default function Grid({ children }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 p-4">
      {children}
    </div>
  );
}

export function GridItem({ product }) {
  if (!product) {
    return (
      <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
        <div className="aspect-square bg-gray-100 rounded mb-3 sm:mb-4 flex items-center justify-center">
          <span className="text-gray-400 text-xs sm:text-sm">No Product</span>
        </div>
        <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Product Title</h3>
        <p className="text-gray-600 text-xs sm:text-sm">$0.00</p>
      </div>
    );
  }

  // Enhance product with similarity score display if available
  const enhancedProduct = {
    ...product,
    // Add similarity score to metadata for display
    metadata: {
      ...product.metadata,
      similarityScore: product.similarityScore,
    },
  };

  return (
    <div className="relative min-w-0">
      <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow h-full flex flex-col">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 rounded mb-3 sm:mb-4 flex items-center justify-center overflow-hidden">
          {enhancedProduct.image ? (
            <img
              src={enhancedProduct.image}
              alt={enhancedProduct.name || "Product"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400 text-xs sm:text-sm">No Image</span>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-1 sm:gap-2">
          <h3 className="font-medium text-gray-900 line-clamp-2 text-sm sm:text-base leading-tight">
            {enhancedProduct.name || "Unnamed Product"}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm font-medium">${enhancedProduct.price || "0.00"}</p>

          {/* Product Description */}
          {enhancedProduct.description && (
            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {enhancedProduct.description}
            </p>
          )}
        </div>
      </div>

      {/* CLIP similarity badge - overlay on top of card */}
      {product.similarityScore && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10">
          {Math.round(product.similarityScore * 100)}% match
        </div>
      )}
    </div>
  );
}
