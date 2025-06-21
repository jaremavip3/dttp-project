// import { ProductCard } from "@/uiLibrary";

export default function Grid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">{children}</div>;
}

export function GridItem({ product }) {
  if (!product) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="aspect-square bg-gray-100 rounded mb-4 flex items-center justify-center">
          <span className="text-gray-400">No Product</span>
        </div>
        <h3 className="font-medium text-gray-900 mb-2">Product Title</h3>
        <p className="text-gray-600">$0.00</p>
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
    <div className="relative">
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow h-full">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 rounded mb-4 flex items-center justify-center overflow-hidden">
          {enhancedProduct.image ? (
            <img
              src={enhancedProduct.image}
              alt={enhancedProduct.name || "Product"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400">No Image</span>
          )}
        </div>

        {/* Product Info */}
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{enhancedProduct.name || "Unnamed Product"}</h3>
        <p className="text-gray-600 mb-2">${enhancedProduct.price || "0.00"}</p>

        {/* Product Description */}
        {enhancedProduct.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{enhancedProduct.description}</p>
        )}
      </div>

      {/* CLIP similarity badge - overlay on top of card */}
      {product.similarityScore && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10">
          {Math.round(product.similarityScore * 100)}% match
        </div>
      )}

      {/* Tags display below card */}
      {product.tags && product.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {product.tags.slice(0, 3).map((tag, index) => (
            <span key={`${product.id}-tag-${index}`} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
          {product.tags.length > 3 && <span className="text-xs text-gray-400">+{product.tags.length - 3} more</span>}
        </div>
      )}
    </div>
  );
}
