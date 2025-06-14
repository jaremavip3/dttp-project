import Image from "next/image";
import Link from "next/link";

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

  return (
    <Link href={`/catalog/${product.id}`}>
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="aspect-square bg-gray-100 rounded mb-4 overflow-hidden relative">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          {/* CLIP similarity badge */}
          {product.similarityScore && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              {Math.round(product.similarityScore * 100)}% match
            </div>
          )}
        </div>
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-gray-600 font-semibold">${product.price}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {product.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
          {product.tags.length > 3 && <span className="text-xs text-gray-400">+{product.tags.length - 3} more</span>}
        </div>
      </div>
    </Link>
  );
}
